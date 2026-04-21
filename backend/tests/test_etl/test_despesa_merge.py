"""Testes da estratégia de merge com degradação graciosa."""

from __future__ import annotations

from decimal import Decimal

from backend.domain.entities.despesa import Despesa
from backend.etl.scrapers.despesa_scraper import DespesaScraper


class TestMergeDespesas:
    """Testes da estratégia de merge com degradação graciosa."""

    def test_prefere_annual(self, scraper: DespesaScraper) -> None:
        annual = [
            Despesa(
                ano=2025,
                mes=1,
                valor_empenhado=Decimal("100"),
                valor_liquidado=Decimal("100"),
                valor_pago=Decimal("100"),
            )
        ]
        natureza = [
            Despesa(
                ano=2025,
                mes=1,
                valor_empenhado=Decimal("200"),
                valor_liquidado=Decimal("200"),
                valor_pago=Decimal("200"),
            )
        ]

        result = scraper.merge_despesas(annual, natureza)
        assert len(result) == 1
        assert result[0].valor_empenhado == Decimal("100")

    def test_fallback_para_annual(self, scraper: DespesaScraper) -> None:
        annual = [
            Despesa(
                ano=2025,
                mes=1,
                valor_empenhado=Decimal("100"),
                valor_liquidado=Decimal("100"),
                valor_pago=Decimal("100"),
            )
        ]

        result = scraper.merge_despesas(annual, [])
        assert len(result) == 1
        assert result[0].valor_empenhado == Decimal("100")

    def test_fallback_para_natureza_quando_annual_vazio(
        self, scraper: DespesaScraper
    ) -> None:
        natureza = [
            Despesa(
                ano=2025,
                mes=1,
                valor_empenhado=Decimal("200"),
                valor_liquidado=Decimal("200"),
                valor_pago=Decimal("200"),
            )
        ]

        result = scraper.merge_despesas([], natureza)
        assert len(result) == 1
        assert result[0].valor_empenhado == Decimal("200")

    def test_ambos_vazios(self, scraper: DespesaScraper) -> None:
        result = scraper.merge_despesas([], [])
        assert result == []

    def test_natureza_vazia_nao_eh_usada(self, scraper: DespesaScraper) -> None:
        annual = [
            Despesa(
                ano=2025,
                mes=1,
                valor_empenhado=Decimal("100"),
                valor_liquidado=Decimal("100"),
                valor_pago=Decimal("100"),
            )
        ]

        # natureza vazio → annual deve ser usado
        result = scraper.merge_despesas(annual, [])
        assert len(result) == 1

    def test_merge_preserva_lista_annual_quando_ambas_fontes(
        self, scraper: DespesaScraper
    ) -> None:
        """Quando annual e natureza existem, annual é priorizado."""
        natureza = [
            Despesa(
                ano=2025,
                mes=i,
                valor_empenhado=Decimal(str(i * 100)),
                valor_liquidado=Decimal(str(i * 100)),
                valor_pago=Decimal(str(i * 100)),
            )
            for i in range(1, 13)
        ]
        annual = [
            Despesa(
                ano=2025,
                mes=1,
                valor_empenhado=Decimal("100"),
                valor_liquidado=Decimal("100"),
                valor_pago=Decimal("100"),
            )
        ]

        result = scraper.merge_despesas(annual, natureza)
        assert len(result) == 1
        assert result[0].valor_empenhado == Decimal("100")
