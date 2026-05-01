"""
Repository para Movimento Extra Orçamentário — acesso ao banco local.

Encapsula queries SQL e operações de upsert sobre a tabela movimento_extra.
Não contém lógica de negócio — apenas acesso a dados.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import Session

from backend.features.movimento_extra.movimento_extra_types import MovimentoExtraItem
from backend.shared.database.quality_models import MovimentoExtraModel

logger = logging.getLogger(__name__)


def list_movimento_extra(
    session: Session,
    ano: int,
    mes: int,
    tipo: str | None = None,
) -> list[MovimentoExtraItem]:
    """Lista itens de movimento extra para um período específico.

    Args:
        session: SQLAlchemy Session.
        ano: Ano de referência.
        mes: Mês de referência (1-12).
        tipo: Filtrar por tipo ("R", "D") ou None para ambos.

    Returns:
        Lista de MovimentoExtraItem (Pydantic).
    """
    stmt = select(MovimentoExtraModel).where(
        MovimentoExtraModel.ano == ano,
        MovimentoExtraModel.mes == mes,
    )
    if tipo is not None:
        stmt = stmt.where(MovimentoExtraModel.tipo == tipo)

    rows = session.execute(stmt).scalars().all()
    return [_row_to_item(row) for row in rows]


def list_movimento_extra_anual(
    session: Session,
    ano: int,
) -> list[MovimentoExtraItem]:
    """Lista todos os itens de movimento extra para um ano inteiro.

    Args:
        session: SQLAlchemy Session.
        ano: Ano de referência.

    Returns:
        Lista de MovimentoExtraItem (Pydantic) — 12 meses.
    """
    stmt = select(MovimentoExtraModel).where(
        MovimentoExtraModel.ano == ano,
    )
    rows = session.execute(stmt).scalars().all()
    return [_row_to_item(row) for row in rows]


def upsert_movimento_extra(
    session: Session,
    items: list[MovimentoExtraItem],
) -> int:
    """Insere ou atualiza itens de movimento extra no banco (upsert).

    A chave de unicidade é (ano, mes, tipo, codigo, ent_codigo).
    Em caso de conflito, atualiza valor_recebido e updated_at.

    Args:
        session: SQLAlchemy Session.
        items: Lista de MovimentoExtraItem a persistir.

    Returns:
        Número de itens inseridos/atualizados.
    """
    if not items:
        return 0

    now = datetime.now(UTC)


    # Bulk upsert pattern for SQLite
    rows = [
        {
            "ano": item.ano,
            "mes": item.mes,
            "codigo": item.codigo,
            "ent_codigo": item.ent_codigo,
            "descricao": item.descricao,
            "fornecedor": item.fornecedor,
            "tipo": item.tipo,
            "valor_recebido": Decimal(str(item.valor_recebido)),
            "fonte": "QUALITY_API",
            "created_at": now,
            "updated_at": now,
        }
        for item in items
    ]

    stmt = sqlite_insert(MovimentoExtraModel).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=["ano", "mes", "tipo", "codigo", "ent_codigo"],
        set_={
            "descricao": stmt.excluded.descricao,
            "fornecedor": stmt.excluded.fornecedor,
            "valor_recebido": stmt.excluded.valor_recebido,
            "updated_at": now,
        },
    )

    result = session.execute(stmt)
    return result.rowcount or 0


def _row_to_item(row: MovimentoExtraModel) -> MovimentoExtraItem:
    """Converte model SQLAlchemy para Pydantic."""
    return MovimentoExtraItem(
        codigo=row.codigo,
        ent_codigo=row.ent_codigo,
        descricao=row.descricao,
        fornecedor=row.fornecedor,
        tipo=row.tipo,  # type: ignore[arg-type]
        valor_recebido=float(row.valor_recebido),
        mes=row.mes,
        ano=row.ano,
    )
