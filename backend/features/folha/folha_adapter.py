"""
Adaptador para API externa de Folha de Pagamento (Quality).

Encapsula chamadas HTTP para o portal Quality.
Não contém lógica de negócio — apenas busca e mapeamento de dados.
"""

from __future__ import annotations

import logging

import httpx

from backend.features.folha.folha_types import FolhaEmployeeItem, FolhaOfficeItem

logger = logging.getLogger(__name__)

_BASE_URL = "https://web.qualitysistemas.com.br/folha_de_pagamento"

_ENTITY = "prefeitura_municipal_de_bandeirantes"
_REQUEST_TIMEOUT = 60.0

_HEADERS = {
    "X-Requested-With": "XMLHttpRequest",
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Referer": f"{_BASE_URL}/{_ENTITY}",
    "Accept": "application/json, text/javascript, */*; q=0.01",
}


class FolhaAPIError(Exception):
    """Erro ao comunicar com API externa da folha."""

    def __init__(self, message: str, status_code: int | None = None):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _parse_float(value: object) -> float:
    """Converte valor para float de forma segura.

    Lida com formatos brasileiros (1.234,56) e americanos (1234.56).
    """
    if value is None:
        return 0.0
    raw = str(value).strip()
    if not raw or raw in ("-", ""):
        return 0.0
    try:
        return float(raw)
    except ValueError:
        pass
    # Tenta formato brasileiro: 1.234,56
    raw = raw.replace(".", "").replace(",", ".")
    try:
        return float(raw)
    except (ValueError, TypeError):
        logger.warning("Não foi possível converter '%s' para float", value)
        return 0.0


def _normalize_money(value: object) -> float:
    """Normaliza valor monetário vindo da API Quality.

    A API pode retornar tanto "1.234,56" quanto 1234.56 ou None.
    """
    return _parse_float(value)


async def fetch_offices(ano: int, mes: int) -> list[FolhaOfficeItem]:
    """Busca hierarquia de órgãos/departamentos (OfficeFinder).

    Args:
        ano: Ano de referência.
        mes: Mês de referência (1-12).

    Returns:
        Lista de FolhaOfficeItem. Retorna lista vazia em caso de HTTP 404, 5xx,
        ou erro de conexão — nunca lança exceção.
    """
    params = {
        "entity": _ENTITY,
        "currentMonth": str(mes),
        "currentYear": str(ano),
    }
    url = f"{_BASE_URL}/OfficeFinder"

    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            response = await client.get(url, params=params, headers=_HEADERS)

            if response.status_code >= 500:
                logger.warning(
                    "API externa indisponível (HTTP %d) ao buscar offices (ano=%s mes=%s) — retornando vazio",
                    response.status_code,
                    ano,
                    mes,
                )
                return []

            if response.status_code == 404:
                logger.info(
                    "Nenhum dado encontrado (HTTP 404) ao buscar offices (ano=%s mes=%s)",
                    ano,
                    mes,
                )
                return []

            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        logger.warning(
            "HTTP %s ao buscar offices (ano=%s mes=%s) — retornando vazio",
            exc.response.status_code,
            ano,
            mes,
        )
        return []
    except httpx.RequestError as exc:
        logger.warning(
            "Erro de conexão ao buscar offices (ano=%s mes=%s): %s — retornando vazio",
            ano,
            mes,
            exc,
        )
        return []

    office_rows = _extract_office_rows(data)
    if not office_rows:
        logger.warning("Resposta inesperada (offices): %s", type(data))
        return []

    items: list[FolhaOfficeItem] = []
    for office in office_rows:
        if not isinstance(office, dict):
            continue
        office_id = office.get("id") or office.get("officeId") or 0
        office_desc = office.get("description") or ""

        departments = office.get("departments") or office.get("departments", [])
        if isinstance(departments, list):
            for dept in departments:
                if not isinstance(dept, dict):
                    continue
                dept_id = dept.get("id") or 0
                dept_desc = dept.get("description") or ""

                items.append(
                    FolhaOfficeItem(
                        office_id=int(office_id),
                        office_description=str(office_desc).strip(),
                        department_id=int(dept_id),
                        department_description=str(dept_desc).strip(),
                        ano=ano,
                        mes=mes,
                    )
                )
        else:
            # Caso não tenha departments, adiciona o office sozinho
            items.append(
                FolhaOfficeItem(
                    office_id=int(office_id),
                    office_description=str(office_desc).strip(),
                    department_id=0,
                    department_description="",
                    ano=ano,
                    mes=mes,
                )
            )

    return items


