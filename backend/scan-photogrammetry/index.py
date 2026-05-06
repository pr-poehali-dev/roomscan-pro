"""
Фотограмметрия: приём кадров видео, реальный SfM + plane fitting, возврат результата.

POST ?action=start   — создать новое сканирование, вернуть scan_id
POST ?action=frame   — загрузить кадр (base64 JPEG) для scan_id
POST ?action=process — запустить реконструкцию по накопленным кадрам
GET  ?action=status  — получить статус и результат сканирования

Поддерживает 2 режима:
  • Авторизованный (X-Auth-Token заголовок) — сохранение в БД, история сканов
  • Гостевой (без токена) — эфемерный scan_id, без записи в БД,
    кадры в S3 под guest/{uuid}/. Результат возвращается одним запросом.

Реальный CV pipeline (cv_pipeline.run):
1. Загрузка кадров из S3
2. ORB feature detection
3. BF-matching пар + Lowe ratio test
4. Essential matrix + RANSAC → relative pose
5. Triangulation 3D-точек
6. Plane segmentation (RANSAC) — пол, потолок, стены
7. Hough + Canny — детекция вертикальных линий (углы комнаты)
8. Vanishing point analysis — выравнивание сцены
9. Scale estimation через типичную высоту потолка (h≈2.7м)
10. Возврат: размеры + point cloud
"""
import json
import os
import base64
import uuid
import psycopg2
import boto3

import cv_pipeline

SCHEMA = "t_p79259893_roomscan_pro"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

# Гостевой scan_id формат: "g_<uuid>" — отличается от integer ID авторизованных
GUEST_PREFIX = "g_"


def resp(status: int, data: dict) -> dict:
    return {"statusCode": status, "headers": CORS, "body": data}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user_id(token: str, cur) -> int | None:
    if not token:
        return None
    cur.execute(
        f"""SELECT u.id FROM {SCHEMA}.sessions s
            JOIN {SCHEMA}.users u ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()""",
        (token,)
    )
    row = cur.fetchone()
    return row[0] if row else None


def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def is_guest_id(scan_id) -> bool:
    return isinstance(scan_id, str) and scan_id.startswith(GUEST_PREFIX)


def handler(event: dict, context) -> dict:
    """Точка входа Cloud Function. Маршрутизация по action= параметру.

    Гостевой режим: если X-Auth-Token отсутствует, работаем без БД.
    Сканы получают id вида 'g_<uuid>', хранятся только в S3 на время обработки.
    """
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = event.get("headers") or {}
    token = headers.get("x-auth-token") or headers.get("X-Auth-Token") or ""
    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "status")

    # Определяем режим по токену
    if not token:
        # Гостевой режим — без БД
        if method == "POST" and action == "start":
            return guest_start_scan()
        elif method == "POST" and action == "frame":
            return guest_upload_frame(event)
        elif method == "POST" and action == "process":
            return guest_process_scan(event)
        elif method == "GET" and action == "status":
            return guest_get_status(event)
        return resp(400, {"error": "Неизвестное действие"})

    # Авторизованный режим — через БД
    conn = get_conn()
    cur = conn.cursor()
    user_id = get_user_id(token, cur)
    if not user_id:
        cur.close(); conn.close()
        return resp(401, {"error": "Недействительный токен"})

    if method == "POST" and action == "start":
        return start_scan(event, user_id, cur, conn)
    elif method == "POST" and action == "frame":
        return upload_frame(event, user_id, cur, conn)
    elif method == "POST" and action == "process":
        return process_scan(event, user_id, cur, conn)
    elif method == "GET" and action == "status":
        return get_status(event, user_id, cur, conn)

    cur.close(); conn.close()
    return resp(400, {"error": "Неизвестное действие"})


# ─── Гостевой режим (без БД) ────────────────────────────────────────────────

def guest_start_scan() -> dict:
    """Создаёт эфемерный scan_id для гостя. Никаких записей в БД."""
    guest_id = f"{GUEST_PREFIX}{uuid.uuid4().hex[:16]}"
    return resp(200, {
        "scan_id": guest_id,
        "guest": True,
        "message": "Гостевой режим. Прогресс не сохраняется.",
        "min_frames": 30,
        "recommended_frames": 60,
    })


