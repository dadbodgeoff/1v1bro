"""
WebSocket Handlers Package

Organized by domain:
- quiz: Question/answer handling
- combat: Fire, damage, kills
- arena: Hazards, traps, transport
- lobby: Join, leave, ready
- telemetry: Replay upload/flagging
- matchmaking: Queue join/leave
- emote: Emote triggering and broadcasting
"""

from .base import BaseHandler
from .router import GameHandler
from .emote import EmoteHandler

__all__ = ["BaseHandler", "GameHandler", "EmoteHandler"]
