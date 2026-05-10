"""
Business: AI-детектор позы комнаты — по одной фотографии возвращает полную
         3D-планировку: габариты комнаты в см, стены, проёмы (окна/двери)
         с привязкой к стенам, мебель в мировых координатах (x,y в см от
         угла комнаты + поворот). Это последний кусок паззла для авто-3D
         из одного фото.
Args:    event с httpMethod, body (image_base64 ИЛИ image_url, hint_w_cm/hint_d_cm опц.)
         context с request_id
Returns: HTTP 200 + { room: {width_cm, depth_cm, height_cm}, walls, openings, furniture, ... }
"""
import json
import os
import time
import base64
import urllib.request
import urllib.error


def _cors() -> dict:
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        "Content-Type": "application/json",
    }


def _resp(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": _cors(),
        "isBase64Encoded": False,
        "body": json.dumps(body, ensure_ascii=False),
    }


# Типы мебели и их типичные размеры (см) — width × depth × height
FURNITURE_DIMS = {
    "sofa":      (220, 90, 85),
    "armchair":  (90, 90, 85),
    "table":     (140, 80, 75),
    "coffee_table": (100, 60, 45),
    "chair":     (45, 50, 90),
    "bed":       (200, 160, 50),
    "wardrobe":  (200, 60, 220),
    "tv":        (130, 10, 80),
    "tv_stand":  (160, 45, 50),
    "lamp":      (40, 40, 150),
    "plant":     (50, 50, 120),
    "rug":       (200, 140, 2),
    "shelf":     (80, 35, 180),
    "kitchen":   (240, 60, 90),
    "fireplace": (120, 40, 100),
    "sink":      (60, 50, 85),
    "toilet":    (40, 70, 80),
    "bathtub":   (170, 75, 60),
    "desk":      (120, 60, 75),
    "nightstand": (45, 40, 55),
}

ICON_MAP = {
    "sofa": "Sofa", "armchair": "Armchair", "table": "Square", "coffee_table": "Square",
    "chair": "Armchair", "bed": "Bed", "wardrobe": "DoorClosed", "tv": "Tv",
    "tv_stand": "Tv", "lamp": "Lamp", "plant": "TreeDeciduous", "rug": "Square",
    "shelf": "Library", "kitchen": "ChefHat", "fireplace": "Flame",
    "sink": "Droplets", "toilet": "Toilet", "bathtub": "Bath",
    "desk": "Square", "nightstand": "Square",
}

# Какие стены допустимы: 0=N (верх), 1=E (право), 2=S (низ), 3=W (лево)
WALL_NAMES = {0: "north", 1: "east", 2: "south", 3: "west"}


