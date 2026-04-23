"""Rotas HTTP do bounded context identity."""

from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.features.identity.identity_data import SQLIdentityRepository
from backend.features.identity.identity_types import (
    AuthTokenResponse,
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    PasswordResetConsumeRequest,
    PasswordResetResponse,
    PasswordUpdatedResponse,
    RefreshRequest,
    UserCreateRequest,
    UserListResponse,
    UserResponse,
    UserUpdateRequest,
    normalize_email,
)
from backend.shared.database.connection import get_db
from backend.shared.database.models import UserModel
from backend.shared.security import (
    create_token,
    decode_token,
    get_current_user,
    hash_password,
    require_admin_user,
    utc_now,
    verify_password,
)
from backend.shared.settings import get_settings

router = APIRouter(prefix="/identity", tags=["identity"])


def _user_response(user: UserModel) -> UserResponse:
    return UserResponse.model_validate(user)


def _issue_auth_tokens(repo: SQLIdentityRepository, user: UserModel) -> AuthTokenResponse:
    settings = get_settings()
    access_token, access_expires_at, _ = create_token(
        user=user,
        token_type="access",
        expires_delta=timedelta(minutes=settings.access_token_ttl_minutes),
        secret=settings.access_token_secret,
        include_jti=False,
    )
    refresh_token, refresh_expires_at, refresh_jti = create_token(
        user=user,
        token_type="refresh",
        expires_delta=timedelta(days=settings.refresh_token_ttl_days),
        secret=settings.refresh_token_secret,
        include_jti=True,
    )
    if refresh_jti is None:
        raise RuntimeError("refresh token sem jti")
    repo.create_token_record(
        user_id=int(user.id),
        token_type="refresh",
        jti=refresh_jti,
        expires_at=refresh_expires_at.replace(tzinfo=None),
    )
    return AuthTokenResponse(
        access_token=access_token,
        access_token_expires_at=access_expires_at,
        refresh_token=refresh_token,
        refresh_token_expires_at=refresh_expires_at,
        user=_user_response(user),
    )


def _invalid_credentials() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Email ou senha inválidos",
    )


@router.post("/login", response_model=AuthTokenResponse)
async def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthTokenResponse:
    repo = SQLIdentityRepository(db)
    user = repo.get_user_by_email(normalize_email(str(payload.email)))
    if user is None or not user.is_active:
        raise _invalid_credentials()
    if not verify_password(payload.password, str(user.password_hash)):
        raise _invalid_credentials()

    user.last_login_at = utc_now().replace(tzinfo=None)  # type: ignore[assignment]
    db.flush()
    db.refresh(user)
    return _issue_auth_tokens(repo, user)


@router.post("/refresh", response_model=AuthTokenResponse)
async def refresh_token(
    payload: RefreshRequest,
    db: Session = Depends(get_db),
) -> AuthTokenResponse:
    settings = get_settings()
    claims = decode_token(
        payload.refresh_token,
        expected_type="refresh",
        secret=settings.refresh_token_secret,
    )
    if claims.jti is None:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    repo = SQLIdentityRepository(db)
    token = repo.get_token_by_jti(claims.jti, "refresh")
    user = repo.get_user_by_id(claims.user_id)
    now = utc_now().replace(tzinfo=None)
    if (
        token is None
        or user is None
        or not user.is_active
        or user.token_version != claims.token_version
        or token.revoked_at is not None
        or token.consumed_at is not None
        or token.expires_at < now
    ):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    repo.revoke_token(token, consumed=True)
    return _issue_auth_tokens(repo, user)


@router.post("/logout", response_model=MessageResponse)
async def logout(payload: LogoutRequest, db: Session = Depends(get_db)) -> MessageResponse:
    if payload.refresh_token:
        settings = get_settings()
        try:
            claims = decode_token(
                payload.refresh_token,
                expected_type="refresh",
                secret=settings.refresh_token_secret,
            )
            if claims.jti is not None:
                repo = SQLIdentityRepository(db)
                token = repo.get_token_by_jti(claims.jti, "refresh")
                if token is not None:
                    repo.revoke_token(token, consumed=True)
        except HTTPException:
            pass
    return MessageResponse(message="Logout realizado com sucesso")


