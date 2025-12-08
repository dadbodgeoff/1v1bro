"""
Arena-related WebSocket handlers.
"""

import time
from app.core.logging import get_logger
from app.game import tick_system
from app.game.models import PlayerInput
from .base import BaseHandler

logger = get_logger("websocket.handlers.arena")


class ArenaHandler(BaseHandler):
    """Handles arena events (position, hazards, traps, transport)."""

    async def handle_position_update(self, lobby_code: str, user_id: str, payload: dict) -> None:
        """Handle player position update with tick system integration."""
        x = payload.get("x", 0)
        y = payload.get("y", 0)
        dx = payload.get("dx", 0)
        dy = payload.get("dy", 0)
        seq = payload.get("seq", 0)

        lobby = await self.get_lobby(lobby_code)
        lobby_id = lobby["id"]

        # Queue input for tick system
        player_input = PlayerInput(
            player_id=user_id,
            x=x,
            y=y,
            direction_x=dx,
            direction_y=dy,
            sequence=seq,
            client_timestamp=time.time(),
        )
        tick_system.queue_input(lobby_code, player_input)

        # Update game service state
        session = self.game_service.get_session(lobby_id)
        if session and user_id in session.player_states:
            session.player_states[user_id].position_x = x
            session.player_states[user_id].position_y = y

        # Broadcast to other players
        from app.websocket.events import WSEventType
        await self.manager.broadcast_to_lobby(
            lobby_code,
            {
                "type": WSEventType.POSITION_UPDATE.value,
                "payload": {"player_id": user_id, "x": x, "y": y}
            },
            exclude_user_id=user_id,
        )

    async def handle_arena_init(self, lobby_code: str, user_id: str, payload: dict) -> None:
        """Handle arena config initialization from host client."""
        lobby = await self.get_lobby(lobby_code)
        if lobby["host_id"] != user_id:
            return

        arena_config = payload.get("config", {})
        if arena_config:
            tick_system.init_arena_config(lobby_code, arena_config)
            logger.info(f"Initialized arena config for {lobby_code}")

    async def broadcast_arena_state(self, lobby_code: str) -> None:
        """
        Broadcast full arena state to all clients in lobby.
        
        SERVER AUTHORITY: Send authoritative arena state.
        Requirements: 5.1, 5.4
        """
        from app.websocket.events import build_arena_state
        
        arena_state = tick_system.get_arena_state(lobby_code)
        if not arena_state:
            return
        
        # Get buff state from tick system
        buff_state = tick_system.get_buff_state(lobby_code)
        
        message = build_arena_state(
            hazards=arena_state.get("hazards", []),
            traps=arena_state.get("traps", []),
            doors=arena_state.get("doors", []),
            platforms=arena_state.get("platforms", []),
            barriers=arena_state.get("barriers", []),
            powerups=arena_state.get("powerups", []),
            buffs=buff_state,
        )
        
        await self.manager.broadcast_to_lobby(lobby_code, message)

    async def broadcast_arena_events(self, lobby_code: str, events: list) -> None:
        """
        Broadcast arena events to all clients in lobby.
        
        SERVER AUTHORITY: Send individual arena events.
        Requirements: 5.1, 5.2
        """
        from app.websocket.events import build_arena_event
        
        for event in events:
            message = build_arena_event(
                event_type=event.event_type,
                data=event.data,
            )
            await self.manager.broadcast_to_lobby(lobby_code, message)
