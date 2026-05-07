"""Testes de integração para a feature institucional."""

from __future__ import annotations

from fastapi.testclient import TestClient


def _profile_payload(**overrides: object) -> dict[str, object]:
    base: dict[str, object] = {
        "city_hall_name": "Prefeitura Teste",
        "description": "Descrição teste",
        "address": "Rua Teste, 123",
        "phone": "(67) 99999-9999",
        "email": "contato@teste.com",
        "office_hours": "08:00 às 17:00",
        "social_links": [{"label": "Site", "url": "https://teste.com"}],
        "mayor_name": "Prefeito Teste",
        "mayor_bio": "Biografia do prefeito",
    }
    base.update(overrides)
    return base


def _dept_payload(**overrides: object) -> dict[str, object]:
    base: dict[str, object] = {
        "slug": "nova-secretaria",
        "name": "Secretaria Municipal de Teste",
        "kind": "secretaria",
        "leader_title": "Secretário(a)",
    }
    base.update(overrides)
    return base


def _office_payload(**overrides: object) -> dict[str, object]:
    base: dict[str, object] = {
        "kind": "reparticao",
        "name": "Setor de Teste",
    }
    base.update(overrides)
    return base


class TestInstitucionalPublicEndpoints:
    def test_bootstrap_inicial_prefeitura(self, client: TestClient) -> None:
        """O bootstrap deve criar o profile institucional inicial."""
        response = client.get("/api/v1/institucional/prefeitura")
        assert response.status_code == 200
        data = response.json()
        assert data["city_hall_name"] == "Prefeitura Municipal de Bandeirantes"
        assert data["description"] == "Informações institucionais em atualização."
        assert isinstance(data["contact"], dict)
        assert isinstance(data["social_links"], list)
        assert "updated_at" in data

    def test_bootstrap_inicial_gestao(self, client: TestClient) -> None:
        """O bootstrap deve criar a gestão com campos vazios."""
        response = client.get("/api/v1/institucional/gestao")
        assert response.status_code == 200
        data = response.json()
        assert "mayor" in data
        assert "vice_mayor" in data
        assert "cabinet_chief" in data
        assert data["mayor"]["role"] == "Prefeito(a)"
        assert data["vice_mayor"]["role"] == "Vice-Prefeito(a)"
        assert data["cabinet_chief"]["role"] == "Chefe de Gabinete"
        assert "updated_at" in data

    def test_bootstrap_inicial_secretarias(self, client: TestClient) -> None:
        """O bootstrap deve criar as 11 secretarias/autarquias."""
        response = client.get("/api/v1/institucional/secretarias")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 11
        assert len(data["items"]) == 11

        slugs = [item["slug"] for item in data["items"]]
        assert "administracao" in slugs
        assert "saude" in slugs
        assert "saae" in slugs

        saae = next(item for item in data["items"] if item["slug"] == "saae")
        assert saae["kind"] == "autarquia"
        assert saae["leader_title"] == "Diretor(a)"

    def test_secretaria_por_slug(self, client: TestClient) -> None:
        """GET /secretarias/{slug} retorna o registro correto."""
        response = client.get("/api/v1/institucional/secretarias/educacao")
        assert response.status_code == 200
        data = response.json()
        assert data["slug"] == "educacao"
        assert data["name"] == "Secretaria Municipal de Educação"
        assert data["kind"] == "secretaria"

    def test_secretaria_slug_inexistente(self, client: TestClient) -> None:
        """GET /secretarias/{slug} com slug inválido retorna 404."""
        response = client.get("/api/v1/institucional/secretarias/nao-existe")
        assert response.status_code == 404

    def test_bootstrap_inicial_reparticoes(self, client: TestClient) -> None:
        """O bootstrap deve criar 11 repartições iniciais."""
        response = client.get("/api/v1/institucional/reparticoes")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 11
        assert len(data["items"]) == 11


