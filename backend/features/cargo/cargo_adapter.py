"""
Adaptador para API externa de Cargos e Salários (Quality).

Encapsula chamadas HTTP para o portal de cargos do Quality.
Não contém lógica de negócio — apenas busca e mapeamento de dados.
"""

from __future__ import annotations

import logging
from collections import defaultdict

import httpx

from backend.features.cargo.cargo_types import CargoItem

logger = logging.getLogger(__name__)

_BASE_URL = "https://web.qualitysistemas.com.br/cargos_e_salarios/"
_ENTITY = "prefeitura_municipal_de_bandeirantes"
_ENDPOINT_SECRETARIATS = "ContractsList"
_ENDPOINT_FILTER = "FilterContractsList"
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

# Mapeamento de PAT_DESCRICAO para categoria padronizada
_PAT_CATEGORIA_MAP: dict[str, str] = {
    "CARGO EFETIVO": "EFETIVO",
    "EFETIVO": "EFETIVO",
    "CARGO COMISSIONADO": "COMISSIONADO",
    "COMISSIONADO": "COMISSIONADO",
    "CONTRATADO": "CONTRATADOS",
    "CONTRATADOS": "CONTRATADOS",
    "ELETIVO": "ELETIVO",
    "CONVOCADO": "CONVOCADOS",
    "CONVOCADOS": "CONVOCADOS",
}


class CargoAPIError(Exception):
    """Erro ao comunicar com API externa de cargos."""

    def __init__(self, message: str, status_code: int | None = None):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def fetch_cargos(ano: int, categoria: str | None = None) -> list[CargoItem]:
    """Busca cargos do portal Quality para um ano.

    Usa a API FilterContractsList do Quality:
    1. Carrega secretarias via ContractsList?action=loadSecretariats
    2. Para cada secretaria, busca registros de funcionários via FilterContractsList
    3. Agrega os registros individuais em CargoItem por cargo/categoria

    Args:
        ano: Ano de referência.
        categoria: Filtrar por categoria (ex: "EFETIVO", None para todos).

    Returns:
        Lista de CargoItem.

    Raises:
        CargoAPIError: Em caso de falha na comunicação.
    """
    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            # Step 1: Load secretariats
            secretariat_ids = await _load_secretariat_ids(client, ano)
            if not secretariat_ids:
                logger.info(
                    "Nenhuma secretaria encontrada ao buscar cargos (ano=%s)", ano
                )
                return []

            # Step 2: Fetch employee records for each secretariat
            all_agents: list[dict] = []
            for sec_id in secretariat_ids:
                agents = await _fetch_secretariat_agents(client, ano, sec_id)
                all_agents.extend(agents)

            if not all_agents:
                logger.info(
                    "Nenhum registro de funcionário encontrado (ano=%s)", ano
                )
                return []

            # Step 3: Deduplicate by (FUN_NOME, CAR_DESCRICAO, ANO)
            deduped = _deduplicate_agents(all_agents, ano)

            # Step 4: Aggregate to CargoItem
            items = _aggregate_to_cargo_items(deduped, ano)

    except httpx.ConnectError:
        logger.warning(
            "API externa indisponível ao buscar cargos (ano=%s categoria=%s) — retornando vazio",
            ano,
            categoria,
        )
        return []
    except Exception as exc:
        logger.warning(
            "Erro inesperado ao buscar cargos (ano=%s categoria=%s): %s — retornando vazio",
            ano,
            categoria,
            exc,
        )
        return []

    # Apply categoria filter if provided
    if categoria is not None:
        items = [item for item in items if item.categoria == categoria]

    return items


async def _load_secretariat_ids(client: httpx.AsyncClient, ano: int) -> list[str]:
    """Carrega IDs de secretarias via ContractsList?action=loadSecretariats."""
    url = f"{_BASE_URL}{_ENDPOINT_SECRETARIATS}"
    params = {"action": "loadSecretariats", "entity": _ENTITY}

    response = await client.get(url, params=params, headers=_HEADERS)

    if response.status_code >= 400:
        logger.warning(
            "HTTP %d ao carregar secretarias (ano=%s)", response.status_code, ano
        )
        return []

    data = response.json()
    if not isinstance(data, list) or not data:
        return []

    # Response format: [[{SEC_COD_SEC, SEC_DESCRICAO}, ...]]
    secretariats = data[0] if isinstance(data[0], list) else data
    ids: list[str] = []
    for sec in secretariats:
        if isinstance(sec, dict):
            sec_id = sec.get("SEC_COD_SEC", "")
            if sec_id:
                ids.append(str(sec_id))
    return ids


