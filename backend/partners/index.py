"""
Приём заявок от партнёров + админ-панель.

Публичные:
POST /                     — отправка заявки.
GET  /                     — публичная статистика (без персданных).

Админ (требует X-Admin-Token, сравнивается с env ADMIN_TOKEN):
GET  /?action=list         — список всех заявок
POST /?action=update       — обновить статус заявки
                             body: { "id": 1, "status": "approved" }

Тело POST для отправки заявки:
{
  "company_name": "...",
  "contact_name": "...",
  "email": "...",
  "phone": "+7...",
  "website": "https://...",
  "partnership_type": "catalog" | "api" | "branded" | "enterprise",
  "catalog_size": 100,
  "description": "..."
}
"""
import json
import os
import re
import hmac
import psycopg2

SCHEMA = "t_p79259893_roomscan_pro"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
}

ALLOWED_TYPES = {"catalog", "api", "branded", "enterprise"}
ALLOWED_STATUSES = {"new", "review", "approved", "rejected"}
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def resp(status: int, data: dict) -> dict:
    return {"statusCode": status, "headers": CORS, "body": data}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def is_admin(event: dict) -> bool:
    """Проверка X-Admin-Token через постоянное сравнение."""
    expected = os.environ.get("ADMIN_TOKEN", "")
    if not expected:
        return False
    headers = event.get("headers") or {}
    token = headers.get("x-admin-token") or headers.get("X-Admin-Token") or ""
    if not token:
        return False
    return hmac.compare_digest(token, expected)


def handler(event: dict, context) -> dict:
    """Точка входа Cloud Function. POST — заявка, GET — публичная статистика, action= админ-команды."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")

    # Админ-эндпоинты
    if action in ("list", "update"):
        if not is_admin(event):
            return resp(401, {"error": "Требуется админ-токен"})
        if action == "list" and method == "GET":
            return admin_list()
        if action == "update" and method == "POST":
            return admin_update(event)
        return resp(405, {"error": "Метод не поддерживается"})

    # Публичные
    if method == "POST":
        return submit_application(event)
    elif method == "GET":
        return get_stats()

    return resp(405, {"error": "Метод не поддерживается"})


def submit_application(event: dict) -> dict:
    body = json.loads(event.get("body") or "{}")

    # Извлечение и валидация
    company_name = (body.get("company_name") or "").strip()
    contact_name = (body.get("contact_name") or "").strip()
    email        = (body.get("email") or "").strip().lower()
    phone        = (body.get("phone") or "").strip() or None
    website      = (body.get("website") or "").strip() or None
    p_type       = (body.get("partnership_type") or "").strip()
    catalog_size = body.get("catalog_size")
    description  = (body.get("description") or "").strip() or None

    if not company_name or len(company_name) < 2:
        return resp(400, {"error": "Укажите название компании"})
    if not contact_name or len(contact_name) < 2:
        return resp(400, {"error": "Укажите контактное лицо"})
    if not email or not EMAIL_RE.match(email):
        return resp(400, {"error": "Неверный email"})
    if p_type not in ALLOWED_TYPES:
        return resp(400, {"error": f"Тип партнёрства должен быть одним из: {', '.join(ALLOWED_TYPES)}"})
    if catalog_size is not None:
        try:
            catalog_size = int(catalog_size)
            if catalog_size < 0 or catalog_size > 1_000_000:
                catalog_size = None
        except (TypeError, ValueError):
            catalog_size = None

    # IP клиента из event
    request_ctx = event.get("requestContext") or {}
    identity = request_ctx.get("identity") or {}
    source_ip = identity.get("sourceIp")

    # Защита от двойной отправки одной компанией за 1 минуту
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"""SELECT id FROM {SCHEMA}.partner_applications
            WHERE email = %s AND created_at > NOW() - INTERVAL '1 minute'
            LIMIT 1""",
        (email,)
    )
    if cur.fetchone():
        cur.close(); conn.close()
        return resp(429, {"error": "Заявка с этим email уже принята. Подождите минуту."})

    cur.execute(
        f"""INSERT INTO {SCHEMA}.partner_applications
            (company_name, contact_name, email, phone, website, partnership_type,
             catalog_size, description, source_ip)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, created_at""",
        (company_name, contact_name, email, phone, website, p_type,
         catalog_size, description, source_ip)
    )
    row = cur.fetchone()
    conn.commit(); cur.close(); conn.close()

    return resp(200, {
        "ok": True,
        "application_id": row[0],
        "message": "Заявка принята! Мы свяжемся с вами в течение 1 рабочего дня.",
    })


def get_stats() -> dict:
    """Публичная статистика — без персональных данных."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"""
        SELECT
            COUNT(*) FILTER (WHERE status = 'approved') AS active_partners,
            COUNT(*) FILTER (WHERE status = 'new') AS pending,
            COUNT(*) AS total
        FROM {SCHEMA}.partner_applications
    """)
    row = cur.fetchone()
    cur.close(); conn.close()

    return resp(200, {
        "active_partners": int(row[0] or 0),
        "pending": int(row[1] or 0),
        "total": int(row[2] or 0),
    })


# ─── Админ-эндпоинты ─────────────────────────────────────────────────────────

def admin_list() -> dict:
    """Возвращает все заявки в обратном хронологическом порядке."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"""
        SELECT id, company_name, contact_name, email, phone, website,
               partnership_type, catalog_size, description, status,
               TO_CHAR(created_at, 'DD Mon YYYY HH24:MI') as created,
               TO_CHAR(updated_at, 'DD Mon YYYY HH24:MI') as updated
        FROM {SCHEMA}.partner_applications
        ORDER BY created_at DESC
        LIMIT 500
    """)
    rows = cur.fetchall()
    cur.close(); conn.close()

    apps = [
        {
            "id": r[0],
            "company_name": r[1],
            "contact_name": r[2],
            "email": r[3],
            "phone": r[4],
            "website": r[5],
            "partnership_type": r[6],
            "catalog_size": r[7],
            "description": r[8],
            "status": r[9],
            "created": r[10],
            "updated": r[11],
        }
        for r in rows
    ]

    # Сводка по статусам
    by_status = {"new": 0, "review": 0, "approved": 0, "rejected": 0}
    by_type = {"catalog": 0, "api": 0, "branded": 0, "enterprise": 0}
    for a in apps:
        by_status[a["status"]] = by_status.get(a["status"], 0) + 1
        by_type[a["partnership_type"]] = by_type.get(a["partnership_type"], 0) + 1

    return resp(200, {
        "applications": apps,
        "total": len(apps),
        "by_status": by_status,
        "by_type": by_type,
    })


def admin_update(event: dict) -> dict:
    """Обновление статуса заявки."""
    body = json.loads(event.get("body") or "{}")
    app_id = body.get("id")
    new_status = (body.get("status") or "").strip()

    if not app_id or not isinstance(app_id, int):
        return resp(400, {"error": "Нужен числовой id"})
    if new_status not in ALLOWED_STATUSES:
        return resp(400, {"error": f"Статус должен быть одним из: {', '.join(ALLOWED_STATUSES)}"})

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"""UPDATE {SCHEMA}.partner_applications
            SET status = %s, updated_at = NOW()
            WHERE id = %s
            RETURNING id""",
        (new_status, app_id)
    )
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return resp(404, {"error": "Заявка не найдена"})
    conn.commit(); cur.close(); conn.close()

    return resp(200, {"ok": True, "id": row[0], "status": new_status})