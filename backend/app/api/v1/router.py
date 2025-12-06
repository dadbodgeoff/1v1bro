"""
API v1 router aggregation.
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.lobby import router as lobby_router
from app.api.v1.game import router as game_router
from app.api.v1.stats import router as stats_router
from app.api.v1.leaderboards import router as leaderboards_router
from app.api.v1.friend import router as friend_router
from app.api.v1.telemetry import router as telemetry_router
from app.api.v1.health import router as health_router
from app.api.v1.matchmaking import router as matchmaking_router
from app.api.v1.messages import router as messages_router
from app.api.v1.profiles import router as profiles_router
from app.api.v1.cosmetics import router as cosmetics_router


router = APIRouter()

# Include all v1 routers
router.include_router(auth_router)
router.include_router(lobby_router)
router.include_router(game_router)
router.include_router(stats_router)
router.include_router(leaderboards_router)
router.include_router(friend_router)
router.include_router(telemetry_router)
router.include_router(health_router)
router.include_router(matchmaking_router)
router.include_router(messages_router)
router.include_router(profiles_router)
router.include_router(cosmetics_router)
