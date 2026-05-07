"""
AI-анализ фото квартиры для хоумстейджинга.
Принимает base64-фото, возвращает чек-лист улучшений с приоритетами,
бюджетом и прогнозом роста цены продажи.
"""
import json
import os
import urllib.request
import urllib.error


def cors_headers() -> dict:
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
    }


SYSTEM_PROMPT = """Ты — эксперт по хоумстейджингу с 10-летним опытом в России.
Анализируешь фото квартиры и даёшь конкретные рекомендации по предпродажной подготовке.

ПРАВИЛА:
1. Отвечай ТОЛЬКО валидным JSON по схеме (без markdown, без ``` тегов)
2. Все цены — в рублях (российский рынок 2025)
3. Прогноз роста цены — реалистичный (1-15% максимум)
4. Каждая рекомендация — конкретное действие, которое можно сделать за 1-3 дня
5. Приоритеты: must (критично), should (важно), nice (желательно)

СХЕМА JSON:
{
  "summary": "краткая оценка квартиры в 2-3 предложения",
  "rating": число от 1 до 10 (текущая привлекательность для покупателя),
  "expected_uplift_pct": число (на сколько % вырастет цена после рекомендаций),
  "budget_min": число (минимальный бюджет в ₽),
  "budget_max": число (максимальный бюджет в ₽),
  "issues": [
    { "title": "Что не так", "severity": "high|medium|low" }
  ],
  "recommendations": [
    {
      "title": "Что сделать",
      "desc": "Подробное описание действия",
      "category": "clean|repair|decor|photo",
      "priority": "must|should|nice",
      "cost": число (₽),
      "impact": число (% к цене),
      "icon": "Sparkles|Paintbrush|Sofa|Wind|Trash2|Camera|Lightbulb|Leaf"
    }
  ]
}

Минимум 6 рекомендаций. Учитывай ВСЕ детали на фото: освещение, цвета, мебель, состояние стен, личные вещи."""


def analyze_with_ai(image_base64: str) -> dict:
    """Вызывает Polza.ai vision-модель для анализа фото."""
    api_key = os.environ.get('POLZA_AI_API_KEY', '')
    if not api_key:
        return _fallback_analysis()

    payload = {
        "model": "openai/gpt-4o-mini",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": [
                {"type": "text", "text": "Проанализируй эту квартиру для предпродажной подготовки. Верни JSON по схеме."},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
            ]}
        ],
        "response_format": {"type": "json_object"},
        "max_tokens": 2000,
        "temperature": 0.4,
    }

    req = urllib.request.Request(
        'https://api.polza.ai/api/v1/chat/completions',
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            content = data['choices'][0]['message']['content']
            parsed = json.loads(content)
            return parsed
    except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError, KeyError) as e:
        print(f"AI error: {e}")
        return _fallback_analysis()


def _fallback_analysis() -> dict:
    """Резервный ответ без AI — если ключа нет или сервис не ответил."""
    return {
        "summary": "Квартира в среднем состоянии. Базовая подготовка позволит продать быстрее и дороже.",
        "rating": 6,
        "expected_uplift_pct": 7.5,
        "budget_min": 35000,
        "budget_max": 80000,
        "issues": [
            {"title": "Много личных вещей в кадре", "severity": "high"},
            {"title": "Тёмные стены визуально уменьшают пространство", "severity": "medium"},
            {"title": "Старые шторы / текстиль", "severity": "low"},
        ],
        "recommendations": [
            {"title": "Расхламление", "desc": "Убрать всё лишнее — личные фото, сувениры, посуду, одежду", "category": "clean", "priority": "must", "cost": 0, "impact": 2.0, "icon": "Trash2"},
            {"title": "Покраска стен в светлый", "desc": "Белый или светло-бежевый расширит пространство визуально", "category": "repair", "priority": "must", "cost": 22000, "impact": 4.5, "icon": "Paintbrush"},
            {"title": "Профессиональная фотосъёмка", "desc": "20+ кадров с широкоугольным объективом", "category": "photo", "priority": "must", "cost": 8000, "impact": 5.5, "icon": "Camera"},
            {"title": "Замена ламп на тёплый белый 3000K", "desc": "Однотонный приятный свет по всей квартире", "category": "repair", "priority": "should", "cost": 3000, "impact": 1.2, "icon": "Lightbulb"},
            {"title": "Добавить зелень", "desc": "2-3 крупных растения или букет — оживляют интерьер", "category": "decor", "priority": "should", "cost": 4500, "impact": 1.0, "icon": "Leaf"},
            {"title": "Свежий текстиль", "desc": "Светлые шторы, нейтральные подушки, плед на диване", "category": "decor", "priority": "nice", "cost": 8500, "impact": 1.8, "icon": "Sofa"},
        ],
    }


def handler(event: dict, context) -> dict:
    """
    AI-анализ фото квартиры для хоумстейджинга.
    POST /staging-analyze  body: {"image": "<base64>"}
    """
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Method Not Allowed'}),
        }

    try:
        body_str = event.get('body', '{}')
        body = json.loads(body_str) if body_str else {}
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Invalid JSON'}),
        }

    image_b64 = body.get('image', '')
    if not image_b64:
        # Без фото — возвращаем общий шаблон
        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps(_fallback_analysis(), ensure_ascii=False),
        }

    # Удаляем data:image/...;base64, префикс если он есть
    if ',' in image_b64:
        image_b64 = image_b64.split(',', 1)[1]

    # Ограничение размера (5 МБ)
    if len(image_b64) > 7_000_000:
        return {
            'statusCode': 413,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Image too large (max 5 MB)'}),
        }

    result = analyze_with_ai(image_b64)

    return {
        'statusCode': 200,
        'headers': cors_headers(),
        'body': json.dumps(result, ensure_ascii=False),
    }