class TestInstitucionalAdminProfile:
    def test_get_profile_sem_auth_retorna_401(self, client: TestClient) -> None:
        response = client.get("/api/v1/institucional/admin/profile")
        assert response.status_code == 401

    def test_update_profile(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        response = client.put(
            "/api/v1/institucional/admin/profile",
            headers=admin_login,
            json=_profile_payload(),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["city_hall_name"] == "Prefeitura Teste"
        assert data["contact"]["phone"] == "(67) 99999-9999"
        assert len(data["social_links"]) == 1

    def test_update_profile_parcial(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        # Primeiro atualiza completo
        client.put(
            "/api/v1/institucional/admin/profile",
            headers=admin_login,
            json=_profile_payload(),
        )
        # Depois atualiza parcial
        response = client.put(
            "/api/v1/institucional/admin/profile",
            headers=admin_login,
            json={"description": "Nova descrição"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["description"] == "Nova descrição"
        assert data["city_hall_name"] == "Prefeitura Teste"  # inalterado

    def test_update_profile_reflete_publico(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        client.put(
            "/api/v1/institucional/admin/profile",
            headers=admin_login,
            json=_profile_payload(),
        )
        public = client.get("/api/v1/institucional/prefeitura")
        assert public.status_code == 200
        assert public.json()["city_hall_name"] == "Prefeitura Teste"


class TestInstitucionalAdminSecretarias:
    def test_list_sem_auth_retorna_401(self, client: TestClient) -> None:
        response = client.get("/api/v1/institucional/admin/secretarias")
        assert response.status_code == 401

    def test_create_secretaria(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        response = client.post(
            "/api/v1/institucional/admin/secretarias",
            headers=admin_login,
            json=_dept_payload(),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["slug"] == "nova-secretaria"
        assert data["name"] == "Secretaria Municipal de Teste"

    def test_update_secretaria(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        create = client.post(
            "/api/v1/institucional/admin/secretarias",
            headers=admin_login,
            json=_dept_payload(),
        )
        created = create.json()

        response = client.put(
            f"/api/v1/institucional/admin/secretarias/{created['id']}",
            headers=admin_login,
            json={"name": "Secretaria Atualizada"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Secretaria Atualizada"
        assert data["slug"] == "nova-secretaria"  # inalterado

    def test_delete_secretaria(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        create = client.post(
            "/api/v1/institucional/admin/secretarias",
            headers=admin_login,
            json=_dept_payload(),
        )
        created = create.json()

        delete = client.delete(
            f"/api/v1/institucional/admin/secretarias/{created['id']}",
            headers=admin_login,
        )
        assert delete.status_code == 204

        # Verifica que sumiu da lista
        lista = client.get("/api/v1/institucional/secretarias")
        slugs = [item["slug"] for item in lista.json()["items"]]
        assert "nova-secretaria" not in slugs

    def test_delete_secretaria_inexistente_404(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        response = client.delete(
            "/api/v1/institucional/admin/secretarias/99999",
            headers=admin_login,
        )
        assert response.status_code == 404

    def test_create_sem_auth_retorna_401(self, client: TestClient) -> None:
        response = client.post(
            "/api/v1/institucional/admin/secretarias",
            json=_dept_payload(),
        )
        assert response.status_code == 401


class TestInstitucionalAdminReparticoes:
    def test_list_sem_auth_retorna_401(self, client: TestClient) -> None:
        response = client.get("/api/v1/institucional/admin/reparticoes")
        assert response.status_code == 401

    def test_create_reparticao(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        response = client.post(
            "/api/v1/institucional/admin/reparticoes",
            headers=admin_login,
            json=_office_payload(),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Setor de Teste"
        assert data["kind"] == "reparticao"

    def test_create_reparticao_com_departamento(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        # Pega um departamento existente
        depts = client.get(
            "/api/v1/institucional/admin/secretarias",
            headers=admin_login,
        ).json()
        dept_id = depts["items"][0]["id"]

        response = client.post(
            "/api/v1/institucional/admin/reparticoes",
            headers=admin_login,
            json=_office_payload(department_id=dept_id),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["department_id"] == dept_id

    def test_update_reparticao(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        create = client.post(
            "/api/v1/institucional/admin/reparticoes",
            headers=admin_login,
            json=_office_payload(),
        )
        created = create.json()

        response = client.put(
            f"/api/v1/institucional/admin/reparticoes/{created['id']}",
            headers=admin_login,
            json={"name": "Setor Atualizado"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Setor Atualizado"

    def test_delete_reparticao(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        create = client.post(
            "/api/v1/institucional/admin/reparticoes",
            headers=admin_login,
            json=_office_payload(),
        )
        created = create.json()

        delete = client.delete(
            f"/api/v1/institucional/admin/reparticoes/{created['id']}",
            headers=admin_login,
        )
        assert delete.status_code == 204

        lista = client.get("/api/v1/institucional/reparticoes")
        ids = [item["id"] for item in lista.json()["items"]]
        assert created["id"] not in ids

    def test_delete_reparticao_inexistente_404(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        response = client.delete(
            "/api/v1/institucional/admin/reparticoes/99999",
            headers=admin_login,
        )
        assert response.status_code == 404

    def test_create_sem_auth_retorna_401(self, client: TestClient) -> None:
        response = client.post(
            "/api/v1/institucional/admin/reparticoes",
            json=_office_payload(),
        )
        assert response.status_code == 401
