"""
Modelos de dados e configurações para o scraper do Diário Oficial MS.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

# ─── Config ───────────────────────────────────────────────────────────────────

BASE_URL = "https://www.diariooficialms.com.br"
FILTRO_URL = f"{BASE_URL}/filtro"
CIDADE_ID = "71"  # Bandeirantes
DATA_INICIO = "03/07/2020"  # Primeiro registro disponível no site
PAGE_SIZE = 100  # Máximo por página na API DataTables
REQUEST_DELAY = 0.5  # Delay entre requisições (segundos)
DOWNLOAD_CONCURRENCY = 3  # Downloads paralelos

# Diretório de saída (relativo à raiz do projeto)
OUTPUT_DIR = (
    Path(__file__).resolve().parent.parent.parent / "data" / "diario_oficial_leis"
)
PDFS_DIR = OUTPUT_DIR / "pdfs"

# Header obrigatório para receber JSON da API
HEADERS = {
    "X-Requested-With": "XMLHttpRequest",
    "Accept": "application/json",
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
}


# ─── Modelos ──────────────────────────────────────────────────────────────────


@dataclass
class LeiItem:
    """Item de lei extraído da API."""

    id: str
    titulo: str
    data_circulacao: str
    numero_materia: str
    direct_pdf_url: str = ""  # Link direto do Spaces (preenchido na resolução)
    # Campos derivados
    numero_lei: str = ""
    ano_lei: str = ""


@dataclass
class ScrapeResult:
    """Resultado completo do scraping."""

    total_encontradas: int = 0
    leis: list[LeiItem] = field(default_factory=list)
    baixadas: int = 0
    erros_download: int = 0
    puladas: int = 0


# ─── Config Legislação Municipal ──────────────────────────────────────────────

LEG_OUTPUT_DIR = (
    Path(__file__).resolve().parent.parent.parent / "data" / "legislacao_municipal"
)
LEG_PDFS_DIR = LEG_OUTPUT_DIR / "pdfs"
LEG_ANEXOS_DIR = LEG_OUTPUT_DIR / "anexos"
LEG_DOWNLOAD_TIMEOUT = 60  # seconds per download

PAGE_URL = f"{BASE_URL}/filtro"
RECAPTCHA_SITE_KEY = "6LfpLPspAAAAAKXJ9Dcl1yOmvcvCBjjDxfNJql24"


# ─── Modelos Legislação Municipal ─────────────────────────────────────────────


@dataclass
class LegislacaoItem:
    """Item de legislação municipal com link para download individual."""

    id: str
    titulo: str
    data_circulacao: str
    numero_materia: str
    numero_lei: str = ""
    ano_lei: str = ""
    link_legislacao: str = ""  # URL /baixar-materia/{id}/{hash}
    download_hash: str = ""  # Hash extraído do link
    link_diario_oficial: str = ""  # Link direto do DigitalOcean Spaces
    anexo_habilitado: bool = False
    anexos: list[str] = field(default_factory=list)
    # Preenchido após download
    pdf_legislacao_local: str = ""
    anexos_locais: list[str] = field(default_factory=list)


@dataclass
class LegislacaoScrapeResult:
    """Resultado completo do scraping de legislação municipal."""

    total_encontradas: int = 0
    legislacoes: list[LegislacaoItem] = field(default_factory=list)
    baixadas: int = 0
    erros_download: int = 0
    puladas: int = 0
    anexos_baixados: int = 0
    anexos_erros: int = 0
