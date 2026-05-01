"""
Adaptador para fonte de notícias do município (ACL).

Atualmente retorna dados demonstrativos mockados.
No futuro, pode ser substituído por um adapter RSS,
API de comunicação oficial, ou scraper do site da prefeitura.

Padrão ACL (Anti-Corruption Layer) — isola a fonte externa
do resto da aplicação.
"""

from __future__ import annotations

import logging
from datetime import date

from backend.features.noticias.noticias_types import NoticiaResponse

logger = logging.getLogger(__name__)

# Dados mockados de exemplo — substituir por fonte real
_MOCK_NOTICIAS: list[dict[str, str]] = [
    {
        "titulo": "Prefeitura entrega reforma da Praça Central",
        "chamada": (
            "A Prefeitura de Bandeirantes concluiu a revitalização da Praça"
            " Central com novos equipamentos de lazer, acessibilidade e"
            " paisagismo. A obra beneficia diretamente mais de 10 mil munícipes."
        ),
        "link": "https://www.bandeirantes.ms.gov.br/noticias/reforma-praca-central",
        "data_publicacao": "2026-04-28",
        "fonte": "prefeitura",
    },
    {
        "titulo": "Programa de saúde preventiva nas escolas municipais",
        "chamada": (
            "A Secretaria Municipal de Saúde lança novo programa de saúde"
            " preventiva nas escolas, com atendimento odontológico e"
            " vacinação para alunos da rede municipal."
        ),
        "link": "https://www.bandeirantes.ms.gov.br/noticias/saude-preventiva-escolas",
        "data_publicacao": "2026-04-25",
        "fonte": "prefeitura",
    },
    {
        "titulo": "Abertas as inscrições para o processo seletivo 2026",
        "chamada": (
            "A Prefeitura de Bandeirantes abre inscrições para processo"
            " seletivo simplificado com vagas em diversas secretarias."
            " As inscrições vão até o dia 15 de maio."
        ),
        "link": "https://www.bandeirantes.ms.gov.br/noticias/processo-seletivo-2026",
        "data_publicacao": "2026-04-20",
        "fonte": "prefeitura",
    },
]


async def fetch_ultima_noticia() -> NoticiaResponse:
    """Retorna a notícia mais recente do município.

    Atualmente retorna do conjunto mockado, ordenado por data.
    Quando uma fonte real for integrada, este adapter deve ser
    substituído para buscar de RSS/API oficial.

    Returns:
        NoticiaResponse com a notícia mais recente.
    """
    noticias = sorted(_MOCK_NOTICIAS, key=lambda n: n["data_publicacao"], reverse=True)

    if not noticias:
        logger.warning("Nenhuma notícia disponível — retornando fallback")
        return NoticiaResponse(
            titulo="Nenhuma notícia disponível",
            chamada="As notícias do município serão exibidas em breve.",
            link="#",
            data_publicacao=date.today().isoformat(),
            fonte="sistema",
        )

    ultima = noticias[0]
    return NoticiaResponse(
        titulo=ultima["titulo"],
        chamada=ultima["chamada"],
        link=ultima["link"],
        data_publicacao=ultima["data_publicacao"],
        fonte=ultima["fonte"],
    )
