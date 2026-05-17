"""
Repository para Emendas Parlamentares — acesso ao banco local.

Encapsula queries SQL e operações de upsert sobre a tabela emendas.
Não contém lógica de negócio — apenas acesso a dados.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import Session

from backend.features.emenda.emenda_types import EmendaItem
from backend.shared.database.models import EmendaModel

logger = logging.getLogger(__name__)


def list_emendas(
    session: Session,
    ano: int,
    tipo: str | None = None,
) -> list[EmendaItem]:
    """Lista emendas para um ano específico.

    Args:
        session: SQLAlchemy Session.
        ano: Ano de referência.
        tipo: Filtrar por tipo de emenda ou None para todos.

    Returns:
        Lista de EmendaItem (Pydantic).
    """
    stmt = select(EmendaModel).where(
        EmendaModel.ano == ano,
    )
    if tipo is not None:
        stmt = stmt.where(EmendaModel.tipo_emenda == tipo)

    rows = session.execute(stmt).scalars().all()
    return [_row_to_item(row) for row in rows]


def get_anos_disponiveis(session: Session) -> list[int]:
    """Retorna anos com emendas registradas.

    Args:
        session: SQLAlchemy Session.

    Returns:
        Lista de anos (ordenada decrescente).
    """
    stmt = (
        select(EmendaModel.ano)
        .distinct()
        .order_by(EmendaModel.ano.desc())
    )
    rows = session.execute(stmt).scalars().all()
    return list(rows)


def get_resumo_anual(session: Session, ano: int) -> tuple[int, float, dict[str, float]]:
    """Retorna resumo anual de emendas.

    Args:
        session: SQLAlchemy Session.
        ano: Ano de referência.

    Returns:
        Tupla (quantidade_emendas, total_valor, por_tipo).
    """
    stmt = select(EmendaModel).where(EmendaModel.ano == ano)
    rows = session.execute(stmt).scalars().all()

    if not rows:
        return 0, 0.0, {}

    total_valor = 0.0
    por_tipo: dict[str, float] = {}

    for row in rows:
        valor = float(row.valor)
        total_valor += valor
        _raw_tipo = row.tipo_emenda
        tipo = str(_raw_tipo) if _raw_tipo else "Sem tipo"
        por_tipo[tipo] = por_tipo.get(tipo, 0.0) + valor

    return len(rows), round(total_valor, 2), por_tipo


def upsert_emendas(
    session: Session,
    items: list[EmendaItem],
) -> int:
    """Insere ou atualiza emendas no banco (upsert).

    A chave de unicidade é (ano, emenda, numero_protocolo).
    Em caso de conflito, atualiza tipo_emenda, descricao, valor, detalhes_link.

    Args:
        session: SQLAlchemy Session.
        items: Lista de EmendaItem a persistir.

    Returns:
        Número de itens inseridos/atualizados.
    """
    if not items:
        return 0

    now = datetime.now(UTC)

    rows = [
        {
            "ano": item.ano,
            "emenda": item.emenda,
            "tipo_emenda": item.tipo_emenda,
            "numero_protocolo": item.numero_protocolo,
            "descricao": item.descricao,
            "valor": Decimal(str(item.valor)),
            "detalhes_link": item.detalhes_link,
            "fonte": "QUALITY_SCRAPER",
            "created_at": now,
            "updated_at": now,
        }
        for item in items
    ]

    stmt = sqlite_insert(EmendaModel).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=["ano", "emenda", "numero_protocolo"],
        set_={
            "tipo_emenda": stmt.excluded.tipo_emenda,
            "descricao": stmt.excluded.descricao,
            "valor": stmt.excluded.valor,
            "detalhes_link": stmt.excluded.detalhes_link,
            "updated_at": now,
        },
    )

    result = session.execute(stmt)
    return result.rowcount or 0


def _row_to_item(row: EmendaModel) -> EmendaItem:
    """Converte model SQLAlchemy para EmendaItem."""
    return EmendaItem(
        emenda=row.emenda,
        tipo_emenda=row.tipo_emenda,
        numero_protocolo=row.numero_protocolo,
        descricao=row.descricao or "",
        valor=float(row.valor),
        detalhes_link=row.detalhes_link or "",
        ano=row.ano,
    )