def guest_upload_frame(event: dict) -> dict:
    body = json.loads(event.get("body") or "{}")
    scan_id = body.get("scan_id")
    frame_b64 = body.get("frame")
    frame_index = body.get("frame_index", 0)

    if not scan_id or not frame_b64 or not is_guest_id(scan_id):
        return resp(400, {"error": "Нужны scan_id (guest) и frame (base64)"})

    try:
        frame_data = base64.b64decode(frame_b64)
        s3 = get_s3()
        key = f"scans/guest/{scan_id}/frames/frame_{frame_index:04d}.jpg"
        s3.put_object(Bucket="files", Key=key, Body=frame_data, ContentType="image/jpeg")
    except Exception as e:
        return resp(500, {"error": f"Ошибка загрузки кадра: {str(e)}"})

    return resp(200, {
        "scan_id": scan_id,
        "frame_index": frame_index,
        "guest": True,
    })


def guest_process_scan(event: dict) -> dict:
    """Гостевой process — запускает CV pipeline и возвращает результат БЕЗ сохранения в БД."""
    body = json.loads(event.get("body") or "{}")
    scan_id = body.get("scan_id")
    if not scan_id or not is_guest_id(scan_id):
        return resp(400, {"error": "Нужен guest scan_id"})

    s3 = get_s3()
    s3_prefix = f"scans/guest/{scan_id}/frames/"

    # Проверяем, что кадры есть
    listing = s3.list_objects_v2(Bucket="files", Prefix=s3_prefix)
    frames_count = listing.get("KeyCount", 0)
    if frames_count < 10:
        return resp(400, {"error": f"Недостаточно кадров ({frames_count}). Нужно минимум 10."})

    try:
        cv_result = cv_pipeline.run(
            s3_client=s3,
            bucket="files",
            prefix=s3_prefix,
            max_frames=min(frames_count, 40),
        )
    except Exception as e:
        return resp(500, {"error": f"Ошибка обработки: {str(e)[:200]}"})

    width  = cv_result["width"]
    length = cv_result["length"]
    height = cv_result["height"]
    area   = round(width * length, 1)

    # Сохраняем point cloud как эфемерный JSON в S3 (для повторного запроса status)
    point_cloud = {
        "points": cv_result["points"],
        "width": width, "length": length, "height": height,
    }
    try:
        s3.put_object(
            Bucket="files",
            Key=f"scans/guest/{scan_id}/result.json",
            Body=json.dumps({
                "result": {
                    "area": area, "width": width, "length": length, "height": height,
                    "frames_used": cv_result["frames_used"],
                    "doors": cv_result.get("doors", 0),
                    "windows": cv_result.get("windows", 0),
                    "openings": cv_result.get("openings", []),
                },
                "point_cloud": point_cloud,
            }).encode(),
            ContentType="application/json",
        )
    except Exception:
        pass  # не критично

    return resp(200, {
        "scan_id": scan_id,
        "status": "done",
        "guest": True,
        "result": _build_result_dict(cv_result, width, length, height, area, glb_url=None),
    })


def guest_get_status(event: dict) -> dict:
    """Гостевой status — читает result.json и point cloud из S3."""
    qs = event.get("queryStringParameters") or {}
    scan_id = qs.get("scan_id")
    if not scan_id or not is_guest_id(scan_id):
        return resp(400, {"error": "Нужен guest scan_id"})

    s3 = get_s3()
    try:
        obj = s3.get_object(Bucket="files", Key=f"scans/guest/{scan_id}/result.json")
        data = json.loads(obj["Body"].read())
        return resp(200, {
            "scan": {
                "id": scan_id,
                "method": "photogrammetry",
                "status": "done",
                "result": data.get("result"),
                "point_cloud": data.get("point_cloud"),
            }
        })
    except Exception:
        return resp(404, {"error": "Сканирование не найдено"})


# ─── Авторизованный режим (с БД) ─────────────────────────────────────────────

