"""
Rotas de controle do pipeline de scraping.

Endpoints para consultar status, disparar scraping manual
e visualizar histórico de execuções.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, cast

from fastapi import APIRouter, Query, Request
from sqlalchemy import func as sa_func

from backend.features.scraping.scraping_types import (
    ScrapingHistoryResponse,
    ScrapingLogResponse,
    ScrapingStatusResponse,
    ScrapingTriggerRequest,
    ScrapingTriggerResponse,
)
from backend.shared.database.connection import db_manager
from backend.shared.database.models import ScrapingLogModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scraping", tags=["scraping"])


# ---------------------------------------------------------------------------
# GET /api/v1/scraping/status
# ---------------------------------------------------------------------------


@router.get("/status", response_model=ScrapingStatusResponse)
async def get_scraping_status(request: Request) -> ScrapingStatusResponse:
    """Retorna o status atual do scheduler e do último scraping.

    Consulta o scheduler (via app.state) e o banco para montar
    o snapshot de status de receitas e despesas.
    """
    scheduler = getattr(request.app.state, "scraping_scheduler", None)

    # Scheduler indisponível — retorna status mínimo
    if scheduler is None:
        logger.warning("Scheduler de scraping não disponível nesta instância")
        return ScrapingStatusResponse(
            last_run=None,
            next_run=None,
            receitas_status="unavailable",
            despesas_status="unavailable",
            receitas_records=0,
            despesas_records=0,
            errors=["Scheduler não inicializado"],
        )

    # Coleta dados do scheduler
    scheduler_status: dict[str, Any] = scheduler.get_status()
    last_result: dict[str, Any] | None = scheduler_status.get("last_run_result")

    # Faz o parse do next_run_time (string ISO ou None)
    next_run: datetime | None = None
    raw_next = scheduler_status.get("next_run_time")
    if raw_next is not None:
        try:
            next_run = datetime.fromisoformat(raw_next)
        except (ValueError, TypeError):
            logger.warning("Falha ao parsear next_run_time: %s", raw_next)

    # Determina status de cada tipo de dado a partir do último resultado
    receitas_status = "unknown"
    despesas_status = "unknown"
    receitas_records = 0
    despesas_records = 0
    errors: list[str] = []

    if last_result is not None:
        overall = last_result.get("status", "unknown")
        receitas_records = last_result.get("receitas_processed", 0)
        despesas_records = last_result.get("despesas_processed", 0)
        errors = last_result.get("errors", [])

        # Mapeia status global para cada tipo de dado
        if overall == "SUCCESS":
            receitas_status = "success"
            despesas_status = "success"
        elif overall == "PARTIAL":
            # Pelo menos um dos dois teve sucesso
            receitas_status = "success" if receitas_records > 0 else "no_data"
            despesas_status = "success" if despesas_records > 0 else "no_data"
        elif overall == "error":
            receitas_status = "error"
            despesas_status = "error"

    # Tenta obter timestamp da última execução bem-sucedida no banco
    last_run: datetime | None = None
    try:
        with db_manager.get_session() as session:
            latest_log = (
                session.query(ScrapingLogModel)
                .filter(ScrapingLogModel.status == "SUCCESS")
                .order_by(ScrapingLogModel.started_at.desc())
                .first()
            )
            if latest_log is not None:
                last_run = cast(datetime, latest_log.started_at)
    except Exception:
        logger.exception("Erro ao buscar último log de scraping no banco")

    return ScrapingStatusResponse(
        last_run=last_run,
        next_run=next_run,
        receitas_status=receitas_status,
        despesas_status=despesas_status,
        receitas_records=receitas_records,
        despesas_records=despesas_records,
        errors=errors,
    )


# ---------------------------------------------------------------------------
# POST /api/v1/scraping/trigger
# ---------------------------------------------------------------------------


@router.post("/trigger", response_model=ScrapingTriggerResponse)
async def trigger_scraping(
    request: Request,
    payload: ScrapingTriggerRequest,
) -> ScrapingTriggerResponse:
    """Dispara scraping manualmente para o ano e tipo de dado solicitado.

    Delega a execução para o scheduler, que instancia o serviço
    e retorna o resultado completo.
    """
    scheduler = getattr(request.app.state, "scraping_scheduler", None)

    if scheduler is None:
        logger.error("Tentativa de trigger sem scheduler disponível")
        return ScrapingTriggerResponse(
            status="error",
            message="Scheduler de scraping não está disponível",
            receitas_processed=0,
            despesas_processed=0,
            errors=["Scheduler não inicializado"],
        )

    logger.info(
        "Trigger manual de scraping — year=%d data_type=%s run_historical=%s",
        payload.year,
        payload.data_type,
        payload.run_historical,
    )

    if payload.run_historical:
        result = await scheduler.trigger_historical_bootstrap()
        status_val = result.get("status", "unknown")
        message = (
            f"Bootstrap histórico concluído: "
            f"{result.get('total_years', 0)} anos processados"
        )
        errors = result.get("errors", [])
        return ScrapingTriggerResponse(
            status=status_val,
            message=message,
            receitas_processed=0,
            despesas_processed=0,
            errors=errors,
            historical_years_processed=result.get("years_processed", []),
        )

    manual_result: dict[str, Any] = await scheduler.trigger_manual(
        year=payload.year,
        data_type=payload.data_type,
    )

    status_val = manual_result.get("status", "unknown")
    message = _build_trigger_message(payload.year, payload.data_type, manual_result)
    errors = manual_result.get("errors", [])

    return ScrapingTriggerResponse(
        status=status_val,
        message=message,
        receitas_processed=manual_result.get("receitas_processed", 0),
        despesas_processed=manual_result.get("despesas_processed", 0),
        errors=errors,
        historical_years_processed=[],
    )


# ---------------------------------------------------------------------------
# GET /api/v1/scraping/history
# ---------------------------------------------------------------------------


@router.get("/history", response_model=ScrapingHistoryResponse)
async def get_scraping_history(
    limit: int = Query(default=20, ge=1, le=100, description="Máximo de registros"),
) -> ScrapingHistoryResponse:
    """Retorna o histórico das últimas execuções de scraping.

    Consulta a tabela scraping_log ordenada por started_at desc.
    """
    try:
        with db_manager.get_session() as session:
            # Total de registros para metadado
            total: int = session.query(sa_func.count(ScrapingLogModel.id)).scalar() or 0

            # Últimos N registros
            rows = (
                session.query(ScrapingLogModel)
                .order_by(ScrapingLogModel.started_at.desc())
                .limit(limit)
                .all()
            )

            logs = [ScrapingLogResponse.model_validate(row) for row in rows]

        return ScrapingHistoryResponse(logs=logs, total=total)

    except Exception:
        logger.exception("Erro ao buscar histórico de scraping")
        return ScrapingHistoryResponse(logs=[], total=0)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _build_trigger_message(year: int, data_type: str, result: dict[str, Any]) -> str:
    """Monta mensagem descritiva do resultado do trigger."""
    status = result.get("status", "unknown")
    rec = result.get("receitas_processed", 0)
    desp = result.get("despesas_processed", 0)

    if status == "SUCCESS":
        return (
            f"Scraping concluído com sucesso para {year} ({data_type}): "
            f"{rec} receitas, {desp} despesas processadas"
        )
    if status == "PARTIAL":
        return (
            f"Scraping parcial para {year} ({data_type}): "
            f"{rec} receitas, {desp} despesas processadas"
        )
    return f"Erro no scraping para {year} ({data_type})"
