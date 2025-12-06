"""
Game systems module.

Contains authoritative game logic for competitive multiplayer.

Architecture:
- config.py: All tunable parameters
- models.py: Data structures
- validation.py: Input validation and anti-cheat
- lag_compensation.py: Position history and hit detection
- tick_system.py: Orchestrator (60Hz game loop)
"""

from .config import TICK_CONFIG, MOVEMENT_CONFIG, LAG_COMP_CONFIG, ANTI_CHEAT_CONFIG
from .models import GameState, PlayerState, PlayerInput, PositionFrame, ViolationType
from .validation import InputValidator
from .lag_compensation import LagCompensator
from .tick_system import TickSystem, tick_system

__all__ = [
    # Config
    "TICK_CONFIG",
    "MOVEMENT_CONFIG",
    "LAG_COMP_CONFIG",
    "ANTI_CHEAT_CONFIG",
    # Models
    "GameState",
    "PlayerState",
    "PlayerInput",
    "PositionFrame",
    "ViolationType",
    # Services
    "InputValidator",
    "LagCompensator",
    "TickSystem",
    "tick_system",
]
