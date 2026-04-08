"""
Entidade de domínio para Receita Municipal.

Representa uma receita orçamentária com valores previstos e arrecadados.
"""

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from enum import Enum
from typing import Optional


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
    valor_anulado: Decimal = field(default=Decimal("0"))
    tipo: TipoReceita = field(default=TipoReceita.CORRENTE)
    subcategoria: Optional[str] = None
    fonte: str = "PDF"
    id: Optional[int] = None
    created_at: Optional[date] = None
    updated_at: Optional[date] = None

    def __post_init__(self):
        """Validação pós-inicialização."""
        self._validar_ano()
        self._validar_mes()
        self._validar_valores()

    def _validar_ano(self) -> None:
        """Valida se o ano está dentro do range esperado."""
        if not 2013 <= self.ano <= 2030:
            raise ValueError(f"Ano inválido: {self.ano}. Deve estar entre 2013 e 2030.")

    def _validar_mes(self) -> None:
        """Valida se o mês está entre 1 e 12."""
        if not 1 <= self.mes <= 12:
            raise ValueError(f"Mês inválido: {self.mes}. Deve estar entre 1 e 12.")

    def _validar_valores(self) -> None:
        """Valida se os valores monetários são não-negativos."""
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
