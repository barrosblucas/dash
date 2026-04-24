"""Rotas públicas de dashboards da feature saude."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.features.saude.saude_data import SQLSaudeRepository
from backend.features.saude.saude_public_live import (
    history_payload,
    load_atencao_primaria_cbo,
    load_hospital_payload,
)
from backend.features.saude.saude_public_support import (
    below_minimum,
    coerce_int,
    coerce_optional_int,
    matches_medicamento,
    nullable_string,
)
from backend.features.saude.saude_snapshot_mapper import (
    chart_to_label_value_items,
    chart_to_monthly_series_items,
    hospital_censo_from_payload,
    hospital_table_to_items,
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
    SaudeMedicamentosDispensadosResponse,
    SaudeMedicationItem,
    SaudeMedicationStockResponse,
    SaudePerfilDemograficoResponse,
    SaudePerfilEpidemiologicoResponse,
    SaudeProcedimentosTipoResponse,
    SaudeSnapshotResource,
    SaudeVacinacaoResponse,
    SaudeVisitasDomiciliaresResponse,
)
from backend.shared.database.connection import get_db

router = APIRouter(tags=["saude"])

_UNAVAILABLE_HOSPITAL_RESOURCES = [
    "internacoes_por_mes",
    "internacoes_por_cid",
    "media_permanencia",
]


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
        if not isinstance(item, dict) or not matches_medicamento(
            item, search=search, estabelecimento=estabelecimento
        ):
            continue
        minimum_stock = item.get("estoque_minimo")
        filtered.append(
            SaudeMedicationItem(
                product_name=str(item.get("nome_do_produto") or ""),
                unit=nullable_string(item.get("unidade_do_produto")),
                in_stock=coerce_int(item.get("em_estoque")),
                minimum_stock=coerce_optional_int(minimum_stock),
                department=nullable_string(item.get("departamento")),
                establishment=nullable_string(item.get("estabelecimento")),
                below_minimum=below_minimum(item.get("em_estoque"), minimum_stock),
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
    "/medicamentos-dispensados",
    response_model=SaudeMedicamentosDispensadosResponse,
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
    db: Session = Depends(get_db),
) -> SaudeVacinacaoResponse:
    repo = SQLSaudeRepository(db)
    mensal_payload, mensal_synced = repo.get_snapshot_payload(
        SaudeSnapshotResource.VACINAS_POR_MES,
        year,
    )
    ranking_payload, ranking_synced = repo.get_snapshot_payload(
        SaudeSnapshotResource.VACINAS_RANKING
    )
    mensal = chart_to_monthly_series_items(mensal_payload, year=year)
    return SaudeVacinacaoResponse(
        aplicadas_por_mes=mensal,
        ranking_vacinas=chart_to_label_value_items(ranking_payload),
        total_aplicadas=sum_values(mensal),
        last_synced_at=max_synced_at(mensal_synced, ranking_synced),
    )


@router.get(
    "/visitas-domiciliares",
    response_model=SaudeVisitasDomiciliaresResponse,
)
async def get_visitas_domiciliares(
    db: Session = Depends(get_db),
) -> SaudeVisitasDomiciliaresResponse:
    repo = SQLSaudeRepository(db)
    motivos, motivos_synced = repo.get_snapshot_payload(SaudeSnapshotResource.VISITAS_MOTIVOS)
    acompanhamento, acompanhamento_synced = repo.get_snapshot_payload(
        SaudeSnapshotResource.VISITAS_ACOMPANHAMENTO
    )
    busca_ativa, busca_ativa_synced = repo.get_snapshot_payload(
        SaudeSnapshotResource.VISITAS_BUSCA_ATIVA
    )
    controle, controle_synced = repo.get_snapshot_payload(
        SaudeSnapshotResource.VISITAS_CONTROLE_VETORIAL
    )
    return SaudeVisitasDomiciliaresResponse(
        motivos_visita=chart_to_label_value_items(motivos),
        acompanhamento=chart_to_label_value_items(acompanhamento),
        busca_ativa=chart_to_label_value_items(busca_ativa),
        controle_vetorial=chart_to_label_value_items(controle),
        last_synced_at=max_synced_at(
            motivos_synced,
            acompanhamento_synced,
            busca_ativa_synced,
            controle_synced,
        ),
    )


@router.get("/perfil-epidemiologico", response_model=SaudePerfilEpidemiologicoResponse)
async def get_perfil_epidemiologico(
    db: Session = Depends(get_db),
) -> SaudePerfilEpidemiologicoResponse:
    repo = SQLSaudeRepository(db)
    payload, last_synced_at = repo.get_snapshot_payload(SaudeSnapshotResource.QUANTITATIVOS)
    history = repo.list_snapshot_history(SaudeSnapshotResource.QUANTITATIVOS, limit=2)
    sexo_payload, sexo_synced = repo.get_snapshot_payload(
        SaudeSnapshotResource.ATENDIMENTOS_POR_SEXO
    )
    por_sexo = chart_to_label_value_items(sexo_payload)
    if not por_sexo:
        por_sexo = quantitativos_to_gender_items(payload)
    return SaudePerfilEpidemiologicoResponse(
        quantitativos=quantitativos_to_items_with_trend(
            payload,
            history_payload(history, 1),
        ),
        por_sexo=por_sexo,
        last_synced_at=max_synced_at(last_synced_at, sexo_synced),
    )


@router.get("/atencao-primaria", response_model=SaudeAtencaoPrimariaResponse)
async def get_atencao_primaria(
    year: int = Query(..., ge=2000, le=2100),
    start_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> SaudeAtencaoPrimariaResponse:
    effective_start_date = start_date or date(year, 1, 1)
    repo = SQLSaudeRepository(db)
    mensal_payload, mensal_synced = repo.get_snapshot_payload(
        SaudeSnapshotResource.ATENCAO_PRIMARIA_ATENDIMENTOS_MENSAL,
        year,
    )
    procedimentos_payload, procedimentos_synced = repo.get_snapshot_payload(
        SaudeSnapshotResource.ATENCAO_PRIMARIA_PROCEDIMENTOS
    )
    cbo_payload, cbo_synced = await load_atencao_primaria_cbo(
        repo,
        year=year,
        start_date=effective_start_date,
    )
    return SaudeAtencaoPrimariaResponse(
        year=year,
        start_date=effective_start_date.isoformat(),
        atendimentos_por_mes=chart_to_monthly_series_items(mensal_payload, year=year),
        procedimentos_por_especialidade=chart_to_label_value_items(procedimentos_payload),
        atendimentos_por_cbo=chart_to_label_value_items(cbo_payload),
        last_synced_at=max_synced_at(mensal_synced, procedimentos_synced, cbo_synced),
    )


@router.get("/saude-bucal", response_model=SaudeBucalResponse)
async def get_saude_bucal(
    year: int = Query(..., ge=2000, le=2100),
    db: Session = Depends(get_db),
) -> SaudeBucalResponse:
    repo = SQLSaudeRepository(db)
    payload, last_synced_at = repo.get_snapshot_payload(
        SaudeSnapshotResource.SAUDE_BUCAL_ATENDIMENTOS_MENSAL
    )
    mensal = chart_to_monthly_series_items(payload, year=year)
    return SaudeBucalResponse(
        year=year,
        atendimentos_por_mes=mensal,
        total_atendimentos=sum_values(mensal),
        last_synced_at=last_synced_at,
    )


@router.get("/hospital", response_model=SaudeHospitalResponse)
async def get_hospital(
    estabelecimento_id: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
) -> SaudeHospitalResponse:
    repo = SQLSaudeRepository(db)
    censo_payload, censo_synced = await load_hospital_payload(
        repo,
        SaudeSnapshotResource.HOSPITAL_CENSO,
        estabelecimento_id=estabelecimento_id,
    )
    procedimentos_payload, procedimentos_synced = await load_hospital_payload(
        repo,
        SaudeSnapshotResource.HOSPITAL_PROCEDIMENTOS,
        estabelecimento_id=estabelecimento_id,
    )
    mensal_payload, mensal_synced = await load_hospital_payload(
        repo,
        SaudeSnapshotResource.HOSPITAL_ATENDIMENTOS_MENSAL,
        estabelecimento_id=estabelecimento_id,
    )
    procedimentos_realizados, total_procedimentos = hospital_table_to_items(
        procedimentos_payload
    )
    return SaudeHospitalResponse(
        estabelecimento_id=estabelecimento_id,
        censo=hospital_censo_from_payload(censo_payload),
        procedimentos_realizados=procedimentos_realizados,
        total_procedimentos=total_procedimentos,
        atendimentos_por_mes=chart_to_monthly_series_items(mensal_payload),
        internacoes_por_mes=[],
        internacoes_por_cid=[],
        media_permanencia=[],
        recursos_indisponiveis=_UNAVAILABLE_HOSPITAL_RESOURCES,
        last_synced_at=max_synced_at(censo_synced, procedimentos_synced, mensal_synced),
    )


@router.get("/farmacia", response_model=SaudeFarmaciaResponse)
async def get_farmacia(
    year: int = Query(..., ge=2000, le=2100),
    db: Session = Depends(get_db),
) -> SaudeFarmaciaResponse:
    repo = SQLSaudeRepository(db)
    dispensados_payload, dispensados_synced = repo.get_snapshot_payload(
        SaudeSnapshotResource.MEDICAMENTOS_DISPENSADOS_MENSAL
    )
    atendimentos_payload, atendimentos_synced = repo.get_snapshot_payload(
        SaudeSnapshotResource.MEDICAMENTOS_ATENDIMENTOS_MENSAL,
        year,
    )
    atendimentos_por_mes = chart_to_monthly_series_items(atendimentos_payload, year=year)
    medicamentos_dispensados_por_mes = chart_to_monthly_series_items(
        dispensados_payload,
        year=year,
    )
    return SaudeFarmaciaResponse(
        year=year,
        atendimentos_por_mes=atendimentos_por_mes,
        medicamentos_dispensados_por_mes=medicamentos_dispensados_por_mes,
        total_atendimentos=sum_values(atendimentos_por_mes),
        total_dispensados=sum_values(medicamentos_dispensados_por_mes),
        last_synced_at=max_synced_at(dispensados_synced, atendimentos_synced),
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
    payload, last_synced_at = repo.get_snapshot_payload(
        SaudeSnapshotResource.PROCEDIMENTOS_POR_TIPO
    )
    return SaudeProcedimentosTipoResponse(
        items=chart_to_label_value_items(payload),
        last_synced_at=last_synced_at,
    )
