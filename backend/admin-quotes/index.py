"""
Business: Админ-функция для управления заявками клиентов (просмотр, фильтрация, смена статуса, удаление).
Args: event httpMethod=GET (list, filters in query), POST (update status), DELETE (delete by id).
      Auth: заголовок X-Admin-Token (HMAC от admin-auth)
Returns: JSON {items, total, stats} | {ok}
"""
import hashlib
import hmac
import json
import os
import time
from typing import Any, Dict, List
import psycopg2
from psycopg2.extras import RealDictCursor


CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}

VALID_STATUSES = ('new', 'in_work', 'done', 'rejected')


def _resp(status: int, body: Any) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': CORS,
        'isBase64Encoded': False,
        'body': json.dumps(body, ensure_ascii=False, default=str),
    }


def _secret_key() -> bytes:
    pwd = os.environ.get('ADMIN_PASSWORD', '')
    salt = os.environ.get('DATABASE_URL', 'roomscan-salt')[:32]
    return hashlib.sha256((pwd + salt).encode('utf-8')).digest()


def _verify_token(token: str) -> bool:
    """Совместимо с admin-auth/index.py make_token()."""
    if not token:
        return False
    try:
        parts = token.split('|')
        if len(parts) != 3:
            return False
        login, expiry_str, sig = parts
        expiry = int(expiry_str)
        if time.time() > expiry:
            return False
        expected = hmac.new(
            _secret_key(),
            f"{login}|{expiry}".encode('utf-8'),
            hashlib.sha256,
        ).hexdigest()[:32]
        if not hmac.compare_digest(sig, expected):
            return False
        admin_login = os.environ.get('ADMIN_LOGIN', '')
        if admin_login and login != admin_login:
            return False
        return True
    except (ValueError, AttributeError):
        return False


def _check_auth(event: Dict[str, Any]) -> bool:
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = headers.get('x-admin-token', '') or ''
    return _verify_token(token)


def _conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _list_quotes(qs: Dict[str, str]) -> Dict[str, Any]:
    kind = (qs.get('kind') or '').strip()
    status = (qs.get('status') or '').strip()
    search = (qs.get('q') or '').strip()
    limit = min(int(qs.get('limit') or 200), 500)

    where = []
    args: List[Any] = []
    if kind and kind != 'all':
        where.append("kind = %s")
        args.append(kind)
    if status and status != 'all':
        where.append("status = %s")
        args.append(status)
    if search:
        like = f"%{search.lower()}%"
        where.append(
            "(LOWER(client_name) LIKE %s OR LOWER(client_phone) LIKE %s "
            "OR LOWER(client_email) LIKE %s OR LOWER(project_title) LIKE %s)"
        )
        args.extend([like, like, like, like])
    where_sql = ('WHERE ' + ' AND '.join(where)) if where else ''

    with _conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                f"SELECT id, kind, project_title, client_name, client_phone, client_email, "
                f"comment, snapshot, total_price, status, sent_to_telegram, sent_to_max, "
                f"admin_note, created_at, updated_at "
                f"FROM quote_requests {where_sql} ORDER BY created_at DESC LIMIT {limit}",
                args,
            )
            items = [dict(r) for r in cur.fetchall()]

            # Статистика по статусам — общая, без фильтров
            cur.execute(
                "SELECT status, COUNT(*) AS cnt FROM quote_requests GROUP BY status"
            )
            stats_rows = cur.fetchall()
            stats = {r['status']: r['cnt'] for r in stats_rows}
            cur.execute("SELECT COUNT(*) AS cnt FROM quote_requests")
            total = cur.fetchone()['cnt']

    return {'items': items, 'total': total, 'stats': stats}


def _update_quote(qid: int, payload: Dict[str, Any]) -> Dict[str, Any] | None:
    fields = []
    args: List[Any] = []
    if 'status' in payload:
        new_status = (payload['status'] or '').strip()
        if new_status not in VALID_STATUSES:
            return None
        fields.append('status = %s')
        args.append(new_status)
    if 'admin_note' in payload:
        fields.append('admin_note = %s')
        args.append((payload.get('admin_note') or '')[:5000])
    if not fields:
        return None
    fields.append('updated_at = CURRENT_TIMESTAMP')
    args.append(qid)

    with _conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                f"UPDATE quote_requests SET {', '.join(fields)} WHERE id = %s "
                f"RETURNING id, status, admin_note, updated_at",
                args,
            )
            row = cur.fetchone()
            return dict(row) if row else None


def _delete_quote(qid: int) -> bool:
    with _conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM quote_requests WHERE id = %s", (qid,))
            return cur.rowcount > 0


def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """Управление заявками для админа."""
    method = event.get('httpMethod') or 'GET'
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    if not _check_auth(event):
        return _resp(401, {'error': 'Unauthorized'})

    qs = event.get('queryStringParameters') or {}

    if method == 'GET':
        return _resp(200, _list_quotes(qs))

    if method == 'POST':
        try:
            payload = json.loads(event.get('body') or '{}')
        except json.JSONDecodeError:
            return _resp(400, {'error': 'invalid json'})
        qid = qs.get('id') or payload.get('id')
        if not qid:
            return _resp(400, {'error': 'id required'})
        try:
            qid_int = int(qid)
        except (TypeError, ValueError):
            return _resp(400, {'error': 'invalid id'})
        updated = _update_quote(qid_int, payload)
        if not updated:
            return _resp(400, {'error': 'nothing to update or invalid status'})
        return _resp(200, {'ok': True, 'item': updated})

    if method == 'DELETE':
        qid = qs.get('id')
        if not qid:
            return _resp(400, {'error': 'id required'})
        try:
            ok = _delete_quote(int(qid))
        except (TypeError, ValueError):
            return _resp(400, {'error': 'invalid id'})
        return _resp(200 if ok else 404, {'ok': ok})

    return _resp(405, {'error': 'method not allowed'})
