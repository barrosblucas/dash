"""Helpers de persistência e logging para o serviço de scraping."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from sqlalchemy import and_, delete
from sqlalchemy.orm import Session

from backend.features.despesa.despesa_breakdown_scraper import DespesaBreakdown
from backend.features.despesa.despesa_types import Despesa
from backend.features.receita.receita_types import Receita
from backend.shared.database.connection import db_manager
from backend.shared.database.models import (
    DespesaBreakdownModel,
    DespesaModel,
    QualitySyncStateModel,
    QualityUnidadeGestoraModel,
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


def _replace_breakdown_for_year(
    session: Session, breakdowns: list[DespesaBreakdown], year: int, breakdown_type: str
) -> int:
    """Substitui todo o breakdown de um tipo/ano e reinsere. Retorna count inseridos."""
    session.execute(
        delete(DespesaBreakdownModel).where(
            and_(
                DespesaBreakdownModel.ano == year,
                DespesaBreakdownModel.breakdown_type == breakdown_type,
            )
        )
    )
    session.flush()
    for b in breakdowns:
        if b.breakdown_type != breakdown_type:
            continue
        session.add(
            DespesaBreakdownModel(
                ano=b.ano,
                mes=b.mes,
                breakdown_type=b.breakdown_type,
                item_label=b.item_label,
                valor=b.valor,
                fonte=b.fonte,
            )
        )
    session.flush()
    return len([b for b in breakdowns if b.breakdown_type == breakdown_type])


def _upsert_sync_state(
    session: Session,
    dataset_key: str,
    ano: int,
    payload_hash: str,
    item_count: int,
    status: str,
) -> QualitySyncStateModel:
    """Cria ou atualiza estado de sincronização com hash."""
    now = datetime.now()
    existing: QualitySyncStateModel | None = (
        session.query(QualitySyncStateModel)
        .filter(
            and_(
                QualitySyncStateModel.dataset_key == dataset_key,
                QualitySyncStateModel.ano == ano,
            )
        )
        .first()
    )
    if existing is not None:
        existing.payload_hash = payload_hash  # type: ignore[assignment]
        existing.item_count = item_count  # type: ignore[assignment]
        existing.status = status  # type: ignore[assignment]
        existing.last_checked_at = now  # type: ignore[assignment]
        if status == "SUCCESS":
            existing.last_changed_at = now  # type: ignore[assignment]
        session.flush()
        return existing

    entry = QualitySyncStateModel(
        dataset_key=dataset_key,
        ano=ano,
        payload_hash=payload_hash,
        item_count=item_count,
        status=status,
        last_checked_at=now,
        last_changed_at=now if status == "SUCCESS" else None,
    )
    session.add(entry)
    session.flush()
    return entry


def _get_sync_state_hash(
    session: Session, dataset_key: str, ano: int
) -> str | None:
    """Retorna hash do último sync state, ou None se não existe."""
    existing: QualitySyncStateModel | None = (
        session.query(QualitySyncStateModel)
        .filter(
            and_(
                QualitySyncStateModel.dataset_key == dataset_key,
                QualitySyncStateModel.ano == ano,
            )
        )
        .first()
    )
    return existing.payload_hash if existing else None  # type: ignore[return-value]


def _is_year_fully_synced(session: Session, year: int) -> bool:
    """Verifica se todos os datasets de um ano estão sincronizados.

    Considera sincronizado quando o status é SUCCESS (dados gravados)
    ou NO_CHANGE (dados conferidos e inalterados desde a última gravação).
    """
    _SYNCED_STATUSES = {"SUCCESS", "NO_CHANGE"}
    datasets = [
        "receitas",
        "despesas",
        "despesas_orgao",
        "despesas_funcao",
        "despesas_elemento",
    ]
    for ds in datasets:
        state: QualitySyncStateModel | None = (
            session.query(QualitySyncStateModel)
            .filter(
                and_(
                    QualitySyncStateModel.dataset_key == ds,
                    QualitySyncStateModel.ano == year,
                )
            )
            .first()
        )
        if state is None or state.status not in _SYNCED_STATUSES:
            return False
    return True


def _replace_unidades_gestoras(
    session: Session, unidades: list[dict[str, Any]],
) -> int:
    """Replace completo das unidades gestoras. Retorna count inseridos."""
    session.execute(delete(QualityUnidadeGestoraModel))
    session.flush()
    for u in unidades:
        session.add(
            QualityUnidadeGestoraModel(
                codigo_entidade=u.get("codigoEntidade", 0),
                nome_entidade=u.get("nomeEntidade", ""),
                tipo_entidade=u.get("tipoEntidade"),
                cnpj_entidade=u.get("cnpjEntidade"),
                tipo_unidade_gestora=u.get("tipoUnidadeGestora"),
                fonte="QUALITY_API",
            )
        )
    session.flush()
    return len(unidades)


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
