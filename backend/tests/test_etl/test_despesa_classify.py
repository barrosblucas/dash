"""Testes do classificador de tipo por descrição."""

from __future__ import annotations

from backend.features.despesa.despesa_scraper import _classificar_tipo_despesa
from backend.features.despesa.despesa_types import TipoDespesa


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
