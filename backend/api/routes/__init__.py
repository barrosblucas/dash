"""API routes module."""

from .receitas import router as receitas_router
from .despesas import router as despesas_router
from .kpis import router as kpis_router

__all__ = ["receitas_router", "despesas_router", "kpis_router"]
