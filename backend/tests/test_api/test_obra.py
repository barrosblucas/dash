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
    assert created["media_assets"][0]["is_cover"] is False
    assert created["medicoes"][1]["media_assets"][0]["url"] == "https://example.com/medicao.pdf"
    assert created["medicoes"][1]["media_assets"][0]["is_cover"] is False

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


def test_media_cover_upload_promotes_and_clears_previous(
    client: TestClient, admin_login: dict[str, str]
) -> None:
    """Upload com is_cover=true promove nova capa e desmarca a anterior."""
    # Create obra
    resp = client.post(
        "/api/v1/obras",
        headers={"Authorization": admin_login["Authorization"]},
        json=_obra_payload(),
    )
    assert resp.status_code == 201
    obra_hash = resp.json()["hash"]

    # Upload first image as cover
    first = client.post(
        f"/api/v1/obras/{obra_hash}/media/upload",
        headers={"Authorization": admin_login["Authorization"]},
        files={"file": ("img1.jpg", b"fake-image-data", "image/jpeg")},
        data={"titulo": "Capa 1", "media_kind": "image", "is_cover": "true"},
    )
    assert first.status_code == 201
    first_id = first.json()["id"]
    assert first.json()["is_cover"] is True
    assert first.json()["titulo"] == "Capa 1"

    # Upload second image as cover — should clear first
    second = client.post(
        f"/api/v1/obras/{obra_hash}/media/upload",
        headers={"Authorization": admin_login["Authorization"]},
        files={"file": ("img2.jpg", b"more-fake-data", "image/jpeg")},
        data={"titulo": "Capa 2", "media_kind": "image", "is_cover": "true"},
    )
    assert second.status_code == 201
    second_id = second.json()["id"]
    assert second.json()["is_cover"] is True

    # Verify via detail endpoint
    detail = client.get(f"/api/v1/obras/{obra_hash}")
    assert detail.status_code == 200
    media_list = detail.json()["media_assets"]
    cover_ids = [m["id"] for m in media_list if m["is_cover"]]
    assert cover_ids == [second_id], "Only the most recent cover should be marked"
    # First image should no longer be cover
    first_updated = next(m for m in media_list if m["id"] == first_id)
    assert first_updated["is_cover"] is False


def test_media_cover_only_for_global_images(
    client: TestClient, admin_login: dict[str, str]
) -> None:
    """Mídias de medição não viram capa, mesmo se solicitado."""
    resp = client.post(
        "/api/v1/obras",
        headers={"Authorization": admin_login["Authorization"]},
        json=_obra_payload(),
    )
    assert resp.status_code == 201
    obra_hash = resp.json()["hash"]

    # Get medição ID
    detail = client.get(f"/api/v1/obras/{obra_hash}")
    medicao_id = detail.json()["medicoes"][0]["id"]

    # Upload image with is_cover=true but linked to medição
    upload_resp = client.post(
        f"/api/v1/obras/{obra_hash}/media/upload",
        headers={"Authorization": admin_login["Authorization"]},
        files={"file": ("med.jpg", b"med-fake", "image/jpeg")},
        data={
            "titulo": "Medição cover",
            "media_kind": "image",
            "medicao_id": str(medicao_id),
            "is_cover": "true",
        },
    )
    assert upload_resp.status_code == 201
    assert upload_resp.json()["is_cover"] is False, (
        "Mídia de medição não pode ser capa"
    )


def test_media_cover_exposed_on_create_and_read(
    client: TestClient, admin_login: dict[str, str]
) -> None:
    """Create/read expõe is_cover nos schemas response."""
    payload = _obra_payload()
    payload["media_assets"] = [
        {
            "titulo": "Placa da obra",
            "media_kind": "image",
            "source_type": "url",
            "url": "https://example.com/placa.jpg",
            "is_cover": True,
        }
    ]
    resp = client.post(
        "/api/v1/obras",
        headers={"Authorization": admin_login["Authorization"]},
        json=payload,
    )
    assert resp.status_code == 201
    created = resp.json()
    cover_media = [m for m in created["media_assets"] if m["is_cover"]]
    assert len(cover_media) == 1
    assert cover_media[0]["url"] == "https://example.com/placa.jpg"
