from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.features.management_actions.management_actions_data import (
    action_to_dict,
    list_actions,
)
from backend.features.management_actions.management_actions_types import (
    ActionListResponse,
    ActionRecord,
)
from backend.shared.database.connection import get_db

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
