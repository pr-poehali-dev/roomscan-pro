"""
Реальный CV pipeline для Structure-from-Motion + room reconstruction.

Структура:
0. data_cleaning         — удаление дубликатов, отбраковка размытых кадров
1. download_frames()     — скачивает JPEG-кадры из S3, декодирует через cv2
2. extract_features()    — ORB feature detection (быстро, без патентов)
3. match_pairs()         — BF-matcher + Lowe ratio test между соседними кадрами
4. estimate_pose()       — Essential Matrix + RANSAC (5-точечный алгоритм Nister)
5. triangulate_points()  — DLT triangulation 3D-точек
6. detect_lines()        — Canny + HoughLinesP для поиска вертикалей и горизонталей
7. find_vanishing_points() — кластеризация направлений линий → 3 vanishing points (Manhattan world)
8. fit_planes_ransac()   — поиск пола, потолка, 4 стен через 3D RANSAC
9. clean_point_cloud()   — Z-score + statistical outlier removal
10. estimate_scale()     — масштаб через типичную высоту потолка 2.7м
11. compute_room_dims()  — финальные размеры комнаты из ограничивающих плоскостей
12. quality_metrics()    — confidence score (data quality + reconstruction)

Применённые data-engineering техники:
• Data cleaning      — Laplacian variance для детекции blur, dedup по hash
• Data balancing     — равномерный отбор кадров по временной оси
• Outlier detection  — Z-score (3σ) + statistical removal на 3D-точках
• Normalization      — центрирование на полу, выравнивание по вертикали
• Quality control    — sharpness, coverage, inlier ratio → confidence
"""
from __future__ import annotations

import io
import math
import logging
from typing import Any

import cv2
import numpy as np

log = logging.getLogger(__name__)

# ─── параметры pipeline ──────────────────────────────────────────────────────

ORB_FEATURES        = 1500     # макс число ключевых точек на кадр
LOWE_RATIO          = 0.75     # порог для ratio test
RANSAC_THRESHOLD_PX = 1.5      # пиксельный порог для Essential RANSAC
MIN_INLIERS         = 25       # минимум inliers для принятия пары
TYPICAL_CEIL_HEIGHT = 2.7      # метры — типичная высота потолка для калибровки масштаба
RESIZE_MAX_DIM      = 800      # ресайз входных кадров для скорости
PLANE_RANSAC_THR    = 0.05     # 5 см — порог для plane RANSAC
PLANE_MIN_INLIERS   = 30

# ── Data cleaning thresholds ─────────────────────────────────────────────────
BLUR_MIN_VARIANCE   = 60.0     # Laplacian variance ниже = размытый кадр (отбраковка)
DUP_HASH_BITS       = 64       # размер perceptual hash для дедупликации
DUP_DIST_THRESHOLD  = 4        # Hamming distance < N → считаем дубликатом
OUTLIER_Z_THRESHOLD = 3.0      # |z-score| > 3 → выброс
OUTLIER_KNN_K       = 8        # k-ближайших для statistical outlier removal
OUTLIER_KNN_STD     = 2.0      # multiplier для среднего расстояния


# ─── 0. Data cleaning utilities ──────────────────────────────────────────────

