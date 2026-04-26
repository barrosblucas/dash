"""Persistência do bounded context saude."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any, cast

from sqlalchemy import or_
from sqlalchemy.orm import Session

from backend.features.saude.saude_types import (
    SaudeSnapshotResource,
    SaudeSyncTriggerType,
    SaudeUnitCreateRequest,
    SaudeUnitScheduleItem,
    SaudeUnitUpdateRequest,
)
from backend.shared.database.models import (
    SaudeSnapshotModel,
    SaudeSyncLogModel,
    SaudeUnidadeHorarioModel,
    SaudeUnidadeModel,
)


class SQLSaudeRepository:
    def __init__(self, session: Session):
        self.session = session

    def list_units(
        self,
        *,
        unit_type: str | None = None,
        search: str | None = None,
        is_active: bool | None = None,
        only_active: bool = False,
    ) -> list[SaudeUnidadeModel]:
        query = self.session.query(SaudeUnidadeModel)
        if only_active:
            query = query.filter(SaudeUnidadeModel.is_active.is_(True))
        elif is_active is not None:
            query = query.filter(SaudeUnidadeModel.is_active.is_(is_active))
        if unit_type:
            query = query.filter(SaudeUnidadeModel.unit_type == unit_type)
        if search:
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    SaudeUnidadeModel.name.ilike(term),
                    SaudeUnidadeModel.address.ilike(term),
                    SaudeUnidadeModel.neighborhood.ilike(term),
                )
            )
        return list(query.order_by(SaudeUnidadeModel.name.asc()).all())

    def count_units(
        self,
        *,
        unit_type: str | None = None,
        search: str | None = None,
        is_active: bool | None = None,
        only_active: bool = False,
    ) -> int:
        return len(
            self.list_units(
                unit_type=unit_type,
                search=search,
                is_active=is_active,
                only_active=only_active,
            )
        )

    def get_unit_by_id(self, unit_id: int) -> SaudeUnidadeModel | None:
        return (
            self.session.query(SaudeUnidadeModel)
            .filter(SaudeUnidadeModel.id == unit_id)
            .first()
        )

    def get_unit_by_external_id(self, external_id: int) -> SaudeUnidadeModel | None:
        return (
            self.session.query(SaudeUnidadeModel)
            .filter(SaudeUnidadeModel.external_id == external_id)
            .first()
        )

    def create_unit(self, payload: SaudeUnitCreateRequest) -> SaudeUnidadeModel:
        model = SaudeUnidadeModel(**payload.model_dump())
        self.session.add(model)
        self.session.flush()
        self.session.refresh(model)
        return model

    def update_unit(
        self,
        model: SaudeUnidadeModel,
        payload: SaudeUnitUpdateRequest,
    ) -> SaudeUnidadeModel:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(model, field, value)
        self.session.flush()
        self.session.refresh(model)
        return model

    def deactivate_unit(self, model: SaudeUnidadeModel) -> SaudeUnidadeModel:
        cast(Any, model).is_active = False
        self.session.flush()
        self.session.refresh(model)
        return model

    def replace_unit_schedules(
        self,
        unit_id: int,
        schedules: list[SaudeUnitScheduleItem],
    ) -> list[SaudeUnidadeHorarioModel]:
        self.session.query(SaudeUnidadeHorarioModel).filter(
            SaudeUnidadeHorarioModel.unit_id == unit_id
        ).delete()
        created: list[SaudeUnidadeHorarioModel] = []
        for item in schedules:
            model = SaudeUnidadeHorarioModel(
                unit_id=unit_id,
                day_of_week=item.day_of_week.value,
                opens_at=item.opens_at,
                closes_at=item.closes_at,
                is_closed=item.is_closed,
            )
            self.session.add(model)
            created.append(model)
        self.session.flush()
        return created

    def list_unit_schedules(self, unit_id: int) -> list[SaudeUnidadeHorarioModel]:
        return list(
            self.session.query(SaudeUnidadeHorarioModel)
            .filter(SaudeUnidadeHorarioModel.unit_id == unit_id)
            .order_by(SaudeUnidadeHorarioModel.day_of_week.asc())
            .all()
        )

    def replace_snapshot(
        self,
        *,
        resource: SaudeSnapshotResource,
        payload: Any,
        synced_at: datetime,
        scope_year: int | None = None,
        source_url: str | None = None,
    ) -> SaudeSnapshotModel:
        payload_json = json.dumps(payload, ensure_ascii=False)
        item_count = _infer_item_count(payload)

        existing = self.get_snapshot_model(resource, scope_year)
        if existing is not None:
            existing_payload = json.loads(str(existing.payload_json))
            if json.dumps(existing_payload, ensure_ascii=False, sort_keys=True) == json.dumps(
                payload, ensure_ascii=False, sort_keys=True
            ):
                return existing

        new_snapshot = SaudeSnapshotModel(
            resource=resource.value,
            scope_year=scope_year,
            payload_json=payload_json,
            item_count=item_count,
            synced_at=synced_at,
            source_url=source_url,
        )
        self.session.add(new_snapshot)
        self.session.flush()
        self.session.refresh(new_snapshot)
        return new_snapshot

    def get_snapshot_model(
        self,
        resource: SaudeSnapshotResource,
        scope_year: int | None = None,
    ) -> SaudeSnapshotModel | None:
        query = self.session.query(SaudeSnapshotModel).filter(
            SaudeSnapshotModel.resource == resource.value
        )
        if scope_year is None:
            query = query.filter(SaudeSnapshotModel.scope_year.is_(None))
        else:
            query = query.filter(SaudeSnapshotModel.scope_year == scope_year)
        return query.order_by(SaudeSnapshotModel.synced_at.desc()).first()

    def get_snapshot_payload(
        self,
        resource: SaudeSnapshotResource,
        scope_year: int | None = None,
    ) -> tuple[Any | None, datetime | None]:
        model = self.get_snapshot_model(resource, scope_year)
        if model is None:
            return None, None
        return json.loads(str(model.payload_json)), cast(datetime, model.synced_at)

    def list_snapshot_models(self) -> list[SaudeSnapshotModel]:
        rows = list(
            self.session.query(SaudeSnapshotModel)
            .order_by(
                SaudeSnapshotModel.synced_at.desc(),
                SaudeSnapshotModel.resource.asc(),
                SaudeSnapshotModel.id.desc(),
            )
            .all()
        )
        latest_by_scope: dict[tuple[str, int | None], SaudeSnapshotModel] = {}
        for row in rows:
            key = (cast(str, row.resource), cast(int | None, row.scope_year))
            if key not in latest_by_scope:
                latest_by_scope[key] = row
        return list(latest_by_scope.values())

    def list_snapshot_history(
        self,
        resource: SaudeSnapshotResource,
        scope_year: int | None = None,
        *,
        limit: int = 10,
    ) -> list[SaudeSnapshotModel]:
        query = self.session.query(SaudeSnapshotModel).filter(
            SaudeSnapshotModel.resource == resource.value
        )
        if scope_year is None:
            query = query.filter(SaudeSnapshotModel.scope_year.is_(None))
        else:
            query = query.filter(SaudeSnapshotModel.scope_year == scope_year)
        return list(
            query.order_by(SaudeSnapshotModel.synced_at.desc(), SaudeSnapshotModel.id.desc())
            .limit(limit)
            .all()
        )

    def create_sync_log(
        self,
        *,
        trigger_type: SaudeSyncTriggerType,
        status: str,
        started_at: datetime,
        resources: list[SaudeSnapshotResource],
        years: list[int],
        error_message: str | None = None,
        finished_at: datetime | None = None,
    ) -> SaudeSyncLogModel:
        model = SaudeSyncLogModel(
            trigger_type=trigger_type.value,
            status=status,
            started_at=started_at,
            finished_at=finished_at,
            resources_json=json.dumps([item.value for item in resources]),
            years_json=json.dumps(years),
            error_message=error_message,
        )
        self.session.add(model)
        self.session.flush()
        self.session.refresh(model)
        return model

    def update_sync_log(
        self,
        model: SaudeSyncLogModel,
        *,
        status: str,
        finished_at: datetime,
        error_message: str | None,
    ) -> SaudeSyncLogModel:
        cast(Any, model).status = status
        cast(Any, model).finished_at = finished_at
        cast(Any, model).error_message = error_message
        self.session.flush()
        self.session.refresh(model)
        return model

    def list_recent_sync_logs(self, limit: int = 10) -> list[SaudeSyncLogModel]:
        return list(
            self.session.query(SaudeSyncLogModel)
            .order_by(SaudeSyncLogModel.started_at.desc())
            .limit(limit)
            .all()
        )

    def get_last_successful_sync_at(self) -> datetime | None:
        row = (
            self.session.query(SaudeSyncLogModel)
            .filter(SaudeSyncLogModel.status == "success")
            .order_by(SaudeSyncLogModel.finished_at.desc())
            .first()
        )
        return cast(datetime | None, row.finished_at if row is not None else None)


def _infer_item_count(payload: Any) -> int:
    if isinstance(payload, list):
        return len(payload)
    if isinstance(payload, dict):
        if isinstance(payload.get("medicamentos"), list):
            return len(payload["medicamentos"])
        if isinstance(payload.get("labels"), list):
            return len(payload["labels"])
        if isinstance(payload.get("quantitativos"), dict):
            return len(payload["quantitativos"])
        return len(payload)
    return 0
