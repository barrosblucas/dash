"""Testes de integração do bounded context obra."""

from __future__ import annotations

from fastapi.testclient import TestClient


def _obra_payload(status_value: str = "em_andamento") -> dict[str, object]:
    return {
        "titulo": "Pavimentação da Avenida Central",
        "descricao": "Execução de pavimentação e drenagem.",
        "status": status_value,
        "secretaria": "Infraestrutura",
        "orgao": "Prefeitura Municipal",
        "contrato": "CTR-001/2026",
        "tipo_obra": "Pavimentação",
        "modalidade": "Concorrência",
        "fonte_recurso": "Convênio Federal",
        "data_inicio": "2026-01-10",
        "previsao_termino": "2026-12-20",
        "data_termino": None,
        "logradouro": "Avenida Central",
        "bairro": "Centro",
        "cep": "79400-000",
        "numero": "1000",
        "latitude": "-19.9275000",
        "longitude": "-54.3581000",
        "valor_orcamento": "1000000.00",
        "valor_original": "950000.00",
        "valor_aditivo": "50000.00",
        "valor_homologado": "900000.00",
        "valor_contrapartida": "100000.00",
        "valor_convenio": "800000.00",
        "progresso_fisico": "35.50",
        "progresso_financeiro": "40.25",
        "medicoes": [
            {
                "sequencia": 1,
                "mes_referencia": 1,
                "ano_referencia": 2026,
                "valor_medicao": "120000.00",
                "observacao": "Medição inicial",
            },
            {
                "sequencia": 2,
                "mes_referencia": 2,
                "ano_referencia": 2026,
                "valor_medicao": "80000.00",
                "observacao": None,
            },
        ],
    }


def test_obra_crud_and_public_reads(client: TestClient, admin_login: dict[str, str]) -> None:
    unauthorized_create = client.post("/api/v1/obras", json=_obra_payload())
    assert unauthorized_create.status_code == 401

    create_response = client.post(
        "/api/v1/obras",
        headers={"Authorization": admin_login["Authorization"]},
        json=_obra_payload(),
    )
    assert create_response.status_code == 201
    created = create_response.json()
    assert created["valor_medido_total"] == "200000.00"
    assert created["valor_economizado"] == "50000.00"
    assert len(created["medicoes"]) == 2

    list_response = client.get("/api/v1/obras")
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 1

    detail_response = client.get(f"/api/v1/obras/{created['hash']}")
    assert detail_response.status_code == 200
    assert detail_response.json()["titulo"] == _obra_payload()["titulo"]

    update_payload = _obra_payload(status_value="concluida")
    update_payload["medicoes"] = [
        {
            "sequencia": 1,
            "mes_referencia": 3,
            "ano_referencia": 2026,
            "valor_medicao": "300000.00",
            "observacao": "Medição final",
        }
    ]

    update_response = client.put(
        f"/api/v1/obras/{created['hash']}",
        headers={"Authorization": admin_login["Authorization"]},
        json=update_payload,
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["status"] == "concluida"
    assert updated["valor_medido_total"] == "300000.00"
    assert len(updated["medicoes"]) == 1

    filtered_response = client.get("/api/v1/obras", params={"status": "concluida"})
    assert filtered_response.status_code == 200
    assert filtered_response.json()["total"] == 1

    delete_response = client.delete(
        f"/api/v1/obras/{created['hash']}",
        headers={"Authorization": admin_login["Authorization"]},
    )
    assert delete_response.status_code == 200

    missing_detail = client.get(f"/api/v1/obras/{created['hash']}")
    assert missing_detail.status_code == 404
