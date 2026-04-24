"""Testes de integração administrativos do bounded context saude."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


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
