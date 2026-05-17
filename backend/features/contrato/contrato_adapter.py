"""
Adaptador para API externa de Contratos (Quality).

Encapsula chamadas HTTP para o portal de contratos Quality.
Não contém lógica de negócio — apenas busca e mapeamento de dados.
"""

from __future__ import annotations

import json
import logging

import httpx

from backend.features.contrato.contrato_types import ContratoFiscal, ContratoItem

logger = logging.getLogger(__name__)

_BASE_URL = (
    "https://web.qualitysistemas.com.br"
    "/contratos_e_convenios/prefeitura_municipal_de_bandeirantes"
)
_ENDPOINT = "buscaContratoPorAno"
_REQUEST_TIMEOUT = 30.0

_HEADERS = {
    "X-Requested-With": "XMLHttpRequest",
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Referer": _BASE_URL,
    "Accept": "application/json, text/javascript, */*; q=0.01",
}


class ContratoAPIError(Exception):
    """Erro ao comunicar com API externa de contratos."""

    def __init__(self, message: str, status_code: int | None = None):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def fetch_contratos(ano: int, tipo: str | None = None) -> list[ContratoItem]:
    """Busca contratos do portal Quality para um ano.

    Args:
        ano: Ano de referência.
        tipo: Filtrar por tipo (ex: "CONTRATO PRINCIPAL", None para todos).

    Returns:
        Lista de ContratoItem.

    Raises:
        ContratoAPIError: Em caso de falha na comunicação.
    """
    params: dict[str, str] = {"ano": str(ano)}
    if tipo is not None:
        params["tipo"] = tipo

    url = f"{_BASE_URL}/{_ENDPOINT}"

    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            response = await client.get(url, params=params, headers=_HEADERS)

            if response.status_code >= 500:
                logger.warning(
                    "API externa indisponível (HTTP %d) ao buscar contratos (ano=%s tipo=%s) — retornando vazio",
                    response.status_code,
                    ano,
                    tipo,
                )
                return []

            if response.status_code == 404:
                logger.info(
                    "Nenhum dado encontrado (HTTP 404) ao buscar contratos (ano=%s tipo=%s)",
                    ano,
                    tipo,
                )
                return []

            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        logger.warning(
            "HTTP %s ao buscar contratos (ano=%s tipo=%s) — retornando vazio",
            exc.response.status_code,
            ano,
            tipo,
        )
        return []
    except httpx.ConnectError:
        logger.warning(
            "API externa indisponível ao buscar contratos (ano=%s tipo=%s) — retornando vazio",
            ano,
            tipo,
        )
        return []
    except Exception as exc:
        logger.warning(
            "Erro inesperado ao buscar contratos (ano=%s tipo=%s): %s — retornando vazio",
            ano,
            tipo,
            exc,
        )
        return []

    if not isinstance(data, list):
        logger.warning("Resposta inesperada da API externa: %s", type(data))
        return []

    items: list[ContratoItem] = []
    for item in data:
        if not isinstance(item, dict):
            continue

        try:
            contrato_item = _parse_contrato_item(item, ano)
            if contrato_item is not None:
                items.append(contrato_item)
        except Exception as exc:
            logger.warning(
                "Falha ao converter item de contrato: %s — item=%s",
                exc,
                item.get("numero", "?"),
            )

    return items


async def fetch_contrato_detalhe(
    ano: int, numero: str
) -> dict | None:
    """Busca detalhes de um contrato específico no portal Quality.

    Args:
        ano: Ano de referência.
        numero: Número do contrato.

    Returns:
        Dict com dados brutos do detalhe, ou None se não encontrado.
    """
    params: dict[str, str] = {"ano": str(ano), "numero": numero}
    url = f"{_BASE_URL}/{_ENDPOINT}"

    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            response = await client.get(url, params=params, headers=_HEADERS)

            if response.status_code >= 500:
                logger.warning(
                    "API externa indisponível (HTTP %d) ao buscar detalhe do contrato (ano=%s numero=%s) — retornando vazio",
                    response.status_code,
                    ano,
                    numero,
                )
                return None

            if response.status_code == 404:
                logger.info(
                    "Nenhum dado encontrado (HTTP 404) ao buscar detalhe do contrato (ano=%s numero=%s)",
                    ano,
                    numero,
                )
                return None

            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        logger.warning(
            "HTTP %s ao buscar detalhe do contrato (ano=%s numero=%s) — retornando vazio",
            exc.response.status_code,
            ano,
            numero,
        )
        return None
    except httpx.ConnectError:
        logger.warning(
            "API externa indisponível ao buscar detalhe do contrato (ano=%s numero=%s) — retornando vazio",
            ano,
            numero,
        )
        return None
    except Exception as exc:
        logger.warning(
            "Erro inesperado ao buscar detalhe do contrato (ano=%s numero=%s): %s — retornando vazio",
            ano,
            numero,
            exc,
        )
        return None

    if isinstance(data, dict):
        return dict(data)
    if isinstance(data, list) and len(data) > 0:
        return dict(data[0]) if isinstance(data[0], dict) else None
    return None


def _parse_contrato_item(item: dict, ano: int) -> ContratoItem | None:
    """Converte um item do JSON da API para ContratoItem.

    Args:
        item: Dict do JSON da API.
        ano: Ano de referência.

    Returns:
        ContratoItem ou None se inválido.
    """
    numero = item.get("numero") or item.get("Contrato") or ""
    if not numero:
        return None

    fornecedor = item.get("fornecedor") or item.get("Fornecedor") or ""
    cpf_cnpj = item.get("cpf_cnpj") or item.get("CPF/CNPJ") or ""
    tipo = item.get("tipo") or item.get("Tipo") or ""

    vigencia_raw = item.get("vigencia") or item.get("Vigência do Contrato") or "-"

    valor_raw = item.get("valor") or item.get("Valor") or "0"
    try:
        valor = float(valor_raw) if valor_raw not in ("", "-") else 0.0
    except (ValueError, TypeError):
        valor = 0.0

    return ContratoItem(
        numero=str(numero).strip(),
        fornecedor=str(fornecedor).strip(),
        cpf_cnpj=str(cpf_cnpj).strip(),
        tipo=str(tipo).strip(),
        vigencia=str(vigencia_raw).strip(),
        valor=valor,
        ano=ano,
    )


def parse_fiscais_from_json(fiscais_json: str | None) -> list[ContratoFiscal]:
    """Converte JSON string de fiscais para lista de ContratoFiscal.

    Args:
        fiscais_json: JSON string com lista de fiscais.

    Returns:
        Lista de ContratoFiscal.
    """
    if not fiscais_json:
        return []

    try:
        data = json.loads(fiscais_json)
        if not isinstance(data, list):
            return []
        return [
            ContratoFiscal(
                nome=str(f.get("nome", "")),
                tipo=str(f.get("tipo", "")),
                data_inicio=str(f.get("data_inicio", "")),
                data_fim=str(f.get("data_fim", "")),
            )
            for f in data
            if f.get("nome")
        ]
    except (json.JSONDecodeError, TypeError):
        logger.warning("Falha ao parsear fiscais_json: %s", fiscais_json)
        return []
