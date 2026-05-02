"""Persistência SQL do bounded context legislação."""

from __future__ import annotations

import json
import logging
from typing import Any

from sqlalchemy.orm import Session

from backend.features.legislacao.legislacao_types import (
    LegislacaoCreateRequest,
    LegislacaoUpdateRequest,
    StatusLegislacao,
    TipoLegislacao,
)
from backend.shared.database.models import LegislacaoModel

logger = logging.getLogger(__name__)


class SQLLegislacaoRepository:
    def __init__(self, session: Session):
        self.session = session

    def list_legislacoes(
        self,
        page: int = 1,
        size: int = 12,
        tipo: TipoLegislacao | None = None,
        ano: int | None = None,
        status: StatusLegislacao | None = None,
        busca: str | None = None,
    ) -> tuple[list[LegislacaoModel], int]:
        query = self.session.query(LegislacaoModel)

        if tipo is not None:
            query = query.filter(LegislacaoModel.tipo == tipo.value)
        if ano is not None:
            query = query.filter(LegislacaoModel.ano == ano)
        if status is not None:
            query = query.filter(LegislacaoModel.status == status.value)
        if busca is not None:
            termo = f"%{busca}%"
            query = query.filter(
                (LegislacaoModel.ementa.ilike(termo))
                | (LegislacaoModel.numero.ilike(termo))
                | (LegislacaoModel.autor.ilike(termo))
                | (LegislacaoModel.tipo.ilike(termo))
            )

        total = query.count()
        offset = (page - 1) * size
        items = (
            query.order_by(LegislacaoModel.ano.desc(), LegislacaoModel.numero.asc())
            .offset(offset)
            .limit(size)
            .all()
        )
        return list(items), total

    def get_by_id(self, legislacao_id: int) -> LegislacaoModel | None:
        return (
            self.session.query(LegislacaoModel)
            .filter(LegislacaoModel.id == legislacao_id)
            .first()
        )

    def create(self, payload: LegislacaoCreateRequest) -> LegislacaoModel:
        data = payload.model_dump()
        vinculada = data.pop("legislacao_vinculada", None)
        if vinculada is not None:
            data["legislacao_vinculada_json"] = json.dumps(vinculada)

        legislacao = LegislacaoModel(**data)
        self.session.add(legislacao)
        self.session.flush()
        self.session.refresh(legislacao)
        return legislacao

    def update(
        self, legislacao: LegislacaoModel, payload: LegislacaoUpdateRequest
    ) -> LegislacaoModel:
        raw_updates = payload.model_dump(exclude_unset=True)
        if "legislacao_vinculada" in raw_updates:
            vinculada = raw_updates.pop("legislacao_vinculada")
            updates = raw_updates
            if vinculada is not None:
                updates["legislacao_vinculada_json"] = json.dumps(vinculada)
            else:
                updates["legislacao_vinculada_json"] = None
        else:
            updates = raw_updates

        for field, value in updates.items():
            setattr(legislacao, field, value)
        self.session.flush()
        self.session.refresh(legislacao)
        return legislacao

    def delete(self, legislacao: LegislacaoModel) -> None:
        self.session.delete(legislacao)
        self.session.flush()


def legislacao_to_item_dict(model: LegislacaoModel) -> dict[str, Any]:
    return {
        "id": str(model.id),
        "tipo": model.tipo,
        "numero": model.numero,
        "ano": model.ano,
        "ementa": model.ementa,
        "data_publicacao": str(model.data_publicacao),
        "data_promulgacao": str(model.data_promulgacao)
        if model.data_promulgacao
        else None,
        "status": model.status,
        "autor": model.autor,
    }


def legislacao_to_detalhe_dict(model: LegislacaoModel) -> dict[str, Any]:
    vinculada = None
    if model.legislacao_vinculada_json:
        vinculada = json.loads(str(model.legislacao_vinculada_json))
    return {
        "id": str(model.id),
        "tipo": model.tipo,
        "numero": model.numero,
        "ano": model.ano,
        "ementa": model.ementa,
        "texto_integral": model.texto_integral or "",
        "data_publicacao": str(model.data_publicacao),
        "data_promulgacao": str(model.data_promulgacao)
        if model.data_promulgacao
        else None,
        "data_vigencia_inicio": str(model.data_vigencia_inicio)
        if model.data_vigencia_inicio
        else None,
        "data_vigencia_fim": str(model.data_vigencia_fim)
        if model.data_vigencia_fim
        else None,
        "status": model.status,
        "autor": model.autor,
        "sancionado_por": model.sancionado_por,
        "origem": model.origem,
        "legislacao_vinculada": vinculada,
        "url_arquivo": model.url_arquivo,
    }
