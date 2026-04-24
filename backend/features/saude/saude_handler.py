"""Rotas HTTP agregadas do bounded context saude."""

from fastapi import APIRouter

from backend.features.saude.saude_admin_handler import router as admin_router
from backend.features.saude.saude_public_handler import router as public_router
from backend.features.saude.saude_units_handler import router as units_router

router = APIRouter(prefix="/saude", tags=["saude"])
router.include_router(public_router)
router.include_router(units_router)
router.include_router(admin_router)
