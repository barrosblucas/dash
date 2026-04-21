"""Testes do sincronizador de PDF de despesas."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from backend.features.scraping.expense_pdf_sync_service import ExpensePDFSyncService


class _FakeResponse:
    def __init__(
        self,
        status_code: int,
        headers: dict[str, str],
        content: bytes,
    ) -> None:
        self.status_code = status_code
        self.headers = headers
        self.content = content

    def json(self) -> Any:
        return json.loads(self.content.decode("utf-8"))


class _FakeAsyncClient:
    def __init__(
        self,
        *args: Any,
        responses: list[_FakeResponse],
        request_collector: list[dict[str, Any]] | None = None,
        **kwargs: Any,
    ) -> None:
        self._responses = responses
        self._request_collector = request_collector

    async def __aenter__(self) -> _FakeAsyncClient:
        return self

    async def __aexit__(self, exc_type: Any, exc: Any, tb: Any) -> None:
        return None

    async def get(
        self,
        url: str,
        params: dict[str, str] | None = None,
        headers: dict[str, str] | None = None,
    ) -> _FakeResponse:
        if self._request_collector is not None:
            self._request_collector.append(
                {
                    "url": url,
                    "params": params,
                    "headers": headers,
                }
            )

        if not self._responses:
            raise AssertionError("Resposta fake não configurada para chamada HTTP")

        return self._responses.pop(0)


@pytest.mark.asyncio
async def test_sync_year_pdf_salva_arquivo_quando_resposta_valida(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = ExpensePDFSyncService(data_root=tmp_path)
    request_data: list[dict[str, Any]] = []
    payload = b"%PDF-1.7\n" + (b"x" * 2048)

    def fake_async_client_factory(*args: Any, **kwargs: Any) -> _FakeAsyncClient:
        return _FakeAsyncClient(
            responses=[
                _FakeResponse(
                    status_code=200,
                    headers={"content-type": "text/html; charset=utf-8"},
                    content=(
                        b'{"path":"file/255/abc123/NaturezaDespesa.pdf"}'
                    ),
                ),
                _FakeResponse(
                    status_code=200,
                    headers={"content-type": "application/pdf"},
                    content=payload,
                ),
            ],
            request_collector=request_data,
        )

    monkeypatch.setattr(
        "backend.features.scraping.expense_pdf_sync_service.httpx.AsyncClient",
        fake_async_client_factory,
    )
    monkeypatch.setattr(
        ExpensePDFSyncService,
        "_has_pdf_pages",
        lambda self, pdf_bytes: True,
    )

    result = await service.sync_year_pdf(2026)

    target = tmp_path / "despesas" / "2026.pdf"

    assert result.success is True
    assert result.status_code == 200
    assert result.bytes_downloaded == len(payload)
    assert target.exists()
    assert target.read_bytes() == payload

    assert len(request_data) == 2
    assert request_data[0]["url"].endswith("/despesas//RelatorioPdf")
    assert request_data[0]["params"]["ano"] == "2026"
    assert request_data[0]["params"]["unidadeGestora"] == "CONSOLIDADO"
    assert request_data[0]["params"]["tipo"] == "naturezaDespesa"
    assert request_data[1]["url"].endswith("file/255/abc123/NaturezaDespesa.pdf")


@pytest.mark.asyncio
async def test_sync_year_pdf_nao_substitui_arquivo_em_conteudo_invalido(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = ExpensePDFSyncService(data_root=tmp_path)
    target = tmp_path / "despesas" / "2026.pdf"
    target.parent.mkdir(parents=True, exist_ok=True)
    old_payload = b"%PDF-1.7\nold"
    target.write_bytes(old_payload)

    def fake_async_client_factory(*args: Any, **kwargs: Any) -> _FakeAsyncClient:
        return _FakeAsyncClient(
            responses=[
                _FakeResponse(
                    status_code=200,
                    headers={"content-type": "text/html; charset=utf-8"},
                    content=(
                        b'{"path":"file/255/abc123/NaturezaDespesa.pdf"}'
                    ),
                ),
                _FakeResponse(
                    status_code=200,
                    headers={"content-type": "text/html"},
                    content=b"<html>erro</html>",
                ),
            ]
        )

    monkeypatch.setattr(
        "backend.features.scraping.expense_pdf_sync_service.httpx.AsyncClient",
        fake_async_client_factory,
    )

    result = await service.sync_year_pdf(2026)

    assert result.success is False
    assert "Conteúdo inválido" in result.message
    assert target.read_bytes() == old_payload


@pytest.mark.asyncio
async def test_sync_year_pdf_retorna_falha_em_http_500(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = ExpensePDFSyncService(data_root=tmp_path)

    def fake_async_client_factory(*args: Any, **kwargs: Any) -> _FakeAsyncClient:
        return _FakeAsyncClient(
            responses=[
                _FakeResponse(
                    status_code=500,
                    headers={"content-type": "text/plain"},
                    content=b"",
                )
            ]
        )

    monkeypatch.setattr(
        "backend.features.scraping.expense_pdf_sync_service.httpx.AsyncClient",
        fake_async_client_factory,
    )

    result = await service.sync_year_pdf(2026)

    assert result.success is False
    assert result.status_code == 500
    assert "HTTP 500" in result.message


@pytest.mark.asyncio
async def test_sync_year_pdf_reprova_pdf_muito_pequeno(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = ExpensePDFSyncService(data_root=tmp_path)

    def fake_async_client_factory(*args: Any, **kwargs: Any) -> _FakeAsyncClient:
        return _FakeAsyncClient(
            responses=[
                _FakeResponse(
                    status_code=200,
                    headers={"content-type": "text/html; charset=utf-8"},
                    content=(
                        b'{"path":"file/255/abc123/NaturezaDespesa.pdf"}'
                    ),
                ),
                _FakeResponse(
                    status_code=200,
                    headers={"content-type": "application/pdf"},
                    content=b"%PDF-1.7\nshort",
                ),
            ]
        )

    monkeypatch.setattr(
        "backend.features.scraping.expense_pdf_sync_service.httpx.AsyncClient",
        fake_async_client_factory,
    )

    result = await service.sync_year_pdf(2026)

    assert result.success is False
    assert "inválido" in result.message


@pytest.mark.asyncio
async def test_sync_year_pdf_reprova_pdf_sem_paginas_e_preserva_anterior(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = ExpensePDFSyncService(data_root=tmp_path)
    target = tmp_path / "despesas" / "2026.pdf"
    target.parent.mkdir(parents=True, exist_ok=True)
    old_payload = b"%PDF-1.7\nold"
    target.write_bytes(old_payload)

    payload = b"%PDF-1.7\n" + (b"x" * 2048)

    def fake_async_client_factory(*args: Any, **kwargs: Any) -> _FakeAsyncClient:
        return _FakeAsyncClient(
            responses=[
                _FakeResponse(
                    status_code=200,
                    headers={"content-type": "text/html; charset=utf-8"},
                    content=(
                        b'{"path":"file/255/abc123/NaturezaDespesa.pdf"}'
                    ),
                ),
                _FakeResponse(
                    status_code=200,
                    headers={"content-type": "application/pdf"},
                    content=payload,
                ),
            ]
        )

    monkeypatch.setattr(
        "backend.features.scraping.expense_pdf_sync_service.httpx.AsyncClient",
        fake_async_client_factory,
    )
    monkeypatch.setattr(
        ExpensePDFSyncService,
        "_has_pdf_pages",
        lambda self, pdf_bytes: False,
    )

    result = await service.sync_year_pdf(2026)

    assert result.success is False
    assert "sem páginas válidas" in result.message
    assert target.read_bytes() == old_payload
