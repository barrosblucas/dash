"""API routes module."""

from .despesas import router as despesas_router
from .kpis import router as kpis_router
from .receitas import router as receitas_router
from .scraping import router as scraping_router

__all__ = ["receitas_router", "despesas_router", "kpis_router", "scraping_router"]
