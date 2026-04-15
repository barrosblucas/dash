"""Testes unitários do parser de receitas (ReceitaScraper)."""

from __future__ import annotations

from decimal import Decimal

import pytest

from backend.etl.scrapers.receita_scraper import ReceitaScraper


@pytest.fixture
def scraper() -> ReceitaScraper:
    return ReceitaScraper()


def test_parse_revenue_monthly_mantem_mes_com_valor_zero(
    scraper: ReceitaScraper,
) -> None:
    data = [
        {"mes": "JANEIRO", "valorArrecadado": "0"},
        {"mes": "FEVEREIRO", "valorArrecadado": "123.45"},
    ]

    result = scraper.parse_revenue_monthly(data, 2026)

    assert len(result) == 2
    assert result[0].mes == 1
    assert result[0].valor_arrecadado == Decimal("0")
    assert result[0].fonte == "SCRAPING_2026"
    assert result[1].mes == 2
    assert result[1].valor_arrecadado == Decimal("123.45")


def test_parse_revenue_monthly_ignora_mes_invalido(
    scraper: ReceitaScraper,
) -> None:
    data = [
        {"mes": "INEXISTENTE", "valorArrecadado": "99"},
        {"mes": "MARCO", "valorArrecadado": "1"},
    ]

    result = scraper.parse_revenue_monthly(data, 2026)

    assert len(result) == 1
    assert result[0].mes == 3
