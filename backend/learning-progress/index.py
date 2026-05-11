"""
Прогресс пользователя в учебном модуле RoomScan Academy.
GET / — получить прогресс текущего пользователя.
POST / — синхронизировать прогресс (полная замена).
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


def handler(event: dict, context) -> dict:
    """Прогресс прохождения курсов учебного модуля RoomScan Academy. Синхронизация облако/устройство."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    headers = event.get("headers") or {}
    token = headers.get("x-auth-token") or headers.get("X-Auth-Token") or ""

    conn = get_conn()
    cur = conn.cursor()

    user_id = get_user_id(token, cur)
    if not user_id:
        cur.close()
        conn.close()
        return resp(401, {"error": "Не авторизован"})

    if method == "GET":
        cur.execute(
            f"SELECT completed_lessons, earned_badges, last_course_id, last_lesson_id, "
            f"EXTRACT(EPOCH FROM updated_at)::BIGINT * 1000 as updated_at "
            f"FROM {SCHEMA}.learning_progress WHERE user_id = %s",
            (user_id,),
        )
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return resp(200, {
                "completedLessons": [],
                "earnedBadges": [],
                "lastLesson": None,
                "updatedAt": 0,
            })
        return resp(200, {
            "completedLessons": row[0] or [],
            "earnedBadges": row[1] or [],
            "lastLesson": {"courseId": row[2], "lessonId": row[3]} if row[2] and row[3] else None,
            "updatedAt": int(row[4] or 0),
        })

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        completed = body.get("completedLessons") or []
        badges = body.get("earnedBadges") or []
        last = body.get("lastLesson") or {}

        # Очистка и валидация
        completed = [str(x)[:128] for x in completed if isinstance(x, str)][:200]
        badges = [str(x)[:64] for x in badges if isinstance(x, str)][:50]
        last_course = str(last.get("courseId") or "")[:64] if isinstance(last, dict) else ""
        last_lesson = str(last.get("lessonId") or "")[:64] if isinstance(last, dict) else ""

        cur.execute(
            f"INSERT INTO {SCHEMA}.learning_progress "
            f"(user_id, completed_lessons, earned_badges, last_course_id, last_lesson_id, updated_at) "
            f"VALUES (%s, %s, %s, %s, %s, NOW()) "
            f"ON CONFLICT (user_id) DO UPDATE SET "
            f"completed_lessons = EXCLUDED.completed_lessons, "
            f"earned_badges = EXCLUDED.earned_badges, "
            f"last_course_id = EXCLUDED.last_course_id, "
            f"last_lesson_id = EXCLUDED.last_lesson_id, "
            f"updated_at = NOW()",
            (user_id, completed, badges, last_course or None, last_lesson or None),
        )
        conn.commit()
        cur.close()
        conn.close()
        return resp(200, {"ok": True})

    cur.close()
    conn.close()
    return resp(405, {"error": "Метод не поддерживается"})
