"""Testes do parser de dados anuais consolidados."""

from __future__ import annotations

from decimal import Decimal

from backend.domain.entities.despesa import TipoDespesa
from backend.etl.scrapers.despesa_scraper import DespesaScraper


class TestParseDespesasAnnual:
    """Testes do parser de dados anuais consolidados."""

    def test_payload_completo(self, scraper: DespesaScraper) -> None:
        data = {
            "quantidadeRegistro": 2,
            "0": {
                "mes": "JANEIRO",
                "empenhado": "1.234.567,89",
                "liquidado": "1.200.000,00",
                "pago": "1.150.000,00",
            },
            "1": {
                "mes": "FEVEREIRO",
                "empenhado": "2.345.678,90",
                "liquidado": "2.100.000,00",
                "pago": "2.000.000,00",
            },
            "total": {
                "totalEmpenho": "3.580.246,79",
                "totalLiquidado": "3.300.000,00",
                "totalPago": "3.150.000,00",
            },
        }

        result = scraper.parse_despesas_annual(data, 2025)

        assert len(result) == 2
        assert result[0].ano == 2025
        assert result[0].mes == 1
        assert result[0].valor_empenhado == Decimal("1234567.89")
        assert result[0].valor_liquidado == Decimal("1200000.00")
        assert result[0].valor_pago == Decimal("1150000.00")
        assert result[0].tipo == TipoDespesa.CORRENTE
        assert result[0].fonte == "SCRAPING_2025"

        assert result[1].mes == 2
        assert result[1].valor_empenhado == Decimal("2345678.90")

    def test_payload_vazio_retorna_lista_vazia(self, scraper: DespesaScraper) -> None:
        result = scraper.parse_despesas_annual({}, 2025)
        assert result == []

    def test_mes_invalido_e_pulado(self, scraper: DespesaScraper) -> None:
        data = {
            "quantidadeRegistro": 2,
            "0": {
                "mes": "INEXISTENTE",
                "empenhado": "100,00",
                "liquidado": "100,00",
                "pago": "100,00",
            },
            "1": {
                "mes": "JANEIRO",
                "empenhado": "200,00",
                "liquidado": "200,00",
                "pago": "200,00",
            },
        }

        result = scraper.parse_despesas_annual(data, 2025)
        assert len(result) == 1
        assert result[0].mes == 1

    def test_registro_com_todos_valores_zerados_e_pulado(
        self, scraper: DespesaScraper
    ) -> None:
        data = {
            "quantidadeRegistro": 1,
            "0": {
                "mes": "MARÇO",
                "empenhado": "0,00",
                "liquidado": "0,00",
                "pago": "0,00",
            },
        }

        result = scraper.parse_despesas_annual(data, 2025)
        assert result == []

    def test_mes_vazio_e_pulado(self, scraper: DespesaScraper) -> None:
        data = {
            "quantidadeRegistro": 1,
            "0": {
                "mes": "",
                "empenhado": "100,00",
                "liquidado": "100,00",
                "pago": "100,00",
            },
        }

        result = scraper.parse_despesas_annual(data, 2025)
        assert result == []

    def test_campos_ausentes_resolvem_para_zero(self, scraper: DespesaScraper) -> None:
        data = {
            "quantidadeRegistro": 1,
            "0": {"mes": "ABRIL"},
        }

        # Todos zerados → entrada ignorada
        result = scraper.parse_despesas_annual(data, 2025)
        assert result == []

    def test_doze_meses_completos(self, scraper: DespesaScraper) -> None:
        meses = [
            "JANEIRO",
            "FEVEREIRO",
            "MARÇO",
            "ABRIL",
            "MAIO",
            "JUNHO",
            "JULHO",
            "AGOSTO",
            "SETEMBRO",
            "OUTUBRO",
            "NOVEMBRO",
            "DEZEMBRO",
        ]
        registros: dict[str, object] = {
            "quantidadeRegistro": 12,
        }
        for i, mes in enumerate(meses):
            registros[str(i)] = {
                "mes": mes,
                "empenhado": f"{(i + 1) * 1000},00",
                "liquidado": f"{(i + 1) * 900},00",
                "pago": f"{(i + 1) * 800},00",
            }

        result = scraper.parse_despesas_annual(registros, 2025)
        assert len(result) == 12
        assert result[0].mes == 1
        assert result[11].mes == 12