def _build_payload(image_url: str | None, image_b64: str | None, hint_w: int, hint_d: int) -> dict:
    system = (
        "Ты — эксперт по spatial reasoning и архитектурному анализу. "
        "По одной фотографии комнаты ты восстанавливаешь её 3D-планировку: "
        "оцениваешь габариты, расположение стен, окон, дверей и мебели. "
        "Отвечай СТРОГО в JSON без markdown."
    )

    user_text = (
        f"Восстанови планировку комнаты по фото. Подсказка размеров: ~{hint_w}×{hint_d} см "
        "(используй как ориентир, уточни если видно по перспективе).\n\n"
        "ВЕРНИ ОЦЕНКУ:\n\n"
        "1) room: габариты комнаты в см\n"
        "   - width_cm  (ширина по оси X, обычно 200-800)\n"
        "   - depth_cm  (глубина по оси Y, обычно 200-800)\n"
        "   - height_cm (высота потолка, обычно 240-320)\n"
        "   - shape: 'rect' (для прямоугольных)\n\n"
        "2) camera: где стоял фотограф\n"
        "   - position_x, position_y в см (0,0 = северо-западный угол комнаты)\n"
        "   - looking_wall: на какую стену смотрит камера (north/east/south/west)\n\n"
        "3) openings: проёмы (окна и двери)\n"
        "   - kind: 'window' | 'door'\n"
        "   - wall: 'north' | 'east' | 'south' | 'west' (на какой стене)\n"
        "   - center_along_wall_cm: расстояние центра проёма от начала стены (см)\n"
        "   - width_cm: ширина проёма (окна 80-200, двери 70-100)\n"
        "   - sill_cm: высота от пола до низа окна (для дверей = 0, окна 80-100)\n"
        "   - height_cm: высота проёма (окна 130-180, двери 200-210)\n\n"
        "4) furniture: каждый видимый предмет мебели\n"
        "   - type: один из [sofa, armchair, table, coffee_table, chair, bed, wardrobe, "
        "tv, tv_stand, lamp, plant, rug, shelf, kitchen, fireplace, sink, toilet, bathtub, desk, nightstand]\n"
        "   - label: короткое название по-русски (2-3 слова)\n"
        "   - x_cm: позиция левого края мебели по оси X (0..width_cm)\n"
        "   - y_cm: позиция верхнего края мебели по оси Y (0..depth_cm)\n"
        "   - width_cm, depth_cm: габариты в плане (вид сверху)\n"
        "   - rotation_deg: поворот 0/90/180/270 (0 = длинная сторона вдоль X)\n"
        "   - against_wall: 'north'|'east'|'south'|'west'|null — к какой стене прижата (если стоит у стены)\n"
        "   - confidence: 0..1\n\n"
        "5) room_type: living/bedroom/kitchen/bathroom/hall/office/child\n"
        "6) dominant_style: scandi/loft/classic/minimal/modern/japandi/glamour/midcentury\n\n"
        "ФОРМАТ JSON:\n"
        "{\n"
        '  "room": {"width_cm": 450, "depth_cm": 380, "height_cm": 270, "shape": "rect"},\n'
        '  "camera": {"position_x": 200, "position_y": 350, "looking_wall": "north"},\n'
        '  "openings": [\n'
        '    {"kind":"window","wall":"north","center_along_wall_cm":225,"width_cm":140,"sill_cm":85,"height_cm":140},\n'
        '    {"kind":"door","wall":"south","center_along_wall_cm":80,"width_cm":80,"sill_cm":0,"height_cm":205}\n'
        "  ],\n"
        '  "furniture": [\n'
        '    {"type":"sofa","label":"Угловой диван","x_cm":40,"y_cm":80,"width_cm":220,"depth_cm":90,"rotation_deg":0,"against_wall":"north","confidence":0.9}\n'
        "  ],\n"
        '  "room_type": "living",\n'
        '  "dominant_style": "scandi"\n'
        "}\n\n"
        "ВАЖНО:\n"
        "- Если предмет стоит у стены — координаты должны это отражать (x_cm≈0 если у западной стены и т.п.)\n"
        "- against_wall помогает фронту выровнять мебель идеально к стене\n"
        "- Не накладывай мебель друг на друга, оставляй проходы 60+ см\n"
        "- Возвращай 4-15 предметов мебели"
    )

    image_field = (
        {"type": "image_url", "image_url": {"url": image_url}}
        if image_url
        else {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}}
    )

    return {
        "model": "openai/gpt-4o",
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": [
                {"type": "text", "text": user_text},
                image_field,
            ]},
        ],
        "max_tokens": 3000,
        "temperature": 0.15,
        "response_format": {"type": "json_object"},
    }


