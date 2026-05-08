"""
Business: CRUD проектов модуля «Модульные дома» — каталог + кастомные сборки.
Args: event с httpMethod (GET/POST/PUT/DELETE), body с layout, query с id
Returns: HTTP-ответ с проектом или списком проектов в JSON
"""
import json
import os
from typing import Any, Dict, List
import psycopg2
from psycopg2.extras import RealDictCursor


CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}


def _conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _resp(status: int, body: Any) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': CORS,
        'isBase64Encoded': False,
        'body': json.dumps(body, ensure_ascii=False, default=str),
    }


def _user_id(event: Dict[str, Any]) -> int:
    headers = event.get('headers') or {}
    raw = headers.get('X-User-Id') or headers.get('x-user-id') or '0'
    try:
        return int(raw)
    except (TypeError, ValueError):
        return 0


def _list_projects(user_id: int) -> List[Dict[str, Any]]:
    with _conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT id, title, base_project_id, total_area, grand_total, notes, "
                "created_at, updated_at FROM house_projects WHERE user_id = %s "
                "ORDER BY updated_at DESC LIMIT 100",
                (user_id,),
            )
            return [dict(r) for r in cur.fetchall()]


def _get_project(project_id: int, user_id: int) -> Dict[str, Any] | None:
    with _conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM house_projects WHERE id=%s AND user_id=%s", (project_id, user_id))
            row = cur.fetchone()
            return dict(row) if row else None


def _create(user_id: int, p: Dict[str, Any]) -> Dict[str, Any]:
    title = (p.get('title') or 'Без названия').strip()[:255]
    base = (p.get('base_project_id') or '').strip()[:64]
    layout = json.dumps(p.get('layout') or [], ensure_ascii=False)
    total_area = float(p.get('total_area') or 0)
    grand_total = int(p.get('grand_total') or 0)
    notes = (p.get('notes') or '')[:5000]
    with _conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "INSERT INTO house_projects (user_id, title, base_project_id, layout, total_area, grand_total, notes) "
                "VALUES (%s, %s, %s, %s::jsonb, %s, %s, %s) "
                "RETURNING id, title, base_project_id, total_area, grand_total, notes, created_at, updated_at",
                (user_id, title, base, layout, total_area, grand_total, notes),
            )
            return dict(cur.fetchone())


def _update(project_id: int, user_id: int, p: Dict[str, Any]) -> Dict[str, Any] | None:
    title = (p.get('title') or 'Без названия').strip()[:255]
    base = (p.get('base_project_id') or '').strip()[:64]
    layout = json.dumps(p.get('layout') or [], ensure_ascii=False)
    total_area = float(p.get('total_area') or 0)
    grand_total = int(p.get('grand_total') or 0)
    notes = (p.get('notes') or '')[:5000]
    with _conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "UPDATE house_projects SET title=%s, base_project_id=%s, layout=%s::jsonb, "
                "total_area=%s, grand_total=%s, notes=%s, updated_at=CURRENT_TIMESTAMP "
                "WHERE id=%s AND user_id=%s "
                "RETURNING id, title, base_project_id, total_area, grand_total, notes, created_at, updated_at",
                (title, base, layout, total_area, grand_total, notes, project_id, user_id),
            )
            row = cur.fetchone()
            return dict(row) if row else None


def _delete(project_id: int, user_id: int) -> bool:
    with _conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM house_projects WHERE id=%s AND user_id=%s", (project_id, user_id))
            return cur.rowcount > 0


def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """CRUD для проектов модульных домов."""
    method: str = event.get('httpMethod') or 'GET'
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    user_id = _user_id(event)
    qs = event.get('queryStringParameters') or {}

    if method == 'GET':
        pid = qs.get('id')
        if pid:
            try:
                p = _get_project(int(pid), user_id)
            except (TypeError, ValueError):
                return _resp(400, {'error': 'invalid id'})
            if not p:
                return _resp(404, {'error': 'not found'})
            return _resp(200, p)
        return _resp(200, {'items': _list_projects(user_id)})

    if method in ('POST', 'PUT'):
        try:
            payload = json.loads(event.get('body') or '{}')
        except json.JSONDecodeError:
            return _resp(400, {'error': 'invalid json'})
        if method == 'POST':
            return _resp(201, _create(user_id, payload))
        pid = qs.get('id') or payload.get('id')
        if not pid:
            return _resp(400, {'error': 'id required'})
        try:
            updated = _update(int(pid), user_id, payload)
        except (TypeError, ValueError):
            return _resp(400, {'error': 'invalid id'})
        if not updated:
            return _resp(404, {'error': 'not found'})
        return _resp(200, updated)

    if method == 'DELETE':
        pid = qs.get('id')
        if not pid:
            return _resp(400, {'error': 'id required'})
        try:
            ok = _delete(int(pid), user_id)
        except (TypeError, ValueError):
            return _resp(400, {'error': 'invalid id'})
        return _resp(200 if ok else 404, {'ok': ok})

    return _resp(405, {'error': 'method not allowed'})
