"""
Business: ИИ-агент отдела продаж. Генерирует письма партнёрам, скрипты переговоров,
         следующие шаги по лиду, ответы на возражения.
Args:    event с httpMethod, body {action: outreach|reply|next_step|qualify, ...}
         context с request_id, function_name
Returns: HTTP-ответ JSON {result, tokens_used}
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
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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


SYSTEM_BASE = """Ты — опытный руководитель отдела продаж сервиса RoomScan AI (продукт ООО МАТ-Лабс).
RoomScan AI — это сервис 3D-сканирования квартир, AI-планировщик, расчёт сметы ремонта и хоумстейджинг.
Ты пишешь профессиональные, тёплые, не-спамные тексты. Без воды и шаблонов.
Без превосходных степеней («лучший», «уникальный») — соблюдай ФЗ-38."""


PROMPTS = {
    'outreach': """Напиши первое письмо потенциальному партнёру.
Партнёр: {name} (категория: {category}, город: {city}). Описание: {description}.
Цель письма: предложить интеграцию (взаимная выгода — наш трафик их каталогу мебели/услуг).
Длина: 6–10 строк. Тема письма — отдельной строкой в начале.
Формат ответа:
ТЕМА: <тема>
---
<текст письма>""",

    'reply': """Партнёр прислал сообщение: «{message}»
Контекст: партнёр {name} (категория {category}, город {city}).
Напиши вежливый, конкретный ответ. Если есть возражение — отработай его. 5–8 строк.""",

    'next_step': """Лид: {name} (компания {company}, статус {status}).
Заметки: {notes}.
Последний контакт: {last_contact}.
Сформируй 3 следующих шага в работе с этим лидом — с конкретными действиями и сроками.
Формат ответа: JSON-массив объектов {{"title": "...", "due_in_days": число, "kind": "call|email|meeting|task"}}.
Только JSON, никакого markdown.""",

    'qualify': """Оцени качество лида и его потенциал для сделки.
