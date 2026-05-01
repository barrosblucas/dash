"""Testes automatizados para a feature legislação."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from backend.api.main import app
from backend.features.legislacao.legislacao_adapter import (
    fetch_legislacao_detalhe,
    fetch_legislacoes,
)
from backend.features.legislacao.legislacao_types import (
    LegislacaoDetalhe,
    LegislacaoListResponse,
    StatusLegislacao,
    TipoLegislacao,
)


class TestFetchLegislacoes:
    """Testes unitários para o adapter de listagem de legislações."""

    def test_fetch_legislacoes_retorna_lista(self) -> None:
        result = fetch_legislacoes()

        assert isinstance(result, LegislacaoListResponse)
        assert result.total == 15
        assert result.page == 1
        assert result.size == 12
        assert len(result.items) == 12

    def test_fetch_legislacoes_paginacao(self) -> None:
        result = fetch_legislacoes(page=1, size=5)

        assert len(result.items) == 5
        assert result.total == 15
        assert result.page == 1
        assert result.size == 5

    def test_fetch_legislacoes_filtro_tipo(self) -> None:
        result = fetch_legislacoes(tipo=TipoLegislacao.LEI)

        assert result.total == 6
        assert all(item.tipo == TipoLegislacao.LEI for item in result.items)

    def test_fetch_legislacoes_filtro_ano(self) -> None:
        result = fetch_legislacoes(ano=2020)

        assert result.total == 1
        assert result.items[0].ano == 2020
        assert result.items[0].id == "lei-120-2020"

    def test_fetch_legislacoes_filtro_status(self) -> None:
        result = fetch_legislacoes(status=StatusLegislacao.ATIVA)

        assert result.total == 10
        assert all(item.status == StatusLegislacao.ATIVA for item in result.items)

    def test_fetch_legislacoes_busca_textual(self) -> None:
        result = fetch_legislacoes(busca="IPTU")

        assert result.total == 2
        ids = {item.id for item in result.items}
        assert ids == {"decreto-045-2019", "lei-210-2021"}

    def test_fetch_legislacoes_combinacao_filtros(self) -> None:
        result = fetch_legislacoes(
            tipo=TipoLegislacao.LEI,
            ano=2020,
            status=StatusLegislacao.ATIVA,
        )

        assert result.total == 1
        item = result.items[0]
        assert item.tipo == TipoLegislacao.LEI
        assert item.ano == 2020
        assert item.status == StatusLegislacao.ATIVA

    def test_fetch_legislacao_detalhe_existente(self) -> None:
        detalhe = fetch_legislacao_detalhe("lei-001-2018")

        assert detalhe is not None
        assert isinstance(detalhe, LegislacaoDetalhe)
        assert detalhe.id == "lei-001-2018"
        assert detalhe.tipo == TipoLegislacao.LEI
        assert detalhe.numero == "001"
        assert detalhe.ano == 2018
        assert "Código Tributário" in detalhe.ementa
        assert detalhe.status == StatusLegislacao.ATIVA
        assert detalhe.autor == "Câmara Municipal de Bandeirantes"
        assert detalhe.texto_integral is not None
        assert len(detalhe.texto_integral) > 0

    def test_fetch_legislacao_detalhe_inexistente(self) -> None:
        detalhe = fetch_legislacao_detalhe("nao-existe")

        assert detalhe is None

    def test_fetch_legislacoes_lista_vazia(self) -> None:
        result = fetch_legislacoes(ano=1999)

        assert result.total == 0
        assert result.items == []
        assert result.page == 1
        assert result.size == 12


class TestLegislacaoEndpoints:
    """Testes de integração para os endpoints HTTP de legislação."""

    @pytest.fixture
    def client(self) -> TestClient:
        return TestClient(app)

    def test_endpoint_lista_legislacoes(self, client: TestClient) -> None:
        response = client.get("/api/v1/legislacao")

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "size" in data
        assert data["total"] == 15
        assert data["page"] == 1
        assert data["size"] == 12
        assert len(data["items"]) == 12

    def test_endpoint_legislacao_detalhe(self, client: TestClient) -> None:
        response = client.get("/api/v1/legislacao/lei-001-2018")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "lei-001-2018"
        assert data["tipo"] == "LEI"
        assert data["numero"] == "001"
        assert data["ano"] == 2018
        assert "texto_integral" in data

    def test_endpoint_legislacao_detalhe_404(self, client: TestClient) -> None:
        response = client.get("/api/v1/legislacao/nao-existe")

        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "Legislação não encontrada"

    def test_endpoint_legislacao_com_filtros(self, client: TestClient) -> None:
        response = client.get("/api/v1/legislacao?tipo=LEI&ano=2020")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        item = data["items"][0]
        assert item["tipo"] == "LEI"
        assert item["ano"] == 2020
        assert item["id"] == "lei-120-2020"
