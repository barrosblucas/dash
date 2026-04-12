"""
Rotas da APIpara receitas.

Endpoints para consulta de receitas municipais.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.api.schemas import (
    ReceitaDetalhamentoListResponse,
    ReceitaDetalhamentoResponse,
    ReceitaListResponse,
    ReceitaResponse,
)
from backend.domain.entities.receita import TipoReceita
from backend.infrastructure.database.connection import get_db
from backend.infrastructure.repositories.sql_receita_repository import (
    SQLReceitaRepository,
)

router = APIRouter(prefix="/receitas", tags=["receitas"])


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

    Args:
        ano: Filtra por ano específico.
        mes: Filtra por mês específico.
        categoria: Filtra por categoria (busca parcial case-insensitive).
        tipo: Filtra por tipo de receita (CORRENTE ou CAPITAL).
        ano_inicio: Ano inicial para range de anos.
        ano_fim: Ano final para range de anos.
        limit: Limite de resultados (padrão: 100).
        offset: Offset para paginação (padrão: 0).
        db: Sessão do banco de dados injetada.

    Returns:
        Lista de receitas com metadados de paginação.

    Example:
        GET /api/v1/receitas?ano=2023&tipo=CORRENTE&limit=50
    """
    repo = SQLReceitaRepository(db)

    # Converte tipo string para enum
    tipo_enum = None
    if tipo:
        try:
            tipo_enum = TipoReceita[tipo.upper()]
        except KeyError:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo inválido: {tipo}. Use CORRENTE ou CAPITAL.",
            )

    # Busca receitas
    receitas = repo.list(
        ano=ano,
        mes=mes,
        categoria=categoria,
        tipo=tipo_enum,
        ano_inicio=ano_inicio,
        ano_fim=ano_fim,
        limit=limit,
        offset=offset,
    )

    # Conta total para paginação
    total = repo.count(
        ano=ano,
        mes=mes,
        categoria=categoria,
        tipo=tipo_enum,
    )

    # Converte para schema de resposta
    receitas_response = [
        ReceitaResponse(
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
        for r in receitas
    ]

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

    Args:
        ano: Ano de referência (2013-2030).
        db: Sessão do banco de dados injetada.

    Returns:
        Lista hierárquica de itens de receita com valores anuais.

    Example:
        GET /api/v1/receitas/detalhamento/2023
    """
    if ano < 2013 or ano > 2030:
        raise HTTPException(status_code=400, detail="Ano deve estar entre 2013 e 2030")

    from backend.infrastructure.database.models import ReceitaDetalhamentoModel

    modelos = (
        db.query(ReceitaDetalhamentoModel)
        .filter(ReceitaDetalhamentoModel.ano == ano)
        .order_by(ReceitaDetalhamentoModel.ordem)
        .all()
    )

    itens = [
        ReceitaDetalhamentoResponse(
            id=m.id,
            ano=m.ano,
            detalhamento=m.detalhamento,
            nivel=m.nivel,
            ordem=m.ordem,
            tipo=m.tipo,
            valor_previsto=m.valor_previsto,
            valor_arrecadado=m.valor_arrecadado,
            valor_anulado=m.valor_anulado,
            fonte=m.fonte,
        )
        for m in modelos
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

    Args:
        receita_id: ID da receita.
        db: Sessão do banco de dados injetada.

    Returns:
        Receita encontrada.

    Raises:
        HTTPException: 404 se a receita não for encontrada.

    Example:
        GET /api/v1/receitas/123
    """
    repo = SQLReceitaRepository(db)
    receita = repo.get_by_id(receita_id)

    if receita is None:
        raise HTTPException(
            status_code=404, detail=f"Receita não encontrada: {receita_id}"
        )

    return ReceitaResponse(
        id=receita.id,
        ano=receita.ano,
        mes=receita.mes,
        categoria=receita.categoria,
        subcategoria=receita.subcategoria,
        tipo=receita.tipo.name,
        valor_previsto=receita.valor_previsto,
        valor_arrecadado=receita.valor_arrecadado,
        valor_anulado=receita.valor_anulado,
        fonte=receita.fonte,
    )


@router.get(
    "/categorias", response_model=list[str], summary="Lista categorias de receitas"
)
async def listar_categorias(db: Session = Depends(get_db)):
    """
    Retorna todas as categorias de receita cadastradas.

    Args:
        db: Sessão do banco de dados injetada.

    Returns:
        Lista de categorias únicas de receita.

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

    Args:
        ano: Ano para cálculo.
        tipo: Filtra por tipo de receita (opcional).
        db: Sessão do banco de dados injetada.

    Returns:
        Dicionário com ano e total arrecadado.

    Example:
        GET /api/v1/receitas/total/ano/2023
        GET /api/v1/receitas/total/ano/2023?tipo=CORRENTE
    """
    if ano < 2013 or ano > 2030:
        raise HTTPException(status_code=400, detail="Ano deve estar entre 2013 e 2030")

    repo = SQLReceitaRepository(db)

    # Converte tipo string para enum
    tipo_enum = None
    if tipo:
        try:
            tipo_enum = TipoReceita[tipo.upper()]
        except KeyError:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo inválido: {tipo}. Use CORRENTE ou CAPITAL.",
            )

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

    Args:
        ano: Ano para cálculo.
        mes: Mês para cálculo (1-12).
        tipo: Filtra por tipo de receita (opcional).
        db: Sessão do banco de dados injetada.

    Returns:
        Dicionário com período e total arrecadado.

    Raises:
        HTTPException: 400 se mês ou ano estiverem fora do range.

    Example:
        GET /api/v1/receitas/total/mes/2023/6
    """
    if ano < 2013 or ano > 2030:
        raise HTTPException(status_code=400, detail="Ano deve estar entre 2013 e 2030")

    if mes < 1 or mes > 12:
        raise HTTPException(status_code=400, detail="Mês deve estar entre 1 e 12")

    repo = SQLReceitaRepository(db)

    # Converte tipo string para enum
    tipo_enum = None
    if tipo:
        try:
            tipo_enum = TipoReceita[tipo.upper()]
        except KeyError:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo inválido: {tipo}. Use CORRENTE ou CAPITAL.",
            )

    total = repo.get_total_by_mes(ano=ano, mes=mes, tipo=tipo_enum)

    return {
        "ano": ano,
        "mes": mes,
        "tipo": tipo_enum.name if tipo_enum else None,
        "total_arrecadado": float(total),
    }
