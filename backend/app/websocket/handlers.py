"""
WebSocket handlers - Re-exports from handlers package.

DEPRECATED: Import from app.websocket.handlers package instead.
This file exists for backwards compatibility.
"""

from app.websocket.handlers import GameHandler

__all__ = ["GameHandler"]
