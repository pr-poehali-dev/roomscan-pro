"""
ИИ-агент «Менеджер проекта» RoomScan AI.
Принимает историю сообщений и контекст (текущая секция, есть ли скан).
Возвращает ответ + опционально команду навигации (action).
"""
import json
import os
import urllib.request
import urllib.error


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}


SYSTEM_PROMPT = """Ты — ИИ-менеджер проекта RoomScan AI, дружелюбный и опытный помощник по дизайну интерьера и ремонту.

О сервисе RoomScan AI:
- Сканирование комнаты камерой телефона (фотограмметрия, ~30 сек, точность ±2 см)
- Планировщик 2D/3D с расстановкой мебели
- AI-стили интерьера (лофт, скандинавский, минимализм)
- Каталог мебели от партнёров
- Калькулятор сметы работ и материалов
- Экспорт в PDF, OBJ, GLB, USDZ, FBX
- Часть экосистемы АВАНГАРД (avangard-ai.ru)

Доступные секции для перехода (используй id):
- home — главная
- scan — сканирование
- usecases — сценарии использования
- planner — планировщик 2D/3D
- catalog — каталог мебели
- styles — AI-стили
- calc — калькулятор сметы
- export — экспорт
- partners — для партнёров
- help — помощь и FAQ

Правила:
1. Отвечай кратко (2–4 предложения), по-деловому, на «вы».
2. Если пользователь явно хочет что-то сделать (например «давай сосчитаем смету», «начнём сканировать») — в ответе верни JSON в конце с командой навигации в формате: [[NAVIGATE:section_id]]
3. Не выдумывай функции, которых нет в списке выше.
4. Если вопрос не связан с RoomScan / интерьером / ремонтом — мягко верни к теме.
5. Не используй эмодзи.
"""


POLZA_API_URL = "https://api.polza.ai/api/v1/chat/completions"
POLZA_MODEL = os.environ.get("POLZA_AI_MODEL", "openai/gpt-4o-mini")


def call_polza(messages: list, api_key: str) -> str:
    payload = {
        "model": POLZA_MODEL,
        "messages": [{"role": "system", "content": SYSTEM_PROMPT}] + messages,
        "temperature": 0.6,
        "max_tokens": 350,
    }
    req = urllib.request.Request(
        POLZA_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=25) as r:
        data = json.loads(r.read().decode("utf-8"))
    return data["choices"][0]["message"]["content"]


def parse_action(text: str):
    """Извлекает [[NAVIGATE:id]] из ответа."""
    import re
    m = re.search(r"\[\[NAVIGATE:([a-z_-]+)\]\]", text)
    if not m:
        return text, None
    action = m.group(1)
    cleaned = re.sub(r"\[\[NAVIGATE:[a-z_-]+\]\]", "", text).strip()
    return cleaned, action


def resp(status: int, data: dict) -> dict:
    return {"statusCode": status, "headers": CORS, "body": json.dumps(data, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    """ИИ-агент-менеджер проекта: отвечает на вопросы и предлагает переходы по приложению."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    if event.get("httpMethod") != "POST":
        return resp(405, {"error": "Method not allowed"})

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return resp(400, {"error": "Некорректный JSON"})

    messages = body.get("messages", [])
    context_section = body.get("context", {}).get("section", "")

    if not messages or not isinstance(messages, list):
        return resp(400, {"error": "Нет сообщений"})

    api_key = os.environ.get("POLZA_AI_API_KEY", "") or os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        return resp(503, {"error": "AI временно недоступен (нет ключа)"})

    # Ограничим длину
    messages = messages[-12:]
    for m in messages:
        if not isinstance(m, dict) or "role" not in m or "content" not in m:
            return resp(400, {"error": "Некорректное сообщение"})
        if len(str(m.get("content", ""))) > 2000:
            m["content"] = str(m["content"])[:2000]

    if context_section:
        messages = [
            {"role": "system", "content": f"Пользователь сейчас в секции: {context_section}"}
        ] + messages

    try:
        raw = call_polza(messages, api_key)
    except urllib.error.HTTPError as e:
        try:
            err_body = e.read().decode("utf-8")[:200]
        except Exception:
            err_body = ""
        return resp(502, {"error": f"Polza.ai HTTP {e.code}: {err_body}"})
    except Exception as e:
        return resp(502, {"error": f"Ошибка ИИ: {str(e)[:120]}"})

    text, action = parse_action(raw)
    return resp(200, {"reply": text, "action": action})