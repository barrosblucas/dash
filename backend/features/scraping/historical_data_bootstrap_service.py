"""Carga inicial idempotente de dados históricos a partir dos PDFs."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path

from sqlalchemy.orm import Session

from backend.features.despesa.despesa_types import Despesa
from backend.features.receita.receita_types import Receita
from backend.features.scraping.scraping_helpers import (
    _replace_detalhamento,
    _upsert_despesas,
    _upsert_receitas,
)
from backend.shared.database.connection import db_manager
from backend.shared.database.models import (
    DespesaModel,
    ReceitaDetalhamentoModel,
    ReceitaModel,
)
from backend.shared.pdf_extractor import PDFExtractor
from backend.shared.pdf_types import ReceitaDetalhamento

logger = logging.getLogger(__name__)

_REALTIME_API_YEAR = 2026


@dataclass(frozen=True)
class YearGaps:
    """Anos ausentes por tipo de dado."""

    receitas: list[int]
    despesas: list[int]
    detalhamento: list[int]

    @property
    def has_missing_years(self) -> bool:
        """Indica se há lacunas para preenchimento."""
        return bool(self.receitas or self.despesas or self.detalhamento)


@dataclass(frozen=True)
class BootstrapPayload:
    """Dados extraídos prontos para persistência."""

    receitas: list[Receita]
    despesas: list[Despesa]
    detalhamento_por_ano: dict[int, list[ReceitaDetalhamento]]
    warnings: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class PersistedCounts:
    """Contadores de linhas inseridas/atualizadas no bootstrap."""

    receitas_inserted: int = 0
    receitas_updated: int = 0
    despesas_inserted: int = 0
    despesas_updated: int = 0
    detalhamento_replaced: int = 0


@dataclass(frozen=True)
class HistoricalBootstrapResult:
    """Resultado final da carga histórica."""

    executed: bool
    receitas_missing_years: list[int] = field(default_factory=list)
    despesas_missing_years: list[int] = field(default_factory=list)
    detalhamento_missing_years: list[int] = field(default_factory=list)
    receitas_inserted: int = 0
    receitas_updated: int = 0
    despesas_inserted: int = 0
    despesas_updated: int = 0
    detalhamento_replaced: int = 0
    warnings: list[str] = field(default_factory=list)


class HistoricalDataBootstrapService:
    """Carrega anos ausentes do banco usando os PDFs locais."""

    def __init__(self, data_root: Path | None = None) -> None:
        root = data_root or Path(__file__).resolve().parent.parent.parent
        self._extractor = PDFExtractor(root)

    def bootstrap_missing_years(self) -> HistoricalBootstrapResult:
        """Preenche apenas anos ausentes de receitas/despesas/detalhamento."""
        year_gaps = self._collect_year_gaps()

        if not year_gaps.has_missing_years:
            return HistoricalBootstrapResult(executed=False)

        payload = self._extract_payload(year_gaps)
        counts = self._persist_payload(payload)

        result = HistoricalBootstrapResult(
            executed=True,
            receitas_missing_years=year_gaps.receitas,
            despesas_missing_years=year_gaps.despesas,
            detalhamento_missing_years=year_gaps.detalhamento,
            receitas_inserted=counts.receitas_inserted,
            receitas_updated=counts.receitas_updated,
            despesas_inserted=counts.despesas_inserted,
            despesas_updated=counts.despesas_updated,
            detalhamento_replaced=counts.detalhamento_replaced,
            warnings=payload.warnings,
        )

        logger.info(
            "Carga histórica concluída: receitas(%d ins, %d upd), "
            "despesas(%d ins, %d upd), detalhamento(%d replace)",
            result.receitas_inserted,
            result.receitas_updated,
            result.despesas_inserted,
            result.despesas_updated,
            result.detalhamento_replaced,
        )

        if result.warnings:
            logger.warning(
                "Carga histórica concluída com %d aviso(s)",
                len(result.warnings),
            )

        return result

    def _collect_year_gaps(self) -> YearGaps:
        """Calcula anos disponíveis em PDF que ainda não existem no banco."""
        receitas_pdf_years = self._list_pdf_years(self._extractor.receitas_dir)
        despesas_pdf_years = self._list_pdf_years(self._extractor.despesas_dir)

        with db_manager.get_session() as session:
            receitas_db_years = self._existing_receitas_years(session)
            despesas_db_years = self._existing_despesas_years(session)
            detalhamento_db_years = self._existing_detalhamento_years(session)

        receitas_missing = sorted(
            set(receitas_pdf_years).difference(receitas_db_years)
        )
        despesas_missing = sorted(
            set(despesas_pdf_years).difference(despesas_db_years)
        )
        detalhamento_missing = sorted(
            set(receitas_pdf_years).difference(detalhamento_db_years)
        )

        receitas_missing = [
            year for year in receitas_missing if year != _REALTIME_API_YEAR
        ]
        despesas_missing = [
            year for year in despesas_missing if year != _REALTIME_API_YEAR
        ]
        detalhamento_missing = [
            year for year in detalhamento_missing if year != _REALTIME_API_YEAR
        ]

        return YearGaps(
            receitas=receitas_missing,
            despesas=despesas_missing,
            detalhamento=detalhamento_missing,
        )

    def _extract_payload(self, year_gaps: YearGaps) -> BootstrapPayload:
        """Extrai dados dos anos ausentes."""
        warnings: list[str] = []

        receitas: list[Receita] = []
        if year_gaps.receitas:
            receitas_result = self._extractor.extract_receitas(anos=year_gaps.receitas)
            receitas = receitas_result.receitas
            if receitas_result.erro:
                warnings.append(f"Receitas: {receitas_result.erro}")

        despesas: list[Despesa] = []
        if year_gaps.despesas:
            despesas_result = self._extractor.extract_despesas(anos=year_gaps.despesas)
            despesas = despesas_result.despesas
            if despesas_result.erro:
                warnings.append(f"Despesas: {despesas_result.erro}")

        detalhamento_por_ano: dict[int, list[ReceitaDetalhamento]] = {}
        for year in year_gaps.detalhamento:
            pdf_path = self._extractor.receitas_dir / f"{year}.pdf"
            if not pdf_path.exists():
                warnings.append(f"Detalhamento: arquivo não encontrado para {year}")
                continue

            try:
                detalhamento_por_ano[year] = self._extractor.extrair_detalhamento_pdf(
                    pdf_path
                )
            except Exception as exc:
                warnings.append(
                    f"Detalhamento: falha ao extrair ano {year}: {exc}"
                )

        return BootstrapPayload(
            receitas=receitas,
            despesas=despesas,
            detalhamento_por_ano=detalhamento_por_ano,
            warnings=warnings,
        )

    def _persist_payload(self, payload: BootstrapPayload) -> PersistedCounts:
        """Persiste o payload extraído com upsert e replace por ano."""
        receitas_inserted = 0
        receitas_updated = 0
        despesas_inserted = 0
        despesas_updated = 0
        detalhamento_replaced = 0

        with db_manager.get_session() as session:
            if payload.receitas:
                receitas_inserted, receitas_updated = _upsert_receitas(
                    session,
                    payload.receitas,
                    0,
                )

            if payload.despesas:
                despesas_inserted, despesas_updated = _upsert_despesas(
                    session,
                    payload.despesas,
                    0,
                )

            for year in sorted(payload.detalhamento_por_ano):
                detalhamento_replaced += _replace_detalhamento(
                    session,
                    payload.detalhamento_por_ano[year],
                    year,
                )

        return PersistedCounts(
            receitas_inserted=receitas_inserted,
            receitas_updated=receitas_updated,
            despesas_inserted=despesas_inserted,
            despesas_updated=despesas_updated,
            detalhamento_replaced=detalhamento_replaced,
        )

    @staticmethod
    def _existing_receitas_years(session: Session) -> set[int]:
        """Busca anos já presentes em receitas."""
        rows = session.query(ReceitaModel.ano).distinct().all()
        return {int(year) for (year,) in rows if year is not None}

    @staticmethod
    def _existing_despesas_years(session: Session) -> set[int]:
        """Busca anos já presentes em despesas."""
        rows = session.query(DespesaModel.ano).distinct().all()
        return {int(year) for (year,) in rows if year is not None}

    @staticmethod
    def _existing_detalhamento_years(session: Session) -> set[int]:
        """Busca anos já presentes no detalhamento de receitas."""
        rows = session.query(ReceitaDetalhamentoModel.ano).distinct().all()
        return {int(year) for (year,) in rows if year is not None}

    @staticmethod
    def _list_pdf_years(directory: Path) -> list[int]:
        """Lista anos com arquivo PDF válido no diretório informado."""
        years: set[int] = set()

        for pdf_file in directory.glob("*.pdf"):
            try:
                years.add(int(pdf_file.stem))
            except ValueError:
                continue

        return sorted(years)
