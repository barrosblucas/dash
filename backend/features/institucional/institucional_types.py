"""Schemas Pydantic do bounded context institucional."""

from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel, Field


class DepartmentKind(StrEnum):
    SECRETARIA = "secretaria"
    AUTARQUIA = "autarquia"


class OfficeKind(StrEnum):
    SECRETARIA = "secretaria"
    SETOR = "setor"
    REPARTICAO = "reparticao"
    GABINETE = "gabinete"
    AUTARQUIA = "autarquia"


class SocialLinkItem(BaseModel):
    label: str
    url: str


class ContactInfo(BaseModel):
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    office_hours: str | None = None


class GestaoPerson(BaseModel):
    role: str
    name: str | None = None
    photo_url: str | None = None
    bio: str | None = None


# --- Respostas públicas ---


class PrefeituraResponse(BaseModel):
    city_hall_name: str
    description: str | None = None
    image_url: str | None = None
    contact: ContactInfo
    social_links: list[SocialLinkItem] = Field(default_factory=list)
    updated_at: str


class GestaoResponse(BaseModel):
    mayor: GestaoPerson
    vice_mayor: GestaoPerson
    cabinet_chief: GestaoPerson
    cabinet_description: str | None = None
    updated_at: str


class DepartmentRecord(BaseModel):
    id: int
    slug: str
    name: str
    kind: DepartmentKind
    leader_title: str
    secretary_name: str | None = None
    secretary_photo_url: str | None = None
    description: str | None = None
    mission: str | None = None
    vision: str | None = None
    values: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    office_hours: str | None = None
    image_url: str | None = None
    updated_at: str


class DepartmentListResponse(BaseModel):
    items: list[DepartmentRecord]
    total: int


class OfficeRecord(BaseModel):
    id: int
    department_id: int | None = None
    department_name: str | None = None
    department_slug: str | None = None
    kind: OfficeKind
    name: str
    description: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    office_hours: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    updated_at: str


class OfficeListResponse(BaseModel):
    items: list[OfficeRecord]
    total: int


# --- Schemas de admin ---


class ProfileUpdateRequest(BaseModel):
    city_hall_name: str | None = None
    description: str | None = None
    image_url: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    office_hours: str | None = None
    social_links: list[SocialLinkItem] | None = None
    mayor_name: str | None = None
    mayor_photo_url: str | None = None
    mayor_bio: str | None = None
    vice_mayor_name: str | None = None
    vice_mayor_photo_url: str | None = None
    vice_mayor_bio: str | None = None
    cabinet_chief_name: str | None = None
    cabinet_chief_photo_url: str | None = None
    cabinet_chief_bio: str | None = None
    cabinet_description: str | None = None


class DepartmentCreateRequest(BaseModel):
    slug: str = Field(..., min_length=1, max_length=255)
    name: str = Field(..., min_length=1, max_length=255)
    kind: DepartmentKind = DepartmentKind.SECRETARIA
    leader_title: str = "Secretário(a)"
    secretary_name: str | None = None
    secretary_photo_url: str | None = None
    description: str | None = None
    mission: str | None = None
    vision: str | None = None
    values: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    office_hours: str | None = None
    image_url: str | None = None


class DepartmentUpdateRequest(BaseModel):
    slug: str | None = Field(default=None, min_length=1, max_length=255)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    kind: DepartmentKind | None = None
    leader_title: str | None = None
    secretary_name: str | None = None
    secretary_photo_url: str | None = None
    description: str | None = None
    mission: str | None = None
    vision: str | None = None
    values: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    office_hours: str | None = None
    image_url: str | None = None


class OfficeCreateRequest(BaseModel):
    department_id: int | None = None
    kind: OfficeKind = OfficeKind.REPARTICAO
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    office_hours: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class OfficeUpdateRequest(BaseModel):
    department_id: int | None = None
    kind: OfficeKind | None = None
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    office_hours: str | None = None
    latitude: float | None = None
    longitude: float | None = None
