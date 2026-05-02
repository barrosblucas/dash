"""
Funções de parsing para o scraper do Diário Oficial MS.

Extrai números de lei, links de PDF e converte itens brutos da API.
"""

from __future__ import annotations

import logging
import re
from typing import Any

from backend.scripts.scrape_diario_oficial_models import LegislacaoItem, LeiItem

logger = logging.getLogger(__name__)

# Regex para extrair link do PDF da página principal
_PDF_LINK_RE = re.compile(
    r'<a[^>]+class="[^"]*sem-decoracao[^"]*"[^>]+href="(https://diario-oficial-prd\.[^"]+\.pdf)"',
    re.IGNORECASE,
)
# Regex para extrair número da matéria do título h4 na página principal
# Ex: "2904 - 24-04-2026" → numero_materia="2904"
_H4_NUMERO_RE = re.compile(r"^(\d+)\s*[-–]")


def extract_direct_pdf_links(html: str) -> dict[str, str]:
    """Extrai links diretos de PDF da página principal do Diário Oficial.

    Faz o parsing do HTML retornado por /bandeirantes?data=DD/MM/YYYY
    para extrair os links diretos do DigitalOcean Spaces.

    Args:
        html: Conteúdo HTML da página principal.

    Returns:
        Dict com mapeamento numero_materia → url_direta_pdf.
        Ex: {"2904": "https://diario-oficial-prd.../2904---24-04-2026.pdf"}
    """
    links: dict[str, str] = {}

    for li_match in re.finditer(
        r"<li[^>]*list-group-item[^>]*>(.*?)</li>",
        html,
        re.DOTALL | re.IGNORECASE,
    ):
        content = li_match.group(1)

        # Extrai o link do PDF
        href_match = re.search(
            r'href="(https://diario-oficial-prd\.[^"]+\.pdf)"',
            content,
            re.IGNORECASE,
        )
        if not href_match:
            continue

        pdf_url = href_match.group(1)

        # Extrai o número da matéria do h4
        h4_match = re.search(r"<h4[^>]*>(.*?)</h4>", content, re.DOTALL | re.IGNORECASE)
        if h4_match:
            h4_text = re.sub(r"<[^>]*>", " ", h4_match.group(1))
            h4_text = re.sub(r"\s+", " ", h4_text).strip()
            numero_match = _H4_NUMERO_RE.match(h4_text)
            if numero_match:
                numero = numero_match.group(1)
                links[numero] = pdf_url

    return links


def extract_lei_numero(titulo: str) -> str:
    """Extrai o número da lei do título da publicação.

    Exemplos:
        "LEI Nº 1.263/2026, DE 23 DE ABRIL DE 2026." -> "1.263/2026"
        "LEI MUNICIPAL Nº 1.262/2026" -> "1.262/2026"
        "LEI COMPLEMENTAR N° 1231/2025" -> "1231/2025"
        "LEI 1199 2024 LOA 2025" -> "1199"

    Args:
        titulo: Título HTML da publicação.

    Returns:
        Número da lei extraído, ou string vazia.
    """
    # Remove tags HTML
    texto_limpo = re.sub(r"<[^>]*>", " ", titulo)
    texto_limpo = re.sub(r"\s+", " ", texto_limpo).strip()

    # Padrão estrito: título começa com tipo de lei + número
    # Evita capturar referências a leis federais no meio de avisos
    # Exige pelo menos um dígito no número da lei
    match = re.search(
        r"^(?:LEI\s+MUNICIPAL|LEI\s+COMPLEMENTAR|LEI\s+ORDINÁRIA|LEI)\s+"
        r"(?:N[º°]\s*)?"
        r"(\d[\d.]*(?:/\d{4})?)",
        texto_limpo,
        re.IGNORECASE,
    )
    if match:
        return match.group(1).strip()

    return ""


