"""
Repository para Cargos — acesso ao banco local.

Encapsula queries SQL e operações de upsert sobre a tabela cargos.
Não contém lógica de negócio — apenas acesso a dados.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import Session

from backend.features.cargo.cargo_types import CargoItem
from backend.shared.database.models import CargoModel

logger = logging.getLogger(__name__)


def list_cargos(
    session: Session,
    ano: int,
    categoria: str | None = None,
) -> list[CargoItem]:
    """Lista cargos para um ano específico.

    Args:
        session: SQLAlchemy Session.
        ano: Ano de referência.
        categoria: Filtrar por categoria (ex: "EFETIVO") ou None para todos.

    Returns:
        Lista de CargoItem (Pydantic).
    """
    stmt = select(CargoModel).where(CargoModel.ano == ano)
    if categoria is not None:
        stmt = stmt.where(CargoModel.categoria == categoria)

    stmt = stmt.order_by(CargoModel.cargo)

    rows = session.execute(stmt).scalars().all()
    return [_row_to_item(row) for row in rows]


def get_anos_disponiveis(session: Session) -> list[int]:
    """Retorna anos com cargos registrados.

    Args:
        session: SQLAlchemy Session.

    Returns:
        Lista de anos (ordenada decrescente).
    """
    stmt = (
        select(CargoModel.ano)
        .distinct()
        .order_by(CargoModel.ano.desc())
    )
    rows = session.execute(stmt).scalars().all()
    return list(rows)


def get_categorias_disponiveis(session: Session, ano: int) -> list[str]:
    """Retorna categorias disponíveis para um ano.

    Args:
        session: SQLAlchemy Session.
        ano: Ano de referência.

    Returns:
        Lista de categorias.
    """
    stmt = (
        select(CargoModel.categoria)
        .where(CargoModel.ano == ano)
        .distinct()
        .order_by(CargoModel.categoria)
    )
    rows = session.execute(stmt).scalars().all()
    return list(rows)


def upsert_cargos(
    session: Session,
    items: list[CargoItem],
) -> int:
    """Insere ou atualiza cargos no banco (upsert).

    A chave de unicidade é (ano, cargo, categoria).
    Em caso de conflito, atualiza todos os campos.

    Args:
        session: SQLAlchemy Session.
        items: Lista de CargoItem a persistir.

    Returns:
        Número de itens inseridos/atualizados.
    """
    if not items:
        return 0

    now = datetime.now(UTC)

    rows = [
        {
            "ano": item.ano,
            "cargo": item.cargo,
            "carga_horaria": item.carga_horaria or "",
            "vagas_totais": item.vagas_totais,
            "vagas_ocupadas": item.vagas_ocupadas,
            "salario_base": Decimal(str(item.salario_base)),
            "efetivo": item.efetivo,
            "comissionado": item.comissionado,
            "contratado": item.contratado,
            "eletivo": item.eletivo,
            "categoria": item.categoria,
            "fonte": "QUALITY_SCRAPER",
            "created_at": now,
            "updated_at": now,
        }
        for item in items
    ]

    stmt = sqlite_insert(CargoModel).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=["ano", "cargo", "categoria"],
        set_={
            "carga_horaria": stmt.excluded.carga_horaria,
            "vagas_totais": stmt.excluded.vagas_totais,
            "vagas_ocupadas": stmt.excluded.vagas_ocupadas,
            "salario_base": stmt.excluded.salario_base,
            "efetivo": stmt.excluded.efetivo,
            "comissionado": stmt.excluded.comissionado,
            "contratado": stmt.excluded.contratado,
            "eletivo": stmt.excluded.eletivo,
            "updated_at": now,
        },
    )

    result = session.execute(stmt)
    return result.rowcount or 0


def _row_to_item(row: CargoModel) -> CargoItem:
    """Converte model SQLAlchemy para CargoItem."""
    return CargoItem(
        cargo=row.cargo,
        carga_horaria=row.carga_horaria or "",
        vagas_totais=row.vagas_totais,
        vagas_ocupadas=row.vagas_ocupadas,
        salario_base=float(row.salario_base),
        efetivo=row.efetivo,
        comissionado=row.comissionado,
        contratado=row.contratado,
        eletivo=row.eletivo,
        categoria=row.categoria,
        ano=row.ano,
    )
