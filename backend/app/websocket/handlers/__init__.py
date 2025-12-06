"""
WebSocket Handlers Package

Organized by domain:
- quiz: Question/answer handling
- combat: Fire, damage, kills
- arena: Hazards, traps, transport
- lobby: Join, leave, ready
- telemetry: Replay upload/flagging
- matchmaking: Queue join/leave
"""

from .base import BaseHandler
from .router import GameHandler

__all__ = ["BaseHandler", "GameHandler"]
