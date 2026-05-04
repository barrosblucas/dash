"""Testes de integração do adapter com mock do DiarioOficialClient.

Testa o fluxo completo de download com recorte, fallback quando metadados
estão ausentes, e propagação de erros HTTP.
"""

from __future__ import annotations

import io
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pypdf
import pytest
from reportlab.lib.pagesizes import A4  # type: ignore[import-untyped]
from reportlab.pdfgen import canvas  # type: ignore[import-untyped]

ADAPTER = "backend.features.legislacao_municipal.legislacao_municipal_adapter"

VALID_URL = "https://www.diariooficialms.com.br/baixar-materia/123/abc"
VALID_URL_2 = "https://www.diariooficialms.com.br/baixar-materia/456/def"
INVALID_URL = "https://evil.com/baixar-materia/123/abc"
DIRECT_PDF_URL = (
    "https://diario-oficial-prd.nyc3.digitaloceanspaces.com/files/media/143794/"
    "2904---24-04-2026.pdf"
)
FAKE_PDF = b"%PDF-1.4\n1 0 obj\nendobj\n%%EOF"


def _make_synthetic_pdf() -> bytes:
    """PDF sintético de 2 páginas com duas leis para testar recorte."""
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    height = A4[1]
    c.drawString(50, height - 100, "TEXTO PRELIMINAR QUALQUER")
    c.drawString(
        50, height - 200, "LEI MUNICIPAL N 1.262/2026, DE 23 DE ABRIL DE 2026."
    )
    c.drawString(50, height - 250, "Texto da lei continua nesta pagina.")
    c.showPage()
    c.drawString(50, height - 100, "Continuacao da lei na pagina 2.")
    c.drawString(
        50, height - 400, "LEI MUNICIPAL N 1.263/2026, DE 23 DE ABRIL DE 2026."
    )
    c.drawString(50, height - 450, "Texto da proxima lei comeca aqui.")
    c.showPage()
    c.save()
    buf.seek(0)
    return buf.read()


@pytest.fixture
def mock_diario_client(monkeypatch: pytest.MonkeyPatch) -> tuple[AsyncMock, Mock]:
    """Monkeypatch DiarioOficialClient com mocks assíncronos.

    Returns:
        Tupla (client mock, response mock) para configurar busca/download.
    """
    response_mock = Mock()
    response_mock.content = FAKE_PDF
    response_mock.raise_for_status = Mock()

    client_mock = AsyncMock()
    client_mock.fetch_pdf_links_for_date.return_value = {"2904": DIRECT_PDF_URL}
    client_mock.fetch_all_pages.return_value = [
        {
            "id": "123",
            "titulo": "<p>LEI MUNICIPAL Nº 1.262/2026, DE 23 DE ABRIL DE 2026.</p>",
            "data_de_circulacao": "24/04/2026",
            "numero_da_materia": "2904",
            "numero_lei": "",
            "ano_lei": "",
            "action-baixar": (
                '<form method="post" target="_blank" action="'
                'https://www.diariooficialms.com.br/baixar-materia/123/abc">'
                '<button class="action-baixar-materia" type="button">Baixar</button>'
                "</form>"
            ),
        },
    ]
    client_mock.client = SimpleNamespace(get=AsyncMock(return_value=response_mock))

    cm_mock = AsyncMock()
    cm_mock.__aenter__.return_value = client_mock
    cm_mock.__aexit__.return_value = None

    monkeypatch.setattr(
        f"{ADAPTER}.DiarioOficialClient", lambda *args, **kwargs: cm_mock
    )
    return client_mock, response_mock


