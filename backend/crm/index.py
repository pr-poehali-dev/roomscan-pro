"""
Business: CRM-ядро для админ-кабинета. Лиды, сделки, активности, метрики воронки.
Args:    event с httpMethod, queryStringParameters (resource: leads/deals/activities/dashboard), body
         context с request_id, function_name
Returns: HTTP-ответ JSON {items|item|stats}
"""
import json
import os
from typing import Any, Optional

import psycopg2
from psycopg2.extras import RealDictCursor


def _conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _resp(status: int, body: Any) -> dict:
    return {
        'statusCode': status,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-Admin-Token',
            'Content-Type': 'application/json',
        },
        'body': json.dumps(body, ensure_ascii=False, default=str),
        'isBase64Encoded': False,
    }


def _esc(s: Any) -> str:
    """SQL-escape строки для Simple Query Protocol."""
    if s is None:
        return 'NULL'
    if isinstance(s, bool):
        return 'TRUE' if s else 'FALSE'
    if isinstance(s, (int, float)):
        return str(s)
    return "'" + str(s).replace("'", "''") + "'"


def _is_admin(event: dict) -> bool:
    """Базовая защита админ-эндпоинтов через X-Admin-Token."""
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = headers.get('x-admin-token') or headers.get('x-auth-token') or ''
    expected = os.environ.get('ADMIN_TOKEN', '')
    if expected:
        return token == expected
    # Если ADMIN_TOKEN не настроен — пускаем всех (dev-режим). Прод должен задать его.
    return True


# ───────────── LEADS ─────────────

def list_leads(qp: dict) -> dict:
    where = []
    status = (qp or {}).get('status')
    if status:
        where.append(f"status = {_esc(status)}")
    q = (qp or {}).get('q')
    if q:
        like = _esc(f"%{q}%")
        where.append(f"(name ILIKE {like} OR email ILIKE {like} OR company ILIKE {like})")
    where_sql = (' WHERE ' + ' AND '.join(where)) if where else ''
    sql = f"""
        SELECT id, name, email, phone, company, source, status, tags, notes,
               budget_min, budget_max, assigned_to, next_action_at, created_at, updated_at
        FROM leads {where_sql}
        ORDER BY created_at DESC LIMIT 200
    """
    with _conn() as c, c.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql)
        return {'items': cur.fetchall()}


def create_lead(body: dict) -> dict:
    name = body.get('name', 'Без имени')
    email = body.get('email')
    phone = body.get('phone')
    company = body.get('company')
    source = body.get('source', 'manual')
    notes = body.get('notes')
    budget_min = int(body.get('budget_min') or 0)
    budget_max = int(body.get('budget_max') or 0)
    sql = f"""
        INSERT INTO leads (name, email, phone, company, source, notes, budget_min, budget_max)
        VALUES ({_esc(name)}, {_esc(email)}, {_esc(phone)}, {_esc(company)},
                {_esc(source)}, {_esc(notes)}, {budget_min}, {budget_max})
        RETURNING id, name, email, phone, company, source, status, created_at
    """
    with _conn() as c, c.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql)
        row = cur.fetchone()
        c.commit()
        return {'item': row}


def update_lead(lead_id: int, body: dict) -> dict:
    fields = []
    for k in ('name', 'email', 'phone', 'company', 'status', 'notes', 'tags', 'assigned_to'):
        if k in body:
            fields.append(f"{k} = {_esc(body[k])}")
    if 'budget_min' in body:
        fields.append(f"budget_min = {int(body['budget_min'] or 0)}")
    if 'budget_max' in body:
        fields.append(f"budget_max = {int(body['budget_max'] or 0)}")
    if not fields:
        return {'error': 'no fields'}
    fields.append("updated_at = NOW()")
    sql = f"UPDATE leads SET {', '.join(fields)} WHERE id = {int(lead_id)} RETURNING *"
    with _conn() as c, c.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql)
        row = cur.fetchone()
        c.commit()
        return {'item': row}


