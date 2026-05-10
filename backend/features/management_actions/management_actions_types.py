from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel, Field


class ActionStatus(StrEnum):
    CONCLUIDA = "concluída"
    EM_ANDAMENTO = "em andamento"


class ActionCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    category: str = Field(..., min_length=1, max_length=100)
    category_icon: str = Field(..., min_length=1, max_length=100)
    investment_raw: float = Field(..., ge=0)
    impact_label: str = Field(..., min_length=1, max_length=100)
    impact_number: float = Field(..., ge=0)
    impact_suffix: str = ""
    image: str | None = None
    month: str = Field(..., min_length=1, max_length=50)
    year: str = Field(..., min_length=4, max_length=4)
    status: ActionStatus = ActionStatus.EM_ANDAMENTO
    color: str = Field(default="#3b82f6", min_length=7, max_length=7)
    progress: float = Field(default=0.0, ge=0, le=100)


class ActionUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    category: str | None = Field(default=None, min_length=1, max_length=100)
    category_icon: str | None = Field(default=None, min_length=1, max_length=100)
    investment_raw: float | None = Field(default=None, ge=0)
    impact_label: str | None = Field(default=None, min_length=1, max_length=100)
    impact_number: float | None = Field(default=None, ge=0)
    impact_suffix: str | None = None
    image: str | None = None
    month: str | None = Field(default=None, min_length=1, max_length=50)
    year: str | None = Field(default=None, min_length=4, max_length=4)
    status: ActionStatus | None = None
    color: str | None = Field(default=None, min_length=7, max_length=7)
    progress: float | None = Field(default=None, ge=0, le=100)


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
