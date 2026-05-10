from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.orm import Session

from backend.features.management_actions.management_actions_types import (
    ActionCreateRequest,
    ActionStatus,
    ActionUpdateRequest,
)
from backend.shared.database.management_actions_models import ManagementActionModel

logger = logging.getLogger(__name__)


def list_actions(
    db: Session, category: str | None = None
) -> tuple[list[ManagementActionModel], int]:
    query = db.query(ManagementActionModel)
    if category:
        query = query.filter(ManagementActionModel.category == category)
    items = query.order_by(ManagementActionModel.id).all()
    return items, len(items)


def create_action(
    db: Session, payload: ActionCreateRequest
) -> ManagementActionModel:
    action = ManagementActionModel(**payload.model_dump())
    db.add(action)
    db.flush()
    db.refresh(action)
    return action


def get_action_by_id(db: Session, action_id: int) -> ManagementActionModel | None:
    return db.query(ManagementActionModel).filter(ManagementActionModel.id == action_id).first()


def update_action(
    db: Session, action: ManagementActionModel, payload: ActionUpdateRequest
) -> ManagementActionModel:
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(action, field, value)
    db.flush()
    db.refresh(action)
    return action


def delete_action(db: Session, action: ManagementActionModel) -> None:
    db.delete(action)
    db.flush()


def _format_investment(value: float) -> str:
    if value >= 1_000_000:
        formatted = f"R$ {value / 1_000_000:,.1f}M".replace(",", "X").replace(".", ",").replace("X", ".")
    else:
        formatted = f"R$ {value:,.0f}".replace(",", ".")
    return formatted


def action_to_dict(model: ManagementActionModel) -> dict[str, Any]:
    raw_status = str(model.status)
    status_value = ActionStatus(raw_status) if raw_status in {"concluída", "em andamento"} else ActionStatus.EM_ANDAMENTO
    raw_investment = float(model.investment_raw)
    return {
        "id": model.id,
        "title": model.title,
        "description": model.description,
        "category": model.category,
        "category_icon": model.category_icon,
        "investment": _format_investment(raw_investment),
        "investment_raw": raw_investment,
        "impact_label": model.impact_label,
        "impact_number": model.impact_number,
        "impact_suffix": model.impact_suffix,
        "image": model.image,
        "month": model.month,
        "year": model.year,
        "status": status_value,
        "color": model.color,
        "progress": model.progress,
    }