def start_scan(event: dict, user_id: int, cur, conn) -> dict:
    body = json.loads(event.get("body") or "{}")
    project_id = body.get("project_id")

    cur.execute(
        f"""INSERT INTO {SCHEMA}.scans (user_id, project_id, method, status)
            VALUES (%s, %s, 'photogrammetry', 'processing')
            RETURNING id""",
        (user_id, project_id)
    )
    scan_id = cur.fetchone()[0]
    conn.commit(); cur.close(); conn.close()

    return resp(200, {
        "scan_id": scan_id,
        "message": "Сканирование создано. Загружайте кадры через action=frame",
        "min_frames": 30,
        "recommended_frames": 60,
    })


def upload_frame(event: dict, user_id: int, cur, conn) -> dict:
    body = json.loads(event.get("body") or "{}")
    scan_id = body.get("scan_id")
    frame_b64 = body.get("frame")
    frame_index = body.get("frame_index", 0)

    if not scan_id or not frame_b64:
        cur.close(); conn.close()
        return resp(400, {"error": "Нужны scan_id и frame (base64)"})

    cur.execute(
        f"SELECT id, frames_count FROM {SCHEMA}.scans WHERE id = %s AND user_id = %s",
        (scan_id, user_id)
    )
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return resp(404, {"error": "Сканирование не найдено"})

    frames_count = row[1]

    try:
        frame_data = base64.b64decode(frame_b64)
        s3 = get_s3()
        key = f"scans/{user_id}/{scan_id}/frames/frame_{frame_index:04d}.jpg"
        s3.put_object(
            Bucket="files",
            Key=key,
            Body=frame_data,
            ContentType="image/jpeg",
        )
    except Exception as e:
        cur.close(); conn.close()
        return resp(500, {"error": f"Ошибка загрузки кадра: {str(e)}"})

    cur.execute(
        f"UPDATE {SCHEMA}.scans SET frames_count = %s, updated_at = NOW() WHERE id = %s",
        (frames_count + 1, scan_id)
    )
    conn.commit(); cur.close(); conn.close()

    return resp(200, {
        "scan_id": scan_id,
        "frames_uploaded": frames_count + 1,
        "frame_index": frame_index,
    })


def process_scan(event: dict, user_id: int, cur, conn) -> dict:
    """
    Запускает реальный CV pipeline (см. cv_pipeline.run):
    ORB → BF-Matcher → Essential RANSAC → Triangulation →
    Plane segmentation → Hough lines → Vanishing points → Scale.
    """
    body = json.loads(event.get("body") or "{}")
    scan_id = body.get("scan_id")
    if not scan_id:
        cur.close(); conn.close()
        return resp(400, {"error": "Нужен scan_id"})

    cur.execute(
        f"""SELECT id, frames_count FROM {SCHEMA}.scans
            WHERE id = %s AND user_id = %s AND method = 'photogrammetry'""",
        (scan_id, user_id)
    )
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return resp(404, {"error": "Сканирование не найдено"})

    frames_count = row[1]
    if frames_count < 10:
        cur.close(); conn.close()
        return resp(400, {"error": f"Недостаточно кадров ({frames_count}/30). Продолжайте съёмку."})

    s3 = get_s3()
    s3_prefix = f"scans/{user_id}/{scan_id}/frames/"

    try:
        cv_result = cv_pipeline.run(
            s3_client=s3,
            bucket="files",
            prefix=s3_prefix,
            max_frames=min(frames_count, 40),
        )
    except Exception as e:
        cur.execute(
            f"UPDATE {SCHEMA}.scans SET status='error', error_message=%s WHERE id=%s",
            (f"CV pipeline error: {str(e)[:200]}", scan_id)
        )
        conn.commit(); cur.close(); conn.close()
        return resp(500, {"error": f"Ошибка обработки: {str(e)[:200]}"})

    width  = cv_result["width"]
    length = cv_result["length"]
    height = cv_result["height"]
    area   = round(width * length, 1)
    point_cloud = {
        "points": cv_result["points"],
        "width": width, "length": length, "height": height,
    }

    cdn_base = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket"
    result_url = f"{cdn_base}/scans/{user_id}/{scan_id}/result.glb"

    openings_json = json.dumps(cv_result.get("openings", []))
    cur.execute(
        f"""UPDATE {SCHEMA}.scans SET
            status = 'done',
            result_area = %s,
            result_width = %s,
            result_length = %s,
            result_height = %s,
            result_glb_url = %s,
            point_cloud_data = %s,
            doors_count = %s,
            windows_count = %s,
            openings_data = %s,
            updated_at = NOW()
        WHERE id = %s""",
        (area, width, length, height, result_url, json.dumps(point_cloud),
         cv_result.get("doors", 0), cv_result.get("windows", 0), openings_json,
         scan_id)
    )
    conn.commit(); cur.close(); conn.close()

    return resp(200, {
        "scan_id": scan_id,
        "status": "done",
        "result": _build_result_dict(cv_result, width, length, height, area, glb_url=result_url),
    })


