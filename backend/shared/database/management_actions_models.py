from __future__ import annotations

from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.sql import func

from backend.shared.database.models import Base


class ManagementActionModel(Base):
    __tablename__ = "management_actions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False)
    category_icon = Column(String(100), nullable=False)
    investment_raw = Column(Float, nullable=False, default=0.0)
    impact_label = Column(String(100), nullable=False)
    impact_number = Column(Float, nullable=False, default=0.0)
    impact_suffix = Column(String(50), nullable=False, default="")
    image = Column(String(500), nullable=True)
    month = Column(String(50), nullable=False)
    year = Column(String(4), nullable=False)
    status = Column(String(50), nullable=False, default="em andamento")
    color = Column(String(7), nullable=False)
    progress = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )
