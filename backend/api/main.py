"""
Aplicação principal FastAPI para o Dashboard Financeiro Municipal.

API para consulta de dados financeiros da Prefeitura de Bandeirantes MS.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.api.routes import (
    despesas_router,
    kpis_router,
    licitacoes_router,
    movimento_extra_router,
    receitas_router,
    scraping_router,
)
from backend.api.routes.export import router as export_router
from backend.api.routes.forecast import router as forecast_router
from backend.api.schemas import HealthCheckResponse
from backend.infrastructure.database.connection import db_manager, init_database
from backend.services.historical_data_bootstrap_service import (
    HistoricalDataBootstrapService,
)

logger = logging.getLogger(__name__)

# Diretório base do projeto
BASE_DIR = Path(__file__).resolve().parent.parent.parent


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gerenciador do ciclo de vida da aplicação.

    Inicializa recursos na inicialização e limpa na finalização.
    """
    # Inicialização
    logger.info("Iniciando Dashboard Financeiro Municipal API")

    try:
        init_database()
        logger.info("Banco de dados inicializado com sucesso")
    except Exception:
        logger.exception("Erro ao inicializar banco de dados")
        raise

    try:
        bootstrap_result = (
            HistoricalDataBootstrapService().bootstrap_missing_years()
        )
        if bootstrap_result.executed:
            logger.info(
                "Bootstrap histórico executado. "
                "Anos faltantes: receitas=%s despesas=%s detalhamento=%s",
                bootstrap_result.receitas_missing_years,
                bootstrap_result.despesas_missing_years,
                bootstrap_result.detalhamento_missing_years,
            )
            if bootstrap_result.warnings:
                logger.warning(
                    "Bootstrap histórico finalizado com avisos: %s",
                    bootstrap_result.warnings,
                )
        else:
            logger.info("Bootstrap histórico não necessário")
    except Exception:
        logger.exception("Falha no bootstrap histórico de dados")

    # Inicia scheduler de scraping
    scheduler = None
    try:
        from backend.services.scraping_scheduler import ScrapingScheduler

        scheduler = ScrapingScheduler()
        scheduler.start()
        app.state.scraping_scheduler = scheduler
        logger.info("Scheduler de scraping integrado ao lifespan")
    except Exception:
        logger.exception("Falha ao iniciar scheduler de scraping — modo sem scheduler")

    logger.info("API pronta para receber requisições")

    yield

    # Finalização
    if scheduler is not None:
        scheduler.stop()
    logger.info("Dashboard Financeiro Municipal API encerrada")


# Cria a aplicação FastAPI
app = FastAPI(
    title="Dashboard Financeiro Municipal",
    description=(
        "API para consulta de dados financeiros municipais da"
        " Prefeitura de Bandeirantes MS.\n\n"
        "## Funcionalidades\n\n"
        "- **Receitas**: Consulta de receitas arrecadadas com filtros por ano, mês, categoria e tipo\n"
        "- **Despesas**: Consulta de despesas com valores empenhados, liquidados e pagos\n"
        "- **KPIs**: Indicadores financeiros com totais anuais e mensais\n"
        "- **ETL**: Pipeline de extração de dados de PDFs\n\n"
        "## Dados\n\n"
        "Os dados são extraídos de PDFs oficiais da Prefeitura de Bandeirantes MS"
        " contendo receitas e despesas municipais.\n\n"
        "## Período\n\n"
        "Dados disponíveis de 2013 a 2026 (forma prioritária: 2016-2026)."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
    redirect_slashes=False,
)

# Configura CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar domínios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Handler de exceções global
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Handler global para exceções não tratadas.

    Retorna resposta JSON pad ronizada para erros.
    """
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Erro interno do servidor",
            "detail": str(exc),
            "code": "INTERNAL_ERROR",
        },
    )


# Registra as rotas
app.include_router(receitas_router, prefix="/api/v1")
app.include_router(despesas_router, prefix="/api/v1")
app.include_router(kpis_router, prefix="/api/v1")
app.include_router(forecast_router, prefix="/api/v1")
app.include_router(export_router, prefix="/api/v1")
app.include_router(scraping_router, prefix="/api/v1")
app.include_router(movimento_extra_router, prefix="/api/v1")
app.include_router(licitacoes_router, prefix="/api/v1")


# Endpoint de health check
@app.get("/health", response_model=HealthCheckResponse, tags=["health"])
async def health_check():
    """
    Verifica a saúde da API e do banco de dados.

    Retorna status da aplicação e conectividade com o banco.

    Returns:
        HealthCheckResponse com status da aplicação.

    Example:
        GET /health
    """
    # Verifica status do banco
    try:
        db_manager.get_db_stats()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return HealthCheckResponse(
        status="healthy",
        version="1.0.0",
        database=db_status,
        timestamp=datetime.now().date(),
    )


# Endpoint raiz
@app.get("/", tags=["root"])
async def root():
    """
    Endpoint raiz da API.

    Retorna informações básicas sobre a API.

    Returns:
        Dicionário com nome e links da API.
    """
    return {
        "name": "Dashboard Financeiro Municipal API",
        "version": "1.0.0",
        "description": "API para consulta de dados financeiros da Prefeitura de Bandeirantes MS",
        "docs": "/docs",
        "redoc": "/redoc",
        "endpoints": {
            "receitas": "/api/v1/receitas",
            "despesas": "/api/v1/despesas",
            "kpis": "/api/v1/kpis",
            "health": "/health",
        },
    }


# Endpoint para reinicializar o banco (útil em desenvolvimento)
@app.post("/admin/reset-database", tags=["admin"])
async def reset_database():
    """
    Reinicializa o banco de dados.

    Remove todas as tabelas e recria do zero.
    **CUIDADO: Apaga todos os dados!**

    Returns:
        Mensagem de confirmação.
    """
    db_manager.reset_database()
    return {
        "message": "Banco de dados reinicializado com sucesso",
        "status": "success",
    }


# Endpoint para estatísticas do banco
@app.get("/admin/stats", tags=["admin"])
async def get_database_stats():
    """
    Retorna estatísticas do banco de dados.

    Mostra contagem de registros por tabela e informações do banco.

    Returns:
        Dicionário com estatísticas do banco.
    """
    stats = db_manager.get_db_stats()
    return stats


if __name__ == "__main__":
    import uvicorn

    # Executa o servidor de desenvolvimento
    uvicorn.run(
        "backend.api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
