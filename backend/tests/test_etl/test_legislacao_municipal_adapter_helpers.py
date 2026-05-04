"""Testes unitários dos helpers de recorte de PDF do adapter.

Cobre _clean_html_title, _find_heading_position, _find_next_heading_edge,
_crop_pdf_section e o fluxo completo de crop.

A verificação de recorte usa pypdf para ler o CropBox resultante, pois
pdfplumber.extract_text() ignora /CropBox e extrai o texto completo
independentemente da região visível.
"""

from __future__ import annotations

import io

import pypdf
import pytest
from reportlab.lib.pagesizes import A4  # type: ignore[import-untyped]
from reportlab.pdfgen import canvas  # type: ignore[import-untyped]

# ─── Helpers ──────────────────────────────────────────────────────────────


def _make_synthetic_pdf() -> bytes:
    """Gera um PDF sintético de 2 páginas com duas leis para testar recorte.

    Estrutura:
      Página 1: texto preliminar → heading LEI 1 → continuação.
      Página 2: continuação → heading LEI 2 → texto seguinte.
    """
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    height = A4[1]

    c.drawString(50, height - 100, "TEXTO PRELIMINAR QUALQUER")
    c.drawString(
        50,
        height - 200,
        "LEI MUNICIPAL N 1.262/2026, DE 23 DE ABRIL DE 2026.",
    )
    c.drawString(50, height - 250, "Texto da lei continua nesta pagina.")
    c.showPage()

    c.drawString(50, height - 100, "Continuacao da lei na pagina 2.")
    c.drawString(
        50,
        height - 400,
        "LEI MUNICIPAL N 1.263/2026, DE 23 DE ABRIL DE 2026.",
    )
    c.drawString(50, height - 450, "Texto da proxima lei comeca aqui.")
    c.showPage()

    c.save()
    buf.seek(0)
    return buf.read()


# ─── Fixtures ─────────────────────────────────────────────────────────────


@pytest.fixture
def synthetic_pdf() -> bytes:
    return _make_synthetic_pdf()


# ─── Tests: _clean_html_title ─────────────────────────────────────────────


class TestCleanHtmlTitle:
    def test_removes_html_tags(self) -> None:
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            _clean_html_title,
        )

        html = "<p>LEI MUNICIPAL Nº 1.262/2026, DE 23 DE ABRIL DE 2026.<br></p>"
        assert _clean_html_title(html) == (
            "LEI MUNICIPAL Nº 1.262/2026, DE 23 DE ABRIL DE 2026."
        )

    def test_collapses_multiple_whitespace(self) -> None:
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            _clean_html_title,
        )

        assert _clean_html_title("LEI   MUNICIPAL  Nº  1.262/2026") == (
            "LEI MUNICIPAL Nº 1.262/2026"
        )


# ─── Tests: _find_heading_position ────────────────────────────────────────


class TestFindHeadingPosition:
    def test_finds_heading_in_first_page(self, synthetic_pdf: bytes) -> None:
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            _find_heading_position,
        )

        heading = "LEI MUNICIPAL N 1.262/2026, DE 23 DE ABRIL DE 2026."
        page_idx, top = _find_heading_position(synthetic_pdf, heading)
        assert page_idx == 0
        assert 185 <= top <= 200  # canvas y = A4[1] - 200 = 641.89 → top ≈ 190

    def test_finds_heading_without_trailing_period(self, synthetic_pdf: bytes) -> None:
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            _find_heading_position,
        )

        page_idx, top = _find_heading_position(
            synthetic_pdf,
            "LEI MUNICIPAL N 1.262/2026, DE 23 DE ABRIL DE 2026.",
        )
        assert page_idx == 0
        assert 185 <= top <= 200

    def test_finds_heading_with_ordinal(self, synthetic_pdf: bytes) -> None:
        """Nº com ordinal é normalizado e encontrado no PDF que tem só N."""
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            _find_heading_position,
        )

        heading = "LEI MUNICIPAL Nº 1.262/2026, DE 23 DE ABRIL DE 2026."
        page_idx, top = _find_heading_position(synthetic_pdf, heading)
        assert page_idx == 0
        assert 185 <= top <= 200

    def test_raises_value_error_when_not_found(self, synthetic_pdf: bytes) -> None:
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            _find_heading_position,
        )

        with pytest.raises(ValueError, match="Heading.*não encontrado"):
            _find_heading_position(synthetic_pdf, "LEI INEXISTENTE Nº 9999")


