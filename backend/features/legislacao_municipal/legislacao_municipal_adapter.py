"""
Adapter para download de matérias legislativas individuais.

O endpoint protegido ``/baixar-materia/{id}/{hash}`` pode responder com
HTML de expiração mesmo quando o link ainda aparece na listagem. Para manter
o download funcional no painel admin, o adapter baixa o PDF completo da edição
(DigitalOcean Spaces) a partir de ``data_publicacao`` + ``numero_materia`` e
recorta somente a matéria/lei solicitada usando pdfplumber (para localizar
headings) e pypdf (para recorte do cropbox).
"""

from __future__ import annotations

import io
import logging
import re

import pdfplumber
import pypdf

from backend.shared.diario_oficial_client import DiarioOficialClient

logger = logging.getLogger(__name__)

ALLOWED_DOWNLOAD_PREFIX = "https://www.diariooficialms.com.br/baixar-materia/"

# Regex para identificar headings de publicações no PDF.
# Cada publicação relevante (lei, decreto, portaria, etc.) inicia com um
# padrão como "LEI MUNICIPAL Nº", "DECRETO Nº", "PORTARIA Nº", etc.
# O ordinal (º/°) é opcional pois o PDF pode ou não incluí-lo.
_HEADING_PATTERN = re.compile(
    r"(?:LEI\s+(?:MUNICIPAL|COMPLEMENTAR|ORDINÁRIA)"
    r"|DECRETO(?:\s+MUNICIPAL)?"
    r"|PORTARIA"
    r"|EXTRATO"
    r"|EDITAL"
    r"|RESOLUÇÃO)\s+N[º°]?",
    re.IGNORECASE,
)


def validate_download_url(url: str) -> None:
    if not url.startswith(ALLOWED_DOWNLOAD_PREFIX):
        raise ValueError(f"URL de download inválida: {url}")


def validate_pdf_content(content: bytes) -> None:
    if not content.startswith(b"%PDF"):
        raise ValueError(
            f"Conteúdo retornado não é um PDF válido "
            f"(recebido {len(content)} bytes, inicia com {content[:20]!r})"
        )


def build_download_filename(link_legislacao: str, numero_materia: str) -> str:
    parts = link_legislacao.rstrip("/").split("/")
    if len(parts) >= 2 and parts[-2]:
        return f"legislacao_{parts[-2]}.pdf"
    return f"legislacao_{numero_materia}.pdf"


# ─── Helpers de parsing HTML ──────────────────────────────────────────────


def _clean_html_title(titulo_html: str) -> str:
    """Remove tags HTML e normaliza whitespace do título da API."""
    texto = re.sub(r"<[^>]*>", " ", titulo_html)
    texto = re.sub(r"\s+", " ", texto).strip()
    return texto


# ─── Helpers de busca e recorte no PDF ────────────────────────────────────


def _find_heading_position(
    pdf_bytes: bytes,
    heading_text: str,
) -> tuple[int, float]:
    """Localiza a página (0‑indexed) e o top‑Y da linha do heading alvo.

    Tenta múltiplas estratégias de busca em ordem decrescente de precisão:
    1. texto completo do heading
    2. texto sem o ponto final
    3. primeira sentença (até vírgula/ponto)

    Args:
        pdf_bytes: Conteúdo bruto do PDF da edição completa.
        heading_text: Texto do heading a localizar (ex: "LEI MUNICIPAL Nº ...").

    Returns:
        Tupla (page_index, top_y) — página 0‑indexed e posição Y a partir do topo.

    Raises:
        ValueError: heading não encontrado no PDF.
    """

    # Normaliza ordinais (Nº → N) pois o PDF pode não incluí-los
    def _norm(t: str) -> str:
        return re.sub(r"[º°]", "", t)

    variants: list[str] = []
    variants.append(heading_text)
    trimmed = heading_text.rstrip(".")
    if trimmed != heading_text:
        variants.append(trimmed)
    # Versão até a primeira vírgula (ex: "LEI MUNICIPAL Nº 1.263/2026")
    short = heading_text.split(",")[0].strip() if "," in heading_text else heading_text
    if short and short != heading_text:
        variants.append(short)
    # Versões sem ordinais de cada variante
    variants.extend(_norm(v) for v in variants if _norm(v) != v)

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page_idx, page in enumerate(pdf.pages):
            for variant in variants:
                matches = page.search(variant, regex=False)
                if matches:
                    return page_idx, matches[0]["top"]

        raise ValueError(f"Heading '{heading_text[:80]}...' não encontrado no PDF")


