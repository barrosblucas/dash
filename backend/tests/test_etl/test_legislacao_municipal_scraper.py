"""Testes unitários do scraper de legislação municipal."""

from __future__ import annotations

import csv
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock

import pytest

from backend.scripts.scrape_diario_oficial_models import (
    LegislacaoItem,
    LegislacaoScrapeResult,
)
from backend.scripts.scrape_diario_oficial_parsers import (
    extract_materia_download_url,
    parse_legislacao_item,
)
from backend.scripts.scrape_legislacao_municipal import save_catalog


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


# ─── extract_materia_download_url ─────────────────────────────────────────────


class TestExtractMateriaDownloadUrl:
    def test_normal(self) -> None:
        url, h = extract_materia_download_url(_action_html("878370"))
        assert "baixar-materia/878370/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6" in url
        assert h == "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"

    def test_different_ids(self) -> None:
        url, h = extract_materia_download_url(_action_html("999999", "fedcba98"))
        assert "999999" in url
        assert h == "fedcba98"

    def test_empty_html(self) -> None:
        assert extract_materia_download_url("") == ("", "")

    def test_no_action(self) -> None:
        assert extract_materia_download_url("<form><button>X</button></form>") == (
            "",
            "",
        )

    def test_wrong_domain(self) -> None:
        assert extract_materia_download_url(
            '<form action="https://evil.com/baixar"></form>'
        ) == ("", "")

    def test_extra_whitespace(self) -> None:
        html = '<form  method="post"  action="https://www.diariooficialms.com.br/baixar-materia/999/abc123">'
        url, h = extract_materia_download_url(html)
        assert h == "abc123"

    def test_hash_only_hex(self) -> None:
        _, h = extract_materia_download_url(_action_html("1", "01ab89ef"))
        assert h == "01ab89ef"
        assert all(c in "0123456789abcdef" for c in h)


# ─── parse_legislacao_item ────────────────────────────────────────────────────


class TestParseLegislacaoItem:
    def test_valid_lei_municipal(self) -> None:
        item = parse_legislacao_item(_raw_item())
        assert item is not None
        assert item.numero_lei == "1.263/2026"
        assert item.ano_lei == "2026"
        assert item.numero_materia == "2904"

    def test_lei_complementar(self) -> None:
        item = parse_legislacao_item(_raw_item(titulo="LEI COMPLEMENTAR N° 1231/2025"))
        assert item is not None
        assert item.numero_lei == "1231/2025"

    def test_lei_ordinaria(self) -> None:
        item = parse_legislacao_item(_raw_item(titulo="LEI ORDINÁRIA Nº 456/2024"))
        assert item is not None
        assert item.numero_lei == "456/2024"

    def test_ano_da_data_quando_numero_sem_ano(self) -> None:
        item = parse_legislacao_item(
            _raw_item(titulo="LEI MUNICIPAL Nº 1.234", data="15/03/2023")
        )
        assert item is not None
        assert item.numero_lei == "1.234"
        assert item.ano_lei == "2023"

    def test_non_lei_returns_none(self) -> None:
        assert parse_legislacao_item(_raw_item(titulo="AVISO DE LICITAÇÃO")) is None

    def test_decreto_returns_none(self) -> None:
        assert (
            parse_legislacao_item(_raw_item(titulo="DECRETO MUNICIPAL Nº 100/2024"))
            is None
        )

    def test_anexo_habilitado_true(self) -> None:
        item = parse_legislacao_item(_raw_item(anexo=True))
        assert item is not None and item.anexo_habilitado is True

    def test_anexo_habilitado_false(self) -> None:
        item = parse_legislacao_item(_raw_item(anexo=False))
        assert item is not None and item.anexo_habilitado is False

    def test_cidade_dict_vazio(self) -> None:
        raw = _raw_item()
        raw["cidade"] = {}
        assert parse_legislacao_item(raw) is not None

    def test_cidade_none(self) -> None:
        raw = _raw_item()
        raw["cidade"] = None
        item = parse_legislacao_item(raw)
        assert item is not None and item.anexo_habilitado is False

    def test_empty_dict_returns_none(self) -> None:
        assert parse_legislacao_item({}) is None

    def test_sem_action_baixar(self) -> None:
        item = parse_legislacao_item(_raw_item(action=""))
        assert item is not None
        assert item.link_legislacao == ""

    def test_titulo_com_tags_html(self) -> None:
        raw = _raw_item(
            titulo="LEI MUNICIPAL Nº 123/2024.<br><small><b>Extra</b></small>"
        )
        item = parse_legislacao_item(raw)
        assert item is not None and "<br>" not in item.titulo

    def test_link_e_hash_extraidos(self) -> None:
        item = parse_legislacao_item(
            _raw_item(action=_action_html("555", "deadbeef01"))
        )
        assert item is not None and "deadbeef01" in item.link_legislacao
        assert item.download_hash == "deadbeef01"


# ─── Saída CSV ────────────────────────────────────────────────────────────────


