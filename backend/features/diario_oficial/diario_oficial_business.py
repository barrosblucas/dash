"""
Lógica de negócio da feature Diário Oficial.
Busca publicações e importa como legislação.
"""

from __future__ import annotations

import logging
import tempfile
from datetime import date
from pathlib import Path
from typing import Any

import pdfplumber
from sqlalchemy.orm import Session

from backend.features.diario_oficial.diario_oficial_types import DiarioImportRequest
from backend.features.legislacao.legislacao_data import SQLLegislacaoRepository
from backend.features.legislacao.legislacao_types import (
    LegislacaoCreateRequest,
    StatusLegislacao,
    TipoLegislacao,
)
from backend.shared.diario_oficial_client import DiarioOficialClient

logger = logging.getLogger(__name__)


def _parse_tipo_legislacao(tipo_str: str) -> TipoLegislacao:
    """Mapeia string de tipo para o enum TipoLegislacao."""
    mapping = {
        "LEI": TipoLegislacao.LEI,
        "LEI_COMPLEMENTAR": TipoLegislacao.LEI_COMPLEMENTAR,
        "DECRETO": TipoLegislacao.DECRETO,
        "DECRETO_LEI": TipoLegislacao.DECRETO_LEI,
        "PORTARIA": TipoLegislacao.PORTARIA,
        "RESOLUCAO": TipoLegislacao.RESOLUCAO,
        "EMENDA": TipoLegislacao.EMENDA,
    }
    return mapping.get(tipo_str.upper(), TipoLegislacao.LEI)


def _parse_data(data_str: str) -> date:
    """Converte string DD/MM/YYYY para date."""
    dia, mes, ano = data_str.split("/")
    return date(int(ano), int(mes), int(dia))


async def resolver_link_direto(
    client: DiarioOficialClient, data_str: str, numero_materia: str
) -> str:
    """Resolve o link direto do PDF para uma matéria específica."""
    links = await client.fetch_pdf_links_for_date(data_str)
    return links.get(numero_materia, "")


async def importar_como_legislacao(
    db: Session, client: DiarioOficialClient, payload: DiarioImportRequest
) -> Any:
    """
    Importa uma publicação do Diário Oficial como legislação.

    1. Resolve o link direto do PDF (se não fornecido)
    2. Baixa o PDF
    3. Extrai texto (se possível, usa texto vazio como fallback)
    4. Cria entrada na tabela legislacoes via SQLLegislacaoRepository
    5. Retorna a legislação criada
    """
    pdf_url = payload.link_download

    # 1. Resolve o link direto do PDF se não fornecido
    if not pdf_url:
        pdf_url = await resolver_link_direto(
            client, payload.data_publicacao, payload.numero_materia
        )
        if not pdf_url:
            raise ValueError(
                f"Não foi possível resolver o link do PDF para matéria "
                f"{payload.numero_materia} em {payload.data_publicacao}"
            )

    # 2. Baixa o PDF em arquivo temporário
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp_path = Path(tmp.name)

    try:
        success = await client.download_pdf(pdf_url, tmp_path)
        if not success:
            raise RuntimeError(f"Falha ao baixar PDF: {pdf_url}")

        # 3. Extrai texto do PDF
        texto_integral = ""
        try:
            with pdfplumber.open(tmp_path) as pdf:
                if pdf.pages:
                    text = pdf.pages[0].extract_text() or ""
                    texto_integral = text[:5000]  # primeiros 5000 caracteres
        except Exception:
            logger.exception("Erro ao extrair texto do PDF, usando texto vazio")
            texto_integral = ""

        # 4. Cria a legislação
        ementa = payload.titulo[:200].strip()

        # Usa url_arquivo (link da legislação individual) se fornecido,
        # senão usa link_download (link direto do PDF)
        stored_url = payload.url_arquivo if payload.url_arquivo else pdf_url

        create_request = LegislacaoCreateRequest(
            tipo=_parse_tipo_legislacao(payload.tipo),
            numero=payload.numero_lei,
            ano=int(payload.ano_lei),
            ementa=ementa,
            texto_integral=texto_integral or None,
            data_publicacao=_parse_data(payload.data_publicacao),
            url_arquivo=stored_url,
            origem="Diário Oficial MS",
            status=StatusLegislacao.ATIVA,
        )

        legislacao = SQLLegislacaoRepository(db).create(create_request)
        return legislacao
    finally:
        # 6. Remove o arquivo temporário
        try:
            tmp_path.unlink(missing_ok=True)
        except Exception:
            logger.exception("Erro ao remover arquivo temporário")
