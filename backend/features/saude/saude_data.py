"""Persistência do bounded context saude."""
from __future__ import annotations

import json
from datetime import datetime
from typing import Any, cast

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from backend.features.saude.saude_types import (
    SaudeSnapshotResource,
    SaudeSyncTriggerType,
    SaudeUnitCreateRequest,
    SaudeUnitScheduleItem,
    SaudeUnitUpdateRequest,
)
from backend.shared.database.models import (
    SaudeAtencaoPrimariaModel,
    SaudeBucalModel,
    SaudeEpidemiologicoModel,
    SaudeFarmaciaModel,
    SaudeMedicamentoModel,
    SaudeProcedimentosModel,
    SaudeSnapshotModel,
    SaudeSyncLogModel,
    SaudeUnidadeHorarioModel,
    SaudeUnidadeModel,
    SaudeVacinacaoModel,
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
            canonical_existing = json.dumps(json.loads(str(existing.payload_json)), ensure_ascii=False, sort_keys=True)
            canonical_new = json.dumps(payload, ensure_ascii=False, sort_keys=True)
            if canonical_existing == canonical_new:
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
    def get_snapshot_model_by_source_url(
        self,
        resource: SaudeSnapshotResource,
        source_url: str,
    ) -> SaudeSnapshotModel | None:
        return (
            self.session.query(SaudeSnapshotModel)
            .filter(
                SaudeSnapshotModel.resource == resource.value,
                SaudeSnapshotModel.source_url == source_url,
            )
            .order_by(SaudeSnapshotModel.synced_at.desc(), SaudeSnapshotModel.id.desc())
            .first()
        )
    def get_snapshot_payload(
        self,
        resource: SaudeSnapshotResource,
        scope_year: int | None = None,
    ) -> tuple[Any | None, datetime | None]:
        model = self.get_snapshot_model(resource, scope_year)
        if model is None:
            return None, None
        return json.loads(str(model.payload_json)), cast(datetime, model.synced_at)
    def get_snapshot_payload_by_source_url(
        self,
        resource: SaudeSnapshotResource,
        source_url: str,
    ) -> tuple[Any | None, datetime | None]:
        model = self.get_snapshot_model_by_source_url(resource, source_url)
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
    def upsert_medicamentos(self, items: list[dict[str, Any]], synced_at: datetime) -> int:
        """Upsert medication stock items. Key: (product_name, department, establishment)"""
        count = 0
        for item in items:
            existing = self.session.query(SaudeMedicamentoModel).filter(
                SaudeMedicamentoModel.product_name == item["product_name"],
                SaudeMedicamentoModel.department == item.get("department"),
                SaudeMedicamentoModel.establishment == item.get("establishment")).first()
            if existing:
                m = cast(Any, existing)
                m.unit = item.get("unit")
                m.in_stock = item.get("in_stock", 0)
                m.minimum_stock = item.get("minimum_stock")
                m.synced_at = synced_at
            else:
                self.session.add(SaudeMedicamentoModel(product_name=item["product_name"], unit=item.get("unit"), in_stock=item.get("in_stock", 0), minimum_stock=item.get("minimum_stock"), department=item.get("department"), establishment=item.get("establishment"), synced_at=synced_at))
            count += 1
        self.session.flush()
        return count
    def replace_domain_rows(self, model_class: type[SaudeFarmaciaModel | SaudeVacinacaoModel | SaudeAtencaoPrimariaModel], rows: list[dict[str, Any]], synced_at: datetime) -> int:
        """Replace rows for a domain table using delete+insert strategy."""
        if not rows:
            return 0
        for ano, mes, dataset in {(r["ano"], r.get("mes"), r["dataset"]) for r in rows}:
            filters = [model_class.ano == ano, model_class.dataset == dataset, model_class.mes.is_(None) if mes is None else model_class.mes == mes]
            self.session.query(model_class).filter(and_(*filters)).delete()
        for row in rows:
            self.session.add(model_class(ano=row["ano"], mes=row.get("mes"), dataset=row["dataset"], label=row["label"], quantidade=row["quantidade"], synced_at=synced_at))
        self.session.flush()
        return len(rows)
    def replace_epidemiologico_rows(self, rows: list[dict[str, Any]], synced_at: datetime) -> int:
        """Replace epidemiological data. Key: (dataset, label)"""
        if not rows:
            return 0
        for dataset, label in {(r["dataset"], r["label"]) for r in rows}:
            self.session.query(SaudeEpidemiologicoModel).filter(SaudeEpidemiologicoModel.dataset == dataset, SaudeEpidemiologicoModel.label == label).delete()
        for row in rows:
            self.session.add(SaudeEpidemiologicoModel(dataset=row["dataset"], label=row["label"], valor=row["valor"], synced_at=synced_at))
        self.session.flush()
        return len(rows)
    def replace_bucal_rows(self, rows: list[dict[str, Any]], synced_at: datetime) -> int:
        """Replace dental health data. Key: (label)"""
        if not rows:
            return 0
        for label in {r["label"] for r in rows}:
            self.session.query(SaudeBucalModel).filter(SaudeBucalModel.label == label).delete()
        for row in rows:
            self.session.add(SaudeBucalModel(ano=row["ano"], mes=row.get("mes"), label=row["label"], quantidade=row["quantidade"], synced_at=synced_at))
        self.session.flush()
        return len(rows)
    def replace_procedimentos_rows(self, rows: list[dict[str, Any]], synced_at: datetime) -> int:
        """Replace procedure type data. Key: (label)"""
        if not rows:
            return 0
        for label in {r["label"] for r in rows}:
            self.session.query(SaudeProcedimentosModel).filter(SaudeProcedimentosModel.label == label).delete()
        for row in rows:
            self.session.add(SaudeProcedimentosModel(label=row["label"], quantidade=row["quantidade"], synced_at=synced_at))
        self.session.flush()
        return len(rows)
    def list_medicamentos(self, *, search: str | None = None, estabelecimento: str | None = None) -> list[SaudeMedicamentoModel]:
        q = self.session.query(SaudeMedicamentoModel)
        if search:
            q = q.filter(SaudeMedicamentoModel.product_name.ilike(f"%{search.strip()}%"))
        if estabelecimento:
            q = q.filter(SaudeMedicamentoModel.establishment.ilike(estabelecimento))
        return list(q.order_by(SaudeMedicamentoModel.product_name.asc()).all())
    def get_medicamentos_synced_at(self) -> datetime | None:
        row = self.session.query(SaudeMedicamentoModel.synced_at).order_by(SaudeMedicamentoModel.synced_at.desc()).first()
        return cast(datetime | None, row[0] if row else None)
    def list_farmacia_rows(self, *, ano: int, dataset: str, mes: int | None = None) -> list[SaudeFarmaciaModel]:
        q = self.session.query(SaudeFarmaciaModel).filter(SaudeFarmaciaModel.ano == ano, SaudeFarmaciaModel.dataset == dataset)
        if mes is not None:
            q = q.filter(SaudeFarmaciaModel.mes == mes)
        return list(q.order_by(SaudeFarmaciaModel.ano.asc(), SaudeFarmaciaModel.mes.asc().nullsfirst(), SaudeFarmaciaModel.label.asc()).all())
    def list_vacinacao_rows(self, *, ano: int, dataset: str) -> list[SaudeVacinacaoModel]:
        return list(self.session.query(SaudeVacinacaoModel).filter(SaudeVacinacaoModel.ano == ano, SaudeVacinacaoModel.dataset == dataset).order_by(SaudeVacinacaoModel.ano.asc(), SaudeVacinacaoModel.mes.asc().nullsfirst(), SaudeVacinacaoModel.label.asc()).all())
    def list_epidemiologico_rows(self, *, dataset: str) -> list[SaudeEpidemiologicoModel]:
        return list(self.session.query(SaudeEpidemiologicoModel).filter(SaudeEpidemiologicoModel.dataset == dataset).order_by(SaudeEpidemiologicoModel.label.asc()).all())
    def list_atencao_primaria_rows(self, *, ano: int, dataset: str) -> list[SaudeAtencaoPrimariaModel]:
        return list(self.session.query(SaudeAtencaoPrimariaModel).filter(SaudeAtencaoPrimariaModel.ano == ano, SaudeAtencaoPrimariaModel.dataset == dataset).order_by(SaudeAtencaoPrimariaModel.ano.asc(), SaudeAtencaoPrimariaModel.mes.asc().nullsfirst(), SaudeAtencaoPrimariaModel.label.asc()).all())
    def list_bucal_rows(self, *, ano: int | None = None) -> list[SaudeBucalModel]:
        q = self.session.query(SaudeBucalModel)
        if ano is not None:
            q = q.filter(SaudeBucalModel.ano == ano)
        return list(q.order_by(SaudeBucalModel.ano.asc(), SaudeBucalModel.mes.asc().nullsfirst(), SaudeBucalModel.label.asc()).all())
    def list_procedimentos_rows(self) -> list[SaudeProcedimentosModel]:
        return list(self.session.query(SaudeProcedimentosModel).order_by(SaudeProcedimentosModel.label.asc()).all())
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
