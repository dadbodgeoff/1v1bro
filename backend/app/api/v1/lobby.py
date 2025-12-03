"""
Lobby API endpoints.
"""

from fastapi import APIRouter, status

from app.api.deps import CurrentUser, LobbyServiceDep
from app.core.responses import APIResponse
from app.schemas.lobby import (
    LobbyCreate,
    LobbyJoin,
    LobbyResponse,
    LobbyCodeResponse,
)


router = APIRouter(prefix="/lobbies", tags=["Lobbies"])


@router.post(
    "",
    response_model=APIResponse[LobbyResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_lobby(
    request: LobbyCreate,
    current_user: CurrentUser,
    lobby_service: LobbyServiceDep,
):
    """
    Create a new game lobby.
    
    Generates a unique 6-character code for opponents to join.
    The creating user becomes the host.
    """
    lobby = await lobby_service.create_lobby(
        host_id=current_user.id,
        game_mode=request.game_mode,
    )
    
    return APIResponse.ok(
        LobbyResponse(
            id=lobby["id"],
            code=lobby["code"],
            host_id=lobby["host_id"],
            opponent_id=lobby.get("opponent_id"),
            status=lobby["status"],
            game_mode=lobby["game_mode"],
            players=lobby.get("players", []),
            can_start=lobby.get("can_start", False),
        )
    )


@router.get(
    "/{code}",
    response_model=APIResponse[LobbyResponse],
)
async def get_lobby(
    code: str,
    current_user: CurrentUser,
    lobby_service: LobbyServiceDep,
):
    """
    Get lobby information by code.
    
    Returns lobby details including player list and game status.
    """
    lobby = await lobby_service.get_lobby(code)
    
    return APIResponse.ok(
        LobbyResponse(
            id=lobby["id"],
            code=lobby["code"],
            host_id=lobby["host_id"],
            opponent_id=lobby.get("opponent_id"),
            status=lobby["status"],
            game_mode=lobby["game_mode"],
            players=lobby.get("players", []),
            can_start=lobby.get("can_start", False),
        )
    )


@router.post(
    "/{code}/join",
    response_model=APIResponse[LobbyResponse],
)
async def join_lobby(
    code: str,
    current_user: CurrentUser,
    lobby_service: LobbyServiceDep,
):
    """
    Join an existing lobby.
    
    Adds the current user as the opponent in the lobby.
    Fails if lobby is full, not found, or user is the host.
    """
    lobby = await lobby_service.join_lobby(
        code=code,
        player_id=current_user.id,
    )
    
    # Notify host via WebSocket that opponent joined
    from app.websocket.manager import manager
    from app.websocket.events import build_player_joined
    
    # Get display name from the players list
    players = lobby.get("players", [])
    joining_player = next((p for p in players if p["id"] == current_user.id), None)
    display_name = joining_player.get("display_name") if joining_player else None
    
    await manager.broadcast_to_lobby(
        code.upper(),
        build_player_joined(
            player_id=current_user.id,
            display_name=display_name,
            players=players,
            can_start=lobby.get("can_start", False),
        )
    )
    
    return APIResponse.ok(
        LobbyResponse(
            id=lobby["id"],
            code=lobby["code"],
            host_id=lobby["host_id"],
            opponent_id=lobby.get("opponent_id"),
            status=lobby["status"],
            game_mode=lobby["game_mode"],
            players=lobby.get("players", []),
            can_start=lobby.get("can_start", False),
        )
    )


@router.delete(
    "/{code}",
    response_model=APIResponse[dict],
)
async def leave_lobby(
    code: str,
    current_user: CurrentUser,
    lobby_service: LobbyServiceDep,
):
    """
    Leave or close a lobby.
    
    If the host leaves, the lobby is abandoned.
    If the opponent leaves, they are removed and the lobby stays open.
    """
    lobby = await lobby_service.get_lobby(code)
    result = await lobby_service.leave_lobby(
        lobby_id=lobby["id"],
        player_id=current_user.id,
    )
    
    if result is None:
        return APIResponse.ok({"message": "Lobby closed"})
    
    return APIResponse.ok({"message": "Left lobby"})
