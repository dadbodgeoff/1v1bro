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
    The creating user becomes the host with their playercard data.
    """
    from app.api.deps import get_cosmetics_service
    
    lobby = await lobby_service.create_lobby(
        host_id=current_user.id,
        game_mode=request.game_mode,
    )
    
    players = lobby.get("players", [])
    
    # Enrich host with playercard data
    try:
        cosmetics_service = get_cosmetics_service()
        
        enriched_players = []
        for player in players:
            enriched_player = dict(player)
            try:
                inventory = await cosmetics_service.get_inventory(player["id"])
                loadout = inventory.loadout if inventory else None
                
                if loadout and loadout.playercard_equipped:
                    playercard = loadout.playercard_equipped
                    owns_playercard = any(
                        item.cosmetic_id == playercard.id 
                        for item in inventory.items
                    )
                    if owns_playercard:
                        enriched_player["playercard"] = {
                            "id": playercard.id,
                            "name": playercard.name,
                            "type": playercard.type.value,
                            "rarity": playercard.rarity.value,
                            "image_url": playercard.image_url,
                        }
                    else:
                        enriched_player["playercard"] = None
                else:
                    enriched_player["playercard"] = None
            except Exception:
                enriched_player["playercard"] = None
            enriched_players.append(enriched_player)
        
        players = enriched_players
    except Exception:
        pass
    
    return APIResponse.ok(
        LobbyResponse(
            id=lobby["id"],
            code=lobby["code"],
            host_id=lobby["host_id"],
            opponent_id=lobby.get("opponent_id"),
            status=lobby["status"],
            game_mode=lobby["game_mode"],
            players=players,
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
    
    Returns lobby details including player list, game status, and playercard data.
    """
    from app.api.deps import get_cosmetics_service
    
    lobby = await lobby_service.get_lobby(code)
    players = lobby.get("players", [])
    
    # Enrich players with playercard data for immediate display
    try:
        cosmetics_service = get_cosmetics_service()
        
        enriched_players = []
        for player in players:
            enriched_player = dict(player)
            try:
                inventory = await cosmetics_service.get_inventory(player["id"])
                loadout = inventory.loadout if inventory else None
                
                if loadout and loadout.playercard_equipped:
                    playercard = loadout.playercard_equipped
                    # Verify ownership
                    owns_playercard = any(
                        item.cosmetic_id == playercard.id 
                        for item in inventory.items
                    )
                    if owns_playercard:
                        enriched_player["playercard"] = {
                            "id": playercard.id,
                            "name": playercard.name,
                            "type": playercard.type.value,
                            "rarity": playercard.rarity.value,
                            "image_url": playercard.image_url,
                        }
                    else:
                        enriched_player["playercard"] = None
                else:
                    enriched_player["playercard"] = None
            except Exception:
                enriched_player["playercard"] = None
            enriched_players.append(enriched_player)
        
        players = enriched_players
    except Exception:
        # If enrichment fails, continue with basic player data
        pass
    
    return APIResponse.ok(
        LobbyResponse(
            id=lobby["id"],
            code=lobby["code"],
            host_id=lobby["host_id"],
            opponent_id=lobby.get("opponent_id"),
            status=lobby["status"],
            game_mode=lobby["game_mode"],
            players=players,
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
    from app.api.deps import get_cosmetics_service
    from app.websocket.manager import manager
    from app.websocket.events import build_player_joined
    
    lobby = await lobby_service.join_lobby(
        code=code,
        player_id=current_user.id,
    )
    
    players = lobby.get("players", [])
    
    # Enrich players with playercard data
    try:
        cosmetics_service = get_cosmetics_service()
        
        enriched_players = []
        for player in players:
            enriched_player = dict(player)
            try:
                inventory = await cosmetics_service.get_inventory(player["id"])
                loadout = inventory.loadout if inventory else None
                
                if loadout and loadout.playercard_equipped:
                    playercard = loadout.playercard_equipped
                    owns_playercard = any(
                        item.cosmetic_id == playercard.id 
                        for item in inventory.items
                    )
                    if owns_playercard:
                        enriched_player["playercard"] = {
                            "id": playercard.id,
                            "name": playercard.name,
                            "type": playercard.type.value,
                            "rarity": playercard.rarity.value,
                            "image_url": playercard.image_url,
                        }
                    else:
                        enriched_player["playercard"] = None
                else:
                    enriched_player["playercard"] = None
            except Exception:
                enriched_player["playercard"] = None
            enriched_players.append(enriched_player)
        
        players = enriched_players
    except Exception:
        pass
    
    # Get display name from the players list
    joining_player = next((p for p in players if p["id"] == current_user.id), None)
    display_name = joining_player.get("display_name") if joining_player else None
    
    # Notify host via WebSocket that opponent joined (with playercards)
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
            players=players,
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
