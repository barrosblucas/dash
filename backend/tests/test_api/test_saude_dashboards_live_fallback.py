"""Testes de fallback live dos dashboards da feature saude."""
from __future__ import annotations

from typing import Any, cast

import pytest
from fastapi.testclient import TestClient


def test_saude_dashboards_fallback_live_para_start_date_e_estabelecimento(
    client: TestClient,
    admin_login: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    headers = {"Authorization": admin_login["Authorization"]}
    cast(Any, client).app.state.saude_scheduler = None

    from backend.features.saude import saude_adapter

    async def fake_fetch_medicamentos_tabela(
        self: object, search: str | None = None
    ) -> dict[str, object]:
        return {"medicamentos": []}

    async def fake_fetch_quantitativos(self: object) -> dict[str, object]:
        return {"quantitativos": {}}

    async def fake_sync_fetch_public_payload(
        self: object,
        resource_path: str,
        params: dict[str, str] | None = None,
    ) -> object:
        if resource_path == "buscar-dados-do-chart/quantidade-de-atendimentos-por-cbo-da-atencao-basica":
            assert params == {"data_de_inicio": "2026-01-01", "data_de_fim": "2026-12-31"}
            return {"labels": ["Padrão"], "datasets": [{"data": [1]}]}
        if resource_path == "buscar-censo-dos-leitos-da-internacao":
            return {"total_leitos": 4, "ocupados": 1, "livres": 3}
        if resource_path == "dados-hospitalar-quantidade-procedimentos-realizados":
            return {"data": [{"nome_procedimento": "Curativo", "quantidade": 2}], "total": 2}
        if resource_path == "buscar-dados-do-chart/hospitalar-quantidade-de-procedimentos-realizados-por-especialidade":
            return {"labels": ["Enfermeiro"], "datasets": [{"data": [2]}]}
        if resource_path == "buscar-atendimentos-por-cid":
            return {"data": [{"cid": "A15", "descricao": "Tuberculose", "total_geral": 2}]}
        if resource_path == "buscar-dados-do-chart/mapa-de-calor-atendimentos":
            return {
                "dados": {"00": [1, 1, 1, 1, 1, 1, 1]},
                "totaisX": {"00": 7},
                "totaisY": [1, 1, 1, 1, 1, 1, 1],
            }
        if resource_path == "buscar-dados-do-chart/hospitalar-quantidade-de-atendimentos-nao-municipes":
            return {"labels": ["Janeiro"], "datasets": [{"data": [4]}]}
        if resource_path == "buscar-dados-do-chart/hospitalar-quantidade-de-atendimentos-por-medico":
            return {"labels": ["CLÍNICO"], "datasets": [{"data": [7]}]}
        if resource_path == "buscar-dados-do-chart/hospitalar-quantidade-de-atendimentos-por-cbo-da-especialidade":
            return {"labels": ["GESTOR"], "datasets": [{"data": [3]}]}
        return {"labels": ["Janeiro de 2026"], "datasets": [{"data": [3]}]}

    monkeypatch.setattr(
        saude_adapter.ESaudeClient,
        "fetch_medicamentos_tabela",
        fake_fetch_medicamentos_tabela,
    )
    monkeypatch.setattr(
        saude_adapter.ESaudeClient,
        "fetch_quantitativos",
        fake_fetch_quantitativos,
    )
    monkeypatch.setattr(
        saude_adapter.ESaudeClient,
        "fetch_public_payload",
        fake_sync_fetch_public_payload,
    )

    sync_response = client.post(
        "/api/v1/saude/admin/sync",
        headers=headers,
        json={
            "years": [2026],
            "resources": [
                "atencao_primaria_atendimentos_mensal",
                "atencao_primaria_procedimentos",
                "atencao_primaria_cbo",
                "hospital_censo",
                "hospital_procedimentos",
                "hospital_procedimentos_especialidade",
                "hospital_atendimentos_mensal",
            ],
        },
    )
    assert sync_response.status_code == 200

    async def fake_live_fetch_public_payload(
        self: object,
        resource_path: str,
        params: dict[str, str] | None = None,
    ) -> object:
        if resource_path == "buscar-dados-do-chart/quantidade-de-atendimentos-por-cbo-da-atencao-basica":
            assert params == {"data_de_inicio": "2026-02-01", "data_de_fim": "2026-12-31"}
            return {"labels": ["Técnico"], "datasets": [{"data": [9]}]}
        if (
            resource_path
            == "buscar-dados-do-chart/atencao-basica-quantidade-de-procedimentos-realizados-por-especialidade"
        ):
            assert params == {"data_de_inicio": "2026-02-01", "data_de_fim": "2026-12-31"}
            return {"labels": ["Clínica Geral"], "datasets": [{"data": [5]}]}
        if resource_path == "buscar-censo-dos-leitos-da-internacao":
            assert params == {"estabelecimento_id": "77"}
            return {"total_leitos": 6, "ocupados": 4, "livres": 2}
        if resource_path == "dados-hospitalar-quantidade-procedimentos-realizados":
            assert params == {
                "search": "",
                "order_column": "quantidade",
                "order_direction": "desc",
                "itemsPerPage": "10",
                "page": "1",
                "dataDeInicio": "2026-01-01",
                "dataDeFim": "2026-12-31",
                "estabelecimentoId": "77",
            }
            return {"data": [{"nome_procedimento": "Sutura", "quantidade": 5}], "total": 5}
        if resource_path == "buscar-dados-do-chart/hospitalar-quantidade-de-procedimentos-realizados-por-especialidade":
            assert params == {
                "data_de_inicio": "2026-01-01",
                "data_de_fim": "2026-12-31",
                "estabelecimento_id": "77",
            }
            return {"labels": ["Clínico"], "datasets": [{"data": [5]}]}
        if resource_path == "buscar-atendimentos-por-cid":
            assert params == {
                "search": "",
                "order_column": "quantidade",
                "order_direction": "desc",
                "itemsPerPage": "10",
                "page": "1",
                "dataDeInicio": "2026-01-01",
                "dataDeFim": "2026-12-31",
                "estabelecimentoId": "77",
            }
            return {"data": [{"cid": "B34", "descricao": "Virose", "total_geral": 4}]}
        if resource_path == "buscar-dados-do-chart/mapa-de-calor-atendimentos":
            assert params == {"estabelecimento_id": "77"}
            return {
                "dados": {"00": [2, 2, 2, 2, 2, 2, 2]},
                "totaisX": {"00": 14},
                "totaisY": [2, 2, 2, 2, 2, 2, 2],
            }
        if resource_path == "buscar-dados-do-chart/hospitalar-quantidade-de-atendimentos-nao-municipes":
            assert params == {"estabelecimento_id": "77", "ano": "2026"}
            return {"labels": ["Janeiro"], "datasets": [{"data": [8]}]}
        if resource_path == "buscar-dados-do-chart/hospitalar-quantidade-de-atendimentos-por-medico":
            assert params == {
                "data_de_inicio": "2026-01-01",
                "data_de_fim": "2026-12-31",
                "estabelecimento_id": "77",
            }
            return {"labels": ["MÉDICO A"], "datasets": [{"data": [11]}]}
        if resource_path == "buscar-dados-do-chart/hospitalar-quantidade-de-atendimentos-por-cbo-da-especialidade":
            assert params == {
                "data_de_inicio": "2026-01-01",
                "data_de_fim": "2026-12-31",
                "estabelecimento_id": "77",
            }
            return {"labels": ["CBO A"], "datasets": [{"data": [9]}]}
        assert resource_path == "buscar-dados-do-chart/quantidade-de-atendimentos-por-mes-do-hospital"
        assert params == {"estabelecimento_id": "77", "ano": "2026"}
        return {"labels": ["Março"], "datasets": [{"data": [18]}]}

    monkeypatch.setattr(
        saude_adapter.ESaudeClient,
        "fetch_public_payload",
        fake_live_fetch_public_payload,
    )

    atencao_primaria = client.get(
        "/api/v1/saude/atencao-primaria",
        params={"year": 2026, "start_date": "2026-02-01"},
    )
    assert atencao_primaria.status_code == 200
    assert atencao_primaria.json()["atendimentos_por_categoria"][0]["label"] == "Técnico"

    hospital = client.get(
        "/api/v1/saude/hospital",
        params={"year": 2026, "estabelecimento_id": 77},
    )
    assert hospital.status_code == 200
    assert hospital.json()["censo"]["ocupados"] == 4
    assert hospital.json()["mapa_calor"]["total_geral"] == 14
    assert hospital.json()["nao_municipes"][0]["value"] == 8
    assert hospital.json()["especialidades_medicas"][0]["value"] == 11
    assert hospital.json()["outras_especialidades"][0]["label"] == "CBO A"
    assert hospital.json()["procedimentos_realizados"][0]["label"] == "Clínico"
    assert hospital.json()["internacoes_por_cid"][0]["label"] == "B34 - Virose"
    assert hospital.json()["total_procedimentos"] == 5