def parse_item(raw: dict[str, Any]) -> LeiItem | None:
    """Converte um item bruto da API em LeiItem.

    Só retorna itens que são leis genuínas (título começa com padrão de lei).

    Args:
        raw: Dicionário retornado pela API no array data[].

    Returns:
        LeiItem parseado ou None se não for lei.
    """
    titulo_html = str(raw.get("titulo", ""))

    numero_lei = extract_lei_numero(titulo_html)
    if not numero_lei:
        # Não é uma lei (provavelmente aviso de licitação que contém "LEI")
        logger.debug("  ⏭ Item ignorado (não é lei): id=%s", raw.get("id", "?"))
        return None

    # Extrai ano: do número (ex: "1.263/2026") ou da data de publicação
    ano_lei = ""
    if "/" in numero_lei:
        _, ano_lei = numero_lei.rsplit("/", 1)
    else:
        data_str = str(raw.get("data_de_circulacao", ""))
        if data_str and len(data_str) >= 10:
            # Formato DD/MM/YYYY
            ano_lei = data_str[-4:]

    # Limpa título para exibição
    titulo_limpo = re.sub(r"<[^>]*>", " ", titulo_html)
    titulo_limpo = re.sub(r"\s+", " ", titulo_limpo).strip()

    return LeiItem(
        id=str(raw.get("id", "")),
        titulo=titulo_limpo,
        data_circulacao=str(raw.get("data_de_circulacao", "")),
        numero_materia=str(raw.get("numero_da_materia", "")),
        direct_pdf_url="",  # Será preenchido na etapa de resolução
        numero_lei=numero_lei,
        ano_lei=ano_lei,
    )


# ─── Parsers Legislação Municipal ────────────────────────────────────────────


def extract_materia_download_url(action_baixar_html: str) -> tuple[str, str]:
    """Extrai URL de download e hash do HTML do campo action-baixar.

    Exemplo de entrada:
        <form method="post" target="_blank"
              action="https://www.diariooficialms.com.br/baixar-materia/878370/05c2484fa7901a148a7f442f66e3cd66">
            <button class="action-baixar-materia" type="button">Baixar</button>
        </form>

    Returns:
        Tupla (url_completa, hash) ou ("", "") se não encontrado.
    """
    match = re.search(
        r'action="(https://www\.diariooficialms\.com\.br/baixar-materia/(\d+)/([a-f0-9]+))"',
        action_baixar_html,
    )
    if match:
        return match.group(1), match.group(3)
    return "", ""


def parse_legislacao_item(raw: dict[str, Any]) -> LegislacaoItem | None:
    """Converte um item bruto da API em LegislacaoItem.

    Args:
        raw: Dicionário retornado pela API no array data[].

    Returns:
        LegislacaoItem parseado ou None se não for lei.
    """
    titulo_html = str(raw.get("titulo", ""))

    numero_lei = extract_lei_numero(titulo_html)
    if not numero_lei:
        logger.debug("  ⏭ Item ignorado (não é lei): id=%s", raw.get("id", "?"))
        return None

    action_baixar = str(raw.get("action-baixar", ""))
    link_legislacao, download_hash = extract_materia_download_url(action_baixar)

    # Extrai ano: do número (ex: "1.263/2026") ou da data de publicação
    ano_lei = ""
    if "/" in numero_lei:
        _, ano_lei = numero_lei.rsplit("/", 1)
    else:
        data_str = str(raw.get("data_de_circulacao", ""))
        if data_str and len(data_str) >= 10:
            ano_lei = data_str[-4:]

    # Limpa título para exibição
    titulo_limpo = re.sub(r"<[^>]*>", " ", titulo_html)
    titulo_limpo = re.sub(r"\s+", " ", titulo_limpo).strip()

    # Extrai anexo_habilitado do objeto cidade
    cidade = raw.get("cidade", {})
    anexo_habilitado = (
        cidade.get("anexo_habilitado", False) if isinstance(cidade, dict) else False
    )

    return LegislacaoItem(
        id=str(raw.get("id", "")),
        titulo=titulo_limpo,
        data_circulacao=str(raw.get("data_de_circulacao", "")),
        numero_materia=str(raw.get("numero_da_materia", "")),
        numero_lei=numero_lei,
        ano_lei=ano_lei,
        link_legislacao=link_legislacao,
        download_hash=download_hash,
        anexo_habilitado=bool(anexo_habilitado),
    )