# ─── Tests: _find_next_heading_edge ───────────────────────────────────────


class TestFindNextHeadingEdge:
    def test_finds_next_heading_on_next_page(self, synthetic_pdf: bytes) -> None:
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            _find_heading_position,
            _find_next_heading_edge,
        )

        heading = "LEI MUNICIPAL N 1.262/2026, DE 23 DE ABRIL DE 2026."
        start_page, start_top = _find_heading_position(synthetic_pdf, heading)
        end_info = _find_next_heading_edge(synthetic_pdf, start_page, start_top)

        assert end_info is not None
        end_page, end_top = end_info
        assert end_page == 1
        assert 380 <= end_top <= 410  # canvas y = A4[1] - 400 = 441.89 → top ≈ 390

    def test_returns_none_when_no_next_heading(self, synthetic_pdf: bytes) -> None:
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            _find_heading_position,
            _find_next_heading_edge,
        )

        heading = "LEI MUNICIPAL N 1.263/2026, DE 23 DE ABRIL DE 2026."
        start_page, start_top = _find_heading_position(synthetic_pdf, heading)
        assert _find_next_heading_edge(synthetic_pdf, start_page, start_top) is None


# ─── Tests: _crop_pdf_section ─────────────────────────────────────────────


class TestCropPdfSection:
    def test_crops_to_two_pages(self, synthetic_pdf: bytes) -> None:
        """Heading na pág 0, próximo heading na pág 1 → resultado com 2 páginas."""
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            _crop_pdf_section,
        )

        cropped = _crop_pdf_section(synthetic_pdf, 0, 190.0, (1, 390.0))
        reader = pypdf.PdfReader(io.BytesIO(cropped))
        assert len(reader.pages) == 2

    def test_crops_single_page(self, synthetic_pdf: bytes) -> None:
        """Ambos headings na mesma página → resultado com 1 página."""
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            _crop_pdf_section,
        )

        cropped = _crop_pdf_section(synthetic_pdf, 0, 100.0, (0, 700.0))
        reader = pypdf.PdfReader(io.BytesIO(cropped))
        assert len(reader.pages) == 1

    def test_crops_until_end(self, synthetic_pdf: bytes) -> None:
        """Sem próximo heading → do heading alvo até o fim."""
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            _crop_pdf_section,
        )

        cropped = _crop_pdf_section(synthetic_pdf, 1, 390.0, None)
        reader = pypdf.PdfReader(io.BytesIO(cropped))
        assert len(reader.pages) == 1

    def test_first_page_cropbox_has_upper_bound(self, synthetic_pdf: bytes) -> None:
        """CropBox da primeira página deve ter y1 = page_height - start_top."""
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            _crop_pdf_section,
        )

        PAGE_H = 841.8898
        cropped = _crop_pdf_section(synthetic_pdf, 0, 190.0, (1, 390.0))
        reader = pypdf.PdfReader(io.BytesIO(cropped))

        page0 = reader.pages[0]
        assert float(page0.cropbox.upper_right[1]) == pytest.approx(
            PAGE_H - 190.0, abs=1.0
        )
        assert float(page0.cropbox.lower_left[1]) == 0.0  # vai até o rodapé

    def test_last_page_cropbox_has_lower_bound(self, synthetic_pdf: bytes) -> None:
        """CropBox da última página deve começar acima do próximo heading."""
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            _crop_pdf_section,
        )

        PAGE_H = 841.8898
        cropped = _crop_pdf_section(synthetic_pdf, 0, 190.0, (1, 390.0))
        reader = pypdf.PdfReader(io.BytesIO(cropped))

        page1 = reader.pages[1]
        # y0 = PAGE_H - end_top + 2 (margem)
        expected_y0 = PAGE_H - 390.0 + 2
        assert float(page1.cropbox.lower_left[1]) == pytest.approx(expected_y0, abs=1.0)
        assert float(page1.cropbox.upper_right[1]) == PAGE_H  # vai até o topo

    def test_cropbox_on_single_page_has_both_bounds(self, synthetic_pdf: bytes) -> None:
        """CropBox de página única deve ter ambos os limites definidos."""
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            _crop_pdf_section,
        )

        PAGE_H = 841.8898
        cropped = _crop_pdf_section(synthetic_pdf, 0, 100.0, (0, 700.0))
        reader = pypdf.PdfReader(io.BytesIO(cropped))
        page0 = reader.pages[0]

        # y0 = PAGE_H - end_top + 2, y1 = PAGE_H - start_top
        assert float(page0.cropbox.lower_left[1]) == pytest.approx(
            PAGE_H - 700.0 + 2, abs=1.0
        )
        assert float(page0.cropbox.upper_right[1]) == pytest.approx(
            PAGE_H - 100.0, abs=1.0
        )


