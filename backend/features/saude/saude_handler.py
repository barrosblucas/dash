"""Rotas HTTP do bounded context saude."""

from __future__ import annotations

from datetime import datetime
from typing import Any, cast

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from backend.features.saude.saude_adapter import SaudeExternalAPIError
from backend.features.saude.saude_business import (
    SaudeSyncService,
    chart_to_label_value_items,
    chart_to_monthly_series_items,
    quantitativos_to_gender_items,
    quantitativos_to_items,
)
from backend.features.saude.saude_data import SQLSaudeRepository
from backend.features.saude.saude_types import (
    SaudeImportResponse,
    SaudeMedicamentosDispensadosResponse,
    SaudeMedicationItem,
    SaudeMedicationStockResponse,
    SaudePerfilDemograficoResponse,
    SaudePerfilEpidemiologicoResponse,
    SaudeProcedimentosTipoResponse,
    SaudeSnapshotResource,
    SaudeSnapshotStatusItem,
    SaudeSyncLogResponse,
    SaudeSyncRequest,
    SaudeSyncResponse,
    SaudeSyncStatusResponse,
    SaudeSyncTriggerType,
    SaudeUnitCreateRequest,
    SaudeUnitListResponse,
    SaudeUnitResponse,
    SaudeUnitScheduleItem,
    SaudeUnitScheduleResponse,
    SaudeUnitScheduleUpdateRequest,
    SaudeUnitUpdateRequest,
)
from backend.shared.database.connection import get_db
from backend.shared.database.models import (
    SaudeUnidadeHorarioModel,
    SaudeUnidadeModel,
    UserModel,
)
from backend.shared.security import require_admin_user

router = APIRouter(prefix="/saude", tags=["saude"])


def _unit_response(model: SaudeUnidadeModel) -> SaudeUnitResponse:
    return SaudeUnitResponse.model_validate(model)


def _schedule_response(
    unit_id: int, rows: list[SaudeUnidadeHorarioModel]
) -> SaudeUnitScheduleResponse:
    return SaudeUnitScheduleResponse(
        unit_id=unit_id,
        schedules=[
            SaudeUnitScheduleItem(
                day_of_week=cast(Any, row.day_of_week),
                opens_at=row.opens_at,
                closes_at=row.closes_at,
                is_closed=bool(row.is_closed),
            )
            for row in rows
        ],
    )


def _max_synced_at(*timestamps: datetime | None) -> datetime | None:
    values = [item for item in timestamps if item is not None]
    return max(values) if values else None


def _not_found(message: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)


def _external_error(exc: SaudeExternalAPIError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=exc.message)


