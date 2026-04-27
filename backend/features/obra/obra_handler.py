"""Rotas HTTP do bounded context obra."""

from __future__ import annotations

from decimal import Decimal
from typing import cast

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse, RedirectResponse, Response
from sqlalchemy.orm import Session

from backend.features.obra.obra_business import (
    calculate_valor_economizado,
    calculate_valor_medido_total,
)
from backend.features.obra.obra_data import SQLObraRepository
from backend.features.obra.obra_media_storage import (
    delete_media_file,
    resolve_media_path,
    store_media_upload,
)
from backend.features.obra.obra_types import (
    MedicaoPayload,
    MedicaoResponse,
    ObraFundingSourceResponse,
    ObraListResponse,
    ObraLocationResponse,
    ObraMediaAssetResponse,
    ObraMediaLinkRequest,
    ObraResponse,
    ObraStatus,
    ObraWriteRequest,
)
from backend.shared.database.connection import get_db
from backend.shared.database.models import (
    ObraFundingSourceModel,
    ObraLocationModel,
    ObraMediaModel,
    ObraMedicaoModel,
    ObraModel,
    UserModel,
)
from backend.shared.security import require_admin_user

router = APIRouter(prefix="/obras", tags=["obras"])


def _location_response(model: ObraLocationModel) -> ObraLocationResponse:
    return ObraLocationResponse(
        id=model.id,
        sequencia=model.sequencia,
        logradouro=model.logradouro,
        bairro=model.bairro,
        cep=model.cep,
        numero=model.numero,
        latitude=model.latitude,
        longitude=model.longitude,
    )


def _funding_source_response(model: ObraFundingSourceModel) -> ObraFundingSourceResponse:
    return ObraFundingSourceResponse(
        id=model.id,
        sequencia=model.sequencia,
        nome=model.nome,
        valor=model.valor,
    )


def _media_response(model: ObraMediaModel) -> ObraMediaAssetResponse:
    url = cast(str | None, model.external_url)
    if model.source_type == "upload":
        url = f"/api/v1/obras/media/{model.id}/content"
    return ObraMediaAssetResponse(
        id=model.id,
        titulo=model.titulo,
        media_kind=model.media_kind,
        source_type=model.source_type,
        url=url,
        original_name=model.original_name,
        content_type=model.content_type,
        file_size=model.file_size,
    )


def _medicao_response(
    model: ObraMedicaoModel,
    media_assets: list[ObraMediaModel],
) -> MedicaoResponse:
    return MedicaoResponse(
        id=model.id,
        sequencia=model.sequencia,
        mes_referencia=model.mes_referencia,
        ano_referencia=model.ano_referencia,
        valor_medicao=model.valor_medicao,
        observacao=model.observacao,
        media_assets=[_media_response(item) for item in media_assets],
    )


def _obra_response(
    repo: SQLObraRepository,
    obra: ObraModel,
) -> ObraResponse:
    obra_id = cast(int, obra.id)
    medicoes_models = repo.list_medicoes(obra_id)
    locations = repo.list_locations(obra_id)
    funding_sources = repo.list_funding_sources(obra_id)
    global_media = repo.list_media_assets(obra_id)

    medicoes_payload = [
        MedicaoPayload(
            sequencia=item.sequencia,
            mes_referencia=item.mes_referencia,
            ano_referencia=item.ano_referencia,
            valor_medicao=item.valor_medicao,
            observacao=item.observacao,
            media_assets=[],
        )
        for item in medicoes_models
    ]
    media_by_medicao = {
        cast(int, item.id): repo.list_media_assets(obra_id, medicao_id=cast(int, item.id))
        for item in medicoes_models
    }

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
        valor_medido_total=calculate_valor_medido_total(medicoes_payload),
        created_at=obra.created_at,
        updated_at=obra.updated_at,
        locations=[_location_response(item) for item in locations],
        funding_sources=[_funding_source_response(item) for item in funding_sources],
        media_assets=[_media_response(item) for item in global_media],
        medicoes=[
            _medicao_response(item, media_by_medicao.get(cast(int, item.id), []))
            for item in medicoes_models
        ],
    )


def _require_obra(repo: SQLObraRepository, obra_hash: str) -> ObraModel:
    obra = repo.get_by_hash(obra_hash)
    if obra is None:
        raise HTTPException(status_code=404, detail="Obra não encontrada")
    return obra


def _require_media(repo: SQLObraRepository, obra: ObraModel, media_id: int) -> ObraMediaModel:
    media = repo.get_media_asset(media_id)
    if media is None or media.obra_id != obra.id:
        raise HTTPException(status_code=404, detail="Mídia não encontrada")
    return media


