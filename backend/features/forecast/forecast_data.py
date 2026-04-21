"""
Camada de acesso a dados para forecasting.

Responsável por buscar dados históricos do banco de dados.
Contém todas as dependências SQLAlchemy — isoladas da lógica de domínio.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.shared.database.models import DespesaModel, ReceitaModel


def get_receitas_mensais(db: Session) -> list[tuple[datetime, float]]:
    """
    Busca receitas mensais históricas do banco de dados.

    Returns:
        Lista de tuplas (data, valor)
    """
    resultados = (
        db.query(
            ReceitaModel.ano.label("ano"),
            ReceitaModel.mes.label("mes"),
            func.sum(ReceitaModel.valor_arrecadado).label("valor"),
        )
        .filter(ReceitaModel.mes >= 1, ReceitaModel.mes <= 12)
        .group_by(ReceitaModel.ano, ReceitaModel.mes)
        .order_by(ReceitaModel.ano, ReceitaModel.mes)
        .all()
    )

    dados: list[tuple[datetime, float]] = []
    for r in resultados:
        if r.ano and r.mes and r.valor is not None:
            ano = int(r.ano)
            mes = int(r.mes)
            data = datetime(ano, mes, 1)
            valor = float(r.valor)
            dados.append((data, valor))

    return dados


def get_despesas_mensais(db: Session) -> list[tuple[datetime, float]]:
    """
    Busca despesas mensais históricas do banco de dados.

    Returns:
        Lista de tuplas (data, valor)
    """
    resultados = (
        db.query(
            DespesaModel.ano.label("ano"),
            DespesaModel.mes.label("mes"),
            func.sum(DespesaModel.valor_pago).label("valor"),
        )
        .filter(DespesaModel.mes >= 1, DespesaModel.mes <= 12)
        .group_by(DespesaModel.ano, DespesaModel.mes)
        .order_by(DespesaModel.ano, DespesaModel.mes)
        .all()
    )

    dados: list[tuple[datetime, float]] = []
    for r in resultados:
        if r.ano and r.mes and r.valor is not None:
            ano = int(r.ano)
            mes = int(r.mes)
            data = datetime(ano, mes, 1)
            valor = float(r.valor)
            dados.append((data, valor))

    return dados
