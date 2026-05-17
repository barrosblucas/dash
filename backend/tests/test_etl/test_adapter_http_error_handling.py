"""Testes de regressão: adapters retornam [] em vez de lançar em HTTP 404/5xx."""

from __future__ import annotations

from typing import Any
from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest

from backend.features.emenda import emenda_adapter
from backend.features.folha import folha_adapter


def _make_response(status_code: int, json_data: Any = None) -> MagicMock:
    """Build a fake httpx Response with given status_code and json payload."""
    resp = MagicMock(spec=httpx.Response)
    resp.status_code = status_code
    resp.json.return_value = json_data if json_data is not None else []
    resp.text = json_data if isinstance(json_data, str) else ""
    return resp


def _make_async_client(status_code: int, json_data: Any = None) -> AsyncMock:
    """Build a fake AsyncClient whose __aenter__ returns a client with .get()."""
    response = _make_response(status_code, json_data)

    client = AsyncMock()
    client.get = AsyncMock(return_value=response)

    async_cm = AsyncMock()
    async_cm.__aenter__ = AsyncMock(return_value=client)
    async_cm.__aexit__ = AsyncMock(return_value=False)

    return async_cm


# ── Emenda adapter ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_fetch_emendas_returns_empty_on_404(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_client = _make_async_client(404)
    monkeypatch.setattr(emenda_adapter.httpx, "AsyncClient", lambda **_: fake_client)

    result = await emenda_adapter.fetch_emendas(ano=2025)

    assert result == []


@pytest.mark.asyncio
async def test_fetch_emendas_returns_empty_on_500(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_client = _make_async_client(500)
    monkeypatch.setattr(emenda_adapter.httpx, "AsyncClient", lambda **_: fake_client)

    result = await emenda_adapter.fetch_emendas(ano=2025)

    assert result == []


@pytest.mark.asyncio
async def test_fetch_emendas_returns_data_on_200(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    payload = """
    <table>
      <tbody>
        <tr>
          <td>EM-001</td>
          <td>Individual</td>
          <td>123</td>
          <td>Test emenda</td>
          <td>1000,00</td>
          <td><a href=\"/detalhes/1\">Detalhes</a></td>
        </tr>
      </tbody>
    </table>
    """
    fake_client = _make_async_client(200, payload)
    monkeypatch.setattr(emenda_adapter.httpx, "AsyncClient", lambda **_: fake_client)

    result = await emenda_adapter.fetch_emendas(ano=2025)

    assert len(result) == 1
    assert result[0].emenda == "EM-001"
    assert result[0].ano == 2025


# ── Folha adapter — fetch_offices ───────────────────────────────────────────


@pytest.mark.asyncio
async def test_fetch_offices_returns_empty_on_500(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_client = _make_async_client(500)
    monkeypatch.setattr(folha_adapter.httpx, "AsyncClient", lambda **_: fake_client)

    result = await folha_adapter.fetch_offices(ano=2025, mes=1)

    assert result == []


@pytest.mark.asyncio
async def test_fetch_offices_returns_empty_on_404(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_client = _make_async_client(404)
    monkeypatch.setattr(folha_adapter.httpx, "AsyncClient", lambda **_: fake_client)

    result = await folha_adapter.fetch_offices(ano=2025, mes=1)

    assert result == []


@pytest.mark.asyncio
async def test_fetch_offices_returns_data_on_200(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    payload = {
        "1": {
            "id": 1,
            "description": "Secretaria de Educação",
            "departments": [
                {"id": 10, "description": "Escola Municipal A"},
            ],
        }
    }
    fake_client = _make_async_client(200, payload)
    monkeypatch.setattr(folha_adapter.httpx, "AsyncClient", lambda **_: fake_client)

    result = await folha_adapter.fetch_offices(ano=2025, mes=1)

    assert len(result) == 1
    assert result[0].office_id == 1
    assert result[0].department_id == 10


# ── Folha adapter — fetch_employees ─────────────────────────────────────────


@pytest.mark.asyncio
async def test_fetch_employees_returns_empty_on_500(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_client = _make_async_client(500)
    monkeypatch.setattr(folha_adapter.httpx, "AsyncClient", lambda **_: fake_client)

    result = await folha_adapter.fetch_employees(
        ano=2025, mes=1, office_id=1, department_id=10
    )

    assert result == []


@pytest.mark.asyncio
async def test_fetch_employees_returns_empty_on_404(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_client = _make_async_client(404)
    monkeypatch.setattr(folha_adapter.httpx, "AsyncClient", lambda **_: fake_client)

    result = await folha_adapter.fetch_employees(
        ano=2025, mes=1, office_id=1, department_id=10
    )

    assert result == []


@pytest.mark.asyncio
async def test_fetch_employees_returns_data_on_200(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    payload = {
        "Cargo Efetivo": {
            "roleType": "Cargo Efetivo",
            "roles": [
                {
                    "name": "João Silva",
                    "cpf": "123.456.789-00",
                    "role": "Analista",
                    "officeDescription": "Secretaria de Educação",
                    "departmentDescription": "Escola A",
                    "contract": "001",
                    "baseSalary": "5000.00",
                    "grossSalary": "6000.00",
                    "netSalary": "4500.00",
                }
            ],
        }
    }
    fake_client = _make_async_client(200, payload)
    monkeypatch.setattr(folha_adapter.httpx, "AsyncClient", lambda **_: fake_client)

    result = await folha_adapter.fetch_employees(
        ano=2025, mes=1, office_id=1, department_id=10
    )

    assert len(result) == 1
    assert result[0].name == "João Silva"
    assert result[0].ano == 2025
