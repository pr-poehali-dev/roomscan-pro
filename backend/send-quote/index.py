"""
Business: Принимает заявку клиента на расчёт (инженерный узел или модульный дом),
сохраняет в quote_requests и параллельно отправляет уведомление в Telegram и MAX.
Args: event с body {kind, project_title, client_name, client_phone, client_email, comment, snapshot, total_price}
Returns: HTTP 200 с {ok, id, telegram_sent, max_sent} или 4xx с описанием ошибки
"""
import json
import os
import re
import urllib.parse
import urllib.request
from typing import Any, Dict
import psycopg2
from psycopg2.extras import RealDictCursor


CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}


def _resp(status: int, body: Any) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': CORS,
        'isBase64Encoded': False,
        'body': json.dumps(body, ensure_ascii=False, default=str),
    }


def _format_price(n: int) -> str:
    return f"{n:,}".replace(',', ' ') + ' ₽'


def _build_text_html(payload: Dict[str, Any]) -> str:
    """HTML-вариант для Telegram."""
    kind_label = {
        'engineering': '⚙️ Инженерный узел (котельная)',
        'modular_house': '🏠 Модульный дом',
    }.get(payload.get('kind', ''), '📋 Заявка')
    lines = [
        f"<b>{kind_label}</b>",
        '',
        f"<b>Проект:</b> {payload.get('project_title', '—')}",
    ]
    total = int(payload.get('total_price') or 0)
    if total > 0:
        lines.append(f"<b>Сумма:</b> {_format_price(total)}")
    lines.append('')
    lines.append('<b>Контакт:</b>')
    if payload.get('client_name'):
        lines.append(f"👤 {payload['client_name']}")
    if payload.get('client_phone'):
        lines.append(f"📞 {payload['client_phone']}")
    if payload.get('client_email'):
        lines.append(f"✉️ {payload['client_email']}")
    if payload.get('comment'):
        lines.append('')
        lines.append('<b>Комментарий:</b>')
        lines.append(payload['comment'][:500])
    snapshot = payload.get('snapshot') or {}
    items = snapshot.get('items') or []
    if items:
        lines.append('')
        lines.append('<b>Состав (топ-5):</b>')
        for it in items[:5]:
            qty = it.get('quantity', 1)
            name = (it.get('name') or '')[:60]
            lines.append(f"• {name} × {qty}")
        if len(items) > 5:
            lines.append(f"… и ещё {len(items) - 5}")
    return '\n'.join(lines)


def _build_text_plain(payload: Dict[str, Any]) -> str:
    """Plain-text для MAX (без HTML, чтобы быть совместимым с любым форматированием)."""
    kind_label = {
        'engineering': '⚙️ Инженерный узел (котельная)',
        'modular_house': '🏠 Модульный дом',
    }.get(payload.get('kind', ''), '📋 Заявка')
    lines = [
        kind_label,
        '',
        f"Проект: {payload.get('project_title', '—')}",
    ]
    total = int(payload.get('total_price') or 0)
    if total > 0:
        lines.append(f"Сумма: {_format_price(total)}")
    lines.append('')
    lines.append('Контакт:')
    if payload.get('client_name'):
        lines.append(f"👤 {payload['client_name']}")
    if payload.get('client_phone'):
        lines.append(f"📞 {payload['client_phone']}")
    if payload.get('client_email'):
        lines.append(f"✉️ {payload['client_email']}")
    if payload.get('comment'):
        lines.append('')
        lines.append('Комментарий:')
        lines.append(payload['comment'][:500])
    snapshot = payload.get('snapshot') or {}
    items = snapshot.get('items') or []
    if items:
        lines.append('')
        lines.append('Состав (топ-5):')
        for it in items[:5]:
            qty = it.get('quantity', 1)
            name = (it.get('name') or '')[:60]
            lines.append(f"• {name} × {qty}")
        if len(items) > 5:
            lines.append(f"… и ещё {len(items) - 5}")
    return '\n'.join(lines)


def _send_telegram(text: str) -> bool:
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '').strip()
    chat_id = os.environ.get('TELEGRAM_CHAT_ID', '').strip()
    if not token or not chat_id:
        return False
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    data = urllib.parse.urlencode({
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML',
        'disable_web_page_preview': 'true',
    }).encode('utf-8')
    req = urllib.request.Request(url, data=data, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status == 200
    except Exception:
        return False


def _send_max(text: str) -> bool:
    """MAX Bot API: POST https://botapi.max.ru/messages?access_token=...&chat_id=..."""
    token = os.environ.get('MAX_BOT_TOKEN', '').strip()
    chat_id = os.environ.get('MAX_CHAT_ID', '').strip()
    if not token or not chat_id:
        return False
    url = (
        "https://botapi.max.ru/messages"
        f"?access_token={urllib.parse.quote(token)}"
        f"&chat_id={urllib.parse.quote(chat_id)}"
    )
    body = json.dumps({'text': text[:4000]}).encode('utf-8')
    req = urllib.request.Request(
        url, data=body, method='POST',
        headers={'Content-Type': 'application/json'},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return 200 <= resp.status < 300
    except Exception:
        return False


def _save_to_db(payload: Dict[str, Any], tg_sent: bool, max_sent: bool) -> int:
    with psycopg2.connect(os.environ['DATABASE_URL']) as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "INSERT INTO quote_requests "
                "(kind, project_title, client_name, client_phone, client_email, comment, "
                " snapshot, total_price, sent_to_telegram, sent_to_max, status) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s, %s, 'new') RETURNING id",
                (
                    (payload.get('kind') or 'unknown')[:32],
                    (payload.get('project_title') or '—')[:255],
                    (payload.get('client_name') or '')[:120],
                    (payload.get('client_phone') or '')[:40],
                    (payload.get('client_email') or '')[:120],
                    (payload.get('comment') or '')[:5000],
                    json.dumps(payload.get('snapshot') or {}, ensure_ascii=False),
                    int(payload.get('total_price') or 0),
                    tg_sent,
                    max_sent,
                ),
            )
            return cur.fetchone()['id']


def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """Принять заявку, сохранить в БД, переслать в Telegram и MAX."""
    method: str = event.get('httpMethod') or 'GET'
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}
    if method != 'POST':
        return _resp(405, {'error': 'method not allowed'})

    try:
        payload = json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        return _resp(400, {'error': 'invalid json'})

    name = (payload.get('client_name') or '').strip()
    phone = (payload.get('client_phone') or '').strip()
    email = (payload.get('client_email') or '').strip()

    if not name:
        return _resp(400, {'error': 'name required'})
    if not phone and not email:
        return _resp(400, {'error': 'phone or email required'})
    if email and not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
        return _resp(400, {'error': 'invalid email'})

    tg_text = _build_text_html(payload)
    max_text = _build_text_plain(payload)
    tg_sent = _send_telegram(tg_text)
    max_sent = _send_max(max_text)
    qid = _save_to_db(payload, tg_sent, max_sent)

    return _resp(200, {
        'ok': True,
        'id': qid,
        'telegram_sent': tg_sent,
        'max_sent': max_sent,
    })
