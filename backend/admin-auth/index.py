"""
Business: Авторизация администратора (логин/пароль) для входа в админ-кабинет.
         При успехе возвращает HMAC-токен, который фронт сохраняет и шлёт в X-Admin-Token.
Args:    event с httpMethod, body {action: login|verify, login, password, token}
         context с request_id, function_name
Returns: HTTP-ответ JSON {ok, token?, expires_at?, error?}
"""
import hmac
import hashlib
import json
import os
import time
from typing import Any


SESSION_TTL_HOURS = 12


def _resp(status: int, body: Any) -> dict:
    return {
        'statusCode': status,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
            'Content-Type': 'application/json',
        },
        'body': json.dumps(body, ensure_ascii=False),
        'isBase64Encoded': False,
    }


def _secret_key() -> bytes:
    """Секрет для подписи токена. Берём из ADMIN_PASSWORD + соль."""
    pwd = os.environ.get('ADMIN_PASSWORD', '')
    salt = os.environ.get('DATABASE_URL', 'roomscan-salt')[:32]
    return hashlib.sha256((pwd + salt).encode('utf-8')).digest()


def make_token(login: str) -> tuple[str, int]:
    """Подпись: base64(login.expiry.hmac)."""
    expires_at = int(time.time()) + SESSION_TTL_HOURS * 3600
    payload = f"{login}|{expires_at}"
    sig = hmac.new(_secret_key(), payload.encode('utf-8'), hashlib.sha256).hexdigest()[:32]
    token = f"{payload}|{sig}"
    return token, expires_at


def verify_token(token: str) -> bool:
    try:
        parts = token.split('|')
        if len(parts) != 3:
            return False
        login, expiry_str, sig = parts
        expiry = int(expiry_str)
        if time.time() > expiry:
            return False
        expected = hmac.new(_secret_key(), f"{login}|{expiry}".encode('utf-8'), hashlib.sha256).hexdigest()[:32]
        if not hmac.compare_digest(sig, expected):
            return False
        admin_login = os.environ.get('ADMIN_LOGIN', '')
        if admin_login and login != admin_login:
            return False
        return True
    except (ValueError, AttributeError):
        return False


def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return _resp(200, {})

    try:
        body = json.loads(event.get('body') or '{}') if event.get('body') else {}
    except json.JSONDecodeError:
        return _resp(400, {'error': 'Invalid JSON'})

    qp = event.get('queryStringParameters') or {}
    action = (body.get('action') or qp.get('action') or '').lower()

    admin_login = os.environ.get('ADMIN_LOGIN', '')
    admin_password = os.environ.get('ADMIN_PASSWORD', '')
    configured = bool(admin_login and admin_password)

    if action == 'verify':
        headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
        token = body.get('token') or headers.get('x-admin-token') or ''
        return _resp(200, {'ok': verify_token(token), 'configured': configured})

    if action == 'login' or method == 'POST':
        login = (body.get('login') or '').strip()
        password = body.get('password') or ''
        if not login or not password:
            return _resp(400, {'ok': False, 'error': 'Логин и пароль обязательны', 'configured': configured})

        if not configured:
            return _resp(503, {
                'ok': False,
                'error': 'Админ-доступ не настроен. Задайте ADMIN_LOGIN и ADMIN_PASSWORD в секретах.',
                'configured': False,
            })

        login_ok = hmac.compare_digest(login, admin_login)
        pass_ok = hmac.compare_digest(password, admin_password)
        if not (login_ok and pass_ok):
            return _resp(401, {'ok': False, 'error': 'Неверный логин или пароль'})

        token, expires_at = make_token(login)
        return _resp(200, {
            'ok': True,
            'token': token,
            'expires_at': expires_at,
            'login': login,
        })

    return _resp(400, {'ok': False, 'error': 'Unknown action', 'configured': configured})