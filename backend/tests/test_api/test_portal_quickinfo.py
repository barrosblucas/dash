"""Testes de integração dos endpoints do Painel de Informações Rápidas.

Cobre:
  - GET /api/v1/obras/destaque
  - GET /api/v1/licitacoes/proxima
  - GET /api/v1/noticias/ultima
"""

from __future__ import annotations

from typing import Any
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from backend.features.licitacao.licitacao_types import LicitacaoComprasBRItem


class TestObraDestaque:
    """Testes para GET /api/v1/obras/destaque."""

    def _obra_payload(self, titulo: str, status: str = "em_andamento") -> dict[str, Any]:
        return {
            "titulo": titulo,
            "descricao": "Descrição da obra.",
            "status": status,
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
            "locations": [
                {
                    "sequencia": 1,
                    "logradouro": "Avenida Central",
                    "bairro": "Centro",
                    "cep": "79400-000",
                    "numero": "1000",
                    "latitude": "-19.9275000",
                    "longitude": "-54.3581000",
                }
            ],
            "funding_sources": [
                {"sequencia": 1, "nome": "Convênio Federal", "valor": "800000.00"},
            ],
            "media_assets": [],
            "medicoes": [],
        }

    def test_destaque_retorna_obra_mais_recente(
        self, client: TestClient, admin_login: dict[str, str]
    ) -> None:
        """Cria duas obras e verifica se destaque retorna a mais recente."""
        # Cria primeira obra
        resp1 = client.post(
            "/api/v1/obras",
            json=self._obra_payload("Obra Antiga"),
            headers=admin_login,
        )
        assert resp1.status_code == 201

        # Cria segunda obra
        resp2 = client.post(
            "/api/v1/obras",
            json=self._obra_payload("Obra Nova"),
            headers=admin_login,
        )
        assert resp2.status_code == 201
        hash_nova = resp2.json()["hash"]

        # Destaque deve retornar a mais nova
        resp = client.get("/api/v1/obras/destaque")
        assert resp.status_code == 200
        data = resp.json()
        assert data["hash"] == hash_nova
        assert data["titulo"] == "Obra Nova"

    def test_destaque_sem_obras_retorna_404(
        self, client: TestClient
    ) -> None:
        """Sem obras cadastradas, deve retornar 404."""
        resp = client.get("/api/v1/obras/destaque")
        assert resp.status_code == 404
        assert "detail" in resp.json()


class TestProximaLicitacao:
    """Testes para GET /api/v1/licitacoes/proxima."""

    @patch("backend.features.licitacao.licitacao_handler.fetch_licitacoes_comprasbr")
    def test_proxima_retorna_licitacao_futura(
        self, mock_fetch: AsyncMock, client: TestClient
    ) -> None:
        """Deve retornar a licitação com data de abertura futura mais próxima."""
        mock_fetch.return_value = (
            [
                self._item(1, "2028-06-15"),
                self._item(2, "2028-05-10"),
                self._item(3, "2020-01-01"),
            ],
            {"totalPages": 1, "totalElements": 3, "page": 0, "size": 200},
        )
        resp = client.get("/api/v1/licitacoes/proxima")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == 2
        assert data["dataAbertura"] == "2028-05-10"

    @patch("backend.features.licitacao.licitacao_handler.fetch_licitacoes_comprasbr")
    def test_sem_futuras_usa_primeira_da_lista(
        self, mock_fetch: AsyncMock, client: TestClient
    ) -> None:
        """Se não houver licitações futuras, usa a primeira da lista."""
        mock_fetch.return_value = (
            [self._item(1, "2020-01-01"), self._item(2, "2020-06-15")],
            {"totalPages": 1, "totalElements": 2, "page": 0, "size": 200},
        )
        resp = client.get("/api/v1/licitacoes/proxima")
        assert resp.status_code == 200
        assert resp.json()["id"] == 1

    @patch("backend.features.licitacao.licitacao_handler.fetch_licitacoes_comprasbr")
    def test_lista_vazia_retorna_404(
        self, mock_fetch: AsyncMock, client: TestClient
    ) -> None:
        mock_fetch.return_value = ([], {"totalPages": 0, "totalElements": 0, "page": 0, "size": 200})
        resp = client.get("/api/v1/licitacoes/proxima")
        assert resp.status_code == 404

    def _item(self, id_: int, data_abertura: str) -> LicitacaoComprasBRItem:
        """Helper para criar item de licitação mockado."""
        return LicitacaoComprasBRItem(
            id=id_,
            numeroEdital=f"Edital {id_}",
            objeto=f"Objeto da licitação {id_}",
            status="AGUARDANDO_ABERTURA",
            modalidade="PREGÃO ELETRÔNICO",
            orgaoNome="Prefeitura Municipal",
            dataAbertura=data_abertura,
            urlProcesso=f"https://comprasbr.com.br/lic/{id_}",
        )


class TestUltimaNoticia:
    """Testes para GET /api/v1/noticias/ultima."""

    def test_ultima_noticia_retorna_dados_validos(self, client: TestClient) -> None:
        """Deve retornar uma notícia com todos os campos esperados."""
        resp = client.get("/api/v1/noticias/ultima")
        assert resp.status_code == 200
        data = resp.json()
        assert "titulo" in data
        assert "chamada" in data
        assert "link" in data
        assert "data_publicacao" in data
        assert "fonte" in data
        assert isinstance(data["titulo"], str)
        assert len(data["titulo"]) > 0
        assert isinstance(data["chamada"], str)
        assert len(data["chamada"]) > 0
