"""Folha de Pagamento bounded context — types and schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class FolhaOfficeItem(BaseModel):
    """Item de órgão/secretaria com departamentos da folha."""

    office_id: int = Field(..., description="ID do órgão (ex: 1)")
    office_description: str = Field(..., description="Nome do órgão (ex: PREFEITURA MUNICIPAL)")
    department_id: int = Field(..., description="ID do departamento")
    department_description: str = Field(..., description="Nome do departamento")
    ano: int = Field(..., description="Ano de referência")
    mes: int = Field(..., description="Mês de referência (1-12)")


class FolhaEmployeeItem(BaseModel):
    """Item de servidor na folha de pagamento."""

    ano: int = Field(..., description="Ano de referência")
    mes: int = Field(..., description="Mês de referência (1-12)")
    office_id: int = Field(..., description="ID do órgão")
    office_description: str = Field(..., description="Nome do órgão")
    department_id: int = Field(..., description="ID do departamento")
    department_description: str = Field(..., description="Nome do departamento")
    contract: str = Field(..., description="Matrícula/contrato do servidor")
    name: str = Field(..., description="Nome do servidor")
    cpf: str = Field(..., description="CPF do servidor")
    role: str = Field(..., description="Cargo/função")
    class_and_level: str = Field(..., description="Classe e nível")
    state: str = Field(..., description="Situação (ATIVO, etc.)")
    admission_date: str = Field(..., description="Data de admissão")
    end_date: str = Field(..., description="Data de rescisão (vazio se ativo)")
    base_salary: float = Field(..., description="Salário base")
    tenth_salary: float = Field(..., description="13º salário proporcional")
    vacation: float = Field(..., description="Férias")
    gratification: float = Field(..., description="Gratificação")
    others_earnings: float = Field(..., description="Outros proventos")
    discounts: float = Field(..., description="Descontos")
    gross_salary: float = Field(..., description="Salário bruto")
    net_salary: float = Field(..., description="Salário líquido")
    role_type_id: str = Field(..., description="Tipo do vínculo (id)")


class FolhaResumoMensal(BaseModel):
    """Resumo mensal da folha de pagamento."""

    ano: int = Field(..., description="Ano de referência")
    mes: int = Field(..., description="Mês de referência")
    quantidade_servidores: int = Field(..., description="Quantidade de servidores")
    total_bruto: float = Field(..., description="Total bruto da folha")
    total_liquido: float = Field(..., description="Total líquido da folha")
    total_descontos: float = Field(..., description="Total de descontos")


class FolhaEmployeeListResponse(BaseModel):
    """Resposta da listagem de servidores."""

    items: list[FolhaEmployeeItem] = Field(..., description="Lista de servidores")
    quantidade: int = Field(..., description="Total de servidores retornados")
    resumo: FolhaResumoMensal = Field(..., description="Resumo mensal")


class FolhaOfficeListResponse(BaseModel):
    """Resposta da listagem de órgãos/departamentos."""

    items: list[FolhaOfficeItem] = Field(..., description="Lista de órgãos/departamentos")
    quantidade: int = Field(..., description="Total de itens retornados")