def _build_result_dict(cv_result: dict, width: float, length: float, height: float,
                       area: float, glb_url: str | None) -> dict:
    """Единый формат результата для гостевого и авторизованного режимов."""
    return {
        "area": area,
        "width": width,
        "length": length,
        "height": height,
        "frames_used": cv_result["frames_used"],
        "features_total": cv_result["features_total"],
        "matches_total": cv_result["matches_total"],
        "inliers_pct": cv_result["inliers_pct"],
        "accuracy_estimate": cv_result["accuracy_estimate"],
        "glb_url": glb_url,
        "point_cloud_points": len(cv_result["points"]),
        "vanishing_points": cv_result["vanishing_points"],
        "wall_planes": cv_result["wall_planes"],
        "frames_input": cv_result["frames_input"],
        "frames_blurred": cv_result["frames_blurred"],
        "frames_duplicates": cv_result["frames_duplicates"],
        "outliers_removed": cv_result["outliers_removed"],
        "confidence": cv_result["confidence"],
        "confidence_label": cv_result["confidence_label"],
        "doors": cv_result.get("doors", 0),
        "windows": cv_result.get("windows", 0),
        "openings": cv_result.get("openings", []),
    }


def get_status(event: dict, user_id: int, cur, conn) -> dict:
    qs = event.get("queryStringParameters") or {}
    scan_id = qs.get("scan_id")

    if not scan_id:
        cur.execute(
            f"""SELECT id, method, status, frames_count, result_area, result_width,
                       result_length, result_height, result_glb_url, error_message,
                       TO_CHAR(created_at, 'DD Mon YYYY HH24:MI') as created
                FROM {SCHEMA}.scans WHERE user_id = %s ORDER BY created_at DESC LIMIT 10""",
            (user_id,)
        )
        rows = cur.fetchall()
        scans = [
            {
                "id": r[0], "method": r[1], "status": r[2], "frames_count": r[3],
                "result_area": float(r[4]) if r[4] else None,
                "result_width": float(r[5]) if r[5] else None,
                "result_length": float(r[6]) if r[6] else None,
                "result_height": float(r[7]) if r[7] else None,
                "glb_url": r[8], "error": r[9], "created": r[10],
            }
            for r in rows
        ]
        cur.close(); conn.close()
        return resp(200, {"scans": scans})

    cur.execute(
        f"""SELECT id, method, status, frames_count, result_area, result_width,
                   result_length, result_height, result_glb_url, point_cloud_data,
                   error_message, TO_CHAR(created_at, 'DD Mon YYYY HH24:MI') as created,
                   doors_count, windows_count, openings_data
            FROM {SCHEMA}.scans WHERE id = %s AND user_id = %s""",
        (int(scan_id), user_id)
    )
    row = cur.fetchone()
    cur.close(); conn.close()

    if not row:
        return resp(404, {"error": "Сканирование не найдено"})

    return resp(200, {
        "scan": {
            "id": row[0], "method": row[1], "status": row[2], "frames_count": row[3],
            "result_area": float(row[4]) if row[4] else None,
            "result_width": float(row[5]) if row[5] else None,
            "result_length": float(row[6]) if row[6] else None,
            "result_height": float(row[7]) if row[7] else None,
            "glb_url": row[8],
            "point_cloud": row[9],
            "error": row[10],
            "created": row[11],
            "doors": row[12],
            "windows": row[13],
            "openings": row[14],
        }
    })
