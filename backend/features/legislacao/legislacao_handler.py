"""Rotas HTTP do bounded context legislação."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.features.legislacao.legislacao_data import (
    SQLLegislacaoRepository,
    legislacao_to_detalhe_dict,
    legislacao_to_item_dict,
)
from backend.features.legislacao.legislacao_types import (
    LegislacaoCreateRequest,
    LegislacaoDetalhe,
    LegislacaoItem,
    LegislacaoListResponse,
    LegislacaoUpdateRequest,
    StatusLegislacao,
    TipoLegislacao,
)
from backend.shared.database.connection import get_db
from backend.shared.security import require_admin_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/legislacao", tags=["legislacao"])


def _require_legislacao(repo: SQLLegislacaoRepository, legislacao_id: int) -> Any:
    legislacao = repo.get_by_id(legislacao_id)
    if legislacao is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Legislação não encontrada",
        )
    return legislacao


@router.get(
    "",
    response_model=LegislacaoListResponse,
    summary="Lista paginada de legislações municipais",
)
async def get_legislacoes(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(12, ge=1, le=100, description="Itens por página"),
    tipo: TipoLegislacao | None = Query(None, description="Filtro por tipo"),
    ano: int | None = Query(None, description="Filtro por ano"),
    status_filter: StatusLegislacao | None = Query(
        None, alias="status", description="Filtro por status"
    ),
    busca: str | None = Query(None, description="Busca textual"),
    db: Session = Depends(get_db),
) -> LegislacaoListResponse:
    repo = SQLLegislacaoRepository(db)
    items, total = repo.list_legislacoes(
        page=page,
        size=size,
        tipo=tipo,
        ano=ano,
        status=status_filter,
        busca=busca,
    )
    return LegislacaoListResponse(
        items=[LegislacaoItem(**legislacao_to_item_dict(m)) for m in items],
        total=total,
        page=page,
        size=size,
    )


@router.get(
    "/{legislacao_id}",
    response_model=LegislacaoDetalhe,
    summary="Detalhe completo de uma legislação",
)
async def get_legislacao_detalhe(
    legislacao_id: int,
    db: Session = Depends(get_db),
) -> LegislacaoDetalhe:
    repo = SQLLegislacaoRepository(db)
    legislacao = _require_legislacao(repo, legislacao_id)
    return LegislacaoDetalhe(**legislacao_to_detalhe_dict(legislacao))


@router.post(
    "",
    response_model=LegislacaoDetalhe,
    status_code=status.HTTP_201_CREATED,
    summary="Cria nova legislação (admin)",
)
async def create_legislacao(
    payload: LegislacaoCreateRequest,
    _: Any = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> LegislacaoDetalhe:
    repo = SQLLegislacaoRepository(db)
    legislacao = repo.create(payload)
    return LegislacaoDetalhe(**legislacao_to_detalhe_dict(legislacao))


@router.put(
    "/{legislacao_id}",
    response_model=LegislacaoDetalhe,
    summary="Atualiza legislação existente (admin)",
)
async def update_legislacao(
    legislacao_id: int,
    payload: LegislacaoUpdateRequest,
    _: Any = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> LegislacaoDetalhe:
    repo = SQLLegislacaoRepository(db)
    legislacao = _require_legislacao(repo, legislacao_id)
    updated = repo.update(legislacao, payload)
    return LegislacaoDetalhe(**legislacao_to_detalhe_dict(updated))


@router.delete(
    "/{legislacao_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Remove legislação (admin)",
)
async def delete_legislacao(
    legislacao_id: int,
    _: Any = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> None:
    repo = SQLLegislacaoRepository(db)
    legislacao = _require_legislacao(repo, legislacao_id)
    repo.delete(legislacao)
