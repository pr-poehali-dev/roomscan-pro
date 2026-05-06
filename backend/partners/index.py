"""
Приём заявок от партнёров (производителей мебели, магазинов).

POST /  — отправка заявки. Без авторизации, гостевой эндпоинт.
GET  /  — публичная статистика (число партнёров, без персданных).

Тело POST:
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
import psycopg2

SCHEMA = "t_p79259893_roomscan_pro"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

ALLOWED_TYPES = {"catalog", "api", "branded", "enterprise"}
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def resp(status: int, data: dict) -> dict:
    return {"statusCode": status, "headers": CORS, "body": data}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """Точка входа Cloud Function. POST — заявка, GET — публичная статистика."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")

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
