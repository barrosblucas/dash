"""
Adaptador para API externa de Controle Patrimonial (Quality).

Encapsula chamadas HTTP para o portal de levantamento patrimonial Quality.
Não contém lógica de negócio — apenas busca e mapeamento de dados.
"""

from __future__ import annotations

import logging

import httpx

from backend.features.patrimonio.patrimonio_types import PatrimonioItem

logger = logging.getLogger(__name__)

_BASE_URL = (
    "https://web.qualitysistemas.com.br"
    "/levantamento_patrimonial/prefeitura_municipal_de_bandeirantes"
)
_ORGAOS_ENDPOINT = "orgaos-unidades"
_PATRIMONIOS_ENDPOINT = "patrimonios"
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

# Map user-facing tipo_bem to API codes
_TIPO_BEM_MAP: dict[str, str] = {
    "Móvel": "M",
    "Imóvel": "I",
    "Veículo": "V",
}


class PatrimonioAPIError(Exception):
    """Erro ao comunicar com API externa de patrimônio."""

    def __init__(self, message: str, status_code: int | None = None):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def fetch_patrimonio(
    ano: int,
    tipo_bem: str | None = None,
) -> list[PatrimonioItem]:
    """Busca dados patrimoniais do portal Quality para um ano.

    Strategy:
    1. Fetch orgaos-unidades to get org/unit pairs.
    2. For each unique pair, fetch patrimonios.
    3. Deduplicate by id, apply tipo_bem filter, parse into PatrimonioItem.

    Args:
        ano: Ano de referência (used for year inference from acquisition dates).
        tipo_bem: Filtrar por tipo ("Móvel", "Imóvel", "Veículo") ou None para todos.

    Returns:
        Lista de PatrimonioItem.
    """
    tipo_code = _TIPO_BEM_MAP.get(tipo_bem, "") if tipo_bem else ""

    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            # Step 1: Get org/unit pairs
            orgaos_url = f"{_BASE_URL}/{_ORGAOS_ENDPOINT}"
            response = await client.get(orgaos_url, headers=_HEADERS)

            if response.status_code >= 500:
                logger.warning(
                    "API externa indisponível (HTTP %d) ao buscar patrimônio (ano=%s) — retornando vazio",
                    response.status_code,
                    ano,
                )
                return []

            if response.status_code == 404:
                logger.info(
                    "Nenhum dado encontrado (HTTP 404) ao buscar patrimônio (ano=%s)",
                    ano,
                )
                return []

            response.raise_for_status()
            orgaos_data = response.json()

            if not isinstance(orgaos_data, list):
                logger.warning(
                    "Resposta inesperada da API externa (orgaos-unidades): %s",
                    type(orgaos_data),
                )
                return []

            # Build unique (organ, unit) pairs
            seen_pairs: set[tuple[int, int]] = set()
            pairs: list[tuple[int, int]] = []
            for entry in orgaos_data:
                if not isinstance(entry, dict):
                    continue
                organ_id = entry.get("organId")
                unit_id = entry.get("idUnit")
                if organ_id is None or unit_id is None:
                    continue
                pair = (int(organ_id), int(unit_id))
                if pair not in seen_pairs:
                    seen_pairs.add(pair)
                    pairs.append(pair)

            # Step 2: Fetch patrimonios for each pair
            dedup: dict[int | str, PatrimonioItem] = {}
            _fallback_counter = 0
            patrimonios_url = f"{_BASE_URL}/{_PATRIMONIOS_ENDPOINT}"

            for organ_id, unit_id in pairs:
                params: dict[str, str] = {
                    "unit": str(unit_id),
                    "organ": str(organ_id),
                    "tipoDeBem": tipo_code,
                }

                try:
                    resp = await client.get(
                        patrimonios_url, params=params, headers=_HEADERS
                    )
                except httpx.ConnectError:
                    logger.warning(
                        "Falha de conexão ao buscar patrimônio (organ=%d unit=%d) — pulando",
                        organ_id,
                        unit_id,
                    )
                    continue

                if resp.status_code >= 500:
                    logger.warning(
                        "API externa indisponível (HTTP %d) ao buscar patrimônio (organ=%d unit=%d) — retornando vazio",
                        resp.status_code,
                        organ_id,
                        unit_id,
                    )
                    return []

                if resp.status_code == 404:
                    continue

                try:
                    resp.raise_for_status()
                    data = resp.json()
                except Exception as exc:
                    logger.warning(
                        "Erro ao processar resposta patrimônio (organ=%d unit=%d): %s — pulando",
                        organ_id,
                        unit_id,
                        exc,
                    )
                    continue

                if not isinstance(data, list):
                    continue

                for item in data:
                    if not isinstance(item, dict):
                        continue

                    try:
                        patrimonio_item = _parse_patrimonio_item(item)
                        if patrimonio_item is not None:
                            dedup_key: int | str = (
                                patrimonio_item.id
                                if patrimonio_item.id is not None
                                else f"_fallback_{_fallback_counter}"
                            )
                            _fallback_counter += 1
                            dedup[dedup_key] = patrimonio_item
                    except Exception as exc:
                        logger.warning(
                            "Falha ao converter item de patrimônio: %s — item=%s",
                            exc,
                            item.get("descriptionPatrimony", "?"),
                        )

            # Step 3: Apply tipo_bem filter on parsed items
            items = list(dedup.values())
            if tipo_bem:
                items = [i for i in items if i.tipo_bem == tipo_bem]

            return items

    except httpx.ConnectError:
        logger.warning(
            "API externa indisponível ao buscar patrimônio (ano=%s tipo_bem=%s) — retornando vazio",
            ano,
            tipo_bem,
        )
        return []
    except Exception as exc:
        logger.warning(
            "Erro inesperado ao buscar patrimônio (ano=%s tipo_bem=%s): %s — retornando vazio",
            ano,
            tipo_bem,
            exc,
        )
        return []


