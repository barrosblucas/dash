"""API routes module — backward-compatible re-exports."""

from backend.features.despesa.despesa_handler import (
    router as despesas_router,  # noqa: F401
)
from backend.features.kpi.kpi_handler import router as kpis_router  # noqa: F401
from backend.features.licitacao.licitacao_handler import (
    router as licitacoes_router,  # noqa: F401
)
from backend.features.movimento_extra.movimento_extra_handler import (
    router as movimento_extra_router,  # noqa: F401
)
from backend.features.receita.receita_handler import (
    router as receitas_router,  # noqa: F401
)
from backend.features.scraping.scraping_handler import (
    router as scraping_router,  # noqa: F401
)

__all__ = [
    "receitas_router",
    "despesas_router",
    "kpis_router",
    "scraping_router",
    "movimento_extra_router",
    "licitacoes_router",
]
