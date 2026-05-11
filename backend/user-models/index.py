"""
Пользовательская библиотека 3D-моделей (GLB + USDZ для iOS AR Quick Look).
GET / — список моделей пользователя.
POST / — загрузить новую модель: name, sourceExt, triangles, glbBase64, usdzBase64 (optional).
PUT /{id} — переименовать модель.
"""
import json
import os
import base64
import uuid
import psycopg2
import boto3

SCHEMA = "t_p79259893_roomscan_pro"

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

MAX_SIZE = 50 * 1024 * 1024  # 50 МБ на каждый файл


def resp(status: int, data):
    return {
        "statusCode": status,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps(data, ensure_ascii=False),
    }


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user_id(token: str, cur):
    if not token:
        return None
    cur.execute(
        f"SELECT u.id FROM {SCHEMA}.sessions s "
        f"JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.token = %s AND s.expires_at > NOW()",
        (token,),
    )
    row = cur.fetchone()
    return row[0] if row else None


def get_token(event: dict) -> str:
    headers = event.get("headers") or {}
    return headers.get("x-auth-token") or headers.get("X-Auth-Token") or ""


def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def upload_bytes(user_id: int, body: bytes, ext: str, content_type: str) -> str:
    s3 = get_s3()
    key = f"user-models/{user_id}/{uuid.uuid4().hex}.{ext}"
    s3.put_object(Bucket="files", Key=key, Body=body, ContentType=content_type)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def handler(event: dict, context) -> dict:
    """Управление пользовательской библиотекой 3D-моделей. GLB + USDZ для iOS AR. CRUD через S3 + БД."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    token = get_token(event)

    conn = get_conn()
    cur = conn.cursor()

    user_id = get_user_id(token, cur)
    if not user_id:
        cur.close()
        conn.close()
        return resp(401, {"error": "Не авторизован"})

    parts = [p for p in path.split("/") if p]
    model_id = None
    if parts and parts[-1].isdigit():
        model_id = int(parts[-1])

    if method == "GET":
        cur.execute(
            f"SELECT id, name, source_ext, size_bytes, triangles, glb_url, usdz_url, thumbnail_url, "
            f"TO_CHAR(created_at, 'DD Mon YYYY HH24:MI') as created "
            f"FROM {SCHEMA}.user_models WHERE user_id = %s "
            f"ORDER BY created_at DESC LIMIT 200",
            (user_id,),
        )
        rows = cur.fetchall()
        models = [
            {
                "id": r[0],
                "name": r[1],
                "sourceExt": r[2],
                "sizeBytes": r[3],
                "triangles": r[4],
                "glbUrl": r[5],
                "usdzUrl": r[6],
                "thumbnailUrl": r[7],
                "created": r[8],
            }
            for r in rows
        ]
        cur.close()
        conn.close()
        return resp(200, {"models": models})

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        name = (body.get("name") or "").strip() or "Без названия"
        source_ext = (body.get("sourceExt") or "glb").strip().lower()[:16]
        triangles = body.get("triangles")
        glb_base64 = body.get("glbBase64") or ""
        usdz_base64 = body.get("usdzBase64") or ""

        if not glb_base64:
            cur.close()
            conn.close()
            return resp(400, {"error": "Не передан glbBase64"})

        try:
            glb_bytes = base64.b64decode(glb_base64)
        except Exception:
            cur.close()
            conn.close()
            return resp(400, {"error": "Неверный base64 для GLB"})

        if len(glb_bytes) > MAX_SIZE:
            cur.close()
            conn.close()
            return resp(413, {"error": f"GLB слишком большой (>{MAX_SIZE // 1024 // 1024} МБ)"})

        usdz_bytes = None
        if usdz_base64:
            try:
                usdz_bytes = base64.b64decode(usdz_base64)
                if len(usdz_bytes) > MAX_SIZE:
                    usdz_bytes = None  # тихо отключаем, не блокируем загрузку
            except Exception:
                usdz_bytes = None

        try:
            glb_url = upload_bytes(user_id, glb_bytes, "glb", "model/gltf-binary")
            usdz_url = None
            if usdz_bytes:
                usdz_url = upload_bytes(user_id, usdz_bytes, "usdz", "model/vnd.usdz+zip")
        except Exception as e:
            cur.close()
            conn.close()
            return resp(500, {"error": f"Не удалось загрузить в S3: {e}"})

        cur.execute(
            f"INSERT INTO {SCHEMA}.user_models (user_id, name, source_ext, size_bytes, triangles, glb_url, usdz_url) "
            f"VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id, "
            f"TO_CHAR(created_at, 'DD Mon YYYY HH24:MI')",
            (user_id, name, source_ext, len(glb_bytes), triangles, glb_url, usdz_url),
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return resp(
            200,
            {
                "model": {
                    "id": row[0],
                    "name": name,
                    "sourceExt": source_ext,
                    "sizeBytes": len(glb_bytes),
                    "triangles": triangles,
                    "glbUrl": glb_url,
                    "usdzUrl": usdz_url,
                    "created": row[1],
                }
            },
        )

    if method == "PUT" and model_id:
        body = json.loads(event.get("body") or "{}")
        name = (body.get("name") or "").strip()
        if not name:
            cur.close()
            conn.close()
            return resp(400, {"error": "Укажите имя"})
        cur.execute(
            f"UPDATE {SCHEMA}.user_models SET name = %s, updated_at = NOW() "
            f"WHERE id = %s AND user_id = %s RETURNING id",
            (name, model_id, user_id),
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if not row:
            return resp(404, {"error": "Модель не найдена"})
        return resp(200, {"ok": True})

    cur.close()
    conn.close()
    return resp(405, {"error": "Метод не поддерживается"})