@router.get("/medicamentos-estoque", response_model=SaudeMedicationStockResponse)
async def get_medicamentos_estoque(
    search: str | None = Query(default=None),
    estabelecimento: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> SaudeMedicationStockResponse:
    repo = SQLSaudeRepository(db)
    payload, last_synced_at = repo.get_snapshot_payload(
        SaudeSnapshotResource.MEDICAMENTOS_ESTOQUE
    )
    medicamentos = payload.get("medicamentos", []) if isinstance(payload, dict) else []
    filtered = []
    for item in medicamentos:
        if not isinstance(item, dict):
            continue
        if (
            search
            and search.lower() not in str(item.get("nome_do_produto", "")).lower()
        ):
            continue
        if (
            estabelecimento
            and estabelecimento.lower()
            not in str(item.get("estabelecimento", "")).lower()
        ):
            continue
        below_minimum = False
        minimum_stock = item.get("estoque_minimo")
        try:
            below_minimum = minimum_stock is not None and int(
                item.get("em_estoque", 0)
            ) < int(minimum_stock)
        except (TypeError, ValueError):
            below_minimum = False
        filtered.append(
            SaudeMedicationItem(
                product_name=str(item.get("nome_do_produto") or ""),
                unit=_nullable_string(item.get("unidade_do_produto")),
                in_stock=_coerce_int(item.get("em_estoque")),
                minimum_stock=_coerce_optional_int(minimum_stock),
                department=_nullable_string(item.get("departamento")),
                establishment=_nullable_string(item.get("estabelecimento")),
                below_minimum=below_minimum,
            )
        )
    start = (page - 1) * page_size
    end = start + page_size
    return SaudeMedicationStockResponse(
        items=filtered[start:end],
        total=len(filtered),
        page=page,
        page_size=page_size,
        total_abaixo_minimo=sum(1 for item in filtered if item.below_minimum),
        last_synced_at=last_synced_at,
    )


@router.get(
    "/medicamentos-dispensados", response_model=SaudeMedicamentosDispensadosResponse
)
async def get_medicamentos_dispensados(
    year: int = Query(..., ge=2000, le=2100),
    db: Session = Depends(get_db),
) -> SaudeMedicamentosDispensadosResponse:
    repo = SQLSaudeRepository(db)
    ranking_payload, ranking_synced = repo.get_snapshot_payload(
        SaudeSnapshotResource.MEDICAMENTOS_RANKING
    )
    mensal_payload, mensal_synced = repo.get_snapshot_payload(
        SaudeSnapshotResource.MEDICAMENTOS_DISPENSADOS_MENSAL
    )
    atendimentos_payload, atendimentos_synced = repo.get_snapshot_payload(
        SaudeSnapshotResource.MEDICAMENTOS_ATENDIMENTOS_MENSAL,
        year,
    )
    return SaudeMedicamentosDispensadosResponse(
        ranking=chart_to_label_value_items(ranking_payload),
        series_mensal_dispensacao=chart_to_monthly_series_items(
            mensal_payload, year=year
        ),
        series_mensal_atendimentos=chart_to_monthly_series_items(
            atendimentos_payload, year=year
        ),
        last_synced_at=_max_synced_at(
            ranking_synced, mensal_synced, atendimentos_synced
        ),
    )


@router.get("/perfil-epidemiologico", response_model=SaudePerfilEpidemiologicoResponse)
async def get_perfil_epidemiologico(
    db: Session = Depends(get_db),
) -> SaudePerfilEpidemiologicoResponse:
    repo = SQLSaudeRepository(db)
    payload, last_synced_at = repo.get_snapshot_payload(
        SaudeSnapshotResource.QUANTITATIVOS
    )
    return SaudePerfilEpidemiologicoResponse(
        quantitativos=quantitativos_to_items(payload),
        por_sexo=quantitativos_to_gender_items(payload),
        last_synced_at=last_synced_at,
    )


@router.get("/perfil-demografico", response_model=SaudePerfilDemograficoResponse)
async def get_perfil_demografico(
    year: int = Query(..., ge=2000, le=2100),
    db: Session = Depends(get_db),
) -> SaudePerfilDemograficoResponse:
    repo = SQLSaudeRepository(db)
    tipos_payload, tipos_synced = repo.get_snapshot_payload(
        SaudeSnapshotResource.PESSOAS_FISICAS_JURIDICAS
    )
    pessoas_payload, pessoas_synced = repo.get_snapshot_payload(
        SaudeSnapshotResource.PESSOAS_POR_MES
    )
    return SaudePerfilDemograficoResponse(
        tipos_pessoa=chart_to_label_value_items(tipos_payload),
        pessoas_por_mes=chart_to_monthly_series_items(pessoas_payload, year=year),
        last_synced_at=_max_synced_at(tipos_synced, pessoas_synced),
    )


@router.get("/procedimentos-tipo", response_model=SaudeProcedimentosTipoResponse)
async def get_procedimentos_tipo(
    db: Session = Depends(get_db),
) -> SaudeProcedimentosTipoResponse:
    repo = SQLSaudeRepository(db)
    payload, last_synced_at = repo.get_snapshot_payload(
        SaudeSnapshotResource.PROCEDIMENTOS_POR_TIPO
    )
    return SaudeProcedimentosTipoResponse(
        items=chart_to_label_value_items(payload),
        last_synced_at=last_synced_at,
    )


@router.get("/unidades", response_model=SaudeUnitListResponse)
async def list_public_units(
    tipo: str | None = Query(default=None),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> SaudeUnitListResponse:
    repo = SQLSaudeRepository(db)
    units = repo.list_units(unit_type=tipo, search=search, only_active=True)
    return SaudeUnitListResponse(
        items=[_unit_response(item) for item in units], total=len(units)
    )


@router.get("/unidades/{unit_id}/horarios", response_model=SaudeUnitScheduleResponse)
async def get_unit_schedules(
    unit_id: int, db: Session = Depends(get_db)
) -> SaudeUnitScheduleResponse:
    repo = SQLSaudeRepository(db)
    unit = repo.get_unit_by_id(unit_id)
    if unit is None:
        raise _not_found("Unidade não encontrada")
    return _schedule_response(unit_id, repo.list_unit_schedules(unit_id))


@router.get("/sync-status", response_model=SaudeSyncStatusResponse)
async def get_sync_status(
    request: Request, db: Session = Depends(get_db)
) -> SaudeSyncStatusResponse:
    scheduler = getattr(request.app.state, "saude_scheduler", None)
    scheduler_status = scheduler.get_status() if scheduler is not None else {}
    next_run_at = _parse_iso_datetime(scheduler_status.get("next_run_time"))
    repo = SQLSaudeRepository(db)
    snapshots = [
        SaudeSnapshotStatusItem(
            resource=SaudeSnapshotResource(cast(str, model.resource)),
            scope_year=model.scope_year,
            synced_at=model.synced_at,
        )
        for model in repo.list_snapshot_models()
    ]
    recent_logs = [
        SaudeSyncLogResponse.model_validate(item)
        for item in repo.list_recent_sync_logs()
    ]
    return SaudeSyncStatusResponse(
        running=bool(scheduler_status.get("running", False)),
        next_run_at=next_run_at,
        last_success_at=repo.get_last_successful_sync_at(),
        snapshots=snapshots,
        recent_logs=recent_logs,
    )


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
        items=[_unit_response(item) for item in units], total=len(units)
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
    model = repo.create_unit(payload)
    return _unit_response(model)


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
        raise _not_found("Unidade não encontrada")
    updated = repo.update_unit(model, payload)
    return _unit_response(updated)


@router.delete("/admin/unidades/{unit_id}")
async def delete_unit(
    unit_id: int,
    _: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    repo = SQLSaudeRepository(db)
    model = repo.get_unit_by_id(unit_id)
    if model is None:
        raise _not_found("Unidade não encontrada")
    repo.deactivate_unit(model)
    return {"message": "Unidade desativada com sucesso"}


@router.put(
    "/admin/unidades/{unit_id}/horarios", response_model=SaudeUnitScheduleResponse
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
        raise _not_found("Unidade não encontrada")
    rows = repo.replace_unit_schedules(unit_id, payload.schedules)
    return _schedule_response(unit_id, rows)


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
        raise _external_error(exc) from exc
    return SaudeImportResponse(imported=imported, updated=updated, total=total)


@router.post("/admin/sync", response_model=SaudeSyncResponse)
async def trigger_saude_sync(
    request: Request,
    payload: SaudeSyncRequest,
    _: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> SaudeSyncResponse:
    scheduler = getattr(request.app.state, "saude_scheduler", None)
    if scheduler is not None:
        result = await scheduler.trigger_manual(payload)
        return SaudeSyncResponse.model_validate(result)
    repo = SQLSaudeRepository(db)
    service = SaudeSyncService()
    return await service.sync(repo, payload, trigger_type=SaudeSyncTriggerType.MANUAL)


def _parse_iso_datetime(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def _nullable_string(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _coerce_int(value: Any) -> int:
    try:
        return int(float(str(value)))
    except (TypeError, ValueError):
        return 0


def _coerce_optional_int(value: Any) -> int | None:
    if value in (None, ""):
        return None
    return _coerce_int(value)
