"""
Repository para Contratos — acesso ao banco local.

Encapsula queries SQL e operações de upsert sobre a tabela contratos.
Não contém lógica de negócio — apenas acesso a dados.
"""

from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import Session

from backend.features.contrato.contrato_types import (
    ContratoDetalhe,
    ContratoFiscal,
    ContratoItem,
)
from backend.shared.database.models import ContratoModel

logger = logging.getLogger(__name__)


def list_contratos(
    session: Session,
    ano: int,
    tipo: str | None = None,
) -> list[ContratoItem]:
    """Lista contratos para um ano específico.

    Args:
        session: SQLAlchemy Session.
        ano: Ano de referência.
        tipo: Filtrar por tipo (ex: "CONTRATO PRINCIPAL") ou None para todos.

    Returns:
        Lista de ContratoItem (Pydantic).
    """
    stmt = select(ContratoModel).where(
        ContratoModel.ano == ano,
    )
    if tipo is not None:
        stmt = stmt.where(ContratoModel.tipo == tipo)

    rows = session.execute(stmt).scalars().all()
    return [_row_to_item(row) for row in rows]


def get_contrato_detalhe(
    session: Session,
    ano: int,
    numero: str,
) -> ContratoDetalhe | None:
    """Busca detalhes de um contrato específico.

    Args:
        session: SQLAlchemy Session.
        ano: Ano de referência.
        numero: Número do contrato.

    Returns:
        ContratoDetalhe ou None se não encontrado.
    """
    stmt = select(ContratoModel).where(
        ContratoModel.ano == ano,
        ContratoModel.numero == numero,
    )
    row = session.execute(stmt).scalar_one_or_none()
    if row is None:
        return None
    return _row_to_detalhe(row)


def get_anos_disponiveis(session: Session) -> list[int]:
    """Retorna anos com contratos registrados.

    Args:
        session: SQLAlchemy Session.

    Returns:
        Lista de anos (ordenada decrescente).
    """
    stmt = (
        select(ContratoModel.ano)
        .distinct()
        .order_by(ContratoModel.ano.desc())
    )
    rows = session.execute(stmt).scalars().all()
    return list(rows)


def upsert_contratos(
    session: Session,
    items: list[ContratoItem],
) -> int:
    """Insere ou atualiza contratos no banco (upsert).

    A chave de unicidade é (ano, numero).
    Em caso de conflito, atualiza fornecedor, cpf_cnpj, tipo, vigencia, valor.

    Args:
        session: SQLAlchemy Session.
        items: Lista de ContratoItem a persistir.

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
            "fornecedor": item.fornecedor,
            "cpf_cnpj": item.cpf_cnpj,
            "tipo": item.tipo,
            "vigencia": item.vigencia,
            "valor": Decimal(str(item.valor)),
            "fonte": "QUALITY_SCRAPER",
            "created_at": now,
            "updated_at": now,
        }
        for item in items
    ]

    stmt = sqlite_insert(ContratoModel).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=["ano", "numero"],
        set_={
            "fornecedor": stmt.excluded.fornecedor,
            "cpf_cnpj": stmt.excluded.cpf_cnpj,
            "tipo": stmt.excluded.tipo,
            "vigencia": stmt.excluded.vigencia,
            "valor": stmt.excluded.valor,
            "updated_at": now,
        },
    )

    result = session.execute(stmt)
    return result.rowcount or 0


def _row_to_item(row: ContratoModel) -> ContratoItem:
    """Converte model SQLAlchemy para ContratoItem."""
    return ContratoItem(
        numero=row.numero,
        fornecedor=row.fornecedor,
        cpf_cnpj=row.cpf_cnpj,
        tipo=row.tipo,
        vigencia=row.vigencia or "-",
        valor=float(row.valor),
        ano=row.ano,
    )


def _row_to_detalhe(row: ContratoModel) -> ContratoDetalhe:
    """Converte model SQLAlchemy para ContratoDetalhe."""
    fiscais = _parse_fiscais(row.fiscais_json)  # type: ignore[arg-type]

    return ContratoDetalhe(
        numero=row.numero,
        fornecedor=row.fornecedor,
        cpf_cnpj=row.cpf_cnpj,
        tipo=row.tipo,
        vigencia=row.vigencia or "-",
        valor=float(row.valor),
        objeto=row.objeto or "",
        processo_numero=row.processo_numero or "",
        licitacao=row.licitacao or "",
        assunto=row.assunto or "",
        qtd_aditivos=row.qtd_aditivos or 0,
        valor_contratado=float(row.valor_contratado or 0),
        valor_atualizado=float(row.valor_atualizado or 0),
        saldo_pagar=float(row.saldo_pagar or 0),
        valor_anulado=float(row.valor_anulado or 0),
        dotacoes_orcamentarias=row.dotacoes_orcamentarias or "",
        fiscais=fiscais,
        ano=row.ano,
    )


def _parse_fiscais(fiscais_json: str | None) -> list[ContratoFiscal]:
    """Converte JSON string de fiscais para lista de ContratoFiscal."""
    if not fiscais_json:
        return []

    try:
        data = json.loads(fiscais_json)
        if not isinstance(data, list):
            return []
        return [
            ContratoFiscal(
                nome=str(f.get("nome", "")),
                tipo=str(f.get("tipo", "")),
                data_inicio=str(f.get("data_inicio", "")),
                data_fim=str(f.get("data_fim", "")),
            )
            for f in data
            if f.get("nome")
        ]
    except (json.JSONDecodeError, TypeError):
        logger.warning("Falha ao parsear fiscais_json: %s", fiscais_json)
        return []
