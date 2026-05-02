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
OUTPUT_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "diario_oficial_leis"
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
