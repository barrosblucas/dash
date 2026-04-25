"""Serviço de bootstrap histórico para o scraping do portal QualitySistemas."""

from __future__ import annotations

import hashlib
import json
import logging
from pathlib import Path
from typing import Any

from backend.features.despesa.despesa_types import Despesa
from backend.features.scraping.scraping_helpers import (
    ScrapingResult,
    _is_year_fully_synced,
)
from backend.shared.database.connection import db_manager
from backend.shared.pdf_extractor import PDFExtractor

logger = logging.getLogger(__name__)

_HISTORICAL_START_YEAR = 2013
_REALTIME_API_YEAR = 2026


def _compute_payload_hash(data: Any) -> str:
    """Calcula SHA-256 canônico de um payload para detecção de mudanças."""
    canonical = json.dumps(data, sort_keys=True, ensure_ascii=False, default=str)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


async def _run_scraping(
    service: Any, year: int, data_type: str
) -> dict[str, Any]:
    """Executa o pipeline de scraping. data_type: "receitas", "despesas" ou "all"."""
    results: list[ScrapingResult] = []
    errors: list[str] = []

    if data_type in ("receitas", "all"):
        r = await service.scrape_receitas(year)
        results.append(r)
        errors.extend(r.errors)

    if data_type in ("despesas", "all"):
        r = await service.scrape_despesas(year)
        results.append(r)
        errors.extend(r.errors)

    total_ins = sum(r.records_inserted for r in results)
    total_upd = sum(r.records_updated for r in results)
    all_ok = all(r.success for r in results) and bool(results)
    any_ok = any(r.success for r in results)

    status = "SUCCESS" if all_ok else ("PARTIAL" if any_ok else "ERROR")

    rec_proc = (
        results[0].records_processed
        if data_type in ("receitas", "all") and results
        else 0
    )
    desp_proc = (
        results[-1].records_processed
        if data_type in ("despesas", "all") and results
        else 0
    )

    return {
        "status": status,
        "receitas_processed": rec_proc,
        "despesas_processed": desp_proc,
        "total_inserted": total_ins,
        "total_updated": total_upd,
        "errors": errors,
    }


async def _run_full_scraping(service: Any, year: int) -> dict[str, Any]:
    """Executa scraping completo para um ano: receitas, despesas, breakdowns, unidades."""
    results: list[ScrapingResult] = []
    errors: list[str] = []

    receitas_result = await service.scrape_receitas(year)
    results.append(receitas_result)
    errors.extend(receitas_result.errors)

    despesas_result = await service.scrape_despesas(year)
    results.append(despesas_result)
    errors.extend(despesas_result.errors)

    breakdown_results = await service.scrape_despesas_breakdown(year)
    results.extend(breakdown_results)
    for br in breakdown_results:
        errors.extend(br.errors)

    # Unidades gestoras only for the latest year or if not yet synced
    if year == _REALTIME_API_YEAR:
        unidades_result = await service.scrape_unidades_gestoras(year)
        results.append(unidades_result)
        errors.extend(unidades_result.errors)

    total_ins = sum(r.records_inserted for r in results)
    total_upd = sum(r.records_updated for r in results)
    all_ok = all(r.success for r in results) and bool(results)
    any_ok = any(r.success for r in results)

    status = "SUCCESS" if all_ok else ("PARTIAL" if any_ok else "ERROR")

    return {
        "status": status,
        "year": year,
        "receitas_processed": receitas_result.records_processed,
        "despesas_processed": despesas_result.records_processed,
        "total_inserted": total_ins,
        "total_updated": total_upd,
        "errors": errors,
    }


def _load_despesas_from_pdf_impl(year: int) -> list[Despesa]:
    """Carrega despesas do PDF do ano como fallback quando a API falha."""
    dados_dir = Path(__file__).resolve().parent.parent.parent

    try:
        extractor = PDFExtractor(dados_dir)
        resultado = extractor.extract_despesas(ano=year)
    except Exception as exc:
        logger.error(
            "Falha ao executar fallback de despesas via PDF para %d: %s",
            year,
            exc,
        )
        return []

    if resultado.erro:
        logger.warning(
            "Fallback PDF de despesas para %d concluiu com avisos: %s",
            year,
            resultado.erro,
        )

    if resultado.despesas:
        logger.info(
            "Fallback PDF de despesas para %d retornou %d registros",
            year,
            len(resultado.despesas),
        )
    else:
        logger.warning(
            "Fallback PDF de despesas para %d não retornou registros", year
        )

    return resultado.despesas


class HistoricalAPIBootstrapService:
    """Executa bootstrap histórico de sincronização de dados."""

    def __init__(self, scraping_service: Any) -> None:
        self._service = scraping_service

    async def run_historical_bootstrap(self) -> dict[str, Any]:
        """Executa bootstrap histórico de 2013 até o ano anterior ao real-time."""
        years_processed: list[int] = []
        errors: list[str] = []

        for year in range(_HISTORICAL_START_YEAR, _REALTIME_API_YEAR):
            with db_manager.get_session() as session:
                if _is_year_fully_synced(session, year):
                    logger.info(
                        "Bootstrap: ano %d já completamente sincronizado, pulando", year
                    )
                    continue

            logger.info("Bootstrap: executando scraping completo para ano %d", year)
            result = await self._service.run_full_scraping(year)
            years_processed.append(year)
            errors.extend(result.get("errors", []))

        return {
            "status": "SUCCESS" if not errors else "PARTIAL",
            "years_processed": years_processed,
            "total_years": len(years_processed),
            "errors": errors,
        }
