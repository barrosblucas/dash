"""
Schemas Pydantic para validação e serialização da API.

Define modelos de entrada e saída para todos os endpoints.
"""

from datetime import date

from pydantic import BaseModel, Field


class HealthCheckResponse(BaseModel):
    """Schema de resposta para health check."""

    status: str = Field(..., description="Status da API")
    version: str = Field(default="1.0.0", description="Versão da API")
    database: str = Field(..., description="Status do banco de dados")
    timestamp: date = Field(default_factory=date.today, description="Data atual")


class ErrorResponse(BaseModel):
    """Schema de resposta para erros."""

    error: str = Field(..., description="Mensagem de erro")
    detail: str | None = Field(None, description="Detalhes do erro")
    code: str | None = Field(None, description="Código do erro")
