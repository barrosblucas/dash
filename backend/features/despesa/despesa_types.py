"""
Despesa bounded context — types, entities, and schemas.

Consolidates:
  - domain/entities/despesa.py (entity + enums)
  - api/schemas_despesa.py (Pydantic schemas)
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, Field

# ═══════════════════════════════════════════════════════════════════════════
# ENTITY + ENUM
# ═══════════════════════════════════════════════════════════════════════════

class TipoDespesa(StrEnum):
    """Enumeração dos tipos de despesa."""

    CORRENTE = "CORRENTE"
    CAPITAL = "CAPITAL"
    CONTINGENCIA = "CONTINGENCIA"


@dataclass
class Despesa:
    """
    Entidade representando uma despesa municipal.

    Attributes:
        id: Identificador único da despesa
        ano: Ano da despesa
        mes: Mês da despesa (1-12)
        categoria: Categoria da despesa (ex: Pessoal, Material, Serviços)
        subcategoria: Subcategoria da despesa (opcional)
        valor_empenhado: Valor empenhado (comprometido)
        valor_liquidado: Valor liquidado (serviço prestado/bem entregue)
        valor_pago: Valor efetivamente pago
        tipo: Tipo da despesa (corrente, capital ou contingência)
        fonte: Fonte dos dados (PDF, API, etc.)
        created_at: Data de criação do registro
        updated_at: Data da última atualização
    """

    ano: int
    mes: int
    valor_empenhado: Decimal
    valor_liquidado: Decimal
    valor_pago: Decimal
    tipo: TipoDespesa = TipoDespesa.CORRENTE
    id: int | None = None
    categoria: str | None = None
    subcategoria: str | None = None
    fonte: str = "PDF"
    created_at: date | None = None
    updated_at: date | None = None

    def __post_init__(self) -> None:
        """Validações básicas após inicialização."""
        if not 1 <= self.mes <= 12:
            raise ValueError(f"Mês inválido: {self.mes}. Deve ser entre 1 e 12.")
        if self.ano < 2000:
            raise ValueError(f"Ano inválido: {self.ano}. Deve ser >= 2000.")

    def saldo_a_pagar(self) -> Decimal:
        """Retorna o saldo liquidado mas não pago."""
        return self.valor_liquidado - self.valor_pago

    def periodo(self) -> str:
        """Retorna o período no formato MM/YYYY."""
        return f"{self.mes:02d}/{self.ano}"

    def __str__(self) -> str:
        """Representação em string da despesa."""
        return (
            f"Despesa({self.periodo()} - "
            f"Empenhado: R$ {self.valor_empenhado:,.2f}, "
            f"Liquidado: R$ {self.valor_liquidado:,.2f}, "
            f"Pago: R$ {self.valor_pago:,.2f})"
        )

    def __repr__(self) -> str:
        """Representação para debug."""
        return (
            f"Despesa(ano={self.ano}, mes={self.mes}, "
            f"valor_empenhado={self.valor_empenhado}, "
            f"valor_liquidado={self.valor_liquidado}, "
            f"valor_pago={self.valor_pago})"
        )


# ═══════════════════════════════════════════════════════════════════════════
# PYDANTIC SCHEMAS (from api/schemas_despesa.py)
# ═══════════════════════════════════════════════════════════════════════════

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


class DespesaBreakdownResponse(BaseModel):
    """Schema de resposta para breakdown de despesa."""
    id: int | None = None
    ano: int = Field(..., description="Ano de referência")
    mes: int = Field(..., ge=1, le=12, description="Mês (1-12)")
    breakdown_type: str = Field(..., description="Tipo: ORGAO, FUNCAO ou ELEMENTO")
    item_label: str = Field(..., description="Descrição do item")
    valor: Decimal = Field(..., description="Valor monetário")
    fonte: str = Field(default="QUALITY_API", description="Fonte dos dados")

    class Config:
        from_attributes = True
        json_encoders = {Decimal: lambda v: float(v)}


class DespesaBreakdownListResponse(BaseModel):
    """Schema de resposta para lista de breakdown."""
    breakdown_type: str
    ano: int
    data: list[DespesaBreakdownResponse]
    total: int


class DespesaBreakdownTotalsResponse(BaseModel):
    """Schema de resposta para totais de breakdown por item."""
    breakdown_type: str
    ano: int
    items: list[dict]
    total_items: int
