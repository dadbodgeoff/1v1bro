"""
FastAPI dependencies for dependency injection.
"""

from typing import Annotated

from fastapi import Depends

from app.core.config import Settings, get_settings
from app.database.supabase_client import get_supabase_client, get_supabase_service_client
from app.middleware.auth import AuthenticatedUser, get_current_user, get_current_user_optional
from app.services.auth_service import AuthService
from app.services.lobby_service import LobbyService
from app.services.game_service import GameService
from app.services.question_service import QuestionService
from app.services.friend_service import FriendService
from app.services.message_service import MessageService
from app.services.profile_service import ProfileService
from app.services.cosmetics_service import CosmeticsService


# Settings dependency
SettingsDep = Annotated[Settings, Depends(get_settings)]

# Auth dependencies
CurrentUser = Annotated[AuthenticatedUser, Depends(get_current_user)]
OptionalUser = Annotated[AuthenticatedUser | None, Depends(get_current_user_optional)]


def get_auth_service() -> AuthService:
    """Get AuthService instance."""
    client = get_supabase_client()
    return AuthService(client)


def get_lobby_service() -> LobbyService:
    """Get LobbyService instance."""
    client = get_supabase_client()
    return LobbyService(client)


def get_game_service() -> GameService:
    """Get GameService instance."""
    client = get_supabase_client()
    return GameService(client)


def get_question_service() -> QuestionService:
    """Get QuestionService instance."""
    return QuestionService()


def get_friend_service() -> FriendService:
    """Get FriendService instance."""
    client = get_supabase_client()
    return FriendService(client)


def get_message_service() -> MessageService:
    """Get MessageService instance."""
    client = get_supabase_client()
    return MessageService(client)


def get_profile_service() -> ProfileService:
    """Get ProfileService instance."""
    client = get_supabase_client()
    return ProfileService(client)


def get_cosmetics_service() -> CosmeticsService:
    """Get CosmeticsService instance."""
    client = get_supabase_client()
    return CosmeticsService(client)


# Service dependencies
AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
LobbyServiceDep = Annotated[LobbyService, Depends(get_lobby_service)]
GameServiceDep = Annotated[GameService, Depends(get_game_service)]
QuestionServiceDep = Annotated[QuestionService, Depends(get_question_service)]
FriendServiceDep = Annotated[FriendService, Depends(get_friend_service)]
MessageServiceDep = Annotated[MessageService, Depends(get_message_service)]
ProfileServiceDep = Annotated[ProfileService, Depends(get_profile_service)]
CosmeticsServiceDep = Annotated[CosmeticsService, Depends(get_cosmetics_service)]
