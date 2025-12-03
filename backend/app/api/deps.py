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


# Service dependencies
AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
LobbyServiceDep = Annotated[LobbyService, Depends(get_lobby_service)]
GameServiceDep = Annotated[GameService, Depends(get_game_service)]
QuestionServiceDep = Annotated[QuestionService, Depends(get_question_service)]