def _call_vision(payload: dict, api_key: str) -> dict:
    api_url = "https://api.polza.ai/api/v1/chat/completions"
    req = urllib.request.Request(
        api_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Vision HTTP {e.code}: {body[:300]}")

    content = data["choices"][0]["message"]["content"]
    return json.loads(content)


def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def _normalize(parsed: dict, hint_w: int, hint_d: int) -> dict:
    """Валидация и приведение к каноническим типам."""
    room_in = parsed.get("room") or {}
    width = int(_clamp(float(room_in.get("width_cm", hint_w)), 150, 2000))
    depth = int(_clamp(float(room_in.get("depth_cm", hint_d)), 150, 2000))
    height = int(_clamp(float(room_in.get("height_cm", 270)), 200, 500))

    room = {
        "width_cm": width,
        "depth_cm": depth,
        "height_cm": height,
        "shape": "rect",
    }

    # Стены прямоугольной комнаты — авто-генерация
    walls = [
        {"id": "wall-n", "side": "north", "a": [0, 0],         "b": [width, 0],     "thickness_cm": 15},
        {"id": "wall-e", "side": "east",  "a": [width, 0],     "b": [width, depth], "thickness_cm": 15},
        {"id": "wall-s", "side": "south", "a": [width, depth], "b": [0, depth],     "thickness_cm": 15},
        {"id": "wall-w", "side": "west",  "a": [0, depth],     "b": [0, 0],         "thickness_cm": 15},
    ]
    side2id = {w["side"]: w["id"] for w in walls}
    side2len = {
        "north": width, "south": width,
        "east": depth,  "west": depth,
    }

    # Проёмы
    openings = []
    for i, op in enumerate((parsed.get("openings") or [])[:12]):
        kind = str(op.get("kind", "")).lower()
        if kind not in ("window", "door"):
            continue
        wall_side = str(op.get("wall", "")).lower()
        if wall_side not in side2id:
            continue
        wall_len = side2len[wall_side]
        w_cm = int(_clamp(float(op.get("width_cm", 90)), 50, 400))
        center = float(op.get("center_along_wall_cm", wall_len / 2))
        center = _clamp(center, w_cm / 2 + 5, wall_len - w_cm / 2 - 5)
        sill = int(_clamp(float(op.get("sill_cm", 0 if kind == "door" else 85)), 0, 200))
        h_cm = int(_clamp(
            float(op.get("height_cm", 205 if kind == "door" else 140)),
            60, 250,
        ))
        # позиция t вдоль стены (0..1) — для совместимости с фронт-форматом
        t = round(center / wall_len, 3) if wall_len > 0 else 0.5
        openings.append({
            "id": f"op-{i}",
            "kind": kind,
            "wall_id": side2id[wall_side],
            "wall_side": wall_side,
            "t": t,
            "center_cm": int(center),
            "width_cm": w_cm,
            "sill_cm": sill,
            "height_cm": h_cm,
        })

    # Мебель: каждая позиция в координатах пола комнаты
    furniture = []
    for i, f in enumerate((parsed.get("furniture") or [])[:25]):
        ftype = str(f.get("type", "")).lower().strip()
        if ftype not in FURNITURE_DIMS:
            continue
        default_dims = FURNITURE_DIMS[ftype]
        f_w = int(_clamp(float(f.get("width_cm", default_dims[0])), 20, 500))
        f_d = int(_clamp(float(f.get("depth_cm", default_dims[1])), 20, 500))
        f_h = default_dims[2]
        rot = int(f.get("rotation_deg", 0)) % 360
        if rot not in (0, 90, 180, 270):
            rot = round(rot / 90) * 90 % 360

        # Эффективные габариты после поворота
        eff_w = f_d if rot in (90, 270) else f_w
        eff_d = f_w if rot in (90, 270) else f_d

        x = float(f.get("x_cm", 0))
        y = float(f.get("y_cm", 0))
        x = _clamp(x, 0, max(0, width - eff_w))
        y = _clamp(y, 0, max(0, depth - eff_d))

        against = f.get("against_wall")
        if against not in ("north", "east", "south", "west"):
            against = None

        # Снап к стене если AI указал against_wall
        if against == "north":
            y = 0
        elif against == "south":
            y = max(0, depth - eff_d)
        elif against == "west":
            x = 0
        elif against == "east":
            x = max(0, width - eff_w)

        furniture.append({
            "id": f"furn-{i}",
            "type": ftype,
            "label": str(f.get("label", ftype)).strip()[:60],
            "x_cm": int(x),
            "y_cm": int(y),
            "width_cm": f_w,
            "depth_cm": f_d,
            "height_cm": f_h,
            "rotation_deg": rot,
            "against_wall": against,
            "icon": ICON_MAP.get(ftype, "Square"),
            "confidence": round(float(f.get("confidence", 0.7)), 2),
        })

    # Камера
    cam_in = parsed.get("camera") or {}
    camera = {
        "position_x": int(_clamp(float(cam_in.get("position_x", width / 2)), 0, width)),
        "position_y": int(_clamp(float(cam_in.get("position_y", depth - 50)), 0, depth)),
        "looking_wall": str(cam_in.get("looking_wall", "north")).lower(),
    }
    if camera["looking_wall"] not in ("north", "east", "south", "west"):
        camera["looking_wall"] = "north"

    return {
        "room": room,
        "walls": walls,
        "camera": camera,
        "openings": openings,
        "furniture": furniture,
        "room_type": str(parsed.get("room_type", "living")),
        "dominant_style": str(parsed.get("dominant_style", "modern")),
    }


def _fallback() -> dict:
    """Минимальный демо-набор когда AI не настроен."""
    width, depth = 450, 380
    walls = [
        {"id": "wall-n", "side": "north", "a": [0, 0],         "b": [width, 0],     "thickness_cm": 15},
        {"id": "wall-e", "side": "east",  "a": [width, 0],     "b": [width, depth], "thickness_cm": 15},
        {"id": "wall-s", "side": "south", "a": [width, depth], "b": [0, depth],     "thickness_cm": 15},
        {"id": "wall-w", "side": "west",  "a": [0, depth],     "b": [0, 0],         "thickness_cm": 15},
    ]
    return {
        "room": {"width_cm": width, "depth_cm": depth, "height_cm": 270, "shape": "rect"},
        "walls": walls,
        "camera": {"position_x": 225, "position_y": 350, "looking_wall": "north"},
        "openings": [
            {"id": "op-0", "kind": "window", "wall_id": "wall-n", "wall_side": "north",
             "t": 0.5, "center_cm": 225, "width_cm": 140, "sill_cm": 85, "height_cm": 140},
            {"id": "op-1", "kind": "door", "wall_id": "wall-s", "wall_side": "south",
             "t": 0.18, "center_cm": 80, "width_cm": 80, "sill_cm": 0, "height_cm": 205},
        ],
        "furniture": [
            {"id": "furn-0", "type": "sofa", "label": "Диван", "x_cm": 115, "y_cm": 0,
             "width_cm": 220, "depth_cm": 90, "height_cm": 85, "rotation_deg": 0,
             "against_wall": "north", "icon": "Sofa", "confidence": 0.0},
            {"id": "furn-1", "type": "coffee_table", "label": "Журнальный стол", "x_cm": 175,
             "y_cm": 130, "width_cm": 100, "depth_cm": 60, "height_cm": 45, "rotation_deg": 0,
             "against_wall": None, "icon": "Square", "confidence": 0.0},
            {"id": "furn-2", "type": "tv_stand", "label": "ТВ-тумба", "x_cm": 145,
             "y_cm": 330, "width_cm": 160, "depth_cm": 45, "height_cm": 50, "rotation_deg": 0,
             "against_wall": "south", "icon": "Tv", "confidence": 0.0},
        ],
        "room_type": "living",
        "dominant_style": "scandi",
        "fallback": True,
    }


def handler(event: dict, context) -> dict:
    """AI-детектор позы: восстанавливает 3D-планировку комнаты по одному фото."""
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": _cors(), "body": ""}
    if method != "POST":
        return _resp(405, {"error": "method_not_allowed"})

    body_raw = event.get("body") or ""
    if event.get("isBase64Encoded") and body_raw:
        try:
            body_raw = base64.b64decode(body_raw).decode("utf-8")
        except Exception:
            return _resp(400, {"error": "invalid_base64"})

    body_raw = body_raw.strip()
    if not body_raw or body_raw == "{}":
        return _resp(400, {"error": "image_required"})

    try:
        body = json.loads(body_raw)
    except (json.JSONDecodeError, ValueError) as e:
        return _resp(400, {"error": "invalid_json", "detail": str(e)})

    image_url = body.get("image_url")
    image_b64 = body.get("image_base64")
    if image_b64 and isinstance(image_b64, str) and image_b64.startswith("data:"):
        # вычистим префикс data:image/...;base64,
        comma = image_b64.find(",")
        if comma >= 0:
            image_b64 = image_b64[comma + 1:]

    if not image_url and not image_b64:
        return _resp(400, {"error": "image_required",
                           "detail": "Передайте image_base64 или image_url"})

    try:
        hint_w = int(body.get("hint_w_cm", 450))
        hint_d = int(body.get("hint_d_cm", 380))
    except (TypeError, ValueError):
        hint_w, hint_d = 450, 380

    api_key = os.environ.get("POLZA_API_KEY")
    started = time.time()

    if not api_key:
        result = _fallback()
        result["latency_ms"] = int((time.time() - started) * 1000)
        return _resp(200, result)

    try:
        payload = _build_payload(image_url, image_b64, hint_w, hint_d)
        parsed = _call_vision(payload, api_key)
        result = _normalize(parsed, hint_w, hint_d)
        result["latency_ms"] = int((time.time() - started) * 1000)
        result["source"] = "ai"
        return _resp(200, result)
    except Exception as e:
        result = _fallback()
        result["latency_ms"] = int((time.time() - started) * 1000)
        result["source"] = "fallback"
        result["error"] = str(e)[:200]
        return _resp(200, result)
