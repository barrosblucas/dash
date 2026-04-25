"""Parser de breakdown de despesas a partir do JSON do portal QualitySistemas."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

logger = logging.getLogger(__name__)

MESES_KEYS: list[str] = [
    "janeiro",
    "fevereiro",
    "marco",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
]


@dataclass
class DespesaBreakdown:
    """Entidade representando um breakdown de despesa (por órgão, função ou elemento)."""

    ano: int
    mes: int
    breakdown_type: str  # "ORGAO", "FUNCAO", "ELEMENTO"
    item_label: str
    valor: Decimal
    fonte: str


class DespesaBreakdownScraper:
    """Extrai entidades DespesaBreakdown de payloads JSON do QualitySistemas."""

    def parse_despesas_orgao(
        self, data: dict[str, Any], year: int
    ) -> list[DespesaBreakdown]:
        """Converte payload de Orgao em entidades DespesaBreakdown."""
        return self._parse_breakdown(data, year, "ORGAO")

    def parse_despesas_funcao(
        self, data: dict[str, Any], year: int
    ) -> list[DespesaBreakdown]:
        """Converte payload de Funcao em entidades DespesaBreakdown."""
        return self._parse_breakdown(data, year, "FUNCAO")

    def parse_despesas_elemento(
        self, data: dict[str, Any], year: int
    ) -> list[DespesaBreakdown]:
        """Converte payload de ElementoDespesa em entidades DespesaBreakdown."""
        return self._parse_breakdown(data, year, "ELEMENTO")

    def _parse_breakdown(
        self, data: dict[str, Any], year: int, breakdown_type: str
    ) -> list[DespesaBreakdown]:
        """Converte payload de breakdown (órgão/função/elemento) em entidades DespesaBreakdown.

        Payload format: { "0": { "descricao": "...", "janeiro": "1.234,56", ... }, "1": {...}, ... }
        Each entry has 'descricao' + 12 monthly keys.
        """
        if not data:
            logger.info("Payload de %s vazio para ano %d", breakdown_type, year)
            return []

        # Extract entries (numeric keys like "0", "1", ...)
        entries: list[dict[str, Any]] = []
        for key, value in data.items():
            if key.isdigit() and isinstance(value, dict):
                entries.append(value)

        if not entries:
            logger.warning(
                "Nenhum registro encontrado em payload de %s para %d",
                breakdown_type,
                year,
            )
            return []

        results: list[DespesaBreakdown] = []
        for entry in entries:
            descricao = entry.get("descricao", "")
            if not isinstance(descricao, str) or not descricao.strip():
                continue
            descricao = descricao.strip()

            for mes_key, mes_num in zip(MESES_KEYS, range(1, 13), strict=False):
                valor_bruto = entry.get(mes_key)
                valor = _parse_brazilian_currency(valor_bruto)

                results.append(
                    DespesaBreakdown(
                        ano=year,
                        mes=mes_num,
                        breakdown_type=breakdown_type,
                        item_label=descricao,
                        valor=valor,
                        fonte=f"SCRAPING_{year}",
                    )
                )

        logger.info(
            "Parseados %d registros de %s para %d (de %d entradas bruto)",
            len(results),
            breakdown_type,
            year,
            len(entries),
        )
        return results


def _parse_brazilian_currency(value: str | float | None) -> Decimal:
    """Converte valor monetário brasileiro para Decimal.

    Formatos aceitos:
        - "1.234.567,89" → Decimal("1234567.89")
        - "500,00" → Decimal("500.00")
        - "-1.000,50" → Decimal("-1000.50")
        - 1234.56 (float) → Decimal("1234.56")
        - None / "" / " " → Decimal("0")

    Args:
        value: Valor em formato brasileiro, numérico, ou ausente.

    Returns:
        Decimal correspondente, ou ``Decimal("0")`` para valores vazios.
    """
    if value is None:
        return Decimal("0")

    if isinstance(value, int | float):
        return Decimal(str(value))

    if not isinstance(value, str) or not value.strip():
        return Decimal("0")

    valor_limpo = value.strip()

    # Detectar sinal negativo
    negativo = valor_limpo.startswith("-")
    if negativo:
        valor_limpo = valor_limpo[1:].strip()

    # Remover separador de milhar (.) e trocar decimal (,) por (.)
    valor_limpo = valor_limpo.replace(".", "").replace(",", ".")

    if not valor_limpo or valor_limpo == ".":
        return Decimal("0")

    try:
        resultado = Decimal(valor_limpo)
    except Exception:
        logger.debug("Falha ao parsear valor monetário '%s'", value)
        return Decimal("0")

    return -resultado if negativo else resultado
