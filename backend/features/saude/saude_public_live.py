"""Leituras live e utilitários de histórico da feature saude."""

from __future__ import annotations

import json
from datetime import date, datetime
from typing import Any

from backend.features.saude.saude_adapter import ESaudeClient, SaudeExternalAPIError
from backend.features.saude.saude_data import SQLSaudeRepository
from backend.features.saude.saude_public_support import external_error
from backend.features.saude.saude_sync import is_default_scope_for_year
from backend.features.saude.saude_types import SaudeSnapshotResource


async def load_atencao_primaria_cbo(
    repo: SQLSaudeRepository,
    *,
    year: int,
    start_date: date,
) -> tuple[Any | None, datetime | None]:
    if is_default_scope_for_year(start_date, year):
        return repo.get_snapshot_payload(SaudeSnapshotResource.ATENCAO_PRIMARIA_CBO, year)
    client = ESaudeClient()
    try:
        payload = await client.fetch_public_payload(
            "buscar-dados-do-chart/quantidade-de-atendimentos-por-cbo-da-especialidade",
            params={"data_de_inicio": start_date.isoformat()},
        )
    except SaudeExternalAPIError as exc:
        raise external_error(exc) from exc
    return payload, None


async def load_hospital_payload(
    repo: SQLSaudeRepository,
    resource: SaudeSnapshotResource,
    *,
    estabelecimento_id: int | None,
) -> tuple[Any | None, datetime | None]:
    if estabelecimento_id is None:
        return repo.get_snapshot_payload(resource)
    client = ESaudeClient()
    try:
        payload = await client.fetch_public_payload(
            _hospital_resource_path(resource),
            params={"estabelecimento_id": str(estabelecimento_id)},
        )
    except SaudeExternalAPIError as exc:
        raise external_error(exc) from exc
    return payload, None


def history_payload(history: list[Any], index: int) -> Any | None:
    if len(history) <= index:
        return None
    payload_json = history[index].payload_json
    if not isinstance(payload_json, str):
        return None
    return json.loads(payload_json)


def _hospital_resource_path(resource: SaudeSnapshotResource) -> str:
    mapping = {
        SaudeSnapshotResource.HOSPITAL_CENSO: "buscar-censo-dos-leitos-da-internacao",
        SaudeSnapshotResource.HOSPITAL_PROCEDIMENTOS: "dados-hospitalar-quantidade-procedimentos-realizados",
        SaudeSnapshotResource.HOSPITAL_ATENDIMENTOS_MENSAL: "buscar-dados-do-chart/quantidade-de-atendimentos-por-mes-do-hospital",
    }
    return mapping[resource]
