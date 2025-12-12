"""
FastAPI dependencies for dependency injection.
"""

from typing import Annotated

from fastapi import Depends

from app.core.config import Settings, get_settings
from app.database.supabase_client import get_supabase_service_client
from supabase import Client as SupabaseClient

# Type alias for service client dependency
SupabaseServiceClient = Annotated[SupabaseClient, Depends(get_supabase_service_client)]


def get_supabase_client() -> SupabaseClient:
    """Get Supabase service client for API endpoints.
    
    This is an alias for get_supabase_service_client for backward compatibility.
    """
    return get_supabase_service_client()
from app.middleware.auth import AuthenticatedUser, get_current_user, get_current_user_optional
from app.services.auth_service import AuthService
from app.services.lobby_service import LobbyService
from app.services.game_service import GameService
from app.services.question_service import QuestionService
from app.services.friend_service import FriendService
from app.services.message_service import MessageService
from app.services.profile_service import ProfileService
from app.services.cosmetics_service import CosmeticsService
from app.services.battlepass_service import BattlePassService
from app.services.rotation_service import ShopRotationService
from app.services.asset_service import AssetManagementService
from app.services.achievement_service import AchievementService
from app.services.balance_service import BalanceService


# Settings dependency
SettingsDep = Annotated[Settings, Depends(get_settings)]

# Auth dependencies
CurrentUser = Annotated[AuthenticatedUser, Depends(get_current_user)]
OptionalUser = Annotated[AuthenticatedUser | None, Depends(get_current_user_optional)]


def get_auth_service() -> AuthService:
    """Get AuthService instance.
    
    Uses service client to bypass RLS - auth is handled by JWT middleware.
    """
    client = get_supabase_service_client()
    return AuthService(client)


def get_lobby_service() -> LobbyService:
    """Get LobbyService instance.
    
    Uses service client to bypass RLS for better query performance.
    """
    client = get_supabase_service_client()
    return LobbyService(client)


def get_game_service() -> GameService:
    """Get GameService instance.
    
    Uses service client to bypass RLS for better query performance.
    """
    client = get_supabase_service_client()
    return GameService(client)


def get_question_service() -> QuestionService:
    """Get QuestionService instance with database support.
    
    Uses service client to bypass RLS for better query performance.
    """
    client = get_supabase_service_client()
    return QuestionService(client)


def get_friend_service() -> FriendService:
    """Get FriendService instance.
    
    Uses service client to bypass RLS for better query performance.
    """
    client = get_supabase_service_client()
    return FriendService(client)


def get_message_service() -> MessageService:
    """Get MessageService instance.
    
    Uses service client to bypass RLS for better query performance.
    """
    client = get_supabase_service_client()
    return MessageService(client)


def get_profile_service() -> ProfileService:
    """Get ProfileService instance.
    
    Uses service client to bypass RLS for better query performance.
    """
    client = get_supabase_service_client()
    return ProfileService(client)


def get_cosmetics_service() -> CosmeticsService:
    """Get CosmeticsService instance.
    
    Uses service client to bypass RLS for reading catalog data.
    User-specific operations (inventory, loadout) still respect user context.
    """
    client = get_supabase_service_client()
    return CosmeticsService(client)


def get_battlepass_service() -> BattlePassService:
    """Get BattlePassService instance.
    
    Uses service client to bypass RLS for reading season/tier data.
    User-specific operations (progress, claims) still respect user context.
    """
    client = get_supabase_service_client()
    cosmetics_service = get_cosmetics_service()
    return BattlePassService(client, cosmetics_service)


# Service dependencies
AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
LobbyServiceDep = Annotated[LobbyService, Depends(get_lobby_service)]
GameServiceDep = Annotated[GameService, Depends(get_game_service)]
QuestionServiceDep = Annotated[QuestionService, Depends(get_question_service)]
FriendServiceDep = Annotated[FriendService, Depends(get_friend_service)]
MessageServiceDep = Annotated[MessageService, Depends(get_message_service)]
ProfileServiceDep = Annotated[ProfileService, Depends(get_profile_service)]
CosmeticsServiceDep = Annotated[CosmeticsService, Depends(get_cosmetics_service)]
BattlePassServiceDep = Annotated[BattlePassService, Depends(get_battlepass_service)]


def get_rotation_service() -> ShopRotationService:
    """Get ShopRotationService instance."""
    client = get_supabase_service_client()
    return ShopRotationService(client)


def get_asset_service() -> AssetManagementService:
    """Get AssetManagementService instance."""
    client = get_supabase_service_client()
    return AssetManagementService(client)


async def get_current_admin_user(user: CurrentUser) -> dict:
    """
    Verify user has admin privileges.
    
    For now, returns the user dict. In production, add role checking.
    """
    # TODO: Add proper admin role checking
    # For now, allow any authenticated user for development
    return {"id": user.id, "email": user.email}


RotationServiceDep = Annotated[ShopRotationService, Depends(get_rotation_service)]
AssetServiceDep = Annotated[AssetManagementService, Depends(get_asset_service)]


def get_achievement_service() -> AchievementService:
    """Get AchievementService instance."""
    client = get_supabase_service_client()
    return AchievementService(client)


def get_balance_service() -> BalanceService:
    """Get BalanceService instance."""
    client = get_supabase_service_client()
    return BalanceService(client)


AchievementServiceDep = Annotated[AchievementService, Depends(get_achievement_service)]
BalanceServiceDep = Annotated[BalanceService, Depends(get_balance_service)]