@router.get("/me", response_model=UserResponse)
async def me(current_user: UserModel = Depends(get_current_user)) -> UserResponse:
    return _user_response(current_user)


@router.get("/users", response_model=UserListResponse)
async def list_users(
    _: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> UserListResponse:
    repo = SQLIdentityRepository(db)
    users = repo.list_users()
    return UserListResponse(users=[_user_response(user) for user in users], total=len(users))


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    _: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    repo = SQLIdentityRepository(db)
    user = repo.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return _user_response(user)


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreateRequest,
    _: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    repo = SQLIdentityRepository(db)
    try:
        user = repo.create_user(payload)
    except IntegrityError as exc:
        raise HTTPException(status_code=409, detail="Email já cadastrado") from exc
    return _user_response(user)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    payload: UserUpdateRequest,
    _: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    repo = SQLIdentityRepository(db)
    user = repo.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    changes: dict[str, object] = {}
    if payload.name is not None:
        changes["name"] = payload.name.strip()
    if payload.email is not None:
        changes["email"] = normalize_email(str(payload.email))

    should_rotate = False
    if payload.role is not None and payload.role.value != user.role:
        changes["role"] = payload.role.value
        should_rotate = True
    if payload.is_active is not None and payload.is_active != user.is_active:
        changes["is_active"] = payload.is_active
        should_rotate = True
    if should_rotate:
        changes["token_version"] = user.token_version + 1

    try:
        updated_user = repo.update_user(user, **changes)
    except IntegrityError as exc:
        raise HTTPException(status_code=409, detail="Email já cadastrado") from exc
    return _user_response(updated_user)


@router.post("/users/{user_id}/reset-password", response_model=PasswordResetResponse)
async def reset_password(
    user_id: int,
    _: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> PasswordResetResponse:
    repo = SQLIdentityRepository(db)
    user = repo.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    settings = get_settings()
    reset_token, expires_at, jti = create_token(
        user=user,
        token_type="password_reset",
        expires_delta=timedelta(minutes=settings.password_reset_ttl_minutes),
        secret=settings.password_reset_secret,
        include_jti=True,
    )
    if jti is None:
        raise RuntimeError("password reset token sem jti")
    repo.create_token_record(
        user_id=int(user.id),
        token_type="password_reset",
        jti=jti,
        expires_at=expires_at.replace(tzinfo=None),
    )
    return PasswordResetResponse(
        reset_token=reset_token,
        reset_url=f"{settings.password_reset_base_url}?token={reset_token}",
        expires_at=expires_at,
    )


@router.post("/password-resets/consume", response_model=PasswordUpdatedResponse)
async def consume_password_reset(
    payload: PasswordResetConsumeRequest,
    db: Session = Depends(get_db),
) -> PasswordUpdatedResponse:
    settings = get_settings()
    claims = decode_token(
        payload.reset_token,
        expected_type="password_reset",
        secret=settings.password_reset_secret,
    )
    if claims.jti is None:
        raise HTTPException(status_code=400, detail="Token de reset inválido")

    repo = SQLIdentityRepository(db)
    token = repo.get_token_by_jti(claims.jti, "password_reset")
    user = repo.get_user_by_id(claims.user_id)
    now = utc_now().replace(tzinfo=None)
    if (
        token is None
        or user is None
        or token.revoked_at is not None
        or token.consumed_at is not None
        or token.expires_at < now
    ):
        raise HTTPException(status_code=400, detail="Token de reset inválido")

    repo.revoke_token(token, consumed=True)
    repo.revoke_user_tokens(user.id, "refresh")
    repo.update_user(
        user,
        password_hash=hash_password(payload.new_password),
        token_version=user.token_version + 1,
    )
    return PasswordUpdatedResponse(message="Senha atualizada com sucesso")
