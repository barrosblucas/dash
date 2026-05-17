"""
Repository para Convênios — acesso ao banco local.

Encapsula queries SQL e operações de upsert sobre a tabela convenios e
convenio_movimentacoes. Não contém lógica de negócio — apenas acesso a dados.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import Session

from backend.features.convenio.convenio_types import (
    ConvenioItem,
    ConvenioMovimentacao,
)
from backend.shared.database.models import ConvenioModel, ConvenioMovimentacaoModel

logger = logging.getLogger(__name__)


def list_convenios(
    session: Session,
    ano: int,
    tipo: str | None = None,
) -> list[ConvenioItem]:
    """Lista convênios para um ano específico.

    Args:
        session: SQLAlchemy Session.
        ano: Ano de referência.
        tipo: Filtrar por tipo (ex: "Concedido") ou None para todos.

    Returns:
        Lista de ConvenioItem (Pydantic).
    """
    stmt = select(ConvenioModel).where(
        ConvenioModel.ano == ano,
    )
    if tipo is not None:
        stmt = stmt.where(ConvenioModel.tipo == tipo)

    rows = session.execute(stmt).scalars().all()
    return [_row_to_item(row) for row in rows]


def get_convenio_detalhe(
    session: Session,
    ano: int,
    numero: str,
) -> ConvenioItem | None:
    """Busca detalhes de um convênio específico.

    Args:
        session: SQLAlchemy Session.
        ano: Ano de referência.
        numero: Número do convênio.

    Returns:
        ConvenioItem ou None se não encontrado.
    """
    stmt = select(ConvenioModel).where(
        ConvenioModel.ano == ano,
        ConvenioModel.numero == numero,
    )
    row = session.execute(stmt).scalar_one_or_none()
    if row is None:
        return None
    return _row_to_item(row)


def get_anos_disponiveis(session: Session) -> list[int]:
    """Retorna anos com convênios registrados.

    Args:
        session: SQLAlchemy Session.

    Returns:
        Lista de anos (ordenada decrescente).
    """
    stmt = (
        select(ConvenioModel.ano)
        .distinct()
        .order_by(ConvenioModel.ano.desc())
    )
    rows = session.execute(stmt).scalars().all()
    return list(rows)


def upsert_convenios(
    session: Session,
    items: list[ConvenioItem],
) -> int:
    """Insere ou atualiza convênios no banco (upsert).

    A chave de unicidade é (ano, numero).
    Em caso de conflito, atualiza assinatura, tipo, esfera, concedente,
    convenente, valor, situacao, objeto.

    Args:
        session: SQLAlchemy Session.
        items: Lista de ConvenioItem a persistir.

    Returns:
        Número de itens inseridos/atualizados.
    """
    if not items:
        return 0

    now = datetime.now(UTC)

    rows = [
        {
            "ano": item.ano,
            "numero": item.numero,
            "assinatura": item.assinatura,
            "tipo": item.tipo,
            "esfera": item.esfera,
            "concedente": item.concedente,
            "convenente": item.convenente,
            "valor": Decimal(str(item.valor)),
            "situacao": item.situacao,
            "objeto": item.objeto,
            "fonte": "QUALITY_SCRAPER",
            "created_at": now,
            "updated_at": now,
        }
        for item in items
    ]

    stmt = sqlite_insert(ConvenioModel).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=["ano", "numero"],
        set_={
            "assinatura": stmt.excluded.assinatura,
            "tipo": stmt.excluded.tipo,
            "esfera": stmt.excluded.esfera,
            "concedente": stmt.excluded.concedente,
            "convenente": stmt.excluded.convenente,
            "valor": stmt.excluded.valor,
            "situacao": stmt.excluded.situacao,
            "objeto": stmt.excluded.objeto,
            "updated_at": now,
        },
    )

    result = session.execute(stmt)
    return result.rowcount or 0


def list_movimentacoes(
    session: Session,
    ano: int,
    tipo: str | None = None,
) -> list[ConvenioMovimentacao]:
    """Lista movimentações de convênios para um ano.

    Args:
        session: SQLAlchemy Session.
        ano: Ano de referência.
        tipo: Filtrar por tipo ("receita" ou "despesa") ou None para todos.

    Returns:
        Lista de ConvenioMovimentacao.
    """
    stmt = select(ConvenioMovimentacaoModel).where(
        ConvenioMovimentacaoModel.ano == ano,
    )
    if tipo is not None:
        stmt = stmt.where(ConvenioMovimentacaoModel.tipo == tipo)

    rows = session.execute(stmt).scalars().all()
    return [_row_to_movimentacao(row) for row in rows]


def upsert_movimentacoes(
    session: Session,
    items: list[ConvenioMovimentacao],
) -> int:
    """Insere ou atualiza movimentações de convênios no banco (upsert).

    Args:
        session: SQLAlchemy Session.
        items: Lista de ConvenioMovimentacao a persistir.

    Returns:
        Número de itens inseridos/atualizados.
    """
    if not items:
        return 0

    now = datetime.now(UTC)

    rows = [
        {
            "ano": _infer_year(item.data, item.mes),
            "mes": item.mes,
            "tipo": item.tipo,
            "convenio": item.convenio,
            "lancamento": item.lancamento,
            "entidade": item.entidade,
            "data": item.data,
            "concedente": item.concedente,
            "convenente": item.convenente,
            "valor": Decimal(str(item.valor)),
            "fonte": "QUALITY_SCRAPER",
            "created_at": now,
            "updated_at": now,
        }
        for item in items
    ]

    stmt = sqlite_insert(ConvenioMovimentacaoModel).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=["ano", "mes", "tipo", "convenio", "lancamento"],
        set_={
            "entidade": stmt.excluded.entidade,
            "data": stmt.excluded.data,
            "concedente": stmt.excluded.concedente,
            "convenente": stmt.excluded.convenente,
            "valor": stmt.excluded.valor,
            "updated_at": now,
        },
    )

    result = session.execute(stmt)
    return result.rowcount or 0


def _infer_year(data_str: str, mes: int) -> int:
    """Tenta inferir ano a partir da data da movimentação."""
    if data_str and len(data_str) >= 4:
        parts = data_str.replace("/", "-").split("-")
        if len(parts) >= 3:
            try:
                return int(parts[2])
            except (ValueError, IndexError):
                pass
    return datetime.now(UTC).year


def sum_receitas(session: Session, ano: int) -> float:
    """Soma total de receitas de convênios para o ano."""
    stmt = select(ConvenioMovimentacaoModel.valor).where(
        ConvenioMovimentacaoModel.ano == ano,
        ConvenioMovimentacaoModel.tipo == "receita",
    )
    rows = session.execute(stmt).scalars().all()
    return float(sum(rows))


def sum_despesas(session: Session, ano: int) -> float:
    """Soma total de despesas de convênios para o ano."""
    stmt = select(ConvenioMovimentacaoModel.valor).where(
        ConvenioMovimentacaoModel.ano == ano,
        ConvenioMovimentacaoModel.tipo == "despesa",
    )
    rows = session.execute(stmt).scalars().all()
    return float(sum(rows))


def _row_to_item(row: ConvenioModel) -> ConvenioItem:
    """Converte model SQLAlchemy para ConvenioItem."""
    return ConvenioItem(
        numero=row.numero,
        assinatura=row.assinatura or "",
        tipo=row.tipo,
        esfera=row.esfera,
        concedente=row.concedente,
        convenente=row.convenente,
        valor=float(row.valor),
        situacao=row.situacao or "",
        objeto=row.objeto or "",
        ano=row.ano,
    )


def _row_to_movimentacao(row: ConvenioMovimentacaoModel) -> ConvenioMovimentacao:
    """Converte model SQLAlchemy para ConvenioMovimentacao."""
    return ConvenioMovimentacao(
        convenio=row.convenio,
        lancamento=row.lancamento or "",
        entidade=row.entidade or "",
        data=row.data or "",
        concedente=row.concedente or "",
        convenente=row.convenente or "",
        valor=float(row.valor),
        mes=row.mes,
        tipo=row.tipo,  # type: ignore[arg-type]
    )