Данные: имя={name}, компания={company}, источник={source}, бюджет={budget}, заметки={notes}.
Верни JSON: {{"score": 0-100, "tier": "hot|warm|cold", "reason": "...", "expected_amount": число в рублях}}.
Только JSON."""
}


def call_llm(system: str, user: str, max_tokens: int = 700) -> tuple[str, int]:
    api_key = os.environ.get('POLZA_AI_API_KEY', '')
    if not api_key:
        return ('AI временно недоступен. Заполните POLZA_AI_API_KEY в секретах.', 0)

    payload = {
        'model': 'openai/gpt-4o-mini',
        'messages': [
            {'role': 'system', 'content': system},
            {'role': 'user', 'content': user},
        ],
        'max_tokens': max_tokens,
        'temperature': 0.6,
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
        content = data['choices'][0]['message']['content']
        tokens = int((data.get('usage') or {}).get('total_tokens') or 0)
        return (content, tokens)
    except (urllib.error.HTTPError, urllib.error.URLError, json.JSONDecodeError, KeyError) as e:
        return (f'AI ошибка: {str(e)[:120]}', 0)


def log_ai(agent: str, action: str, inp: str, out: str,
           lead_id: int = None, partner_id: int = None,
           tokens: int = 0, status: str = 'success') -> None:
    try:
        with _conn() as c, c.cursor() as cur:
            cur.execute(
                f"INSERT INTO ai_logs (agent, action, input_text, output_text, "
                f"related_lead_id, related_partner_id, tokens_used, status) "
                f"VALUES ({_esc(agent)}, {_esc(action)}, {_esc(inp[:2000])}, "
                f"{_esc(out[:4000])}, "
                f"{_esc(lead_id) if lead_id else 'NULL'}, "
                f"{_esc(partner_id) if partner_id else 'NULL'}, "
                f"{tokens}, {_esc(status)})"
            )
            c.commit()
    except Exception:
        pass


def get_partner(pid: int) -> dict | None:
    with _conn() as c, c.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f"SELECT * FROM partners WHERE id = {int(pid)}")
        return cur.fetchone()


def get_lead(lid: int) -> dict | None:
    with _conn() as c, c.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f"SELECT * FROM leads WHERE id = {int(lid)}")
        return cur.fetchone()


def _is_admin(event: dict) -> bool:
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = headers.get('x-admin-token') or headers.get('x-auth-token') or ''
    expected = os.environ.get('ADMIN_TOKEN', '')
    return (not expected) or (token == expected)


def list_logs(qp: dict) -> dict:
    where_sql = ''
    agent = (qp or {}).get('agent')
    if agent:
        where_sql = f" WHERE agent = {_esc(agent)}"
    sql = f"""
        SELECT id, agent, action, input_text, output_text, tokens_used, status, created_at
        FROM ai_logs {where_sql}
        ORDER BY created_at DESC LIMIT 100
    """
    with _conn() as c, c.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql)
        return {'items': cur.fetchall()}


def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return _resp(200, {})
    if not _is_admin(event):
        return _resp(403, {'error': 'Forbidden'})

    qp = event.get('queryStringParameters') or {}
    if method == 'GET' and (qp.get('resource') or '') == 'logs':
        return _resp(200, list_logs(qp))

    if method != 'POST':
        return _resp(405, {'error': 'Method not allowed'})

    try:
        body = json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        return _resp(400, {'error': 'Invalid JSON'})

    action = (body.get('action') or '').lower()
    if action not in PROMPTS:
        return _resp(400, {'error': 'Unknown action', 'allowed': list(PROMPTS.keys())})

    try:
        # Контекст из БД (если передан id)
        partner_id = body.get('partner_id')
        lead_id = body.get('lead_id')
        ctx: dict = dict(body)

        if partner_id:
            p = get_partner(int(partner_id))
            if p:
                ctx.setdefault('name', p.get('name'))
                ctx.setdefault('category', p.get('category'))
                ctx.setdefault('city', p.get('city'))
                ctx.setdefault('description', p.get('description') or p.get('ai_summary') or '')

        if lead_id:
            l = get_lead(int(lead_id))
            if l:
                ctx.setdefault('name', l.get('name'))
                ctx.setdefault('company', l.get('company') or '')
                ctx.setdefault('status', l.get('status') or 'new')
                ctx.setdefault('source', l.get('source') or 'site')
                ctx.setdefault('notes', l.get('notes') or '')
                bm = l.get('budget_min') or 0
                bx = l.get('budget_max') or 0
                ctx.setdefault('budget', f'{bm}–{bx} ₽')
                ctx.setdefault('last_contact', str(l.get('updated_at') or 'нет данных'))

        # Дефолты для пропусков
        for k in ('name', 'category', 'city', 'description', 'company',
                  'status', 'notes', 'last_contact', 'budget', 'source', 'message'):
            ctx.setdefault(k, '—')

        prompt = PROMPTS[action].format(**ctx)
        max_tokens = 1500 if action == 'outreach' else 700
        out, tokens = call_llm(SYSTEM_BASE, prompt, max_tokens)

        log_ai('sales-agent', action, prompt, out,
               lead_id=int(lead_id) if lead_id else None,
               partner_id=int(partner_id) if partner_id else None,
               tokens=tokens)

        # Парсим JSON-результат для qualify/next_step
        parsed = None
        if action in ('qualify', 'next_step'):
            try:
                clean = out.strip()
                if clean.startswith('```'):
                    clean = clean.split('```', 2)[1]
                    if clean.startswith('json'):
                        clean = clean[4:]
                parsed = json.loads(clean)
            except (json.JSONDecodeError, IndexError):
                parsed = None

        return _resp(200, {
            'action': action,
            'result': out,
            'parsed': parsed,
            'tokens_used': tokens,
        })

    except Exception as e:
        return _resp(500, {'error': 'Server error', 'detail': str(e)[:200]})
