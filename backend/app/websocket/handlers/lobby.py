"""
Lobby-related WebSocket handlers.
"""

import asyncio
from typing import Dict, Optional
from app.core.logging import get_logger
from app.game import tick_system
from app.websocket.events import (
    build_error,
    build_game_start,
    build_player_ready,
    build_player_joined,
    build_player_left,
    build_lobby_state,
)
from .base import BaseHandler

logger = get_logger("websocket.handlers.lobby")


class LobbyHandler(BaseHandler):
    """Handles lobby events (join, leave, ready, start)."""

    def __init__(self, lobby_service, game_service, quiz_handler, cosmetics_service=None):
        super().__init__(lobby_service, game_service)
        self.quiz_handler = quiz_handler
        self.cosmetics_service = cosmetics_service

    async def _get_player_skins(self, player_ids: list[str]) -> Dict[str, Optional[Dict]]:
        """Fetch equipped skins for all players in the game.
        
        Only returns skins that the player actually owns in their inventory.
        If no skin is equipped or owned, returns None (player uses default skin).
        """
        player_skins = {}
        
        if not self.cosmetics_service:
            logger.warning("No cosmetics service available, skipping skin fetch")
            return player_skins
        
        for player_id in player_ids:
            try:
                # Get the player's inventory to verify ownership
                inventory = await self.cosmetics_service.get_inventory(player_id)
                
                # Get the loadout
                loadout = inventory.loadout if inventory else None
                
                if loadout and loadout.skin_equipped:
                    skin = loadout.skin_equipped
                    
                    # Verify the player actually owns this skin in their inventory
                    owns_skin = any(
                        item.cosmetic_id == skin.id 
                        for item in inventory.items
                    )
                    
                    if owns_skin:
                        player_skins[player_id] = {
                            "skin_id": skin.skin_id,
                            "sprite_sheet_url": skin.sprite_sheet_url,
                            "sprite_meta_url": skin.sprite_meta_url,
                        }
                        logger.info(f"Fetched verified skin for player {player_id}: {skin.name}")
                    else:
                        # Player has a skin equipped but doesn't own it - use default
                        logger.warning(f"Player {player_id} has skin equipped but doesn't own it, using default")
                        player_skins[player_id] = None
                else:
                    # No skin equipped - use default
                    player_skins[player_id] = None
                    logger.info(f"No skin equipped for player {player_id}, using default")
            except Exception as e:
                logger.error(f"Failed to fetch skin for player {player_id}: {e}")
                import traceback
                traceback.print_exc()
                player_skins[player_id] = None
        
        return player_skins

    async def _get_player_playercards(self, player_ids: list[str]) -> Dict[str, Optional[Dict]]:
        """Fetch equipped playercards for all players in the lobby.
        
        Returns playercard cosmetic data for display in the lobby head-to-head view.
        If no playercard is equipped or owned, returns None (player uses default placeholder).
        
        Requirements: 3.1, 5.1
        """
        player_playercards = {}
        
        if not self.cosmetics_service:
            logger.warning("No cosmetics service available, skipping playercard fetch")
            return player_playercards
        
        for player_id in player_ids:
            try:
                # Get the player's inventory to verify ownership
                inventory = await self.cosmetics_service.get_inventory(player_id)
                
                # Get the loadout
                loadout = inventory.loadout if inventory else None
                
                if loadout and loadout.playercard_equipped:
                    playercard = loadout.playercard_equipped
                    
                    # Verify the player actually owns this playercard in their inventory
                    owns_playercard = any(
                        item.cosmetic_id == playercard.id 
                        for item in inventory.items
                    )
                    
                    if owns_playercard:
                        player_playercards[player_id] = {
                            "id": playercard.id,
                            "name": playercard.name,
                            "type": playercard.type.value,
                            "rarity": playercard.rarity.value,
                            "image_url": playercard.image_url,
                        }
                        logger.info(f"Fetched verified playercard for player {player_id}: {playercard.name}")
                    else:
                        # Player has a playercard equipped but doesn't own it - use default
                        logger.warning(f"Player {player_id} has playercard equipped but doesn't own it, using default")
                        player_playercards[player_id] = None
                else:
                    # No playercard equipped - use default
                    player_playercards[player_id] = None
                    logger.info(f"No playercard equipped for player {player_id}, using default")
            except Exception as e:
                logger.error(f"Failed to fetch playercard for player {player_id}: {e}")
                import traceback
                traceback.print_exc()
                player_playercards[player_id] = None
        
        return player_playercards

    async def _enrich_players_with_playercards(self, players: list[Dict], player_playercards: Dict[str, Optional[Dict]]) -> list[Dict]:
        """Add playercard data to player objects.
        
        Requirements: 5.1, 5.2
        """
        enriched_players = []
        for player in players:
            enriched_player = dict(player)  # Copy to avoid mutating original
            enriched_player["playercard"] = player_playercards.get(player["id"])
            enriched_players.append(enriched_player)
        return enriched_players

    async def handle_start_game(self, lobby_code: str, user_id: str) -> None:
        """Handle start_game message from host."""
        try:
            lobby = await self.get_lobby(lobby_code)

            if lobby["host_id"] != user_id:
                await self.send_error(user_id, "NOT_HOST", "Only the host can start the game")
                return

            if not lobby.get("opponent_id"):
                await self.send_error(user_id, "NO_OPPONENT", "Cannot start without an opponent")
                return

            await self.lobby_service.start_game(lobby["id"], user_id)

            # Use lobby's game_mode for trivia questions (game_mode stores the category)
            category = lobby.get("game_mode", "fortnite")
            session = await self.game_service.create_session(
                lobby_id=lobby["id"],
                player1_id=lobby["host_id"],
                player2_id=lobby["opponent_id"],
                game_mode=category,
            )

            tick_system.create_game(
                lobby_id=lobby_code,
                player1_id=lobby["host_id"],
                player2_id=lobby["opponent_id"],
                spawn1=(160, 360),
                spawn2=(1120, 360),
            )
            tick_system.start_game(lobby_code)
            logger.info(f"Started tick system for game {lobby_code}")

            self.game_service.start_game(lobby["id"])

            # Fetch player skins for both players
            player_skins = await self._get_player_skins([lobby["host_id"], lobby["opponent_id"]])
            logger.info(f"Player skins for game: {player_skins}")

            await self.manager.broadcast_to_lobby(
                lobby_code,
                build_game_start(
                    total_questions=len(session.questions),
                    players=lobby["players"],
                    player1_id=lobby["host_id"],
                    player2_id=lobby["opponent_id"],
                    player_skins=player_skins,
                    category=lobby.get("game_mode", "fortnite"),
                    map_slug=lobby.get("map_slug", "simple-arena"),
                )
            )

            await asyncio.sleep(1)
            await self.quiz_handler.send_question(lobby_code, lobby["id"])

        except Exception as e:
            logger.error(f"Error starting game: {e}")
            await self.manager.broadcast_to_lobby(lobby_code, build_error("START_FAILED", str(e)))

    async def handle_ready(self, lobby_code: str, user_id: str) -> None:
        """Handle ready message from player."""
        try:
            lobby = await self.lobby_service.set_player_ready(lobby_code, user_id)
            logger.info(f"[Lobby] Player {user_id} ready in {lobby_code}, can_start: {lobby.get('can_start')}")

            # Enrich players with playercard data before broadcasting
            # Requirements: 1.1 - handle_ready SHALL enrich all players with playercard data
            player_ids = [p["id"] for p in lobby["players"]]
            player_playercards = await self._get_player_playercards(player_ids)
            enriched_players = await self._enrich_players_with_playercards(
                lobby["players"], player_playercards
            )

            # Broadcast to ALL players in lobby (including the one who readied up)
            await self.manager.broadcast_to_lobby(
                lobby_code,
                build_player_ready(
                    player_id=user_id,
                    players=enriched_players,
                    can_start=lobby.get("can_start", False),
                )
            )
            
            # Log how many connections received the broadcast
            conn_count = self.manager.get_lobby_connections(lobby_code)
            logger.info(f"[Lobby] Broadcast player_ready to {conn_count} connections in {lobby_code}")
        except Exception as e:
            logger.error(f"Error handling ready: {e}")
            import traceback
            traceback.print_exc()
            await self.send_error(user_id, "READY_FAILED", str(e))

    async def handle_connect(self, lobby_code: str, user_id: str, display_name: str | None) -> None:
        """Handle new player connection."""
        try:
            # Fetch fresh lobby data (bypass cache to ensure we have latest state)
            lobby = await self.lobby_service.get_lobby(lobby_code, use_cache=False)
            
            logger.info(f"User {user_id} connected to {lobby_code}")

            # Fetch playercards for all players in the lobby
            player_ids = [p["id"] for p in lobby["players"]]
            player_playercards = await self._get_player_playercards(player_ids)
            
            # Enrich players with playercard data
            enriched_players = await self._enrich_players_with_playercards(lobby["players"], player_playercards)

            # Send current lobby state to the connecting user (with playercards)
            await self.manager.send_to_user(
                user_id,
                build_lobby_state(
                    lobby_id=lobby["id"],
                    status=lobby["status"],
                    players=enriched_players,
                    can_start=lobby.get("can_start", False),
                    host_id=lobby["host_id"],
                    category=lobby.get("game_mode", "fortnite"),
                    map_slug=lobby.get("map_slug", "simple-arena"),
                )
            )

            # Notify other players that this user connected (with playercards)
            await self.manager.broadcast_to_lobby(
                lobby_code,
                build_player_joined(
                    player_id=user_id,
                    display_name=display_name,
                    players=enriched_players,
                    can_start=lobby.get("can_start", False),
                ),
                exclude_user_id=user_id,  # Don't send to the connecting user
            )

        except Exception as e:
            logger.error(f"Error handling connect: {e}")
            import traceback
            traceback.print_exc()

    async def handle_disconnect(self, lobby_code: str, user_id: str) -> None:
        """Handle player disconnection."""
        try:
            lobby = await self.get_lobby(lobby_code)

            connected_users = self.manager.get_lobby_users(lobby_code)
            if len(connected_users) == 0:
                tick_system.stop_game(lobby_code)
                logger.info(f"Stopped tick system for {lobby_code} - all players disconnected")

            # Enrich remaining players with playercard data before broadcasting
            # Requirements: 1.3 - handle_disconnect SHALL enrich remaining players with playercard data
            remaining_players = lobby.get("players", [])
            if remaining_players:
                player_ids = [p["id"] for p in remaining_players]
                player_playercards = await self._get_player_playercards(player_ids)
                enriched_players = await self._enrich_players_with_playercards(
                    remaining_players, player_playercards
                )
            else:
                enriched_players = []

            await self.manager.broadcast_to_lobby(
                lobby_code,
                build_player_left(user_id, enriched_players)
            )

        except Exception as e:
            logger.error(f"Error handling disconnect: {e}")
