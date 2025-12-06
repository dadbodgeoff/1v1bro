"""
Server-Side Arena Systems - Re-exports from refactored arena package.

This file maintains backwards compatibility.
The actual implementation is in ./arena/

Module structure:
- arena/types.py (~100 lines) - Enums and data classes
- arena/hazards.py (~150 lines) - Damage zones, slow fields, EMP
- arena/traps.py (~220 lines) - Pressure, timed, projectile traps
- arena/transport.py (~150 lines) - Teleporters, jump pads
- arena/systems.py (~150 lines) - Main coordinator
"""

from app.game.arena import (
    # Types
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
    # Managers
    HazardManager,
    TrapManager,
    TransportManager,
    # Main system
    ServerArenaSystems,
)

__all__ = [
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
    "HazardManager",
    "TrapManager",
    "TransportManager",
    "ServerArenaSystems",
]
