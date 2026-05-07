"""
Business: AI-автопоиск партнёров (дизайнеры, строители, магазины элементов интерьера).
         Использует LLM для генерации списка релевантных компаний по городу/категории,
         сохраняет их в БД с AI-скорингом и саммари.
Args:    event с httpMethod, body {action: search|list|update, ...}
         context с request_id, function_name
Returns: HTTP-ответ JSON {items|item|created}
"""
import json
import os
import urllib.request
import urllib.error
from typing import Any

import psycopg2
from psycopg2.extras import RealDictCursor


def _conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _resp(status: int, body: Any) -> dict:
    return {
        'statusCode': status,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-Admin-Token',
            'Content-Type': 'application/json',
        },
        'body': json.dumps(body, ensure_ascii=False, default=str),
        'isBase64Encoded': False,
    }


def _esc(s: Any) -> str:
    if s is None:
        return 'NULL'
    if isinstance(s, bool):
        return 'TRUE' if s else 'FALSE'
    if isinstance(s, (int, float)):
        return str(s)
    return "'" + str(s).replace("'", "''") + "'"


CATEGORY_NAMES = {
    'designer':  'студия дизайна интерьера',
    'builder':   'строительная / ремонтная компания',
    'furniture': 'магазин мебели',
    'decor':     'магазин элементов интерьера и декора',
    'kitchen':   'магазин кухонь',
    'tile':      'магазин плитки и сантехники',
}

SYSTEM_PROMPT = """Ты — отдел маркетинга RoomScan AI. Тебе нужно найти потенциальных партнёров (компании) для партнёрской программы.
Для каждой компании дай реалистичные данные. ВАЖНО: возвращай ТОЛЬКО JSON, без markdown, без ``` блоков."""


def search_with_ai(category: str, city: str, count: int = 8) -> list[dict]:
    """Запрос к LLM на генерацию списка потенциальных партнёров."""
    api_key = os.environ.get('POLZA_AI_API_KEY', '')
    cat_name = CATEGORY_NAMES.get(category, category)

    user_text = (
        f"Сгенерируй список из {count} реальных или максимально правдоподобных компаний — "
        f"{cat_name} — в городе {city or 'Москва'}. "
        "Верни JSON-массив объектов со схемой:\n"
        '[{\n'
        '  "name": "название компании",\n'
        '  "website": "https://example.ru или пустая строка если не знаешь",\n'
        '  "city": "город",\n'
        '  "description": "краткое описание (1 предложение, до 100 символов)",\n'
        '  "ai_score": число от 1 до 100 (релевантность для интеграции с RoomScan AI),\n'
        '  "ai_summary": "почему стоит интегрироваться (2 предложения, до 200 символов)",\n'
        '  "tags": "тег1,тег2,тег3"\n'
        '}]\n'
        "ВЕРНИ ТОЛЬКО МАССИВ JSON. Никакого текста до или после."
    )

    if not api_key:
        return _fallback_partners(category, city, count)

    payload = {
        'model': 'openai/gpt-4o-mini',
        'messages': [
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user', 'content': user_text},
        ],
        'max_tokens': 2000,
        'temperature': 0.7,
    }
    req = urllib.request.Request(
        'https://api.polza.ai/api/v1/chat/completions',
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )

    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        content = data['choices'][0]['message']['content'].strip()
        # Убираем возможные markdown-обёртки
        if content.startswith('```'):
            content = content.split('```', 2)[1]
            if content.startswith('json'):
                content = content[4:]
        # Если LLM вернул объект {items: [...]}, разворачиваем
        parsed = json.loads(content)
        if isinstance(parsed, dict):
            for k in ('items', 'companies', 'data', 'results'):
                if isinstance(parsed.get(k), list):
                    parsed = parsed[k]
                    break
        return parsed if isinstance(parsed, list) else _fallback_partners(category, city, count)
    except (urllib.error.HTTPError, urllib.error.URLError, json.JSONDecodeError, KeyError):
        return _fallback_partners(category, city, count)


def _fallback_partners(category: str, city: str, count: int) -> list[dict]:
    """Минимальный fallback, если LLM недоступна."""
    cat_name = CATEGORY_NAMES.get(category, category)
    base = []
    for i in range(min(count, 5)):
        base.append({
            'name': f'{cat_name.title()} #{i+1} ({city or "Москва"})',
            'website': '',
            'city': city or 'Москва',
            'description': f'Кандидат на партнёрскую интеграцию ({cat_name})',
            'ai_score': 50,
            'ai_summary': 'Базовый кандидат. Уточните данные вручную или повторите запрос.',
            'tags': category,
        })
    return base


