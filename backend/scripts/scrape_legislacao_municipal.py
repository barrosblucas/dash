"""
Script para download de matérias legislativas individuais do Diário Oficial MS.

Usa Playwright para automação de navegador e contornar proteção reCAPTCHA v3.
Busca itens na API /filtro (DataTables), extrai links /baixar-materia/{id}/{hash},
obtém token reCAPTCHA via grecaptcha.execute() e faz POST para baixar cada PDF.

Uso:
    python -m backend.scripts.scrape_legislacao_municipal [--dry-run] [--term "LEI"]
"""

from __future__ import annotations

import argparse
import asyncio
import base64
import csv
import logging
import sys
import time
from datetime import date
from pathlib import Path

from backend.scripts.scrape_diario_oficial_client import DiarioOficialClient
from backend.scripts.scrape_diario_oficial_models import (
    CIDADE_ID,
    DATA_INICIO,
    LEG_DOWNLOAD_TIMEOUT,
    LEG_OUTPUT_DIR,
    LEG_PDFS_DIR,
    PAGE_URL,
    RECAPTCHA_SITE_KEY,
    LegislacaoItem,
    LegislacaoScrapeResult,
)
from backend.scripts.scrape_diario_oficial_parsers import parse_legislacao_item

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


def _pdf_filename(numero_materia: str, data_str: str) -> str:
    safe_data = data_str.replace("/", "-")
    return f"materia_{numero_materia}_{safe_data}.pdf"


# ─── Catálogo CSV ─────────────────────────────────────────────────────────────


def save_catalog(items: list[LegislacaoItem], output_dir: Path) -> Path:
    """Salva catálogo de legislação em CSV com metadados de cada item."""
    output_dir.mkdir(parents=True, exist_ok=True)
    csv_path = output_dir / "catalogo.csv"

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(
            [
                "id",
                "numero_lei",
                "ano",
                "titulo",
                "data_publicacao",
                "numero_materia",
                "link_legislacao",
                "link_diario_oficial",
                "anexo_habilitado",
                "pdf_legislacao_local",
                "anexos_locais",
            ]
        )
        for item in items:
            writer.writerow(
                [
                    item.id,
                    item.numero_lei,
                    item.ano_lei,
                    item.titulo,
                    item.data_circulacao,
                    item.numero_materia,
                    item.link_legislacao,
                    item.link_diario_oficial,
                    "1" if item.anexo_habilitado else "0",
                    item.pdf_legislacao_local,
                    ";".join(item.anexos_locais) if item.anexos_locais else "",
                ]
            )
    logger.info("📋 Catálogo salvo: %s (%d itens)", csv_path, len(items))
    return csv_path


# ─── Download com Playwright ──────────────────────────────────────────────────


async def _download_single_materia(
    page: object,
    download_url: str,
    output_path: Path,
    site_key: str,
) -> bool:
    """Baixa matéria via POST com token reCAPTCHA v3, retorna True se sucesso."""
    import playwright.async_api as pw_api  # noqa: PLC0415

    page_obj: pw_api.Page = page  # type: ignore[assignment]

    try:
        result = await page_obj.evaluate(
            """async ({ url, siteKey }) => {
            const maxWait = 15000, start = Date.now();
            while (typeof grecaptcha === 'undefined' ||
                   typeof grecaptcha.execute === 'undefined') {
                if (Date.now() - start > maxWait)
                    throw new Error('grecaptcha timeout');
                await new Promise(r => setTimeout(r, 200));
            }
            const token = await grecaptcha.execute(siteKey, {action: 'baixar_materia'});
            const resp = await fetch(url, {
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body: 'g-recaptcha-response=' + encodeURIComponent(token),
            });
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const buf = await resp.arrayBuffer();
            const bytes = new Uint8Array(buf);
            let bin = '';
            for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
            return btoa(bin);
        }""",
            {"url": download_url, "siteKey": site_key},
        )

        pdf_bytes = base64.b64decode(result)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(pdf_bytes)
        return True
    except Exception as e:
        logger.warning("  ✗ Falha ao baixar %s: %s", download_url[-60:], e)
        return False


async def _download_all_materias(
    items: list[LegislacaoItem],
    pdfs_dir: Path,
    dry_run: bool,
) -> tuple[int, int, int]:
    """Baixa matérias em sequência via Playwright com retry até 3x.

    Returns:
        (baixadas, erros, puladas)
    """
    if dry_run:
        for item in items:
            logger.info("  🔍 [DRY-RUN] %s - %s", item.numero_lei, item.titulo[:60])
        return 0, 0, 0
    if not items:
        return 0, 0, 0

    try:
        from playwright.async_api import async_playwright  # noqa: PLC0415
    except ImportError:
        logger.error(
            "❌ Playwright não instalado. pip install playwright && playwright install chromium"
        )
        return 0, len(items), 0

    baixadas = erros = puladas = 0

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 720},
        )
        page = await context.new_page()
        page.set_default_timeout(LEG_DOWNLOAD_TIMEOUT * 1000)

        logger.info("🌐 Inicializando sessão do navegador em %s ...", PAGE_URL)
        try:
            await page.goto(PAGE_URL, wait_until="networkidle", timeout=30000)
            await asyncio.sleep(2)
        except Exception as e:
            logger.warning("  ⚠ Falha ao carregar página inicial: %s", e)

        for i, item in enumerate(items, 1):
            output_path = pdfs_dir / _pdf_filename(
                item.numero_materia, item.data_circulacao
            )
            if output_path.exists():
                logger.debug(
                    "  ⏭ [%d/%d] Já existe: %s", i, len(items), output_path.name
                )
                puladas += 1
                continue
            if not item.link_legislacao:
                logger.warning(
                    "  ⏭ [%d/%d] Sem link: %s", i, len(items), item.numero_lei
                )
                puladas += 1
                continue

            logger.info(
                "  ⬇ [%d/%d] %s - %s", i, len(items), item.numero_lei, item.titulo[:60]
            )
            success = False
            for attempt in range(3):
                success = await _download_single_materia(
                    page,
                    item.link_legislacao,
                    output_path,
                    RECAPTCHA_SITE_KEY,
                )
                if success:
                    break
                if attempt < 2:
                    await asyncio.sleep(2**attempt)

            if success:
                baixadas += 1
                item.pdf_legislacao_local = f"pdfs/{output_path.name}"
                logger.info("    ✅ %s", output_path.name)
            else:
                erros += 1
                logger.error("    ✗ Falha: %s", item.numero_lei)
            await asyncio.sleep(1)

        await browser.close()
    return baixadas, erros, puladas


