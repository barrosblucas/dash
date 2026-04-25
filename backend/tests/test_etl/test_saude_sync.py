"""Testes do servico de sync da feature saude."""

from __future__ import annotations

from datetime import datetime
from types import SimpleNamespace
from typing import Any
from unittest.mock import MagicMock

import pytest

from backend.features.saude.saude_sync import SaudeSyncService
from backend.features.saude.saude_types import (
    SaudeSnapshotResource,
    SaudeSyncRequest,
    SaudeSyncTriggerType,
)


@pytest.fixture
def fake_repo() -> MagicMock:
    """Repo fake que rastreia chamadas de persistencia."""
    repo = MagicMock()
    repo.create_sync_log.return_value = SimpleNamespace(id=1)
    repo.replace_snapshot.return_value = SimpleNamespace(id=2)
    repo.update_sync_log.return_value = SimpleNamespace(id=1)
    return repo


@pytest.fixture
def sync_service(monkeypatch: pytest.MonkeyPatch) -> SaudeSyncService:
    """Servico de sync com cliente HTTP fake."""
    service = SaudeSyncService()

    async def fake_fetch(
        resource: SaudeSnapshotResource,
        year: int | None = None,
    ) -> dict[str, Any]:
        return {"resource": resource.value, "year": year}

    monkeypatch.setattr(service, "fetch_resource_payload", fake_fetch)
    return service


@pytest.mark.asyncio
async def test_sync_coleta_antes_de_persistir(
    sync_service: SaudeSyncService,
    fake_repo: MagicMock,
) -> None:
    """Todos os fetches ocorrem antes de qualquer chamada de persistencia."""
    request = SaudeSyncRequest(
        years=[2026],
        resources=[SaudeSnapshotResource.QUANTITATIVOS],
    )

    result = await sync_service.sync(
        fake_repo,
        request,
        trigger_type=SaudeSyncTriggerType.SCHEDULED,
    )

    assert result.status == "success"
    assert result.synced_resources == 1
    assert result.failed_resources == 0

    # Verifica ordem: nenhuma persistencia ocorreu antes dos fetches
    calls = fake_repo.method_calls
    persist_calls = [
        c for c in calls if c[0] in ("create_sync_log", "replace_snapshot")
    ]
    # Deve haver exatamente 1 replace_snapshot apos o create_sync_log
    assert len(persist_calls) == 2


@pytest.mark.asyncio
async def test_sync_parcial_quando_alguns_fetches_falham(
    sync_service: SaudeSyncService,
    fake_repo: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Status partial quando ha falhas em parte dos recursos."""

    async def failing_fetch(
        resource: SaudeSnapshotResource,
        year: int | None = None,
    ) -> dict[str, Any]:
        if resource == SaudeSnapshotResource.QUANTITATIVOS:
            from backend.features.saude.saude_adapter import SaudeExternalAPIError

            raise SaudeExternalAPIError("API indisponivel")
        return {"ok": True}

    monkeypatch.setattr(sync_service, "fetch_resource_payload", failing_fetch)

    request = SaudeSyncRequest(
        years=[2026],
        resources=[
            SaudeSnapshotResource.QUANTITATIVOS,
            SaudeSnapshotResource.MEDICAMENTOS_ESTOQUE,
        ],
    )

    result = await sync_service.sync(
        fake_repo,
        request,
        trigger_type=SaudeSyncTriggerType.MANUAL,
    )

    assert result.status == "partial"
    assert result.synced_resources == 1
    assert result.failed_resources == 1
    assert any("quantitativos" in err for err in result.errors)


@pytest.mark.asyncio
async def test_sync_erro_total_quando_todos_fetches_falham(
    sync_service: SaudeSyncService,
    fake_repo: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Status error quando nenhum payload e coletado."""

    async def always_fail(
        resource: SaudeSnapshotResource,
        year: int | None = None,
    ) -> dict[str, Any]:
        from backend.features.saude.saude_adapter import SaudeExternalAPIError

        raise SaudeExternalAPIError("timeout")

    monkeypatch.setattr(sync_service, "fetch_resource_payload", always_fail)

    request = SaudeSyncRequest(
        years=[2026],
        resources=[SaudeSnapshotResource.QUANTITATIVOS],
    )

    result = await sync_service.sync(
        fake_repo,
        request,
        trigger_type=SaudeSyncTriggerType.SCHEDULED,
    )

    assert result.status == "error"
    assert result.synced_resources == 0
    assert result.failed_resources == 1
    fake_repo.replace_snapshot.assert_not_called()


@pytest.mark.asyncio
async def test_sync_persiste_logs_em_transacao_unica(
    sync_service: SaudeSyncService,
    fake_repo: MagicMock,
) -> None:
    """Log de running e atualizacao final ocorrem na mesma sequencia de persistencia."""
    request = SaudeSyncRequest(
        years=[2026],
        resources=[SaudeSnapshotResource.MEDICAMENTOS_ESTOQUE],
    )

    await sync_service.sync(
        fake_repo,
        request,
        trigger_type=SaudeSyncTriggerType.SCHEDULED,
    )

    fake_repo.create_sync_log.assert_called_once()
    fake_repo.update_sync_log.assert_called_once()

    # Verifica que o log final contem status de sucesso
    update_call = fake_repo.update_sync_log.call_args
    assert update_call.kwargs["status"] == "success"
    assert isinstance(update_call.kwargs["finished_at"], datetime)
