"""Testes de integração para a feature legislação — persistência SQL e CRUD admin."""

from __future__ import annotations

from fastapi.testclient import TestClient


def _legislacao_payload(**overrides: object) -> dict[str, object]:
    base: dict[str, object] = {
        "tipo": "LEI",
        "numero": "001",
        "ano": 2024,
        "ementa": "Dispõe sobre o Código Tributário Municipal",
        "texto_integral": "Texto integral da lei...",
        "data_publicacao": "2024-01-15",
        "data_promulgacao": "2024-01-15",
        "data_vigencia_inicio": "2024-02-01",
        "data_vigencia_fim": None,
        "status": "ATIVA",
        "autor": "Câmara Municipal",
        "sancionado_por": "Prefeito Municipal",
        "origem": "Câmara Municipal",
        "legislacao_vinculada": None,
        "url_arquivo": None,
    }
    base.update(overrides)
    return base


class TestLegislacaoPublicEndpoints:
    def test_lista_com_dados_bootstrap(self, client: TestClient) -> None:
        response = client.get("/api/v1/legislacao")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 15
        assert len(data["items"]) == 12  # default page size

    def test_detalhe_nao_encontrado(self, client: TestClient) -> None:
        response = client.get("/api/v1/legislacao/999")
        assert response.status_code == 404

    def test_cria_e_lista(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        list_before = client.get("/api/v1/legislacao").json()
        total_before = list_before["total"]

        create_resp = client.post(
            "/api/v1/legislacao",
            headers=admin_login,
            json=_legislacao_payload(),
        )
        assert create_resp.status_code == 201
        created = create_resp.json()

        list_resp = client.get("/api/v1/legislacao")
        assert list_resp.status_code == 200
        data = list_resp.json()
        assert data["total"] == total_before + 1
        item = next((i for i in data["items"] if i["id"] == created["id"]), None)
        assert item is not None
        assert item["tipo"] == "LEI"
        assert item["ano"] == 2024

    def test_detalhe_por_id(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        create_resp = client.post(
            "/api/v1/legislacao",
            headers=admin_login,
            json=_legislacao_payload(),
        )
        created = create_resp.json()

        detail_resp = client.get(f"/api/v1/legislacao/{created['id']}")
        assert detail_resp.status_code == 200
        detail = detail_resp.json()
        assert detail["ementa"] == "Dispõe sobre o Código Tributário Municipal"
        assert detail["texto_integral"] == "Texto integral da lei..."
        assert detail["sancionado_por"] == "Prefeito Municipal"


class TestLegislacaoAdminCRUD:
    def test_create_completo(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        payload = _legislacao_payload(
            legislacao_vinculada=["lei-001-2018"],
            url_arquivo="https://example.com/lei.pdf",
        )
        response = client.post("/api/v1/legislacao", headers=admin_login, json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["legislacao_vinculada"] == ["lei-001-2018"]
        assert data["url_arquivo"] == "https://example.com/lei.pdf"

    def test_update_parcial(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        create_resp = client.post(
            "/api/v1/legislacao",
            headers=admin_login,
            json=_legislacao_payload(),
        )
        created = create_resp.json()

        update_resp = client.put(
            f"/api/v1/legislacao/{created['id']}",
            headers=admin_login,
            json={"ementa": "Nova ementa atualizada"},
        )
        assert update_resp.status_code == 200
        updated = update_resp.json()
        assert updated["ementa"] == "Nova ementa atualizada"
        assert updated["numero"] == "001"  # unchanged

    def test_delete(self, client: TestClient, admin_login: dict[str, str]) -> None:
        create_resp = client.post(
            "/api/v1/legislacao",
            headers=admin_login,
            json=_legislacao_payload(),
        )
        created = create_resp.json()

        delete_resp = client.delete(
            f"/api/v1/legislacao/{created['id']}",
            headers=admin_login,
        )
        assert delete_resp.status_code == 204

        detail_resp = client.get(f"/api/v1/legislacao/{created['id']}")
        assert detail_resp.status_code == 404

    def test_create_sem_auth_retorna_401(self, client: TestClient) -> None:
        response = client.post("/api/v1/legislacao", json=_legislacao_payload())
        assert response.status_code == 401

    def test_update_sem_auth_retorna_401(self, client: TestClient) -> None:
        response = client.put("/api/v1/legislacao/1", json={"ementa": "teste"})
        assert response.status_code == 401

    def test_delete_sem_auth_retorna_401(self, client: TestClient) -> None:
        response = client.delete("/api/v1/legislacao/1")
        assert response.status_code == 401

    def test_update_inexistente_retorna_404(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        response = client.put(
            "/api/v1/legislacao/99999",
            headers=admin_login,
            json={"ementa": "teste"},
        )
        assert response.status_code == 404

    def test_delete_inexistente_retorna_404(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        response = client.delete("/api/v1/legislacao/99999", headers=admin_login)
        assert response.status_code == 404

    def test_update_limpa_vinculada(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        create_resp = client.post(
            "/api/v1/legislacao",
            headers=admin_login,
            json=_legislacao_payload(legislacao_vinculada=["lei-001-2018"]),
        )
        created = create_resp.json()
        assert created["legislacao_vinculada"] == ["lei-001-2018"]

        update_resp = client.put(
            f"/api/v1/legislacao/{created['id']}",
            headers=admin_login,
            json={"legislacao_vinculada": None},
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["legislacao_vinculada"] is None

    def test_usuario_nao_admin_retorna_403(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        # cria usuário comum
        create_user_resp = client.post(
            "/api/v1/identity/users",
            headers=admin_login,
            json={
                "name": "Usuário Comum",
                "email": "comum@example.com",
                "password": "Comum@12345",
                "role": "user",
            },
        )
        assert create_user_resp.status_code == 201

        # faz login como usuário comum
        login_resp = client.post(
            "/api/v1/identity/login",
            json={"email": "comum@example.com", "password": "Comum@12345"},
        )
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = client.post("/api/v1/legislacao", headers=headers, json=_legislacao_payload())
        assert response.status_code == 403


class TestLegislacaoFiltrosEPaginacao:
    def _seed_legislacoes(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        items = [
            _legislacao_payload(
                numero="001",
                ano=2024,
                tipo="LEI",
                status="ATIVA",
                ementa="Lei sobre IPTU",
            ),
            _legislacao_payload(
                numero="002",
                ano=2024,
                tipo="DECRETO",
                status="ATIVA",
                ementa="Decreto regulamenta IPTU",
            ),
            _legislacao_payload(
                numero="003",
                ano=2023,
                tipo="LEI",
                status="REVOGADA",
                ementa="Lei sobre ISS",
            ),
            _legislacao_payload(
                numero="004",
                ano=2023,
                tipo="PORTARIA",
                status="ATIVA",
                ementa="Portaria designa comissão",
            ),
            _legislacao_payload(
                numero="005",
                ano=2022,
                tipo="RESOLUCAO",
                status="ALTERADA",
                ementa="Resolução aprova regimento",
            ),
        ]
        for item in items:
            client.post("/api/v1/legislacao", headers=admin_login, json=item)

    def test_filtro_por_tipo(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        self._seed_legislacoes(client, admin_login)
        response = client.get("/api/v1/legislacao?tipo=LEI")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 2
        assert all(item["tipo"] == "LEI" for item in data["items"])

    def test_filtro_por_ano(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        self._seed_legislacoes(client, admin_login)
        response = client.get("/api/v1/legislacao?ano=2024")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 2
        assert all(item["ano"] == 2024 for item in data["items"])

    def test_filtro_por_status(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        self._seed_legislacoes(client, admin_login)
        response = client.get("/api/v1/legislacao?status=ATIVA")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 3
        assert all(item["status"] == "ATIVA" for item in data["items"])

    def test_busca_textual(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        self._seed_legislacoes(client, admin_login)
        response = client.get("/api/v1/legislacao?busca=IPTU")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 2

    def test_paginacao(self, client: TestClient, admin_login: dict[str, str]) -> None:
        self._seed_legislacoes(client, admin_login)
        response = client.get("/api/v1/legislacao?page=1&size=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["total"] >= 5
        assert data["page"] == 1
        assert data["size"] == 2

        page2 = client.get("/api/v1/legislacao?page=2&size=2")
        assert page2.json()["total"] >= 5
        assert len(page2.json()["items"]) == 2

    def test_filtros_combinados(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        self._seed_legislacoes(client, admin_login)
        response = client.get("/api/v1/legislacao?tipo=LEI&ano=2024&status=ATIVA")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert all(
            item["tipo"] == "LEI" and item["ano"] == 2024 and item["status"] == "ATIVA"
            for item in data["items"]
        )
