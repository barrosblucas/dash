"""Testes de integração do bounded context saude."""

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


def test_saude_admin_crud_import_and_public_units(
    client: TestClient,
    admin_login: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    headers = {"Authorization": admin_login["Authorization"]}

    create_response = client.post(
        "/api/v1/saude/admin/unidades",
        headers=headers,
        json={
            "name": "UBS Central",
            "unit_type": "UBS",
            "address": "Rua A, 10",
            "neighborhood": "Centro",
            "phone": "6733330000",
            "latitude": -19.918,
            "longitude": -54.358,
            "is_active": True,
            "source": "manual",
        },
    )
    assert create_response.status_code == 201
    created = create_response.json()

    schedules_response = client.put(
        f"/api/v1/saude/admin/unidades/{created['id']}/horarios",
        headers=headers,
        json={
            "schedules": [
                {
                    "day_of_week": "monday",
                    "opens_at": "07:00:00",
                    "closes_at": "17:00:00",
                    "is_closed": False,
                }
            ]
        },
    )
    assert schedules_response.status_code == 200
    assert schedules_response.json()["schedules"][0]["day_of_week"] == "monday"

    from backend.features.saude import saude_adapter

    async def fake_fetch_localizacao(self: object) -> list[dict[str, object]]:
        return [
            {
                "id": 99,
                "title": "Posto Importado",
                "no_tipo_unidade_saude": "POSTO DE SAUDE",
                "logradouro": "Rua B, 20",
                "bairro": "Centro",
                "telefone": "(67) 9999-0000",
                "lat": -19.1,
                "lng": -54.1,
            }
        ]

    async def fake_fetch_horarios(self: object, unidade_id: int) -> dict[str, object]:
        assert unidade_id == 99
        return {"horarios": []}

    monkeypatch.setattr(
        saude_adapter.ESaudeClient,
        "fetch_localizacao_unidades",
        fake_fetch_localizacao,
    )
    monkeypatch.setattr(
        saude_adapter.ESaudeClient,
        "fetch_unidade_horarios",
        fake_fetch_horarios,
    )

    import_response = client.post(
        "/api/v1/saude/admin/unidades/importar-esaude",
        headers=headers,
    )
    assert import_response.status_code == 200
    assert import_response.json() == {"imported": 1, "updated": 0, "total": 1}

    admin_list = client.get("/api/v1/saude/admin/unidades", headers=headers)
    assert admin_list.status_code == 200
    assert admin_list.json()["total"] == 2

    public_units = client.get("/api/v1/saude/unidades", params={"search": "Importado"})
    assert public_units.status_code == 200
    assert public_units.json()["total"] == 1
    assert public_units.json()["items"][0]["external_id"] == 99

    schedule_detail = client.get(f"/api/v1/saude/unidades/{created['id']}/horarios")
    assert schedule_detail.status_code == 200
    assert schedule_detail.json()["schedules"][0]["opens_at"] == "07:00:00"

    delete_response = client.delete(
        f"/api/v1/saude/admin/unidades/{created['id']}",
        headers=headers,
    )
    assert delete_response.status_code == 200

    public_after_delete = client.get("/api/v1/saude/unidades")
    assert public_after_delete.status_code == 200
    assert public_after_delete.json()["total"] == 1

    inactive_admin = client.get(
        "/api/v1/saude/admin/unidades",
        headers=headers,
        params={"ativo": "false"},
    )
    assert inactive_admin.status_code == 200
    assert inactive_admin.json()["total"] == 1


def test_saude_sync_and_public_dashboards(
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
                "quantitativo_mulheres": {"titulo": "Mulheres", "valor": 10},
                "quantitativo_homens": {"titulo": "Homens", "valor": 8},
                "quantitativo_idosos": {"titulo": "Idosos", "valor": 2},
            },
            "temDados": True,
        }

    async def fake_fetch_chart(
        self: object,
        resource: str,
        year: int | None = None,
    ) -> dict[str, object]:
        if resource == "lista-de-medicamentos-com-mais-saidas":
            return {
                "labels": ["Dipirona", "Paracetamol"],
                "datasets": [{"data": [40, 30]}],
            }
        if resource == "quantidade-de-medicamentos-dispensados-por-mes":
            return {
                "labels": ["Janeiro de 2026", "Fevereiro de 2026", "Janeiro de 2025"],
                "datasets": [{"data": [100, 120, 90]}],
            }
        if resource == "quantidade-de-atendimentos-medicamentos-por-mes":
            assert year == 2026
            return {
                "labels": ["Janeiro de 2026", "Fevereiro de 2026"],
                "datasets": [{"data": [8, 9]}],
            }
        if resource == "quantidade-de-pessoas-fisicas-e-juridicas":
            return {"labels": ["Física", "Jurídica"], "datasets": [{"data": [7, 3]}]}
        if resource == "quantidade-de-pessoas-por-mes":
            return {
                "labels": ["Janeiro de 2026", "Fevereiro de 2026", "Janeiro de 2025"],
                "datasets": [{"data": [15, 20, 11]}],
            }
        assert resource == "quantidade-de-procedimentos-por-tipo"
        return {"labels": ["Consulta", "Exame"], "datasets": [{"data": [11, 4]}]}

    monkeypatch.setattr(
        saude_adapter.ESaudeClient,
        "fetch_medicamentos_tabela",
        fake_fetch_medicamentos_tabela,
    )
    monkeypatch.setattr(
        saude_adapter.ESaudeClient, "fetch_quantitativos", fake_fetch_quantitativos
    )
    monkeypatch.setattr(saude_adapter.ESaudeClient, "fetch_chart", fake_fetch_chart)

    sync_response = client.post(
        "/api/v1/saude/admin/sync",
        headers=headers,
        json={
            "years": [2026],
            "resources": [
                "medicamentos_estoque",
                "medicamentos_ranking",
                "medicamentos_dispensados_mensal",
                "medicamentos_atendimentos_mensal",
                "quantitativos",
                "pessoas_fisicas_juridicas",
                "pessoas_por_mes",
                "procedimentos_por_tipo",
            ],
        },
    )
    assert sync_response.status_code == 200
    assert sync_response.json()["status"] == "success"
    assert sync_response.json()["synced_resources"] == 8

    medicamentos = client.get(
        "/api/v1/saude/medicamentos-estoque",
        params={"search": "dipi", "estabelecimento": "ubs", "page": 1, "page_size": 10},
    )
    assert medicamentos.status_code == 200
    assert medicamentos.json()["total"] == 1
    assert medicamentos.json()["total_abaixo_minimo"] == 1

    dispensados = client.get(
        "/api/v1/saude/medicamentos-dispensados", params={"year": 2026}
    )
    assert dispensados.status_code == 200
    assert dispensados.json()["ranking"][0]["label"] == "Dipirona"
    assert len(dispensados.json()["series_mensal_atendimentos"]) == 2

    epidemiologico = client.get("/api/v1/saude/perfil-epidemiologico")
    assert epidemiologico.status_code == 200
    assert epidemiologico.json()["por_sexo"][0]["label"] == "Mulheres"

    demografico = client.get("/api/v1/saude/perfil-demografico", params={"year": 2026})
    assert demografico.status_code == 200
    assert len(demografico.json()["pessoas_por_mes"]) == 2

    procedimentos = client.get("/api/v1/saude/procedimentos-tipo")
    assert procedimentos.status_code == 200
    assert procedimentos.json()["items"][0]["label"] == "Consulta"

    sync_status = client.get("/api/v1/saude/sync-status")
    assert sync_status.status_code == 200
    assert sync_status.json()["last_success_at"] is not None
    assert len(sync_status.json()["snapshots"]) == 8

    with connection.db_manager.get_session() as session:
        repo = SQLSaudeRepository(session)
        logs = repo.list_recent_sync_logs()
        assert len(logs) == 1
        assert logs[0].trigger_type == SaudeSyncTriggerType.MANUAL.value
        snapshot, _ = repo.get_snapshot_payload(
            SaudeSnapshotResource.MEDICAMENTOS_ATENDIMENTOS_MENSAL,
            2026,
        )
        assert snapshot is not None
