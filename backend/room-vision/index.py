"""
Business: AI-детекция объектов в комнате по фото. Принимает фото комнаты,
         возвращает список найденных объектов (мебель, проёмы, окна) с
         нормализованными bbox-координатами 0..1 — для авто-импорта в Планировщик.
Args:    event с httpMethod, body (image_base64 ИЛИ image_url, area_m2 опц.)
         context с request_id
Returns: HTTP 200 + { objects: [...], room_type, dominant_style, latency_ms }
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


# Каноничный список типов объектов, который понимает Планировщик.
# Маппится 1:1 на иконки lucide и категории каталога.
ALLOWED_TYPES = {
    "sofa", "armchair", "table", "chair", "bed", "wardrobe",
    "tv", "lamp", "plant", "rug", "shelf", "kitchen",
    "door", "window", "fireplace", "sink", "toilet", "bathtub",
}

ICON_MAP = {
    "sofa": "Sofa",
    "armchair": "Armchair",
    "table": "Square",
    "chair": "Armchair",
    "bed": "Bed",
    "wardrobe": "DoorClosed",
    "tv": "Tv",
    "lamp": "Lamp",
    "plant": "TreeDeciduous",
    "rug": "Square",
    "shelf": "Library",
    "kitchen": "ChefHat",
    "door": "DoorOpen",
    "window": "AppWindow",
    "fireplace": "Flame",
    "sink": "Droplets",
    "toilet": "Toilet",
    "bathtub": "Bath",
}

# Ориентировочные размеры в см (для авто-перевода в план)
DEFAULT_DIMENSIONS_CM = {
    "sofa":      (220, 90, 85),
    "armchair":  (90, 90, 85),
    "table":     (140, 80, 75),
    "chair":     (45, 50, 90),
    "bed":       (200, 160, 50),
    "wardrobe":  (200, 60, 220),
    "tv":        (130, 10, 80),
    "lamp":      (40, 40, 150),
    "plant":     (50, 50, 120),
    "rug":       (200, 140, 2),
    "shelf":     (80, 35, 180),
    "kitchen":   (240, 60, 90),
    "door":      (80, 5, 200),
    "window":    (140, 10, 140),
    "fireplace": (120, 40, 100),
    "sink":      (60, 50, 85),
    "toilet":    (40, 70, 80),
    "bathtub":   (170, 75, 60),
}


def _build_payload(image_url: str | None, image_b64: str | None, area_m2: float) -> dict:
    """Строит payload для OpenAI-совместимого Vision API."""
    system = (
        "Ты — эксперт по компьютерному зрению, специализируешься на "
        "распознавании предметов интерьера. Отвечай СТРОГО в JSON без markdown."
    )

    user_text = (
        f"Проанализируй фото комнаты (~{area_m2:.0f} м²). "
        "Найди ВСЕ предметы мебели, окна и двери. Для каждого верни:\n"
        "- type: один из [sofa, armchair, table, chair, bed, wardrobe, tv, lamp, "
        "plant, rug, shelf, kitchen, door, window, fireplace, sink, toilet, bathtub]\n"
        "- label: короткое название по-русски (2-3 слова)\n"
        "- bbox: координаты [x, y, w, h] в долях изображения 0..1 "
        "(x,y = верх-лев угол, w,h = ширина и высота)\n"
        "- confidence: уверенность 0..1\n"
        "Также определи room_type (living, bedroom, kitchen, bathroom, hall, office, child) "
        "и dominant_style (scandi, loft, classic, minimal, modern, japandi, glamour, midcentury).\n"
        "Формат ответа:\n"
        "{\n"
        '  "objects": [{"type":"sofa","label":"Угловой диван","bbox":[0.1,0.5,0.4,0.3],"confidence":0.9}],\n'
        '  "room_type": "living",\n'
        '  "dominant_style": "modern"\n'
        "}\n"
        "Возвращай 5-15 объектов. Не выдумывай — только что реально видно."
    )

    image_field = (
        {"type": "image_url", "image_url": {"url": image_url}}
        if image_url
        else {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}}
    )

    return {
        "model": "openai/gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": [
                {"type": "text", "text": user_text},
                image_field,
            ]},
        ],
        "max_tokens": 2000,
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }


def _call_vision(payload: dict, api_key: str) -> dict:
    """Вызов OpenAI-совместимого API через Polza.ai. Возвращает распарсенный JSON-ответ модели."""
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
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Vision HTTP {e.code}: {body[:300]}")

    content = data["choices"][0]["message"]["content"]
    return json.loads(content)


def _normalize(parsed: dict) -> dict:
    """Чистит / валидирует объекты, добавляет иконки и размеры."""
    objects = []
    for obj in (parsed.get("objects") or [])[:20]:
        t = str(obj.get("type", "")).lower().strip()
        if t not in ALLOWED_TYPES:
            continue
        bbox = obj.get("bbox") or [0, 0, 0, 0]
        try:
            x, y, w, h = (float(v) for v in bbox)
        except (TypeError, ValueError):
            continue
        # клампим в 0..1
        x = max(0.0, min(1.0, x))
        y = max(0.0, min(1.0, y))
        w = max(0.01, min(1.0 - x, w))
        h = max(0.01, min(1.0 - y, h))

        dims = DEFAULT_DIMENSIONS_CM.get(t, (100, 60, 80))
        objects.append({
            "type": t,
            "label": str(obj.get("label", t)).strip()[:60],
            "bbox": [round(x, 3), round(y, 3), round(w, 3), round(h, 3)],
            "confidence": round(float(obj.get("confidence", 0.7)), 2),
            "icon": ICON_MAP.get(t, "Square"),
            "default_w_cm": dims[0],
            "default_d_cm": dims[1],
            "default_h_cm": dims[2],
        })

    return {
        "objects": objects,
        "room_type": str(parsed.get("room_type", "living")),
        "dominant_style": str(parsed.get("dominant_style", "modern")),
    }


def _fallback() -> dict:
    """Минимальный набор когда AI не настроен."""
    return {
        "objects": [
            {"type": "sofa", "label": "Диван", "bbox": [0.1, 0.5, 0.4, 0.3],
             "confidence": 0.0, "icon": "Sofa", "default_w_cm": 220,
             "default_d_cm": 90, "default_h_cm": 85},
            {"type": "table", "label": "Журнальный стол", "bbox": [0.4, 0.6, 0.2, 0.15],
             "confidence": 0.0, "icon": "Square", "default_w_cm": 140,
             "default_d_cm": 80, "default_h_cm": 75},
            {"type": "window", "label": "Окно", "bbox": [0.65, 0.2, 0.25, 0.4],
             "confidence": 0.0, "icon": "AppWindow", "default_w_cm": 140,
             "default_d_cm": 10, "default_h_cm": 140},
        ],
        "room_type": "living",
        "dominant_style": "modern",
        "fallback": True,
    }


def handler(event: dict, context) -> dict:
    """AI-детекция объектов на фото комнаты."""
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
    if not image_url and not image_b64:
        return _resp(400, {"error": "image_required"})

    if image_b64 and image_b64.startswith("data:"):
        image_b64 = image_b64.split(",", 1)[-1]

    try:
        area = float(body.get("area_m2") or 25)
    except (TypeError, ValueError):
        area = 25.0

    api_key = os.environ.get("POLZA_AI_API_KEY", "").strip()
    if not api_key:
        # Без ключа возвращаем заглушку, но 200 — чтобы UI работал
        result = _fallback()
        result["latency_ms"] = 0
        result["request_id"] = getattr(context, "request_id", "unknown")
        return _resp(200, result)

    started = time.time()
    try:
        payload = _build_payload(image_url, image_b64, area)
        parsed = _call_vision(payload, api_key)
        result = _normalize(parsed)
    except Exception as e:
        return _resp(502, {"error": "vision_failed", "detail": str(e)[:300]})

    result["latency_ms"] = int((time.time() - started) * 1000)
    result["request_id"] = getattr(context, "request_id", "unknown")
    return _resp(200, result)