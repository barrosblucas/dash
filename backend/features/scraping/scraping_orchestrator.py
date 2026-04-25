"""Serviço de orquestração do scraping do portal QualitySistemas.

Coordena a busca, parsing e persistência de receitas e despesas
com lógica de upsert e logging de execução.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from backend.features.despesa.despesa_scraper import DespesaScraper
from backend.features.despesa.despesa_types import Despesa
from backend.features.receita.receita_scraper import ReceitaScraper
from backend.features.scraping.historical_api_bootstrap_service import (
    HistoricalAPIBootstrapService,
    _compute_payload_hash,
    _load_despesas_from_pdf_impl,
    _run_full_scraping,
    _run_scraping,
)
from backend.features.scraping.scraping_helpers import (
    ScrapingResult,
    _create_log,
    _finalize_log,
    _get_sync_state_hash,
    _replace_breakdown_for_year,
    _replace_despesas_for_year,
    _replace_detalhamento,
    _replace_receitas_for_year,
    _replace_unidades_gestoras,
    _try_log_error,
    _upsert_despesas,
    _upsert_receitas,
    _upsert_sync_state,
)
from backend.shared.database.connection import db_manager
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

    @staticmethod
    def _compute_payload_hash(data: Any) -> str:
        """Calcula SHA-256 canônico de um payload para detecção de mudanças."""
        return _compute_payload_hash(data)

    async def run_scraping(
        self, year: int = 2026, data_type: str = "all"
    ) -> dict[str, Any]:
        """Executa o pipeline de scraping. data_type: "receitas", "despesas" ou "all"."""
        return await _run_scraping(self, year, data_type)

    async def run_full_scraping(self, year: int) -> dict[str, Any]:
        """Executa scraping completo para um ano: receitas, despesas, breakdowns, unidades."""
        return await _run_full_scraping(self, year)

    async def run_historical_bootstrap(self) -> dict[str, Any]:
        """Executa bootstrap histórico de 2013 até o ano anterior ao real-time."""
        return await HistoricalAPIBootstrapService(self).run_historical_bootstrap()

    async def scrape_receitas(self, year: int) -> ScrapingResult:
        """Pipeline de receitas: fetch → hash check → parse → upsert receitas + replace detalhamento."""
        started_at = datetime.now()
        try:
            raw_monthly = await self._api.fetch_revenue_monthly(year)
            raw_detail = await self._api.fetch_revenue_detailing(year)

            combined_raw = {"monthly": raw_monthly, "detailing": raw_detail}
            payload_hash = _compute_payload_hash(combined_raw)

            with db_manager.get_session() as session:
                stored_hash = _get_sync_state_hash(session, "receitas", year)
                if stored_hash == payload_hash:
                    log = _create_log(session, "receitas", year)
                    _finalize_log(session, log, "NO_CHANGE", 0, 0, 0)
                    _upsert_sync_state(
                        session, "receitas", year, payload_hash, 0, "NO_CHANGE"
                    )
                    logger.info(
                        "Scraping receitas %d: sem alterações (hash match)", year
                    )
                    return ScrapingResult(
                        True, "receitas", year, 0, 0, 0, ["NO_CHANGE"]
                    )

                receitas = self._receita_parser.parse_revenue_monthly(
                    raw_monthly, year
                )
                detalhes = self._receita_parser.parse_revenue_detailing(
                    raw_detail, year
                )

                if not receitas or not detalhes:
                    raise RuntimeError(
                        "API de receitas retornou dados incompletos para persistência"
                    )

                log = _create_log(session, "receitas", year)
                if year == _REALTIME_API_YEAR:
                    ins, upd = _replace_receitas_for_year(session, receitas, year)
                else:
                    ins, upd = _upsert_receitas(session, receitas, year)
                det_cnt = _replace_detalhamento(session, detalhes, year)
                _finalize_log(
                    session,
                    log,
                    "SUCCESS",
                    len(receitas) + det_cnt,
                    ins + det_cnt,
                    upd,
                )
                _upsert_sync_state(
                    session,
                    "receitas",
                    year,
                    payload_hash,
                    len(receitas) + det_cnt,
                    "SUCCESS",
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
            _try_log_error("receitas", year, msg, started_at)
            return ScrapingResult(False, "receitas", year, 0, 0, 0, [msg])

    async def scrape_despesas(self, year: int) -> ScrapingResult:
        """Pipeline de despesas: fetch → hash check → parse → merge → upsert. API vazia = warning, não erro."""
        started_at = datetime.now()
        try:
            raw_annual = await self._api.fetch_despesas_annual(year)
            raw_natureza = await self._api.fetch_despesas_natureza(year)

            combined_raw = {"annual": raw_annual, "natureza": raw_natureza}
            payload_hash = _compute_payload_hash(combined_raw)

            with db_manager.get_session() as session:
                stored_hash = _get_sync_state_hash(session, "despesas", year)
                if stored_hash == payload_hash:
                    log = _create_log(session, "despesas", year)
                    _finalize_log(session, log, "NO_CHANGE", 0, 0, 0)
                    _upsert_sync_state(
                        session, "despesas", year, payload_hash, 0, "NO_CHANGE"
                    )
                    logger.info(
                        "Scraping despesas %d: sem alterações (hash match)", year
                    )
                    return ScrapingResult(
                        True, "despesas", year, 0, 0, 0, ["NO_CHANGE"]
                    )

                annual = self._despesa_parser.parse_despesas_annual(raw_annual, year)
                natureza = self._despesa_parser.parse_despesas_natureza(
                    raw_natureza, year
                )

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
                    logger.warning(
                        "Tentando fallback de despesas via PDF para %d", year
                    )
                    merged = self._load_despesas_from_pdf(year)

                if not merged:
                    message = (
                        f"Nenhum dado de despesas disponível para {year}; "
                        "mantendo snapshot anterior no banco"
                    )
                    logger.warning(message)
                    log = _create_log(session, "despesas", year)
                    _finalize_log(session, log, "NO_DATA", 0, 0, 0)
                    return ScrapingResult(
                        False, "despesas", year, 0, 0, 0, [message]
                    )

                log = _create_log(session, "despesas", year)
                if year == _REALTIME_API_YEAR:
                    ins, upd = _replace_despesas_for_year(session, merged, year)
                else:
                    ins, upd = _upsert_despesas(session, merged, year)
                _finalize_log(session, log, "SUCCESS", len(merged), ins, upd)
                _upsert_sync_state(
                    session, "despesas", year, payload_hash, len(merged), "SUCCESS"
                )

            logger.info("Scraping despesas %d: %d ins, %d upd", year, ins, upd)
            return ScrapingResult(True, "despesas", year, len(merged), ins, upd)
        except Exception as exc:
            msg = f"Erro scraping despesas {year}: {exc}"
            logger.error(msg, exc_info=True)
            _try_log_error("despesas", year, msg, started_at)
            return ScrapingResult(False, "despesas", year, 0, 0, 0, [msg])

    async def scrape_despesas_breakdown(self, year: int) -> list[ScrapingResult]:
        """Pipeline de breakdown de despesas: fetch → hash check → parse → replace."""
        results: list[ScrapingResult] = []
        endpoints = [
            (
                "orgao",
                self._api.fetch_despesas_orgao,
                self._despesa_parser.parse_despesas_orgao,
            ),
            (
                "funcao",
                self._api.fetch_despesas_funcao,
                self._despesa_parser.parse_despesas_funcao,
            ),
            (
                "elemento",
                self._api.fetch_despesas_elemento,
                self._despesa_parser.parse_despesas_elemento,
            ),
        ]

        for breakdown_type, fetch_fn, parse_fn in endpoints:
            started_at = datetime.now()
            dataset_key = f"despesas_{breakdown_type}"
            try:
                raw_data = await fetch_fn(year)
                payload_hash = _compute_payload_hash(raw_data)

                with db_manager.get_session() as session:
                    stored_hash = _get_sync_state_hash(session, dataset_key, year)
                    if stored_hash == payload_hash:
                        log = _create_log(session, dataset_key, year)
                        _finalize_log(session, log, "NO_CHANGE", 0, 0, 0)
                        _upsert_sync_state(
                            session, dataset_key, year, payload_hash, 0, "NO_CHANGE"
                        )
                        logger.info(
                            "Scraping %s %d: sem alterações (hash match)",
                            dataset_key,
                            year,
                        )
                        results.append(
                            ScrapingResult(
                                True, dataset_key, year, 0, 0, 0, ["NO_CHANGE"]
                            )
                        )
                        continue

                    breakdowns = parse_fn(raw_data, year)
                    if not breakdowns:
                        logger.warning(
                            "API de %s retornou vazio para %d", breakdown_type, year
                        )
                        log = _create_log(session, dataset_key, year)
                        _finalize_log(session, log, "NO_DATA", 0, 0, 0)
                        results.append(
                            ScrapingResult(
                                False,
                                dataset_key,
                                year,
                                0,
                                0,
                                0,
                                [f"NO_DATA for {breakdown_type}"],
                            )
                        )
                        continue

                    log = _create_log(session, dataset_key, year)
                    cnt = _replace_breakdown_for_year(
                        session, breakdowns, year, breakdown_type.upper()
                    )
                    _finalize_log(session, log, "SUCCESS", cnt, cnt, 0)
                    _upsert_sync_state(
                        session, dataset_key, year, payload_hash, cnt, "SUCCESS"
                    )

                logger.info(
                    "Scraping %s %d: %d inseridos", dataset_key, year, cnt
                )
                results.append(
                    ScrapingResult(True, dataset_key, year, cnt, cnt, 0)
                )
            except Exception as exc:
                msg = f"Erro scraping {dataset_key} {year}: {exc}"
                logger.error(msg, exc_info=True)
                _try_log_error(dataset_key, year, msg, started_at)
                results.append(
                    ScrapingResult(False, dataset_key, year, 0, 0, 0, [msg])
                )

        return results

    async def scrape_unidades_gestoras(
        self, year: int | None = None
    ) -> ScrapingResult:
        """Pipeline de unidades gestoras: fetch → hash check → replace."""
        started_at = datetime.now()
        try:
            raw_data = await self._api.fetch_unidades_gestoras()
            payload_hash = _compute_payload_hash(raw_data)

            with db_manager.get_session() as session:
                stored_hash = _get_sync_state_hash(session, "unidades_gestoras", 0)
                if stored_hash == payload_hash:
                    log = _create_log(session, "unidades_gestoras", 0)
                    _finalize_log(session, log, "NO_CHANGE", 0, 0, 0)
                    _upsert_sync_state(
                        session, "unidades_gestoras", 0, payload_hash, 0, "NO_CHANGE"
                    )
                    logger.info("Scraping unidades_gestoras: sem alterações (hash match)")
                    return ScrapingResult(
                        True, "unidades_gestoras", 0, 0, 0, 0, ["NO_CHANGE"]
                    )

                if not raw_data:
                    message = "API de unidades gestoras retornou vazio"
                    logger.warning(message)
                    log = _create_log(session, "unidades_gestoras", 0)
                    _finalize_log(session, log, "NO_DATA", 0, 0, 0)
                    return ScrapingResult(
                        False, "unidades_gestoras", 0, 0, 0, 0, [message]
                    )

                log = _create_log(session, "unidades_gestoras", 0)
                cnt = _replace_unidades_gestoras(session, raw_data)
                _finalize_log(session, log, "SUCCESS", cnt, cnt, 0)
                _upsert_sync_state(
                    session, "unidades_gestoras", 0, payload_hash, cnt, "SUCCESS"
                )

            logger.info("Scraping unidades_gestoras: %d inseridos", cnt)
            return ScrapingResult(True, "unidades_gestoras", 0, cnt, cnt, 0)
        except Exception as exc:
            msg = f"Erro scraping unidades_gestoras: {exc}"
            logger.error(msg, exc_info=True)
            _try_log_error("unidades_gestoras", 0, msg, started_at)
            return ScrapingResult(
                False, "unidades_gestoras", 0, 0, 0, 0, [msg]
            )

    def _load_despesas_from_pdf(self, year: int) -> list[Despesa]:
        """Carrega despesas do PDF do ano como fallback quando a API falha."""
        return _load_despesas_from_pdf_impl(year)
