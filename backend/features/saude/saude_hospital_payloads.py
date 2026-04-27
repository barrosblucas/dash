"""Helpers de payload dos endpoints hospitalares públicos."""

from __future__ import annotations

from datetime import date

from backend.features.saude.saude_types import SaudeSnapshotResource


def hospital_resource_path(resource: SaudeSnapshotResource) -> str:
    mapping = {
        SaudeSnapshotResource.HOSPITAL_CENSO: "buscar-censo-dos-leitos-da-internacao",
        SaudeSnapshotResource.HOSPITAL_PROCEDIMENTOS: "dados-hospitalar-quantidade-procedimentos-realizados",
        SaudeSnapshotResource.HOSPITAL_PROCEDIMENTOS_ESPECIALIDADE: "buscar-dados-do-chart/hospitalar-quantidade-de-procedimentos-realizados-por-especialidade",
        SaudeSnapshotResource.HOSPITAL_ATENDIMENTOS_MENSAL: "buscar-dados-do-chart/quantidade-de-atendimentos-por-mes-do-hospital",
        SaudeSnapshotResource.HOSPITAL_ATENDIMENTOS_CID: "buscar-atendimentos-por-cid",
        SaudeSnapshotResource.HOSPITAL_MAPA_CALOR: "buscar-dados-do-chart/mapa-de-calor-atendimentos",
        SaudeSnapshotResource.HOSPITAL_NAO_MUNICIPES: "buscar-dados-do-chart/hospitalar-quantidade-de-atendimentos-nao-municipes",
        SaudeSnapshotResource.HOSPITAL_ATENDIMENTOS_MEDICO: "buscar-dados-do-chart/hospitalar-quantidade-de-atendimentos-por-medico",
        SaudeSnapshotResource.HOSPITAL_ATENDIMENTOS_CBO: "buscar-dados-do-chart/hospitalar-quantidade-de-atendimentos-por-cbo-da-especialidade",
    }
    return mapping[resource]


def hospital_payload_params(
    resource: SaudeSnapshotResource,
    *,
    estabelecimento_id: int | None,
    year: int | None,
    start_date: date | None,
    end_date: date | None,
) -> dict[str, str] | None:
    if resource in {
        SaudeSnapshotResource.HOSPITAL_ATENDIMENTOS_CID,
        SaudeSnapshotResource.HOSPITAL_PROCEDIMENTOS,
    }:
        return hospital_table_range_params(
            estabelecimento_id=estabelecimento_id,
            start_date=start_date,
            end_date=end_date,
        )

    params: dict[str, str] = {}
    if estabelecimento_id is not None:
        params["estabelecimento_id"] = str(estabelecimento_id)
    if year is not None and (start_date is None or end_date is None):
        params["ano"] = str(year)
    if start_date is not None:
        params["data_de_inicio"] = start_date.isoformat()
    if end_date is not None:
        params["data_de_fim"] = end_date.isoformat()
    return params or None


def hospital_source_url(
    resource: SaudeSnapshotResource,
    params: dict[str, str] | None,
) -> str:
    resource_path = hospital_resource_path(resource)
    if not params:
        return f"/publico/saude-transparente/{resource_path}"
    query = "&".join(f"{key}={value}" for key, value in sorted(params.items()))
    return f"/publico/saude-transparente/{resource_path}?{query}"


def hospital_table_range_params(
    *,
    estabelecimento_id: int | None,
    start_date: date | None,
    end_date: date | None,
) -> dict[str, str]:
    params = {
        "search": "",
        "order_column": "quantidade",
        "order_direction": "desc",
        "itemsPerPage": "10",
        "page": "1",
    }
    if start_date is not None:
        params["dataDeInicio"] = start_date.isoformat()
    if end_date is not None:
        params["dataDeFim"] = end_date.isoformat()
    if estabelecimento_id is not None:
        params["estabelecimentoId"] = str(estabelecimento_id)
    return params
