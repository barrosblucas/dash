"""Testes do cliente HTTP do portal QualitySistemas."""

from __future__ import annotations

from typing import Any

import pytest

from backend.shared.quality_api_client import QualityAPIClient


@pytest.mark.asyncio
async def test_fetch_despesas_annual_usa_base_url_com_barra_dupla(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = QualityAPIClient()
    captured: dict[str, Any] = {}

    async def fake_get_json(
        base_url: str,
        endpoint: str,
        params: dict[str, str],
        headers: dict[str, str],
    ) -> dict[str, Any]:
        captured["base_url"] = base_url
        captured["endpoint"] = endpoint
        captured["params"] = params
        captured["headers"] = headers
        return {"quantidadeRegistro": 0}

    monkeypatch.setattr(client, "_get_json", fake_get_json)

    result = await client.fetch_despesas_annual(year=2026)

    assert result == {"quantidadeRegistro": 0}
    assert captured["base_url"].endswith("/despesas/")
    assert captured["endpoint"] == "BuscaDadosAnual"
    assert captured["params"]["entity"] == "prefeitura_municipal_de_bandeirantes"
    assert captured["params"]["unidadeGestora"] == "0"
    assert captured["params"]["ano"] == "2026"


@pytest.mark.asyncio
async def test_fetch_despesas_natureza_usa_base_url_com_barra_dupla(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = QualityAPIClient()
    captured: dict[str, Any] = {}

    async def fake_get_json(
        base_url: str,
        endpoint: str,
        params: dict[str, str],
        headers: dict[str, str],
    ) -> dict[str, Any]:
        captured["base_url"] = base_url
        captured["endpoint"] = endpoint
        captured["params"] = params
        captured["headers"] = headers
        return {"quantidade": 0}

    monkeypatch.setattr(client, "_get_json", fake_get_json)

    result = await client.fetch_despesas_natureza(year=2026)

    assert result == {"quantidade": 0}
    assert captured["base_url"].endswith("/despesas/")
    assert captured["endpoint"] == "NaturezaDespesa"
    assert captured["params"]["entity"] == "prefeitura_municipal_de_bandeirantes"
    assert captured["params"]["unidadeGestora"] == "0"
    assert captured["params"]["ano"] == "2026"
