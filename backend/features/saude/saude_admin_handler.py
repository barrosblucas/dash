"""Rotas administrativas do bounded context saude."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.features.saude.saude_adapter import SaudeExternalAPIError
from backend.features.saude.saude_data import SQLSaudeRepository
from backend.features.saude.saude_public_support import (
    external_error,
    not_found,
    schedule_response,
    unit_response,
)
from backend.features.saude.saude_sync import SaudeSyncService
from backend.features.saude.saude_types import (
    SaudeImportResponse,
    SaudeSyncRequest,
    SaudeSyncResponse,
    SaudeSyncTriggerType,
    SaudeUnitCreateRequest,
    SaudeUnitListResponse,
    SaudeUnitResponse,
    SaudeUnitScheduleResponse,
    SaudeUnitScheduleUpdateRequest,
    SaudeUnitUpdateRequest,
)
from backend.shared.database.connection import get_db
from backend.shared.database.models import UserModel
from backend.shared.security import require_admin_user

router = APIRouter(tags=["saude"])


@router.get("/admin/unidades", response_model=SaudeUnitListResponse)
async def list_admin_units(
    tipo: str | None = Query(default=None),
    search: str | None = Query(default=None),
    ativo: bool | None = Query(default=None),
    _: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> SaudeUnitListResponse:
    repo = SQLSaudeRepository(db)
    units = repo.list_units(unit_type=tipo, search=search, is_active=ativo)
    return SaudeUnitListResponse(
        items=[unit_response(item) for item in units],
        total=len(units),
    )


@router.post(
    "/admin/unidades",
    response_model=SaudeUnitResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_unit(
    payload: SaudeUnitCreateRequest,
    _: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> SaudeUnitResponse:
    repo = SQLSaudeRepository(db)
    return unit_response(repo.create_unit(payload))


@router.put("/admin/unidades/{unit_id}", response_model=SaudeUnitResponse)
async def update_unit(
    unit_id: int,
    payload: SaudeUnitUpdateRequest,
    _: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> SaudeUnitResponse:
    repo = SQLSaudeRepository(db)
    model = repo.get_unit_by_id(unit_id)
    if model is None:
        raise not_found("Unidade não encontrada")
    return unit_response(repo.update_unit(model, payload))


@router.delete("/admin/unidades/{unit_id}")
async def delete_unit(
    unit_id: int,
    _: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    repo = SQLSaudeRepository(db)
    model = repo.get_unit_by_id(unit_id)
    if model is None:
        raise not_found("Unidade não encontrada")
    repo.deactivate_unit(model)
    return {"message": "Unidade desativada com sucesso"}


@router.put(
    "/admin/unidades/{unit_id}/horarios",
    response_model=SaudeUnitScheduleResponse,
)
async def update_unit_schedules(
    unit_id: int,
    payload: SaudeUnitScheduleUpdateRequest,
    _: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> SaudeUnitScheduleResponse:
    repo = SQLSaudeRepository(db)
    unit = repo.get_unit_by_id(unit_id)
    if unit is None:
        raise not_found("Unidade não encontrada")
    rows = repo.replace_unit_schedules(unit_id, payload.schedules)
    return schedule_response(unit_id, rows)


@router.post("/admin/unidades/importar-esaude", response_model=SaudeImportResponse)
async def import_units_from_esaude(
    _: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> SaudeImportResponse:
    repo = SQLSaudeRepository(db)
    service = SaudeSyncService()
    try:
        imported, updated, total = await service.import_units(repo)
    except SaudeExternalAPIError as exc:
        raise external_error(exc) from exc
    return SaudeImportResponse(imported=imported, updated=updated, total=total)


@router.post("/admin/sync", response_model=SaudeSyncResponse)
async def trigger_saude_sync(
    payload: SaudeSyncRequest,
    _: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> SaudeSyncResponse:
    repo = SQLSaudeRepository(db)
    service = SaudeSyncService()
    try:
        return await service.sync(repo, payload, trigger_type=SaudeSyncTriggerType.MANUAL)
    except SaudeExternalAPIError as exc:
        raise external_error(exc) from exc
