from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..auth import (
    COOKIE_NAME,
    COOKIE_SECURE,
    TOKEN_TTL,
    create_token,
    hash_password,
    require_admin,
    verify_password,
)
from ..database import get_db
from ..models import AdminUser

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


def _set_session_cookie(response: Response, user: AdminUser):
    response.set_cookie(
        COOKIE_NAME,
        create_token(user),
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
        max_age=int(TOKEN_TTL.total_seconds()),
        path="/",
    )


@router.post("/auth/login")
async def login(request: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(AdminUser).filter(AdminUser.username == request.username).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    _set_session_cookie(response, user)
    return {"username": user.username}


@router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"message": "Logged out"}


@router.get("/auth/me")
async def me(admin: AdminUser = Depends(require_admin)):
    return {"username": admin.username}


@router.post("/auth/change-password")
async def change_password(
    request: ChangePasswordRequest,
    response: Response,
    admin: AdminUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if not verify_password(request.current_password, admin.password_hash):
        raise HTTPException(status_code=403, detail="Current password is incorrect")
    admin.password_hash = hash_password(request.new_password)
    admin.password_changed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(admin)
    # re-issue with the new pwd_ts so this session survives its own change
    _set_session_cookie(response, admin)
    return {"message": "Password updated"}
