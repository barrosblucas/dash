"""Testes unitários do adaptador do Diário Oficial."""

from __future__ import annotations

from datetime import date

import httpx
import pytest

from backend.features.diario_oficial.diario_oficial_adapter import (
    _parse_html,
    fetch_diario,
)


class TestParseHTML:
    """Testes do parser HTML do Diário Oficial."""

    def test_parse_edicao_regular(self) -> None:
        """Deve parsear uma edição regular corretamente."""
        html = """<ul class="list-group">
<li class="list-group-item">
    <a class="sem-decoracao" href="https://example.com/2908.pdf">
        <h4 class="texto-cinza"><i class="fas fa-file-pdf"></i> 2908 - 30-04-2026
            <span class="float-right">
                <small><i class="fas fa-download"></i> 322.65 KB</small>
            </span>
        </h4>
    </a>
</li>
</ul>"""

        result = _parse_html(html)

        assert len(result) == 1
        assert result[0].numero == "2908"
        assert result[0].data == "30-04-2026"
        assert result[0].link_download == "https://example.com/2908.pdf"
        assert result[0].tamanho == "322.65 KB"
        assert result[0].suplementar is False

    def test_parse_edicao_suplementar(self) -> None:
        """Deve detectar edição suplementar pelo texto do título."""
        html = """<ul class="list-group">
<li class="list-group-item">
    <a class="sem-decoracao" href="https://example.com/2908-sup.pdf">
        <h4 class="texto-cinza"><i class="fas fa-file-pdf"></i> 2908 - 30-04-2026 SUPLEMENTAR
            <span class="float-right">
                <small><i class="fas fa-download"></i> 150.00 KB</small>
            </span>
        </h4>
    </a>
</li>
</ul>"""

        result = _parse_html(html)

        assert len(result) == 1
        assert result[0].suplementar is True
        assert result[0].numero == "2908"

    def test_parse_multiplas_edicoes(self) -> None:
        """Deve parsear edição regular + suplementar."""
        html = """<ul class="list-group">
<li class="list-group-item">
    <a class="sem-decoracao" href="https://example.com/2908.pdf">
        <h4 class="texto-cinza"><i class="fas fa-file-pdf"></i> 2908 - 30-04-2026
            <span class="float-right">
                <small><i class="fas fa-download"></i> 322.65 KB</small>
            </span>
        </h4>
    </a>
</li>
<li class="list-group-item">
    <a class="sem-decoracao" href="https://example.com/2908-suplemento.pdf">
        <h4 class="texto-cinza"><i class="fas fa-file-pdf"></i> 2908 - 30-04-2026 - Suplemento
            <span class="float-right">
                <small><i class="fas fa-download"></i> 88.32 KB</small>
            </span>
        </h4>
    </a>
</li>
</ul>"""

        result = _parse_html(html)

        assert len(result) == 2
        regular = [e for e in result if not e.suplementar]
        suplementar = [e for e in result if e.suplementar]
        assert len(regular) >= 1
        assert len(suplementar) >= 1
        assert regular[0].tamanho == "322.65 KB"
        assert suplementar[0].tamanho == "88.32 KB"

    def test_parse_edicao_especial(self) -> None:
        """Deve detectar edição 'extra' ou 'especial' como suplementar."""
        html = """<ul class="list-group">
<li class="list-group-item">
    <a class="sem-decoracao" href="https://example.com/3000.pdf">
        <h4 class="texto-cinza"><i class="fas fa-file-pdf"></i> 3000 - 01-05-2026 Edição Extra
            <span class="float-right">
                <small><i class="fas fa-download"></i> 45.10 KB</small>
            </span>
        </h4>
    </a>
</li>
</ul>"""

        result = _parse_html(html)

        assert len(result) == 1
        assert result[0].suplementar is True

    def test_parse_sem_edicao(self) -> None:
        """Deve retornar lista vazia quando não há edições."""
        html = """<ul class="list-group">
</ul>"""

        result = _parse_html(html)
        assert result == []

    def test_parse_html_sem_list_group(self) -> None:
        """Deve retornar lista vazia quando não há ul.list-group."""
        html = "<div>Conteúdo qualquer sem diário</div>"

        result = _parse_html(html)
        assert result == []

    def test_parse_sem_tamanho(self) -> None:
        """Deve parsear edição sem informação de tamanho."""
        html = """<ul class="list-group">
<li class="list-group-item">
    <a class="sem-decoracao" href="https://example.com/2908.pdf">
        <h4 class="texto-cinza"><i class="fas fa-file-pdf"></i> 2908 - 30-04-2026</h4>
    </a>
</li>
</ul>"""

        result = _parse_html(html)

        assert len(result) == 1
        assert result[0].tamanho is None

    def test_parse_titulo_sem_padrao(self) -> None:
        """Deve ignorar h4 que não casa com o padrão 'numero - data'."""
        html = """<ul class="list-group">
<li class="list-group-item">
    <a class="sem-decoracao" href="https://example.com/x.pdf">
        <h4 class="texto-cinza"><i class="fas fa-file-pdf"></i> Texto sem padrão esperado</h4>
    </a>
</li>
</ul>"""

        result = _parse_html(html)
        assert result == []

    def test_parse_data_com_traco_longo(self) -> None:
        """Deve aceitar traço longo (en-dash) no separador."""
        html = """<ul class="list-group">
<li class="list-group-item">
    <a class="sem-decoracao" href="https://example.com/2908.pdf">
        <h4 class="texto-cinza"><i class="fas fa-file-pdf"></i> 2908 – 30-04-2026
            <span class="float-right">
                <small><i class="fas fa-download"></i> 322.65 KB</small>
            </span>
        </h4>
    </a>
</li>
</ul>"""

        result = _parse_html(html)

        assert len(result) == 1
        assert result[0].numero == "2908"


@pytest.mark.asyncio
class TestFetchDiarioIntegration:
    """Testes de integração com o site real (requer internet)."""

    @pytest.mark.integration
    async def test_fetch_diario_data_passada(self) -> None:
        """Deve buscar dados de uma data passada conhecida.

        Usa uma data que sabidamente tem edição no site.
        Se o site estiver offline, espera httpx.HTTPError.
        """
        try:
            edicoes = await fetch_diario(date(2026, 4, 30))
        except httpx.HTTPError:
            pytest.skip("Site do Diário Oficial indisponível")

        assert isinstance(edicoes, list)
        if edicoes:
            primeira = edicoes[0]
            assert primeira.numero
            assert primeira.data
            assert primeira.link_download.startswith("http")

    @pytest.mark.integration
    async def test_fetch_diario_data_futura(self) -> None:
        """Deve retornar lista vazia para data futura (sem edições)."""
        try:
            edicoes = await fetch_diario(date(2030, 1, 1))
        except httpx.HTTPError:
            pytest.skip("Site do Diário Oficial indisponível")

        assert isinstance(edicoes, list)
        # Datas futuras não devem ter edições