async def _fetch_secretariat_agents(
    client: httpx.AsyncClient, ano: int, secretariat_id: str
) -> list[dict]:
    """Busca registros de funcionários para uma secretaria."""
    url = f"{_BASE_URL}{_ENDPOINT_FILTER}"
    params = {
        "entity": _ENTITY,
        "type": "",
        "secretariats": secretariat_id,
        "year": str(ano),
        "month": "",
        "semester": "",
        "cargo": "",
        "tipoCargo": "",
    }

    response = await client.get(url, params=params, headers=_HEADERS)

    if response.status_code >= 400:
        logger.warning(
            "HTTP %d ao buscar agentes (sec=%s ano=%s)",
            response.status_code,
            secretariat_id,
            ano,
        )
        return []

    data = response.json()
    if not isinstance(data, list) or not data:
        return []

    # Response format: [[{SEC_COD_SEC, SEC_DESCRICAO, DEP_DESCRICAO, FUN_NOME,
    #   CAR_DESCRICAO, CLNI_CLASSE, CLNI_NIVEL, CONT_DT_ADMISSAO,
    #   DATA_ENCERRAMENTO, SITUACAO, PAT_DESCRICAO, MES, ANO}, ...]]
    agents = data[0] if isinstance(data[0], list) else data
    return [a for a in agents if isinstance(a, dict)]


def _deduplicate_agents(agents: list[dict], ano: int) -> list[dict]:
    """Deduplica agentes por (FUN_NOME, CAR_DESCRICAO, ANO)."""
    seen: set[tuple[str, str, int]] = set()
    deduped: list[dict] = []
    for agent in agents:
        fun_nome = agent.get("FUN_NOME", "")
        car_descricao = agent.get("CAR_DESCRICAO", "")
        key = (fun_nome, car_descricao, ano)
        if key not in seen:
            seen.add(key)
            deduped.append(agent)
    return deduped


def _aggregate_to_cargo_items(agents: list[dict], ano: int) -> list[CargoItem]:
    """Agrega registros individuais de funcionários em CargoItem.

    Agrupa por (CAR_DESCRICAO, PAT_DESCRICAO normalizado) e conta
    efetivo, comissionado, contratado, eletivo, convocados por cargo.
    """
    # Group by (cargo, categoria)
    groups: dict[tuple[str, str], list[dict]] = defaultdict(list)

    for agent in agents:
        car_descricao = agent.get("CAR_DESCRICAO", "")
        if not car_descricao:
            continue

        pat_descricao = agent.get("PAT_DESCRICAO", "")
        categoria = _normalize_categoria(pat_descricao)

        key = (car_descricao.strip(), categoria)
        groups[key].append(agent)

    items: list[CargoItem] = []
    for (cargo, categoria), records in groups.items():
        efetivo = 0
        comissionado = 0
        contratado = 0
        eletivo = 0
        convocados = 0

        for rec in records:
            pat = rec.get("PAT_DESCRICAO", "").strip().upper()
            cat = _normalize_categoria(pat)
            if cat == "EFETIVO":
                efetivo += 1
            elif cat == "COMISSIONADO":
                comissionado += 1
            elif cat == "CONTRATADOS":
                contratado += 1
            elif cat == "ELETIVO":
                eletivo += 1
            elif cat == "CONVOCADOS":
                convocados += 1

        total = efetivo + comissionado + contratado + eletivo + convocados
        vagas_ocupadas = sum(
            1 for rec in records if rec.get("SITUACAO", "").strip() != ""
        )

        items.append(
            CargoItem(
                cargo=cargo,
                carga_horaria="",
                vagas_totais=total,
                vagas_ocupadas=vagas_ocupadas,
                salario_base=0.0,
                efetivo=efetivo,
                comissionado=comissionado,
                contratado=contratado,
                eletivo=eletivo,
                convocados=convocados,
                categoria=categoria,
                ano=ano,
            )
        )

    return items


def _normalize_categoria(raw: str) -> str:
    """Normaliza o nome da categoria para valor padronizado.

    Args:
        raw: Nome bruto vindo da API (PAT_DESCRICAO).

    Returns:
        Nome padronizado da categoria.
    """
    upper = raw.strip().upper()
    return _PAT_CATEGORIA_MAP.get(upper, upper)
