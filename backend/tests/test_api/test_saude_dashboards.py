"""Testes de integração dos dashboards da feature saude."""
from __future__ import annotations

from typing import Any, cast

import pytest
from fastapi.testclient import TestClient

from backend.features.saude.saude_data import SQLSaudeRepository
from backend.features.saude.saude_types import (
    SaudeSnapshotResource,
    SaudeSyncTriggerType,
)
from backend.shared.database import connection


def test_saude_sync_dashboards_publicos_e_historico(
    client: TestClient,
    admin_login: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    headers = {"Authorization": admin_login["Authorization"]}
    cast(Any, client).app.state.saude_scheduler = None

    from backend.features.saude import saude_adapter

    payload_state = {
        "quantitativos_mulheres": 10,
        "quantitativos_homens": 8,
        "quantitativos_idosos": 2,
    }

    async def fake_fetch_medicamentos_tabela(
        self: object,
        search: str | None = None,
    ) -> dict[str, object]:
        assert search is None
        return {
            "total": 2,
            "medicamentos": [
                {
                    "nome_do_produto": "Dipirona",
                    "unidade_do_produto": "COMP",
                    "em_estoque": 5,
                    "departamento": "FARMACIA",
                    "estabelecimento": "UBS Central",
                    "estoque_minimo": 10,
                },
                {
                    "nome_do_produto": "Paracetamol",
                    "unidade_do_produto": "COMP",
                    "em_estoque": 20,
                    "departamento": "FARMACIA",
                    "estabelecimento": "UBS Central",
                    "estoque_minimo": 10,
                },
            ],
        }

    async def fake_fetch_quantitativos(self: object) -> dict[str, object]:
        return {
            "quantitativos": {
                "quantitativo_mulheres": {
                    "titulo": "Mulheres",
                    "valor": payload_state["quantitativos_mulheres"],
                },
                "quantitativo_homens": {
                    "titulo": "Homens",
                    "valor": payload_state["quantitativos_homens"],
                },
                "quantitativo_idosos": {
                    "titulo": "Idosos",
                    "valor": payload_state["quantitativos_idosos"],
                },
            },
            "temDados": True,
        }

    async def fake_fetch_public_payload(
        self: object,
        resource_path: str,
        params: dict[str, str] | None = None,
    ) -> object:
        expected_year = {"ano": "2026"}
        if resource_path == "buscar-dados-do-chart/lista-de-medicamentos-com-mais-saidas":
            return {"labels": ["Dipirona", "Paracetamol"], "datasets": [{"data": [40, 30]}]}
        if resource_path == "buscar-dados-do-chart/quantidade-de-medicamentos-dispensados-por-mes":
            return {
                "labels": ["Janeiro de 2026", "Fevereiro de 2026", "Janeiro de 2025"],
                "datasets": [{"data": [100, 120, 90]}],
            }
        if resource_path == "buscar-dados-do-chart/quantidade-de-atendimentos-medicamentos-por-mes":
            assert params == expected_year
            return {
                "labels": ["Janeiro de 2026", "Fevereiro de 2026"],
                "datasets": [{"data": [8, 9]}],
            }
        if resource_path == "buscar-dados-do-chart/quantidade-de-atendimento-por-sexo":
            return {"labels": ["Feminino", "Masculino"], "datasets": [{"data": [14, 11]}]}
        if resource_path == "buscar-dados-do-chart/quantidade-de-pessoas-fisicas-e-juridicas":
            return {"labels": ["Física", "Jurídica"], "datasets": [{"data": [7, 3]}]}
        if resource_path == "buscar-dados-do-chart/quantidade-de-pessoas-por-mes":
            return {
                "labels": ["Janeiro de 2026", "Fevereiro de 2026", "Janeiro de 2025"],
                "datasets": [{"data": [15, 20, 11]}],
            }
        if resource_path == "buscar-dados-do-chart/quantidade-de-procedimentos-por-tipo":
            return {"labels": ["Consulta", "Exame"], "datasets": [{"data": [11, 4]}]}
        if resource_path == "buscar-dados-do-chart/quantidade-de-vacinas-por-mes-do-esus":
            assert params == expected_year
            return {
                "labels": ["Janeiro de 2026", "Fevereiro de 2026"],
                "datasets": [{"data": [30, 45]}],
            }
        if resource_path == "buscar-dados-do-chart/vacinas-mais-aplicadas-por-periodo":
            return {"labels": ["Influenza", "COVID"], "datasets": [{"data": [25, 20]}]}
        if resource_path == "buscar-dados-do-chart/familias-visitadas-motivos-da-visita":
            return {"labels": ["Rotina", "Urgência"], "datasets": [{"data": [6, 2]}]}
        if resource_path == "buscar-dados-do-chart/familias-visitadas-acompanhamento":
            return {"labels": ["Gestantes", "Idosos"], "datasets": [{"data": [4, 3]}]}
        if resource_path == "buscar-dados-do-chart/familias-visitadas-busca-ativa":
            return {"labels": ["Vacina", "Abandono"], "datasets": [{"data": [2, 1]}]}
        if (
            resource_path
            == "buscar-dados-do-chart/familias-visitadas-controle-ambiente-vetorial"
        ):
            return {"labels": ["Dengue", "Zika"], "datasets": [{"data": [5, 1]}]}
        if resource_path == "buscar-dados-do-chart/quantidade-de-atendimentos-por-mes-da-especialidade":
            assert params == expected_year
            return {
                "labels": ["Janeiro de 2026", "Fevereiro de 2026"],
                "datasets": [
                    {"label": "Clínica Geral", "data": [12, 10]},
                    {"label": "Pediatria", "data": [9, 8]},
                ],
            }
        if (
            resource_path
            == "buscar-dados-do-chart/atencao-basica-quantidade-de-procedimentos-realizados-por-especialidade"
        ):
            return {"labels": ["Clínica Geral", "Pediatria"], "datasets": [{"data": [20, 18]}]}
        if resource_path == "buscar-dados-do-chart/quantidade-de-atendimentos-por-cbo-da-atencao-basica":
            assert params == {"data_de_inicio": "2026-01-01", "data_de_fim": "2026-12-31"}
            return {"labels": ["Enfermeiro", "Médico"], "datasets": [{"data": [7, 5]}]}
        if resource_path == "buscar-dados-do-chart/quantidade-de-atendimentos-por-mes-da-odonto":
            return {
                "labels": ["Janeiro de 2026", "Fevereiro de 2026", "Janeiro de 2025"],
                "datasets": [{"data": [14, 16, 9]}],
            }
        if resource_path == "buscar-censo-dos-leitos-da-internacao":
            return {"total_leitos": 10, "ocupados": 7, "livres": 3}
        if resource_path == "dados-hospitalar-quantidade-procedimentos-realizados":
            return {
                "data": [
                    {"procedimento": "Raio-X", "quantidade": 13},
                    {"procedimento": "Curativo", "quantidade": 6},
                ],
                "total": 2,
            }
        if resource_path == "buscar-atendimentos-por-cid":
            return {"labels": ["A00", "B20"], "datasets": [{"data": [5, 3]}]}
        if resource_path == "buscar-dados-do-chart/mapa-de-calor-atendimentos":
            assert params == {"estabelecimento_id": "1"}
            return {
                "dados": {"00": [1, 2, 3, 4, 5, 6, 7], "01": [0, 1, 0, 1, 0, 1, 0]},
                "totaisX": {"00": 28, "01": 3},
                "totaisY": [1, 3, 3, 5, 5, 7, 7],
            }
        if resource_path == "buscar-dados-do-chart/hospitalar-quantidade-de-atendimentos-nao-municipes":
            assert params == {"ano": "2026", "estabelecimento_id": "1"}
            return {
                "labels": ["Janeiro", "Fevereiro"],
                "datasets": [{"data": [12, 15]}],
            }
        if resource_path == "buscar-dados-do-chart/hospitalar-quantidade-de-atendimentos-por-medico":
            assert params == {
                "data_de_inicio": "2026-01-01",
                "data_de_fim": "2026-12-31",
                "estabelecimento_id": "1",
            }
            return {"labels": ["MÉDICO CLÍNICO"], "datasets": [{"data": [20]}]}
        if resource_path == "buscar-dados-do-chart/hospitalar-quantidade-de-atendimentos-por-cbo-da-especialidade":
            assert params == {
                "data_de_inicio": "2026-01-01",
                "data_de_fim": "2026-12-31",
                "estabelecimento_id": "1",
            }
            return {"labels": ["DIRETOR DE SERVIÇOS DE SAÚDE"], "datasets": [{"data": [6]}]}
        assert resource_path == "buscar-dados-do-chart/quantidade-de-atendimentos-por-mes-do-hospital"
        assert params == expected_year
        return {
            "labels": ["Janeiro de 2026", "Fevereiro de 2026"],
            "datasets": [{"data": [33, 28]}],
        }

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
        fake_fetch_public_payload,
    )

    resources = [
        "medicamentos_estoque",
        "medicamentos_ranking",
        "medicamentos_dispensados_mensal",
        "medicamentos_atendimentos_mensal",
        "quantitativos",
        "pessoas_fisicas_juridicas",
        "pessoas_por_mes",
        "procedimentos_por_tipo",
        "vacinas_por_mes",
        "vacinas_ranking",
        "visitas_motivos",
        "visitas_acompanhamento",
        "visitas_busca_ativa",
        "visitas_controle_vetorial",
        "atencao_primaria_atendimentos_mensal",
        "atencao_primaria_procedimentos",
        "atencao_primaria_cbo",
        "saude_bucal_atendimentos_mensal",
        "hospital_censo",
        "hospital_procedimentos",
        "hospital_atendimentos_mensal",
        "hospital_mapa_calor",
        "hospital_nao_municipes",
        "hospital_atendimentos_medico",
        "hospital_atendimentos_cbo",
    ]

    sync_response = client.post(
        "/api/v1/saude/admin/sync",
        headers=headers,
        json={"years": [2026], "resources": resources},
    )
    assert sync_response.status_code == 200
    assert sync_response.json()["status"] == "success"
    assert sync_response.json()["synced_resources"] == len(resources)

    payload_state.update(
        quantitativos_mulheres=12,
        quantitativos_homens=7,
        quantitativos_idosos=2,
    )
    second_sync = client.post(
        "/api/v1/saude/admin/sync",
        headers=headers,
        json={"years": [2026], "resources": ["quantitativos", "atendimentos_por_sexo"]},
    )
    assert second_sync.status_code == 200

    vacinacao = client.get("/api/v1/saude/vacinacao", params={"year": 2026})
    assert vacinacao.status_code == 200
    assert vacinacao.json()["total_aplicadas"] == 75

    visitas = client.get("/api/v1/saude/visitas-domiciliares")
    assert visitas.status_code == 200
    assert visitas.json()["controle_vetorial"][0]["label"] == "Dengue"

    perfil = client.get("/api/v1/saude/perfil-epidemiologico")
    assert perfil.status_code == 200
    assert perfil.json()["por_sexo"][0]["label"] == "Feminino"
    assert perfil.json()["quantitativos"][0]["trend"] == "up"
    assert perfil.json()["quantitativos"][1]["trend"] == "down"
    assert perfil.json()["quantitativos"][2]["trend"] == "stable"

    atencao_primaria = client.get(
        "/api/v1/saude/atencao-primaria",
        params={"year": 2026},
    )
    assert atencao_primaria.status_code == 200
    assert atencao_primaria.json()["atendimentos_por_mes"][0]["label"] == "Janeiro de 2026"
    assert atencao_primaria.json()["atendimentos_por_cbo"][0]["label"] == "Enfermeiro"

    saude_bucal = client.get("/api/v1/saude/saude-bucal", params={"year": 2026})
    assert saude_bucal.status_code == 200
    assert saude_bucal.json()["total_atendimentos"] == 30

    farmacia = client.get("/api/v1/saude/farmacia", params={"year": 2026})
    assert farmacia.status_code == 200
    assert len(farmacia.json()["medicamentos_dispensados_por_mes"]) == 2
    assert farmacia.json()["total_atendimentos"] == 17
    assert farmacia.json()["total_dispensados"] == 220

    compat = client.get("/api/v1/saude/medicamentos-dispensados", params={"year": 2026})
    assert compat.status_code == 200
    assert compat.json()["ranking"][0]["label"] == "Dipirona"

    hospital = client.get("/api/v1/saude/hospital", params={"year": 2026})
    assert hospital.status_code == 200
    assert hospital.json()["censo"]["taxa_ocupacao"] == 70.0
    assert hospital.json()["total_procedimentos"] == 2
    assert hospital.json()["mapa_calor"]["total_geral"] == 31
    assert hospital.json()["nao_municipes"][0]["value"] == 12
    assert hospital.json()["especialidades_medicas"][0]["label"] == "MÉDICO CLÍNICO"
    assert hospital.json()["outras_especialidades"][0]["value"] == 6
    assert hospital.json()["recursos_indisponiveis"] == [
        "internacoes_por_mes",
        "internacoes_por_cid",
        "media_permanencia",
    ]

    demografico = client.get("/api/v1/saude/perfil-demografico", params={"year": 2026})
    assert demografico.status_code == 200
    assert len(demografico.json()["pessoas_por_mes"]) == 2

    procedimentos = client.get("/api/v1/saude/procedimentos-tipo")
    assert procedimentos.status_code == 200
    assert procedimentos.json()["items"][0]["label"] == "Consulta"

    sync_status = client.get("/api/v1/saude/sync-status")
    assert sync_status.status_code == 200
    assert sync_status.json()["last_success_at"] is not None
    assert len(sync_status.json()["snapshots"]) >= len(resources)

    with connection.db_manager.get_session() as session:
        repo = SQLSaudeRepository(session)
        logs = repo.list_recent_sync_logs()
        assert len(logs) == 2
        assert logs[0].trigger_type == SaudeSyncTriggerType.MANUAL.value
        assert len(
            repo.list_snapshot_history(
                SaudeSnapshotResource.QUANTITATIVOS,
                limit=10,
            )
        ) == 2

