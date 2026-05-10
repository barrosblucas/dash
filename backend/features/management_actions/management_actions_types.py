from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel


class ActionStatus(StrEnum):
    CONCLUIDA = "concluída"
    EM_ANDAMENTO = "em andamento"


class ActionRecord(BaseModel):
    id: int
    title: str
    description: str | None = None
    category: str
    category_icon: str
    investment: str
    investment_raw: float
    impact_label: str
    impact_number: float
    impact_suffix: str = ""
    image: str | None = None
    month: str
    year: str
    status: ActionStatus
    color: str
    progress: float


class ActionListResponse(BaseModel):
    items: list[ActionRecord]
    total: int
