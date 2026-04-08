"""
Entidade de domínio para Despesa Municipal.

Representa uma despesa orçamentária com valores empenhados, liquidados e pagos.
"""

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from enum import Enum
from typing import Optional


class TipoDespesa(str, Enum):
    """Enumeração dos tipos de despesa."""

    CORRENTE = "DESPESAS CORRENTES"
    CAPITAL = "DESPESAS DE CAPITAL"
    CONTINGENCIA = "RESERVA DE CONTINGÊNCIA"


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
    categoria: Optional[str] = None
    subcategoria: Optional[str] = None
    tipo: TipoDespesa = field(default=TipoDespesa.CORRENTE)
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
        """Valida se os valores monetários são válidos."""
        # Empenhado e liquidado podem ser negativos em casos de estorno
        # Pago deve ser positivo
        if self.valor_pago < 0:
            raise ValueError(f"Valor pago não pode ser negativo: {self.valor_pago}")

    def percentual_liquidado(self) -> Decimal:
        """Calcula o percentual liquidado em relação ao empenhado."""
        if self.valor_empenhado == 0:
            return Decimal("0")
        return (self.valor_liquidado / abs(self.valor_empenhado)) * Decimal("100")

    def percentual_pago(self) -> Decimal:
        """Calcula o percentual pago em relação ao liquidado."""
        if self.valor_liquidado == 0:
            return Decimal("0")
        return (self.valor_pago / abs(self.valor_liquidado)) * Decimal("100")

    def saldo_empenhado_nao_liquidado(self) -> Decimal:
        """Retorna o saldo empenhado mas não liquidado."""
        return self.valor_empenhado - self.valor_liquidado

    def saldo_liquidado_nao_pago(self) -> Decimal:
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
