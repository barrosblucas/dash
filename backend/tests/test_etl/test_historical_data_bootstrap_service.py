"""Testes do bootstrap histórico de dados via PDFs."""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

import pytest

from backend.features.scraping.historical_data_bootstrap_service import (
    BootstrapPayload,
    HistoricalDataBootstrapService,
    PersistedCounts,
    YearGaps,
)


@contextmanager
def _fake_session_context() -> Iterator[object]:
    """Fornece sessão fake para chamadas internas de consulta."""
    yield object()


def test_bootstrap_nao_executa_quando_nao_ha_lacunas(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = HistoricalDataBootstrapService()
    persist_called = False

    def fake_collect_year_gaps() -> YearGaps:
        return YearGaps(receitas=[], despesas=[], detalhamento=[])

    def fake_persist_payload(payload: BootstrapPayload) -> PersistedCounts:
        nonlocal persist_called
        persist_called = True
        return PersistedCounts()

    monkeypatch.setattr(service, "_collect_year_gaps", fake_collect_year_gaps)
    monkeypatch.setattr(service, "_persist_payload", fake_persist_payload)

    result = service.bootstrap_missing_years()

    assert result.executed is False
    assert persist_called is False


def test_bootstrap_executa_e_retorna_contadores(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = HistoricalDataBootstrapService()

    def fake_collect_year_gaps() -> YearGaps:
        return YearGaps(receitas=[2013], despesas=[2014], detalhamento=[2015])

    def fake_extract_payload(year_gaps: YearGaps) -> BootstrapPayload:
        assert year_gaps.receitas == [2013]
        return BootstrapPayload(
            receitas=[],
            despesas=[],
            detalhamento_por_ano={},
            warnings=["aviso de teste"],
        )

    def fake_persist_payload(payload: BootstrapPayload) -> PersistedCounts:
        assert payload.warnings == ["aviso de teste"]
        return PersistedCounts(
            receitas_inserted=10,
            receitas_updated=1,
            despesas_inserted=20,
            despesas_updated=2,
            detalhamento_replaced=30,
        )

    monkeypatch.setattr(service, "_collect_year_gaps", fake_collect_year_gaps)
    monkeypatch.setattr(service, "_extract_payload", fake_extract_payload)
    monkeypatch.setattr(service, "_persist_payload", fake_persist_payload)

    result = service.bootstrap_missing_years()

    assert result.executed is True
    assert result.receitas_missing_years == [2013]
    assert result.despesas_missing_years == [2014]
    assert result.detalhamento_missing_years == [2015]
    assert result.receitas_inserted == 10
    assert result.receitas_updated == 1
    assert result.despesas_inserted == 20
    assert result.despesas_updated == 2
    assert result.detalhamento_replaced == 30
    assert result.warnings == ["aviso de teste"]


def test_collect_year_gaps_calcula_anos_ausentes(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = HistoricalDataBootstrapService()

    def fake_list_pdf_years(directory: Path) -> list[int]:
        if directory.name == "receitas":
            return [2013, 2026]
        if directory.name == "despesas":
            return [2014, 2026]
        return []

    def fake_existing_receitas_years(session: object) -> set[int]:
        return {2026}

    def fake_existing_despesas_years(session: object) -> set[int]:
        return {2026}

    def fake_existing_detalhamento_years(session: object) -> set[int]:
        return {2026}

    monkeypatch.setattr(service, "_list_pdf_years", fake_list_pdf_years)
    monkeypatch.setattr(
        service,
        "_existing_receitas_years",
        staticmethod(fake_existing_receitas_years),
    )
    monkeypatch.setattr(
        service,
        "_existing_despesas_years",
        staticmethod(fake_existing_despesas_years),
    )
    monkeypatch.setattr(
        service,
        "_existing_detalhamento_years",
        staticmethod(fake_existing_detalhamento_years),
    )
    monkeypatch.setattr(
        "backend.features.scraping.historical_data_bootstrap_service.db_manager.get_session",
        _fake_session_context,
    )

    gaps = service._collect_year_gaps()

    assert gaps.receitas == [2013]
    assert gaps.despesas == [2014]
    assert gaps.detalhamento == [2013]


def test_list_pdf_years_ignora_nomes_invalidos(tmp_path: Path) -> None:
    (tmp_path / "2019.pdf").write_bytes(b"%PDF")
    (tmp_path / "foo.pdf").write_bytes(b"%PDF")
    (tmp_path / "2020.txt").write_text("nao importa")

    years = HistoricalDataBootstrapService._list_pdf_years(tmp_path)

    assert years == [2019]


def test_collect_year_gaps_exclui_ano_2026_do_bootstrap(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = HistoricalDataBootstrapService()

    def fake_list_pdf_years(directory: Path) -> list[int]:
        if directory.name == "receitas":
            return [2025, 2026]
        if directory.name == "despesas":
            return [2025, 2026]
        return []

    def fake_existing_receitas_years(session: object) -> set[int]:
        return set()

    def fake_existing_despesas_years(session: object) -> set[int]:
        return set()

    def fake_existing_detalhamento_years(session: object) -> set[int]:
        return set()

    monkeypatch.setattr(service, "_list_pdf_years", fake_list_pdf_years)
    monkeypatch.setattr(
        service,
        "_existing_receitas_years",
        staticmethod(fake_existing_receitas_years),
    )
    monkeypatch.setattr(
        service,
        "_existing_despesas_years",
        staticmethod(fake_existing_despesas_years),
    )
    monkeypatch.setattr(
        service,
        "_existing_detalhamento_years",
        staticmethod(fake_existing_detalhamento_years),
    )
    monkeypatch.setattr(
        "backend.features.scraping.historical_data_bootstrap_service.db_manager.get_session",
        _fake_session_context,
    )

    gaps = service._collect_year_gaps()

    assert gaps.receitas == [2025]
    assert gaps.despesas == [2025]
    assert gaps.detalhamento == [2025]
