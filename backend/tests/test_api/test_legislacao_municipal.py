"""Testes de integração para os endpoints de legislação municipal.

Endpoints:
- GET  /api/v1/legislacao-municipal/buscar
- POST /api/v1/legislacao-municipal/importar
- POST /api/v1/legislacao-municipal/download
"""

from __future__ import annotations

import base64
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

HANDLER = "backend.features.legislacao_municipal.legislacao_municipal_handler"
ADAPTER = "backend.features.legislacao_municipal.legislacao_municipal_adapter"
ASYNC_PLAYWRIGHT = "playwright.async_api.async_playwright"


def _raw_legislacao_item(
    item_id: str = "878370",
    titulo: str = "LEI MUNICIPAL Nº 1.263/2026, DE 23 DE ABRIL DE 2026.",
    data: str = "24/04/2026",
    num_mat: str = "2904",
) -> dict:
    return {
        "id": item_id,
        "titulo": titulo + "<br><small><b>Cidade:</b> BANDEIRANTES</small>",
        "data_de_circulacao": data,
        "numero_da_materia": num_mat,
        "cidade": {"id": "71", "nome": "BANDEIRANTES", "anexo_habilitado": False},
        "action-baixar": (
            f'<form method="post" target="_blank" '
            f'action="https://www.diariooficialms.com.br/baixar-materia/'
            f'{item_id}/abc123">'
            f'<button class="action-baixar-materia" type="button">Baixar</button>'
            f"</form>"
        ),
    }


def _make_mock_client(raw_items: list | None = None) -> AsyncMock:
    """Retorna um AsyncMock de DiarioOficialClient com métodos configurados."""
    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    if raw_items is not None:
        mock_client.fetch_all_pages = AsyncMock(return_value=raw_items)
    mock_client.fetch_pdf_links_for_date = AsyncMock(return_value={})
    return mock_client


