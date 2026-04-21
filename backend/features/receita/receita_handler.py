"""
Rotas da API para receitas.

Endpoints para consulta de receitas municipais.
Apenas orquestração HTTP — delega para data layer.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.features.receita.receita_data import SQLReceitaRepository
from backend.features.receita.receita_types import (
    ReceitaDetalhamentoListResponse,
    ReceitaDetalhamentoResponse,
    ReceitaListResponse,
    ReceitaResponse,
    TipoReceita,
)
from backend.shared.database.connection import get_db

router = APIRouter(prefix="/receitas", tags=["receitas"])


def _parse_tipo_receita(tipo: str | None) -> TipoReceita | None:
    """Converte string de tipo para enum, ou levanta erro."""
    if tipo is None:
        return None
    try:
        return TipoReceita[tipo.upper()]
    except KeyError as err:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo inválido: {tipo}. Use CORRENTE ou CAPITAL.",
        ) from err


def _receita_to_response(r) -> ReceitaResponse:
    """Converte entidade Receita para schema de resposta."""
    return ReceitaResponse(
        id=r.id,
        ano=r.ano,
        mes=r.mes,
        categoria=r.categoria,
        subcategoria=r.subcategoria,
        tipo=r.tipo.name,
        valor_previsto=r.valor_previsto,
        valor_arrecadado=r.valor_arrecadado,
        valor_anulado=r.valor_anulado,
        fonte=r.fonte,
    )


@router.get("", response_model=ReceitaListResponse, summary="Lista receitas")
async def listar_receitas(
    ano: int | None = Query(None, ge=2013, le=2030, description="Filtrar por ano"),
    mes: int | None = Query(None, ge=1, le=12, description="Filtrar por mês"),
    categoria: str | None = Query(None, description="Filtrar por categoria"),
    tipo: str | None = Query(
        None, description="Filtrar por tipo (CORRENTE ou CAPITAL)"
    ),
    ano_inicio: int | None = Query(None, ge=2013, le=2030, description="Ano inicial"),
    ano_fim: int | None = Query(None, ge=2013, le=2030, description="Ano final"),
    limit: int | None = Query(100, ge=1, le=1000, description="Limite de resultados"),
    offset: int | None = Query(0, ge=0, description="Offset para paginação"),
    db: Session = Depends(get_db),
):
    """
    Lista receitas com filtros opcionais.

    Permite filtrar por ano, mês, categoria, tipo, e intervalo de anos.
    Suporta paginação com limit e offset.

    Example:
        GET /api/v1/receitas?ano=2023&tipo=CORRENTE&limit=50
    """
    tipo_enum = _parse_tipo_receita(tipo)

    repo = SQLReceitaRepository(db)
    receitas = repo.list_all(
        ano=ano,
        mes=mes,
        categoria=categoria,
        tipo=tipo_enum,
        ano_inicio=ano_inicio,
        ano_fim=ano_fim,
        limit=limit,
        offset=offset,
    )

    total = repo.count(
        ano=ano,
        mes=mes,
        categoria=categoria,
        tipo=tipo_enum,
    )

    receitas_response = [_receita_to_response(r) for r in receitas]

    page = (offset // limit) + 1 if limit else 1
    has_next = (offset + limit) < total if limit else False

    return ReceitaListResponse(
        receitas=receitas_response,
        total=total,
        page=page,
        page_size=limit or len(receitas),
        has_next=has_next,
    )


@router.get(
    "/detalhamento/{ano}",
    response_model=ReceitaDetalhamentoListResponse,
    summary="Detalhamento hierárquico de receitas por ano",
)
async def detalhamento_receitas(
    ano: int,
    db: Session = Depends(get_db),
):
    """
    Retorna o detalhamento hierárquico completo das receitas para um ano.

    Os itens possuem campo 'nivel' indicando a profundidade na hierarquia
    e 'ordem' indicando a posição original no PDF.

    Example:
        GET /api/v1/receitas/detalhamento/2023
    """
    if ano < 2013 or ano > 2030:
        raise HTTPException(status_code=400, detail="Ano deve estar entre 2013 e 2030")

    repo = SQLReceitaRepository(db)
    itens_raw = repo.list_detalhamento_by_ano(ano)

    itens = [
        ReceitaDetalhamentoResponse(
            id=item["id"],
            ano=item["ano"],
            detalhamento=item["detalhamento"],
            nivel=item["nivel"],
            ordem=item["ordem"],
            tipo=item["tipo"],
            valor_previsto=item["valor_previsto"],
            valor_arrecadado=item["valor_arrecadado"],
            valor_anulado=item["valor_anulado"],
            fonte=item["fonte"],
        )
        for item in itens_raw
    ]

    return ReceitaDetalhamentoListResponse(
        ano=ano,
        itens=itens,
        total_itens=len(itens),
    )


@router.get(
    "/{receita_id}", response_model=ReceitaResponse, summary="Busca receita por ID"
)
async def buscar_receita(
    receita_id: int,
    db: Session = Depends(get_db),
):
    """
    Busca uma receita pelo seu ID.

    Example:
        GET /api/v1/receitas/123
    """
    repo = SQLReceitaRepository(db)
    receita = repo.get_by_id(receita_id)

    if receita is None:
        raise HTTPException(
            status_code=404, detail=f"Receita não encontrada: {receita_id}"
        )

    return _receita_to_response(receita)


@router.get(
    "/categorias", response_model=list[str], summary="Lista categorias de receitas"
)
async def listar_categorias(db: Session = Depends(get_db)):
    """
    Retorna todas as categorias de receita cadastradas.

    Example:
        GET /api/v1/receitas/categorias/
    """
    repo = SQLReceitaRepository(db)
    return repo.get_categorias()


@router.get(
    "/total/ano/{ano}", response_model=dict, summary="Total de receitas por ano"
)
async def total_receitas_ano(
    ano: int,
    tipo: str | None = Query(None, description="Tipo: CORRENTE ou CAPITAL"),
    db: Session = Depends(get_db),
):
    """
    Calcula o total de receitas arrecadadas em um ano.

    Example:
        GET /api/v1/receitas/total/ano/2023
        GET /api/v1/receitas/total/ano/2023?tipo=CORRENTE
    """
    if ano < 2013 or ano > 2030:
        raise HTTPException(status_code=400, detail="Ano deve estar entre 2013 e 2030")

    tipo_enum = _parse_tipo_receita(tipo)

    repo = SQLReceitaRepository(db)
    total = repo.get_total_by_ano(ano=ano, tipo=tipo_enum)

    return {
        "ano": ano,
        "tipo": tipo_enum.name if tipo_enum else None,
        "total_arrecadado": float(total),
    }


@router.get(
    "/total/mes/{ano}/{mes}", response_model=dict, summary="Total de receitas por mês"
)
async def total_receitas_mes(
    ano: int,
    mes: int,
    tipo: str | None = Query(None, description="Tipo: CORRENTE ou CAPITAL"),
    db: Session = Depends(get_db),
):
    """
    Calcula o total de receitas arrecadadas em um mês específico.

    Example:
        GET /api/v1/receitas/total/mes/2023/6
    """
    if ano < 2013 or ano > 2030:
        raise HTTPException(status_code=400, detail="Ano deve estar entre 2013 e 2030")

    if mes < 1 or mes > 12:
        raise HTTPException(status_code=400, detail="Mês deve estar entre 1 e 12")

    tipo_enum = _parse_tipo_receita(tipo)

    repo = SQLReceitaRepository(db)
    total = repo.get_total_by_mes(ano=ano, mes=mes, tipo=tipo_enum)

    return {
        "ano": ano,
        "mes": mes,
        "tipo": tipo_enum.name if tipo_enum else None,
        "total_arrecadado": float(total),
    }
