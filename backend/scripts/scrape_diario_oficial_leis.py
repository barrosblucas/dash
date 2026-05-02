"""
Script para busca e download de leis municipais do Diário Oficial MS - Bandeirantes.

Fonte: https://www.diariooficialms.com.br/bandeirantes
API de busca: GET /filtro (DataTables server-side)
Resolução de PDF: GET /bandeirantes?data=DD/MM/YYYY → links diretos Spaces
Download de PDF: GET direto do DigitalOcean Spaces

Uso:
    cd backend && source venv/bin/activate && \
    python -m backend.scripts.scrape_diario_oficial_leis

    # Modo simulação (apenas lista, sem download):
    python -m backend.scripts.scrape_diario_oficial_leis --dry-run

    # Busca por termo específico:
    python -m backend.scripts.scrape_diario_oficial_leis --term "LEI COMPLEMENTAR"

Saída:
    data/diario_oficial_leis/
    ├── pdfs/           # PDFs baixados (nome: edicao_{numero_materia}_{data}.pdf)
    └── catalogo.csv    # Catálogo: numero, titulo, data, link, pdf_local
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import logging
import sys
import time
from datetime import date
from pathlib import Path

from backend.scripts.scrape_diario_oficial_client import DiarioOficialClient
from backend.scripts.scrape_diario_oficial_models import (
    DATA_INICIO,
    DOWNLOAD_CONCURRENCY,
    OUTPUT_DIR,
    PDFS_DIR,
    REQUEST_DELAY,
    LeiItem,
    ScrapeResult,
)
from backend.scripts.scrape_diario_oficial_parsers import parse_item

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ─── Catálogo ─────────────────────────────────────────────────────────────────


def save_catalog(leis: list[LeiItem], output_dir: Path) -> Path:
    """Salva o catálogo de leis em CSV."""
    output_dir.mkdir(parents=True, exist_ok=True)
    csv_path = output_dir / "catalogo.csv"

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "id",
            "numero_lei",
            "ano",
            "titulo",
            "data_publicacao",
            "numero_materia",
            "direct_pdf_url",
            "pdf_local",
        ])

        for lei in leis:
            data_safe = lei.data_circulacao.replace("/", "-")
            pdf_filename = f"pdfs/edicao_{lei.numero_materia}_{data_safe}.pdf"
            writer.writerow([
                lei.id,
                lei.numero_lei,
                lei.ano_lei,
                lei.titulo,
                lei.data_circulacao,
                lei.numero_materia,
                lei.direct_pdf_url,
                pdf_filename,
            ])

    logger.info("📋 Catálogo salvo: %s (%d leis)", csv_path, len(leis))
    return csv_path


# ─── Orquestração ─────────────────────────────────────────────────────────────


def _pdf_filename(numero_materia: str, data_str: str) -> str:
    """Gera nome de arquivo para o PDF baseado na edição."""
    safe_data = data_str.replace("/", "-")
    return f"edicao_{numero_materia}_{safe_data}.pdf"


async def _resolve_pdf_links(
    client: DiarioOficialClient,
    leis: list[LeiItem],
) -> dict[str, str]:
    """Resolve links diretos de PDF a partir da página principal.

    Para cada data única onde há leis, faz uma requisição à página principal
    e mapeia numero_materia → url_direta_pdf.
    """
    # Agrupa leis por data
    datas: dict[str, list[LeiItem]] = {}
    for lei in leis:
        datas.setdefault(lei.data_circulacao, []).append(lei)

    logger.info("🔗 Resolvendo links diretos para %d datas...", len(datas))

    links_por_data: dict[str, dict[str, str]] = {}
    for data_str, _leis_da_data in datas.items():
        try:
            links_por_data[data_str] = await client.fetch_pdf_links_for_date(
                data_str
            )
            logger.debug(
                "  Data %s: %d links encontrados",
                data_str,
                len(links_por_data[data_str]),
            )
        except Exception as e:
            logger.warning("  ⚠ Falha ao resolver data %s: %s", data_str, e)
            links_por_data[data_str] = {}

        await asyncio.sleep(REQUEST_DELAY)

    # Atribui direct_pdf_url para cada lei
    leis_sem_link = 0
    for lei in leis:
        links = links_por_data.get(lei.data_circulacao, {})
        pdf_url = links.get(lei.numero_materia, "")
        if pdf_url:
            lei.direct_pdf_url = pdf_url
        else:
            leis_sem_link += 1
            logger.warning(
                "  ⚠ Sem link para lei %s (matéria %s, data %s)",
                lei.numero_lei,
                lei.numero_materia,
                lei.data_circulacao,
            )

    logger.info(
        "✅ Links resolvidos: %d/%d leis com PDF, %d sem link",
        len(leis) - leis_sem_link,
        len(leis),
        leis_sem_link,
    )

    # Retorna mapeamento de URLs únicas para nome do arquivo
    pdf_map: dict[str, str] = {}
    for lei in leis:
        if lei.direct_pdf_url:
            data_safe = lei.data_circulacao.replace("/", "-")
            pdf_map[lei.direct_pdf_url] = _pdf_filename(
                lei.numero_materia, data_safe
            )

    return pdf_map


async def _download_unique_pdfs(
    client: DiarioOficialClient,
    pdf_map: dict[str, str],
    pdfs_dir: Path,
    dry_run: bool,
    sem: asyncio.Semaphore,
) -> tuple[int, int, int]:
    """Baixa PDFs únicos (um por URL).

    Returns:
        (baixadas, erros, puladas)
    """
    baixadas = 0
    erros = 0
    puladas = 0

    async def _download_one(pdf_url: str, filename: str) -> None:
        nonlocal baixadas, erros, puladas

        async with sem:
            output_path = pdfs_dir / filename

            if dry_run:
                logger.info(
                    "  🔍 [DRY-RUN] %s -> %s", pdf_url[-60:], filename
                )
                return

            if output_path.exists():
                logger.debug("  ⏭ Já existe: %s", filename)
                puladas += 1
                return

            logger.info("  ⬇ Baixando: %s", filename)
            success = await client.download_pdf(pdf_url, output_path)
            if success:
                baixadas += 1
                await asyncio.sleep(0.3)
            else:
                erros += 1

    tasks = [_download_one(url, filename) for url, filename in pdf_map.items()]
    await asyncio.gather(*tasks)

    return baixadas, erros, puladas


async def run_scrape(
    term: str = "LEI",
    data_inicio: str = DATA_INICIO,
    data_fim: str | None = None,
    max_results: int | None = None,
    dry_run: bool = False,
) -> ScrapeResult:
    """Executa o scraping completo."""
    if data_fim is None:
        data_fim = date.today().strftime("%d/%m/%Y")

    logger.info("=" * 60)
    logger.info("🔍 Buscando leis do Diário Oficial MS - Bandeirantes")
    logger.info("   Termo: '%s'", term)
    logger.info("   Período: %s → %s", data_inicio, data_fim)
    if dry_run:
        logger.info("   Modo: DRY-RUN (sem download)")
    logger.info("=" * 60)

    result = ScrapeResult()

    async with DiarioOficialClient() as client:
        # 1. Buscar todos os resultados
        logger.info("📡 Consultando API...")
        raw_items = await client.fetch_all_pages(
            term=term,
            data_inicio=data_inicio,
            data_fim=data_fim,
            max_results=max_results,
        )

        logger.info("✅ Total de itens brutos recebidos: %d", len(raw_items))

        # 2. Parsear itens
        seen_ids: set[str] = set()
        for raw in raw_items:
            item = parse_item(raw)
            if item is None or item.id in seen_ids:
                continue
            seen_ids.add(item.id)
            result.leis.append(item)

        result.total_encontradas = len(result.leis)
        logger.info("📊 Leis únicas parseadas: %d", result.total_encontradas)

        # 3. Exibir resumo por ano
        anos: dict[str, int] = {}
        for lei in result.leis:
            ano = lei.ano_lei or lei.data_circulacao[-4:]
            anos[ano] = anos.get(ano, 0) + 1

        logger.info("   Distribuição por ano:")
        for ano in sorted(anos.keys()):
            logger.info("     %s: %d leis", ano, anos[ano])

        # 4. Resolver links diretos de PDF
        pdf_map = await _resolve_pdf_links(client, result.leis)

        # 5. Salvar catálogo
        save_catalog(result.leis, OUTPUT_DIR)

        # 6. Download dos PDFs únicos
        if pdf_map:
            PDFS_DIR.mkdir(parents=True, exist_ok=True)
            sem = asyncio.Semaphore(DOWNLOAD_CONCURRENCY)

            if dry_run:
                logger.info(
                    "🔍 Modo DRY-RUN: simulando download de %d PDFs únicos",
                    len(pdf_map),
                )
                baixadas, erros, puladas = await _download_unique_pdfs(
                    client, pdf_map, PDFS_DIR, dry_run=True, sem=sem
                )
                result.baixadas = 0
                result.erros_download = 0
                result.puladas = 0
            else:
                logger.info(
                    "📥 Iniciando download de %d PDFs únicos...", len(pdf_map)
                )
                baixadas, erros, puladas = await _download_unique_pdfs(
                    client, pdf_map, PDFS_DIR, dry_run=False, sem=sem
                )
                result.baixadas = baixadas
                result.erros_download = erros
                result.puladas = puladas

    return result


# ─── CLI ──────────────────────────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Busca e download de leis do Diário Oficial MS - Bandeirantes",
    )
    parser.add_argument(
        "--term",
        default="LEI",
        help='Termo de busca no título (default: "LEI")',
    )
    parser.add_argument(
        "--data-inicio",
        default=DATA_INICIO,
        help=f"Data inicial DD/MM/YYYY (default: {DATA_INICIO})",
    )
    parser.add_argument(
        "--data-fim",
        default=None,
        help="Data final DD/MM/YYYY (default: hoje)",
    )
    parser.add_argument(
        "--max-results",
        type=int,
        default=None,
        help="Limite máximo de resultados (default: sem limite)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Apenas lista as leis encontradas, sem fazer download",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Log detalhado (DEBUG)",
    )

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

    # ─── Relatório final ──────────────────────────────────────────────────
    print()
    print("=" * 60)
    print("📊 RELATÓRIO FINAL")
    print("=" * 60)
    print(f"  Termo buscado:       {args.term}")
    print(
        f"  Período:             {args.data_inicio} → "
        f"{args.data_fim or date.today().strftime('%d/%m/%Y')}"
    )
    print(f"  Leis encontradas:    {result.total_encontradas}")
    if args.dry_run:
        print("  Modo:                DRY-RUN (sem download)")
    else:
        print(f"  PDFs baixados:       {result.baixadas}")
        print(f"  Já existiam:         {result.puladas}")
        print(f"  Erros de download:   {result.erros_download}")
    print(f"  Catálogo:            {OUTPUT_DIR / 'catalogo.csv'}")
    print(f"  PDFs em:             {PDFS_DIR}")
    print(f"  Tempo total:         {elapsed:.1f}s")
    print("=" * 60)

    if result.erros_download > 0:
        print(
            "\n⚠ Alguns downloads falharam. "
            "Execute novamente para tentar baixar os que faltaram."
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
