"""
KPI bounded context — types and schemas.

Consolidates:
  - api/schemas_kpi.py (Pydantic schemas)
"""

from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, Field


class KPIMensal(BaseModel):
    """KPI mensal."""

    mes: int
    ano: int
    total_receitas: Decimal
    total_despesas: Decimal
    saldo: Decimal
    percentual_execucao_receita: Decimal | None = None
    percentual_execucao_despesa: Decimal | None = None


class KPIAnual(BaseModel):
    """KPI anual."""

    ano: int
    total_receitas: Decimal
    total_despesas: Decimal
    saldo: Decimal
    receitas_correntes: Decimal | None = None
    receitas_capital: Decimal | None = None
    despesas_correntes: Decimal | None = None
    despesas_capital: Decimal | None = None


class KPIsResponse(BaseModel):
    """Schema de resposta para KPIs."""

    periodo: str = Field(..., description="Período de referência (ex: 2023 ou 2023-01)")
    receitas_total: Decimal = Field(..., description="Total de receitas no período")
    despesas_total: Decimal = Field(..., description="Total de despesas no período")
    saldo: Decimal = Field(..., description="Saldo (receitas - despesas)")
    percentual_execucao_receita: Decimal | None = Field(
        None, description="Percentual de execução das receitas"
    )
    percentual_execucao_despesa: Decimal | None = Field(
        None, description="Percentual de execução das despesas"
    )
    kpis_mensais: list[KPIMensal] | None = Field(None, description="KPIs por mês")
    kpis_anuais: list[KPIAnual] | None = Field(None, description="KPIs por ano")
