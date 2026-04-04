"""
Проекты пользователя: GET / (список), POST / (создать), PUT /{id} (обновить), DELETE /{id} (архив).
"""
import json
import os
import psycopg2


def resp(status: int, data: dict) -> dict:
    return {"statusCode": status, "headers": {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    }, "body": data}


SCHEMA = "t_p79259893_roomscan_pro"

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user_id(token: str, cur) -> int | None:
    cur.execute(
        f"""
        SELECT u.id FROM {SCHEMA}.sessions s
        JOIN {SCHEMA}.users u ON u.id = s.user_id
        WHERE s.token = %s AND s.expires_at > NOW()
        """,
        (token,)
    )
    row = cur.fetchone()
    return row[0] if row else None


def get_token(event: dict) -> str:
    headers = event.get("headers") or {}
    return headers.get("x-auth-token") or headers.get("X-Auth-Token") or ""


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    token = get_token(event)

    conn = get_conn()
    cur = conn.cursor()

    user_id = get_user_id(token, cur)
    if not user_id:
        cur.close(); conn.close()
        return resp(401, {"error": "Не авторизован"})

    parts = [p for p in path.split("/") if p]
    project_id = None
    if parts and parts[-1].isdigit():
        project_id = int(parts[-1])

    if method == "GET":
        cur.execute(
            f"""
            SELECT id, name, rooms, area, status,
                   TO_CHAR(updated_at, 'DD Mon YYYY') as updated
            FROM {SCHEMA}.projects
            WHERE user_id = %s
            ORDER BY updated_at DESC
            """,
            (user_id,)
        )
        rows = cur.fetchall()
        projects = [
            {"id": row[0], "name": row[1], "rooms": row[2], "area": row[3], "status": row[4], "updated": row[5]}
            for row in rows
        ]
        cur.close(); conn.close()
        return resp(200, {"projects": projects})

    elif method == "POST":
        body = json.loads(event.get("body") or "{}")
        name = (body.get("name") or "").strip()
        if not name:
            cur.close(); conn.close()
            return resp(400, {"error": "Укажите название проекта"})

        rooms = int(body.get("rooms") or 0)
        area = str(body.get("area") or "0 м2")

        cur.execute(
            f"""
            INSERT INTO {SCHEMA}.projects (user_id, name, rooms, area)
            VALUES (%s, %s, %s, %s)
            RETURNING id, name, rooms, area, status, TO_CHAR(updated_at, 'DD Mon YYYY')
            """,
            (user_id, name, rooms, area)
        )
        row = cur.fetchone()
        conn.commit()
        cur.close(); conn.close()
        project = {"id": row[0], "name": row[1], "rooms": row[2], "area": row[3], "status": row[4], "updated": row[5]}
        return resp(200, {"project": project})

    elif method == "PUT" and project_id:
        body = json.loads(event.get("body") or "{}")
        name = (body.get("name") or "").strip()
        status = body.get("status")
        rooms = body.get("rooms")
        area = body.get("area")

        cur.execute(
            f"SELECT id FROM {SCHEMA}.projects WHERE id = %s AND user_id = %s",
            (project_id, user_id)
        )
        if not cur.fetchone():
            cur.close(); conn.close()
            return resp(404, {"error": "Проект не найден"})

        fields = []
        values = []
        if name:
            fields.append("name = %s"); values.append(name)
        if status:
            fields.append("status = %s"); values.append(status)
        if rooms is not None:
            fields.append("rooms = %s"); values.append(int(rooms))
        if area is not None:
            fields.append("area = %s"); values.append(str(area))
        fields.append("updated_at = NOW()")

        values.extend([project_id, user_id])
        cur.execute(
            f"""
            UPDATE {SCHEMA}.projects SET {', '.join(fields)}
            WHERE id = %s AND user_id = %s
            RETURNING id, name, rooms, area, status, TO_CHAR(updated_at, 'DD Mon YYYY')
            """,
            values
        )
        row = cur.fetchone()
        conn.commit()
        cur.close(); conn.close()
        project = {"id": row[0], "name": row[1], "rooms": row[2], "area": row[3], "status": row[4], "updated": row[5]}
        return resp(200, {"project": project})

    cur.close(); conn.close()
    return resp(405, {"error": "Method not allowed"})