@router.get("", response_model=ObraListResponse)
async def list_obras(
    status_filter: ObraStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
) -> ObraListResponse:
    repo = SQLObraRepository(db)
    obras = repo.list_obras(status_filter.value if status_filter else None)
    return ObraListResponse(
        obras=[_obra_response(repo, obra) for obra in obras],
        total=repo.count(status_filter.value if status_filter else None),
    )


@router.get("/{obra_hash}", response_model=ObraResponse)
async def get_obra(obra_hash: str, db: Session = Depends(get_db)) -> ObraResponse:
    repo = SQLObraRepository(db)
    return _obra_response(repo, _require_obra(repo, obra_hash))


@router.post("", response_model=ObraResponse, status_code=201)
async def create_obra(
    payload: ObraWriteRequest,
    _: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> ObraResponse:
    repo = SQLObraRepository(db)
    return _obra_response(repo, repo.create(payload))


@router.put("/{obra_hash}", response_model=ObraResponse)
async def update_obra(
    obra_hash: str,
    payload: ObraWriteRequest,
    _: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> ObraResponse:
    repo = SQLObraRepository(db)
    obra = _require_obra(repo, obra_hash)
    return _obra_response(repo, repo.update(obra, payload))


@router.post("/{obra_hash}/media/link", response_model=ObraMediaAssetResponse, status_code=201)
async def create_media_link(
    obra_hash: str,
    payload: ObraMediaLinkRequest,
    _: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> ObraMediaAssetResponse:
    repo = SQLObraRepository(db)
    obra = _require_obra(repo, obra_hash)
    media = repo.create_media_link(cast(int, obra.id), payload)
    return _media_response(media)


@router.post("/{obra_hash}/media/upload", response_model=ObraMediaAssetResponse, status_code=201)
async def upload_media(
    obra_hash: str,
    file: UploadFile = File(...),
    titulo: str | None = Form(default=None),
    media_kind: str = Form(default="image"),
    medicao_id: int | None = Form(default=None),
    _: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> ObraMediaAssetResponse:
    repo = SQLObraRepository(db)
    obra = _require_obra(repo, obra_hash)
    if medicao_id is not None:
        medicao = next((item for item in repo.list_medicoes(cast(int, obra.id)) if item.id == medicao_id), None)
        if medicao is None:
            raise HTTPException(status_code=404, detail="Medição não encontrada para esta obra")
    storage_path, file_size = await store_media_upload(cast(str, obra.hash), file)
    media = repo.create_uploaded_media(
        obra_id=cast(int, obra.id),
        medicao_id=medicao_id,
        titulo=titulo,
        media_kind=media_kind,
        storage_path=storage_path,
        original_name=file.filename,
        content_type=file.content_type,
        file_size=file_size,
    )
    return _media_response(media)


@router.delete("/{obra_hash}/media/{media_id}")
async def delete_media(
    obra_hash: str,
    media_id: int,
    _: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    repo = SQLObraRepository(db)
    obra = _require_obra(repo, obra_hash)
    media = _require_media(repo, obra, media_id)
    delete_media_file(cast(str | None, media.storage_path))
    repo.delete_media_asset(media)
    return {"message": "Mídia removida com sucesso"}


@router.get("/media/{media_id}/content", response_model=None)
async def get_media_content(media_id: int, db: Session = Depends(get_db)) -> Response:
    repo = SQLObraRepository(db)
    media = repo.get_media_asset(media_id)
    if media is None:
        raise HTTPException(status_code=404, detail="Mídia não encontrada")
    external_url = cast(str | None, media.external_url)
    storage_path = cast(str | None, media.storage_path)
    if media.source_type == "url" and external_url:
        return RedirectResponse(external_url)
    if not storage_path:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    target = resolve_media_path(storage_path)
    if not target.exists():
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    return FileResponse(
        target,
        media_type=cast(str | None, media.content_type),
        filename=cast(str | None, media.original_name),
    )


@router.delete("/{obra_hash}")
async def delete_obra(
    obra_hash: str,
    _: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    repo = SQLObraRepository(db)
    obra = _require_obra(repo, obra_hash)
    for media in repo.list_media_assets(cast(int, obra.id)) + [
        item
        for medicao in repo.list_medicoes(cast(int, obra.id))
        for item in repo.list_media_assets(cast(int, obra.id), medicao_id=cast(int, medicao.id))
    ]:
        delete_media_file(cast(str | None, media.storage_path))
    repo.delete(obra)
    return {"message": "Obra removida com sucesso"}
