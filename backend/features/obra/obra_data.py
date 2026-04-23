"""Persistência do bounded context obra."""

from __future__ import annotations

import secrets
from typing import cast

from sqlalchemy.orm import Session

from backend.features.obra.obra_types import MedicaoPayload, ObraWriteRequest
from backend.shared.database.models import ObraMedicaoModel, ObraModel


class SQLObraRepository:
    def __init__(self, session: Session):
        self.session = session

    def list_obras(self, status: str | None = None) -> list[ObraModel]:
        query = self.session.query(ObraModel).order_by(ObraModel.created_at.desc())
        if status is not None:
            query = query.filter(ObraModel.status == status)
        return list(query.all())

    def get_by_hash(self, obra_hash: str) -> ObraModel | None:
        return self.session.query(ObraModel).filter(ObraModel.hash == obra_hash).first()

    def list_medicoes(self, obra_id: int) -> list[ObraMedicaoModel]:
        return list(
            self.session.query(ObraMedicaoModel)
            .filter(ObraMedicaoModel.obra_id == obra_id)
            .order_by(ObraMedicaoModel.sequencia.asc())
            .all()
        )

    def create(self, payload: ObraWriteRequest) -> ObraModel:
        obra = ObraModel(hash=self._generate_hash(), **payload.model_dump(exclude={"medicoes"}))
        self.session.add(obra)
        self.session.flush()
        obra_id = cast(int, obra.id)
        self._replace_medicoes(obra_id, payload.medicoes)
        self.session.refresh(obra)
        return obra

    def update(self, obra: ObraModel, payload: ObraWriteRequest) -> ObraModel:
        for field, value in payload.model_dump(exclude={"medicoes"}).items():
            setattr(obra, field, value)
        self.session.flush()
        obra_id = cast(int, obra.id)
        self._replace_medicoes(obra_id, payload.medicoes)
        self.session.refresh(obra)
        return obra

    def delete(self, obra: ObraModel) -> None:
        self.session.delete(obra)
        self.session.flush()

    def count(self, status: str | None = None) -> int:
        query = self.session.query(ObraModel)
        if status is not None:
            query = query.filter(ObraModel.status == status)
        return int(query.count())

    def _generate_hash(self) -> str:
        while True:
            obra_hash = secrets.token_hex(8)
            existing = self.session.query(ObraModel).filter(ObraModel.hash == obra_hash).first()
            if existing is None:
                return obra_hash

    def _replace_medicoes(self, obra_id: int, medicoes: list[MedicaoPayload]) -> None:
        self.session.query(ObraMedicaoModel).filter(ObraMedicaoModel.obra_id == obra_id).delete()
        for medicao in medicoes:
            self.session.add(ObraMedicaoModel(obra_id=obra_id, **medicao.model_dump()))
        self.session.flush()
