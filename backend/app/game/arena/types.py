"""
Arena system types - Enums and data classes.
"""

import time
from dataclasses import dataclass, field
from typing import Dict, Optional, Tuple, Set
from enum import Enum


class HazardType(str, Enum):
    DAMAGE = "damage"
    SLOW = "slow"
    EMP = "emp"


class TrapType(str, Enum):
    PRESSURE = "pressure"
    TIMED = "timed"
    PROJECTILE = "projectile"


class TrapState(str, Enum):
    ARMED = "armed"
    WARNING = "warning"
    TRIGGERED = "triggered"
    COOLDOWN = "cooldown"


class TrapEffect(str, Enum):
    DAMAGE = "damage"
    STUN = "stun"
    KNOCKBACK = "knockback"


@dataclass
class Bounds:
    x: float
    y: float
    width: float
    height: float

    def contains(self, px: float, py: float) -> bool:
        return (self.x <= px <= self.x + self.width and
                self.y <= py <= self.y + self.height)


@dataclass
class ServerHazard:
    """Server-side hazard state."""
    id: str
    type: HazardType
    bounds: Bounds
    intensity: float
    is_active: bool = True
    players_inside: Set[str] = field(default_factory=set)
    spawn_time: float = field(default_factory=time.time)
    despawn_time: Optional[float] = None


@dataclass
class ServerTrap:
    """Server-side trap state."""
    id: str
    type: TrapType
    position: Tuple[float, float]
    radius: float
    effect: TrapEffect
    effect_value: float
    cooldown: float
    state: TrapState = TrapState.ARMED
    cooldown_remaining: float = 0.0
    last_trigger_time: float = 0.0
    interval: Optional[float] = None
    chain_radius: Optional[float] = None
    spawn_time: float = field(default_factory=time.time)
    despawn_time: Optional[float] = None


@dataclass
class ServerTeleporter:
    """Server-side teleporter state."""
    id: str
    pair_id: str
    position: Tuple[float, float]
    radius: float
    linked_id: Optional[str] = None
    player_cooldowns: Dict[str, float] = field(default_factory=dict)


@dataclass
class ServerJumpPad:
    """Server-side jump pad state."""
    id: str
    position: Tuple[float, float]
    radius: float
    direction: Tuple[float, float]
    force: float
    player_cooldowns: Dict[str, float] = field(default_factory=dict)


@dataclass
class ArenaEvent:
    """Arena event to broadcast to clients."""
    event_type: str
    data: dict
    timestamp: float = field(default_factory=time.time)
