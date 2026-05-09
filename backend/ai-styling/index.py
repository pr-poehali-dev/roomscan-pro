"""
Business: AI-стилизация интерьера. Принимает фото комнаты и стиль —
возвращает изображение этой же комнаты в выбранном стиле через Replicate API
(модель FLUX Redux / SDXL ControlNet). Поддерживает 8 готовых стилей.

Args:
    event: dict с httpMethod, body (JSON: { image_url или image_base64, style })
    context: object с request_id

Returns:
    HTTP 200 + { result_url: string, style: string, latency_ms: int }
    HTTP 400 при невалидном запросе, 500 при ошибке провайдера
"""
import json
import os
import time
import urllib.request
import urllib.error
import base64
import uuid


STYLE_PROMPTS: dict[str, str] = {
    "scandi": "scandinavian interior design, light wood, white walls, pastel accents, minimalist furniture, natural light, hygge, cozy",
    "loft": "industrial loft interior, exposed brick walls, concrete floor, metal pipes, edison bulbs, leather furniture, raw textures",
    "classic": "classic luxury interior, ornate moldings, marble floors, crystal chandelier, velvet upholstery, gold accents, elegant",
    "minimal": "minimalist interior design, clean lines, monochrome palette, no clutter, functional furniture, white and grey tones",
    "modern": "modern interior design, geometric shapes, accent lighting, sleek furniture, bold colors, contemporary art",
    "japandi": "japandi interior, japanese minimalism meets scandinavian, natural wood, paper screens, low furniture, zen atmosphere",
    "glamour": "hollywood glamour interior, art deco, mirrored surfaces, velvet, brass details, dramatic lighting, opulent",
    "midcentury": "mid-century modern interior, walnut wood, mustard and teal, atomic patterns, organic shapes, 1960s style",
}

NEGATIVE_PROMPT = "blurry, low quality, distorted, ugly, bad architecture, broken furniture, deformed"


def _cors_headers() -> dict:
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
        "headers": _cors_headers(),
        "isBase64Encoded": False,
        "body": json.dumps(body, ensure_ascii=False),
    }


def _upload_base64_to_s3(base64_data: str) -> str:
    """Загружает base64-картинку в S3, возвращает публичный URL."""
    import boto3

    aws_key = os.environ["AWS_ACCESS_KEY_ID"]
    aws_secret = os.environ["AWS_SECRET_ACCESS_KEY"]

    # Очистка от data:image/...;base64,
    if "," in base64_data:
        base64_data = base64_data.split(",", 1)[1]

    binary = base64.b64decode(base64_data)
    file_id = uuid.uuid4().hex
    key = f"styling/input_{file_id}.jpg"

    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=aws_key,
        aws_secret_access_key=aws_secret,
    )
    s3.put_object(
        Bucket="files",
        Key=key,
        Body=binary,
        ContentType="image/jpeg",
    )
    return f"https://cdn.poehali.dev/projects/{aws_key}/bucket/{key}"


def _call_replicate(prompt: str, image_url: str, token: str) -> str:
    """Запускает FLUX Schnell через Replicate API. Возвращает URL результата."""
    # FLUX Schnell — быстрая модель (1-2 секунды), text-to-image
    # Для image-to-image используем SDXL img2img с ControlNet
    api_url = "https://api.replicate.com/v1/predictions"

    payload = {
        "version": "131d9e185621b4b4d349fd262e363420a6f74081d8c27966c9c5bcf120fa3985",
        "input": {
            "prompt": prompt,
            "image": image_url,
            "prompt_strength": 0.65,
            "num_outputs": 1,
            "aspect_ratio": "1:1",
            "output_format": "jpg",
            "output_quality": 85,
        },
    }

    req = urllib.request.Request(
        api_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Prefer": "wait=30",  # Replicate ждёт результат до 30 сек на той же странице
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Replicate HTTP {e.code}: {body[:200]}")

    status = result.get("status")
    if status == "succeeded":
        output = result.get("output")
        if isinstance(output, list) and output:
            return output[0]
        if isinstance(output, str):
            return output
    raise RuntimeError(f"Replicate status={status}, output={result.get('output')}")


def handler(event: dict, context) -> dict:
    """AI-стилизация фото интерьера."""
    method = event.get("httpMethod", "GET")

    if method == "OPTIONS":
        return {"statusCode": 200, "headers": _cors_headers(), "body": ""}

    if method != "POST":
        return _resp(405, {"error": "method_not_allowed"})

    # ─── Парсинг запроса ───
    try:
        body_raw = event.get("body") or "{}"
        if event.get("isBase64Encoded"):
            body_raw = base64.b64decode(body_raw).decode("utf-8")
        body = json.loads(body_raw)
    except (json.JSONDecodeError, ValueError) as e:
        return _resp(400, {"error": "invalid_json", "detail": str(e)})

    style: str = body.get("style", "scandi")
    image_url: str | None = body.get("image_url")
    image_base64: str | None = body.get("image_base64")

    if style not in STYLE_PROMPTS:
        return _resp(400, {"error": "unknown_style", "available": list(STYLE_PROMPTS.keys())})

    if not image_url and not image_base64:
        return _resp(400, {"error": "image_required", "detail": "Provide image_url or image_base64"})

    token = os.environ.get("REPLICATE_API_TOKEN", "").strip()
    if not token:
        return _resp(503, {
            "error": "ai_not_configured",
            "detail": "REPLICATE_API_TOKEN не настроен. Обратитесь к администратору.",
        })

    # ─── Если base64 — заливаем в S3 ───
    started = time.time()
    try:
        if image_base64 and not image_url:
            image_url = _upload_base64_to_s3(image_base64)
    except Exception as e:
        return _resp(500, {"error": "upload_failed", "detail": str(e)})

    # ─── Генерация ───
    prompt = STYLE_PROMPTS[style]
    try:
        result_url = _call_replicate(prompt, image_url, token)
    except Exception as e:
        return _resp(502, {"error": "ai_provider_failed", "detail": str(e)[:300]})

    latency_ms = int((time.time() - started) * 1000)

    return _resp(200, {
        "result_url": result_url,
        "style": style,
        "prompt": prompt,
        "latency_ms": latency_ms,
        "request_id": getattr(context, "request_id", "unknown"),
    })
