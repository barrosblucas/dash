"""
Repository para Diárias e Passagens — acesso ao banco local.

Encapsula queries SQL e operações de upsert sobre a tabela diarias.
Não contém lógica de negócio — apenas acesso a dados.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from backend.features.diaria.diaria_types import DiariaItem, DiariaResumoMensal
from backend.shared.database.models import DiariaModel

logger = logging.getLogger(__name__)


def list_diarias(
    session: Session,
    ano: int,
    mes: int | None = None,
) -> list[DiariaItem]:
    """Lista diárias para um ano e mês opcional.

    Args:
        session: SQLAlchemy Session.
        ano: Ano de referência.
        mes: Mês opcional para filtrar (1-12).

    Returns:
        Lista de DiariaItem (Pydantic).
    """
    stmt = select(DiariaModel).where(DiariaModel.ano == ano)
    if mes is not None:
        stmt = stmt.where(DiariaModel.mes == mes)

    rows = session.execute(stmt).scalars().all()
    return [_row_to_item(row) for row in rows]


def get_anos_disponiveis(session: Session) -> list[int]:
    """Retorna anos com diárias registradas.

    Args:
        session: SQLAlchemy Session.

    Returns:
        Lista de anos (ordenada decrescente).
    """
    stmt = (
        select(DiariaModel.ano)
        .distinct()
        .order_by(DiariaModel.ano.desc())
    )
    rows = session.execute(stmt).scalars().all()
    return list(rows)


def get_resumo_anual(session: Session, ano: int) -> tuple[int, float, float, list[DiariaResumoMensal]]:
    """Retorna resumo anual de diárias.

    Args:
        session: SQLAlchemy Session.
        ano: Ano de referência.

    Returns:
        Tupla (quantidade_total, total_valor, total_devolvido, evolucao_mensal).
    """
    # Total geral
    total_stmt = select(
        func.count(DiariaModel.id),
        func.coalesce(func.sum(DiariaModel.valor_total), 0),
        func.coalesce(func.sum(DiariaModel.valor_devolvido), 0),
    ).where(DiariaModel.ano == ano)
    total_row = session.execute(total_stmt).one()
    quantidade_total = int(total_row[0])
    total_valor = float(total_row[1])
    total_devolvido = float(total_row[2])

    # Evolução mensal
    mensal_stmt = (
        select(
            DiariaModel.mes,
            func.count(DiariaModel.id),
            func.coalesce(func.sum(DiariaModel.valor_total), 0),
        )
        .where(DiariaModel.ano == ano)
        .group_by(DiariaModel.mes)
        .order_by(DiariaModel.mes)
    )
    mensal_rows = session.execute(mensal_stmt).all()

    evolucao_mensal = [
        DiariaResumoMensal(
            mes=int(row.mes),
            quantidade=int(row[1]),
            total_valor=float(row[2]),
        )
        for row in mensal_rows
    ]

    return quantidade_total, total_valor, total_devolvido, evolucao_mensal


def upsert_diarias(
    session: Session,
    items: list[DiariaItem],
) -> int:
    """Insere ou atualiza diárias no banco (upsert).

    A chave de unicidade é (ano, mes, numero_empenho, numero_liquidacao).
    Em caso de conflito, atualiza nome, historico, destino, periodo,
    valor_total, valor_devolvido.

    Args:
        session: SQLAlchemy Session.
        items: Lista de DiariaItem a persistir.

    Returns:
        Número de itens inseridos/atualizados.
    """
    if not items:
        return 0

    now = datetime.now(UTC)

    rows = [
        {
            "ano": item.ano,
            "mes": item.mes,
            "numero_empenho": item.numero_empenho,
            "numero_liquidacao": item.numero_liquidacao,
            "nome": item.nome,
            "historico": item.historico,
            "destino": item.destino,
            "periodo": item.periodo,
            "valor_total": Decimal(str(item.valor_total)),
            "valor_devolvido": Decimal(str(item.valor_devolvido)),
            "fonte": "QUALITY_SCRAPER",
            "created_at": now,
            "updated_at": now,
        }
        for item in items
    ]

    stmt = sqlite_insert(DiariaModel).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=["ano", "mes", "numero_empenho", "numero_liquidacao"],
        set_={
            "nome": stmt.excluded.nome,
            "historico": stmt.excluded.historico,
            "destino": stmt.excluded.destino,
            "periodo": stmt.excluded.periodo,
            "valor_total": stmt.excluded.valor_total,
            "valor_devolvido": stmt.excluded.valor_devolvido,
            "updated_at": now,
        },
    )

    result = session.execute(stmt)
    return result.rowcount or 0


def _row_to_item(row: DiariaModel) -> DiariaItem:
    """Converte model SQLAlchemy para DiariaItem."""
    return DiariaItem(
        numero_empenho=row.numero_empenho,
        numero_liquidacao=row.numero_liquidacao,
        nome=row.nome,
        historico=row.historico or "",
        destino=row.destino or "",
        periodo=row.periodo or "",
        valor_total=float(row.valor_total),
        valor_devolvido=float(row.valor_devolvido),
        ano=row.ano,
        mes=row.mes,
    )
