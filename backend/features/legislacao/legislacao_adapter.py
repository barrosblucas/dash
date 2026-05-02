"""
Adaptador para fonte de legislações municipais (ACL).

Fornece dados mockados de fallback para legislações da
Prefeitura de Bandeirantes MS.

Padrão ACL (Anti-Corruption Layer) — isola a fonte externa
do resto da aplicação.
"""

from __future__ import annotations

import logging
from typing import Any

from backend.features.legislacao.legislacao_mock_data import (
    _MOCK_LEGISLACOES_PART1,
)
from backend.features.legislacao.legislacao_mock_data_extra import (
    _MOCK_LEGISLACOES_PART2,
)
from backend.features.legislacao.legislacao_types import (
    LegislacaoDetalhe,
    LegislacaoItem,
    LegislacaoListResponse,
    StatusLegislacao,
    TipoLegislacao,
)

logger = logging.getLogger(__name__)

_MOCK_LEGISLACOES: list[dict[str, Any]] = (
    _MOCK_LEGISLACOES_PART1 + _MOCK_LEGISLACOES_PART2
)


def _matches_search(item: dict[str, Any], busca: str | None) -> bool:
    """Verifica se o item corresponde ao termo de busca textual."""
    if busca is None:
        return True
    termo = busca.lower()
    campos = [
        item.get("id", ""),
        item.get("numero", ""),
        item.get("ementa", ""),
        item.get("autor", "") or "",
        item.get("tipo", "").value
        if hasattr(item.get("tipo"), "value")
        else str(item.get("tipo", "")),
    ]
    return any(termo in str(c).lower() for c in campos)


def _to_item(item: dict[str, Any]) -> LegislacaoItem:
    """Converte dict mockado para LegislacaoItem."""
    return LegislacaoItem(
        id=item["id"],
        tipo=item["tipo"],
        numero=item["numero"],
        ano=item["ano"],
        ementa=item["ementa"],
        data_publicacao=item["data_publicacao"],
        data_promulgacao=item.get("data_promulgacao"),
        status=item["status"],
        autor=item.get("autor"),
    )


def _to_detalhe(item: dict[str, Any]) -> LegislacaoDetalhe:
    """Converte dict mockado para LegislacaoDetalhe."""
    return LegislacaoDetalhe(
        id=item["id"],
        tipo=item["tipo"],
        numero=item["numero"],
        ano=item["ano"],
        ementa=item["ementa"],
        texto_integral=item["texto_integral"],
        data_publicacao=item["data_publicacao"],
        data_promulgacao=item.get("data_promulgacao"),
        data_vigencia_inicio=item.get("data_vigencia_inicio"),
        data_vigencia_fim=item.get("data_vigencia_fim"),
        status=item["status"],
        autor=item.get("autor"),
        sancionado_por=item.get("sancionado_por"),
        origem=item.get("origem"),
        legislacao_vinculada=item.get("legislacao_vinculada"),
        url_arquivo=item.get("url_arquivo"),
    )


def fetch_legislacoes(
    page: int = 1,
    size: int = 12,
    tipo: TipoLegislacao | None = None,
    ano: int | None = None,
    status: StatusLegislacao | None = None,
    busca: str | None = None,
) -> LegislacaoListResponse:
    """Retorna lista paginada de legislações com filtros e busca textual.

    Args:
        page: Número da página (1-based).
        size: Quantidade de itens por página.
        tipo: Filtro por tipo de legislação.
        ano: Filtro por ano.
        status: Filtro por status.
        busca: Termo de busca textual em id, número, ementa, autor e tipo.

    Returns:
        LegislacaoListResponse com os itens filtrados e paginados.
    """
    if page < 1:
        page = 1
    if size < 1:
        size = 12

    filtrados = [
        item
        for item in _MOCK_LEGISLACOES
        if (tipo is None or item["tipo"] == tipo)
        and (ano is None or item["ano"] == ano)
        and (status is None or item["status"] == status)
        and _matches_search(item, busca)
    ]

    total = len(filtrados)
    start = (page - 1) * size
    end = start + size
    pagina = filtrados[start:end]

    items = [_to_item(item) for item in pagina]

    return LegislacaoListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
    )


def fetch_legislacao_detalhe(legislacao_id: str) -> LegislacaoDetalhe | None:
    """Retorna o detalhe completo de uma legislação por ID.

    Args:
        legislacao_id: Identificador único da legislação.

    Returns:
        LegislacaoDetalhe se encontrada, ou None.
    """
    for item in _MOCK_LEGISLACOES:
        if item["id"] == legislacao_id:
            return _to_detalhe(item)
    return None
