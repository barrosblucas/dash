# governance-exception: file-length reason="CLI tool self-contained" ticket="CLI-001"
"""Download de legislação municipal via navegador real + reCAPTCHA v3.

Uso:
    python -m backend.scripts.scrape_legislacao_catalog --dry-run --max-pages 1
    python -m backend.scripts.scrape_legislacao_catalog
"""
from __future__ import annotations

import argparse
import asyncio
import base64
import csv
import logging
import re
import time
from pathlib import Path

from playwright.async_api import (
    Page,
    async_playwright,
)
from playwright.async_api import (
    TimeoutError as PwTimeout,
)

from backend.scripts.scrape_diario_oficial_models import (
    LEG_OUTPUT_DIR,
    LEG_PDFS_DIR,
)
from backend.scripts.scrape_diario_oficial_parsers import extract_lei_numero

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

FILTRO_URL = "https://www.diariooficialms.com.br/filtro"
SITE_KEY = "6LfpLPspAAAAAKXJ9Dcl1yOmvcvCBjjDxfNJql24"

_MESES: dict[str, str] = {
    "01": "janeiro", "02": "fevereiro", "03": "março",
    "04": "abril", "05": "maio", "06": "junho",
    "07": "julho", "08": "agosto", "09": "setembro",
    "10": "outubro", "11": "novembro", "12": "dezembro",
}


def _clean_title(titulo: str) -> str:
    texto = re.sub(r"<[^>]*>", " ", titulo)
    return re.sub(r"\s+", " ", texto).strip()


def _build_human_filename(titulo: str, data_publicacao: str) -> str:
    titulo_up = titulo.upper()
    tipo = "lei"
    if "MUNICIPAL" in titulo_up:
        tipo = "lei-municipal"
    elif "COMPLEMENTAR" in titulo_up:
        tipo = "lei-complementar"
    elif "ORDINÁRIA" in titulo_up:
        tipo = "lei-ordinaria"

    num = extract_lei_numero(titulo).replace(".", "")
    if "/" in num:
        num = num.split("/")[0]

    partes = data_publicacao.split("/")
    if len(partes) == 3:
        dia, mes, ano = partes
        mes_nome = _MESES.get(mes, mes)
        return f"{tipo}-no-{num}-de-{dia}-de-{mes_nome}-de-{ano}.pdf"
    return f"{tipo}-no-{num}.pdf"


def _is_lei(titulo: str) -> bool:
    return bool(extract_lei_numero(titulo))


def _save_catalog(entries: list[dict[str, str]], output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    csv_path = output_dir / "catalogo.csv"
    existing: set[str] = set()
    all_entries: list[dict[str, str]] = []

    if csv_path.exists():
        with open(csv_path, newline="", encoding="utf-8") as f:  # noqa: UP015
            for row in csv.DictReader(f):
                key = row.get("link_download", "")
                if key and key not in existing:
                    existing.add(key)
                    all_entries.append(row)

    for entry in entries:
        key = entry["link_download"]
        if key not in existing:
            existing.add(key)
            all_entries.append(entry)

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["nome_legislacao", "data_publicacao", "link_download"])
        for entry in all_entries:
            writer.writerow([entry["nome_legislacao"], entry["data_publicacao"], entry["link_download"]])

    logger.info("📋 Catálogo: %d leis em %s", len(all_entries), csv_path)
    return csv_path


async def _download_single(page: Page, download_url: str) -> bytes | None:
    js = f"""
        async () => {{
            const token = await grecaptcha.execute('{SITE_KEY}', {{action: 'message'}});
            const csrf = document.querySelector('input[name="_token"]')?.value || '';
            const body = 'grecaptcha=' + encodeURIComponent(token) +
                         '&_token=' + encodeURIComponent(csrf);
            const resp = await fetch('{download_url}', {{
                method: 'POST',
                headers: {{
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRF-TOKEN': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                }},
                body: body,
            }});
            const ct = resp.headers.get('content-type') || '';
            const text = await resp.text();
            if (ct.includes('application/pdf') || text.startsWith('%PDF')) {{
                const bytes = new TextEncoder().encode(text);
                let bin = '';
                for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
                return {{ ok: true, b64: btoa(bin), size: text.length }};
            }}
            return {{ ok: false, status: resp.status, ct }};
        }}
    """
    try:
        result = await page.evaluate(js)
        if result.get("ok") and result.get("b64"):
            return base64.b64decode(result["b64"])
        logger.warning("  ✗ Download: status=%s ct=%s", result.get("status"), result.get("ct"))
        return None
    except Exception as e:
        logger.warning("  ✗ Erro no download: %s", e)
        return None


async def _process_current_page(
    page: Page, pdfs_dir: Path, catalog_entries: list[dict[str, str]]
) -> int:
    rows = await page.evaluate("""
        () => {
            const rows = [];
            document.querySelectorAll('.action-baixar-materia').forEach(btn => {
                const form = btn.closest('form');
                if (!form) return;
                const tr = btn.closest('tr');
                const tds = tr ? tr.querySelectorAll('td') : [];
                const titulo = tds.length > 0 ? (tds[0].textContent || '').trim() : '';
                const action = form.getAttribute('action') || '';
                rows.push({ titulo, action });
            });
            return rows;
        }
    """)
    utils_js = """
        (action) => {
            const forms = document.querySelectorAll('form');
            for (const f of forms) {
                if (f.getAttribute('action') === action) {
                    const tr = f.closest('tr');
                    const tds = tr ? tr.querySelectorAll('td') : [];
                    return tds.length > 1 ? (tds[1].textContent || '').trim() : '';
                }
            }
            return '';
        }
    """

    downloaded = 0
    for row in rows or []:
        titulo = _clean_title(row.get("titulo", ""))
        action = row.get("action", "")
        if not titulo or not action or not _is_lei(titulo):
            continue

        data_publicacao = await page.evaluate(utils_js, action)
        filename = _build_human_filename(titulo, data_publicacao)
        output_path = pdfs_dir / filename

        if output_path.exists():
            logger.debug("  ⏭ Já existe: %s", filename)
            catalog_entries.append({"nome_legislacao": titulo, "data_publicacao": data_publicacao, "link_download": action})
            continue

        logger.info("  ⬇ %s", titulo[:80])
        pdf_bytes = await _download_single(page, action)

        if pdf_bytes and pdf_bytes.startswith(b"%PDF"):
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_bytes(pdf_bytes)
            logger.info("    ✅ %s (%d bytes)", filename, len(pdf_bytes))
            downloaded += 1
            catalog_entries.append({"nome_legislacao": titulo, "data_publicacao": data_publicacao, "link_download": action})
        else:
            logger.error("    ✗ Falha: %s", titulo[:60])
        await asyncio.sleep(0.8)
    return downloaded