def _parse_money(value: object) -> float:
    """Parse Brazilian number format to float.

    Handles "1.234,56" → 1234.56, "1234,56" → 1234.56, plain numbers.
    """
    raw = str(value or "").strip()
    if raw in ("", "-"):
        return 0.0
    return float(raw.replace(".", "").replace(",", "."))


def _infer_ano_from_acquisition(acquisition: str) -> int:
    """Extract year from acquisition date string (dd/mm/yyyy format)."""
    if not acquisition or not isinstance(acquisition, str):
        return 0
    parts = acquisition.strip().split("/")
    if len(parts) >= 3:
        try:
            return int(parts[2])
        except (ValueError, IndexError):
            pass
    return 0


def _map_tipo_bem(tipo_bem_code: str, tipo_veiculo: object) -> str:
    """Map API tipoBem code + tipoVeiculo to user-facing tipo_bem string."""
    code = str(tipo_bem_code).strip().upper()
    if code == "M":
        # Check if it's a vehicle
        tv = tipo_veiculo
        if tv is not None and str(tv).strip() == "1":
            return "Veículo"
        return "Móvel"
    if code == "I":
        return "Imóvel"
    # Fallback: return the code itself
    return code


def _parse_patrimonio_item(item: dict) -> PatrimonioItem | None:
    """Converte um item do JSON da API para PatrimonioItem.

    Args:
        item: Dict do JSON da API.

    Returns:
        PatrimonioItem ou None se inválido.
    """
    item_id = item.get("id")
    if item_id is None:
        return None

    descricao = item.get("descriptionPatrimony") or ""
    if not descricao:
        return None

    tipo_bem_code = item.get("tipoBem", "")
    tipo_veiculo = item.get("tipoVeiculo")
    tipo_bem = _map_tipo_bem(tipo_bem_code, tipo_veiculo)

    acquisition = item.get("acquisition", "")
    ano = _infer_ano_from_acquisition(acquisition)

    valor_atual = _parse_money(item.get("actualValueNoformated", 0))
    valor_adquiridos = _parse_money(item.get("actualValueNoformated", 0))

    return PatrimonioItem(
        id=int(item_id),
        tipo_bem=tipo_bem,
        descricao=str(descricao).strip(),
        quantidade_anterior=0,
        valor_anterior=0.0,
        quantidade_adquiridos=1,
        valor_adquiridos=valor_adquiridos,
        quantidade_baixados=0,
        valor_baixados=0.0,
        quantidade_atual=1,
        valor_atual=valor_atual,
        ano=ano,
    )
