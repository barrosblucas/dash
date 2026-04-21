"""Scraping bounded context — types and schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class ScrapingStatusResponse(BaseModel):
    """Status do scraper."""

    last_run: datetime | None = None
    next_run: datetime | None = None
    receitas_status: str = "unknown"
    despesas_status: str = "unknown"
    receitas_records: int = 0
    despesas_records: int = 0
    errors: list[str] = []


class ScrapingTriggerRequest(BaseModel):
    """Request para disparar scraping manual."""

    year: int = 2026
    data_type: str = "all"  # "receitas", "despesas", "all"


class ScrapingTriggerResponse(BaseModel):
    """Resposta do trigger manual."""

    status: str
    message: str
    receitas_processed: int = 0
    despesas_processed: int = 0
    errors: list[str] = []


class ScrapingLogResponse(BaseModel):
    """Log de execução do scraping."""

    id: int
    data_type: str  # "receita" or "despesa"
    year: int
    status: str  # "SUCCESS", "ERROR", "PARTIAL"
    records_processed: int
    records_inserted: int
    records_updated: int
    error_message: str | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None

    class Config:
        from_attributes = True


class ScrapingHistoryResponse(BaseModel):
    """Histórico de execuções do scraping."""

    logs: list[ScrapingLogResponse]
    total: int
