"""Testes do bootstrap histórico e deduplicacao de snapshots da feature saude."""

from __future__ import annotations

from datetime import UTC, datetime
from types import SimpleNamespace
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from backend.features.saude.saude_data import SQLSaudeRepository
from backend.features.saude.saude_historical_bootstrap import (
    SaudeHistoricalBootstrapService,
)
from backend.features.saude.saude_types import (
    SaudeSnapshotResource,
    SaudeSyncTriggerType,
)


class FakeSnapshotModel:
    """Modelo fake de snapshot para simular o banco."""

    def __init__(
        self,
        resource: str,
        scope_year: int | None,
        payload_json: str,
        synced_at: datetime,
    ) -> None:
        self.resource = resource
        self.scope_year = scope_year
        self.payload_json = payload_json
        self.synced_at = synced_at


class FakeSession:
    """Sessao fake que rastreia adicoes e flushes."""

    def __init__(self) -> None:
        self.added: list[Any] = []
        self.flushed = 0

    def add(self, obj: Any) -> None:
        self.added.append(obj)

    def flush(self) -> None:
        self.flushed += 1

    def refresh(self, obj: Any) -> None:
        if not hasattr(obj, "id"):
            obj.id = 1

    def query(self, model: Any) -> Any:
        return FakeQuery(self.added)


class FakeQuery:
    def __init__(self, items: list[Any]) -> None:
        self._items = items
        self._filters: list[Any] = []

    def filter(self, *conds: Any) -> FakeQuery:
        self._filters.extend(conds)
        return self

    def order_by(self, *args: Any) -> FakeQuery:
        return self

    def first(self) -> Any | None:
        return self._items[0] if self._items else None

    def all(self) -> list[Any]:
        return list(self._items)

    def delete(self) -> int:
        return 0

    def limit(self, n: int) -> FakeQuery:
        return FakeQuery(self._items[:n])


@pytest.fixture
def fake_repo() -> SQLSaudeRepository:
    """Repositorio fake com sessao fake."""
    session: Any = FakeSession()  # type: ignore[assignment]  # mock de sessao para testes unitarios
    return SQLSaudeRepository(session)


class TestSnapshotDeduplication:
    """Testes de deduplicacao no replace_snapshot."""

    def test_nao_insere_quando_payload_identico(
        self,
        fake_repo: SQLSaudeRepository,
    ) -> None:
        """Nao cria novo registro quando payload e identico ao existente."""
        payload = {"labels": ["Jan", "Fev"], "datasets": [{"data": [1, 2]}]}
        synced_at = datetime(2026, 1, 1, 12, 0, 0)

        # Primeira insercao
        first = fake_repo.replace_snapshot(
            resource=SaudeSnapshotResource.MEDICAMENTOS_ATENDIMENTOS_MENSAL,
            payload=payload,
            synced_at=synced_at,
            scope_year=2025,
        )
        assert first is not None
        session: Any = fake_repo.session  # type: ignore[assignment]  # mock de sessao para testes unitarios
        assert len(session.added) == 1

        # Segunda insercao com mesmo payload
        second = fake_repo.replace_snapshot(
            resource=SaudeSnapshotResource.MEDICAMENTOS_ATENDIMENTOS_MENSAL,
            payload=payload,
            synced_at=datetime(2026, 1, 1, 13, 0, 0),
            scope_year=2025,
        )
        # Deve retornar o mesmo objeto (ou equivalente) sem adicionar novo
        assert second is not None
        assert len(session.added) == 1

    def test_insere_quando_payload_diferente(
        self,
        fake_repo: SQLSaudeRepository,
    ) -> None:
        """Cria novo registro quando payload mudou."""
        payload1 = {"labels": ["Jan"], "datasets": [{"data": [1]}]}
        payload2 = {"labels": ["Jan"], "datasets": [{"data": [2]}]}

        fake_repo.replace_snapshot(
            resource=SaudeSnapshotResource.MEDICAMENTOS_ATENDIMENTOS_MENSAL,
            payload=payload1,
            synced_at=datetime(2026, 1, 1, 12, 0, 0),
            scope_year=2025,
        )
        session: Any = fake_repo.session  # type: ignore[assignment]  # mock de sessao para testes unitarios
        assert len(session.added) == 1

        fake_repo.replace_snapshot(
            resource=SaudeSnapshotResource.MEDICAMENTOS_ATENDIMENTOS_MENSAL,
            payload=payload2,
            synced_at=datetime(2026, 1, 1, 13, 0, 0),
            scope_year=2025,
        )
        assert len(session.added) == 2

    def test_insere_quando_nao_existe_snapshot(
        self,
        fake_repo: SQLSaudeRepository,
    ) -> None:
        """Cria registro quando nao ha snapshot previo."""
        payload = {"labels": ["Jan"], "datasets": [{"data": [1]}]}

        result = fake_repo.replace_snapshot(
            resource=SaudeSnapshotResource.MEDICAMENTOS_RANKING,
            payload=payload,
            synced_at=datetime(2026, 1, 1, 12, 0, 0),
        )
        assert result is not None
        session: Any = fake_repo.session  # type: ignore[assignment]  # mock de sessao para testes unitarios
        assert len(session.added) == 1