# ───────────── DEALS ─────────────

def list_deals(qp: dict) -> dict:
    where = []
    stage = (qp or {}).get('stage')
    if stage:
        where.append(f"stage = {_esc(stage)}")
    where_sql = (' WHERE ' + ' AND '.join(where)) if where else ''
    sql = f"""
        SELECT d.*, l.name AS lead_name, l.email AS lead_email
        FROM deals d
        LEFT JOIN leads l ON l.id = d.lead_id
        {where_sql}
        ORDER BY d.created_at DESC LIMIT 200
    """
    with _conn() as c, c.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql)
        return {'items': cur.fetchall()}


def create_deal(body: dict) -> dict:
    title = body.get('title', 'Новая сделка')
    lead_id = body.get('lead_id')
    stage = body.get('stage', 'qualification')
    amount = float(body.get('amount') or 0)
    probability = int(body.get('probability') or 50)
    description = body.get('description')
    sql = f"""
        INSERT INTO deals (lead_id, title, stage, amount, probability, description)
        VALUES ({_esc(lead_id) if lead_id else 'NULL'}, {_esc(title)}, {_esc(stage)},
                {amount}, {probability}, {_esc(description)})
        RETURNING *
    """
    with _conn() as c, c.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql)
        row = cur.fetchone()
        c.commit()
        return {'item': row}


def update_deal(deal_id: int, body: dict) -> dict:
    fields = []
    for k in ('title', 'stage', 'description'):
        if k in body:
            fields.append(f"{k} = {_esc(body[k])}")
    if 'amount' in body:
        fields.append(f"amount = {float(body['amount'] or 0)}")
    if 'probability' in body:
        fields.append(f"probability = {int(body['probability'] or 0)}")
    if 'closed_won' in body:
        fields.append(f"closed_won = {_esc(bool(body['closed_won']))}")
        fields.append("closed_at = NOW()")
    if not fields:
        return {'error': 'no fields'}
    fields.append("updated_at = NOW()")
    sql = f"UPDATE deals SET {', '.join(fields)} WHERE id = {int(deal_id)} RETURNING *"
    with _conn() as c, c.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql)
        row = cur.fetchone()
        c.commit()
        return {'item': row}


# ───────────── ACTIVITIES ─────────────

def list_activities(qp: dict) -> dict:
    where = []
    lead_id = (qp or {}).get('lead_id')
    if lead_id:
        where.append(f"lead_id = {int(lead_id)}")
    pending = (qp or {}).get('pending')
    if pending == '1':
        where.append("completed_at IS NULL")
    where_sql = (' WHERE ' + ' AND '.join(where)) if where else ''
    sql = f"""
        SELECT * FROM activities {where_sql}
        ORDER BY COALESCE(due_at, created_at) ASC LIMIT 100
    """
    with _conn() as c, c.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql)
        return {'items': cur.fetchall()}


def create_activity(body: dict) -> dict:
    kind = body.get('kind', 'task')
    title = body.get('title', 'Задача')
    lead_id = body.get('lead_id')
    deal_id = body.get('deal_id')
    description = body.get('description')
    due_at = body.get('due_at')
    sql = f"""
        INSERT INTO activities (lead_id, deal_id, kind, title, description, due_at, ai_generated)
        VALUES ({_esc(lead_id) if lead_id else 'NULL'},
                {_esc(deal_id) if deal_id else 'NULL'},
                {_esc(kind)}, {_esc(title)}, {_esc(description)},
                {_esc(due_at) if due_at else 'NULL'},
                {_esc(bool(body.get('ai_generated')))})
        RETURNING *
    """
    with _conn() as c, c.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql)
        row = cur.fetchone()
        c.commit()
        return {'item': row}


