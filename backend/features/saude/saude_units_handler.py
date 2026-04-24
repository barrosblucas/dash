"""Rotas públicas auxiliares da feature saude."""

from __future__ import annotations

from typing import Any, cast

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from backend.features.saude.saude_data import SQLSaudeRepository
from backend.features.saude.saude_public_support import (
    not_found,
    parse_iso_datetime,
    schedule_response,
    unit_response,
)
from backend.features.saude.saude_types import (
    SaudeSnapshotResource,
    SaudeSnapshotStatusItem,
    SaudeSyncLogResponse,
    SaudeSyncStatusResponse,
    SaudeUnitListResponse,
    SaudeUnitScheduleResponse,
)
from backend.shared.database.connection import get_db

router = APIRouter(tags=["saude"])


@router.get("/unidades", response_model=SaudeUnitListResponse)
async def list_public_units(
    tipo: str | None = Query(default=None),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> SaudeUnitListResponse:
    repo = SQLSaudeRepository(db)
    units = repo.list_units(unit_type=tipo, search=search, only_active=True)
    return SaudeUnitListResponse(
        items=[unit_response(item) for item in units],
        total=len(units),
    )


@router.get("/unidades/{unit_id}/horarios", response_model=SaudeUnitScheduleResponse)
async def get_unit_schedules(
    unit_id: int,
    db: Session = Depends(get_db),
) -> SaudeUnitScheduleResponse:
    repo = SQLSaudeRepository(db)
    unit = repo.get_unit_by_id(unit_id)
    if unit is None:
        raise not_found("Unidade não encontrada")
    return schedule_response(unit_id, repo.list_unit_schedules(unit_id))


@router.get("/sync-status", response_model=SaudeSyncStatusResponse)
async def get_sync_status(
    request: Request,
    db: Session = Depends(get_db),
) -> SaudeSyncStatusResponse:
    scheduler = getattr(request.app.state, "saude_scheduler", None)
    scheduler_status = scheduler.get_status() if scheduler is not None else {}
    repo = SQLSaudeRepository(db)
    return SaudeSyncStatusResponse(
        running=bool(scheduler_status.get("running", False)),
        next_run_at=parse_iso_datetime(scheduler_status.get("next_run_time")),
        last_success_at=repo.get_last_successful_sync_at(),
        snapshots=[
            SaudeSnapshotStatusItem(
                resource=SaudeSnapshotResource(cast(str, model.resource)),
                scope_year=cast(int | None, model.scope_year),
                synced_at=cast(Any, model.synced_at),
            )
            for model in repo.list_snapshot_models()
        ],
        recent_logs=[
            SaudeSyncLogResponse.model_validate(item)
            for item in repo.list_recent_sync_logs()
        ],
    )
