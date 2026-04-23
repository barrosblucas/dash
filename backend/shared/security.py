"""Primitivos de segurança compartilhados."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from backend.shared.database.connection import get_db
from backend.shared.database.models import UserModel
from backend.shared.settings import get_settings

ALGORITHM = "HS256"
bearer_scheme = HTTPBearer(auto_error=False)
password_context = CryptContext(schemes=["argon2"], deprecated="auto")


@dataclass(frozen=True)
class TokenClaims:
    user_id: int
    role: str
    token_version: int
    token_type: str
    expires_at: datetime
    jti: str | None = None


def utc_now() -> datetime:
    return datetime.now(UTC)


def hash_password(password: str) -> str:
    return str(password_context.hash(password))


def verify_password(password: str, password_hash: str) -> bool:
    return bool(password_context.verify(password, password_hash))


def create_token(
    *,
    user: UserModel,
    token_type: str,
    expires_delta: timedelta,
    secret: str,
    include_jti: bool,
) -> tuple[str, datetime, str | None]:
    expires_at = utc_now() + expires_delta
    jti = uuid4().hex if include_jti else None
    payload: dict[str, Any] = {
        "sub": str(user.id),
        "role": user.role,
        "token_version": user.token_version,
        "type": token_type,
        "exp": expires_at,
    }
    if jti is not None:
        payload["jti"] = jti
    return jwt.encode(payload, secret, algorithm=ALGORITHM), expires_at, jti


def decode_token(token: str, *, expected_type: str, secret: str) -> TokenClaims:
    try:
        payload = jwt.decode(token, secret, algorithms=[ALGORITHM])
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        ) from exc

    token_type = str(payload.get("type", ""))
    if token_type != expected_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )

    try:
        user_id = int(payload["sub"])
        token_version = int(payload["token_version"])
        expires_at_raw = int(payload["exp"])
        role = str(payload["role"])
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        ) from exc

    return TokenClaims(
        user_id=user_id,
        role=role,
        token_version=token_version,
        token_type=token_type,
        expires_at=datetime.fromtimestamp(expires_at_raw, tz=UTC),
        jti=str(payload.get("jti")) if payload.get("jti") else None,
    )


def _get_access_claims(
    credentials: HTTPAuthorizationCredentials | None,
) -> TokenClaims:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )
    settings = get_settings()
    return decode_token(
        credentials.credentials,
        expected_type="access",
        secret=settings.access_token_secret,
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> UserModel:
    claims = _get_access_claims(credentials)
    user = db.query(UserModel).filter(UserModel.id == claims.user_id).first()
    if user is None or not user.is_active or user.token_version != claims.token_version:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )
    return user


def require_admin_user(current_user: UserModel = Depends(get_current_user)) -> UserModel:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado",
        )
    return current_user
