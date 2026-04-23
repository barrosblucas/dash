"""Regras puras do bounded context obra."""

from __future__ import annotations

from decimal import Decimal

from backend.features.obra.obra_types import MedicaoPayload


def calculate_valor_medido_total(medicoes: list[MedicaoPayload]) -> Decimal:
    return sum((medicao.valor_medicao for medicao in medicoes), start=Decimal("0"))


def calculate_valor_economizado(
    valor_original: Decimal | None,
    valor_homologado: Decimal | None,
    valor_orcamento: Decimal | None,
) -> Decimal | None:
    if valor_homologado is None:
        return None
    base_value = valor_original if valor_original is not None else valor_orcamento
    if base_value is None:
        return None
    return base_value - valor_homologado