class TestSaudeHistoricalBootstrap:
    """Testes do bootstrap histórico de saúde."""

    @pytest.mark.asyncio
    async def test_nao_executa_quando_nao_ha_anos_faltantes(self) -> None:
        """Bootstrap nao executa quando todos os anos ja existem."""
        service = SaudeHistoricalBootstrapService(min_year=2025)

        with patch.object(
            service,
            "_collect_missing_years",
            return_value={},
        ):
            result = await service.bootstrap_missing_years()

        assert result.executed is False
        assert result.synced_resources == 0

    @pytest.mark.asyncio
    async def test_executa_sync_para_anos_faltantes(self) -> None:
        """Bootstrap dispara sync para recursos com anos faltantes."""
        service = SaudeHistoricalBootstrapService(min_year=2025)
        missing = {
            SaudeSnapshotResource.MEDICAMENTOS_ATENDIMENTOS_MENSAL: [2025],
        }

        fake_response = SimpleNamespace(
            status="success",
            synced_resources=1,
            errors=[],
        )

        with patch.object(
            service,
            "_collect_missing_years",
            return_value=missing,
        ), patch.object(
            SaudeHistoricalBootstrapService,
            "_existing_years_for_resource",
            return_value=set(),
        ), patch(
            "backend.features.saude.saude_historical_bootstrap.SaudeSyncService.sync",
            return_value=fake_response,
        ) as mock_sync:
            result = await service.bootstrap_missing_years()

        assert result.executed is True
        assert result.synced_resources == 1
        mock_sync.assert_awaited_once()
        call_args = mock_sync.call_args
        assert call_args.kwargs["trigger_type"] == SaudeSyncTriggerType.BOOTSTRAP

    @pytest.mark.asyncio
    async def test_registra_warnings_em_erros(self) -> None:
        """Bootstrap captura erros e os registra como warnings."""
        service = SaudeHistoricalBootstrapService(min_year=2025)
        missing = {
            SaudeSnapshotResource.MEDICAMENTOS_ATENDIMENTOS_MENSAL: [2025],
        }

        with patch.object(
            service,
            "_collect_missing_years",
            return_value=missing,
        ), patch(
            "backend.features.saude.saude_historical_bootstrap.SaudeSyncService.sync",
            side_effect=Exception("timeout"),
        ):
            result = await service.bootstrap_missing_years()

        assert result.executed is True
        assert result.synced_resources == 0
        assert any("timeout" in w for w in result.warnings)

    def test_collect_missing_years_com_anos_existentes(
        self,
    ) -> None:
        """Anos ja presentes no banco sao excluidos do bootstrap."""
        service = SaudeHistoricalBootstrapService(min_year=2025)
        repo = MagicMock()
        repo.list_snapshot_models.return_value = [
            FakeSnapshotModel(
                resource=SaudeSnapshotResource.MEDICAMENTOS_ATENDIMENTOS_MENSAL.value,
                scope_year=2025,
                payload_json='{}',
                synced_at=datetime.now(UTC),
            ),
        ]

        with patch.object(
            service,
            "_existing_years_for_resource",
            return_value={2025},
        ):
            missing = service._collect_missing_years(repo, [2025, 2026])

        assert SaudeSnapshotResource.MEDICAMENTOS_ATENDIMENTOS_MENSAL in missing
        assert 2025 not in missing[SaudeSnapshotResource.MEDICAMENTOS_ATENDIMENTOS_MENSAL]
        assert 2026 in missing[SaudeSnapshotResource.MEDICAMENTOS_ATENDIMENTOS_MENSAL]
