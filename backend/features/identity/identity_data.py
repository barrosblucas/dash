"""Persistência do bounded context identity."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from backend.features.identity.identity_types import UserCreateRequest, normalize_email
from backend.shared.database.models import IdentityTokenModel, UserModel
from backend.shared.security import hash_password, utc_now
from backend.shared.settings import Settings


class SQLIdentityRepository:
    def __init__(self, session: Session):
        self.session = session

    def count_users(self) -> int:
        return int(self.session.query(UserModel).count())

    def list_users(self) -> list[UserModel]:
        return list(self.session.query(UserModel).order_by(UserModel.created_at.asc()).all())

    def get_user_by_id(self, user_id: int) -> UserModel | None:
        return self.session.query(UserModel).filter(UserModel.id == user_id).first()

    def get_user_by_email(self, email: str) -> UserModel | None:
        normalized_email = normalize_email(email)
        return self.session.query(UserModel).filter(UserModel.email == normalized_email).first()

    def create_user(self, payload: UserCreateRequest) -> UserModel:
        user = UserModel(
            name=payload.name.strip(),
            email=normalize_email(str(payload.email)),
            password_hash=hash_password(payload.password),
            role=payload.role.value,
            is_active=payload.is_active,
        )
        self.session.add(user)
        self.session.flush()
        self.session.refresh(user)
        return user

    def update_user(self, user: UserModel, **changes: object) -> UserModel:
        for field, value in changes.items():
            setattr(user, field, value)
        self.session.flush()
        self.session.refresh(user)
        return user

    def create_token_record(
        self,
        *,
        user_id: int,
        token_type: str,
        jti: str,
        expires_at: datetime,
    ) -> IdentityTokenModel:
        token = IdentityTokenModel(
            user_id=user_id,
            token_type=token_type,
            jti=jti,
            expires_at=expires_at,
        )
        self.session.add(token)
        self.session.flush()
        self.session.refresh(token)
        return token

    def get_token_by_jti(self, jti: str, token_type: str) -> IdentityTokenModel | None:
        return (
            self.session.query(IdentityTokenModel)
            .filter(
                IdentityTokenModel.jti == jti,
                IdentityTokenModel.token_type == token_type,
            )
            .first()
        )

    def revoke_token(self, token: IdentityTokenModel, *, consumed: bool = False) -> None:
        now = utc_now().replace(tzinfo=None)
        token.revoked_at = now  # type: ignore[assignment]
        if consumed:
            token.consumed_at = now  # type: ignore[assignment]
        self.session.flush()

    def revoke_user_tokens(self, user_id: int, token_type: str) -> None:
        now = utc_now().replace(tzinfo=None)
        tokens = (
            self.session.query(IdentityTokenModel)
            .filter(
                IdentityTokenModel.user_id == user_id,
                IdentityTokenModel.token_type == token_type,
                IdentityTokenModel.revoked_at.is_(None),
            )
            .all()
        )
        for token in tokens:
            token.revoked_at = now  # type: ignore[assignment]
        self.session.flush()


def bootstrap_first_admin(session: Session, settings: Settings) -> None:
    repo = SQLIdentityRepository(session)
    if repo.count_users() > 0:
        return
    if not (
        settings.bootstrap_admin_name
        and settings.bootstrap_admin_email
        and settings.bootstrap_admin_password
    ):
        return

    repo.create_user(
        UserCreateRequest(
            name=settings.bootstrap_admin_name,
            email=settings.bootstrap_admin_email,
            password=settings.bootstrap_admin_password,
            role="admin",
            is_active=True,
        )
    )
