"""
Rotas da API para despesas.

Endpoints para consulta de despesas municipais.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional, List

from backend.api.schemas_despesa import (
    DespesaResponse,
    DespesaListResponse,
    DespesaFilterParams,
)
from backend.infrastructure.database.connection import get_db
from backend.infrastructure.database.models import DespesaModel
from backend.domain.entities.despesa import TipoDespesa

router = APIRouter(prefix="/despesas", tags=["despesas"])


@router.get("", response_model=DespesaListResponse, summary="Lista despesas")
async def listar_despesas(
    ano: Optional[int] = Query(None, ge=2013, le=2030, description="Filtrar por ano"),
    mes: Optional[int] = Query(None, ge=1, le=12, description="Filtrar por mês"),
    categoria: Optional[str] = Query(None, description="Filtrar por categoria"),
    tipo: Optional[str] = Query(
        None, description="Filtrar por tipo (CORRENTE, CAPITAL ou CONTINGENCIA)"
    ),
    ano_inicio: Optional[int] = Query(
        None, ge=2013, le=2030, description="Ano inicial"
    ),
    ano_fim: Optional[int] = Query(None, ge=2013, le=2030, description="Ano final"),
    limit: Optional[int] = Query(
        100, ge=1, le=1000, description="Limite de resultados"
    ),
    offset: Optional[int] = Query(0, ge=0, description="Offset para paginação"),
    db: Session = Depends(get_db),
):
    """
    Lista despesas com filtros opcionais.

    Permite filtrar por ano, mês, categoria, tipo, e intervalo de anos.
    Suporta paginação com limit e offset.

    Args:
        ano: Filtra por ano específico.
        mes: Filtra por mês específico.
        categoria: Filtra por categoria (busca parcial case-insensitive).
        tipo: Filtra por tipo de despesa (CORRENTE, CAPITAL ou CONTINGENCIA).
        ano_inicio: Ano inicial para range de anos.
        ano_fim: Ano final para range de anos.
        limit: Limite de resultados (padrão: 100).
        offset: Offset para paginação (padrão: 0).
        db: Sessão do banco de dados injetada.

    Returns:
        Lista de despesas com metadados de paginação.

    Example:
        GET /api/v1/despesas?ano=2023&tipo=CORRENTE&limit=50
    """
    query = db.query(DespesaModel)

    # Aplica filtros
    if ano is not None:
        query = query.filter(DespesaModel.ano == ano)

    if mes is not None:
        query = query.filter(DespesaModel.mes == mes)

    if categoria is not None:
        query = query.filter(DespesaModel.categoria.ilike(f"%{categoria}%"))

    if tipo is not None:
        tipo_upper = tipo.upper()
        if tipo_upper not in ["CORRENTE", "CAPITAL", "CONTINGENCIA"]:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo inválido: {tipo}. Use CORRENTE, CAPITAL ou CONTINGENCIA.",
            )
        query = query.filter(DespesaModel.tipo == tipo_upper)

    if ano_inicio is not None:
        query = query.filter(DespesaModel.ano >= ano_inicio)

    if ano_fim is not None:
        query = query.filter(DespesaModel.ano <= ano_fim)

    # Contagem total antes da paginação
    total_query = db.query(func.count(DespesaModel.id))
    if ano is not None:
        total_query = total_query.filter(DespesaModel.ano == ano)
    if mes is not None:
        total_query = total_query.filter(DespesaModel.mes == mes)
    if categoria is not None:
        total_query = total_query.filter(DespesaModel.categoria.ilike(f"%{categoria}%"))
    if tipo is not None:
        total_query = total_query.filter(DespesaModel.tipo == tipo.upper())
    if ano_inicio is not None:
        total_query = total_query.filter(DespesaModel.ano >= ano_inicio)
    if ano_fim is not None:
        total_query = total_query.filter(DespesaModel.ano <= ano_fim)

    total = total_query.scalar() or 0

    # Ordenação
    query = query.order_by(DespesaModel.ano.desc(), DespesaModel.mes.desc())

    # Paginação
    if limit is not None:
        query = query.limit(limit)

    if offset is not None:
        query = query.offset(offset)

    despesas = query.all()

    # Converte para schema de resposta
    despesas_response = [
        DespesaResponse(
            id=d.id,
            ano=d.ano,
            mes=d.mes,
            categoria=d.categoria,
            subcategoria=d.subcategoria,
            tipo=d.tipo,
            valor_empenhado=d.valor_empenhado,
            valor_liquidado=d.valor_liquidado,
            valor_pago=d.valor_pago,
            fonte=d.fonte,
        )
        for d in despesas
    ]

    page = (offset // limit) + 1 if limit else 1
    has_next = (offset + limit) < total if limit else False

    return DespesaListResponse(
        despesas=despesas_response,
        total=total,
        page=page,
        page_size=limit or len(despesas),
        has_next=has_next,
    )


@router.get(
    "/{despesa_id}", response_model=DespesaResponse, summary="Busca despesa por ID"
)
async def buscar_despesa(
    despesa_id: int,
    db: Session = Depends(get_db),
):
    """
    Busca uma despesa pelo seu ID.

    Args:
        despesa_id: ID da despesa.
        db: Sessão do banco de dados injetada.

    Returns:
        Despesa encontrada.

    Raises:
        HTTPException: 404 se a despesa não for encontrada.

    Example:
        GET /api/v1/despesas/123
    """
    despesa = db.query(DespesaModel).filter(DespesaModel.id == despesa_id).first()

    if despesa is None:
        raise HTTPException(
            status_code=404, detail=f"Despesa não encontrada: {despesa_id}"
        )

    return DespesaResponse(
        id=despesa.id,
        ano=despesa.ano,
        mes=despesa.mes,
        categoria=despesa.categoria,
        subcategoria=despesa.subcategoria,
        tipo=despesa.tipo,
        valor_empenhado=despesa.valor_empenhado,
        valor_liquidado=despesa.valor_liquidado,
        valor_pago=despesa.valor_pago,
        fonte=despesa.fonte,
    )


@router.get(
    "/categorias/", response_model=List[str], summary="Lista categorias de despesas"
)
async def listar_categorias(db: Session = Depends(get_db)):
    """
    Retorna todas as categorias de despesa cadastradas.

    Args:
        db: Sessão do banco de dados injetada.

    Returns:
        Lista de categorias únicas de despesa.

    Example:
        GET /api/v1/despesas/categorias/
    """
    results = (
        db.query(DespesaModel.categoria)
        .distinct()
        .order_by(DespesaModel.categoria)
        .all()
    )
    return [r[0] for r in results if r[0]]


@router.get(
    "/total/ano/{ano}", response_model=dict, summary="Total de despesas por ano"
)
async def total_despesas_ano(
    ano: int,
    tipo: Optional[str] = Query(
        None, description="Tipo: CORRENTE, CAPITAL ou CONTINGENCIA"
    ),
    db: Session = Depends(get_db),
):
    """
    Calcula o total de despesas em um ano.

    Retorna totais de valor empenhado, liquidado e pago.

    Args:
        ano: Ano para cálculo.
        tipo: Filtra por tipo de despesa (opcional).
        db: Sessão do banco de dados injetada.

    Returns:
        Dicionário com ano e totais.

    Example:
        GET /api/v1/despesas/total/ano/2023
        GET /api/v1/despesas/total/ano/2023?tipo=CORRENTE
    """
    if ano < 2013 or ano > 2030:
        raise HTTPException(status_code=400, detail="Ano deve estar entre 2013 e 2030")

    query = db.query(
        func.sum(DespesaModel.valor_empenhado).label("total_empenhado"),
        func.sum(DespesaModel.valor_liquidado).label("total_liquidado"),
        func.sum(DespesaModel.valor_pago).label("total_pago"),
    ).filter(DespesaModel.ano == ano)

    if tipo:
        tipo_upper = tipo.upper()
        if tipo_upper not in ["CORRENTE", "CAPITAL", "CONTINGENCIA"]:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo inválido: {tipo}. Use CORRENTE, CAPITAL ou CONTINGENCIA.",
            )
        query = query.filter(DespesaModel.tipo == tipo_upper)

    resultado = query.first()

    return {
        "ano": ano,
        "tipo": tipo.upper() if tipo else None,
        "total_empenhado": float(resultado.total_empenhado or 0),
        "total_liquidado": float(resultado.total_liquidado or 0),
        "total_pago": float(resultado.total_pago or 0),
    }


@router.get(
    "/total/mes/{ano}/{mes}", response_model=dict, summary="Total de despesas por mês"
)
async def total_despesas_mes(
    ano: int,
    mes: int,
    tipo: Optional[str] = Query(
        None, description="Tipo: CORRENTE, CAPITAL ou CONTINGENCIA"
    ),
    db: Session = Depends(get_db),
):
    """
    Calcula o total de despesas em um mês específico.

    Retorna totais de valor empenhado, liquidado e pago.

    Args:
        ano: Ano para cálculo.
        mes: Mês para cálculo (1-12).
        tipo: Filtra por tipo de despesa (opcional).
        db: Sessão do banco de dados injetada.

    Returns:
        Dicionário com período e totais.

    Raises:
        HTTPException: 400 se mês ou ano estiverem fora do range.

    Example:
        GET /api/v1/despesas/total/mes/2023/6
    """
    if ano < 2013 or ano > 2030:
        raise HTTPException(status_code=400, detail="Ano deve estar entre 2013 e 2030")

    if mes < 1 or mes > 12:
        raise HTTPException(status_code=400, detail="Mês deve estar entre 1 e 12")

    query = db.query(
        func.sum(DespesaModel.valor_empenhado).label("total_empenhado"),
        func.sum(DespesaModel.valor_liquidado).label("total_liquidado"),
        func.sum(DespesaModel.valor_pago).label("total_pago"),
    ).filter(and_(DespesaModel.ano == ano, DespesaModel.mes == mes))

    if tipo:
        tipo_upper = tipo.upper()
        if tipo_upper not in ["CORRENTE", "CAPITAL", "CONTINGENCIA"]:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo inválido: {tipo}. Use CORRENTE, CAPITAL ou CONTINGENCIA.",
            )
        query = query.filter(DespesaModel.tipo == tipo_upper)

    resultado = query.first()

    return {
        "ano": ano,
        "mes": mes,
        "tipo": tipo.upper() if tipo else None,
        "total_empenhado": float(resultado.total_empenhado or 0),
        "total_liquidado": float(resultado.total_liquidado or 0),
        "total_pago": float(resultado.total_pago or 0),
    }
