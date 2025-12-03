"""
API v1 router aggregation.
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.lobby import router as lobby_router
from app.api.v1.game import router as game_router


router = APIRouter()

# Include all v1 routers
router.include_router(auth_router)
router.include_router(lobby_router)
router.include_router(game_router)