async def fetch_employees(
    ano: int,
    mes: int,
    office_id: int,
    department_id: int,
) -> list[FolhaEmployeeItem]:
    """Busca servidores de um órgão/departamento (RoleFinder).

    Args:
        ano: Ano de referência.
        mes: Mês de referência (1-12).
        office_id: ID do órgão.
        department_id: ID do departamento.

    Returns:
        Lista de FolhaEmployeeItem. Retorna lista vazia em caso de HTTP 404, 5xx,
        ou erro de conexão — nunca lança exceção.
    """
    params = {
        "entity": _ENTITY,
        "currentMonth": str(mes),
        "currentYear": str(ano),
        "officeId": str(office_id),
        "departmentId": str(department_id),
    }
    url = f"{_BASE_URL}/RoleFinder"

    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            response = await client.get(url, params=params, headers=_HEADERS)

            if response.status_code >= 500:
                logger.warning(
                    "API externa indisponível (HTTP %d) ao buscar employees (ano=%s mes=%s office=%s dept=%s) — retornando vazio",
                    response.status_code,
                    ano,
                    mes,
                    office_id,
                    department_id,
                )
                return []

            if response.status_code == 404:
                logger.info(
                    "Nenhum dado encontrado (HTTP 404) ao buscar employees (ano=%s mes=%s office=%s dept=%s)",
                    ano,
                    mes,
                    office_id,
                    department_id,
                )
                return []

            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        logger.warning(
            "HTTP %s ao buscar employees (ano=%s mes=%s office=%s dept=%s) — retornando vazio",
            exc.response.status_code,
            ano,
            mes,
            office_id,
            department_id,
        )
        return []
    except httpx.RequestError as exc:
        logger.warning(
            "Erro de conexão ao buscar employees (ano=%s mes=%s office=%s dept=%s): %s — retornando vazio",
            ano,
            mes,
            office_id,
            department_id,
            exc,
        )
        return []

    employee_rows = _extract_employee_rows(data)
    if not employee_rows:
        logger.warning("Resposta inesperada (employees): %s", type(data))
        return []

    return [
        _parse_employee_item(item, ano, mes, office_id, department_id)
        for item in employee_rows
        if isinstance(item, dict)
    ]


async def search_employees(
    ano: int,
    mes: int,
    keyword: str,
) -> list[FolhaEmployeeItem]:
    """Busca servidores por palavra-chave (RoleSearch).

    Args:
        ano: Ano de referência.
        mes: Mês de referência (1-12).
        keyword: Palavra-chave para busca (nome, CPF, etc.).

    Returns:
        Lista de FolhaEmployeeItem.

    Raises:
        FolhaAPIError: Em caso de falha na comunicação.
    """
    params = {
        "entity": _ENTITY,
        "currentMonth": str(mes),
        "currentYear": str(ano),
        "keyword": keyword,
    }
    url = f"{_BASE_URL}/RoleSearch"

    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            response = await client.get(url, params=params, headers=_HEADERS)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        logger.error(
            "HTTP %s ao buscar employees (keyword=%s ano=%s mes=%s)",
            exc.response.status_code,
            keyword,
            ano,
            mes,
        )
        raise FolhaAPIError(
            f"Erro ao buscar employees: HTTP {exc.response.status_code}",
            status_code=exc.response.status_code,
        ) from exc
    except httpx.RequestError as exc:
        logger.error("Erro de conexão ao buscar employees: %s", exc)
        raise FolhaAPIError("Erro de conexão com a API externa") from exc

    employee_rows = _extract_employee_rows(data, nested_search=True)
    if not employee_rows:
        logger.warning("Resposta inesperada (search): %s", type(data))
        return []

    return [_parse_employee_item(item, ano, mes, 0, 0) for item in employee_rows if isinstance(item, dict)]

def _extract_office_rows(data: object) -> list[dict]:
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    if isinstance(data, dict):
        return [item for item in data.values() if isinstance(item, dict)]
    return []

def _extract_employee_rows(data: object, nested_search: bool = False) -> list[dict]:
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    if not isinstance(data, dict):
        return []
    values: list[object] = []
    if nested_search:
        for value in data.values():
            if isinstance(value, dict):
                values.extend(value.values())
    else:
        values = list(data.values())

    rows: list[dict] = []
    for value in values:
        if not isinstance(value, dict):
            continue
        role_rows = value.get("roles")
        if isinstance(role_rows, list):
            rows.extend(item for item in role_rows if isinstance(item, dict))
    return rows

def _parse_employee_item(
    item: dict,
    ano: int,
    mes: int,
    office_id: int,
    department_id: int,
) -> FolhaEmployeeItem:
    """Converte dict da API para FolhaEmployeeItem."""
    return FolhaEmployeeItem(
        ano=ano,
        mes=mes,
        office_id=office_id,
        office_description=str(
            item.get("officeDescription") or item.get("office") or ""
        ),
        department_id=department_id,
        department_description=str(
            item.get("departmentDescription") or item.get("department") or ""
        ),
        contract=str(item.get("contract") or item.get("matricula") or ""),
        name=str(item.get("name") or item.get("nome") or ""),
        cpf=str(item.get("cpf") or ""),
        role=str(item.get("role") or item.get("cargo") or ""),
        class_and_level=str(item.get("classAndLevel") or item.get("classeNivel") or ""),
        state=str(item.get("state") or item.get("situacao") or ""),
        admission_date=str(item.get("admissionDate") or item.get("dataAdmissao") or ""),
        end_date=str(item.get("dataEncerramento") or item.get("endDate") or ""),
        base_salary=_normalize_money(item.get("baseSalary") or item.get("salarioBase")),
        tenth_salary=_normalize_money(
            item.get("tenthSalary")
            or item.get("decimoTerceiro")
            or item.get("13salario")
        ),
        vacation=_normalize_money(item.get("vacation") or item.get("ferias")),
        gratification=_normalize_money(
            item.get("gratification") or item.get("gratificacao")
        ),
        others_earnings=_normalize_money(
            item.get("othersEarnings") or item.get("outrosProventos")
        ),
        discounts=_normalize_money(item.get("discounts") or item.get("descontos")),
        gross_salary=_normalize_money(
            item.get("grossSalary") or item.get("salarioBruto")
        ),
        net_salary=_normalize_money(item.get("netSalary") or item.get("liquido")),
        role_type_id=str(item.get("roleTypeId") or item.get("tipoVinculoId") or ""),
    )
