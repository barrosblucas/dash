"""Cargo bounded context — types and schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class CargoItem(BaseModel):
    """Item de cargo (listagem)."""

    cargo: str = Field(..., description="Nome do cargo")
    carga_horaria: str = Field(default="", description="Carga horária (ex: 40h)")
    vagas_totais: int = Field(..., description="Total de vagas")
    vagas_ocupadas: int = Field(..., description="Vagas ocupadas")
    salario_base: float = Field(..., description="Salário base")
    efetivo: int = Field(..., description="Quantidade de efetivos")
    comissionado: int = Field(..., description="Quantidade de comissionados")
    contratado: int = Field(..., description="Quantidade de contratados")
    eletivo: int = Field(..., description="Quantidade de eletivos")
    convocados: int = Field(default=0, description="Quantidade de convocados")
    categoria: str = Field(
        ...,
        description=(
            "Categoria: EFETIVO, CONTRATADOS, COMISSIONADO, CONVOCADOS, ELETIVO"
        ),
    )
    ano: int = Field(..., description="Ano de referência")


class CargoResumoCategoria(BaseModel):
    """Resumo por categoria."""

    categoria: str = Field(..., description="Nome da categoria")
    quantidade_cargos: int = Field(..., description="Quantidade de cargos")
    total_vagas: int = Field(..., description="Total de vagas")
    total_ocupados: int = Field(..., description="Total de vagas ocupadas")
    total_salario_base: float = Field(..., description="Soma dos salários base")


class CargoResumoAnual(BaseModel):
    """Resumo anual de cargos."""

    ano: int = Field(..., description="Ano de referência")
    quantidade_cargos: int = Field(..., description="Quantidade total de cargos")
    total_vagas: int = Field(..., description="Total de vagas")
    total_ocupados: int = Field(..., description="Total de vagas ocupadas")
    total_salario_base: float = Field(..., description="Total salário base")
    categorias: list[CargoResumoCategoria] = Field(
        default_factory=list, description="Resumo por categoria"
    )


class CargoListResponse(BaseModel):
    """Resposta da listagem de cargos."""

    items: list[CargoItem] = Field(..., description="Lista de cargos")
    quantidade: int = Field(..., description="Total de cargos retornados")
    resumo: CargoResumoAnual = Field(..., description="Resumo anual dos cargos")
