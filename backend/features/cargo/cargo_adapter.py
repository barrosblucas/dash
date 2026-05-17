"""
Adaptador para API externa de Cargos e Salários (Quality).

Encapsula chamadas HTTP para o portal de cargos do Quality.
Não contém lógica de negócio — apenas busca e mapeamento de dados.
"""

from __future__ import annotations

import logging

import httpx

from backend.features.cargo.cargo_types import CargoItem

logger = logging.getLogger(__name__)

_BASE_URL = (
    "https://web.qualitysistemas.com.br"
    "/cargos_e_salarios/prefeitura_municipal_de_bandeirantes"
)
_ENDPOINT = "buscaCargoPorAno"
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

# Mapeamento de categorias extraídas da página Quality
_CATEGORIA_MAP: dict[str, str] = {
    "CARGO EFETIVO": "EFETIVO",
    "EFETIVO": "EFETIVO",
    "CONTRATADOS": "CONTRATADOS",
    "COMISSIONADO": "COMISSIONADO",
    "CONVOCADOS": "CONVOCADOS",
    "ELETIVO": "ELETIVO",
}


class CargoAPIError(Exception):
    """Erro ao comunicar com API externa de cargos."""

    def __init__(self, message: str, status_code: int | None = None):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def fetch_cargos(ano: int, categoria: str | None = None) -> list[CargoItem]:
    """Busca cargos do portal Quality para um ano.

    Args:
        ano: Ano de referência.
        categoria: Filtrar por categoria (ex: "EFETIVO", None para todos).

    Returns:
        Lista de CargoItem.

    Raises:
        CargoAPIError: Em caso de falha na comunicação.
    """
    params: dict[str, str] = {"ano": str(ano)}
    if categoria is not None:
        params["categoria"] = categoria

    url = f"{_BASE_URL}/{_ENDPOINT}"

    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            response = await client.get(url, params=params, headers=_HEADERS)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        logger.error(
            "HTTP %s ao buscar cargos (ano=%s categoria=%s)",
            exc.response.status_code,
            ano,
            categoria,
        )
        raise CargoAPIError(
            f"Erro ao buscar dados na API externa: HTTP {exc.response.status_code}",
            status_code=exc.response.status_code,
        ) from exc
    except httpx.RequestError as exc:
        logger.error("Erro de conexão ao buscar cargos: %s", exc)
        raise CargoAPIError("Erro de conexão com a API externa") from exc

    if not isinstance(data, list):
        logger.warning("Resposta inesperada da API externa: %s", type(data))
        return []

    items: list[CargoItem] = []
    for item in data:
        if not isinstance(item, dict):
            continue

        try:
            cargo_item = _parse_cargo_item(item, ano)
            if cargo_item is not None:
                items.append(cargo_item)
        except Exception as exc:
            logger.warning(
                "Falha ao converter item de cargo: %s — item=%s",
                exc,
                item.get("cargo", "?"),
            )

    return items


def _normalize_categoria(raw: str) -> str:
    """Normaliza o nome da categoria para valor padronizado.

    Args:
        raw: Nome bruto vindo da API.

    Returns:
        Nome padronizado da categoria.
    """
    upper = raw.strip().upper()
    return _CATEGORIA_MAP.get(upper, upper)


def _parse_cargo_item(item: dict, ano: int) -> CargoItem | None:
    """Converte um item do JSON da API para CargoItem.

    Args:
        item: Dict do JSON da API.
        ano: Ano de referência.

    Returns:
        CargoItem ou None se inválido.
    """
    cargo = item.get("cargo") or item.get("Cargo") or ""
    if not cargo:
        return None

    categoria_raw = item.get("categoria") or item.get("Categoria") or ""
    categoria = _normalize_categoria(categoria_raw)
    if not categoria:
        categoria = "EFETIVO"

    carga_horaria = str(item.get("carga_horaria") or item.get("Carga Horária") or "")
    vagas_totais = _parse_int(item, "vagas_totais", "Vagas Totais", default=0)
    vagas_ocupadas = _parse_int(item, "vagas_ocupadas", "Vagas Ocupadas", default=0)
    salario_base = _parse_float(item, "salario_base", "Salário Base", default=0.0)
    efetivo = _parse_int(item, "efetivo", "Efetivo", default=0)
    comissionado = _parse_int(item, "comissionado", "Comissionado", default=0)
    contratado = _parse_int(item, "contratado", "Contratado", default=0)
    eletivo = _parse_int(item, "eletivo", "Eletivo", default=0)

    return CargoItem(
        cargo=str(cargo).strip(),
        carga_horaria=carga_horaria.strip(),
        vagas_totais=vagas_totais,
        vagas_ocupadas=vagas_ocupadas,
        salario_base=salario_base,
        efetivo=efetivo,
        comissionado=comissionado,
        contratado=contratado,
        eletivo=eletivo,
        categoria=categoria,
        ano=ano,
    )


def _parse_int(item: dict, *keys: str, default: int = 0) -> int:
    """Tenta extrair valor inteiro do item por múltiplas chaves.

    Args:
        item: Dict com dados.
        keys: Chaves a tentar em ordem.
        default: Valor padrão se nenhuma chave for encontrada.

    Returns:
        Valor inteiro.
    """
    for key in keys:
        raw = item.get(key)
        if raw is not None:
            try:
                return int(raw)
            except (ValueError, TypeError):
                continue
    return default


def _parse_float(item: dict, *keys: str, default: float = 0.0) -> float:
    """Tenta extrair valor float do item por múltiplas chaves.

    Args:
        item: Dict com dados.
        keys: Chaves a tentar em ordem.
        default: Valor padrão se nenhuma chave for encontrada.

    Returns:
        Valor float.
    """
    for key in keys:
        raw = item.get(key)
        if raw is not None:
            try:
                return float(raw)
            except (ValueError, TypeError):
                continue
    return default
