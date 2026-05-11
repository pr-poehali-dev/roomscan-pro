"""
Заявки брендов мебели/света на размещение в каталоге RoomScan AI.
POST / — создать заявку (публично, без авторизации).
GET / — список заявок (только для админа с X-Auth-Token).
"""
import json
import os
import psycopg2

SCHEMA = "t_p79259893_roomscan_pro"

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}


def resp(status: int, data):
    return {
        "statusCode": status,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps(data, ensure_ascii=False),
    }


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_admin_user(token: str, cur):
    if not token:
        return None
    cur.execute(
        f"SELECT u.id, u.role FROM {SCHEMA}.sessions s "
        f"JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.token = %s AND s.expires_at > NOW()",
        (token,),
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "role": row[1]}


def handler(event: dict, context) -> dict:
    """Заявки брендов мебели и света на размещение в каталоге RoomScan AI с 3D-моделями."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    headers = event.get("headers") or {}
    token = headers.get("x-auth-token") or headers.get("X-Auth-Token") or ""

    conn = get_conn()
    cur = conn.cursor()

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        brand_name = (body.get("brandName") or "").strip()
        if not brand_name:
            cur.close()
            conn.close()
            return resp(400, {"error": "Укажите название бренда"})

        contact_name = (body.get("contactName") or "").strip()[:255]
        contact_email = (body.get("contactEmail") or "").strip()[:255]
        contact_phone = (body.get("contactPhone") or "").strip()[:64]
        website = (body.get("website") or "").strip()[:512]
        category = (body.get("category") or "").strip()[:64]
        models_count = body.get("modelsCount")
        message = (body.get("message") or "").strip()[:2000]

        if not contact_email and not contact_phone:
            cur.close()
            conn.close()
            return resp(400, {"error": "Оставьте email или телефон для связи"})

        try:
            models_count_int = int(models_count) if models_count else None
        except (ValueError, TypeError):
            models_count_int = None

        cur.execute(
            f"INSERT INTO {SCHEMA}.brand_requests "
            f"(brand_name, contact_name, contact_email, contact_phone, website, category, models_count, message) "
            f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (brand_name, contact_name, contact_email, contact_phone, website, category, models_count_int, message),
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return resp(200, {"ok": True, "id": new_id, "message": "Заявка принята. Мы свяжемся в течение 24 часов."})

    if method == "GET":
        user = get_admin_user(token, cur)
        if not user or user["role"] not in ("admin", "owner"):
            cur.close()
            conn.close()
            return resp(401, {"error": "Доступ только для администратора"})

        cur.execute(
            f"SELECT id, brand_name, contact_name, contact_email, contact_phone, website, "
            f"category, models_count, message, status, "
            f"TO_CHAR(created_at, 'DD Mon YYYY HH24:MI') as created "
            f"FROM {SCHEMA}.brand_requests ORDER BY created_at DESC LIMIT 200"
        )
        rows = cur.fetchall()
        requests = [
            {
                "id": r[0],
                "brandName": r[1],
                "contactName": r[2],
                "contactEmail": r[3],
                "contactPhone": r[4],
                "website": r[5],
                "category": r[6],
                "modelsCount": r[7],
                "message": r[8],
                "status": r[9],
                "created": r[10],
            }
            for r in rows
        ]
        cur.close()
        conn.close()
        return resp(200, {"requests": requests})

    cur.close()
    conn.close()
    return resp(405, {"error": "Метод не поддерживается"})
