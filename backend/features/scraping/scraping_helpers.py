"""Helpers de persistência e logging para o serviço de scraping."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime

from sqlalchemy import and_, delete
from sqlalchemy.orm import Session

from backend.features.despesa.despesa_types import Despesa
from backend.features.receita.receita_types import Receita
from backend.shared.database.connection import db_manager
from backend.shared.database.models import (
    DespesaModel,
    ReceitaDetalhamentoModel,
    ReceitaModel,
    ScrapingLogModel,
)
from backend.shared.pdf_types import ReceitaDetalhamento

logger = logging.getLogger(__name__)


@dataclass
class ScrapingResult:
    """Resultado de uma execução de scraping."""

    success: bool
    data_type: str
    year: int
    records_processed: int
    records_inserted: int
    records_updated: int
    errors: list[str] = field(default_factory=list)


# ------------------------------------------------------------------
# Upsert helpers
# ------------------------------------------------------------------


def _upsert_receitas(
    session: Session, receitas: list[Receita], year: int
) -> tuple[int, int]:
    """Upsert de receitas por (ano, mes, categoria). Retorna (inserted, updated)."""
    inserted = 0
    updated = 0
    for r in receitas:
        existing: ReceitaModel | None = (
            session.query(ReceitaModel)
            .filter(
                and_(
                    ReceitaModel.ano == r.ano,
                    ReceitaModel.mes == r.mes,
                    ReceitaModel.categoria == r.categoria,
                )
            )
            .first()
        )
        if existing is not None:
            existing.valor_previsto = r.valor_previsto  # type: ignore[assignment]
            existing.valor_arrecadado = r.valor_arrecadado  # type: ignore[assignment]
            existing.valor_anulado = r.valor_anulado  # type: ignore[assignment]
            existing.fonte = r.fonte  # type: ignore[assignment]
            updated += 1
        else:
            session.add(
                ReceitaModel(
                    ano=r.ano,
                    mes=r.mes,
                    categoria=r.categoria,
                    subcategoria=r.subcategoria,
                    tipo=r.tipo.value,
                    valor_previsto=r.valor_previsto,
                    valor_arrecadado=r.valor_arrecadado,
                    valor_anulado=r.valor_anulado,
                    fonte=r.fonte,
                )
            )
            inserted += 1
    session.flush()
    return inserted, updated


def _upsert_despesas(
    session: Session, despesas: list[Despesa], year: int
) -> tuple[int, int]:
    """Upsert de despesas por (ano, mes, tipo). Múltiplas por mês com tipos diferentes."""
    inserted = 0
    updated = 0
    for d in despesas:
        query = session.query(DespesaModel).filter(
            and_(
                DespesaModel.ano == d.ano,
                DespesaModel.mes == d.mes,
                DespesaModel.tipo == d.tipo.value,
            )
        )
        if d.categoria:
            query = query.filter(DespesaModel.categoria == d.categoria)
        existing: DespesaModel | None = query.first()
        if existing is not None:
            existing.valor_empenhado = d.valor_empenhado  # type: ignore[assignment]
            existing.valor_liquidado = d.valor_liquidado  # type: ignore[assignment]
            existing.valor_pago = d.valor_pago  # type: ignore[assignment]
            existing.fonte = d.fonte  # type: ignore[assignment]
            updated += 1
        else:
            session.add(
                DespesaModel(
                    ano=d.ano,
                    mes=d.mes,
                    categoria=d.categoria,
                    subcategoria=d.subcategoria,
                    tipo=d.tipo.value,
                    valor_empenhado=d.valor_empenhado,
                    valor_liquidado=d.valor_liquidado,
                    valor_pago=d.valor_pago,
                    fonte=d.fonte,
                )
            )
            inserted += 1
    session.flush()
    return inserted, updated


def _replace_detalhamento(
    session: Session, detalhes: list[ReceitaDetalhamento], year: int
) -> int:
    """Replace completo do detalhamento para o ano. Retorna count de inseridos."""
    session.execute(
        delete(ReceitaDetalhamentoModel).where(ReceitaDetalhamentoModel.ano == year)
    )
    session.flush()
    for d in detalhes:
        session.add(
            ReceitaDetalhamentoModel(
                ano=d.ano,
                detalhamento=d.detalhamento,
                nivel=d.nivel,
                ordem=d.ordem,
                tipo=d.tipo,
                valor_previsto=d.valor_previsto,
                valor_arrecadado=d.valor_arrecadado,
                valor_anulado=d.valor_anulado,
                fonte=d.fonte,
            )
        )
    session.flush()
    return len(detalhes)


def _replace_receitas_for_year(
    session: Session, receitas: list[Receita], year: int
) -> tuple[int, int]:
    """Substitui todas as receitas do ano e reinsere a visão atual da fonte."""
    session.execute(delete(ReceitaModel).where(ReceitaModel.ano == year))
    session.flush()
    return _upsert_receitas(session, receitas, year)


def _replace_despesas_for_year(
    session: Session, despesas: list[Despesa], year: int
) -> tuple[int, int]:
    """Substitui todas as despesas do ano e reinsere a visão atual da fonte."""
    session.execute(delete(DespesaModel).where(DespesaModel.ano == year))
    session.flush()
    return _upsert_despesas(session, despesas, year)


# ------------------------------------------------------------------
# Logging helpers
# ------------------------------------------------------------------


def _create_log(session: Session, data_type: str, year: int) -> ScrapingLogModel:
    """Cria registro de log RUNNING na sessão de dados fornecida."""
    entry = ScrapingLogModel(
        data_type=data_type,
        year=year,
        status="RUNNING",
        records_processed=0,
        records_inserted=0,
        records_updated=0,
        started_at=datetime.now(),
    )
    session.add(entry)
    return entry


def _finalize_log(
    session: Session,
    log: ScrapingLogModel,
    status: str,
    processed: int,
    inserted: int,
    updated: int,
) -> None:
    """Atualiza log com resultado final na mesma sessão de dados."""
    log.status = status  # type: ignore[assignment]
    log.records_processed = processed  # type: ignore[assignment]
    log.records_inserted = inserted  # type: ignore[assignment]
    log.records_updated = updated  # type: ignore[assignment]
    log.finished_at = datetime.now()  # type: ignore[assignment]
    session.flush()


def _try_log_error(
    data_type: str, year: int, error_msg: str, started_at: datetime
) -> None:
    """Tenta registrar erro no log sem propagar exceção."""
    try:
        with db_manager.get_session() as session:
            session.add(
                ScrapingLogModel(
                    data_type=data_type,
                    year=year,
                    status="ERROR",
                    error_message=error_msg[:2000],
                    started_at=started_at,
                    finished_at=datetime.now(),
                )
            )
    except Exception:
        logger.exception("Falha ao registrar log de erro no banco")
