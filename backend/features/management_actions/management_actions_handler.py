from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.features.management_actions.management_actions_data import (
    action_to_dict,
    create_action,
    delete_action,
    get_action_by_id,
    list_actions,
    update_action,
)
from backend.features.management_actions.management_actions_types import (
    ActionCreateRequest,
    ActionListResponse,
    ActionRecord,
    ActionUpdateRequest,
)
from backend.shared.database.connection import get_db
from backend.shared.security import require_admin_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/management-actions", tags=["management-actions"])


@router.get("", response_model=ActionListResponse, summary="Lista ações da gestão municipal")
async def get_actions(
    category: str | None = Query(default=None, description="Filtrar por categoria"),
    db: Session = Depends(get_db),
) -> ActionListResponse:
    items, total = list_actions(db, category=category)
    return ActionListResponse(
        items=[ActionRecord(**action_to_dict(m)) for m in items],
        total=total,
    )


@router.post("", response_model=ActionRecord, status_code=status.HTTP_201_CREATED, summary="Cria ação (admin)")
async def admin_create(
    payload: ActionCreateRequest,
    _: Any = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> ActionRecord:
    action = create_action(db, payload)
    return ActionRecord(**action_to_dict(action))


@router.put("/{action_id}", response_model=ActionRecord, summary="Atualiza ação (admin)")
async def admin_update(
    action_id: int,
    payload: ActionUpdateRequest,
    _: Any = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> ActionRecord:
    action = get_action_by_id(db, action_id)
    if action is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ação não encontrada")
    updated = update_action(db, action, payload)
    return ActionRecord(**action_to_dict(updated))


@router.delete("/{action_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None, summary="Exclui ação (admin)")
async def admin_delete(
    action_id: int,
    _: Any = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> None:
    action = get_action_by_id(db, action_id)
    if action is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ação não encontrada")
    delete_action(db, action)
