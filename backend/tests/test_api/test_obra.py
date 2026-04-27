"""Testes de integração do bounded context obra."""

from __future__ import annotations

from typing import Any

from fastapi.testclient import TestClient


def _obra_payload(status_value: str = "em_andamento") -> dict[str, Any]:
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
        "locations": [
            {
                "sequencia": 1,
                "logradouro": "Avenida Central",
                "bairro": "Centro",
                "cep": "79400-000",
                "numero": "1000",
                "latitude": "-19.9275000",
                "longitude": "-54.3581000",
            },
            {
                "sequencia": 2,
                "logradouro": "Rua B",
                "bairro": "Jardim",
                "cep": "79400-001",
                "numero": "25",
                "latitude": "-19.9285000",
                "longitude": "-54.3591000",
            },
        ],
        "funding_sources": [
            {"sequencia": 1, "nome": "Convênio Federal", "valor": "800000.00"},
            {"sequencia": 2, "nome": "Tesouro Municipal", "valor": "200000.00"},
        ],
        "media_assets": [
            {
                "titulo": "Placa da obra",
                "media_kind": "image",
                "source_type": "url",
                "url": "https://example.com/placa.jpg",
            }
        ],
        "medicoes": [
            {
                "sequencia": 1,
                "mes_referencia": 1,
                "ano_referencia": 2026,
                "valor_medicao": "120000.00",
                "observacao": "Medição inicial",
                "media_assets": [],
            },
            {
                "sequencia": 2,
                "mes_referencia": 2,
                "ano_referencia": 2026,
                "valor_medicao": "80000.00",
                "observacao": None,
                "media_assets": [
                    {
                        "titulo": "Relatório parcial",
                        "media_kind": "measurement_attachment",
                        "source_type": "url",
                        "url": "https://example.com/medicao.pdf",
                    }
                ],
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
    assert len(created["locations"]) == 2
    assert len(created["funding_sources"]) == 2
    assert created["media_assets"][0]["url"] == "https://example.com/placa.jpg"
    assert created["medicoes"][1]["media_assets"][0]["url"] == "https://example.com/medicao.pdf"

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
            "media_assets": [],
        }
    ]
    update_payload["locations"] = update_payload["locations"][:1]
    update_payload["funding_sources"] = update_payload["funding_sources"][:1]

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
    assert len(updated["locations"]) == 1
    assert len(updated["funding_sources"]) == 1

    media_link_response = client.post(
        f"/api/v1/obras/{created['hash']}/media/link",
        headers={"Authorization": admin_login["Authorization"]},
        json={
            "titulo": "Diário de obra",
            "media_kind": "document",
            "url": "https://example.com/diario.pdf",
        },
    )
    assert media_link_response.status_code == 201
    assert media_link_response.json()["url"] == "https://example.com/diario.pdf"

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
