"""Schemas Pydantic para despesas."""

from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, Field


class TipoDespesaEnum(StrEnum):
    """Tipo de despesa."""

    CORRENTE = "CORRENTE"
    CAPITAL = "CAPITAL"
    CONTINGENCIA = "CONTINGENCIA"


class DespesaResponse(BaseModel):
    """Schema de resposta para despesa."""

    id: int | None = None
    ano: int = Field(..., description="Ano da despesa")
    mes: int = Field(..., ge=1, le=12, description="Mês da despesa (1-12)")
    categoria: str | None = Field(None, description="Categoria da despesa")
    subcategoria: str | None = Field(None, description="Subcategoria da despesa")
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

    despesas: list[DespesaResponse]
    total: int
    page: int
    page_size: int
    has_next: bool


class DespesaFilterParams(BaseModel):
    """Parâmetros de filtro para despesas."""

    ano: int | None = Field(None, ge=2013, le=2030, description="Filtrar por ano")
    mes: int | None = Field(None, ge=1, le=12, description="Filtrar por mês")
    categoria: str | None = Field(
        None, description="Filtrar por categoria (busca parcial)"
    )
    tipo: TipoDespesaEnum | None = Field(None, description="Filtrar por tipo")
    ano_inicio: int | None = Field(
        None, ge=2013, le=2030, description="Ano inicial do período"
    )
    ano_fim: int | None = Field(
        None, ge=2013, le=2030, description="Ano final do período"
    )
    limit: int | None = Field(
        None, ge=1, le=1000, description="Limite de resultados"
    )
    offset: int | None = Field(None, ge=0, description="Offset para paginação")
