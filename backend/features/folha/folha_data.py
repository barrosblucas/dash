"""
Repository para Folha de Pagamento — acesso ao banco local.

Encapsula queries SQL e operações de upsert sobre as tabelas
folha_offices e folha_employees.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import func as sa_func
from sqlalchemy import select
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import Session

from backend.features.folha.folha_types import (
    FolhaEmployeeItem,
    FolhaOfficeItem,
    FolhaResumoMensal,
)
from backend.shared.database.models import (
    FolhaEmployeeModel,
    FolhaOfficeModel,
)

logger = logging.getLogger(__name__)


# ─── Offices ────────────────────────────────────────────────────────────────


def list_offices(
    session: Session,
    ano: int,
    mes: int,
) -> list[FolhaOfficeItem]:
    """Lista órgãos/departamentos para um ano/mês específico.

    Args:
        session: SQLAlchemy Session.
        ano: Ano de referência.
        mes: Mês de referência.

    Returns:
        Lista de FolhaOfficeItem.
    """
    stmt = (
        select(FolhaOfficeModel)
        .where(
            FolhaOfficeModel.ano == ano,
            FolhaOfficeModel.mes == mes,
        )
        .order_by(FolhaOfficeModel.office_id, FolhaOfficeModel.department_id)
    )
    rows = session.execute(stmt).scalars().all()
    return [_office_row_to_item(row) for row in rows]


def upsert_offices(
    session: Session,
    items: list[FolhaOfficeItem],
) -> int:
    """Insere ou atualiza órgãos/departamentos (upsert).

    Chave única: (ano, mes, office_id, department_id).

    Args:
        session: SQLAlchemy Session.
        items: Lista de FolhaOfficeItem.

    Returns:
        Número de itens inseridos/atualizados.
    """
    if not items:
        return 0

    now = datetime.now(UTC)

    rows = [
        {
            "ano": item.ano,
            "mes": item.mes,
            "office_id": item.office_id,
            "office_description": item.office_description,
            "department_id": item.department_id,
            "department_description": item.department_description,
            "created_at": now,
            "updated_at": now,
        }
        for item in items
    ]

    stmt = sqlite_insert(FolhaOfficeModel).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=["ano", "mes", "office_id", "department_id"],
        set_={
            "office_description": stmt.excluded.office_description,
            "department_description": stmt.excluded.department_description,
            "updated_at": now,
        },
    )

    result = session.execute(stmt)
    return result.rowcount or 0


# ─── Employees ──────────────────────────────────────────────────────────────


def list_employees(
    session: Session,
    ano: int,
    mes: int,
    office_id: int | None = None,
    department_id: int | None = None,
    keyword: str | None = None,
) -> list[FolhaEmployeeItem]:
    """Lista servidores com filtros opcionais.

    Args:
        session: SQLAlchemy Session.
        ano: Ano de referência.
        mes: Mês de referência.
        office_id: Filtrar por órgão (opcional).
        department_id: Filtrar por departamento (opcional).
        keyword: Busca textual por nome ou CPF (opcional).

    Returns:
        Lista de FolhaEmployeeItem.
    """
    stmt = select(FolhaEmployeeModel).where(
        FolhaEmployeeModel.ano == ano,
        FolhaEmployeeModel.mes == mes,
    )

    if office_id is not None:
        stmt = stmt.where(FolhaEmployeeModel.office_id == office_id)
    if department_id is not None:
        stmt = stmt.where(FolhaEmployeeModel.department_id == department_id)
    if keyword:
        like_pattern = f"%{keyword}%"
        stmt = stmt.where(
            sa_func.lower(FolhaEmployeeModel.name).like(sa_func.lower(like_pattern))
        )

    stmt = stmt.order_by(FolhaEmployeeModel.name)

    rows = session.execute(stmt).scalars().all()
    return [_employee_row_to_item(row) for row in rows]


def get_resumo_mensal(
    session: Session,
    ano: int,
    mes: int,
    office_id: int | None = None,
    department_id: int | None = None,
) -> FolhaResumoMensal:
    """Calcula resumo mensal da folha.

    Args:
        session: SQLAlchemy Session.
        ano: Ano de referência.
        mes: Mês de referência.
        office_id: Filtrar por órgão (opcional).
        department_id: Filtrar por departamento (opcional).

    Returns:
        FolhaResumoMensal com totais agregados.
    """
    stmt = select(
        sa_func.count(FolhaEmployeeModel.id),
        sa_func.coalesce(sa_func.sum(FolhaEmployeeModel.gross_salary), 0),
        sa_func.coalesce(sa_func.sum(FolhaEmployeeModel.net_salary), 0),
        sa_func.coalesce(sa_func.sum(FolhaEmployeeModel.discounts), 0),
    ).where(
        FolhaEmployeeModel.ano == ano,
        FolhaEmployeeModel.mes == mes,
    )

    if office_id is not None:
        stmt = stmt.where(FolhaEmployeeModel.office_id == office_id)
    if department_id is not None:
        stmt = stmt.where(FolhaEmployeeModel.department_id == department_id)

    row = session.execute(stmt).one()

    return FolhaResumoMensal(
        ano=ano,
        mes=mes,
        quantidade_servidores=row[0] or 0,
        total_bruto=float(row[1] or 0),
        total_liquido=float(row[2] or 0),
        total_descontos=float(row[3] or 0),
    )


def upsert_employees(
    session: Session,
    items: list[FolhaEmployeeItem],
) -> int:
    """Insere ou atualiza servidores (upsert).

    Chave única: (ano, mes, contract, office_id, department_id).

    Args:
        session: SQLAlchemy Session.
        items: Lista de FolhaEmployeeItem.

    Returns:
        Número de itens inseridos/atualizados.
    """
    if not items:
        return 0

    now = datetime.now(UTC)

    rows = [
        {
            "ano": item.ano,
            "mes": item.mes,
            "office_id": item.office_id,
            "office_description": item.office_description,
            "department_id": item.department_id,
            "department_description": item.department_description,
            "contract": item.contract,
            "name": item.name,
            "cpf": item.cpf,
            "role": item.role,
            "class_and_level": item.class_and_level,
            "state": item.state,
            "admission_date": item.admission_date,
            "end_date": item.end_date,
            "base_salary": Decimal(str(item.base_salary)),
            "tenth_salary": Decimal(str(item.tenth_salary)),
            "vacation": Decimal(str(item.vacation)),
            "gratification": Decimal(str(item.gratification)),
            "others_earnings": Decimal(str(item.others_earnings)),
            "discounts": Decimal(str(item.discounts)),
            "gross_salary": Decimal(str(item.gross_salary)),
            "net_salary": Decimal(str(item.net_salary)),
            "role_type_id": item.role_type_id,
            "created_at": now,
            "updated_at": now,
        }
        for item in items
    ]

    stmt = sqlite_insert(FolhaEmployeeModel).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=["ano", "mes", "contract", "office_id", "department_id"],
        set_={
            "name": stmt.excluded.name,
            "cpf": stmt.excluded.cpf,
            "role": stmt.excluded.role,
            "class_and_level": stmt.excluded.class_and_level,
            "state": stmt.excluded.state,
            "admission_date": stmt.excluded.admission_date,
            "end_date": stmt.excluded.end_date,
            "base_salary": stmt.excluded.base_salary,
            "tenth_salary": stmt.excluded.tenth_salary,
            "vacation": stmt.excluded.vacation,
            "gratification": stmt.excluded.gratification,
            "others_earnings": stmt.excluded.others_earnings,
            "discounts": stmt.excluded.discounts,
            "gross_salary": stmt.excluded.gross_salary,
            "net_salary": stmt.excluded.net_salary,
            "role_type_id": stmt.excluded.role_type_id,
            "office_description": stmt.excluded.office_description,
            "department_description": stmt.excluded.department_description,
            "updated_at": now,
        },
    )

    result = session.execute(stmt)
    return result.rowcount or 0


# ─── Anos disponíveis ───────────────────────────────────────────────────────


def get_anos_disponiveis(session: Session) -> list[int]:
    """Retorna anos com dados de folha registrados.

    Args:
        session: SQLAlchemy Session.

    Returns:
        Lista de anos (ordenada decrescente).
    """
    stmt = (
        select(FolhaEmployeeModel.ano)
        .distinct()
        .order_by(FolhaEmployeeModel.ano.desc())
    )
    rows = session.execute(stmt).scalars().all()
    return list(rows)


# ─── Conversores ────────────────────────────────────────────────────────────


def _office_row_to_item(row: FolhaOfficeModel) -> FolhaOfficeItem:
    """Converte model SQLAlchemy para FolhaOfficeItem."""
    return FolhaOfficeItem(
        office_id=row.office_id,
        office_description=row.office_description,
        department_id=row.department_id,
        department_description=row.department_description,
        ano=row.ano,
        mes=row.mes,
    )


def _employee_row_to_item(row: FolhaEmployeeModel) -> FolhaEmployeeItem:
    """Converte model SQLAlchemy para FolhaEmployeeItem."""
    return FolhaEmployeeItem(
        ano=row.ano,
        mes=row.mes,
        office_id=row.office_id,
        office_description=row.office_description,
        department_id=row.department_id,
        department_description=row.department_description,
        contract=row.contract,
        name=row.name,
        cpf=row.cpf,
        role=row.role,
        class_and_level=row.class_and_level,
        state=row.state,
        admission_date=row.admission_date,
        end_date=row.end_date,
        base_salary=float(row.base_salary),
        tenth_salary=float(row.tenth_salary),
        vacation=float(row.vacation),
        gratification=float(row.gratification),
        others_earnings=float(row.others_earnings),
        discounts=float(row.discounts),
        gross_salary=float(row.gross_salary),
        net_salary=float(row.net_salary),
        role_type_id=row.role_type_id,
    )
