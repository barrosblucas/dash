"""Rotas HTTP do bounded context obra."""

from __future__ import annotations

from decimal import Decimal
from typing import cast

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.features.obra.obra_business import (
    calculate_valor_economizado,
    calculate_valor_medido_total,
)
from backend.features.obra.obra_data import SQLObraRepository
from backend.features.obra.obra_types import (
    MedicaoPayload,
    MedicaoResponse,
    ObraListResponse,
    ObraResponse,
    ObraStatus,
    ObraWriteRequest,
)
from backend.shared.database.connection import get_db
from backend.shared.database.models import ObraMedicaoModel, ObraModel, UserModel
from backend.shared.security import require_admin_user

router = APIRouter(prefix="/obras", tags=["obras"])


def _medicao_response(model: ObraMedicaoModel) -> MedicaoResponse:
    return MedicaoResponse(
        id=model.id,
        sequencia=model.sequencia,
        mes_referencia=model.mes_referencia,
        ano_referencia=model.ano_referencia,
        valor_medicao=model.valor_medicao,
        observacao=model.observacao,
    )


def _obra_response(obra: ObraModel, medicoes_models: list[ObraMedicaoModel]) -> ObraResponse:
    medicoes = [
        MedicaoPayload(
            sequencia=item.sequencia,
            mes_referencia=item.mes_referencia,
            ano_referencia=item.ano_referencia,
            valor_medicao=item.valor_medicao,
            observacao=item.observacao,
        )
        for item in medicoes_models
    ]
    return ObraResponse(
        hash=obra.hash,
        titulo=obra.titulo,
        descricao=obra.descricao,
        status=ObraStatus(cast(str, obra.status)),
        secretaria=obra.secretaria,
        orgao=obra.orgao,
        contrato=obra.contrato,
        tipo_obra=obra.tipo_obra,
        modalidade=obra.modalidade,
        fonte_recurso=obra.fonte_recurso,
        data_inicio=obra.data_inicio,
        previsao_termino=obra.previsao_termino,
        data_termino=obra.data_termino,
        logradouro=obra.logradouro,
        bairro=obra.bairro,
        cep=obra.cep,
        numero=obra.numero,
        latitude=obra.latitude,
        longitude=obra.longitude,
        valor_orcamento=obra.valor_orcamento,
        valor_original=obra.valor_original,
        valor_aditivo=obra.valor_aditivo,
        valor_homologado=obra.valor_homologado,
        valor_contrapartida=obra.valor_contrapartida,
        valor_convenio=obra.valor_convenio,
        progresso_fisico=obra.progresso_fisico,
        progresso_financeiro=obra.progresso_financeiro,
        valor_economizado=calculate_valor_economizado(
            cast(Decimal | None, obra.valor_original),
            cast(Decimal | None, obra.valor_homologado),
            cast(Decimal | None, obra.valor_orcamento),
        ),
        valor_medido_total=calculate_valor_medido_total(medicoes),
        created_at=obra.created_at,
        updated_at=obra.updated_at,
        medicoes=[_medicao_response(item) for item in medicoes_models],
    )


@router.get("", response_model=ObraListResponse)
async def list_obras(
    status_filter: ObraStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
) -> ObraListResponse:
    repo = SQLObraRepository(db)
    obras = repo.list_obras(status_filter.value if status_filter else None)
    serialized = [
        _obra_response(obra, repo.list_medicoes(cast(int, obra.id))) for obra in obras
    ]
    return ObraListResponse(obras=serialized, total=repo.count(status_filter.value if status_filter else None))


@router.get("/{obra_hash}", response_model=ObraResponse)
async def get_obra(obra_hash: str, db: Session = Depends(get_db)) -> ObraResponse:
    repo = SQLObraRepository(db)
    obra = repo.get_by_hash(obra_hash)
    if obra is None:
        raise HTTPException(status_code=404, detail="Obra não encontrada")
    return _obra_response(obra, repo.list_medicoes(cast(int, obra.id)))


@router.post("", response_model=ObraResponse, status_code=201)
async def create_obra(
    payload: ObraWriteRequest,
    _: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> ObraResponse:
    repo = SQLObraRepository(db)
    obra = repo.create(payload)
    return _obra_response(obra, repo.list_medicoes(cast(int, obra.id)))


@router.put("/{obra_hash}", response_model=ObraResponse)
async def update_obra(
    obra_hash: str,
    payload: ObraWriteRequest,
    _: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> ObraResponse:
    repo = SQLObraRepository(db)
    obra = repo.get_by_hash(obra_hash)
    if obra is None:
        raise HTTPException(status_code=404, detail="Obra não encontrada")
    updated = repo.update(obra, payload)
    return _obra_response(updated, repo.list_medicoes(cast(int, updated.id)))


@router.delete("/{obra_hash}")
async def delete_obra(
    obra_hash: str,
    _: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    repo = SQLObraRepository(db)
    obra = repo.get_by_hash(obra_hash)
    if obra is None:
        raise HTTPException(status_code=404, detail="Obra não encontrada")
    repo.delete(obra)
    return {"message": "Obra removida com sucesso"}
