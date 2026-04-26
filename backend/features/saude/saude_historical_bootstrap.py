"""Bootstrap histórico idempotente para snapshots da feature saude."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime

from backend.features.saude.saude_data import SQLSaudeRepository
from backend.features.saude.saude_resource_catalog import DEFAULT_SYNC_RESOURCES
from backend.features.saude.saude_sync import SaudeSyncService, is_year_scoped
from backend.features.saude.saude_types import (
    SaudeSnapshotResource,
    SaudeSyncRequest,
    SaudeSyncTriggerType,
)
from backend.shared.database.connection import db_manager

logger = logging.getLogger(__name__)

_DEFAULT_MIN_YEAR = 2016


@dataclass(frozen=True)
class SaudeHistoricalBootstrapResult:
    """Resultado do bootstrap histórico de saúde."""

    executed: bool
    missing_years_by_resource: dict[str, list[int]] = field(default_factory=dict)
    synced_resources: int = 0
    warnings: list[str] = field(default_factory=list)


class SaudeHistoricalBootstrapService:
    """Preenche anos ausentes de recursos year-scoped no banco de dados."""

    def __init__(self, min_year: int = _DEFAULT_MIN_YEAR) -> None:
        self._min_year = min_year

    async def bootstrap_missing_years(self) -> SaudeHistoricalBootstrapResult:
        """Busca e persiste anos históricos ausentes para recursos year-scoped."""
        current_year = datetime.now(UTC).year
        target_years = list(range(self._min_year, current_year + 1))

        with db_manager.get_session() as session:
            repo = SQLSaudeRepository(session)
            missing_by_resource = self._collect_missing_years(
                repo, target_years
            )

        if not missing_by_resource:
            return SaudeHistoricalBootstrapResult(executed=False)

        sync_service = SaudeSyncService()
        total_synced = 0
        warnings: list[str] = []

        for resource, years in missing_by_resource.items():
            if not years:
                continue
            try:
                request = SaudeSyncRequest(
                    years=sorted(years),
                    resources=[resource],
                )
                with db_manager.get_session() as session:
                    repo = SQLSaudeRepository(session)
                    response = await sync_service.sync(
                        repo,
                        request,
                        trigger_type=SaudeSyncTriggerType.BOOTSTRAP,
                    )
                    total_synced += response.synced_resources
                    if response.errors:
                        warnings.extend(response.errors)
            except Exception as exc:
                logger.exception(
                    "Falha no bootstrap de %s para anos %s",
                    resource.value,
                    years,
                )
                warnings.append(
                    f"{resource.value}: {exc}"
                )

        return SaudeHistoricalBootstrapResult(
            executed=True,
            missing_years_by_resource={
                r.value: y for r, y in missing_by_resource.items()
            },
            synced_resources=total_synced,
            warnings=warnings,
        )

    def _collect_missing_years(
        self,
        repo: SQLSaudeRepository,
        target_years: list[int],
    ) -> dict[SaudeSnapshotResource, list[int]]:
        """Mapeia recursos year-scoped para os anos que ainda não existem no banco."""
        missing: dict[SaudeSnapshotResource, list[int]] = {}
        for resource in DEFAULT_SYNC_RESOURCES:
            if not is_year_scoped(resource):
                continue
            existing = self._existing_years_for_resource(repo, resource)
            missing_years = [y for y in target_years if y not in existing]
            if missing_years:
                missing[resource] = missing_years
        return missing

    @staticmethod
    def _existing_years_for_resource(
        repo: SQLSaudeRepository,
        resource: SaudeSnapshotResource,
    ) -> set[int]:
        """Retorna anos já presentes no banco para um recurso year-scoped."""
        models = repo.list_snapshot_models()
        return {
            int(m.scope_year)
            for m in models
            if m.resource == resource.value and m.scope_year is not None
        }
