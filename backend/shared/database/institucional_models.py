"""Modelos ORM da feature institucional (prefeitura, gestão, secretarias, repartições)."""

from __future__ import annotations

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.shared.database.models import Base


class ProfileInstitucionalModel(Base):
    """Singleton com perfil institucional da prefeitura e dados de gestão."""

    __tablename__ = "institucional_profile"

    id = Column(Integer, primary_key=True, autoincrement=True)
    city_hall_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(1000), nullable=True)
    address = Column(String(500), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    office_hours = Column(String(255), nullable=True)
    social_links_json = Column(
        Text,
        nullable=True,
        comment='JSON array: [{"label": "...", "url": "..."}]',
    )
    # Gestão — prefeito
    mayor_name = Column(String(255), nullable=True)
    mayor_photo_url = Column(String(1000), nullable=True)
    mayor_bio = Column(Text, nullable=True)
    # Gestão — vice-prefeito
    vice_mayor_name = Column(String(255), nullable=True)
    vice_mayor_photo_url = Column(String(1000), nullable=True)
    vice_mayor_bio = Column(Text, nullable=True)
    # Gestão — chefe de gabinete
    cabinet_chief_name = Column(String(255), nullable=True)
    cabinet_chief_photo_url = Column(String(1000), nullable=True)
    cabinet_chief_bio = Column(Text, nullable=True)
    cabinet_description = Column(Text, nullable=True)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )


class DepartmentModel(Base):
    """Secretarias municipais e autarquias (SAAE)."""

    __tablename__ = "institucional_departments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    slug = Column(String(255), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    kind = Column(
        String(50), nullable=False, default="secretaria"
    )  # secretaria | autarquia
    leader_title = Column(String(255), nullable=False, default="Secretário(a)")
    secretary_name = Column(String(255), nullable=True)
    secretary_photo_url = Column(String(1000), nullable=True)
    description = Column(Text, nullable=True)
    mission = Column(Text, nullable=True)
    vision = Column(Text, nullable=True)
    values = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(String(500), nullable=True)
    office_hours = Column(String(255), nullable=True)
    image_url = Column(String(1000), nullable=True)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (Index("ix_department_kind", "kind"),)


class OfficeModel(Base):
    """Repartições, setores e gabinetes vinculados a departamentos."""

    __tablename__ = "institucional_offices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    department_id = Column(
        Integer,
        ForeignKey("institucional_departments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    kind = Column(
        String(50),
        nullable=False,
        default="reparticao",
    )  # secretaria | setor | reparticao | gabinete | autarquia
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(String(500), nullable=True)
    office_hours = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    department = relationship("DepartmentModel", backref="offices")

    __table_args__ = (
        Index("ix_office_kind", "kind"),
        Index("ix_office_department_kind", "department_id", "kind"),
    )