def _find_next_heading_edge(
    pdf_bytes: bytes,
    start_page: int,
    start_top: float,
) -> tuple[int, float] | None:
    """Localiza o início da próxima publicação após o heading alvo.

    Escaneia a partir de ``start_page``/``start_top`` usando o padrão
    ``_HEADING_PATTERN``. Na mesma página, só considera matches com
    ``top > start_top + 5`` para evitar o próprio heading alvo.

    Returns:
        Tupla (page_index, top_y) da próxima publicação, ou None se não houver.
    """
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        # Mesma página: ignorar o próprio heading (margem de 5pt)
        page = pdf.pages[start_page]
        matches = page.search(_HEADING_PATTERN, regex=True)
        for m in matches:
            if m["top"] > start_top + 5:
                return start_page, m["top"]

        # Páginas seguintes
        for page_idx in range(start_page + 1, len(pdf.pages)):
            page = pdf.pages[page_idx]
            matches = page.search(_HEADING_PATTERN, regex=True)
            if matches:
                return page_idx, matches[0]["top"]

    return None


def _crop_pdf_section(
    pdf_bytes: bytes,
    start_page: int,
    start_top: float,
    end_info: tuple[int, float] | None,
) -> bytes:
    """Recorta o PDF da posição do heading alvo até o próximo heading (ou fim).

    Usa ``pypdf`` para ajustar o ``/CropBox`` página a página:

    - Primeira página: conteúdo do heading alvo para baixo (até o rodapé).
    - Última página: conteúdo do topo até o próximo heading (exclusive).
    - Páginas intermediárias: página inteira.
    - Sem próximo heading: do heading alvo até o fim do documento.

    Args:
        pdf_bytes: PDF completo da edição.
        start_page: Página 0‑indexed onde o heading alvo foi encontrado.
        start_top: Posição Y (pdfplumber, do topo) do heading alvo.
        end_info: Tupla (page, top) da próxima publicação, ou None.

    Returns:
        Bytes do PDF recortado.
    """
    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    writer = pypdf.PdfWriter()

    if end_info is not None:
        end_page, end_top = end_info
    else:
        end_page = len(reader.pages) - 1
        end_top = None  # sem limite superior

    for i in range(start_page, end_page + 1):
        page = reader.pages[i]
        mb = page.mediabox
        page_height = float(mb.top - mb.bottom)

        is_first = i == start_page
        is_last = i == end_page

        if is_first and is_last and end_top is not None:
            # Página única: recorte entre os dois headings
            y0 = page_height - end_top + 2  # margem 2pt para excluir próximo heading
            y1 = page_height - start_top
            page.cropbox.lower_left = (float(mb.left), y0)
            page.cropbox.upper_right = (float(mb.right), y1)

        elif is_first:
            # Primeira página: do heading para baixo
            y0 = float(mb.bottom)
            y1 = page_height - start_top
            page.cropbox.lower_left = (float(mb.left), y0)
            page.cropbox.upper_right = (float(mb.right), y1)

        elif is_last and end_top is not None:
            # Última página: do topo até pouco antes do próximo heading
            y0 = page_height - end_top + 2  # margem 2pt para excluir a heading
            y1 = float(mb.top)
            page.cropbox.lower_left = (float(mb.left), y0)
            page.cropbox.upper_right = (float(mb.right), y1)

        # Páginas intermediárias: mantém página inteira (cropbox padrão)

        writer.add_page(page)

    buf = io.BytesIO()
    writer.write(buf)
    buf.seek(0)
    return buf.read()


# ─── Função principal ─────────────────────────────────────────────────────


async def _resolve_materia_heading(
    client: DiarioOficialClient,
    data_publicacao: str,
    numero_materia: str,
    link_legislacao: str | None = None,
) -> str | None:
    """Busca o título limpo da matéria na API do Diário Oficial.

    Consulta os items da edição via ``fetch_all_pages`` e localiza o item
    por ``numero_materia``. Se não encontrar, tenta pelo ID extraído do
    ``link_legislacao``.

    Returns:
        Título limpo (ex: "LEI MUNICIPAL Nº 1.262/2026, DE 23 DE ABRIL DE 2026.")
        ou None se não encontrado.
    """
    items = await client.fetch_all_pages(
        term="LEI",
        data_inicio=data_publicacao,
        data_fim=data_publicacao,
    )

    # Tenta match por numero_materia
    for item in items:
        if str(item.get("numero_da_materia", "")) == numero_materia:
            titulo_html = str(item.get("titulo", ""))
            if titulo_html:
                return _clean_html_title(titulo_html)

    # Fallback: match por ID extraído do link_legislacao
    if link_legislacao and "/baixar-materia/" in link_legislacao:
        parts = link_legislacao.rstrip("/").split("/")
        if len(parts) >= 2:
            link_id = parts[-2]
            for item in items:
                if str(item.get("id", "")) == link_id:
                    titulo_html = str(item.get("titulo", ""))
                    if titulo_html:
                        return _clean_html_title(titulo_html)

    logger.warning(
        "Matéria %s não encontrada na API para %s",
        numero_materia,
        data_publicacao,
    )
    return None


