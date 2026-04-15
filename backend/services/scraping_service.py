"""
Serviço de orquestração do scraping do portal QualitySistemas.

Coordena a busca, parsing e persistência de receitas e despesas
com lógica de upsert e logging de execução.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

from sqlalchemy import and_, delete
from sqlalchemy.orm import Session

from backend.domain.entities.despesa import Despesa
from backend.domain.entities.receita import Receita
from backend.etl.extractors.pdf_extractor import PDFExtractor, ReceitaDetalhamento
from backend.etl.scrapers.despesa_scraper import DespesaScraper
from backend.etl.scrapers.quality_api_client import QualityAPIClient
from backend.etl.scrapers.receita_scraper import ReceitaScraper
from backend.infrastructure.database.connection import db_manager
from backend.infrastructure.database.models import (
    DespesaModel,
    ReceitaDetalhamentoModel,
    ReceitaModel,
    ScrapingLogModel,
)

logger = logging.getLogger(__name__)

_REALTIME_API_YEAR = 2026


@dataclass
class ScrapingResult:
    """Resultado de uma execução de scraping."""

    success: bool
    data_type: str
    year: int
    records_processed: int
    records_inserted: int
    records_updated: int
    errors: list[str] = field(default_factory=list)


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
        log = self._create_log("receitas", year)
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
                    ins, upd = self._replace_receitas_for_year(session, receitas, year)
                else:
                    ins, upd = self._upsert_receitas(session, receitas, year)
                det_cnt = self._replace_detalhamento(session, detalhes, year)
                self._finalize_log(
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
            self._try_log_error("receitas", year, msg, log.started_at)
            return ScrapingResult(False, "receitas", year, 0, 0, 0, [msg])

    async def scrape_despesas(self, year: int) -> ScrapingResult:
        """Pipeline de despesas: fetch → parse → merge → upsert. API vazia = warning, não erro."""
        log = self._create_log("despesas", year)
        try:
            raw_annual = await self._api.fetch_despesas_annual(year)
            raw_natureza = await self._api.fetch_despesas_natureza(year)
            annual = self._despesa_parser.parse_despesas_annual(raw_annual, year)
            natureza = self._despesa_parser.parse_despesas_natureza(raw_natureza, year)
            merged = self._despesa_parser.merge_despesas(annual, natureza)

            if not merged:
                if not raw_annual and not raw_natureza:
                    logger.warning(
                        "API de despesas retornou vazio para %d (possível erro 500)",
                        year,
                    )
                logger.warning("Tentando fallback de despesas via PDF para %d", year)
                merged = self._load_despesas_from_pdf(year)

            with db_manager.get_session() as session:
                if year == _REALTIME_API_YEAR:
                    ins, upd = self._replace_despesas_for_year(session, merged, year)
                else:
                    ins, upd = self._upsert_despesas(session, merged, year)
                self._finalize_log(session, log, "SUCCESS", len(merged), ins, upd)

            logger.info("Scraping despesas %d: %d ins, %d upd", year, ins, upd)
            return ScrapingResult(True, "despesas", year, len(merged), ins, upd)
        except Exception as exc:
            msg = f"Erro scraping despesas {year}: {exc}"
            logger.error(msg, exc_info=True)
            self._try_log_error("despesas", year, msg, log.started_at)
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

    # ------------------------------------------------------------------
    # Upsert helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _upsert_receitas(
        session: Session, receitas: list[Receita], year: int
    ) -> tuple[int, int]:
        """Upsert de receitas por (ano, mes, categoria). Retorna (inserted, updated)."""
        inserted = 0
        updated = 0
        for r in receitas:
            existing: ReceitaModel | None = (
                session.query(ReceitaModel)
                .filter(
                    and_(
                        ReceitaModel.ano == r.ano,
                        ReceitaModel.mes == r.mes,
                        ReceitaModel.categoria == r.categoria,
                    )
                )
                .first()
            )
            if existing is not None:
                existing.valor_previsto = r.valor_previsto
                existing.valor_arrecadado = r.valor_arrecadado
                existing.valor_anulado = r.valor_anulado
                existing.fonte = r.fonte
                updated += 1
            else:
                session.add(
                    ReceitaModel(
                        ano=r.ano,
                        mes=r.mes,
                        categoria=r.categoria,
                        subcategoria=r.subcategoria,
                        tipo=r.tipo.value,
                        valor_previsto=r.valor_previsto,
                        valor_arrecadado=r.valor_arrecadado,
                        valor_anulado=r.valor_anulado,
                        fonte=r.fonte,
                    )
                )
                inserted += 1
        session.flush()
        return inserted, updated

    @staticmethod
    def _upsert_despesas(
        session: Session, despesas: list[Despesa], year: int
    ) -> tuple[int, int]:
        """Upsert de despesas por (ano, mes, tipo). Múltiplas por mês com tipos diferentes."""
        inserted = 0
        updated = 0
        for d in despesas:
            query = session.query(DespesaModel).filter(
                and_(
                    DespesaModel.ano == d.ano,
                    DespesaModel.mes == d.mes,
                    DespesaModel.tipo == d.tipo.value,
                )
            )
            if d.categoria:
                query = query.filter(DespesaModel.categoria == d.categoria)
            existing: DespesaModel | None = query.first()
            if existing is not None:
                existing.valor_empenhado = d.valor_empenhado
                existing.valor_liquidado = d.valor_liquidado
                existing.valor_pago = d.valor_pago
                existing.fonte = d.fonte
                updated += 1
            else:
                session.add(
                    DespesaModel(
                        ano=d.ano,
                        mes=d.mes,
                        categoria=d.categoria,
                        subcategoria=d.subcategoria,
                        tipo=d.tipo.value,
                        valor_empenhado=d.valor_empenhado,
                        valor_liquidado=d.valor_liquidado,
                        valor_pago=d.valor_pago,
                        fonte=d.fonte,
                    )
                )
                inserted += 1
        session.flush()
        return inserted, updated

    @staticmethod
    def _replace_detalhamento(
        session: Session, detalhes: list[ReceitaDetalhamento], year: int
    ) -> int:
        """Replace completo do detalhamento para o ano. Retorna count de inseridos."""
        session.execute(
            delete(ReceitaDetalhamentoModel).where(ReceitaDetalhamentoModel.ano == year)
        )
        session.flush()
        for d in detalhes:
            session.add(
                ReceitaDetalhamentoModel(
                    ano=d.ano,
                    detalhamento=d.detalhamento,
                    nivel=d.nivel,
                    ordem=d.ordem,
                    tipo=d.tipo,
                    valor_previsto=d.valor_previsto,
                    valor_arrecadado=d.valor_arrecadado,
                    valor_anulado=d.valor_anulado,
                    fonte=d.fonte,
                )
            )
        session.flush()
        return len(detalhes)

    @staticmethod
    def _replace_receitas_for_year(
        session: Session, receitas: list[Receita], year: int
    ) -> tuple[int, int]:
        """Substitui todas as receitas do ano e reinsere a visão atual da fonte."""
        session.execute(delete(ReceitaModel).where(ReceitaModel.ano == year))
        session.flush()
        return ScrapingService._upsert_receitas(session, receitas, year)

    @staticmethod
    def _replace_despesas_for_year(
        session: Session, despesas: list[Despesa], year: int
    ) -> tuple[int, int]:
        """Substitui todas as despesas do ano e reinsere a visão atual da fonte."""
        session.execute(delete(DespesaModel).where(DespesaModel.ano == year))
        session.flush()
        return ScrapingService._upsert_despesas(session, despesas, year)

    # ------------------------------------------------------------------
    # Logging helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _create_log(data_type: str, year: int) -> ScrapingLogModel:
        """Cria registro de log RUNNING em sessão própria."""
        entry = ScrapingLogModel(
            data_type=data_type,
            year=year,
            status="RUNNING",
            records_processed=0,
            records_inserted=0,
            records_updated=0,
            started_at=datetime.now(),
        )
        with db_manager.get_session() as session:
            session.add(entry)
            session.flush()
        return entry

    @staticmethod
    def _finalize_log(
        session: Session,
        log: ScrapingLogModel,
        status: str,
        processed: int,
        inserted: int,
        updated: int,
    ) -> None:
        """Atualiza log com resultado final na mesma sessão de dados."""
        log.status = status
        log.records_processed = processed
        log.records_inserted = inserted
        log.records_updated = updated
        log.finished_at = datetime.now()
        session.add(log)
        session.flush()

    @staticmethod
    def _try_log_error(
        data_type: str, year: int, error_msg: str, started_at: datetime
    ) -> None:
        """Tenta registrar erro no log sem propagar exceção."""
        try:
            with db_manager.get_session() as session:
                session.add(
                    ScrapingLogModel(
                        data_type=data_type,
                        year=year,
                        status="ERROR",
                        error_message=error_msg[:2000],
                        started_at=started_at,
                        finished_at=datetime.now(),
                    )
                )
        except Exception:
            logger.exception("Falha ao registrar log de erro no banco")
