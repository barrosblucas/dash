"""Testes do parser de dados por natureza de despesa."""

from __future__ import annotations

from decimal import Decimal

from backend.features.despesa.despesa_scraper import DespesaScraper
from backend.features.despesa.despesa_types import TipoDespesa


class TestParseDespesasNatureza:
    """Testes do parser de dados por natureza de despesa."""

    def test_payload_com_tres_naturezas(self, scraper: DespesaScraper) -> None:
        data = {
            "quantidade": 3,
            "0": {
                "descricao": "DESPESAS CORRENTES",
                "janeiro": "1.000,00",
                "fevereiro": "2.000,00",
                "marco": "0,00",
            },
            "1": {
                "descricao": "DESPESAS DE CAPITAL",
                "janeiro": "500,00",
                "fevereiro": "0,00",
                "marco": "300,00",
            },
            "2": {
                "descricao": "RESERVA DE CONTINGÊNCIA",
                "janeiro": "0,00",
                "fevereiro": "0,00",
                "marco": "100,00",
            },
            "total": {},
        }

        result = scraper.parse_despesas_natureza(data, 2025)

        # CORRENTES: jan + fev (mar=0 pulou) = 2
        # CAPITAL: jan + mar = 2
        # CONTINGENCIA: mar = 1
        assert len(result) == 5

        correntes = [d for d in result if d.tipo == TipoDespesa.CORRENTE]
        capital = [d for d in result if d.tipo == TipoDespesa.CAPITAL]
        contingencia = [d for d in result if d.tipo == TipoDespesa.CONTINGENCIA]

        assert len(correntes) == 2
        assert len(capital) == 2
        assert len(contingencia) == 1

    def test_valores_replicados_em_empenhado_liquidado_pago(
        self,
        scraper: DespesaScraper,
    ) -> None:
        data = {
            "quantidade": 1,
            "0": {
                "descricao": "DESPESAS CORRENTES",
                "janeiro": "1.234,56",
            },
        }

        result = scraper.parse_despesas_natureza(data, 2025)
        assert len(result) == 1

        d = result[0]
        assert d.valor_empenhado == Decimal("1234.56")
        assert d.valor_liquidado == Decimal("1234.56")
        assert d.valor_pago == Decimal("1234.56")

    def test_categoria_preenchida_com_descricao(self, scraper: DespesaScraper) -> None:
        data = {
            "quantidade": 1,
            "0": {
                "descricao": "DESPESAS DE CAPITAL",
                "janeiro": "500,00",
            },
        }

        result = scraper.parse_despesas_natureza(data, 2025)
        assert result[0].categoria == "DESPESAS DE CAPITAL"

    def test_fonte_com_ano(self, scraper: DespesaScraper) -> None:
        data = {
            "quantidade": 1,
            "0": {
                "descricao": "DESPESAS CORRENTES",
                "janeiro": "100,00",
            },
        }

        result = scraper.parse_despesas_natureza(data, 2026)
        assert result[0].fonte == "SCRAPING_2026"

    def test_payload_vazio_retorna_lista_vazia(self, scraper: DespesaScraper) -> None:
        result = scraper.parse_despesas_natureza({}, 2025)
        assert result == []

    def test_descricao_vazia_pula_registro(self, scraper: DespesaScraper) -> None:
        data = {
            "quantidade": 1,
            "0": {
                "descricao": "",
                "janeiro": "100,00",
            },
        }

        result = scraper.parse_despesas_natureza(data, 2025)
        assert result == []

    def test_todos_meses_zerados_nao_gera_despesa(
        self, scraper: DespesaScraper
    ) -> None:
        data = {
            "quantidade": 1,
            "0": {
                "descricao": "DESPESAS CORRENTES",
                "janeiro": "0,00",
                "fevereiro": "0,00",
                "marco": "0,00",
                "abril": "0,00",
                "maio": "0,00",
                "junho": "0,00",
                "julho": "0,00",
                "agosto": "0,00",
                "setembro": "0,00",
                "outubro": "0,00",
                "novembro": "0,00",
                "dezembro": "0,00",
            },
        }

        result = scraper.parse_despesas_natureza(data, 2025)
        assert result == []

    def test_doze_meses_validos(self, scraper: DespesaScraper) -> None:
        meses_com_valores = {
            "janeiro": "100,00",
            "fevereiro": "200,00",
            "marco": "300,00",
            "abril": "400,00",
            "maio": "500,00",
            "junho": "600,00",
            "julho": "700,00",
            "agosto": "800,00",
            "setembro": "900,00",
            "outubro": "1.000,00",
            "novembro": "1.100,00",
            "dezembro": "1.200,00",
        }

        data = {
            "quantidade": 1,
            "0": {
                "descricao": "DESPESAS CORRENTES",
                **meses_com_valores,
            },
        }

        result = scraper.parse_despesas_natureza(data, 2025)
        assert len(result) == 12
        assert result[0].mes == 1
        assert result[11].mes == 12