class TestSaveCatalog:
    def test_single_item(self, tmp_path: Path) -> None:
        save_catalog([_leg_item()], tmp_path)
        rows = list(
            csv.reader(open(tmp_path / "catalogo.csv", newline="", encoding="utf-8"))
        )
        assert len(rows) == 2
        assert rows[1][0] == "878370"

    def test_multiple_items(self, tmp_path: Path) -> None:
        items = [_leg_item(id=str(i), numero_lei=f"{i}/2024") for i in range(1, 4)]
        save_catalog(items, tmp_path)
        rows = list(
            csv.reader(open(tmp_path / "catalogo.csv", newline="", encoding="utf-8"))
        )
        assert len(rows) == 4

    def test_empty_list(self, tmp_path: Path) -> None:
        save_catalog([], tmp_path)
        rows = list(
            csv.reader(open(tmp_path / "catalogo.csv", newline="", encoding="utf-8"))
        )
        assert len(rows) == 1

    def test_anexo_flag(self, tmp_path: Path) -> None:
        save_catalog(
            [_leg_item(id="1", anexo_habilitado=True), _leg_item(id="2")], tmp_path
        )
        rows = list(
            csv.reader(open(tmp_path / "catalogo.csv", newline="", encoding="utf-8"))
        )
        assert rows[1][8] == "1"
        assert rows[2][8] == "0"

    def test_anexos_locais_semicolon(self, tmp_path: Path) -> None:
        save_catalog([_leg_item(anexos_locais=["a/p1.pdf", "a/p2.pdf"])], tmp_path)
        rows = list(
            csv.reader(open(tmp_path / "catalogo.csv", newline="", encoding="utf-8"))
        )
        assert rows[1][10] == "a/p1.pdf;a/p2.pdf"

    def test_pdf_local_path(self, tmp_path: Path) -> None:
        save_catalog([_leg_item(pdf_legislacao_local="pdfs/materia_1.pdf")], tmp_path)
        rows = list(
            csv.reader(open(tmp_path / "catalogo.csv", newline="", encoding="utf-8"))
        )
        assert rows[1][9] == "pdfs/materia_1.pdf"

    def test_header_columns(self, tmp_path: Path) -> None:
        save_catalog([], tmp_path)
        rows = list(
            csv.reader(open(tmp_path / "catalogo.csv", newline="", encoding="utf-8"))
        )
        expected = [
            "id",
            "numero_lei",
            "ano",
            "titulo",
            "data_publicacao",
            "numero_materia",
            "link_legislacao",
            "link_diario_oficial",
            "anexo_habilitado",
            "pdf_legislacao_local",
            "anexos_locais",
        ]
        assert rows[0] == expected


# ─── Dry-Run ──────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestDryRunMode:
    async def _mock_client(
        self, monkeypatch: pytest.MonkeyPatch, raw_items: list[dict]
    ) -> None:
        fake = AsyncMock()
        fake.__aenter__.return_value = fake
        fake.__aexit__.return_value = None
        fake.fetch_all_pages.return_value = raw_items
        monkeypatch.setattr(
            "backend.scripts.scrape_legislacao_municipal.DiarioOficialClient",
            lambda *a, **kw: fake,
        )

    async def test_dry_run_returns_parsed_items(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        await self._mock_client(
            monkeypatch,
            [
                _raw_item(
                    item_id="1",
                    titulo="LEI MUNICIPAL Nº 100/2024",
                    num_mat="100",
                    action=_action_html("1", "h001"),
                ),
                _raw_item(
                    item_id="2",
                    titulo="LEI MUNICIPAL Nº 200/2024",
                    num_mat="200",
                    action=_action_html("2", "h002"),
                ),
            ],
        )
        from backend.scripts.scrape_legislacao_municipal import run_scrape

        result = await run_scrape(dry_run=True)
        assert result.total_encontradas == 2
        assert len(result.legislacoes) == 2
        assert result.baixadas == 0
        assert result.erros_download == 0

    async def test_dry_run_no_results(self, monkeypatch: pytest.MonkeyPatch) -> None:
        await self._mock_client(monkeypatch, [])
        from backend.scripts.scrape_legislacao_municipal import run_scrape

        result = await run_scrape(dry_run=True)
        assert result.total_encontradas == 0

    async def test_dry_run_does_not_call_playwright(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        await self._mock_client(
            monkeypatch,
            [
                _raw_item(titulo="LEI Nº 1/2024"),
            ],
        )
        from backend.scripts.scrape_legislacao_municipal import run_scrape

        result = await run_scrape(dry_run=True)
        assert result.total_encontradas == 1


# ─── Casos de borda ───────────────────────────────────────────────────────────


class TestParsingEdgeCases:
    def test_ano_sem_barra_no_titulo(self) -> None:
        item = parse_legislacao_item(
            _raw_item(
                titulo="LEI MUNICIPAL Nº 1.234 DE 15 DE MARÇO DE 2023",
                data="20/03/2023",
            )
        )
        assert item is not None and item.ano_lei == "2023"

    def test_lei_sem_N_mas_com_numero(self) -> None:
        assert (
            parse_legislacao_item(_raw_item(titulo="LEI MUNICIPAL 567/2022"))
            is not None
        )

    def test_espacos_extras(self) -> None:
        item = parse_legislacao_item(
            _raw_item(titulo="  LEI  MUNICIPAL  Nº  999/2021  ")
        )
        assert item is not None and item.numero_lei == "999/2021"

    def test_link_preservado_apos_parse(self) -> None:
        html = _action_html("555", "aaaa0000bbbb1111")
        item = parse_legislacao_item(_raw_item(action=html))
        assert item is not None
        assert "aaaa0000bbbb1111" in item.link_legislacao

    def test_legislacao_scrape_result_defaults(self) -> None:
        r = LegislacaoScrapeResult()
        assert r.total_encontradas == 0 and r.legislacoes == []
        assert r.baixadas == 0 and r.erros_download == 0
        assert r.anexos_baixados == 0 and r.anexos_erros == 0

    def test_legislacao_item_defaults(self) -> None:
        item = LegislacaoItem(
            id="1", titulo="Test", data_circulacao="01/01/2024", numero_materia="1"
        )
        assert item.link_legislacao == ""
        assert item.anexo_habilitado is False
        assert item.anexos == []