class TestBuscarLegislacao:
    """Testes para GET /api/v1/legislacao-municipal/buscar."""

    def test_requires_auth(self, client: TestClient) -> None:
        """Sem token de admin, retorna 401."""
        response = client.get("/api/v1/legislacao-municipal/buscar")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_returns_paginated_results(
        self,
        client: TestClient,
        admin_login: dict[str, str],
    ) -> None:
        """Com 3 resultados e size=2, retorna page com 2 items e total=3."""
        raw_items = [
            _raw_legislacao_item("1", "LEI Nº 1/2026", "24/04/2026", "2901"),
            _raw_legislacao_item("2", "LEI Nº 2/2026", "25/04/2026", "2902"),
            _raw_legislacao_item("3", "LEI Nº 3/2026", "26/04/2026", "2903"),
        ]
        mock_client = _make_mock_client(raw_items)

        with patch(f"{HANDLER}.DiarioOficialClient", return_value=mock_client):
            response = client.get(
                "/api/v1/legislacao-municipal/buscar",
                headers=admin_login,
                params={
                    "termo": "LEI",
                    "data_inicio": "01/01/2026",
                    "data_fim": "30/04/2026",
                    "page": 1,
                    "size": 2,
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "size" in data
        assert data["total"] == 3
        assert len(data["items"]) == 2
        assert data["page"] == 1
        assert data["size"] == 2

    @pytest.mark.asyncio
    async def test_empty_results(
        self,
        client: TestClient,
        admin_login: dict[str, str],
    ) -> None:
        """Quando não há resultados, retorna lista vazia e total 0."""
        mock_client = _make_mock_client([])

        with patch(f"{HANDLER}.DiarioOficialClient", return_value=mock_client):
            response = client.get(
                "/api/v1/legislacao-municipal/buscar",
                headers=admin_login,
                params={
                    "termo": "LEI",
                    "data_inicio": "01/01/1900",
                    "data_fim": "01/01/1900",
                    "page": 1,
                    "size": 20,
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["items"] == []
        assert data["page"] == 1
        assert data["size"] == 20


class TestImportarLegislacao:
    """Testes para POST /api/v1/legislacao-municipal/importar."""

    def test_requires_auth(self, client: TestClient) -> None:
        """Sem token de admin, retorna 401."""
        response = client.post("/api/v1/legislacao-municipal/importar", json={})
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_uses_diario_link_not_materia_link(
        self,
        client: TestClient,
        admin_login: dict[str, str],
    ) -> None:
        """Verifica que importar_como_legislacao recebe link_diario_oficial
        como link_download (não link_legislacao).

        Regression test: o bug anterior usava link_legislacao (URL da matéria)
        em vez de link_diario_oficial (URL direta do PDF no DO Spaces).
        """
        mock_client = _make_mock_client()
        mock_importar = AsyncMock()

        import_payload = {
            "legislacao_id": "999",
            "titulo": "LEI MUNICIPAL Nº 999/2026",
            "data_publicacao": "24/04/2026",
            "numero_materia": "2999",
            "link_legislacao": "https://www.diariooficialms.com.br/baixar-materia/999/xyz",
            "link_diario_oficial": "https://spaces.digitalocean.com/pdfs/edicao-2999.pdf",
            "numero_lei": "999",
            "ano_lei": "2026",
            "tipo": "LEI",
        }

        detalhe_dict = {
            "id": "999",
            "tipo": "LEI",
            "numero": "999",
            "ano": 2026,
            "ementa": "Ementa de teste",
            "texto_integral": "",
            "data_publicacao": "2026-04-24",
            "data_promulgacao": None,
            "data_vigencia_inicio": None,
            "data_vigencia_fim": None,
            "status": "ATIVA",
            "autor": None,
            "sancionado_por": None,
            "origem": None,
            "legislacao_vinculada": None,
            "url_arquivo": None,
        }

        with (
            patch(f"{HANDLER}.DiarioOficialClient", return_value=mock_client),
            patch(f"{HANDLER}.importar_como_legislacao", mock_importar),
            patch(
                f"{HANDLER}.legislacao_to_detalhe_dict",
                return_value=detalhe_dict,
            ),
        ):
            response = client.post(
                "/api/v1/legislacao-municipal/importar",
                headers=admin_login,
                json=import_payload,
            )

        assert response.status_code == 200

        # Verifica que importar_como_legislacao foi chamada exatamente uma vez
        mock_importar.assert_awaited_once()

        # Extrai o payload (terceiro argumento) da chamada
        _call_db, _call_client, call_payload = mock_importar.await_args.args

        # O link_download no DiarioImportRequest deve ser o link_diario_oficial
        assert call_payload.link_download == import_payload["link_diario_oficial"]
        # E NÃO deve ser o link_legislacao
        assert call_payload.link_download != import_payload["link_legislacao"]
        # O url_arquivo deve ser o link_legislacao (para armazenamento)
        assert call_payload.url_arquivo == import_payload["link_legislacao"]


class TestLegislacaoMunicipalDownload:
    """Testes para POST /api/v1/legislacao-municipal/download."""

    VALID_URL = "https://www.diariooficialms.com.br/baixar-materia/123/abc"
    INVALID_URL = "https://evil.com/baixar-materia/123/abc"
    DOWNLOAD_ENDPOINT = "/api/v1/legislacao-municipal/download"

    @staticmethod
    def _make_mock_playwright(page_evaluate_result: str | None = None) -> MagicMock:
        """Constrói a cadeia de mocks do Playwright.

        Retorna um mock que, quando usado como async_playwright(), produz a
        cadeia: pw → browser → context → page, onde page.evaluate retorna
        o valor fornecido.
        """
        mock_page = AsyncMock()
        mock_page.evaluate = AsyncMock(return_value=page_evaluate_result)

        mock_context = AsyncMock()
        mock_context.new_page = AsyncMock(return_value=mock_page)

        mock_browser = AsyncMock()
        mock_browser.new_context = AsyncMock(return_value=mock_context)

        mock_chromium = MagicMock()
        mock_chromium.launch = AsyncMock(return_value=mock_browser)

        mock_pw = AsyncMock()
        mock_pw.chromium = mock_chromium
        mock_pw.__aenter__ = AsyncMock(return_value=mock_pw)
        mock_pw.__aexit__ = AsyncMock(return_value=None)

        return mock_pw

    def test_download_sem_auth_retorna_401(self, client: TestClient) -> None:
        """Sem token de admin, retorna 401."""
        response = client.post(
            self.DOWNLOAD_ENDPOINT,
            json={"id": "123", "link_legislacao": self.VALID_URL},
        )
        assert response.status_code == 401

    def test_download_url_invalida_retorna_400(
        self,
        client: TestClient,
        admin_login: dict[str, str],
    ) -> None:
        """URL fora do domínio permitido retorna 400 sem acionar Playwright."""
        response = client.post(
            self.DOWNLOAD_ENDPOINT,
            headers=admin_login,
            json={"id": "123", "link_legislacao": self.INVALID_URL},
        )
        assert response.status_code == 400
        assert "inválida" in response.text.lower()

    def test_download_sucesso_retorna_pdf(
        self,
        client: TestClient,
        admin_login: dict[str, str],
    ) -> None:
        """Com dados válidos, retorna PDF com headers corretos."""
        fake_pdf = b"%PDF-1.4\n1 0 obj\nendobj\n%%EOF"
        b64_content = base64.b64encode(fake_pdf).decode()
        mock_pw = self._make_mock_playwright(b64_content)

        with patch(ASYNC_PLAYWRIGHT, return_value=mock_pw):
            response = client.post(
                self.DOWNLOAD_ENDPOINT,
                headers=admin_login,
                json={"id": "123", "link_legislacao": self.VALID_URL},
            )

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert "attachment" in response.headers["content-disposition"]
        assert response.content.startswith(b"%PDF")
        # Verifica que o PDF mockado foi retornado intacto
        assert response.content == fake_pdf

    def test_download_conteudo_invalido_retorna_400(
        self,
        client: TestClient,
        admin_login: dict[str, str],
    ) -> None:
        """Conteúdo que não é PDF retorna 400 sem vazar detalhes."""
        b64_content = base64.b64encode(b"<html>error page</html>").decode()
        mock_pw = self._make_mock_playwright(b64_content)

        with patch(ASYNC_PLAYWRIGHT, return_value=mock_pw):
            response = client.post(
                self.DOWNLOAD_ENDPOINT,
                headers=admin_login,
                json={"id": "123", "link_legislacao": self.VALID_URL},
            )

        assert response.status_code == 400
        # Não deve vazar detalhes do conteúdo retornado
        assert "html" not in response.text.lower()
        assert "error" not in response.text.lower()

    def test_download_falha_playwright_retorna_erro_generico(
        self,
        client: TestClient,
        admin_login: dict[str, str],
    ) -> None:
        """Exceção do Playwright retorna erro 500 sem vazar detalhes."""
        mock_page = AsyncMock()
        mock_page.evaluate = AsyncMock(
            side_effect=Exception("Timeout ao acessar página")
        )

        mock_context = AsyncMock()
        mock_context.new_page = AsyncMock(return_value=mock_page)

        mock_browser = AsyncMock()
        mock_browser.new_context = AsyncMock(return_value=mock_context)

        mock_chromium = MagicMock()
        mock_chromium.launch = AsyncMock(return_value=mock_browser)

        mock_pw = AsyncMock()
        mock_pw.chromium = mock_chromium
        mock_pw.__aenter__ = AsyncMock(return_value=mock_pw)
        mock_pw.__aexit__ = AsyncMock(return_value=None)

        with patch(ASYNC_PLAYWRIGHT, return_value=mock_pw):
            response = client.post(
                self.DOWNLOAD_ENDPOINT,
                headers=admin_login,
                json={"id": "123", "link_legislacao": self.VALID_URL},
            )

        assert response.status_code == 500
        # Não deve vazar detalhes internos na resposta
        assert "Timeout" not in response.text
        assert "Falha ao processar o download" in response.text
