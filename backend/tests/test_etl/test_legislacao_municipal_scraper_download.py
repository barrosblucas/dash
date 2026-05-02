"""Testes do fluxo de download com Playwright para o scraper de legislação municipal."""

from __future__ import annotations

import base64
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from backend.scripts.scrape_diario_oficial_models import (
    LegislacaoItem,
    LegislacaoScrapeResult,
)
from backend.scripts.scrape_legislacao_municipal import (
    _download_all_materias,
    _download_single_materia,
    _pdf_filename,
)

# ─── Helpers ───────────────────────────────────────────────────────────────────


def _action_html(
    item_id: str = "878370", hash_val: str = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
) -> str:
    return (
        f'<form method="post" target="_blank" '
        f'action="https://www.diariooficialms.com.br/baixar-materia/{item_id}/{hash_val}">'
        f'<button class="action-baixar-materia" type="button">Baixar</button></form>'
    )


_NO_ACTION = object()


def _raw_item(
    item_id: str = "878370",
    titulo: str = "LEI MUNICIPAL Nº 1.263/2026, DE 23 DE ABRIL DE 2026.",
    data: str = "24/04/2026",
    num_mat: str = "2904",
    action: object = _NO_ACTION,
    anexo: bool = False,
) -> dict[str, Any]:
    action_val = _action_html(item_id) if action is _NO_ACTION else str(action)
    return {
        "id": item_id,
        "titulo": titulo,
        "data_de_circulacao": data,
        "numero_da_materia": num_mat,
        "nome_da_cidade_ou_do_consorcio": "BANDEIRANTES",
        "cidade": {"id": "71", "nome": "BANDEIRANTES", "anexo_habilitado": anexo},
        "action-baixar": action_val,
    }


def _leg_item(
    *,
    anexo_habilitado: bool = False,
    anexos_locais: list[str] | None = None,
    pdf_legislacao_local: str = "",
    **kw: Any,
) -> LegislacaoItem:
    kwargs: dict[str, Any] = {
        "id": "878370",
        "titulo": "LEI MUNICIPAL Nº 1.263/2026",
        "data_circulacao": "24/04/2026",
        "numero_materia": "2904",
        "numero_lei": "1.263/2026",
        "ano_lei": "2026",
        "link_legislacao": "https://diariooficialms.com.br/baixar-materia/878370/h",
        "anexo_habilitado": anexo_habilitado,
        "anexos_locais": anexos_locais or [],
        "pdf_legislacao_local": pdf_legislacao_local,
    }
    kwargs.update(kw)
    return LegislacaoItem(**kwargs)  # type: ignore[arg-type]


# ─── Mock Playwright ───────────────────────────────────────────────────────────


async def _setup_playwright_mock(monkeypatch: pytest.MonkeyPatch) -> AsyncMock:
    """Monkeypatch ``playwright.async_api.async_playwright`` para evitar browser real.

    Returns:
        O page mock para configuração adicional, se necessário.
    """
    page_mock = AsyncMock()
    page_mock.goto = AsyncMock(side_effect=Exception("Mock: no browser"))
    page_mock.set_default_timeout = MagicMock()

    context_mock = AsyncMock()
    context_mock.new_page.return_value = page_mock

    browser_mock = AsyncMock()
    browser_mock.new_context.return_value = context_mock
    browser_mock.close = AsyncMock()

    pw = AsyncMock()
    pw.chromium.launch.return_value = browser_mock

    apw = AsyncMock()
    apw.__aenter__.return_value = pw
    apw.__aexit__ = AsyncMock(return_value=None)

    monkeypatch.setattr("playwright.async_api.async_playwright", lambda: apw)
    return page_mock


