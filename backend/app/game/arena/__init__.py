"""
Arena Systems Package

Server-authoritative arena mechanics split into focused modules:
- types: Enums and data classes
- hazards: Damage zones, slow fields, EMP
- traps: Pressure, timed, projectile traps
- transport: Teleporters, jump pads
- doors: Dynamic doors/gates
- platforms: Moving platforms
- barriers: Barriers and destructibles
- powerups: Power-up spawning and collection
- systems: Main coordinator (ServerArenaSystems)
"""

from .types import (
    HazardType,
    TrapType,
    TrapState,
    TrapEffect,
    Bounds,
    ServerHazard,
    ServerTrap,
    ServerTeleporter,
    ServerJumpPad,
    ArenaEvent,
)
from .hazards import HazardManager
from .traps import TrapManager
from .transport import TransportManager
from .doors import DoorState, DoorTrigger, ServerDoor, DoorManager
from .platforms import MovementType, ServerPlatform, PlatformManager
from .barriers import BarrierType, ServerBarrier, BarrierManager, DamageResult
from .powerups import PowerUpType, ServerPowerUp, PowerUpManager, PowerUpCollectionResult
from .systems import ServerArenaSystems

__all__ = [
    # Types
    "HazardType",
    "TrapType",
    "TrapState",
    "TrapEffect",
    "Bounds",
    "ServerHazard",
    "ServerTrap",
    "ServerTeleporter",
    "ServerJumpPad",
    "ArenaEvent",
    # Door types
    "DoorState",
    "DoorTrigger",
    "ServerDoor",
    # Platform types
    "MovementType",
    "ServerPlatform",
    # Barrier types
    "BarrierType",
    "ServerBarrier",
    "DamageResult",
    # Power-up types
    "PowerUpType",
    "ServerPowerUp",
    "PowerUpCollectionResult",
    # Managers
    "HazardManager",
    "TrapManager",
    "TransportManager",
    "DoorManager",
    "PlatformManager",
    "BarrierManager",
    "PowerUpManager",
    # Main system
    "ServerArenaSystems",
]
