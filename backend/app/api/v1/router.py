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
from app.api.v1.battlepass import router as battlepass_router
from app.api.v1.admin_cosmetics import router as admin_cosmetics_router
from app.api.v1.admin_rotations import router as admin_rotations_router
from app.api.v1.settings import router as settings_router
from app.api.v1.coins import router as coins_router
from app.api.v1.webhooks import router as webhooks_router
from app.api.v1.questions import router as questions_router


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
router.include_router(battlepass_router)

router.include_router(settings_router)

# Coin purchase routes
router.include_router(coins_router)
router.include_router(webhooks_router)

# Questions/trivia routes
router.include_router(questions_router)

# Admin routes
router.include_router(admin_cosmetics_router)
router.include_router(admin_rotations_router)
