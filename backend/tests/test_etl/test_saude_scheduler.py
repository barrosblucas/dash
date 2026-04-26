"""Testes do scheduler de saúde."""

# mypy: disable-error-code=import-untyped

from __future__ import annotations

from typing import Any

import pytest
from apscheduler.triggers.interval import IntervalTrigger

from backend.features.saude.saude_scheduler import SaudeScheduler
from backend.features.saude.saude_types import SaudeSyncRequest


def test_start_configura_intervalo_de_dez_minutos(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    scheduler = SaudeScheduler()
    captured: dict[str, Any] = {}

    def fake_add_job(func: Any, trigger: IntervalTrigger, **kwargs: Any) -> None:
        captured["func"] = func
        captured["trigger"] = trigger
        captured["kwargs"] = kwargs

    def fake_start() -> None:
        captured["started"] = True

    monkeypatch.setattr(scheduler._scheduler, "add_job", fake_add_job)
    monkeypatch.setattr(scheduler._scheduler, "start", fake_start)

    scheduler.start()

    assert captured["started"] is True
    assert isinstance(captured["trigger"], IntervalTrigger)
    assert captured["trigger"].interval.total_seconds() == 600  # 10 minutos
    assert captured["kwargs"]["id"] == "saude_sync_recurring"


@pytest.mark.asyncio
async def test_trigger_manual_armazena_ultimo_resultado(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    scheduler = SaudeScheduler()

    async def fake_run_sync(
        trigger_type: Any, payload: SaudeSyncRequest | None = None
    ) -> dict[str, Any]:
        assert payload is not None
        scheduler._last_run_result = {"status": "success", "years": [2026]}
        return scheduler._last_run_result

    monkeypatch.setattr(scheduler, "_run_sync", fake_run_sync)

    result = await scheduler.trigger_manual(
        SaudeSyncRequest(years=[2026], resources=[]),
    )

    assert result["status"] == "success"
    assert scheduler.get_status()["last_run_result"] == {
        "status": "success",
        "years": [2026],
    }
