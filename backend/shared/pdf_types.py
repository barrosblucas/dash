"""Entidades, constantes e utilitários para extração de dados de PDFs financeiros."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from decimal import Decimal
from enum import StrEnum
from pathlib import Path

from backend.features.despesa.despesa_types import Despesa
from backend.features.receita.receita_types import Receita


class TipoDocumento(StrEnum):
    """Tipo de documento PDF."""

    RECEITA = "RECEITA"
    DESPESA = "DESPESA"


@dataclass
class ReceitaDetalhamento:
    """Item do detalhamento hierárquico de receita."""

    ano: int
    detalhamento: str
    nivel: int
    ordem: int
    tipo: str  # "CORRENTE" ou "CAPITAL"
    valor_previsto: Decimal
    valor_arrecadado: Decimal
    valor_anulado: Decimal = field(default=Decimal("0"))
    valores_mensais: dict[str, Decimal] | None = field(default=None)
    valores_anulados_mensais: dict[str, Decimal] | None = field(default=None)
    fonte: str = "PDF"
    id: int | None = None


@dataclass
class ResultadoExtracao:
    """Resultado da extração de um PDF."""

    sucesso: bool
    arquivo: str
    tipo: TipoDocumento
    ano: int
    receitas: list[Receita] = field(default_factory=list)
    despesas: list[Despesa] = field(default_factory=list)
    detalhamentos: list[ReceitaDetalhamento] = field(default_factory=list)
    erro: str | None = None
    registros_processados: int = 0

    def __str__(self) -> str:
        """Representação em string do resultado."""
        status = "SUCESSO" if self.sucesso else "ERRO"
        return (
            f"ResultadoExtracao({self.arquivo} - {status} - "
            f"{self.registros_processados} registros)"
        )


# Mapeamento de nomes de meses para números
MESES_MAP: dict[str, int] = {
    "JANEIRO": 1,
    "FEVEREIRO": 2,
    "MARÇO": 3,
    "MARCO": 3,
    "ABRIL": 4,
    "MAIO": 5,
    "JUNHO": 6,
    "JULHO": 7,
    "AGOSTO": 8,
    "SETEMBRO": 9,
    "OUTUBRO": 10,
    "NOVEMBRO": 11,
    "DEZEMBRO": 12,
}

# Mapeamento de nomes de meses abreviados (usados nas tabelas de despesas)
MESES_ABREV_MAP: dict[str, int] = {
    "JANEIRO": 1,
    "FEVEREIRO": 2,
    "MARÇO": 3,
    "ABRIL": 4,
    "MAIO": 5,
    "JUNHO": 6,
    "JULHO": 7,
    "AGOSTO": 8,
    "SETEMBRO": 9,
    "OUTUBRO": 10,
    "NOVEMBRO": 11,
    "DEZEMBRO": 12,
}

# Cabeçalhos a ignorar no processamento de tabelas
SKIP_HEADERS = {
    "DETALHAMENTO",
    "MÊS",
    "MES",
    "TOTAL",
    "",
    "NONE",
    "DESCRIÇÃO",
    "DESCRICAO",
    "VALOR ARRECADADO",
}


def parse_valor_monetario(valor_str: str) -> Decimal:
    """
    Converte string de valor monetário brasileiro para Decimal.

    Args:
        valor_str: String no formato brasileiro (ex: "R$ 1.234.567,89").

    Returns:
        Decimal com o valor numérico.
    """
    if not valor_str:
        return Decimal("0")

    valor_limpo = valor_str.replace("R$", "").replace("$", "").strip()

    negativo = "-" in valor_limpo
    valor_limpo = valor_limpo.replace("-", "").strip()

    valor_limpo = valor_limpo.replace(".", "").replace(",", ".")

    valor_limpo = re.sub(r"[^\d.\-]", "", valor_limpo)

    if not valor_limpo:
        return Decimal("0")

    try:
        valor = Decimal(valor_limpo)
        return -valor if negativo else valor
    except Exception:
        return Decimal("0")


def extrair_ano_do_arquivo(arquivo: Path) -> int:
    """Extrai o ano do nome do arquivo (ex: 2025.pdf -> 2025)."""
    match = re.search(r"(\d{4})\.pdf$", arquivo.name, re.IGNORECASE)
    if match:
        return int(match.group(1))
    raise ValueError(f"Não foi possível extrair o ano do arquivo: {arquivo}")
