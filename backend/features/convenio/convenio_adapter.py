"""
Adaptador para API externa de Convênios (Quality).

Encapsula chamadas HTTP para o portal de convênios Quality.
Não contém lógica de negócio — apenas busca e mapeamento de dados.
"""

from __future__ import annotations

import logging

import httpx

from backend.features.convenio.convenio_types import (
    ConvenioItem,
    ConvenioMovimentacao,
)

logger = logging.getLogger(__name__)

_BASE_URL = (
    "https://web.qualitysistemas.com.br"
    "/contratos_e_convenios/prefeitura_municipal_de_bandeirantes"
)
_ENDPOINT_CONVENIOS = "buscaConvenioPorAno"
_ENDPOINT_MOVIMENTACOES = "buscaMovimentacaoConvenioPorAno"
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


class ConvenioAPIError(Exception):
    """Erro ao comunicar com API externa de convênios."""

    def __init__(self, message: str, status_code: int | None = None):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def fetch_convenios(ano: int) -> list[ConvenioItem]:
    """Busca convênios do portal Quality para um ano.

    Args:
        ano: Ano de referência.

    Returns:
        Lista de ConvenioItem.

    Raises:
        ConvenioAPIError: Em caso de falha na comunicação.
    """
    params: dict[str, str] = {"ano": str(ano)}
    url = f"{_BASE_URL}/{_ENDPOINT_CONVENIOS}"

    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            response = await client.get(url, params=params, headers=_HEADERS)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        logger.error(
            "HTTP %s ao buscar convênios (ano=%s)",
            exc.response.status_code,
            ano,
        )
        raise ConvenioAPIError(
            f"Erro ao buscar dados na API externa: HTTP {exc.response.status_code}",
            status_code=exc.response.status_code,
        ) from exc
    except httpx.RequestError as exc:
        logger.error("Erro de conexão ao buscar convênios: %s", exc)
        raise ConvenioAPIError("Erro de conexão com a API externa") from exc

    if not isinstance(data, list):
        logger.warning("Resposta inesperada da API externa: %s", type(data))
        return []

    items: list[ConvenioItem] = []
    for item in data:
        if not isinstance(item, dict):
            continue

        try:
            convenio_item = _parse_convenio_item(item, ano)
            if convenio_item is not None:
                items.append(convenio_item)
        except Exception as exc:
            logger.warning(
                "Falha ao converter item de convênio: %s — item=%s",
                exc,
                item.get("numero", "?"),
            )

    return items


async def fetch_convenio_movimentacoes(
    ano: int, mes: int | None = None
) -> list[ConvenioMovimentacao]:
    """Busca movimentações de convênios do portal Quality para um ano.

    Args:
        ano: Ano de referência.
        mes: Mês opcional para filtrar.

    Returns:
        Lista de ConvenioMovimentacao.

    Raises:
        ConvenioAPIError: Em caso de falha na comunicação.
    """
    params: dict[str, str] = {"ano": str(ano)}
    if mes is not None:
        params["mes"] = str(mes)

    url = f"{_BASE_URL}/{_ENDPOINT_MOVIMENTACOES}"

    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            response = await client.get(url, params=params, headers=_HEADERS)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        logger.error(
            "HTTP %s ao buscar movimentações de convênios (ano=%s mes=%s)",
            exc.response.status_code,
            ano,
            mes,
        )
        raise ConvenioAPIError(
            f"Erro ao buscar dados na API externa: HTTP {exc.response.status_code}",
            status_code=exc.response.status_code,
        ) from exc
    except httpx.RequestError as exc:
        logger.error(
            "Erro de conexão ao buscar movimentações de convênios: %s", exc
        )
        raise ConvenioAPIError("Erro de conexão com a API externa") from exc

    if not isinstance(data, list):
        logger.warning(
            "Resposta inesperada da API externa (movimentações): %s", type(data)
        )
        return []

    items: list[ConvenioMovimentacao] = []
    for item in data:
        if not isinstance(item, dict):
            continue

        try:
            mov_item = _parse_movimentacao_item(item, ano, mes)
            if mov_item is not None:
                items.append(mov_item)
        except Exception as exc:
            logger.warning(
                "Falha ao converter item de movimentação: %s — item=%s",
                exc,
                item.get("convenio", "?"),
            )

    return items


