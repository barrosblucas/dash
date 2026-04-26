"""Testes de regressão para o endpoint /api/v1/saude/farmacia."""
from __future__ import annotations

from typing import Any, cast

import pytest
from fastapi.testclient import TestClient


async def _fake_sync_fetch(
    self: object,
    resource_path: str,
    params: dict[str, str] | None = None,
) -> object:
    if resource_path == "buscar-dados-do-chart/quantidade-de-atendimentos-medicamentos-por-mes":
        assert params == {"ano": "2025"}
        return {"labels": ["01/2025", "02/2025"], "datasets": [{"data": [1, 2]}]}
    if resource_path == "buscar-dados-do-chart/quantidade-de-medicamentos-dispensados-por-mes":
        return {"labels": ["01/2025", "02/2025"], "datasets": [{"data": [10, 20]}]}
    if resource_path == "buscar-dados-do-chart/lista-de-medicamentos-com-mais-saidas":
        return {"labels": ["SnapshotMed"], "datasets": [{"data": [1]}]}
    return {"labels": [], "datasets": [{"data": []}]}


async def _fake_live_fetch(
    self: object,
    resource_path: str,
    params: dict[str, str] | None = None,
) -> object:
    expected_range_params = {
        "data_de_inicio": "2025-11-01",
        "data_de_fim": "2026-02-01",
    }
    if resource_path == "buscar-dados-do-chart/quantidade-de-atendimentos-medicamentos-por-mes":
        assert params == expected_range_params
        return {
            "labels": ["Novembro de 2025", "Dezembro de 2025", "Janeiro de 2026"],
            "datasets": [{"data": [100, 200, 300]}],
        }
    if resource_path == "buscar-dados-do-chart/quantidade-de-medicamentos-dispensados-por-mes":
        assert params == expected_range_params
        return {
            "labels": ["Novembro de 2025", "Dezembro de 2025", "Janeiro de 2026"],
            "datasets": [{"data": [1000, 2000, 3000]}],
        }
    if resource_path == "buscar-dados-do-chart/lista-de-medicamentos-com-mais-saidas":
        assert params == expected_range_params
        return {"labels": ["LiveMed"], "datasets": [{"data": [99]}]}
    return {"labels": [], "datasets": [{"data": []}]}


def test_farmacia_respeita_range_de_datas_cross_year(
    client: TestClient,
    admin_login: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    headers = {"Authorization": admin_login["Authorization"]}
    cast(Any, client).app.state.saude_scheduler = None

    from backend.features.saude import saude_adapter

    monkeypatch.setattr(
        saude_adapter.ESaudeClient,
        "fetch_public_payload",
        _fake_sync_fetch,
    )

    sync_response = client.post(
        "/api/v1/saude/admin/sync",
        headers=headers,
        json={
            "years": [2025],
            "resources": [
                "medicamentos_atendimentos_mensal",
                "medicamentos_dispensados_mensal",
                "medicamentos_ranking",
            ],
        },
    )
    assert sync_response.status_code == 200

    monkeypatch.setattr(
        saude_adapter.ESaudeClient,
        "fetch_public_payload",
        _fake_live_fetch,
    )

    response = client.get(
        "/api/v1/saude/farmacia",
        params={"year": 2025, "start_date": "2025-11-01", "end_date": "2026-02-01"},
    )
    assert response.status_code == 200
    data = response.json()

    atendimentos_labels = [item["label"] for item in data["atendimentos_por_mes"]]
    atendimentos_values = [item["value"] for item in data["atendimentos_por_mes"]]
    dispensados_labels = [item["label"] for item in data["medicamentos_dispensados_por_mes"]]
    dispensados_values = [item["value"] for item in data["medicamentos_dispensados_por_mes"]]

    assert "Novembro de 2025" in atendimentos_labels
    assert "Dezembro de 2025" in atendimentos_labels
    assert "Janeiro de 2026" in atendimentos_labels
    assert 100 in atendimentos_values
    assert 200 in atendimentos_values
    assert 300 in atendimentos_values
    assert 1 not in atendimentos_values
    assert 2 not in atendimentos_values

    assert "Novembro de 2025" in dispensados_labels
    assert "Dezembro de 2025" in dispensados_labels
    assert "Janeiro de 2026" in dispensados_labels
    assert 1000 in dispensados_values
    assert 2000 in dispensados_values
    assert 3000 in dispensados_values
    assert 10 not in dispensados_values
    assert 20 not in dispensados_values

    assert data["top_medicamentos"][0]["label"] == "LiveMed"
    assert data["total_atendimentos"] == 600
    assert data["total_dispensados"] == 6000
