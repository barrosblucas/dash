"""Serviço de orquestração do scraping do portal QualitySistemas.

Coordena a busca, parsing e persistência de receitas e despesas
com lógica de upsert e logging de execução.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from backend.features.despesa.despesa_scraper import DespesaScraper
from backend.features.despesa.despesa_types import Despesa
from backend.features.receita.receita_scraper import ReceitaScraper
from backend.features.scraping.scraping_helpers import (
    ScrapingResult,
    _create_log,
    _finalize_log,
    _replace_despesas_for_year,
    _replace_detalhamento,
    _replace_receitas_for_year,
    _try_log_error,
    _upsert_despesas,
    _upsert_receitas,
)
from backend.shared.database.connection import db_manager
from backend.shared.pdf_extractor import PDFExtractor
from backend.shared.quality_api_client import QualityAPIClient

logger = logging.getLogger(__name__)

_REALTIME_API_YEAR = 2026


class ScrapingService:
    """Orquestra o pipeline de scraping do QualitySistemas.

    Busca receitas e despesas via API, converte em entidades de domínio
    e persiste com lógica de upsert. Nunca propaga exceções — todas as
    falhas são capturadas e logadas para não derrubar o scheduler.
    """

    def __init__(self) -> None:
        self._api = QualityAPIClient()
        self._receita_parser = ReceitaScraper()
        self._despesa_parser = DespesaScraper()

    # ------------------------------------------------------------------
    # API pública
    # ------------------------------------------------------------------

    async def run_scraping(
        self, year: int = 2026, data_type: str = "all"
    ) -> dict[str, Any]:
        """Executa o pipeline de scraping. data_type: "receitas", "despesas" ou "all"."""
        results: list[ScrapingResult] = []
        errors: list[str] = []

        if data_type in ("receitas", "all"):
            r = await self.scrape_receitas(year)
            results.append(r)
            errors.extend(r.errors)

        if data_type in ("despesas", "all"):
            r = await self.scrape_despesas(year)
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

    async def scrape_receitas(self, year: int) -> ScrapingResult:
        """Pipeline de receitas: fetch → parse → upsert receitas + replace detalhamento."""
        log = _create_log("receitas", year)
        try:
            raw_monthly = await self._api.fetch_revenue_monthly(year)
            raw_detail = await self._api.fetch_revenue_detailing(year)
            receitas = self._receita_parser.parse_revenue_monthly(raw_monthly, year)
            detalhes = self._receita_parser.parse_revenue_detailing(raw_detail, year)

            if not receitas or not detalhes:
                raise RuntimeError(
                    "API de receitas retornou dados incompletos para persistência"
                )

            with db_manager.get_session() as session:
                if year == _REALTIME_API_YEAR:
                    ins, upd = _replace_receitas_for_year(session, receitas, year)
                else:
                    ins, upd = _upsert_receitas(session, receitas, year)
                det_cnt = _replace_detalhamento(session, detalhes, year)
                _finalize_log(
                    session, log, "SUCCESS", len(receitas) + det_cnt, ins + det_cnt, upd
                )

            logger.info(
                "Scraping receitas %d: %d ins, %d upd, %d detalhamento",
                year,
                ins,
                upd,
                det_cnt,
            )
            return ScrapingResult(
                True, "receitas", year, len(receitas) + det_cnt, ins + det_cnt, upd
            )
        except Exception as exc:
            msg = f"Erro scraping receitas {year}: {exc}"
            logger.error(msg, exc_info=True)
            _try_log_error("receitas", year, msg, log.started_at)
            return ScrapingResult(False, "receitas", year, 0, 0, 0, [msg])

    async def scrape_despesas(self, year: int) -> ScrapingResult:
        """Pipeline de despesas: fetch → parse → merge → upsert. API vazia = warning, não erro."""
        log = _create_log("despesas", year)
        try:
            raw_annual = await self._api.fetch_despesas_annual(year)
            raw_natureza = await self._api.fetch_despesas_natureza(year)
            annual = self._despesa_parser.parse_despesas_annual(raw_annual, year)
            natureza = self._despesa_parser.parse_despesas_natureza(raw_natureza, year)

            merged: list[Despesa] = []
            if annual:
                merged = self._despesa_parser.merge_despesas(annual, natureza)
            elif natureza:
                logger.warning(
                    "Dados por natureza disponíveis sem consolidado anual para %d; "
                    "ignorando natureza para evitar distorção de liquidado/pago",
                    year,
                )

            if not merged:
                if not raw_annual and not raw_natureza:
                    logger.warning(
                        "API de despesas retornou vazio para %d (possível erro 500)",
                        year,
                    )
                logger.warning("Tentando fallback de despesas via PDF para %d", year)
                merged = self._load_despesas_from_pdf(year)

            if not merged:
                message = (
                    f"Nenhum dado de despesas disponível para {year}; "
                    "mantendo snapshot anterior no banco"
                )
                logger.warning(message)
                with db_manager.get_session() as session:
                    _finalize_log(session, log, "NO_DATA", 0, 0, 0)
                return ScrapingResult(False, "despesas", year, 0, 0, 0, [message])

            with db_manager.get_session() as session:
                if year == _REALTIME_API_YEAR:
                    ins, upd = _replace_despesas_for_year(session, merged, year)
                else:
                    ins, upd = _upsert_despesas(session, merged, year)
                _finalize_log(session, log, "SUCCESS", len(merged), ins, upd)

            logger.info("Scraping despesas %d: %d ins, %d upd", year, ins, upd)
            return ScrapingResult(True, "despesas", year, len(merged), ins, upd)
        except Exception as exc:
            msg = f"Erro scraping despesas {year}: {exc}"
            logger.error(msg, exc_info=True)
            _try_log_error("despesas", year, msg, log.started_at)
            return ScrapingResult(False, "despesas", year, 0, 0, 0, [msg])

    def _load_despesas_from_pdf(self, year: int) -> list[Despesa]:
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
