"""Schemas e enums do bounded context identity."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserRole(StrEnum):
    ADMIN = "admin"
    USER = "user"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_login_email(cls, value: object) -> object:
        return normalize_email(str(value)) if value is not None else value


class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., min_length=20)


class LogoutRequest(BaseModel):
    refresh_token: str | None = Field(default=None, min_length=20)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    token_version: int
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None = None


class AuthTokenResponse(BaseModel):
    access_token: str
    access_token_expires_at: datetime
    refresh_token: str
    refresh_token_expires_at: datetime
    token_type: str = "bearer"
    user: UserResponse


class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int


class UserCreateRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    role: UserRole = UserRole.USER
    is_active: bool = True

    @field_validator("email", mode="before")
    @classmethod
    def normalize_create_email(cls, value: object) -> object:
        return normalize_email(str(value)) if value is not None else value


class UserUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=255)
    email: EmailStr | None = None
    role: UserRole | None = None
    is_active: bool | None = None

    @field_validator("email", mode="before")
    @classmethod
    def normalize_update_email(cls, value: object) -> object:
        return normalize_email(str(value)) if value is not None else value


class PasswordResetResponse(BaseModel):
    reset_token: str
    reset_url: str
    expires_at: datetime


class PasswordResetConsumeRequest(BaseModel):
    reset_token: str = Field(..., min_length=20)
    new_password: str = Field(..., min_length=8, max_length=128)


class MessageResponse(BaseModel):
    message: str


class PasswordUpdatedResponse(BaseModel):
    message: str


def normalize_email(value: str) -> str:
    return value.strip().lower()