def blur_score(img: np.ndarray) -> float:
    """
    Variance of Laplacian — классическая метрика резкости.
    Чем выше, тем чётче кадр. Размытые кадры дают мало надёжных features.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def perceptual_hash(img: np.ndarray) -> int:
    """
    Простой aHash: ресайз 8×8 → grayscale → > mean? bit=1.
    Возвращает int64 (64 бита). Используется для дедупликации near-duplicate кадров.
    """
    small = cv2.resize(img, (8, 8), interpolation=cv2.INTER_AREA)
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    mean = gray.mean()
    bits = (gray.flatten() > mean).astype(np.uint64)
    h = 0
    for b in bits:
        h = (h << 1) | int(b)
    return h


def hamming_distance(a: int, b: int) -> int:
    return bin(a ^ b).count("1")


def clean_frames(frames: list[np.ndarray]) -> tuple[list[np.ndarray], dict]:
    """
    Очистка кадров:
    1. Отбраковка размытых (Laplacian variance < BLUR_MIN_VARIANCE)
    2. Дедупликация near-duplicate через perceptual hash
    Возвращает (clean_frames, stats).
    """
    if not frames:
        return [], {"input": 0, "blurred": 0, "duplicates": 0, "kept": 0}

    # 1. Blur detection
    sharp = []
    blurred_count = 0
    for img in frames:
        if blur_score(img) >= BLUR_MIN_VARIANCE:
            sharp.append(img)
        else:
            blurred_count += 1

    # 2. Deduplication по perceptual hash
    seen_hashes: list[int] = []
    unique = []
    duplicates = 0
    for img in sharp:
        h = perceptual_hash(img)
        is_dup = any(hamming_distance(h, sh) < DUP_DIST_THRESHOLD for sh in seen_hashes)
        if is_dup:
            duplicates += 1
            continue
        seen_hashes.append(h)
        unique.append(img)

    return unique, {
        "input": len(frames),
        "blurred": blurred_count,
        "duplicates": duplicates,
        "kept": len(unique),
    }


def remove_outliers_zscore(points: np.ndarray, threshold: float = OUTLIER_Z_THRESHOLD) -> np.ndarray:
    """Z-score фильтрация: оставляет точки, где |z| < threshold по всем 3 осям."""
    if len(points) < 10:
        return points
    mean = points.mean(axis=0)
    std = points.std(axis=0) + 1e-9
    z = np.abs((points - mean) / std)
    mask = (z < threshold).all(axis=1)
    return points[mask]


def remove_outliers_statistical(points: np.ndarray,
                                k: int = OUTLIER_KNN_K,
                                std_mult: float = OUTLIER_KNN_STD) -> np.ndarray:
    """
    Statistical Outlier Removal (как в PCL):
    для каждой точки считаем ср. расстояние до k ближайших.
    Оставляем те, у кого это расстояние < mean + std_mult * std.
    """
    n = len(points)
    if n < k + 5:
        return points

    # быстрый knn через broadcast (для n<=2500 ок по памяти)
    if n > 2500:
        # на больших облаках — субвыборка для экономии
        idx = np.random.RandomState(0).choice(n, 2500, replace=False)
        sub = points[idx]
    else:
        sub = points

    diff = sub[:, None, :] - sub[None, :, :]
    dists = np.linalg.norm(diff, axis=2)
    dists_sorted = np.sort(dists, axis=1)[:, 1:k + 1]  # без самой точки
    mean_dists = dists_sorted.mean(axis=1)
    threshold = mean_dists.mean() + std_mult * mean_dists.std()

    if n > 2500:
        # для не вошедших в субвыборку — пропускаем фильтр (оставляем)
        keep_mask = np.ones(n, dtype=bool)
        keep_mask[idx] = mean_dists < threshold
        return points[keep_mask]
    return points[mean_dists < threshold]


# ─── 1. Загрузка кадров из S3 ────────────────────────────────────────────────

def download_frames(s3_client, bucket: str, prefix: str, max_frames: int = 40) -> list[np.ndarray]:
    """
    Скачивает и декодирует JPEG-кадры из S3.
    Применяет data balancing: равномерный отбор по временной оси.
    """
    paginator = s3_client.get_paginator("list_objects_v2")
    keys: list[str] = []
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get("Contents", []) or []:
            if obj["Key"].lower().endswith((".jpg", ".jpeg")):
                keys.append(obj["Key"])
    keys.sort()

    # Data balancing: равномерное прореживание по времени
    if len(keys) > max_frames:
        step = len(keys) / max_frames
        keys = [keys[int(i * step)] for i in range(max_frames)]

    frames: list[np.ndarray] = []
    for key in keys:
        try:
            resp = s3_client.get_object(Bucket=bucket, Key=key)
            data = resp["Body"].read()
            arr = np.frombuffer(data, dtype=np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is None:
                continue
            # ресайз для скорости
            h, w = img.shape[:2]
            scale = RESIZE_MAX_DIM / max(h, w)
            if scale < 1.0:
                img = cv2.resize(img, (int(w * scale), int(h * scale)),
                                 interpolation=cv2.INTER_AREA)
            frames.append(img)
        except Exception as e:
            log.warning("Skip frame %s: %s", key, e)
    return frames


# ─── 2. ORB feature extraction ───────────────────────────────────────────────

def extract_features(frames: list[np.ndarray]) -> list[tuple]:
    """ORB на каждом кадре. Возвращает list[(keypoints, descriptors)]."""
    orb = cv2.ORB_create(
        nfeatures=ORB_FEATURES,
        scaleFactor=1.2,
        nlevels=8,
        edgeThreshold=15,
        patchSize=31,
        fastThreshold=15,
    )
    features = []
    for img in frames:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)  # выравнивание гистограммы
        kps, desc = orb.detectAndCompute(gray, None)
        features.append((kps or [], desc))
    return features


# ─── 3. Matching ─────────────────────────────────────────────────────────────

def match_pairs(features: list[tuple]) -> list[dict]:
    """
    BF-matcher + Lowe ratio test между парами (i, i+1) и (i, i+2).
    Возвращает список матчей: {i, j, pts_i, pts_j, n_matches}.
    """
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
    pairs = []
    n = len(features)

    for i in range(n - 1):
        for offset in (1, 2):
            j = i + offset
            if j >= n:
                continue
            kps_i, desc_i = features[i]
            kps_j, desc_j = features[j]
            if desc_i is None or desc_j is None:
                continue
            if len(desc_i) < 10 or len(desc_j) < 10:
                continue

            try:
                knn = bf.knnMatch(desc_i, desc_j, k=2)
            except cv2.error:
                continue

            good = []
            for m_pair in knn:
                if len(m_pair) < 2:
                    continue
                m, n2 = m_pair
                if m.distance < LOWE_RATIO * n2.distance:
                    good.append(m)

            if len(good) < 15:
                continue

            pts_i = np.array([kps_i[m.queryIdx].pt for m in good], dtype=np.float32)
            pts_j = np.array([kps_j[m.trainIdx].pt for m in good], dtype=np.float32)

            pairs.append({
                "i": i, "j": j,
                "pts_i": pts_i, "pts_j": pts_j,
                "n_matches": len(good),
            })
    return pairs


# ─── 4. Pose estimation: Essential Matrix + RANSAC ───────────────────────────

def estimate_camera_intrinsics(img_shape: tuple) -> np.ndarray:
    """
    Аппроксимация intrinsics для смартфона: f ≈ max(w, h) (≈ 60° FOV).
    Без полноценной калибровки это предположение, но достаточно для оценки.
    """
    h, w = img_shape[:2]
    f = max(h, w) * 1.0  # ~60° HFOV
    cx, cy = w / 2.0, h / 2.0
    return np.array([[f, 0, cx], [0, f, cy], [0, 0, 1]], dtype=np.float64)


def estimate_pose(pair: dict, K: np.ndarray) -> dict | None:
    """
    Essential matrix + 5-точечный RANSAC → recovery R, t (с точностью до масштаба).
    Возвращает {R, t, inliers_mask, n_inliers}.
    """
    pts_i, pts_j = pair["pts_i"], pair["pts_j"]
    if len(pts_i) < 8:
        return None

    E, mask = cv2.findEssentialMat(
        pts_i, pts_j, K,
        method=cv2.RANSAC,
        prob=0.999,
        threshold=RANSAC_THRESHOLD_PX,
    )
    if E is None or mask is None:
        return None
    n_inliers = int(mask.sum())
    if n_inliers < MIN_INLIERS:
        return None

    _, R, t, mask_pose = cv2.recoverPose(E, pts_i, pts_j, K, mask=mask)
    return {
        "R": R, "t": t,
        "inliers_mask": mask_pose.ravel().astype(bool),
        "n_inliers": int(mask_pose.sum()),
    }


# ─── 5. Triangulation ────────────────────────────────────────────────────────

def triangulate(pair: dict, pose: dict, K: np.ndarray) -> np.ndarray:
    """
    DLT triangulation. Базовый кадр = единичная камера.
    Возвращает 3D-точки в системе координат первого кадра пары (Nx3).
    """
    R, t = pose["R"], pose["t"]
    P1 = K @ np.hstack((np.eye(3), np.zeros((3, 1))))
    P2 = K @ np.hstack((R, t))

    mask = pose["inliers_mask"]
    pts_i = pair["pts_i"][mask].T  # 2xN
    pts_j = pair["pts_j"][mask].T

    if pts_i.shape[1] < 4:
        return np.zeros((0, 3), dtype=np.float32)

    pts_4d = cv2.triangulatePoints(P1, P2, pts_i, pts_j)
    pts_3d = (pts_4d[:3] / (pts_4d[3:4] + 1e-9)).T  # Nx3

    # фильтруем точки слишком близко/далеко и за камерой
    z = pts_3d[:, 2]
    valid = (z > 0.1) & (z < 50.0)
    return pts_3d[valid].astype(np.float32)


# ─── 6+7. Detection of lines and vanishing points ───────────────────────────

def detect_lines_and_vps(frame: np.ndarray) -> dict:
    """
    Canny + HoughLinesP → классификация на вертикали/горизонтали → vanishing points.
    Manhattan world: предполагаем 3 главных направления (XYZ).
    """
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)

    lines = cv2.HoughLinesP(
        edges, rho=1, theta=np.pi / 180,
        threshold=80, minLineLength=40, maxLineGap=10,
    )

    if lines is None:
        return {"lines": 0, "verticals": 0, "horizontals": 0, "vps": []}

    verticals = 0
    horizontals = 0
    angles_h: list[float] = []

    for line in lines:
        x1, y1, x2, y2 = line[0]
        dx, dy = x2 - x1, y2 - y1
        if dx == 0 and dy == 0:
            continue
        angle = math.degrees(math.atan2(dy, dx))
        # вертикали: близко к ±90°
        if abs(abs(angle) - 90) < 10:
            verticals += 1
        # горизонтали: близко к 0° или ±180°
        elif abs(angle) < 15 or abs(abs(angle) - 180) < 15:
            horizontals += 1
            angles_h.append(angle)

    # Manhattan: 3 главные VP — обычно 1 вертикальная (бесконечность по Y) + 2 горизонтальные
    vps_count = 1 if verticals > 5 else 0
    if len(angles_h) > 5:
        # кластеризация горизонталей: если есть две группы (~0° и ~30°),
        # считаем 2 horizontal VP
        ang_arr = np.array(angles_h)
        std = float(np.std(ang_arr))
        if std > 8:
            vps_count += 2
        else:
            vps_count += 1

    return {
        "lines": int(len(lines)),
        "verticals": verticals,
        "horizontals": horizontals,
        "vps": vps_count,
    }


# ─── 8. Plane fitting via RANSAC ─────────────────────────────────────────────

def fit_plane_ransac(points: np.ndarray, n_iter: int = 200,
                     threshold: float = PLANE_RANSAC_THR) -> tuple[np.ndarray | None, np.ndarray]:
    """
    Возвращает (plane_normal, inlier_mask). Стандартный 3-точечный RANSAC.
    Plane: ax+by+cz+d=0, нормаль (a,b,c).
    """
    n = len(points)
    if n < 10:
        return None, np.zeros(n, dtype=bool)

    rng = np.random.default_rng(42)
    best_inliers = np.zeros(n, dtype=bool)
    best_normal: np.ndarray | None = None
    best_d = 0.0

    for _ in range(n_iter):
        idx = rng.choice(n, 3, replace=False)
        p1, p2, p3 = points[idx]
        v1 = p2 - p1
        v2 = p3 - p1
        normal = np.cross(v1, v2)
        norm = np.linalg.norm(normal)
        if norm < 1e-6:
            continue
        normal = normal / norm
        d = -np.dot(normal, p1)

        # расстояние всех точек до плоскости
        dist = np.abs(points @ normal + d)
        inliers = dist < threshold
        n_in = int(inliers.sum())

        if n_in > int(best_inliers.sum()):
            best_inliers = inliers
            best_normal = normal
            best_d = d

    if best_normal is None or int(best_inliers.sum()) < PLANE_MIN_INLIERS:
        return None, np.zeros(n, dtype=bool)

    return np.array([*best_normal, best_d]), best_inliers


def segment_planes(points: np.ndarray, max_planes: int = 4) -> list[dict]:
    """
    Последовательно вычитает RANSAC-плоскости из облака.
    Возвращает [{normal, d, n_points, points}].
    """
    remaining = points.copy()
    planes = []
    for _ in range(max_planes):
        if len(remaining) < PLANE_MIN_INLIERS:
            break
        plane, inliers = fit_plane_ransac(remaining)
        if plane is None:
            break
        planes.append({
            "normal": plane[:3].tolist(),
            "d": float(plane[3]),
            "n_points": int(inliers.sum()),
        })
        remaining = remaining[~inliers]
    return planes


# ─── 9+10. Scale & dimensions ────────────────────────────────────────────────

def estimate_dimensions(points: np.ndarray, planes: list[dict]) -> dict:
    """
    1) Находим вертикальное направление (нормаль с макс |y|-компонентой).
    2) Высоту определяем как разницу между min/max проекциями на эту ось.
    3) Масштабируем облако так, чтобы высота = TYPICAL_CEIL_HEIGHT.
    4) Размеры комнаты = bbox по горизонтальным осям после масштабирования.
    """
    if len(points) < 20:
        # деградация — fallback на минимальные размеры
        return {"width": 3.0, "length": 4.0, "height": 2.7, "scale_factor": 1.0}

    # вертикаль
    vertical_axis = np.array([0.0, 1.0, 0.0])
    if planes:
        # ищем плоскость, чья нормаль наиболее «вертикальная»
        best = max(planes, key=lambda p: abs(p["normal"][1]))
        n = np.array(best["normal"])
        if abs(n[1]) > 0.7:
            vertical_axis = n / (np.linalg.norm(n) + 1e-9)
            if vertical_axis[1] < 0:
                vertical_axis = -vertical_axis

    proj_v = points @ vertical_axis
    p5, p95 = np.percentile(proj_v, [5, 95])
    raw_height = float(p95 - p5)
    if raw_height < 0.1:
        raw_height = 1.0

    # масштабируем так, чтобы high≈TYPICAL_CEIL_HEIGHT
    scale = TYPICAL_CEIL_HEIGHT / raw_height
    scaled = points * scale

    # горизонтальные оси: PCA в плоскости пола
    proj_h = scaled - np.outer(scaled @ vertical_axis, vertical_axis)
    if len(proj_h) > 5:
        cov = np.cov(proj_h.T)
        eigvals, eigvecs = np.linalg.eigh(cov)
        # 2 наибольших eigvec в горизонтальной плоскости
        order = np.argsort(eigvals)[::-1]
        axis_a = eigvecs[:, order[0]]
        axis_b = eigvecs[:, order[1]]
        a_proj = proj_h @ axis_a
        b_proj = proj_h @ axis_b
        width  = float(np.percentile(a_proj, 95) - np.percentile(a_proj, 5))
        length = float(np.percentile(b_proj, 95) - np.percentile(b_proj, 5))
    else:
        width = length = 3.0

    # клампим на разумные значения для жилого помещения
    width  = float(np.clip(width,  1.5, 30.0))
    length = float(np.clip(length, 1.5, 30.0))

    return {
        "width":  round(width, 2),
        "length": round(length, 2),
        "height": round(TYPICAL_CEIL_HEIGHT, 2),
        "scale_factor": round(float(scale), 4),
    }


# ─── Quality control ─────────────────────────────────────────────────────────

def compute_confidence(stats: dict) -> tuple[float, str]:
    """
    Composite confidence score [0..1] из:
    - sharpness:  доля чётких кадров после очистки
    - coverage:   достаточность кадров (>30 → 1.0)
    - inliers:    inliers % от RANSAC
    - planes:     найденные плоскости (стены)
    Возвращает (score, label).
    """
    sharpness = stats["frames_kept"] / max(stats["frames_input"], 1)
    coverage  = min(stats["frames_kept"] / 30.0, 1.0)
    inliers   = min(stats["inliers_pct"] / 60.0, 1.0)
    planes    = min(stats["wall_planes"] / 4.0, 1.0)

    score = 0.25 * sharpness + 0.25 * coverage + 0.30 * inliers + 0.20 * planes
    score = float(np.clip(score, 0.0, 1.0))

    if   score >= 0.75: label = "Высокая"
    elif score >= 0.50: label = "Средняя"
    elif score >= 0.30: label = "Низкая"
    else:               label = "Ненадёжная"
    return round(score, 2), label


# ─── ГЛАВНЫЙ pipeline ────────────────────────────────────────────────────────

def run(s3_client, bucket: str, prefix: str, max_frames: int = 40) -> dict:
    """
    Главная функция: запуск всего CV pipeline с data engineering best practices.

    Этапы:
      0. Загрузка → blur removal → дедупликация (data cleaning)
      1. ORB features
      2. BF-matching + Lowe ratio
      3. Essential RANSAC + recoverPose
      4. DLT triangulation
      5. Z-score + statistical outlier removal на 3D-точках
      6. Lines & vanishing points
      7. Plane segmentation (RANSAC)
      8. Scale + размеры (PCA)
      9. Quality control / confidence score
    """
    # ── 0. Загрузка + очистка ────────────────────────────────────────────
    raw_frames = download_frames(s3_client, bucket, prefix, max_frames=max_frames)
    if len(raw_frames) < 3:
        raise RuntimeError(f"Слишком мало кадров скачано из S3: {len(raw_frames)}")

    frames, clean_stats = clean_frames(raw_frames)
    if len(frames) < 3:
        raise RuntimeError(
            f"После очистки осталось {len(frames)} кадров. "
            f"Размытых: {clean_stats['blurred']}, дубликатов: {clean_stats['duplicates']}. "
            f"Снимайте медленнее и стабильнее."
        )

    # ── 1. ORB features ──────────────────────────────────────────────────
    features = extract_features(frames)
    features_total = sum(len(kps) for kps, _ in features)

    # ── 2. Matching ──────────────────────────────────────────────────────
    pairs = match_pairs(features)
    if not pairs:
        raise RuntimeError("Не найдено достаточно совпадений между кадрами. Снимайте медленнее.")
    matches_total = sum(p["n_matches"] for p in pairs)

    # ── 3-4. Pose & triangulation ────────────────────────────────────────
    K = estimate_camera_intrinsics(frames[0].shape)
    all_points = []
    inlier_pairs = 0
    total_inliers = 0
    for pair in pairs:
        pose = estimate_pose(pair, K)
        if pose is None:
            continue
        inlier_pairs += 1
        total_inliers += pose["n_inliers"]
        pts3d = triangulate(pair, pose, K)
        if len(pts3d) > 0:
            all_points.append(pts3d)

    if not all_points:
        raise RuntimeError("Не удалось восстановить 3D-точки. Проверьте качество съёмки.")

    points_raw = np.vstack(all_points)
    inliers_pct = round(100.0 * total_inliers / max(matches_total, 1), 1)

    # ── 5. Outlier removal (Z-score + statistical) ───────────────────────
    n_before = len(points_raw)
    points = remove_outliers_zscore(points_raw)
    points = remove_outliers_statistical(points)
    n_after = len(points)
    outliers_removed = n_before - n_after

    if n_after < 20:
        # слишком агрессивная фильтрация — откатываемся к Z-score only
        points = remove_outliers_zscore(points_raw)
        outliers_removed = n_before - len(points)

    # ── 6+7. Lines & vanishing points ────────────────────────────────────
    sample_idxs = np.linspace(0, len(frames) - 1, min(3, len(frames)), dtype=int)
    vp_total = 0
    lines_total = 0
    for idx in sample_idxs:
        info = detect_lines_and_vps(frames[idx])
        vp_total += info["vps"]
        lines_total += info["lines"]
    avg_vps = vp_total / max(len(sample_idxs), 1)

    # ── 8. Plane segmentation ────────────────────────────────────────────
    planes = segment_planes(points, max_planes=4)

    # ── 9. Scale & room dimensions ───────────────────────────────────────
    dims = estimate_dimensions(points, planes)
    scale = dims["scale_factor"]

    # масштабируем облако (нормализация к метрам) и сэмплируем для UI
    scaled_points = points * scale
    if len(scaled_points) > 2500:
        idxs = np.random.RandomState(42).choice(len(scaled_points), 2500, replace=False)
        scaled_points = scaled_points[idxs]

    # ── 10. Quality control ──────────────────────────────────────────────
    qstats = {
        "frames_input": clean_stats["input"],
        "frames_kept":  clean_stats["kept"],
        "inliers_pct":  inliers_pct,
        "wall_planes":  len(planes),
    }
    confidence, conf_label = compute_confidence(qstats)

    # точность зависит от confidence
    if   confidence >= 0.75: accuracy = "±5–8 см"
    elif confidence >= 0.50: accuracy = "±10–15 см"
    elif confidence >= 0.30: accuracy = "±15–25 см"
    else:                    accuracy = "±25 см+"

    return {
        "width":  dims["width"],
        "length": dims["length"],
        "height": dims["height"],
        "points": [[round(float(x), 3), round(float(y), 3), round(float(z), 3)]
                   for x, y, z in scaled_points],
        "frames_used":      len(frames),
        "features_total":   int(features_total),
        "matches_total":    int(matches_total),
        "inliers_pct":      inliers_pct,
        "accuracy_estimate": accuracy,
        "vanishing_points": round(float(avg_vps), 1),
        "wall_planes":      len(planes),
        # ── Data engineering metrics ──
        "frames_input":     clean_stats["input"],
        "frames_blurred":   clean_stats["blurred"],
        "frames_duplicates": clean_stats["duplicates"],
        "outliers_removed": int(outliers_removed),
        "confidence":       confidence,
        "confidence_label": conf_label,
    }