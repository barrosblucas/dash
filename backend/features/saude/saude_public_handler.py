"""Rotas públicas de dashboards da feature saude."""

from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.features.saude.saude_data import SQLSaudeRepository
from backend.features.saude.saude_public_builders import (
    build_medicamentos_estoque_response,
    build_visitas_domiciliares_response,
)
from backend.features.saude.saude_public_dashboards import (
    build_atencao_primaria_dashboard,
    build_farmacia_dashboard,
    build_hospital_dashboard,
    build_vacinacao_dashboard,
)
from backend.features.saude.saude_public_live import (
    history_payload,
)
from backend.features.saude.saude_public_structured import (
    build_structured_medicamentos_dispensados_response,
    build_structured_medicamentos_estoque_response,
    build_structured_procedimentos_tipo_response,
    build_structured_saude_bucal_response,
    max_synced_from_rows,
    rows_to_label_value,
)
from backend.features.saude.saude_snapshot_mapper import (
    chart_to_label_value_items,
    chart_to_monthly_series_items,
    filter_monthly_series_by_date_range,
    max_synced_at,
    quantitativos_to_gender_items,
    quantitativos_to_items_with_trend,
    sum_values,
)
from backend.features.saude.saude_types import (
    SaudeAtencaoPrimariaResponse,
    SaudeBucalResponse,
    SaudeFarmaciaResponse,
    SaudeHospitalResponse,
    SaudeLabelValueTrendItem,
    SaudeMedicamentosDispensadosResponse,
    SaudeMedicationStockResponse,
    SaudePerfilDemograficoResponse,
    SaudePerfilEpidemiologicoResponse,
    SaudeProcedimentosTipoResponse,
    SaudeSnapshotResource,
    SaudeTrendDirection,
    SaudeVacinacaoResponse,
    SaudeVisitasDomiciliaresResponse,
)
from backend.shared.database.connection import get_db

router = APIRouter(tags=["saude"])


@router.get("/medicamentos-estoque", response_model=SaudeMedicationStockResponse)
async def get_medicamentos_estoque(
    search: str | None = Query(default=None),
    estabelecimento: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> SaudeMedicationStockResponse:
    repo = SQLSaudeRepository(db)
    structured = build_structured_medicamentos_estoque_response(
        repo, search=search, estabelecimento=estabelecimento, page=page, page_size=page_size
    )
    if structured:
        return structured
    return build_medicamentos_estoque_response(
        repo,
        search=search,
        estabelecimento=estabelecimento,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/medicamentos-dispensados",
    response_model=SaudeMedicamentosDispensadosResponse,
)
async def get_medicamentos_dispensados(
    year: int = Query(..., ge=2000, le=2100),
    db: Session = Depends(get_db),
) -> SaudeMedicamentosDispensadosResponse:
    repo = SQLSaudeRepository(db)
    structured = build_structured_medicamentos_dispensados_response(repo, year=year)
    if structured:
        return structured
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
            mensal_payload,
            year=year,
        ),
        series_mensal_atendimentos=chart_to_monthly_series_items(
            atendimentos_payload,
            year=year,
        ),
        last_synced_at=max_synced_at(ranking_synced, mensal_synced, atendimentos_synced),
    )