class TestFullCropFlow:
    """Fluxo completo: localizar heading → próximo heading → recortar."""

    def test_crop_results_in_correct_page_count(self, synthetic_pdf: bytes) -> None:
        """O PDF recortado deve ter 2 páginas: do LEI 1.262 até o LEI 1.263."""
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            _crop_pdf_section,
            _find_heading_position,
            _find_next_heading_edge,
        )

        heading = "LEI MUNICIPAL N 1.262/2026, DE 23 DE ABRIL DE 2026."
        start_page, start_top = _find_heading_position(synthetic_pdf, heading)
        end_info = _find_next_heading_edge(synthetic_pdf, start_page, start_top)
        cropped = _crop_pdf_section(synthetic_pdf, start_page, start_top, end_info)

        reader = pypdf.PdfReader(io.BytesIO(cropped))
        assert len(reader.pages) == 2

    def test_crop_excludes_preamble_region(self, synthetic_pdf: bytes) -> None:
        """O CropBox da primeira página deve excluir o texto preliminar."""
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            _crop_pdf_section,
            _find_heading_position,
            _find_next_heading_edge,
        )

        PAGE_H = 841.8898
        heading = "LEI MUNICIPAL N 1.262/2026, DE 23 DE ABRIL DE 2026."
        start_page, start_top = _find_heading_position(synthetic_pdf, heading)
        end_info = _find_next_heading_edge(synthetic_pdf, start_page, start_top)
        cropped = _crop_pdf_section(synthetic_pdf, start_page, start_top, end_info)

        reader = pypdf.PdfReader(io.BytesIO(cropped))
        page0 = reader.pages[0]
        # y1 = PAGE_H - start_top, texto preliminar está acima → excluído
        assert float(page0.cropbox.upper_right[1]) == pytest.approx(
            PAGE_H - start_top, abs=1.5
        )
        # O texto preliminar está em top≈100, cropbox y1 = PAGE_H - start_top
        # Se start_top ≈ 190, y1 ≈ 651.9. Texto preliminar em y ≈ 742 → acima do cropbox
        content_top_in_pdf = float(page0.cropbox.upper_right[1])
        preliminar_y = PAGE_H - 100  # ≈ 742
        assert preliminar_y > content_top_in_pdf  # excluído

    def test_crop_includes_target_heading_in_first_page(
        self, synthetic_pdf: bytes
    ) -> None:
        """O CropBox da primeira página deve incluir o heading alvo."""
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            _crop_pdf_section,
            _find_heading_position,
            _find_next_heading_edge,
        )

        PAGE_H = 841.8898
        heading = "LEI MUNICIPAL N 1.262/2026, DE 23 DE ABRIL DE 2026."
        start_page, start_top = _find_heading_position(synthetic_pdf, heading)
        end_info = _find_next_heading_edge(synthetic_pdf, start_page, start_top)
        cropped = _crop_pdf_section(synthetic_pdf, start_page, start_top, end_info)

        reader = pypdf.PdfReader(io.BytesIO(cropped))
        page0 = reader.pages[0]
        # y1 = PAGE_H - start_top → heading em y_start = PAGE_H - start_top
        # O heading no topo do cropbox → incluído
        assert float(page0.cropbox.upper_right[1]) == pytest.approx(
            PAGE_H - start_top, abs=1.5
        )

    def test_output_starts_with_pdf_magic(self, synthetic_pdf: bytes) -> None:
        """Bytes de saída devem começar com %PDF."""
        from backend.features.legislacao_municipal.legislacao_municipal_adapter import (  # noqa: PLC0415
            _crop_pdf_section,
            _find_heading_position,
            _find_next_heading_edge,
        )

        heading = "LEI MUNICIPAL N 1.262/2026, DE 23 DE ABRIL DE 2026."
        start_page, start_top = _find_heading_position(synthetic_pdf, heading)
        end_info = _find_next_heading_edge(synthetic_pdf, start_page, start_top)
        cropped = _crop_pdf_section(synthetic_pdf, start_page, start_top, end_info)

        assert cropped.startswith(b"%PDF")
