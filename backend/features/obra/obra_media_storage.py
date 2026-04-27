"""Armazenamento local de mídia para obras."""

from __future__ import annotations

import os
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

_DEFAULT_MEDIA_ROOT = Path(__file__).resolve().parents[3] / "storage" / "obras"


def media_root() -> Path:
    configured_root = os.environ.get("OBRA_MEDIA_ROOT")
    if configured_root:
        return Path(configured_root)
    return _DEFAULT_MEDIA_ROOT


async def store_media_upload(obra_hash: str, upload: UploadFile) -> tuple[str, int]:
    target_dir = media_root() / obra_hash
    target_dir.mkdir(parents=True, exist_ok=True)
    suffix = Path(upload.filename or "").suffix
    target_name = f"{uuid4().hex}{suffix}"
    target_path = target_dir / target_name
    contents = await upload.read()
    target_path.write_bytes(contents)
    return str(target_path.relative_to(media_root())), len(contents)


def resolve_media_path(storage_path: str) -> Path:
    return media_root() / storage_path


def delete_media_file(storage_path: str | None) -> None:
    if not storage_path:
        return
    target = resolve_media_path(storage_path)
    if target.exists():
        target.unlink()