def complete_activity(act_id: int, body: dict) -> dict:
    result = body.get('result', '')
    sql = f"""
        UPDATE activities SET completed_at = NOW(), result = {_esc(result)}
        WHERE id = {int(act_id)} RETURNING *
    """
    with _conn() as c, c.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql)
        row = cur.fetchone()
        c.commit()
        return {'item': row}


# ───────────── DASHBOARD ─────────────

def dashboard() -> dict:
    sql_stats = """
        SELECT
            (SELECT COUNT(*) FROM leads)                                       AS leads_total,
            (SELECT COUNT(*) FROM leads WHERE status = 'new')                  AS leads_new,
            (SELECT COUNT(*) FROM leads WHERE created_at >= NOW() - INTERVAL '7 days') AS leads_week,
            (SELECT COUNT(*) FROM deals)                                       AS deals_total,
            (SELECT COUNT(*) FROM deals WHERE closed_won IS NULL)              AS deals_open,
            (SELECT COUNT(*) FROM deals WHERE closed_won = TRUE)               AS deals_won,
            (SELECT COALESCE(SUM(amount), 0) FROM deals WHERE closed_won IS NULL) AS pipeline_amount,
            (SELECT COALESCE(SUM(amount), 0) FROM deals WHERE closed_won = TRUE)  AS won_amount,
            (SELECT COUNT(*) FROM partners)                                    AS partners_total,
            (SELECT COUNT(*) FROM partners WHERE status = 'discovered')        AS partners_discovered,
            (SELECT COUNT(*) FROM partners WHERE status = 'active')            AS partners_active,
            (SELECT COUNT(*) FROM activities WHERE completed_at IS NULL)       AS tasks_pending
    """
    sql_funnel = """
        SELECT stage, COUNT(*) AS cnt, COALESCE(SUM(amount), 0) AS amount
        FROM deals WHERE closed_won IS NULL GROUP BY stage
    """
    sql_recent = """
        SELECT id, name, email, company, source, status, created_at
        FROM leads ORDER BY created_at DESC LIMIT 5
    """
    with _conn() as c, c.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql_stats)
        stats = cur.fetchone()
        cur.execute(sql_funnel)
        funnel = cur.fetchall()
        cur.execute(sql_recent)
        recent = cur.fetchall()
    return {'stats': stats, 'funnel': funnel, 'recent_leads': recent}


# ───────────── HANDLER ─────────────

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return _resp(200, {})

    if not _is_admin(event):
        return _resp(403, {'error': 'Forbidden'})

    qp = event.get('queryStringParameters') or {}
    resource = (qp.get('resource') or '').lower()
    item_id: Optional[int] = None
    raw_id = qp.get('id')
    if raw_id and str(raw_id).isdigit():
        item_id = int(raw_id)

    try:
        body = json.loads(event.get('body') or '{}') if event.get('body') else {}
    except json.JSONDecodeError:
        return _resp(400, {'error': 'Invalid JSON'})

    try:
        if resource == 'dashboard':
            return _resp(200, dashboard())

        if resource == 'leads':
            if method == 'GET':
                return _resp(200, list_leads(qp))
            if method == 'POST':
                return _resp(200, create_lead(body))
            if method in ('PUT', 'PATCH') and item_id:
                return _resp(200, update_lead(item_id, body))

        if resource == 'deals':
            if method == 'GET':
                return _resp(200, list_deals(qp))
            if method == 'POST':
                return _resp(200, create_deal(body))
            if method in ('PUT', 'PATCH') and item_id:
                return _resp(200, update_deal(item_id, body))

        if resource == 'activities':
            if method == 'GET':
                return _resp(200, list_activities(qp))
            if method == 'POST':
                return _resp(200, create_activity(body))
            if method in ('PUT', 'PATCH') and item_id:
                return _resp(200, complete_activity(item_id, body))

        return _resp(404, {'error': 'Resource not found', 'resource': resource})

    except Exception as e:
        return _resp(500, {'error': 'Server error', 'detail': str(e)[:200]})
