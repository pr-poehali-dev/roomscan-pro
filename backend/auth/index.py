"""
Авторизация: action=register|login|verify через query param.
POST ?action=register, POST ?action=login, GET ?action=verify
"""
import os
import secrets
import hashlib
import psycopg2


SCHEMA = "t_p79259893_roomscan_pro"

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def r(status: int, data: dict) -> dict:
    return {"statusCode": status, "headers": CORS_HEADERS, "body": data}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "verify")

    if method == "POST" and action == "register":
        return register(event)
    elif method == "POST" and action == "login":
        return login(event)
    elif method == "GET" and action == "verify":
        return verify(event)

    return r(400, {"error": "Неизвестное действие"})


def register(event: dict) -> dict:
    import json as _json
    body = _json.loads(event.get("body") or "{}")
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    name = (body.get("name") or "").strip()

    if not email or not password or not name:
        return r(400, {"error": "Заполните все поля"})
    if len(password) < 6:
        return r(400, {"error": "Пароль должен быть не менее 6 символов"})

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = %s", (email,))
    if cur.fetchone():
        cur.close(); conn.close()
        return r(409, {"error": "Email уже используется"})

    cur.execute(
        f"INSERT INTO {SCHEMA}.users (email, password_hash, name) VALUES (%s, %s, %s) RETURNING id, name, email, role",
        (email, hash_password(password), name)
    )
    uid, uname, uemail, urole = cur.fetchone()
    token = secrets.token_hex(32)
    cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)", (uid, token))
    conn.commit(); cur.close(); conn.close()
    return r(200, {"token": token, "user": {"id": uid, "name": uname, "email": uemail, "role": urole}})


def login(event: dict) -> dict:
    import json as _json
    body = _json.loads(event.get("body") or "{}")
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not email or not password:
        return r(400, {"error": "Введите email и пароль"})

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT id, name, email, role, password_hash FROM {SCHEMA}.users WHERE email = %s", (email,)
    )
    row = cur.fetchone()
    if not row or row[4] != hash_password(password):
        cur.close(); conn.close()
        return r(401, {"error": "Неверный email или пароль"})

    uid, uname, uemail, urole, _ = row
    token = secrets.token_hex(32)
    cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)", (uid, token))
    conn.commit(); cur.close(); conn.close()
    return r(200, {"token": token, "user": {"id": uid, "name": uname, "email": uemail, "role": urole}})


def verify(event: dict) -> dict:
    headers = event.get("headers") or {}
    token = headers.get("x-auth-token") or headers.get("X-Auth-Token") or ""
    if not token:
        return r(401, {"error": "Нет токена"})

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"""
        SELECT u.id, u.name, u.email, u.role
        FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id
        WHERE s.token = %s AND s.expires_at > NOW()
        """,
        (token,)
    )
    row = cur.fetchone()
    cur.close(); conn.close()

    if not row:
        return r(401, {"error": "Токен недействителен"})

    uid, uname, uemail, urole = row
    return r(200, {"user": {"id": uid, "name": uname, "email": uemail, "role": urole}})