"""
Game system data models.

Pure data classes with no business logic.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional
from collections import deque
from enum import Enum
import time


class ViolationType(Enum):
    """Types of anti-cheat violations."""
    TELEPORT = "teleport"
    SPEED = "speed"
    SEQUENCE = "sequence"


@dataclass
class Violation:
    """Record of a single violation."""
    type: ViolationType
    timestamp: float
    details: str


@dataclass
class PositionFrame:
    """Single frame of position history."""
    timestamp: float
    x: float
    y: float
    sequence: int


@dataclass
class PlayerInput:
    """Input received from client."""
    player_id: str
    x: float
    y: float
    direction_x: float = 0.0
    direction_y: float = 0.0
    sequence: int = 0
    client_timestamp: float = 0.0


@dataclass
class FireInput:
    """Fire input received from client."""
    player_id: str
    direction_x: float
    direction_y: float
    sequence: int = 0
    client_timestamp: float = 0.0


@dataclass
class PlayerState:
    """Server-authoritative state for a player."""
    player_id: str
    x: float = 0.0
    y: float = 0.0
    velocity_x: float = 0.0
    velocity_y: float = 0.0
    last_input_sequence: int = 0
    last_input_tick: int = 0
    
    # Position history (set maxlen via config)
    position_history: deque = field(default_factory=deque)
    
    # Anti-cheat
    violations: List[Violation] = field(default_factory=list)
    violation_count: int = 0
    last_decay_tick: int = 0
    is_kicked: bool = False
    
    # Recovery
    last_valid_position: tuple = (0.0, 0.0)


@dataclass
class GameState:
    """Complete game state for a lobby."""
    lobby_id: str
    players: Dict[str, PlayerState] = field(default_factory=dict)
    tick_count: int = 0
    start_time: float = field(default_factory=time.time)
    is_running: bool = False
    pending_inputs: List[PlayerInput] = field(default_factory=list)
    pending_fire_inputs: List["FireInput"] = field(default_factory=list)
    combat_system: Optional["ServerCombatSystem"] = None  # type: ignore
    arena_systems: Optional["ServerArenaSystems"] = None  # type: ignore
    dynamic_spawns: Optional["ServerDynamicSpawnManager"] = None  # type: ignore
    buff_manager: Optional["BuffManager"] = None  # type: ignore


# Import at end to avoid circular imports
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from .combat import ServerCombatSystem
    from .arena_systems import ServerArenaSystems
    from .dynamic_spawns import ServerDynamicSpawnManager
    from .buffs import BuffManager