def save_partners(items: list[dict], category: str) -> int:
    saved = 0
    with _conn() as c, c.cursor() as cur:
        for it in items:
            name = it.get('name', '').strip()
            if not name:
                continue
            website = it.get('website', '')
            city = it.get('city', '')
            description = it.get('description', '')
            ai_score = int(it.get('ai_score') or 50)
            ai_summary = it.get('ai_summary', '')
            tags = it.get('tags', '')
            sql = f"""
                INSERT INTO partners (name, category, city, website, description,
                                      ai_score, ai_summary, tags, source, status)
                VALUES ({_esc(name)}, {_esc(category)}, {_esc(city)}, {_esc(website)},
                        {_esc(description)}, {ai_score}, {_esc(ai_summary)},
                        {_esc(tags)}, 'ai_search', 'discovered')
                ON CONFLICT DO NOTHING
            """
            try:
                cur.execute(sql)
                saved += cur.rowcount
            except Exception:
                continue
        c.commit()
    return saved


def list_partners(qp: dict) -> dict:
    where = []
    cat = (qp or {}).get('category')
    if cat:
        where.append(f"category = {_esc(cat)}")
    status = (qp or {}).get('status')
    if status:
        where.append(f"status = {_esc(status)}")
    city = (qp or {}).get('city')
    if city:
        where.append(f"city ILIKE {_esc(f'%{city}%')}")
    where_sql = (' WHERE ' + ' AND '.join(where)) if where else ''
    sql = f"""
        SELECT id, name, category, city, website, email, phone, contact_person,
               description, rating, status, source, ai_score, ai_summary, tags,
               last_contact_at, created_at
        FROM partners {where_sql}
        ORDER BY ai_score DESC, created_at DESC LIMIT 200
    """
    with _conn() as c, c.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql)
        return {'items': cur.fetchall()}


def update_partner(pid: int, body: dict) -> dict:
    fields = []
    for k in ('name', 'category', 'city', 'website', 'email', 'phone',
              'contact_person', 'description', 'status', 'tags', 'ai_summary'):
        if k in body:
            fields.append(f"{k} = {_esc(body[k])}")
    if 'rating' in body:
        fields.append(f"rating = {float(body['rating'] or 0)}")
    if 'ai_score' in body:
        fields.append(f"ai_score = {int(body['ai_score'] or 0)}")
    if not fields:
        return {'error': 'no fields'}
    fields.append('updated_at = NOW()')
    sql = f"UPDATE partners SET {', '.join(fields)} WHERE id = {int(pid)} RETURNING *"
    with _conn() as c, c.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql)
        row = cur.fetchone()
        c.commit()
        return {'item': row}


def _is_admin(event: dict) -> bool:
    """HMAC-проверка токена админа (выдаётся admin-auth по логину/паролю)."""
    import hmac
    import hashlib
    import time as _time
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = headers.get('x-admin-token') or headers.get('x-auth-token') or ''
    pwd = os.environ.get('ADMIN_PASSWORD', '')
    if not pwd:
        return True
    if not token:
        return False
    salt = os.environ.get('DATABASE_URL', 'roomscan-salt')[:32]
    secret = hashlib.sha256((pwd + salt).encode('utf-8')).digest()
    try:
        parts = token.split('|')
        if len(parts) != 3:
            return False
        login, expiry_str, sig = parts
        expiry = int(expiry_str)
        if _time.time() > expiry:
            return False
        expected = hmac.new(secret, f"{login}|{expiry}".encode('utf-8'), hashlib.sha256).hexdigest()[:32]
        admin_login = os.environ.get('ADMIN_LOGIN', '')
        if admin_login and login != admin_login:
            return False
        return hmac.compare_digest(sig, expected)
    except (ValueError, AttributeError):
        return False


def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return _resp(200, {})
    if not _is_admin(event):
        return _resp(403, {'error': 'Forbidden'})

    qp = event.get('queryStringParameters') or {}
    try:
        body = json.loads(event.get('body') or '{}') if event.get('body') else {}
    except json.JSONDecodeError:
        return _resp(400, {'error': 'Invalid JSON'})

    action = (body.get('action') or qp.get('action') or '').lower()
    raw_id = qp.get('id')
    item_id = int(raw_id) if raw_id and str(raw_id).isdigit() else None

    try:
        if method == 'GET':
            return _resp(200, list_partners(qp))

        if method == 'POST':
            if action == 'search':
                category = body.get('category', 'designer')
                city = body.get('city', 'Москва')
                count = min(int(body.get('count') or 8), 15)
                items = search_with_ai(category, city, count)
                saved = save_partners(items, category)
                # лог
                try:
                    with _conn() as c, c.cursor() as cur:
                        cur.execute(
                            f"INSERT INTO ai_logs (agent, action, input_text, output_text, status) "
                            f"VALUES ('partners-finder', 'search', "
                            f"{_esc(f'{category}/{city}/{count}')}, "
                            f"{_esc(f'found={len(items)} saved={saved}')}, 'success')"
                        )
                        c.commit()
                except Exception:
                    pass
                return _resp(200, {'found': len(items), 'saved': saved, 'preview': items[:3]})

        if method in ('PUT', 'PATCH') and item_id:
            return _resp(200, update_partner(item_id, body))

        return _resp(404, {'error': 'Not found'})
    except Exception as e:
        return _resp(500, {'error': 'Server error', 'detail': str(e)[:200]})