class TestDownloadLegislacaoPdf:
    """Testes do fluxo completo com mock do DiarioOficialClient."""

    @pytest.mark.asyncio
    async def test_success(
        self,
        mock_diario_client: tuple[AsyncMock, Mock],
    ) -> None:
        """Fluxo completo: API + PDF real → recorte aplicado."""
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            download_legislacao_pdf,
        )

        client_mock, response_mock = mock_diario_client
        response_mock.content = _make_synthetic_pdf()

        pdf_bytes, filename = await download_legislacao_pdf(
            link_legislacao=VALID_URL,
            data_publicacao="24/04/2026",
            numero_materia="2904",
        )

        assert pdf_bytes.startswith(b"%PDF")
        assert filename == "legislacao_123.pdf"
        client_mock.fetch_all_pages.assert_awaited_once()
        client_mock.fetch_pdf_links_for_date.assert_awaited_once_with("24/04/2026")
        client_mock.client.get.assert_awaited_once_with(DIRECT_PDF_URL)
        response_mock.raise_for_status.assert_called_once_with()

    @pytest.mark.asyncio
    async def test_success_different_id(
        self,
        mock_diario_client: tuple[AsyncMock, Mock],
    ) -> None:
        """ID diferente no link_legislacao → filename diferente."""
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            download_legislacao_pdf,
        )

        client_mock, response_mock = mock_diario_client
        response_mock.content = _make_synthetic_pdf()

        _, filename = await download_legislacao_pdf(
            link_legislacao=VALID_URL_2,
            data_publicacao="24/04/2026",
            numero_materia="2904",
        )

        assert filename == "legislacao_456.pdf"

    @pytest.mark.asyncio
    async def test_direct_pdf_not_found_raises_value_error(
        self,
        mock_diario_client: tuple[AsyncMock, Mock],
    ) -> None:
        """Sem link direto para a matéria na edição → ValueError."""
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            download_legislacao_pdf,
        )

        client_mock, _ = mock_diario_client
        client_mock.fetch_pdf_links_for_date.return_value = {}

        with pytest.raises(
            ValueError, match="Não foi possível localizar o PDF da matéria"
        ):
            await download_legislacao_pdf(
                link_legislacao=VALID_URL,
                data_publicacao="24/04/2026",
                numero_materia="2904",
            )

        client_mock.client.get.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_invalid_url_raises_value_error(self) -> None:
        """URL fora do domínio permitido → ValueError antes de resolver PDF."""
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            download_legislacao_pdf,
        )

        with pytest.raises(ValueError, match="URL de download inválida"):
            await download_legislacao_pdf(
                link_legislacao=INVALID_URL,
                data_publicacao="24/04/2026",
                numero_materia="2904",
            )

    @pytest.mark.asyncio
    async def test_invalid_pdf_content_raises_value_error(
        self,
        mock_diario_client: tuple[AsyncMock, Mock],
    ) -> None:
        """Conteúdo baixado que não é PDF → ValueError."""
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            download_legislacao_pdf,
        )

        _, response_mock = mock_diario_client
        response_mock.content = b"<html>not a pdf</html>"

        with pytest.raises(ValueError, match="não é um PDF válido"):
            await download_legislacao_pdf(
                link_legislacao=VALID_URL,
                data_publicacao="24/04/2026",
                numero_materia="2904",
            )

    @pytest.mark.asyncio
    async def test_http_error_is_propagated(
        self,
        mock_diario_client: tuple[AsyncMock, Mock],
    ) -> None:
        """Erro HTTP no download direto é propagado para o handler mapear."""
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            download_legislacao_pdf,
        )

        _, response_mock = mock_diario_client
        response_mock.raise_for_status.side_effect = RuntimeError("http 403")

        with pytest.raises(RuntimeError, match="http 403"):
            await download_legislacao_pdf(
                link_legislacao=VALID_URL,
                data_publicacao="24/04/2026",
                numero_materia="2904",
            )

    @pytest.mark.asyncio
    async def test_heading_not_found_raises_value_error(
        self,
        mock_diario_client: tuple[AsyncMock, Mock],
    ) -> None:
        """Metadado ausente na API → falha explícita em vez de baixar edição."""
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            download_legislacao_pdf,
        )

        client_mock, response_mock = mock_diario_client
        client_mock.fetch_all_pages.return_value = []
        response_mock.content = FAKE_PDF

        with pytest.raises(ValueError, match="Não foi possível identificar a legislação"):
            await download_legislacao_pdf(
                link_legislacao=VALID_URL,
                data_publicacao="24/04/2026",
                numero_materia="2904",
            )

    @pytest.mark.asyncio
    async def test_cropbox_is_set_on_result(
        self,
        mock_diario_client: tuple[AsyncMock, Mock],
    ) -> None:
        """Quando o recorte é aplicado, o CropBox deve estar definido."""
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            download_legislacao_pdf,
        )

        _, response_mock = mock_diario_client
        response_mock.content = _make_synthetic_pdf()

        pdf_bytes, _ = await download_legislacao_pdf(
            link_legislacao=VALID_URL,
            data_publicacao="24/04/2026",
            numero_materia="2904",
        )

        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        assert len(reader.pages) == 2  # 2 páginas recortadas (uma para cada heading)

        # CropBox da página 0 deve cortar o texto preliminar
        page0 = reader.pages[0]
        page_height = float(page0.mediabox.top - page0.mediabox.bottom)
        crop_y1 = float(page0.cropbox.upper_right[1])
        # start_top ≈ 190 → y1 ≈ 652
        assert crop_y1 < page_height  # diferente da página inteira
        assert float(page0.cropbox.lower_left[1]) == 0.0  # vai até o rodapé

        # CropBox da página 1 deve cortar o próximo heading
        page1 = reader.pages[1]
        crop_y0 = float(page1.cropbox.lower_left[1])
        assert crop_y0 > 0.0  # corta parte inferior
        assert float(page1.cropbox.upper_right[1]) == page_height  # vai até o topo
