"""
Adaptador para API externa de Diárias e Passagens (Quality).

Encapsula chamadas HTTP para o portal de diárias Quality.
Não contém lógica de negócio — apenas busca e mapeamento de dados.
"""

from __future__ import annotations

import logging

import httpx

from backend.features.diaria.diaria_types import DiariaItem

logger = logging.getLogger(__name__)

_BASE_URL = (
    "https://web.qualitysistemas.com.br"
    "/diarias_e_passagens/prefeitura_municipal_de_bandeirantes"
)
_ENDPOINT = "buscaDiariaPorAno"
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


class DiariaAPIError(Exception):
    """Erro ao comunicar com API externa de diárias."""

    def __init__(self, message: str, status_code: int | None = None):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def fetch_diarias(
    ano: int,
    mes: int | None = None,
) -> list[DiariaItem]:
    """Busca diárias do portal Quality para um ano e mês opcional.

    Args:
        ano: Ano de referência.
        mes: Mês opcional para filtrar (1-12).

    Returns:
        Lista de DiariaItem.

    Raises:
        DiariaAPIError: Em caso de falha na comunicação.
    """
    params: dict[str, str] = {"ano": str(ano)}
    if mes is not None:
        params["mes"] = str(mes)

    url = f"{_BASE_URL}/{_ENDPOINT}"

    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            response = await client.get(url, params=params, headers=_HEADERS)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        logger.error(
            "HTTP %s ao buscar diárias (ano=%s mes=%s)",
            exc.response.status_code,
            ano,
            mes,
        )
        raise DiariaAPIError(
            f"Erro ao buscar dados na API externa: HTTP {exc.response.status_code}",
            status_code=exc.response.status_code,
        ) from exc
    except httpx.RequestError as exc:
        logger.error("Erro de conexão ao buscar diárias: %s", exc)
        raise DiariaAPIError("Erro de conexão com a API externa") from exc

    if not isinstance(data, list):
        logger.warning("Resposta inesperada da API externa: %s", type(data))
        return []

    items: list[DiariaItem] = []
    for item in data:
        if not isinstance(item, dict):
            continue

        try:
            diaria_item = _parse_diaria_item(item, ano, mes)
            if diaria_item is not None:
                items.append(diaria_item)
        except Exception as exc:
            logger.warning(
                "Falha ao converter item de diária: %s — item=%s",
                exc,
                item.get("numero_empenho", "?"),
            )

    return items


def _parse_diaria_item(
    item: dict,
    ano: int,
    mes: int | None = None,
) -> DiariaItem | None:
    """Converte um item do JSON da API para DiariaItem.

    Args:
        item: Dict do JSON da API.
        ano: Ano de referência.
        mes: Mês opcional inferido.

    Returns:
        DiariaItem ou None se inválido.
    """
    emp = item.get("emp") or item.get("Emp") or item.get("Empenho") or item.get("numero_empenho") or "0"
    liq = item.get("liq") or item.get("Liq") or item.get("Liquidacao") or item.get("numero_liquidacao") or "0"
    nome = item.get("nome") or item.get("Nome") or ""
    historico = item.get("historico") or item.get("Histórico") or item.get("Historico") or ""
    destino = item.get("destino") or item.get("Destino") or ""
    periodo = item.get("periodo") or item.get("Período") or item.get("Periodo") or ""

    valor_total_raw = item.get("valor_total") or item.get("Valor Total") or item.get("valorTotal") or "0"
    valor_devolvido_raw = (
        item.get("valor_devolvido")
        or item.get("Valor Devolvido")
        or item.get("valorDevolvido")
        or "0"
    )

    try:
        valor_total = float(valor_total_raw) if valor_total_raw not in ("", "-") else 0.0
    except (ValueError, TypeError):
        valor_total = 0.0

    try:
        valor_devolvido = (
            float(valor_devolvido_raw) if valor_devolvido_raw not in ("", "-") else 0.0
        )
    except (ValueError, TypeError):
        valor_devolvido = 0.0

    item_mes = mes
    if item_mes is None:
        try:
            item_mes = int(item.get("mes", 0))
        except (ValueError, TypeError):
            item_mes = 0

    return DiariaItem(
        numero_empenho=int(emp) if str(emp).strip().isdigit() else 0,
        numero_liquidacao=int(liq) if str(liq).strip().isdigit() else 0,
        nome=str(nome).strip(),
        historico=str(historico).strip(),
        destino=str(destino).strip(),
        periodo=str(periodo).strip(),
        valor_total=valor_total,
        valor_devolvido=valor_devolvido,
        ano=ano,
        mes=item_mes,
    )
