"""
Persistência de KPIs — consultas SQL agregadas.

Camada de dados: usa SQLAlchemy diretamente.
Não contém lógica de negócio, apenas queries e mapeamento de resultados.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from backend.shared.database.models import DespesaModel, ReceitaModel


@dataclass(frozen=True)
class RawTotaisAnuais:
    """Totais agregados por ano (receita e despesa)."""

    receitas_por_ano_tipo: list[tuple[int, str, Decimal]]
    despesas_por_ano_tipo: list[tuple[int, str, Decimal]]


@dataclass(frozen=True)
class RawTotaisMensais:
    """Totais agregados por mês (receita e despesa)."""

    receitas_mensais: list[tuple[int, Decimal]]
    despesas_mensais: list[tuple[int, Decimal]]


@dataclass(frozen=True)
class RawKPIAnual:
    """Resultado bruto de uma única query de soma."""

    valor: Decimal


def get_ano_mais_recente(db: Session) -> int:
    """Retorna o ano mais recente com dados (receita ou despesa)."""
    ano_r = db.query(func.max(ReceitaModel.ano)).scalar()
    ano_d = db.query(func.max(DespesaModel.ano)).scalar()
    return max(ano_r or 2013, ano_d or 2013)


def get_totais_anuais(
    db: Session,
    ano: int,
) -> tuple[Decimal, Decimal, Decimal, Decimal]:
    """Retorna (total_receitas, total_despesas, total_previsto, total_empenhado) para um ano."""
    total_receitas = (
        db.query(func.sum(ReceitaModel.valor_arrecadado))
        .filter(ReceitaModel.ano == ano)
        .scalar()
    ) or Decimal("0")

    total_despesas = (
        db.query(func.sum(DespesaModel.valor_pago))
        .filter(DespesaModel.ano == ano)
        .scalar()
    ) or Decimal("0")

    total_previsto = (
        db.query(func.sum(ReceitaModel.valor_previsto))
        .filter(ReceitaModel.ano == ano)
        .scalar()
    ) or Decimal("0")

    total_empenhado = (
        db.query(func.sum(DespesaModel.valor_empenhado))
        .filter(DespesaModel.ano == ano)
        .scalar()
    ) or Decimal("0")

    return total_receitas, total_despesas, total_previsto, total_empenhado


def get_totais_mensais(db: Session, ano: int) -> RawTotaisMensais:
    """Retorna totais de receitas e despesas agrupados por mês."""
    receitas = (
        db.query(ReceitaModel.mes, func.sum(ReceitaModel.valor_arrecadado).label("total"))
        .filter(ReceitaModel.ano == ano)
        .group_by(ReceitaModel.mes)
        .all()
    )

    despesas = (
        db.query(DespesaModel.mes, func.sum(DespesaModel.valor_pago).label("total"))
        .filter(DespesaModel.ano == ano)
        .group_by(DespesaModel.mes)
        .all()
    )

    return RawTotaisMensais(
        receitas_mensais=[(r.mes, Decimal(str(r.total))) for r in receitas],
        despesas_mensais=[(d.mes, Decimal(str(d.total))) for d in despesas],
    )


def get_totais_por_ano_tipo(
    db: Session,
    ano_inicio: int,
    ano_fim: int,
) -> RawTotaisAnuais:
    """Retorna receitas e despesas agrupados por ano e tipo."""
    receitas = (
        db.query(
            ReceitaModel.ano,
            ReceitaModel.tipo,
            func.sum(ReceitaModel.valor_arrecadado).label("total"),
        )
        .filter(and_(ReceitaModel.ano >= ano_inicio, ReceitaModel.ano <= ano_fim))
        .group_by(ReceitaModel.ano, ReceitaModel.tipo)
        .all()
    )

    despesas = (
        db.query(
            DespesaModel.ano,
            DespesaModel.tipo,
            func.sum(DespesaModel.valor_pago).label("total"),
        )
        .filter(and_(DespesaModel.ano >= ano_inicio, DespesaModel.ano <= ano_fim))
        .group_by(DespesaModel.ano, DespesaModel.tipo)
        .all()
    )

    return RawTotaisAnuais(
        receitas_por_ano_tipo=[(r.ano, r.tipo, Decimal(str(r.total))) for r in receitas],
        despesas_por_ano_tipo=[(d.ano, d.tipo, Decimal(str(d.total))) for d in despesas],
    )


def get_resumo_geral(db: Session) -> dict:
    """Retorna estatísticas gerais do banco de dados."""
    total_receitas = db.query(func.count(ReceitaModel.id)).scalar() or 0
    total_despesas = db.query(func.count(DespesaModel.id)).scalar() or 0

    anos_receitas = [
        a[0]
        for a in db.query(ReceitaModel.ano).distinct().order_by(ReceitaModel.ano).all()
    ]
    anos_despesas = [
        a[0]
        for a in db.query(DespesaModel.ano).distinct().order_by(DespesaModel.ano).all()
    ]

    todos_anos = sorted(set(anos_receitas + anos_despesas))
    ano_min = min(todos_anos) if todos_anos else None
    ano_max = max(todos_anos) if todos_anos else None

    return {
        "total_registros": {
            "receitas": total_receitas,
            "despesas": total_despesas,
        },
        "anos_disponiveis": {
            "receitas": anos_receitas,
            "despesas": anos_despesas,
            "todos": todos_anos,
        },
        "periodo": {
            "inicio": ano_min,
            "fim": ano_max,
        },
        "status": "ok",
    }