def _parse_convenio_item(item: dict, ano: int) -> ConvenioItem | None:
    """Converte um item do JSON da API para ConvenioItem.

    Args:
        item: Dict do JSON da API.
        ano: Ano de referência.

    Returns:
        ConvenioItem ou None se inválido.
    """
    numero = item.get("numero") or item.get("Número") or item.get("Convenio") or ""
    if not numero:
        return None

    assinatura = (
        item.get("assinatura")
        or item.get("Assinatura")
        or item.get("data_assinatura")
        or ""
    )
    tipo = item.get("tipo") or item.get("Tipo") or ""
    esfera = item.get("esfera") or item.get("Esfera") or ""
    concedente = item.get("concedente") or item.get("Concedente") or ""
    convenente = (
        item.get("convenente")
        or item.get("Convenente")
        or item.get("favorecido")
        or item.get("Favorecido")
        or ""
    )
    situacao = item.get("situacao") or item.get("Situação") or item.get("Situacao") or ""
    objeto = item.get("objeto") or item.get("Objeto") or ""

    valor_raw = item.get("valor") or item.get("Valor") or "0"
    try:
        valor = float(valor_raw) if valor_raw not in ("", "-") else 0.0
    except (ValueError, TypeError):
        valor = 0.0

    return ConvenioItem(
        numero=str(numero).strip(),
        assinatura=str(assinatura).strip(),
        tipo=str(tipo).strip(),
        esfera=str(esfera).strip(),
        concedente=str(concedente).strip(),
        convenente=str(convenente).strip(),
        valor=valor,
        situacao=str(situacao).strip(),
        objeto=str(objeto).strip(),
        ano=ano,
    )


def _parse_movimentacao_item(
    item: dict, ano: int, mes: int | None = None
) -> ConvenioMovimentacao | None:
    """Converte um item do JSON da API para ConvenioMovimentacao.

    Args:
        item: Dict do JSON da API.
        ano: Ano de referência.
        mes: Mês opcional inferido.

    Returns:
        ConvenioMovimentacao ou None se inválido.
    """
    convenio = item.get("convenio") or item.get("Convênio") or item.get("Convenio") or ""
    if not convenio:
        return None

    lancamento = item.get("lancamento") or item.get("Lançamento") or item.get("empenho") or item.get("Empenho") or ""
    entidade = item.get("entidade") or item.get("Entidade") or ""
    data = item.get("data") or item.get("Data") or ""
    concedente = item.get("concedente") or item.get("Concedente") or ""
    convenente = (
        item.get("convenente")
        or item.get("Convenente")
        or item.get("favorecido")
        or item.get("Favorecido")
        or ""
    )

    valor_raw = item.get("valor") or item.get("Valor") or "0"
    try:
        valor = float(valor_raw) if valor_raw not in ("", "-") else 0.0
    except (ValueError, TypeError):
        valor = 0.0

    item_mes = mes
    if item_mes is None:
        try:
            item_mes = int(item.get("mes", 0))
        except (ValueError, TypeError):
            item_mes = 0

    # Infer tipo from source: if the endpoint is receita/despesa or by field
    tipo_raw = item.get("tipo") or item.get("Tipo") or ""
    tipo: str = "receita"
    if tipo_raw.upper() in ("DESPESA", "DESPESAS"):
        tipo = "despesa"

    return ConvenioMovimentacao(
        convenio=str(convenio).strip(),
        lancamento=str(lancamento).strip(),
        entidade=str(entidade).strip(),
        data=str(data).strip(),
        concedente=str(concedente).strip(),
        convenente=str(convenente).strip(),
        valor=valor,
        mes=item_mes,
        tipo=tipo,  # type: ignore[arg-type]
    )
