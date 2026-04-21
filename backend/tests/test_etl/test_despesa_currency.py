"""Testes do helper de parsing de valores monetários brasileiros."""

from __future__ import annotations

from decimal import Decimal

from backend.etl.scrapers.despesa_scraper import _parse_brazilian_currency


class TestParseBrazilianCurrency:
    """Testes do helper de parsing de valores monetários brasileiros."""

    def test_valor_completo_com_milhar_e_decimal(self) -> None:
        assert _parse_brazilian_currency("1.234.567,89") == Decimal("1234567.89")

    def test_valor_apenas_decimal(self) -> None:
        assert _parse_brazilian_currency("500,00") == Decimal("500.00")

    def test_valor_pequeno_sem_decimal(self) -> None:
        assert _parse_brazilian_currency("100") == Decimal("100")

    def test_valor_zero(self) -> None:
        assert _parse_brazilian_currency("0,00") == Decimal("0")

    def test_none_retorna_zero(self) -> None:
        assert _parse_brazilian_currency(None) == Decimal("0")

    def test_string_vazia_retorna_zero(self) -> None:
        assert _parse_brazilian_currency("") == Decimal("0")

    def test_espacos_retorna_zero(self) -> None:
        assert _parse_brazilian_currency("   ") == Decimal("0")

    def test_float_direto(self) -> None:
        assert _parse_brazilian_currency(1234.56) == Decimal("1234.56")

    def test_int_direto(self) -> None:
        assert _parse_brazilian_currency(1000) == Decimal("1000")

    def test_valor_negativo(self) -> None:
        assert _parse_brazilian_currency("-1.000,50") == Decimal("-1000.50")

    def test_valor_com_espacos(self) -> None:
        assert _parse_brazilian_currency("  1.234,56  ") == Decimal("1234.56")

    def test_valor_invalido_retorna_zero(self) -> None:
        assert _parse_brazilian_currency("abc") == Decimal("0")

    def test_valor_apenas_ponto(self) -> None:
        assert _parse_brazilian_currency(".") == Decimal("0")