@router.get("/vacinacao", response_model=SaudeVacinacaoResponse)
async def get_vacinacao(
    year: int = Query(..., ge=2000, le=2100),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> SaudeVacinacaoResponse:
    repo = SQLSaudeRepository(db)
    return await build_vacinacao_dashboard(
        repo,
        year=year,
        start_date=start_date,
        end_date=end_date,
    )


@router.get(
    "/visitas-domiciliares",
    response_model=SaudeVisitasDomiciliaresResponse,
)
async def get_visitas_domiciliares(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> SaudeVisitasDomiciliaresResponse:
    repo = SQLSaudeRepository(db)
    return await build_visitas_domiciliares_response(
        repo,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/perfil-epidemiologico", response_model=SaudePerfilEpidemiologicoResponse)
async def get_perfil_epidemiologico(
    db: Session = Depends(get_db),
) -> SaudePerfilEpidemiologicoResponse:
    repo = SQLSaudeRepository(db)
    quant_rows = repo.list_epidemiologico_rows(dataset="quantitativo")
    sexo_rows = repo.list_epidemiologico_rows(dataset="por_sexo")
    if quant_rows and sexo_rows:
        history = repo.list_snapshot_history(SaudeSnapshotResource.QUANTITATIVOS, limit=2)
        prev = history_payload(history, 1)
        pv_dict: dict[str, int] = {}
        if isinstance(prev, dict) and isinstance(prev.get("quantitativos"), dict):
            for _k, v in prev["quantitativos"].items():
                if isinstance(v, dict):
                    pv_dict[str(v.get("titulo", ""))] = int(float(str(v.get("valor", 0)).replace(",", ".")))
        items: list[SaudeLabelValueTrendItem] = []
        for r in quant_rows:
            pv = pv_dict.get(str(r.label))
            t = SaudeTrendDirection.UP if pv is not None and r.valor > pv else (SaudeTrendDirection.DOWN if pv is not None and r.valor < pv else (SaudeTrendDirection.STABLE if pv is not None else None))
            items.append(SaudeLabelValueTrendItem(label=r.label, value=r.valor, previous_value=pv, trend=t))
        return SaudePerfilEpidemiologicoResponse(
            quantitativos=items, por_sexo=rows_to_label_value(sexo_rows),
            last_synced_at=max_synced_from_rows(quant_rows, sexo_rows))
    # fallback snapshot
    payload, last_synced_at = repo.get_snapshot_payload(SaudeSnapshotResource.QUANTITATIVOS)
    history = repo.list_snapshot_history(SaudeSnapshotResource.QUANTITATIVOS, limit=2)
    sexo_payload, sexo_synced = repo.get_snapshot_payload(SaudeSnapshotResource.ATENDIMENTOS_POR_SEXO)
    por_sexo = chart_to_label_value_items(sexo_payload)
    if not por_sexo:
        por_sexo = quantitativos_to_gender_items(payload)
    return SaudePerfilEpidemiologicoResponse(
        quantitativos=quantitativos_to_items_with_trend(payload, history_payload(history, 1)),
        por_sexo=por_sexo, last_synced_at=max_synced_at(last_synced_at, sexo_synced))


@router.get("/atencao-primaria", response_model=SaudeAtencaoPrimariaResponse)
async def get_atencao_primaria(
    year: int = Query(..., ge=2000, le=2100),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> SaudeAtencaoPrimariaResponse:
    repo = SQLSaudeRepository(db)
    return await build_atencao_primaria_dashboard(
        repo,
        year=year,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/saude-bucal", response_model=SaudeBucalResponse)
async def get_saude_bucal(
    year: int = Query(..., ge=2000, le=2100),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> SaudeBucalResponse:
    repo = SQLSaudeRepository(db)
    structured = build_structured_saude_bucal_response(repo, year=year, start_date=start_date, end_date=end_date)
    if structured:
        return structured
    payload, last_synced_at = repo.get_snapshot_payload(
        SaudeSnapshotResource.SAUDE_BUCAL_ATENDIMENTOS_MENSAL
    )
    mensal = chart_to_monthly_series_items(payload, year=year)
    if start_date is not None and end_date is not None:
        mensal = filter_monthly_series_by_date_range(
            mensal,
            datetime(start_date.year, start_date.month, start_date.day),
            datetime(end_date.year, end_date.month, end_date.day),
        )
    return SaudeBucalResponse(
        year=year,
        start_date=start_date.isoformat() if start_date else None,
        end_date=end_date.isoformat() if end_date else None,
        atendimentos_por_mes=mensal,
        total_atendimentos=sum_values(mensal),
        last_synced_at=last_synced_at,
    )


@router.get("/hospital", response_model=SaudeHospitalResponse)
async def get_hospital(
    year: int = Query(..., ge=2000, le=2100),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    estabelecimento_id: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
) -> SaudeHospitalResponse:
    repo = SQLSaudeRepository(db)
    return await build_hospital_dashboard(
        repo,
        year=year,
        start_date=start_date,
        end_date=end_date,
        estabelecimento_id=estabelecimento_id,
    )


@router.get("/farmacia", response_model=SaudeFarmaciaResponse)
async def get_farmacia(
    year: int = Query(..., ge=2000, le=2100),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> SaudeFarmaciaResponse:
    repo = SQLSaudeRepository(db)
    return await build_farmacia_dashboard(
        repo,
        year=year,
        start_date=start_date,
        end_date=end_date,
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
        last_synced_at=max_synced_at(tipos_synced, pessoas_synced),
    )


@router.get("/procedimentos-tipo", response_model=SaudeProcedimentosTipoResponse)
async def get_procedimentos_tipo(
    db: Session = Depends(get_db),
) -> SaudeProcedimentosTipoResponse:
    repo = SQLSaudeRepository(db)
    structured = build_structured_procedimentos_tipo_response(repo)
    if structured:
        return structured
    payload, last_synced_at = repo.get_snapshot_payload(
        SaudeSnapshotResource.PROCEDIMENTOS_POR_TIPO
    )
    return SaudeProcedimentosTipoResponse(
        items=chart_to_label_value_items(payload),
        last_synced_at=last_synced_at,
    )
