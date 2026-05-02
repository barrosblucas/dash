"""
Handlers HTTP da feature Diário Oficial.

Endpoints para consulta do Diário Oficial do dia e busca/importação admin.
"""

from __future__ import annotations

import logging
import re
from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from backend.features.diario_oficial.diario_oficial_adapter import fetch_diario
from backend.features.diario_oficial.diario_oficial_business import (
    importar_como_legislacao,
)
from backend.features.diario_oficial.diario_oficial_types import (
    DiarioBuscaItem,
    DiarioBuscaResponse,
    DiarioImportRequest,
    DiarioResponse,
)
from backend.features.legislacao.legislacao_data import legislacao_to_detalhe_dict
from backend.features.legislacao.legislacao_types import LegislacaoDetalhe
from backend.shared.database.connection import get_db
from backend.shared.diario_oficial_client import DiarioOficialClient, extract_lei_numero
from backend.shared.security import require_admin_user

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/diario-oficial/hoje",
    response_model=DiarioResponse,
    tags=["diario-oficial"],
)
async def get_diario_hoje(request: Request) -> DiarioResponse:
    """Retorna as edições do Diário Oficial publicadas hoje.

    Consulta primeiro o cache em memória (atualizado pelo scheduler),
    com fallback para requisição direta ao site.

    Returns:
        DiarioResponse com as edições do dia.
    """
    data_hoje = date.today()
    data_str = data_hoje.strftime("%d/%m/%Y")

    # Tenta obter do cache do scheduler
    scheduler = getattr(request.app.state, "diario_oficial_scheduler", None)
    if scheduler is not None and scheduler.ultimo_resultado is not None:
        # Verifica se o cache é de hoje
        if scheduler.ultimo_resultado.data_consulta == data_str:
            logger.info("Retornando diário do cache do scheduler")
            return scheduler.ultimo_resultado

    # Fallback: busca direta
    try:
        edicoes = await fetch_diario(data_hoje)
        if edicoes:
            return DiarioResponse(
                data_consulta=data_str,
                tem_edicao=True,
                edicoes=edicoes,
                mensagem=None,
            )
        else:
            return DiarioResponse(
                data_consulta=data_str,
                tem_edicao=False,
                edicoes=[],
                mensagem="Nenhuma edição publicada hoje.",
            )
    except Exception as e:
        logger.exception("Erro ao consultar Diário Oficial")
        return DiarioResponse(
            data_consulta=data_str,
            tem_edicao=False,
            edicoes=[],
            mensagem=f"Não foi possível consultar o Diário Oficial: {e}",
        )


@router.get(
    "/diario-oficial/buscar",
    response_model=DiarioBuscaResponse,
    tags=["diario-oficial"],
)
async def buscar_diario(
    termo: str = Query("LEI", description="Termo de busca no título"),
    data_inicio: str = Query("03/07/2020", description="Data inicial DD/MM/YYYY"),
    data_fim: str = Query(default_factory=lambda: date.today().strftime("%d/%m/%Y")),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    _: Any = Depends(require_admin_user),
) -> DiarioBuscaResponse:
    """
    Busca publicações no Diário Oficial MS.
    Protegido: requer autenticação admin.
    """
    async with DiarioOficialClient() as client:
        # Busca na API DataTables
        start = (page - 1) * size
        result = await client.search(
            term=termo,
            data_inicio=data_inicio,
            data_fim=data_fim,
            start=start,
            length=size,
        )

        total = result.get("recordsFiltered", 0)
        items = []
        for raw in result.get("data", []):
            titulo_html = str(raw.get("titulo", ""))
            titulo_limpo = re.sub(r"<[^>]*>", " ", titulo_html)
            titulo_limpo = re.sub(r"\s+", " ", titulo_limpo).strip()

            numero_lei = extract_lei_numero(titulo_html)
            ano_lei = ""
            if "/" in numero_lei:
                _, ano_lei = numero_lei.rsplit("/", 1)
            else:
                data_str = str(raw.get("data_de_circulacao", ""))
                if len(data_str) >= 10:
                    ano_lei = data_str[-4:]

            items.append(
                DiarioBuscaItem(
                    id=str(raw.get("id", "")),
                    titulo=titulo_limpo,
                    data_publicacao=str(raw.get("data_de_circulacao", "")),
                    numero_materia=str(raw.get("numero_da_materia", "")),
                    numero_lei=numero_lei,
                    ano_lei=ano_lei,
                    link_download="",  # será resolvido no import
                )
            )

        return DiarioBuscaResponse(items=items, total=total, page=page, size=size)


@router.post(
    "/diario-oficial/importar",
    response_model=LegislacaoDetalhe,
    tags=["diario-oficial"],
)
async def importar_diario(
    payload: DiarioImportRequest,
    _: Any = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> LegislacaoDetalhe:
    """
    Importa uma publicação do Diário Oficial como legislação.
    Protegido: requer autenticação admin.
    """
    async with DiarioOficialClient() as client:
        legislacao = await importar_como_legislacao(db, client, payload)
        return LegislacaoDetalhe(**legislacao_to_detalhe_dict(legislacao))
