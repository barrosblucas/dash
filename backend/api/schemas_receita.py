"""Schemas Pydantic para receitas."""

from datetime import date
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, Field


class TipoReceitaEnum(StrEnum):
    """Tipo de receita."""

    CORRENTE = "CORRENTE"
    CAPITAL = "CAPITAL"


class ReceitaResponse(BaseModel):
    """Schema de resposta para receita."""

    id: int | None = None
    ano: int = Field(..., description="Ano da receita")
    mes: int = Field(..., ge=1, le=12, description="Mês da receita (1-12)")
    categoria: str = Field(..., description="Categoria da receita")
    subcategoria: str | None = Field(None, description="Subcategoria da receita")
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

    receitas: list[ReceitaResponse]
    total: int
    page: int
    page_size: int
    has_next: bool


class ReceitaFilterParams(BaseModel):
    """Parâmetros de filtro para receitas."""

    ano: int | None = Field(None, ge=2013, le=2030, description="Filtrar por ano")
    mes: int | None = Field(None, ge=1, le=12, description="Filtrar por mês")
    categoria: str | None = Field(
        None, description="Filtrar por categoria (busca parcial)"
    )
    tipo: TipoReceitaEnum | None = Field(None, description="Filtrar por tipo")
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


class ReceitaDetalhamentoResponse(BaseModel):
    """Schema de resposta para detalhamento hierárquico de receita."""

    id: int = Field(..., description="ID do registro")
    ano: int = Field(..., description="Ano de referência")
    detalhamento: str = Field(..., description="Nome da categoria detalhada")
    nivel: int = Field(
        ..., ge=1, description="Nível na hierarquia (1=raiz, 2=sub, etc.)"
    )
    ordem: int = Field(..., ge=0, description="Ordem de apresentação no PDF")
    tipo: str = Field(..., description="Tipo: CORRENTE ou CAPITAL")
    valor_previsto: Decimal = Field(..., description="Valor previsto anual")
    valor_arrecadado: Decimal = Field(..., description="Valor arrecadado anual")
    valor_anulado: Decimal = Field(
        default=Decimal("0"), description="Valor anulado anual"
    )
    fonte: str = Field(default="PDF", description="Fonte dos dados")

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v),
        }


class ReceitaDetalhamentoListResponse(BaseModel):
    """Schema de resposta para lista de detalhamento de um ano."""

    ano: int = Field(..., description="Ano de referência")
    itens: list[ReceitaDetalhamentoResponse] = Field(
        ..., description="Lista de itens do detalhamento"
    )
    total_itens: int = Field(..., description="Total de itens")


class ETLStatusResponse(BaseModel):
    """Schema de resposta para status do ETL."""

    arquivo: str
    tipo: str
    ano: int
    status: str
    registros_processados: int
    erro: str | None = None
    processed_at: date | None = None
