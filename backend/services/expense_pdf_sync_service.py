"""Serviço para sincronizar o PDF de despesas do portal QualitySistemas."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_ENTITY_SLUG = "prefeitura_municipal_de_bandeirantes"
_UNIDADE_GESTORA = "CONSOLIDADO"
_TIPO_RELATORIO = "naturezaDespesa"

_PDF_GENERATION_URL = "https://web.qualitysistemas.com.br/despesas//RelatorioPdf"
_PDF_FILE_BASE_URL = "https://web.qualitysistemas.com.br/despesas/"
_REQUEST_TIMEOUT_SECONDS = 45.0
_MIN_PDF_BYTES = 1024

_HEADERS_BASE = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Referer": f"https://web.qualitysistemas.com.br/despesas/{_ENTITY_SLUG}",
}

_HEADERS_GENERATION_REQUEST = {
    **_HEADERS_BASE,
    "X-Requested-With": "XMLHttpRequest",
    "Accept": "application/json, text/javascript, */*; q=0.01",
}

_HEADERS_PDF_DOWNLOAD = {
    **_HEADERS_BASE,
    "Accept": "application/pdf,application/octet-stream;q=0.9,*/*;q=0.8",
}


@dataclass(frozen=True)
class ExpensePDFSyncResult:
    """Resultado da sincronização de um PDF anual de despesas."""

    success: bool
    year: int
    file_path: str
    bytes_downloaded: int
    status_code: int | None
    message: str

    def to_dict(self) -> dict[str, Any]:
        """Converte o resultado para dicionário serializável."""
        return {
            "success": self.success,
            "year": self.year,
            "file_path": self.file_path,
            "bytes_downloaded": self.bytes_downloaded,
            "status_code": self.status_code,
            "message": self.message,
        }


class ExpensePDFSyncService:
    """Baixa e atualiza o PDF de despesas em disco com troca atômica."""

    def __init__(self, data_root: Path | None = None) -> None:
        self._data_root = data_root or Path(__file__).resolve().parent.parent.parent
        self._despesas_dir = self._data_root / "despesas"
        self._timeout = httpx.Timeout(_REQUEST_TIMEOUT_SECONDS)

    async def sync_year_pdf(self, year: int) -> ExpensePDFSyncResult:
        """Sincroniza o PDF do ano e substitui o arquivo local se válido.

        O portal de despesas gera o arquivo em duas etapas:
        1) ``RelatorioPdf`` retorna JSON com o caminho do arquivo gerado.
        2) O PDF real é baixado pelo ``path`` retornado.
        """
        self._despesas_dir.mkdir(parents=True, exist_ok=True)

        target_path = self._despesas_dir / f"{year}.pdf"
        temp_path = self._despesas_dir / f"{year}.pdf.tmp"

        params = {
            "entity": _ENTITY_SLUG,
            "ano": str(year),
            "tipo": _TIPO_RELATORIO,
            "unidadeGestora": _UNIDADE_GESTORA,
        }

        try:
            async with httpx.AsyncClient(
                timeout=self._timeout,
                follow_redirects=True,
            ) as client:
                generation_response = await client.get(
                    _PDF_GENERATION_URL,
                    params=params,
                    headers=_HEADERS_GENERATION_REQUEST,
                )

                if generation_response.status_code != httpx.codes.OK:
                    return ExpensePDFSyncResult(
                        success=False,
                        year=year,
                        file_path=str(target_path),
                        bytes_downloaded=0,
                        status_code=generation_response.status_code,
                        message=(
                            "Geração do PDF de despesas retornou "
                            f"HTTP {generation_response.status_code}"
                        ),
                    )

                try:
                    generation_payload = generation_response.json()
                except ValueError:
                    return ExpensePDFSyncResult(
                        success=False,
                        year=year,
                        file_path=str(target_path),
                        bytes_downloaded=len(generation_response.content),
                        status_code=generation_response.status_code,
                        message="Resposta inválida ao gerar PDF de despesas",
                    )

                generated_path = generation_payload.get("path")
                if not isinstance(generated_path, str) or not generated_path.strip():
                    return ExpensePDFSyncResult(
                        success=False,
                        year=year,
                        file_path=str(target_path),
                        bytes_downloaded=len(generation_response.content),
                        status_code=generation_response.status_code,
                        message="Resposta sem caminho de PDF gerado",
                    )

                download_url = generated_path.strip()
                if not download_url.startswith(("http://", "https://")):
                    download_url = f"{_PDF_FILE_BASE_URL}{download_url.lstrip('/')}"

                response = await client.get(
                    download_url,
                    headers=_HEADERS_PDF_DOWNLOAD,
                )
        except httpx.RequestError as exc:
            logger.error("Falha HTTP na sincronização de PDF %d: %s", year, exc)
            return ExpensePDFSyncResult(
                success=False,
                year=year,
                file_path=str(target_path),
                bytes_downloaded=0,
                status_code=None,
                message=f"Erro de requisição ao baixar PDF de despesas: {exc}",
            )

        if response.status_code != httpx.codes.OK:
            return ExpensePDFSyncResult(
                success=False,
                year=year,
                file_path=str(target_path),
                bytes_downloaded=0,
                status_code=response.status_code,
                message=(
                    f"Download do PDF de despesas retornou HTTP {response.status_code}"
                ),
            )

        content_type = response.headers.get("content-type", "").lower()
        pdf_bytes = response.content
        starts_with_pdf_magic = pdf_bytes.startswith(b"%PDF")

        if "pdf" not in content_type and not starts_with_pdf_magic:
            return ExpensePDFSyncResult(
                success=False,
                year=year,
                file_path=str(target_path),
                bytes_downloaded=len(pdf_bytes),
                status_code=response.status_code,
                message=(
                    "Conteúdo inválido ao baixar PDF de despesas "
                    f"(content-type={content_type or 'ausente'})"
                ),
            )

        if len(pdf_bytes) < _MIN_PDF_BYTES or not starts_with_pdf_magic:
            return ExpensePDFSyncResult(
                success=False,
                year=year,
                file_path=str(target_path),
                bytes_downloaded=len(pdf_bytes),
                status_code=response.status_code,
                message="Arquivo PDF de despesas inválido ou incompleto",
            )

        try:
            temp_path.write_bytes(pdf_bytes)
            temp_path.replace(target_path)
        except OSError as exc:
            if temp_path.exists():
                temp_path.unlink(missing_ok=True)
            return ExpensePDFSyncResult(
                success=False,
                year=year,
                file_path=str(target_path),
                bytes_downloaded=len(pdf_bytes),
                status_code=response.status_code,
                message=f"Falha ao salvar PDF de despesas em disco: {exc}",
            )

        logger.info(
            "PDF de despesas sincronizado com sucesso — ano=%d arquivo=%s bytes=%d",
            year,
            target_path,
            len(pdf_bytes),
        )

        return ExpensePDFSyncResult(
            success=True,
            year=year,
            file_path=str(target_path),
            bytes_downloaded=len(pdf_bytes),
            status_code=response.status_code,
            message="PDF de despesas atualizado com sucesso",
        )
