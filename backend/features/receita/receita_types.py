"""
Receita bounded context — types, entities, schemas, and repository interface.

Consolidates:
  - domain/entities/receita.py (entity + enums)
  - domain/repositories/receita_repository.py (Protocol interface)
  - api/schemas_receita.py (Pydantic schemas)
"""

from __future__ import annotations

from abc import abstractmethod
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from enum import Enum, StrEnum
from typing import Protocol

from pydantic import BaseModel, Field

# ═══════════════════════════════════════════════════════════════════════════
# ENTITY + ENUM
# ═══════════════════════════════════════════════════════════════════════════

class TipoReceita(str, Enum):
    """Enumeração dos tipos de receita."""

    CORRENTE = "RECEITAS CORRENTES"
    CAPITAL = "RECEITAS DE CAPITAL"


@dataclass
class Receita:
    """
    Entidade representando uma receita municipal.

    Attributes:
        id: Identificador único da receita
        ano: Ano da receita
        mes: Mês da receita (1-12)
        categoria: Categoria da receita (ex: IPTU, ISS, Transferências)
        subcategoria: Subcategoria da receita (opcional)
        valor_previsto: Valor previsto no orçamento anual
        valor_arrecadado: Valor efetivamente arrecadado no mês
        valor_anulado: Valor anulado (estornos, devoluções)
        tipo: Tipo da receita (corrente ou capital)
        fonte: Fonte dos dados (PDF, API, etc.)
        created_at: Data de criação do registro
        updated_at: Data da última atualização
    """

    ano: int
    mes: int
    categoria: str
    valor_previsto: Decimal
    valor_arrecadado: Decimal
    valor_anulado: Decimal
    tipo: TipoReceita = TipoReceita.CORRENTE
    id: int | None = None
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
        if self.valor_previsto < 0:
            raise ValueError(
                f"Valor previsto não pode ser negativo: {self.valor_previsto}"
            )
        if self.valor_arrecadado < 0:
            raise ValueError(
                f"Valor arrecadado não pode ser negativo: {self.valor_arrecadado}"
            )
        if self.valor_anulado < 0:
            raise ValueError(
                f"Valor anulado não pode ser negativo: {self.valor_anulado}"
            )

    def percentual_execucao(self) -> Decimal:
        """Calcula o percentual de execução da receita."""
        if self.valor_previsto == 0:
            return Decimal("0")
        return (self.valor_arrecadado / self.valor_previsto) * Decimal("100")

    def valor_liquido(self) -> Decimal:
        """Retorna o valor líquido (arrecadado - anulado)."""
        return self.valor_arrecadado - self.valor_anulado

    def periodo(self) -> str:
        """Retorna o período no formato MM/YYYY."""
        return f"{self.mes:02d}/{self.ano}"

    def __str__(self) -> str:
        """Representação em string da receita."""
        return (
            f"Receita({self.categoria} - {self.periodo()} - "
            f"Previsto: R$ {self.valor_previsto:,.2f}, "
            f"Arrecadado: R$ {self.valor_arrecadado:,.2f})"
        )

    def __repr__(self) -> str:
        """Representação para debug."""
        return (
            f"Receita(ano={self.ano}, mes={self.mes}, categoria='{self.categoria}', "
            f"valor_previsto={self.valor_previsto}, valor_arrecadado={self.valor_arrecadado})"
        )


# ═══════════════════════════════════════════════════════════════════════════
# REPOSITORY INTERFACE (Protocol)
# ═══════════════════════════════════════════════════════════════════════════

class ReceitaRepository(Protocol):
    """
    Protocolo definindo o contrato do repositório de receitas.

    Segue o princípio de inversão de dependência (DIP) permitindo
    que a camada de domínio não dependa de implementações específicas.
    """

    @abstractmethod
    def add(self, receita: Receita) -> Receita: ...

    @abstractmethod
    def add_bulk(self, receitas: list[Receita]) -> int: ...

    @abstractmethod
    def get_by_id(self, receita_id: int) -> Receita | None: ...

    @abstractmethod
    def list(
        self,
        ano: int | None = None,
        mes: int | None = None,
        categoria: str | None = None,
        tipo: TipoReceita | None = None,
        ano_inicio: int | None = None,
        ano_fim: int | None = None,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[Receita]: ...

    @abstractmethod
    def update(self, receita: Receita) -> Receita: ...

    @abstractmethod
    def delete(self, receita_id: int) -> bool: ...

    @abstractmethod
    def get_by_periodo_e_categoria(
        self, ano: int, mes: int, categoria: str
    ) -> Receita | None: ...

    @abstractmethod
    def get_total_by_ano(
        self, ano: int, tipo: TipoReceita | None = None
    ) -> Decimal: ...

    @abstractmethod
    def get_total_by_mes(
        self, ano: int, mes: int, tipo: TipoReceita | None = None
    ) -> Decimal: ...

    @abstractmethod
    def get_categorias(self) -> list[str]: ...

    @abstractmethod
    def count(
        self,
        ano: int | None = None,
        mes: int | None = None,
        categoria: str | None = None,
        tipo: TipoReceita | None = None,
    ) -> int: ...


# ═══════════════════════════════════════════════════════════════════════════
# PYDANTIC SCHEMAS (from api/schemas_receita.py)
# ═══════════════════════════════════════════════════════════════════════════


class TipoReceitaEnum(StrEnum):
    """Tipo de receita para schemas."""

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
