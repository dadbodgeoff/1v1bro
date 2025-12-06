"""
Game service - Re-exports from game package.

DEPRECATED: Import from app.services.game instead.
This file exists for backwards compatibility.
"""

from app.services.game import (
    GameService,
    SessionManager,
    GameSession,
    PlayerGameState,
    ScoringService,
    GamePersistenceService,
)

__all__ = [
    "GameService",
    "SessionManager",
    "GameSession",
    "PlayerGameState",
    "ScoringService",
    "GamePersistenceService",
]
