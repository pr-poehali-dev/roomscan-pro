"""
Business: AI-анализ фотографии квартиры для хоумстейджинга.
         Принимает base64-изображение, возвращает чек-лист улучшений
         и оценку текущего состояния через мультимодальную LLM.
Args:    event с httpMethod, body (image_base64, area, goal)
         context с request_id, function_name
Returns: HTTP-ответ с JSON: { score, summary, issues[], recommendations[] }
"""
import json
import os
import urllib.request
import urllib.error


def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    if method != 'POST':
        return _resp(405, {'error': 'Method not allowed'})

    try:
        body = json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        return _resp(400, {'error': 'Invalid JSON'})

    image_b64: str = body.get('image_base64', '')
    area: float = float(body.get('area') or 35)
    goal: str = body.get('goal', 'fast_sale')

    if not image_b64:
        return _resp(400, {'error': 'image_base64 is required'})

    # Уберём префикс data:image/...;base64, если есть
    if image_b64.startswith('data:'):
        image_b64 = image_b64.split(',', 1)[-1]

    api_key = os.environ.get('POLZA_AI_API_KEY')
    if not api_key:
        # Fallback: возвращаем заглушку без AI
        return _resp(200, _fallback_analysis(area, goal))

    goal_label = {
        'rent': 'сдать в аренду',
        'fast_sale': 'продать быстро',
        'max_price': 'продать максимально дорого',
    }.get(goal, 'продать')

    system_prompt = (
        "Ты — эксперт по хоумстейджингу с 10-летним опытом. "
        "Твоя задача — оценить фото квартиры и дать конкретный план подготовки к продаже/аренде. "
        "Отвечай СТРОГО в JSON формате без markdown."
    )

    user_text = (
        f"Проанализируй фото комнаты площадью ~{area} м². "
        f"Цель собственника: {goal_label}. "
        "Верни JSON со структурой:\n"
        "{\n"
        '  "score": число от 1 до 10 (текущая готовность к продаже),\n'
        '  "summary": "краткая оценка в 1-2 предложениях",\n'
        '  "issues": [{"title": "что не так", "severity": "high|medium|low", "icon": "AlertTriangle|EyeOff|Trash2"}],\n'
        '  "recommendations": [{"title": "что сделать", "cost": число в рублях, "impact": "+X% к цене", "priority": "must|should|nice", "icon": "Paintbrush|Sparkles|Trash2|Sofa|Lightbulb"}]\n'
        '}\n'
        "Дай 3-5 issues и 4-7 recommendations. Цены реалистичные для России 2025г."
    )

    payload = {
        'model': 'openai/gpt-4o-mini',
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {
                'role': 'user',
                'content': [
                    {'type': 'text', 'text': user_text},
                    {
                        'type': 'image_url',
                        'image_url': {'url': f'data:image/jpeg;base64,{image_b64}'},
                    },
                ],
            },
        ],
        'max_tokens': 1500,
        'temperature': 0.4,
        'response_format': {'type': 'json_object'},
    }

    try:
        req = urllib.request.Request(
            'https://api.polza.ai/api/v1/chat/completions',
            data=json.dumps(payload).encode('utf-8'),
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            method='POST',
        )
        with urllib.request.urlopen(req, timeout=45) as resp:
            ai_data = json.loads(resp.read().decode('utf-8'))

        content = ai_data['choices'][0]['message']['content']
        parsed = json.loads(content)
        # На всякий случай мерджим с дефолтами
        result = {
            'score': int(parsed.get('score', 5)),
            'summary': parsed.get('summary', 'Квартира требует базовой подготовки'),
            'issues': parsed.get('issues', []),
            'recommendations': parsed.get('recommendations', []),
            'source': 'ai',
        }
        return _resp(200, result)
    except urllib.error.HTTPError as e:
        return _resp(200, _fallback_analysis(area, goal, error=f'AI service: HTTP {e.code}'))
    except Exception as e:
        return _resp(200, _fallback_analysis(area, goal, error=str(e)[:120]))


def _fallback_analysis(area: float, goal: str, error: str = '') -> dict:
    """Фолбэк-анализ, если AI недоступен — общие рекомендации по площади."""
    base_cost = max(1.0, area / 35)
    return {
        'score': 6,
        'summary': 'Базовый чек-лист подготовки. Загрузите чёткое фото для персонального анализа.',
        'issues': [
            {'title': 'Личные вещи в кадре', 'severity': 'high', 'icon': 'EyeOff'},
            {'title': 'Несвежие стены', 'severity': 'medium', 'icon': 'Paintbrush'},
            {'title': 'Перегруженный декор', 'severity': 'medium', 'icon': 'Trash2'},
        ],
        'recommendations': [
            {'title': 'Расхламление и обезличивание', 'cost': int(2000 * base_cost), 'impact': '+2%', 'priority': 'must', 'icon': 'Trash2'},
            {'title': 'Покраска стен в светлый', 'cost': int(18000 * base_cost), 'impact': '+4.5%', 'priority': 'should', 'icon': 'Paintbrush'},
            {'title': 'Замена ламп на тёплый белый 3000K', 'cost': int(2800 * base_cost), 'impact': '+1.2%', 'priority': 'should', 'icon': 'Lightbulb'},
            {'title': 'Профессиональная фотосъёмка', 'cost': 8000, 'impact': '+5.5%', 'priority': 'must', 'icon': 'Camera'},
            {'title': 'Текстиль и декор в нейтральных тонах', 'cost': int(8000 * base_cost), 'impact': '+2.5%', 'priority': 'nice', 'icon': 'Sofa'},
        ],
        'source': 'fallback',
        **({'_note': error} if error else {}),
    }


def _resp(status: int, body: dict) -> dict:
    return {
        'statusCode': status,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
        },
        'body': json.dumps(body, ensure_ascii=False),
        'isBase64Encoded': False,
    }
