"""
Arena Systems Package

Server-authoritative arena mechanics split into focused modules:
- types: Enums and data classes
- hazards: Damage zones, slow fields, EMP
- traps: Pressure, timed, projectile traps
- transport: Teleporters, jump pads
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
    # Managers
    "HazardManager",
    "TrapManager",
    "TransportManager",
    # Main system
    "ServerArenaSystems",
]
