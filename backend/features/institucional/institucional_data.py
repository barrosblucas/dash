"""Persistência SQL do bounded context institucional."""

from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from backend.features.institucional.institucional_types import (
    DepartmentCreateRequest,
    DepartmentUpdateRequest,
    OfficeCreateRequest,
    OfficeUpdateRequest,
    ProfileUpdateRequest,
    SocialLinkItem,
)
from backend.shared.database.institucional_models import (
    DepartmentModel,
    OfficeModel,
    ProfileInstitucionalModel,
)

logger = logging.getLogger(__name__)


def _datetime_str(dt: datetime | None) -> str:
    if dt is None:
        return ""
    return dt.isoformat()


def _social_links_from_json(raw: str | None) -> list[dict[str, str]]:
    if not raw:
        return []
    try:
        return list(json.loads(raw))
    except (json.JSONDecodeError, TypeError):
        return []


def _social_links_to_json(
    links: list[dict[str, str]] | list[SocialLinkItem] | None,
) -> str | None:
    if links is None:
        return None
    result: list[dict[str, str]] = []
    for link in links:
        if isinstance(link, dict):
            result.append({"label": link.get("label", ""), "url": link.get("url", "")})
        else:
            result.append({"label": link.label, "url": link.url})
    return json.dumps(result, ensure_ascii=False)


# --- Profile ---


def get_profile(db: Session) -> ProfileInstitucionalModel | None:
    return db.query(ProfileInstitucionalModel).first()


def get_or_create_profile(db: Session) -> ProfileInstitucionalModel:
    profile = get_profile(db)
    if profile is None:
        profile = ProfileInstitucionalModel(city_hall_name="")
        db.add(profile)
        db.flush()
        db.refresh(profile)
    return profile


def update_profile(
    db: Session, payload: ProfileUpdateRequest
) -> ProfileInstitucionalModel:
    profile = get_or_create_profile(db)
    updates = payload.model_dump(exclude_unset=True)
    if "social_links" in updates:
        links = updates.pop("social_links")
        updates["social_links_json"] = _social_links_to_json(links)
    for field, value in updates.items():
        setattr(profile, field, value)
    db.flush()
    db.refresh(profile)
    return profile


def profile_to_prefeitura_dict(model: ProfileInstitucionalModel) -> dict[str, Any]:
    return {
        "city_hall_name": model.city_hall_name,
        "description": model.description,
        "image_url": model.image_url,
        "contact": {
            "address": model.address,
            "phone": model.phone,
            "email": model.email,
            "office_hours": model.office_hours,
        },
        "social_links": _social_links_from_json(model.social_links_json),  # type: ignore[arg-type]
        "updated_at": _datetime_str(model.updated_at),  # type: ignore[arg-type]
    }


def profile_to_gestao_dict(model: ProfileInstitucionalModel) -> dict[str, Any]:
    return {
        "mayor": {
            "role": "Prefeito(a)",
            "name": model.mayor_name,
            "photo_url": model.mayor_photo_url,
            "bio": model.mayor_bio,
        },
        "vice_mayor": {
            "role": "Vice-Prefeito(a)",
            "name": model.vice_mayor_name,
            "photo_url": model.vice_mayor_photo_url,
            "bio": model.vice_mayor_bio,
        },
        "cabinet_chief": {
            "role": "Chefe de Gabinete",
            "name": model.cabinet_chief_name,
            "photo_url": model.cabinet_chief_photo_url,
            "bio": model.cabinet_chief_bio,
        },
        "cabinet_description": model.cabinet_description,
        "updated_at": _datetime_str(model.updated_at),  # type: ignore[arg-type]
    }


# --- Departments ---


def list_departments(db: Session) -> tuple[list[DepartmentModel], int]:
    items = db.query(DepartmentModel).order_by(DepartmentModel.name).all()
    return items, len(items)


def get_department_by_slug(db: Session, slug: str) -> DepartmentModel | None:
    return db.query(DepartmentModel).filter(DepartmentModel.slug == slug).first()


def get_department_by_id(db: Session, department_id: int) -> DepartmentModel | None:
    return db.query(DepartmentModel).filter(DepartmentModel.id == department_id).first()


def create_department(db: Session, payload: DepartmentCreateRequest) -> DepartmentModel:
    dept = DepartmentModel(**payload.model_dump())
    db.add(dept)
    db.flush()
    db.refresh(dept)
    return dept


def update_department(
    db: Session, department: DepartmentModel, payload: DepartmentUpdateRequest
) -> DepartmentModel:
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(department, field, value)
    db.flush()
    db.refresh(department)
    return department


def delete_department(db: Session, department: DepartmentModel) -> None:
    db.delete(department)
    db.flush()


def department_to_dict(model: DepartmentModel) -> dict[str, Any]:
    return {
        "id": model.id,
        "slug": model.slug,
        "name": model.name,
        "kind": model.kind,
        "leader_title": model.leader_title,
        "secretary_name": model.secretary_name,
        "secretary_photo_url": model.secretary_photo_url,
        "description": model.description,
        "mission": model.mission,
        "vision": model.vision,
        "values": model.values,
        "phone": model.phone,
        "email": model.email,
        "address": model.address,
        "office_hours": model.office_hours,
        "image_url": model.image_url,
        "updated_at": _datetime_str(model.updated_at),  # type: ignore[arg-type]
    }


# --- Offices ---


def list_offices(db: Session) -> tuple[list[OfficeModel], int]:
    items = db.query(OfficeModel).order_by(OfficeModel.name).all()
    return items, len(items)


def get_office_by_id(db: Session, office_id: int) -> OfficeModel | None:
    return db.query(OfficeModel).filter(OfficeModel.id == office_id).first()


def create_office(db: Session, payload: OfficeCreateRequest) -> OfficeModel:
    office = OfficeModel(**payload.model_dump())
    db.add(office)
    db.flush()
    db.refresh(office)
    return office


def update_office(
    db: Session, office: OfficeModel, payload: OfficeUpdateRequest
) -> OfficeModel:
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(office, field, value)
    db.flush()
    db.refresh(office)
    return office


def delete_office(db: Session, office: OfficeModel) -> None:
    db.delete(office)
    db.flush()


def office_to_dict(model: OfficeModel) -> dict[str, Any]:
    dept_name: str | None = None
    dept_slug: str | None = None
    if model.department is not None:
        dept_name = model.department.name
        dept_slug = model.department.slug
    return {
        "id": model.id,
        "department_id": model.department_id,
        "department_name": dept_name,
        "department_slug": dept_slug,
        "kind": model.kind,
        "name": model.name,
        "description": model.description,
        "phone": model.phone,
        "email": model.email,
        "address": model.address,
        "office_hours": model.office_hours,
        "latitude": model.latitude,
        "longitude": model.longitude,
        "updated_at": _datetime_str(model.updated_at),  # type: ignore[arg-type]
    }
