"""Testes de scraping de receitas."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from types import SimpleNamespace
from typing import Any

import pytest

from backend.domain.entities.receita import Receita, TipoReceita
from backend.etl.extractors.pdf_entities import ReceitaDetalhamento
from backend.services.scraping_service import ScrapingService


@pytest.mark.asyncio
async def test_scrape_receitas_2026_usa_replace_por_ano(
    monkeypatch: pytest.MonkeyPatch,
    service: ScrapingService,
    patch_db_session: None,
) -> None:
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
        "backend.services.scraping_service._replace_receitas_for_year",
        fake_replace_receitas_for_year,
    )
    monkeypatch.setattr(
        "backend.services.scraping_service._upsert_receitas",
        fake_upsert_receitas,
    )
    monkeypatch.setattr(
        "backend.services.scraping_service._replace_detalhamento",
        fake_replace_detalhamento,
    )
    monkeypatch.setattr(
        "backend.services.scraping_service._create_log",
        fake_create_log,
    )
    monkeypatch.setattr(
        "backend.services.scraping_service._finalize_log",
        fake_finalize_log,
    )

    result = await service.scrape_receitas(2026)

    assert result.success is True
    assert replace_called is True
    assert upsert_called is False
    assert result.records_inserted == 2
