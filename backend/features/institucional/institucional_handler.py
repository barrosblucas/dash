"""Rotas HTTP do bounded context institucional."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.features.institucional.institucional_data import (
    create_department,
    create_office,
    delete_department,
    delete_office,
    department_to_dict,
    get_department_by_id,
    get_department_by_slug,
    get_office_by_id,
    get_or_create_profile,
    list_departments,
    list_offices,
    office_to_dict,
    profile_to_gestao_dict,
    profile_to_prefeitura_dict,
    update_department,
    update_office,
    update_profile,
)
from backend.features.institucional.institucional_types import (
    DepartmentCreateRequest,
    DepartmentListResponse,
    DepartmentRecord,
    DepartmentUpdateRequest,
    GestaoResponse,
    OfficeCreateRequest,
    OfficeListResponse,
    OfficeRecord,
    OfficeUpdateRequest,
    PrefeituraResponse,
    ProfileUpdateRequest,
)
from backend.shared.database.connection import get_db
from backend.shared.security import require_admin_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/institucional", tags=["institucional"])


# --- Rotas públicas ---


@router.get(
    "/prefeitura",
    response_model=PrefeituraResponse,
    summary="Dados da prefeitura municipal",
)
async def get_prefeitura(
    db: Session = Depends(get_db),
) -> PrefeituraResponse:
    profile = get_or_create_profile(db)
    return PrefeituraResponse(**profile_to_prefeitura_dict(profile))


@router.get(
    "/gestao",
    response_model=GestaoResponse,
    summary="Dados de gestão (prefeito, vice, chefe de gabinete)",
)
async def get_gestao(
    db: Session = Depends(get_db),
) -> GestaoResponse:
    profile = get_or_create_profile(db)
    return GestaoResponse(**profile_to_gestao_dict(profile))


@router.get(
    "/secretarias",
    response_model=DepartmentListResponse,
    summary="Lista de secretarias e autarquias",
)
async def get_secretarias(
    db: Session = Depends(get_db),
) -> DepartmentListResponse:
    items, total = list_departments(db)
    return DepartmentListResponse(
        items=[DepartmentRecord(**department_to_dict(m)) for m in items],
        total=total,
    )


@router.get(
    "/secretarias/{slug}",
    response_model=DepartmentRecord,
    summary="Detalhe de uma secretaria ou autarquia por slug",
)
async def get_secretaria(
    slug: str,
    db: Session = Depends(get_db),
) -> DepartmentRecord:
    dept = get_department_by_slug(db, slug)
    if dept is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Secretaria não encontrada",
        )
    return DepartmentRecord(**department_to_dict(dept))


@router.get(
    "/reparticoes",
    response_model=OfficeListResponse,
    summary="Lista de repartições e setores",
)
async def get_reparticoes(
    db: Session = Depends(get_db),
) -> OfficeListResponse:
    items, total = list_offices(db)
    return OfficeListResponse(
        items=[OfficeRecord(**office_to_dict(m)) for m in items],
        total=total,
    )


# --- Rotas admin ---


@router.get(
    "/admin/profile",
    response_model=PrefeituraResponse,
    summary="Perfil institucional completo (admin)",
)
async def admin_get_profile(
    _: Any = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> PrefeituraResponse:
    profile = get_or_create_profile(db)
    return PrefeituraResponse(**profile_to_prefeitura_dict(profile))


@router.put(
    "/admin/profile",
    response_model=PrefeituraResponse,
    summary="Atualiza perfil institucional (admin)",
)
async def admin_update_profile(
    payload: ProfileUpdateRequest,
    _: Any = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> PrefeituraResponse:
    profile = update_profile(db, payload)
    return PrefeituraResponse(**profile_to_prefeitura_dict(profile))


@router.get(
    "/admin/secretarias",
    response_model=DepartmentListResponse,
    summary="Lista de secretarias/autarquias (admin)",
)
async def admin_list_secretarias(
    _: Any = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> DepartmentListResponse:
    items, total = list_departments(db)
    return DepartmentListResponse(
        items=[DepartmentRecord(**department_to_dict(m)) for m in items],
        total=total,
    )


@router.post(
    "/admin/secretarias",
    response_model=DepartmentRecord,
    status_code=status.HTTP_201_CREATED,
    summary="Cria nova secretaria/autarquia (admin)",
)
async def admin_create_secretaria(
    payload: DepartmentCreateRequest,
    _: Any = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> DepartmentRecord:
    dept = create_department(db, payload)
    return DepartmentRecord(**department_to_dict(dept))


@router.put(
    "/admin/secretarias/{department_id}",
    response_model=DepartmentRecord,
    summary="Atualiza secretaria/autarquia (admin)",
)
async def admin_update_secretaria(
    department_id: int,
    payload: DepartmentUpdateRequest,
    _: Any = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> DepartmentRecord:
    dept = get_department_by_id(db, department_id)
    if dept is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Secretaria não encontrada",
        )
    updated = update_department(db, dept, payload)
    return DepartmentRecord(**department_to_dict(updated))


@router.delete(
    "/admin/secretarias/{department_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Remove secretaria/autarquia (admin)",
)
async def admin_delete_secretaria(
    department_id: int,
    _: Any = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> None:
    dept = get_department_by_id(db, department_id)
    if dept is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Secretaria não encontrada",
        )
    delete_department(db, dept)


@router.get(
    "/admin/reparticoes",
    response_model=OfficeListResponse,
    summary="Lista de repartições (admin)",
)
async def admin_list_reparticoes(
    _: Any = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> OfficeListResponse:
    items, total = list_offices(db)
    return OfficeListResponse(
        items=[OfficeRecord(**office_to_dict(m)) for m in items],
        total=total,
    )


@router.post(
    "/admin/reparticoes",
    response_model=OfficeRecord,
    status_code=status.HTTP_201_CREATED,
    summary="Cria nova repartição (admin)",
)
async def admin_create_reparticao(
    payload: OfficeCreateRequest,
    _: Any = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> OfficeRecord:
    office = create_office(db, payload)
    return OfficeRecord(**office_to_dict(office))


@router.put(
    "/admin/reparticoes/{office_id}",
    response_model=OfficeRecord,
    summary="Atualiza repartição (admin)",
)
async def admin_update_reparticao(
    office_id: int,
    payload: OfficeUpdateRequest,
    _: Any = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> OfficeRecord:
    office = get_office_by_id(db, office_id)
    if office is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repartição não encontrada",
        )
    updated = update_office(db, office, payload)
    return OfficeRecord(**office_to_dict(updated))


@router.delete(
    "/admin/reparticoes/{office_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Remove repartição (admin)",
)
async def admin_delete_reparticao(
    office_id: int,
    _: Any = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> None:
    office = get_office_by_id(db, office_id)
    if office is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repartição não encontrada",
        )
    delete_office(db, office)
