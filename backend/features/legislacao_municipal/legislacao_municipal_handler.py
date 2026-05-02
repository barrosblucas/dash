"""
Handlers HTTP da feature Legislação Municipal.

Endpoints para busca e importação admin de matérias legislativas
individuais do diariooficialms.com.br.
"""

from __future__ import annotations

import logging
from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.features.diario_oficial.diario_oficial_business import (
    importar_como_legislacao,
)
from backend.features.diario_oficial.diario_oficial_types import DiarioImportRequest
from backend.features.legislacao.legislacao_data import legislacao_to_detalhe_dict
from backend.features.legislacao.legislacao_types import LegislacaoDetalhe
from backend.features.legislacao_municipal.legislacao_municipal_types import (
    LegislacaoBuscaItem,
    LegislacaoBuscaResponse,
    LegislacaoImportRequest,
)
from backend.scripts.scrape_diario_oficial_parsers import parse_legislacao_item
from backend.shared.database.connection import get_db
from backend.shared.diario_oficial_client import DiarioOficialClient
from backend.shared.security import require_admin_user

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/legislacao-municipal/buscar",
    response_model=LegislacaoBuscaResponse,
    tags=["legislacao-municipal"],
)
async def buscar_legislacao(
    termo: str = Query("LEI", description="Termo de busca no título"),
    data_inicio: str = Query("03/07/2020", description="Data inicial DD/MM/YYYY"),
    data_fim: str = Query(
        default_factory=lambda: date.today().strftime("%d/%m/%Y"),
        description="Data final DD/MM/YYYY",
    ),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    _: Any = Depends(require_admin_user),
) -> LegislacaoBuscaResponse:
    """
    Busca matérias legislativas no Diário Oficial MS.
    Protegido: requer autenticação admin.
    """
    async with DiarioOficialClient() as client:
        # Busca todas as páginas de resultados
        raw_items = await client.fetch_all_pages(
            term=termo,
            data_inicio=data_inicio,
            data_fim=data_fim,
        )

        # Parseia cada item bruto com o parser de legislação municipal
        parsed_items = []
        for raw in raw_items:
            parsed = parse_legislacao_item(raw)
            if parsed is not None:
                parsed_items.append(parsed)

        # Agrupa por data para resolver links do Diário Oficial em lote
        dates: set[str] = set()
        for item in parsed_items:
            dates.add(item.data_circulacao)

        pdf_links_by_date: dict[str, dict[str, str]] = {}
        for date_str in sorted(dates):
            pdf_links_by_date[date_str] = await client.fetch_pdf_links_for_date(
                date_str
            )

        # Constrói os itens de resposta com link_diario_oficial resolvido
        all_items: list[LegislacaoBuscaItem] = []
        for parsed in parsed_items:
            date_links = pdf_links_by_date.get(parsed.data_circulacao, {})
            link_diario_oficial = date_links.get(parsed.numero_materia, "")

            all_items.append(
                LegislacaoBuscaItem(
                    id=parsed.id,
                    titulo=parsed.titulo,
                    data_publicacao=parsed.data_circulacao,
                    numero_materia=parsed.numero_materia,
                    numero_lei=parsed.numero_lei,
                    ano_lei=parsed.ano_lei,
                    link_legislacao=parsed.link_legislacao,
                    link_diario_oficial=link_diario_oficial,
                    anexo_habilitado=parsed.anexo_habilitado,
                )
            )

        # Paginação local (slice sobre o total de itens parseados)
        total = len(all_items)
        start = (page - 1) * size
        page_items = all_items[start : start + size]

        return LegislacaoBuscaResponse(
            items=page_items, total=total, page=page, size=size
        )


@router.post(
    "/legislacao-municipal/importar",
    response_model=LegislacaoDetalhe,
    tags=["legislacao-municipal"],
)
async def importar_legislacao(
    payload: LegislacaoImportRequest,
    _: Any = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> LegislacaoDetalhe:
    """
    Importa uma matéria legislativa como legislação.
    Protegido: requer autenticação admin.
    """
    async with DiarioOficialClient() as client:
        # Converte o payload para o formato esperado por importar_como_legislacao
        diario_payload = DiarioImportRequest(
            diario_id=payload.legislacao_id,
            titulo=payload.titulo,
            data_publicacao=payload.data_publicacao,
            numero_materia=payload.numero_materia,
            link_download=payload.link_diario_oficial,
            numero_lei=payload.numero_lei,
            ano_lei=payload.ano_lei,
            tipo=payload.tipo,
        )

        legislacao = await importar_como_legislacao(db, client, diario_payload)
        return LegislacaoDetalhe(**legislacao_to_detalhe_dict(legislacao))
