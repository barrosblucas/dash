"""Persistência do bounded context obra."""

from __future__ import annotations

import secrets
from typing import cast

from sqlalchemy.orm import Session

from backend.features.obra.obra_types import (
    MedicaoPayload,
    ObraMediaAssetPayload,
    ObraMediaLinkRequest,
    ObraWriteRequest,
)
from backend.shared.database.models import (
    ObraFundingSourceModel,
    ObraLocationModel,
    ObraMediaModel,
    ObraMedicaoModel,
    ObraModel,
)


class SQLObraRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_most_recently_updated(self) -> ObraModel | None:
        return (
            self.session.query(ObraModel)
            .order_by(ObraModel.updated_at.desc(), ObraModel.id.desc())
            .first()
        )

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

    def list_locations(self, obra_id: int) -> list[ObraLocationModel]:
        return list(
            self.session.query(ObraLocationModel)
            .filter(ObraLocationModel.obra_id == obra_id)
            .order_by(ObraLocationModel.sequencia.asc(), ObraLocationModel.id.asc())
            .all()
        )

    def list_funding_sources(self, obra_id: int) -> list[ObraFundingSourceModel]:
        return list(
            self.session.query(ObraFundingSourceModel)
            .filter(ObraFundingSourceModel.obra_id == obra_id)
            .order_by(ObraFundingSourceModel.sequencia.asc(), ObraFundingSourceModel.id.asc())
            .all()
        )

    def list_media_assets(
        self,
        obra_id: int,
        *,
        medicao_id: int | None = None,
    ) -> list[ObraMediaModel]:
        query = self.session.query(ObraMediaModel).filter(ObraMediaModel.obra_id == obra_id)
        if medicao_id is None:
            query = query.filter(ObraMediaModel.medicao_id.is_(None))
        else:
            query = query.filter(ObraMediaModel.medicao_id == medicao_id)
        return list(query.order_by(ObraMediaModel.created_at.asc(), ObraMediaModel.id.asc()).all())

    def get_media_asset(self, media_id: int) -> ObraMediaModel | None:
        return self.session.query(ObraMediaModel).filter(ObraMediaModel.id == media_id).first()

    def create(self, payload: ObraWriteRequest) -> ObraModel:
        obra = ObraModel(hash=self._generate_hash(), **self._scalar_payload(payload))
        self.session.add(obra)
        self.session.flush()
        obra_id = cast(int, obra.id)
        self._replace_locations(obra_id, payload)
        self._replace_funding_sources(obra_id, payload)
        medicoes = self._upsert_medicoes(obra_id, payload.medicoes)
        self._sync_media_assets(obra_id, medicoes, payload)
        self.session.refresh(obra)
        return obra

    def update(self, obra: ObraModel, payload: ObraWriteRequest) -> ObraModel:
        for field, value in self._scalar_payload(payload).items():
            setattr(obra, field, value)
        self.session.flush()
        obra_id = cast(int, obra.id)
        self._replace_locations(obra_id, payload)
        self._replace_funding_sources(obra_id, payload)
        medicoes = self._upsert_medicoes(obra_id, payload.medicoes)
        self._sync_media_assets(obra_id, medicoes, payload)
        self.session.refresh(obra)
        return obra

    def create_media_link(
        self,
        obra_id: int,
        payload: ObraMediaLinkRequest,
    ) -> ObraMediaModel:
        model = ObraMediaModel(
            obra_id=obra_id,
            medicao_id=payload.medicao_id,
            titulo=payload.titulo,
            media_kind=payload.media_kind,
            source_type="url",
            external_url=payload.url,
        )
        self.session.add(model)
        self.session.flush()
        self.session.refresh(model)
        return model

    def create_uploaded_media(
        self,
        *,
        obra_id: int,
        medicao_id: int | None,
        titulo: str | None,
        media_kind: str,
        storage_path: str,
        original_name: str | None,
        content_type: str | None,
        file_size: int | None,
    ) -> ObraMediaModel:
        model = ObraMediaModel(
            obra_id=obra_id,
            medicao_id=medicao_id,
            titulo=titulo,
            media_kind=media_kind,
            source_type="upload",
            storage_path=storage_path,
            original_name=original_name,
            content_type=content_type,
            file_size=file_size,
        )
        self.session.add(model)
        self.session.flush()
        self.session.refresh(model)
        return model

    def delete_media_asset(self, media: ObraMediaModel) -> None:
        self.session.delete(media)
        self.session.flush()

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

    def _scalar_payload(self, payload: ObraWriteRequest) -> dict[str, object]:
        scalar = payload.model_dump(exclude={"medicoes", "locations", "funding_sources", "media_assets"})
        first_location = payload.locations[0] if payload.locations else None
        first_source = payload.funding_sources[0] if payload.funding_sources else None
        if first_location is not None:
            scalar.update(
                logradouro=first_location.logradouro,
                bairro=first_location.bairro,
                cep=first_location.cep,
                numero=first_location.numero,
                latitude=first_location.latitude,
                longitude=first_location.longitude,
            )
        if first_source is not None:
            scalar["fonte_recurso"] = first_source.nome
        return scalar

    def _replace_locations(self, obra_id: int, payload: ObraWriteRequest) -> None:
        self.session.query(ObraLocationModel).filter(ObraLocationModel.obra_id == obra_id).delete()
        locations = payload.locations or [
            type("Location", (), payload.model_dump(include={"logradouro", "bairro", "cep", "numero", "latitude", "longitude"}))()
        ]
        for index, location in enumerate(locations, start=1):
            self.session.add(
                ObraLocationModel(
                    obra_id=obra_id,
                    sequencia=getattr(location, "sequencia", index),
                    logradouro=location.logradouro,
                    bairro=location.bairro,
                    cep=location.cep,
                    numero=location.numero,
                    latitude=location.latitude,
                    longitude=location.longitude,
                )
            )
        self.session.flush()

    def _replace_funding_sources(self, obra_id: int, payload: ObraWriteRequest) -> None:
        self.session.query(ObraFundingSourceModel).filter(ObraFundingSourceModel.obra_id == obra_id).delete()
        funding_sources = payload.funding_sources or [
            type("Funding", (), {"sequencia": 1, "nome": payload.fonte_recurso, "valor": None})()
        ]
        for index, source in enumerate(funding_sources, start=1):
            self.session.add(
                ObraFundingSourceModel(
                    obra_id=obra_id,
                    sequencia=getattr(source, "sequencia", index),
                    nome=source.nome,
                    valor=getattr(source, "valor", None),
                )
            )
        self.session.flush()

    def _upsert_medicoes(
        self,
        obra_id: int,
        medicoes: list[MedicaoPayload],
    ) -> dict[int, ObraMedicaoModel]:
        existing = {
            cast(int, item.sequencia): item
            for item in self.session.query(ObraMedicaoModel)
            .filter(ObraMedicaoModel.obra_id == obra_id)
            .all()
        }
        seen_sequences: set[int] = set()
        persisted: dict[int, ObraMedicaoModel] = {}

        for medicao in medicoes:
            seen_sequences.add(medicao.sequencia)
            model = existing.get(cast(int, medicao.sequencia))
            if model is None:
                model = ObraMedicaoModel(obra_id=obra_id, **medicao.model_dump(exclude={"media_assets"}))
                self.session.add(model)
            else:
                for field, value in medicao.model_dump(exclude={"media_assets"}).items():
                    setattr(model, field, value)
            self.session.flush()
            persisted[medicao.sequencia] = model

        for sequencia, model in existing.items():
            if sequencia in seen_sequences:
                continue
            self.session.delete(model)

        self.session.flush()
        return persisted

    def _sync_media_assets(
        self,
        obra_id: int,
        medicoes_by_sequence: dict[int, ObraMedicaoModel],
        payload: ObraWriteRequest,
    ) -> None:
        self._replace_url_media_assets(obra_id, None, payload.media_assets)
        for medicao in payload.medicoes:
            model = medicoes_by_sequence.get(medicao.sequencia)
            if model is None:
                continue
            self._replace_url_media_assets(
                obra_id,
                cast(int, model.id),
                medicao.media_assets,
            )

    def _replace_url_media_assets(
        self,
        obra_id: int,
        medicao_id: int | None,
        media_assets: list[ObraMediaAssetPayload],
    ) -> None:
        query = self.session.query(ObraMediaModel).filter(
            ObraMediaModel.obra_id == obra_id,
            ObraMediaModel.source_type == "url",
        )
        if medicao_id is None:
            query = query.filter(ObraMediaModel.medicao_id.is_(None))
        else:
            query = query.filter(ObraMediaModel.medicao_id == medicao_id)
        query.delete()
        for media in media_assets:
            if media.source_type != "url" or not media.url:
                continue
            self.session.add(
                ObraMediaModel(
                    obra_id=obra_id,
                    medicao_id=medicao_id,
                    titulo=media.titulo,
                    media_kind=media.media_kind,
                    source_type="url",
                    external_url=media.url,
                )
            )
        self.session.flush()
