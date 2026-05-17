"""
Repository para Patrimônio — acesso ao banco local.

Encapsula queries SQL e operações de upsert sobre a tabela patrimonio.
Não contém lógica de negócio — apenas acesso a dados.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import Session

from backend.features.patrimonio.patrimonio_types import (
    PatrimonioItem,
    PatrimonioResumoPorTipo,
)
from backend.shared.database.models import PatrimonioModel

logger = logging.getLogger(__name__)


def list_patrimonio(
    session: Session,
    ano: int,
    tipo_bem: str | None = None,
) -> list[PatrimonioItem]:
    """Lista itens patrimoniais para um ano específico.

    Args:
        session: SQLAlchemy Session.
        ano: Ano de referência.
        tipo_bem: Filtrar por tipo ("Móvel", "Imóvel", "Veículo") ou None para todos.

    Returns:
        Lista de PatrimonioItem (Pydantic).
    """
    stmt = select(PatrimonioModel).where(PatrimonioModel.ano == ano)
    if tipo_bem is not None:
        stmt = stmt.where(PatrimonioModel.tipo_bem == tipo_bem)

    rows = session.execute(stmt).scalars().all()
    return [_row_to_item(row) for row in rows]


def get_anos_disponiveis(session: Session) -> list[int]:
    """Retorna anos com dados patrimoniais registrados.

    Args:
        session: SQLAlchemy Session.

    Returns:
        Lista de anos (ordenada decrescente).
    """
    stmt = (
        select(PatrimonioModel.ano)
        .distinct()
        .order_by(PatrimonioModel.ano.desc())
    )
    rows = session.execute(stmt).scalars().all()
    return list(rows)


def get_resumo_anual(
    session: Session, ano: int
) -> tuple[int, float, dict[str, PatrimonioResumoPorTipo]]:
    """Retorna resumo anual dos dados patrimoniais.

    Args:
        session: SQLAlchemy Session.
        ano: Ano de referência.

    Returns:
        Tupla (total_bens, total_valor, por_tipo).
    """
    from sqlalchemy.sql import func

    # Total geral
    total_stmt = select(
        func.coalesce(func.sum(PatrimonioModel.quantidade_atual), 0),
        func.coalesce(func.sum(PatrimonioModel.valor_atual), 0),
    ).where(PatrimonioModel.ano == ano)
    total_row = session.execute(total_stmt).one()
    total_bens = int(total_row[0])
    total_valor = float(total_row[1])

    # Resumo por tipo
    tipo_stmt = (
        select(
            PatrimonioModel.tipo_bem,
            func.coalesce(func.sum(PatrimonioModel.quantidade_atual), 0),
            func.coalesce(func.sum(PatrimonioModel.valor_atual), 0),
        )
        .where(PatrimonioModel.ano == ano)
        .group_by(PatrimonioModel.tipo_bem)
    )
    tipo_rows = session.execute(tipo_stmt).all()

    por_tipo: dict[str, PatrimonioResumoPorTipo] = {}
    for row in tipo_rows:
        por_tipo[str(row.tipo_bem)] = PatrimonioResumoPorTipo(
            quantidade=int(row[1]),
            valor=float(row[2]),
        )

    return total_bens, total_valor, por_tipo


def upsert_patrimonio(
    session: Session,
    items: list[PatrimonioItem],
) -> int:
    """Insere ou atualiza itens patrimoniais no banco (upsert).

    A chave de unicidade é (ano, tipo_bem, descricao).
    Em caso de conflito, atualiza todos os campos quantitativos.

    Args:
        session: SQLAlchemy Session.
        items: Lista de PatrimonioItem a persistir.

    Returns:
        Número de itens inseridos/atualizados.
    """
    if not items:
        return 0

    now = datetime.now(UTC)

    rows = [
        {
            "ano": item.ano,
            "tipo_bem": item.tipo_bem,
            "descricao": item.descricao,
            "quantidade_anterior": item.quantidade_anterior,
            "valor_anterior": Decimal(str(item.valor_anterior)),
            "quantidade_adquiridos": item.quantidade_adquiridos,
            "valor_adquiridos": Decimal(str(item.valor_adquiridos)),
            "quantidade_baixados": item.quantidade_baixados,
            "valor_baixados": Decimal(str(item.valor_baixados)),
            "quantidade_atual": item.quantidade_atual,
            "valor_atual": Decimal(str(item.valor_atual)),
            "fonte": "QUALITY_SCRAPER",
            "created_at": now,
            "updated_at": now,
        }
        for item in items
    ]

    stmt = sqlite_insert(PatrimonioModel).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=["ano", "tipo_bem", "descricao"],
        set_={
            "quantidade_anterior": stmt.excluded.quantidade_anterior,
            "valor_anterior": stmt.excluded.valor_anterior,
            "quantidade_adquiridos": stmt.excluded.quantidade_adquiridos,
            "valor_adquiridos": stmt.excluded.valor_adquiridos,
            "quantidade_baixados": stmt.excluded.quantidade_baixados,
            "valor_baixados": stmt.excluded.valor_baixados,
            "quantidade_atual": stmt.excluded.quantidade_atual,
            "valor_atual": stmt.excluded.valor_atual,
            "updated_at": now,
        },
    )

    result = session.execute(stmt)
    return result.rowcount or 0


def _row_to_item(row: PatrimonioModel) -> PatrimonioItem:
    """Converte model SQLAlchemy para PatrimonioItem."""
    return PatrimonioItem(
        tipo_bem=row.tipo_bem,
        descricao=row.descricao,
        quantidade_anterior=row.quantidade_anterior,
        valor_anterior=float(row.valor_anterior),
        quantidade_adquiridos=row.quantidade_adquiridos,
        valor_adquiridos=float(row.valor_adquiridos),
        quantidade_baixados=row.quantidade_baixados,
        valor_baixados=float(row.valor_baixados),
        quantidade_atual=row.quantidade_atual,
        valor_atual=float(row.valor_atual),
        ano=row.ano,
    )
