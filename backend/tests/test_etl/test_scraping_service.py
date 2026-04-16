"""Testes do serviço de scraping com foco no fallback de despesas."""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import pytest

from backend.domain.entities.despesa import Despesa, TipoDespesa
from backend.domain.entities.receita import Receita, TipoReceita
from backend.etl.extractors.pdf_extractor import ReceitaDetalhamento
from backend.services.scraping_service import ScrapingService


@contextmanager
def _fake_session_context() -> Iterator[object]:
    """Fornece sessão fake para evitar I/O real de banco nos testes."""
    yield object()


def _build_despesa(fonte: str = "PDF_2026") -> Despesa:
    """Factory de despesa válida para cenários de teste."""
    return Despesa(
        ano=2026,
        mes=1,
        valor_empenhado=Decimal("100.00"),
        valor_liquidado=Decimal("90.00"),
        valor_pago=Decimal("80.00"),
        tipo=TipoDespesa.CORRENTE,
        fonte=fonte,
    )


@pytest.mark.asyncio
async def test_scrape_despesas_usa_fallback_pdf_quando_api_vazia(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = ScrapingService()

    async def fake_fetch_despesas_annual(year: int) -> dict[str, Any]:
        return {}

    async def fake_fetch_despesas_natureza(year: int) -> dict[str, Any]:
        return {}

    fallback_despesa = _build_despesa()
    fallback_called: list[int] = []

    def fake_load_despesas_from_pdf(year: int) -> list[Despesa]:
        fallback_called.append(year)
        return [fallback_despesa]

    captured: dict[str, Any] = {}

    def fake_replace_despesas_for_year(
        session: object, despesas: list[Despesa], year: int
    ) -> tuple[int, int]:
        captured["despesas"] = despesas
        assert year == 2026
        return len(despesas), 0

    def fake_create_log(data_type: str, year: int) -> Any:
        return SimpleNamespace(started_at=datetime.now())

    def fake_finalize_log(
        session: object,
        log: Any,
        status: str,
        processed: int,
        inserted: int,
        updated: int,
    ) -> None:
        captured["status"] = status
        captured["processed"] = processed
        captured["inserted"] = inserted
        captured["updated"] = updated

    monkeypatch.setattr(
        service._api, "fetch_despesas_annual", fake_fetch_despesas_annual
    )
    monkeypatch.setattr(
        service._api,
        "fetch_despesas_natureza",
        fake_fetch_despesas_natureza,
    )
    monkeypatch.setattr(service, "_load_despesas_from_pdf", fake_load_despesas_from_pdf)
    monkeypatch.setattr(
        ScrapingService,
        "_replace_despesas_for_year",
        staticmethod(fake_replace_despesas_for_year),
    )
    monkeypatch.setattr(
        ScrapingService,
        "_create_log",
        staticmethod(fake_create_log),
    )
    monkeypatch.setattr(
        ScrapingService,
        "_finalize_log",
        staticmethod(fake_finalize_log),
    )
    monkeypatch.setattr(
        "backend.services.scraping_service.db_manager.get_session",
        _fake_session_context,
    )

    result = await service.scrape_despesas(2026)

    assert result.success is True
    assert result.records_processed == 1
    assert result.records_inserted == 1
    assert result.records_updated == 0
    assert fallback_called == [2026]
    assert captured["despesas"] == [fallback_despesa]
    assert captured["status"] == "SUCCESS"


@pytest.mark.asyncio
async def test_scrape_despesas_retorna_no_data_e_nao_replace_quando_sem_fonte(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = ScrapingService()

    async def fake_fetch_despesas_annual(year: int) -> dict[str, Any]:
        return {}

    async def fake_fetch_despesas_natureza(year: int) -> dict[str, Any]:
        return {}

    def fake_load_despesas_from_pdf(year: int) -> list[Despesa]:
        return []

    def fail_if_replace_called(
        session: object, despesas: list[Despesa], year: int
    ) -> tuple[int, int]:
        raise AssertionError("Nao deveria substituir despesas quando nao ha dados")

    captured: dict[str, Any] = {}

    def fake_create_log(data_type: str, year: int) -> Any:
        return SimpleNamespace(started_at=datetime.now())

    def fake_finalize_log(
        session: object,
        log: Any,
        status: str,
        processed: int,
        inserted: int,
        updated: int,
    ) -> None:
        captured["status"] = status
        captured["processed"] = processed
        captured["inserted"] = inserted
        captured["updated"] = updated

    monkeypatch.setattr(
        service._api, "fetch_despesas_annual", fake_fetch_despesas_annual
    )
    monkeypatch.setattr(
        service._api,
        "fetch_despesas_natureza",
        fake_fetch_despesas_natureza,
    )
    monkeypatch.setattr(service, "_load_despesas_from_pdf", fake_load_despesas_from_pdf)
    monkeypatch.setattr(
        ScrapingService,
        "_replace_despesas_for_year",
        staticmethod(fail_if_replace_called),
    )
    monkeypatch.setattr(
        ScrapingService,
        "_create_log",
        staticmethod(fake_create_log),
    )
    monkeypatch.setattr(
        ScrapingService,
        "_finalize_log",
        staticmethod(fake_finalize_log),
    )
    monkeypatch.setattr(
        "backend.services.scraping_service.db_manager.get_session",
        _fake_session_context,
    )

    result = await service.scrape_despesas(2026)

    assert result.success is False
    assert result.records_processed == 0
    assert result.records_inserted == 0
    assert result.records_updated == 0
    assert result.errors
    assert "Nenhum dado de despesas disponível" in result.errors[0]
    assert captured["status"] == "NO_DATA"
    assert captured["processed"] == 0
    assert captured["inserted"] == 0
    assert captured["updated"] == 0


@pytest.mark.asyncio
async def test_scrape_despesas_nao_usa_fallback_quando_api_tem_dados(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = ScrapingService()

    async def fake_fetch_despesas_annual(year: int) -> dict[str, Any]:
        return {
            "quantidadeRegistro": 1,
            "0": {
                "mes": "JANEIRO",
                "empenhado": "100,00",
                "liquidado": "90,00",
                "pago": "80,00",
            },
        }

    async def fake_fetch_despesas_natureza(year: int) -> dict[str, Any]:
        return {}

    fallback_called = False

    def fake_load_despesas_from_pdf(year: int) -> list[Despesa]:
        nonlocal fallback_called
        fallback_called = True
        return [_build_despesa()]

    captured: dict[str, Any] = {}

    def fake_replace_despesas_for_year(
        session: object, despesas: list[Despesa], year: int
    ) -> tuple[int, int]:
        captured["despesas"] = despesas
        assert year == 2026
        return len(despesas), 0

    def fake_create_log(data_type: str, year: int) -> Any:
        return SimpleNamespace(started_at=datetime.now())

    def fake_finalize_log(
        session: object,
        log: Any,
        status: str,
        processed: int,
        inserted: int,
        updated: int,
    ) -> None:
        captured["status"] = status

    monkeypatch.setattr(
        service._api, "fetch_despesas_annual", fake_fetch_despesas_annual
    )
    monkeypatch.setattr(
        service._api,
        "fetch_despesas_natureza",
        fake_fetch_despesas_natureza,
    )
    monkeypatch.setattr(service, "_load_despesas_from_pdf", fake_load_despesas_from_pdf)
    monkeypatch.setattr(
        ScrapingService,
        "_replace_despesas_for_year",
        staticmethod(fake_replace_despesas_for_year),
    )
    monkeypatch.setattr(
        ScrapingService,
        "_create_log",
        staticmethod(fake_create_log),
    )
    monkeypatch.setattr(
        ScrapingService,
        "_finalize_log",
        staticmethod(fake_finalize_log),
    )
    monkeypatch.setattr(
        "backend.services.scraping_service.db_manager.get_session",
        _fake_session_context,
    )

    result = await service.scrape_despesas(2026)

    assert result.success is True
    assert result.records_processed == 1
    assert fallback_called is False
    assert len(captured["despesas"]) == 1
    assert captured["despesas"][0].fonte == "SCRAPING_2026"
    assert captured["status"] == "SUCCESS"


@pytest.mark.asyncio
async def test_scrape_despesas_ignora_natureza_sem_annual_e_usa_pdf(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = ScrapingService()

    async def fake_fetch_despesas_annual(year: int) -> dict[str, Any]:
        return {}

    async def fake_fetch_despesas_natureza(year: int) -> dict[str, Any]:
        return {"quantidade": 1}

    natureza_despesa = _build_despesa(fonte="SCRAPING_2026")
    fallback_despesa = _build_despesa(fonte="PDF_2026")
    fallback_called = False
    captured: dict[str, Any] = {}

    def fake_parse_despesas_annual(data: dict[str, Any], year: int) -> list[Despesa]:
        return []

    def fake_parse_despesas_natureza(
        data: dict[str, Any], year: int
    ) -> list[Despesa]:
        return [natureza_despesa]

    def fail_if_merge_called(
        annual: list[Despesa], natureza: list[Despesa]
    ) -> list[Despesa]:
        raise AssertionError("Merge nao deve ser usado sem dados anuais")

    def fake_load_despesas_from_pdf(year: int) -> list[Despesa]:
        nonlocal fallback_called
        fallback_called = True
        return [fallback_despesa]

    def fake_replace_despesas_for_year(
        session: object, despesas: list[Despesa], year: int
    ) -> tuple[int, int]:
        captured["despesas"] = despesas
        assert year == 2026
        return len(despesas), 0

    def fake_create_log(data_type: str, year: int) -> Any:
        return SimpleNamespace(started_at=datetime.now())

    def fake_finalize_log(
        session: object,
        log: Any,
        status: str,
        processed: int,
        inserted: int,
        updated: int,
    ) -> None:
        captured["status"] = status

    monkeypatch.setattr(
        service._api,
        "fetch_despesas_annual",
        fake_fetch_despesas_annual,
    )
    monkeypatch.setattr(
        service._api,
        "fetch_despesas_natureza",
        fake_fetch_despesas_natureza,
    )
    monkeypatch.setattr(
        service._despesa_parser,
        "parse_despesas_annual",
        fake_parse_despesas_annual,
    )
    monkeypatch.setattr(
        service._despesa_parser,
        "parse_despesas_natureza",
        fake_parse_despesas_natureza,
    )
    monkeypatch.setattr(
        service._despesa_parser,
        "merge_despesas",
        fail_if_merge_called,
    )
    monkeypatch.setattr(
        service,
        "_load_despesas_from_pdf",
        fake_load_despesas_from_pdf,
    )
    monkeypatch.setattr(
        ScrapingService,
        "_replace_despesas_for_year",
        staticmethod(fake_replace_despesas_for_year),
    )
    monkeypatch.setattr(
        ScrapingService,
        "_create_log",
        staticmethod(fake_create_log),
    )
    monkeypatch.setattr(
        ScrapingService,
        "_finalize_log",
        staticmethod(fake_finalize_log),
    )
    monkeypatch.setattr(
        "backend.services.scraping_service.db_manager.get_session",
        _fake_session_context,
    )

    result = await service.scrape_despesas(2026)

    assert result.success is True
    assert fallback_called is True
    assert captured["despesas"] == [fallback_despesa]
    assert captured["despesas"] != [natureza_despesa]
    assert captured["status"] == "SUCCESS"


def test_load_despesas_from_pdf_retorna_dados_do_extractor(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = ScrapingService()

    fallback_despesa = _build_despesa()

    class FakeResult:
        def __init__(self) -> None:
            self.despesas = [fallback_despesa]
            self.erro: str | None = None

    class FakeExtractor:
        def __init__(self, dados_dir: Path) -> None:
            self.dados_dir = dados_dir

        def extract_despesas(
            self,
            ano: int | None = None,
            anos: list[int] | None = None,
        ) -> FakeResult:
            return FakeResult()

    monkeypatch.setattr("backend.services.scraping_service.PDFExtractor", FakeExtractor)

    despesas = service._load_despesas_from_pdf(2026)

    assert despesas == [fallback_despesa]


def test_load_despesas_from_pdf_retorna_vazio_em_excecao(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = ScrapingService()

    class BrokenExtractor:
        def __init__(self, dados_dir: Path) -> None:
            raise RuntimeError("falha")

    monkeypatch.setattr(
        "backend.services.scraping_service.PDFExtractor",
        BrokenExtractor,
    )

    despesas = service._load_despesas_from_pdf(2026)

    assert despesas == []


@pytest.mark.asyncio
async def test_scrape_receitas_2026_usa_replace_por_ano(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = ScrapingService()

    async def fake_fetch_revenue_monthly(year: int) -> list[dict[str, Any]]:
        return [{"mes": "JANEIRO", "valorArrecadado": "100.00"}]

    async def fake_fetch_revenue_detailing(year: int) -> list[dict[str, Any]]:
        return [{"descricao": "RECEITAS CORRENTES", "nivel": 1}]

    receitas = [
        Receita(
            ano=2026,
            mes=1,
            categoria="RECEITAS CORRENTES",
            valor_previsto=Decimal("0"),
            valor_arrecadado=Decimal("100.00"),
            valor_anulado=Decimal("0"),
            tipo=TipoReceita.CORRENTE,
            fonte="SCRAPING_2026",
        )
    ]
    detalhes = [
        ReceitaDetalhamento(
            ano=2026,
            detalhamento="RECEITAS CORRENTES",
            nivel=1,
            ordem=0,
            tipo="CORRENTE",
            valor_previsto=Decimal("0"),
            valor_arrecadado=Decimal("100.00"),
            valor_anulado=Decimal("0"),
            fonte="SCRAPING_2026",
        )
    ]

    replace_called = False
    upsert_called = False

    def fake_replace_receitas_for_year(
        session: object, receitas_data: list[Receita], year: int
    ) -> tuple[int, int]:
        nonlocal replace_called
        replace_called = True
        assert year == 2026
        assert receitas_data == receitas
        return 1, 0

    def fake_upsert_receitas(
        session: object, receitas_data: list[Receita], year: int
    ) -> tuple[int, int]:
        nonlocal upsert_called
        upsert_called = True
        return 0, 0

    def fake_replace_detalhamento(
        session: object,
        detalhes_data: list[ReceitaDetalhamento],
        year: int,
    ) -> int:
        assert year == 2026
        assert detalhes_data == detalhes
        return 1

    def fake_create_log(data_type: str, year: int) -> Any:
        return SimpleNamespace(started_at=datetime.now())

    def fake_finalize_log(
        session: object,
        log: Any,
        status: str,
        processed: int,
        inserted: int,
        updated: int,
    ) -> None:
        return None

    monkeypatch.setattr(
        service._api,
        "fetch_revenue_monthly",
        fake_fetch_revenue_monthly,
    )
    monkeypatch.setattr(
        service._api,
        "fetch_revenue_detailing",
        fake_fetch_revenue_detailing,
    )
    monkeypatch.setattr(
        service._receita_parser,
        "parse_revenue_monthly",
        lambda data, year: receitas,
    )
    monkeypatch.setattr(
        service._receita_parser,
        "parse_revenue_detailing",
        lambda data, year: detalhes,
    )
    monkeypatch.setattr(
        ScrapingService,
        "_replace_receitas_for_year",
        staticmethod(fake_replace_receitas_for_year),
    )
    monkeypatch.setattr(
        ScrapingService,
        "_upsert_receitas",
        staticmethod(fake_upsert_receitas),
    )
    monkeypatch.setattr(
        ScrapingService,
        "_replace_detalhamento",
        staticmethod(fake_replace_detalhamento),
    )
    monkeypatch.setattr(
        ScrapingService,
        "_create_log",
        staticmethod(fake_create_log),
    )
    monkeypatch.setattr(
        ScrapingService,
        "_finalize_log",
        staticmethod(fake_finalize_log),
    )
    monkeypatch.setattr(
        "backend.services.scraping_service.db_manager.get_session",
        _fake_session_context,
    )

    result = await service.scrape_receitas(2026)

    assert result.success is True
    assert replace_called is True
    assert upsert_called is False
    assert result.records_inserted == 2


@pytest.mark.asyncio
async def test_scrape_despesas_2026_usa_replace_por_ano(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = ScrapingService()

    async def fake_fetch_despesas_annual(year: int) -> dict[str, Any]:
        return {"quantidadeRegistro": 1}

    async def fake_fetch_despesas_natureza(year: int) -> dict[str, Any]:
        return {}

    despesas = [_build_despesa(fonte="SCRAPING_2026")]
    replace_called = False
    upsert_called = False

    def fake_replace_despesas_for_year(
        session: object, despesas_data: list[Despesa], year: int
    ) -> tuple[int, int]:
        nonlocal replace_called
        replace_called = True
        assert year == 2026
        assert despesas_data == despesas
        return 1, 0

    def fake_upsert_despesas(
        session: object, despesas_data: list[Despesa], year: int
    ) -> tuple[int, int]:
        nonlocal upsert_called
        upsert_called = True
        return 0, 0

    def fake_create_log(data_type: str, year: int) -> Any:
        return SimpleNamespace(started_at=datetime.now())

    def fake_finalize_log(
        session: object,
        log: Any,
        status: str,
        processed: int,
        inserted: int,
        updated: int,
    ) -> None:
        return None

    monkeypatch.setattr(
        service._api,
        "fetch_despesas_annual",
        fake_fetch_despesas_annual,
    )
    monkeypatch.setattr(
        service._api,
        "fetch_despesas_natureza",
        fake_fetch_despesas_natureza,
    )
    monkeypatch.setattr(
        service._despesa_parser,
        "parse_despesas_annual",
        lambda data, year: despesas,
    )
    monkeypatch.setattr(
        service._despesa_parser,
        "parse_despesas_natureza",
        lambda data, year: [],
    )
    monkeypatch.setattr(
        service._despesa_parser,
        "merge_despesas",
        lambda annual, natureza: despesas,
    )
    monkeypatch.setattr(
        ScrapingService,
        "_replace_despesas_for_year",
        staticmethod(fake_replace_despesas_for_year),
    )
    monkeypatch.setattr(
        ScrapingService,
        "_upsert_despesas",
        staticmethod(fake_upsert_despesas),
    )
    monkeypatch.setattr(
        ScrapingService,
        "_create_log",
        staticmethod(fake_create_log),
    )
    monkeypatch.setattr(
        ScrapingService,
        "_finalize_log",
        staticmethod(fake_finalize_log),
    )
    monkeypatch.setattr(
        "backend.services.scraping_service.db_manager.get_session",
        _fake_session_context,
    )

    result = await service.scrape_despesas(2026)

    assert result.success is True
    assert replace_called is True
    assert upsert_called is False
    assert result.records_inserted == 1