async def _go_to_next_page(page: Page) -> bool:
    try:
        next_btn = page.locator("a.page-link:has-text('Próximo')")
        parent_li = next_btn.locator("..")
        is_disabled = await parent_li.get_attribute("class") or ""
        if "disabled" in is_disabled:
            return False
        await next_btn.click()
        await asyncio.sleep(2)
        await page.wait_for_selector(".action-baixar-materia", timeout=15000)
        return True
    except PwTimeout:
        return False


async def run(max_pages: int | None = None, dry_run: bool = False) -> tuple[int, int]:
    logger.info("=" * 60)
    logger.info("📜 Catálogo de Legislação Municipal - Diário Oficial MS")
    logger.info("   Cidade: Bandeirantes (ID: 71)")
    if dry_run:
        logger.info("   Modo: DRY-RUN")
    if max_pages:
        logger.info("   Máx páginas: %d", max_pages)
    logger.info("=" * 60)

    LEG_PDFS_DIR.mkdir(parents=True, exist_ok=True)
    catalog_entries: list[dict[str, str]] = []
    total_downloaded = 0

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=False,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )
        context = await browser.new_context(
            viewport={"width": 1366, "height": 768},
            user_agent=(
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
            ),
        )
        page = await context.new_page()

        logger.info("🌐 Abrindo página de busca...")
        await page.goto(FILTRO_URL, wait_until="networkidle", timeout=30000)
        await asyncio.sleep(1)

        logger.info("🔧 Expandindo filtro avançado...")
        await page.evaluate("""
            () => {
                const el = document.querySelector('#secao-de-filtro-avancado');
                if (el && !el.classList.contains('show') && typeof $ !== 'undefined') {
                    $('#secao-de-filtro-avancado').collapse('show');
                }
            }
        """)
        await asyncio.sleep(1)

        logger.info("🔍 Buscando 'LEI'...")
        await page.fill('[name="filtro[titulo]"]', "LEI", force=True)
        await asyncio.sleep(0.5)

        await page.evaluate("document.querySelector('#action-filtrar').click()")
        await page.wait_for_selector(".action-baixar-materia", timeout=15000)
        await asyncio.sleep(1.5)

        page_num = 0
        while True:
            page_num += 1
            logger.info("📄 Página %d", page_num)

            if dry_run:
                leis_info = await page.evaluate("""
                    () => {
                        const items = [];
                        document.querySelectorAll('.action-baixar-materia').forEach(btn => {
                            const tr = btn.closest('tr');
                            const tds = tr ? tr.querySelectorAll('td') : [];
                            const titulo = tds.length > 0 ? (tds[0].textContent || '').trim() : '';
                            const form = btn.closest('form');
                            const action = form ? form.getAttribute('action') : '';
                            items.push({ titulo, action });
                        });
                        return items;
                    }
                """)
                for lei_info in leis_info:
                    titulo = _clean_title(lei_info["titulo"] or "")
                    if _is_lei(titulo):
                        filename = _build_human_filename(titulo, "")
                        logger.info("  🔍 %s → %s", titulo[:70], filename)
                _save_catalog(catalog_entries, LEG_OUTPUT_DIR)
            else:
                downloaded = await _process_current_page(page, LEG_PDFS_DIR, catalog_entries)
                total_downloaded += downloaded
                _save_catalog(catalog_entries, LEG_OUTPUT_DIR)

            if max_pages and page_num >= max_pages:
                logger.info("🏁 Limite de %d páginas", max_pages)
                break

            has_next = await _go_to_next_page(page)
            if not has_next:
                logger.info("🏁 Última página")
                break

        await browser.close()
    return total_downloaded, len(catalog_entries)


def main() -> None:
    parser = argparse.ArgumentParser(description="Download legislação municipal via navegador real + reCAPTCHA")
    parser.add_argument("--max-pages", type=int, default=None)
    parser.add_argument("--dry-run", action="store_true", help="Simular sem download")
    parser.add_argument("--verbose", action="store_true", help="Log DEBUG")
    args = parser.parse_args()
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    start = time.monotonic()
    downloaded, catalog = asyncio.run(run(max_pages=args.max_pages, dry_run=args.dry_run))
    elapsed = time.monotonic() - start

    print()
    print("=" * 60)
    print("📊 RELATÓRIO FINAL")
    print(f"  Catálogo:              {catalog} leis")
    if not args.dry_run:
        print(f"  PDFs baixados:         {downloaded}")
    print(f"  PDFs em:               {LEG_PDFS_DIR}")
    print(f"  Catálogo CSV:          {LEG_OUTPUT_DIR / 'catalogo.csv'}")
    print(f"  Tempo total:           {elapsed:.1f}s")
    print("=" * 60)


if __name__ == "__main__":
    main()