# ─── Download Flow ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestDownloadFlow:
    """Testes para o fluxo de download com Playwright."""

    async def test_download_single_materia_success(self, tmp_path: Path) -> None:
        """_download_single_materia retorna True e cria arquivo com bytes corretos."""
        page = AsyncMock()
        fake_pdf = b"%PDF-1.4 fake"
        page.evaluate = AsyncMock(return_value=base64.b64encode(fake_pdf).decode())

        output_path = tmp_path / "test.pdf"
        result = await _download_single_materia(
            page, "https://example.com/dl", output_path, "site_key_123"
        )

        assert result is True
        assert output_path.read_bytes() == fake_pdf

    async def test_download_single_materia_failure(self, tmp_path: Path) -> None:
        """_download_single_materia retorna False quando page.evaluate() levanta exceção."""
        page = AsyncMock()
        page.evaluate = AsyncMock(side_effect=Exception("network error"))

        output_path = tmp_path / "test.pdf"
        result = await _download_single_materia(
            page, "https://example.com/dl", output_path, "site_key_123"
        )

        assert result is False
        assert not output_path.exists()

    async def test_download_all_materias_skip_existing_file(
        self, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
    ) -> None:
        """_download_all_materias pula itens cujo PDF já existe no diretório."""
        await _setup_playwright_mock(monkeypatch)

        item = _leg_item()
        filename = _pdf_filename(item.numero_materia, item.data_circulacao)
        (tmp_path / filename).write_text("existing content")

        baixadas, erros, puladas = await _download_all_materias(
            [item], tmp_path, dry_run=False
        )
        assert (baixadas, erros, puladas) == (0, 0, 1)

    async def test_download_all_materias_skip_item_without_link(
        self, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
    ) -> None:
        """_download_all_materias pula itens com link_legislacao vazio."""
        await _setup_playwright_mock(monkeypatch)

        item = _leg_item(link_legislacao="")

        baixadas, erros, puladas = await _download_all_materias(
            [item], tmp_path, dry_run=False
        )
        assert puladas == 1

    async def test_download_all_materias_dry_run(self, tmp_path: Path) -> None:
        """_download_all_materias em dry_run retorna (0, 0, 0)."""
        items = [_leg_item()]
        result = await _download_all_materias(items, tmp_path, dry_run=True)
        assert result == (0, 0, 0)

    async def test_download_all_materias_playwright_not_installed(
        self, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
    ) -> None:
        """_download_all_materias retorna (0, N, 0) quando async_playwright não é importável."""
        monkeypatch.delattr("playwright.async_api.async_playwright")

        items = [_leg_item(), _leg_item(id="2", numero_lei="2/2024")]
        result = await _download_all_materias(items, tmp_path, dry_run=False)
        assert result == (0, len(items), 0)

    async def test_download_all_materias_retry_then_success(
        self, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
    ) -> None:
        """_download_all_materias tenta novamente após falha e consegue na 2ª tentativa."""
        await _setup_playwright_mock(monkeypatch)

        mock_download = AsyncMock(side_effect=[False, True])
        monkeypatch.setattr(
            "backend.scripts.scrape_legislacao_municipal._download_single_materia",
            mock_download,
        )

        item = _leg_item()
        baixadas, erros, puladas = await _download_all_materias(
            [item], tmp_path, dry_run=False
        )
        assert baixadas == 1
        assert erros == 0

    async def test_download_all_materias_retry_all_fail(
        self, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
    ) -> None:
        """_download_all_materias registra erro quando todas as 3 tentativas falham."""
        await _setup_playwright_mock(monkeypatch)

        mock_download = AsyncMock(return_value=False)
        monkeypatch.setattr(
            "backend.scripts.scrape_legislacao_municipal._download_single_materia",
            mock_download,
        )

        item = _leg_item()
        baixadas, erros, puladas = await _download_all_materias(
            [item], tmp_path, dry_run=False
        )
        assert erros == 1
        assert baixadas == 0

    async def test_run_scrape_non_dry_run_with_mocked_download(
        self, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
    ) -> None:
        """run_scrape em modo normal propaga resultado do download mockado."""
        fake = AsyncMock()
        fake.__aenter__.return_value = fake
        fake.__aexit__.return_value = None
        fake.fetch_all_pages.return_value = [
            _raw_item(titulo="LEI MUNICIPAL Nº 100/2024"),
        ]
        monkeypatch.setattr(
            "backend.scripts.scrape_legislacao_municipal.DiarioOficialClient",
            lambda *a, **kw: fake,
        )
        monkeypatch.setattr(
            "backend.scripts.scrape_legislacao_municipal._download_all_materias",
            AsyncMock(return_value=(5, 0, 0)),
        )
        monkeypatch.setattr(
            "backend.scripts.scrape_legislacao_municipal.LEG_OUTPUT_DIR",
            tmp_path,
        )
        monkeypatch.setattr(
            "backend.scripts.scrape_legislacao_municipal.LEG_PDFS_DIR",
            tmp_path / "pdfs",
        )

        from backend.scripts.scrape_legislacao_municipal import run_scrape

        result = await run_scrape(dry_run=False)
        assert result.baixadas == 5


# ─── CLI main ─────────────────────────────────────────────────────────────────


class TestCliMain:
    """Testes síncronos para a CLI main()."""

    def test_main_exit_code_on_errors(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """main() chama sys.exit(1) quando erros_download > 0."""
        result = LegislacaoScrapeResult()
        result.erros_download = 1

        monkeypatch.setattr(
            "backend.scripts.scrape_legislacao_municipal.run_scrape",
            AsyncMock(return_value=result),
        )
        monkeypatch.setattr("sys.argv", ["prog", "--dry-run"])

        from backend.scripts.scrape_legislacao_municipal import main

        with pytest.raises(SystemExit) as exc_info:
            main()
        assert exc_info.value.code == 1
