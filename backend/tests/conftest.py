"""Fixtures compartilhadas de integração do backend."""

from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from backend.shared.database.connection import DatabaseManager
from backend.shared.settings import get_settings


class FakeScrapingScheduler:
    def start(self) -> None:
        return None

    def stop(self) -> None:
        return None

    def get_status(self) -> dict[str, object]:
        return {"last_run_result": None, "next_run_time": None}

    async def trigger_manual(self, year: int, data_type: str) -> dict[str, object]:
        return {
            "status": "SUCCESS",
            "receitas_processed": 0,
            "despesas_processed": 0,
            "errors": [],
            "year": year,
            "data_type": data_type,
        }


class FakeSaudeScheduler:
    def start(self) -> None:
        return None

    def stop(self) -> None:
        return None

    def get_status(self) -> dict[str, object]:
        return {"running": False, "last_run_result": None, "next_run_time": None}

    async def trigger_manual(self, payload: object) -> dict[str, object]:
        return {
            "status": "success",
            "years": [],
            "resources": [],
            "synced_resources": 0,
            "failed_resources": 0,
            "errors": [],
            "started_at": "2026-04-23T00:00:00",
            "finished_at": "2026-04-23T00:00:00",
        }


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Iterator[TestClient]:
    monkeypatch.setenv("BOOTSTRAP_ADMIN_NAME", "Admin Root")
    monkeypatch.setenv("BOOTSTRAP_ADMIN_EMAIL", "admin@example.com")
    monkeypatch.setenv("BOOTSTRAP_ADMIN_PASSWORD", "Admin@12345")
    monkeypatch.setenv("CORS_ORIGINS", '["http://localhost:3000"]')
    get_settings.cache_clear()

    test_db_manager = DatabaseManager(tmp_path / "test.db")

    from backend.features.saude import saude_scheduler
    from backend.features.scraping import scraping_handler, scraping_scheduler
    from backend.shared.database import connection

    monkeypatch.setattr(connection, "db_manager", test_db_manager)
    monkeypatch.setattr(scraping_handler, "db_manager", test_db_manager)
    monkeypatch.setattr(scraping_scheduler, "ScrapingScheduler", FakeScrapingScheduler)
    monkeypatch.setattr(saude_scheduler, "SaudeScheduler", FakeSaudeScheduler)

    import backend.api.main as main_module

    monkeypatch.setattr(main_module, "db_manager", test_db_manager)
    monkeypatch.setattr(main_module, "init_database", test_db_manager.create_tables)
    monkeypatch.setattr(
        main_module.HistoricalDataBootstrapService,
        "bootstrap_missing_years",
        lambda self: SimpleNamespace(
            executed=False,
            receitas_missing_years=[],
            despesas_missing_years=[],
            detalhamento_missing_years=[],
            warnings=[],
        ),
    )

    with TestClient(main_module.app) as test_client:
        yield test_client

    get_settings.cache_clear()


@pytest.fixture
def admin_login(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/v1/identity/login",
        json={"email": "admin@example.com", "password": "Admin@12345"},
    )
    assert response.status_code == 200
    payload = response.json()
    return {
        "Authorization": f"Bearer {payload['access_token']}",
        "refresh_token": payload["refresh_token"],
    }
