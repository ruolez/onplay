import os
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import Depends, HTTPException, Request
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .database import get_db
from .models import AdminUser

JWT_SECRET = os.getenv("JWT_SECRET", "onplay-dev-insecure-secret")
JWT_ALGORITHM = "HS256"
TOKEN_TTL = timedelta(days=7)
COOKIE_NAME = "onplay_admin"
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def _password_ts(user: AdminUser) -> int:
    return int(user.password_changed_at.timestamp()) if user.password_changed_at else 0


def create_token(user: AdminUser) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user.username,
        "exp": now + TOKEN_TTL,
        "pwd_ts": _password_ts(user),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def require_admin(request: Request, db: Session = Depends(get_db)) -> AdminUser:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    user = db.query(AdminUser).filter(AdminUser.username == payload.get("sub")).first()
    # pwd_ts mismatch revokes tokens issued before the last password change
    if not user or payload.get("pwd_ts") != _password_ts(user):
        raise HTTPException(status_code=401, detail="Session revoked")
    return user


def seed_admin(session_factory):
    from sqlalchemy.exc import IntegrityError

    db = session_factory()
    try:
        if not db.query(AdminUser).filter(AdminUser.username == "admin").first():
            db.add(AdminUser(username="admin", password_hash=hash_password("admin")))
            db.commit()
    except IntegrityError:
        db.rollback()  # another worker seeded first
    finally:
        db.close()
