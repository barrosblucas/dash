"""Testes unitários do parser de despesas (DespesaScraper)."""

from __future__ import annotations

from decimal import Decimal

import pytest

from backend.domain.entities.despesa import Despesa, TipoDespesa
from backend.etl.scrapers.despesa_scraper import (
    DespesaScraper,
    _classificar_tipo_despesa,
    _parse_brazilian_currency,
)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def scraper() -> DespesaScraper:
    return DespesaScraper()


# ---------------------------------------------------------------------------
# _parse_brazilian_currency
# ---------------------------------------------------------------------------


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


# ---------------------------------------------------------------------------
# _classificar_tipo_despesa
# ---------------------------------------------------------------------------


class TestClassificarTipoDespesa:
    """Testes do classificador de tipo por descrição."""

    def test_despesas_correntes(self) -> None:
        assert _classificar_tipo_despesa("DESPESAS CORRENTES") == TipoDespesa.CORRENTE

    def test_despesas_capital(self) -> None:
        assert _classificar_tipo_despesa("DESPESAS DE CAPITAL") == TipoDespesa.CAPITAL

    def test_reserva_contingencia(self) -> None:
        assert (
            _classificar_tipo_despesa("RESERVA DE CONTINGÊNCIA")
            == TipoDespesa.CONTINGENCIA
        )

    def test_contingencia_sem_acento(self) -> None:
        assert (
            _classificar_tipo_despesa("RESERVA DE CONTINGENCIA")
            == TipoDespesa.CONTINGENCIA
        )

    def test_descricao_desconhecida_retorna_corrente(self) -> None:
        assert _classificar_tipo_despesa("OUTRAS DESPESAS") == TipoDespesa.CORRENTE

    def test_case_insensitive(self) -> None:
        assert _classificar_tipo_despesa("despesas de capital") == TipoDespesa.CAPITAL


# ---------------------------------------------------------------------------
# parse_despesas_annual
# ---------------------------------------------------------------------------


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


# ---------------------------------------------------------------------------
# parse_despesas_natureza
# ---------------------------------------------------------------------------


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


# ---------------------------------------------------------------------------
# merge_despesas
# ---------------------------------------------------------------------------


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