async def _download_full_edition_pdf(
    client: DiarioOficialClient,
    data_publicacao: str,
    numero_materia: str,
) -> bytes:
    """Baixa o PDF completo da edição.

    Raises:
        ValueError: link direto não encontrado para a matéria.
    """
    pdf_links_by_numero = await client.fetch_pdf_links_for_date(data_publicacao)
    direct_pdf_url = pdf_links_by_numero.get(numero_materia, "")

    if not direct_pdf_url:
        raise ValueError(
            "Não foi possível localizar o PDF da matéria "
            f"{numero_materia} na edição de {data_publicacao}"
        )

    response = await client.client.get(direct_pdf_url)
    response.raise_for_status()
    return response.content


async def resolve_direct_pdf_bytes(
    data_publicacao: str,
    numero_materia: str,
) -> bytes:
    """[Legado] Baixa o PDF completo da edição por data/número.

    Mantido para compatibilidade. Para o fluxo com recorte, prefira
    ``download_legislacao_pdf``.
    """
    async with DiarioOficialClient() as client:
        return await _download_full_edition_pdf(client, data_publicacao, numero_materia)


async def download_legislacao_pdf(
    link_legislacao: str,
    data_publicacao: str,
    numero_materia: str,
) -> tuple[bytes, str]:
    """
    Baixa uma matéria legislativa individual e retorna o PDF recortado.

    Estratégia:
    1. Valida a URL de download.
    2. Abre uma sessão do ``DiarioOficialClient``.
    3. Busca metadados da matéria na API para obter o heading textual.
    4. Baixa o PDF completo da edição do DigitalOcean Spaces.
    5. Localiza o heading alvo no PDF via pdfplumber.
    6. Localiza o próximo heading (se houver) como limite superior.
    7. Recorta o PDF com pypdf para retornar apenas a matéria solicitada.

    Args:
        link_legislacao: URL protegida da matéria, usada para validação e nome.
        data_publicacao: Data da edição no formato DD/MM/YYYY.
        numero_materia: Número da matéria dentro da edição.

    Returns:
        Tupla (pdf_bytes, filename)
    """
    validate_download_url(link_legislacao)
    filename = build_download_filename(link_legislacao, numero_materia)

    async with DiarioOficialClient() as client:
        # 1. Metadados: título da matéria
        heading = await _resolve_materia_heading(
            client, data_publicacao, numero_materia, link_legislacao
        )

        # 2. Download do PDF completo da edição
        pdf_bytes = await _download_full_edition_pdf(
            client, data_publicacao, numero_materia
        )
    validate_pdf_content(pdf_bytes)

    if not heading:
        raise ValueError(
            "Não foi possível identificar a legislação solicitada dentro da edição "
            f"{data_publicacao} para a matéria {numero_materia}"
        )

    try:
        start_page, start_top = _find_heading_position(pdf_bytes, heading)
        end_info = _find_next_heading_edge(pdf_bytes, start_page, start_top)
        cropped = _crop_pdf_section(pdf_bytes, start_page, start_top, end_info)
        validate_pdf_content(cropped)
        pdf_bytes = cropped
        logger.info(
            "Recorte aplicado: página %d top=%.1f → %s (%d bytes)",
            start_page,
            start_top,
            f"página {end_info[0]} top={end_info[1]:.1f}" if end_info else "fim",
            len(pdf_bytes),
        )
    except ValueError as exc:
        raise ValueError(
            "Não foi possível isolar a legislação solicitada dentro da edição "
            f"{data_publicacao} para a matéria {numero_materia}"
        ) from exc

    logger.info(
        "Download OK: %s (%d bytes)",
        filename,
        len(pdf_bytes),
    )
    return pdf_bytes, filename