# ─── Orquestração ─────────────────────────────────────────────────────────────


async def run_scrape(
    term: str = "LEI",
    data_inicio: str = DATA_INICIO,
    data_fim: str | None = None,
    max_results: int | None = None,
    dry_run: bool = False,
) -> LegislacaoScrapeResult:
    """Executa scraping completo: busca API → parse → catálogo → download."""
    if data_fim is None:
        data_fim = date.today().strftime("%d/%m/%Y")

    logger.info("=" * 60)
    logger.info("📜 Buscando legislação municipal - Diário Oficial MS")
    logger.info("   Cidade: Bandeirantes (ID: %s)", CIDADE_ID)
    logger.info("   Termo: '%s' | Período: %s → %s", term, data_inicio, data_fim)
    if dry_run:
        logger.info("   Modo: DRY-RUN")
    logger.info("=" * 60)

    result = LegislacaoScrapeResult()

    async with DiarioOficialClient() as client:
        logger.info("📡 Consultando API...")
        raw_items = await client.fetch_all_pages(
            term=term,
            data_inicio=data_inicio,
            data_fim=data_fim,
            max_results=max_results,
        )
        logger.info("✅ Itens brutos: %d", len(raw_items))

        seen_ids: set[str] = set()
        for raw in raw_items:
            item = parse_legislacao_item(raw)
            if item is None or item.id in seen_ids:
                continue
            seen_ids.add(item.id)
            result.legislacoes.append(item)

        result.total_encontradas = len(result.legislacoes)
        logger.info("📊 Legislações únicas: %d", result.total_encontradas)

        if result.total_encontradas == 0:
            logger.warning("⚠ Nenhuma legislação encontrada.")
            return result

        anos: dict[str, int] = {}
        for item in result.legislacoes:
            ano = item.ano_lei or item.data_circulacao[-4:]
            anos[ano] = anos.get(ano, 0) + 1
        logger.info("   Por ano: %s", dict(sorted(anos.items())))

        LEG_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        save_catalog(result.legislacoes, LEG_OUTPUT_DIR)

        if dry_run:
            logger.info("🔍 DRY-RUN: %d matérias simuladas", len(result.legislacoes))
            baixadas = erros = puladas = 0
        else:
            logger.info("📥 Download de %d matérias...", len(result.legislacoes))
            LEG_PDFS_DIR.mkdir(parents=True, exist_ok=True)
            baixadas, erros, puladas = await _download_all_materias(
                result.legislacoes,
                LEG_PDFS_DIR,
                dry_run=False,
            )

        result.baixadas = baixadas
        result.erros_download = erros
        result.puladas = puladas

    return result


# ─── CLI ──────────────────────────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Download de legislação municipal do Diário Oficial MS",
    )
    parser.add_argument("--term", default="LEI", help='Termo de busca (default: "LEI")')
    parser.add_argument(
        "--data-inicio",
        default=DATA_INICIO,
        help=f"Data inicial DD/MM/YYYY (default: {DATA_INICIO})",
    )
    parser.add_argument(
        "--data-fim", default=None, help="Data final DD/MM/YYYY (default: hoje)"
    )
    parser.add_argument(
        "--max-results", type=int, default=None, help="Limite máximo de resultados"
    )
    parser.add_argument("--dry-run", action="store_true", help="Simular sem download")
    parser.add_argument("--verbose", action="store_true", help="Log DEBUG")

    args = parser.parse_args()
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    start_time = time.monotonic()
    result = asyncio.run(
        run_scrape(
            term=args.term,
            data_inicio=args.data_inicio,
            data_fim=args.data_fim,
            max_results=args.max_results,
            dry_run=args.dry_run,
        )
    )
    elapsed = time.monotonic() - start_time

    print()
    print("=" * 60)
    print("📊 RELATÓRIO FINAL")
    print("=" * 60)
    print(f"  Termo:                 {args.term}")
    print(
        f"  Período:               {args.data_inicio} → {args.data_fim or date.today().strftime('%d/%m/%Y')}"
    )
    print(f"  Legislações:           {result.total_encontradas}")
    if args.dry_run:
        print("  Modo:                  DRY-RUN")
    else:
        print(f"  PDFs baixados:         {result.baixadas}")
        print(f"  Já existiam:           {result.puladas}")
        print(f"  Erros:                 {result.erros_download}")
    print(f"  Catálogo:              {LEG_OUTPUT_DIR / 'catalogo.csv'}")
    print(f"  PDFs em:               {LEG_PDFS_DIR}")
    print(f"  Tempo total:           {elapsed:.1f}s")
    print("=" * 60)

    if result.erros_download > 0:
        print(
            "\n⚠ Alguns downloads falharam. Execute novamente para tentar os que faltaram."
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
