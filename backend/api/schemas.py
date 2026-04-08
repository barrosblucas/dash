"""
Schemas Pydantic para validação e serialização da API.

Define modelos de entrada e saída para todos os endpoints.
"""

from datetime import date
from decimal import Decimal
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class TipoReceitaEnum(str, Enum):
    """Tipo de receita."""

    CORRENTE = "CORRENTE"
    CAPITAL = "CAPITAL"


class TipoDespesaEnum(str, Enum):
    """Tipo de despesa."""

    CORRENTE = "CORRENTE"
    CAPITAL = "CAPITAL"
    CONTINGENCIA = "CONTINGENCIA"


class ReceitaResponse(BaseModel):
    """Schema de resposta para receita."""

    id: Optional[int] = None
    ano: int = Field(..., description="Ano da receita")
    mes: int = Field(..., ge=1, le=12, description="Mês da receita (1-12)")
    categoria: str = Field(..., description="Categoria da receita")
    subcategoria: Optional[str] = Field(None, description="Subcategoria da receita")
    tipo: TipoReceitaEnum = Field(
        default=TipoReceitaEnum.CORRENTE, description="Tipo da receita"
    )
    valor_previsto: Decimal = Field(..., description="Valor previsto no orçamento")
    valor_arrecadado: Decimal = Field(..., description="Valor arrecadado")
    valor_anulado: Decimal = Field(default=Decimal("0"), description="Valor anulado")
    fonte: str = Field(default="PDF", description="Fonte dos dados")

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v),
        }


class ReceitaListResponse(BaseModel):
    """Schema de resposta para lista de receitas."""

    receitas: List[ReceitaResponse]
    total: int
    page: int
    page_size: int
    has_next: bool


class ReceitaFilterParams(BaseModel):
    """Parâmetros de filtro para receitas."""

    ano: Optional[int] = Field(None, ge=2013, le=2030, description="Filtrar por ano")
    mes: Optional[int] = Field(None, ge=1, le=12, description="Filtrar por mês")
    categoria: Optional[str] = Field(
        None, description="Filtrar por categoria (busca parcial)"
    )
    tipo: Optional[TipoReceitaEnum] = Field(None, description="Filtrar por tipo")
    ano_inicio: Optional[int] = Field(
        None, ge=2013, le=2030, description="Ano inicial do período"
    )
    ano_fim: Optional[int] = Field(
        None, ge=2013, le=2030, description="Ano final do período"
    )
    limit: Optional[int] = Field(
        None, ge=1, le=1000, description="Limite de resultados"
    )
    offset: Optional[int] = Field(None, ge=0, description="Offset para paginação")


class DespesaResponse(BaseModel):
    """Schema de resposta para despesa."""

    id: Optional[int] = None
    ano: int = Field(..., description="Ano da despesa")
    mes: int = Field(..., ge=1, le=12, description="Mês da despesa (1-12)")
    categoria: Optional[str] = Field(None, description="Categoria da despesa")
    subcategoria: Optional[str] = Field(None, description="Subcategoria da despesa")
    tipo: TipoDespesaEnum = Field(
        default=TipoDespesaEnum.CORRENTE, description="Tipo da despesa"
    )
    valor_empenhado: Decimal = Field(..., description="Valor empenhado")
    valor_liquidado: Decimal = Field(..., description="Valor liquidado")
    valor_pago: Decimal = Field(..., description="Valor pago")
    fonte: str = Field(default="PDF", description="Fonte dos dados")

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v),
        }


class DespesaListResponse(BaseModel):
    """Schema de resposta para lista de despesas."""

    despesas: List[DespesaResponse]
    total: int
    page: int
    page_size: int
    has_next: bool


class DespesaFilterParams(BaseModel):
    """Parâmetros de filtro para despesas."""

    ano: Optional[int] = Field(None, ge=2013, le=2030, description="Filtrar por ano")
    mes: Optional[int] = Field(None, ge=1, le=12, description="Filtrar por mês")
    categoria: Optional[str] = Field(
        None, description="Filtrar por categoria (busca parcial)"
    )
    tipo: Optional[TipoDespesaEnum] = Field(None, description="Filtrar por tipo")
    ano_inicio: Optional[int] = Field(
        None, ge=2013, le=2030, description="Ano inicial do período"
    )
    ano_fim: Optional[int] = Field(
        None, ge=2013, le=2030, description="Ano final do período"
    )
    limit: Optional[int] = Field(
        None, ge=1, le=1000, description="Limite de resultados"
    )
    offset: Optional[int] = Field(None, ge=0, description="Offset para paginação")


class KPIMensal(BaseModel):
    """KPI mensal."""

    mes: int
    ano: int
    total_receitas: Decimal
    total_despesas: Decimal
    saldo: Decimal
    percentual_execucao_receita: Optional[Decimal] = None
    percentual_execucao_despesa: Optional[Decimal] = None


class KPIAnual(BaseModel):
    """KPI anual."""

    ano: int
    total_receitas: Decimal
    total_despesas: Decimal
    saldo: Decimal
    receitas_correntes: Optional[Decimal] = None
    receitas_capital: Optional[Decimal] = None
    despesas_correntes: Optional[Decimal] = None
    despesas_capital: Optional[Decimal] = None


class KPIsResponse(BaseModel):
    """Schema de resposta para KPIs."""

    periodo: str = Field(..., description="Período de referência (ex: 2023 ou 2023-01)")
    receitas_total: Decimal = Field(..., description="Total de receitas no período")
    despesas_total: Decimal = Field(..., description="Total de despesas no período")
    saldo: Decimal = Field(..., description="Saldo (receitas - despesas)")
    percentual_execucao_receita: Optional[Decimal] = Field(
        None, description="Percentual de execução das receitas"
    )
    percentual_execucao_despesa: Optional[Decimal] = Field(
        None, description="Percentual de execução das despesas"
    )
    kpis_mensais: Optional[List[KPIMensal]] = Field(None, description="KPIs por mês")
    kpis_anuais: Optional[List[KPIAnual]] = Field(None, description="KPIs por ano")


class HealthCheckResponse(BaseModel):
    """Schema de resposta para health check."""

    status: str = Field(..., description="Status da API")
    version: str = Field(default="1.0.0", description="Versão da API")
    database: str = Field(..., description="Status do banco de dados")
    timestamp: date = Field(default_factory=date.today, description="Data atual")


class ErrorResponse(BaseModel):
    """Schema de resposta para erros."""

    error: str = Field(..., description="Mensagem de erro")
    detail: Optional[str] = Field(None, description="Detalhes do erro")
    code: Optional[str] = Field(None, description="Código do erro")


class ETLStatusResponse(BaseModel):
    """Schema de resposta para status do ETL."""

    arquivo: str
    tipo: str
    ano: int
    status: str
    registros_processados: int
    erro: Optional[str] = None
    processed_at: Optional[date] = None
