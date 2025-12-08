"""
Server-Side Power-Up Manager - Server-authoritative power-up spawning and collection.

Power-ups:
- SOS: Skip question
- Time Steal: Steal time from opponent
- Shield: Damage absorption
- Double Points: 2x points for correct answer
"""

import math
from enum import Enum
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from .types import ArenaEvent


class PowerUpType(str, Enum):
    """Types of power-ups."""
    SOS = "sos"
    TIME_STEAL = "time_steal"
    SHIELD = "shield"
    DOUBLE_POINTS = "double_points"


@dataclass
class PowerUpCollectionResult:
    """Result of collecting a power-up."""
    powerup_id: str
    powerup_type: PowerUpType
    player_id: str
    position: Tuple[float, float]


@dataclass
class ServerPowerUp:
    """Server-side power-up instance."""
    id: str
    x: float
    y: float
    powerup_type: PowerUpType
    radius: float
    is_active: bool = True
    spawn_time: float = 0


class PowerUpManager:
    """
    Server-authoritative power-up management.
    
    Handles power-up spawning, collection validation, and state sync.
    """
    
    DEFAULT_RADIUS = 30.0
    
    def __init__(self):
        self.powerups: Dict[str, ServerPowerUp] = {}
        self._events: List[ArenaEvent] = []
    
    def spawn(
        self,
        id: str,
        x: float,
        y: float,
        powerup_type: str,
        radius: float = DEFAULT_RADIUS,
        spawn_time: float = 0,
    ) -> Optional[ServerPowerUp]:
        """
        Spawn a power-up at the given position.
        
        Returns the spawned power-up or None if invalid type.
        """
        try:
            ptype = PowerUpType(powerup_type)
        except ValueError:
            return None
        
        powerup = ServerPowerUp(
            id=id,
            x=x,
            y=y,
            powerup_type=ptype,
            radius=radius,
            is_active=True,
            spawn_time=spawn_time,
        )
        self.powerups[id] = powerup
        
        self._events.append(ArenaEvent(
            event_type="powerup_spawn",
            data={
                "id": id,
                "x": x,
                "y": y,
                "type": powerup_type,
                "radius": radius,
            },
        ))
        
        return powerup
    
    def check_collection(
        self,
        player_id: str,
        position: Tuple[float, float],
    ) -> Optional[PowerUpCollectionResult]:
        """
        Check if player can collect any power-up.
        
        Returns collection result if player is within collection radius,
        None otherwise.
        """
        px, py = position
        
        for powerup in self.powerups.values():
            if not powerup.is_active:
                continue
            
            # Calculate distance from player to power-up center
            dx = px - powerup.x
            dy = py - powerup.y
            distance = math.sqrt(dx * dx + dy * dy)
            
            if distance <= powerup.radius:
                # Collect the power-up
                powerup.is_active = False
                
                result = PowerUpCollectionResult(
                    powerup_id=powerup.id,
                    powerup_type=powerup.powerup_type,
                    player_id=player_id,
                    position=(powerup.x, powerup.y),
                )
                
                self._events.append(ArenaEvent(
                    event_type="powerup_collected",
                    data={
                        "id": powerup.id,
                        "type": powerup.powerup_type.value,
                        "player_id": player_id,
                        "x": powerup.x,
                        "y": powerup.y,
                    },
                ))
                
                return result
        
        return None
    
    def remove(self, id: str) -> None:
        """Remove a power-up."""
        if id in self.powerups:
            del self.powerups[id]
            self._events.append(ArenaEvent(
                event_type="powerup_removed",
                data={"id": id},
            ))
    
    def get_powerup(self, id: str) -> Optional[ServerPowerUp]:
        """Get a power-up by ID."""
        return self.powerups.get(id)
    
    def get_active_powerups(self) -> List[ServerPowerUp]:
        """Get all active power-ups."""
        return [p for p in self.powerups.values() if p.is_active]
    
    def get_state(self) -> List[dict]:
        """Get current power-up state for broadcast."""
        return [
            {
                "id": p.id,
                "x": p.x,
                "y": p.y,
                "type": p.powerup_type.value,
                "radius": p.radius,
                "is_active": p.is_active,
            }
            for p in self.powerups.values()
        ]
    
    def get_and_clear_events(self) -> List[ArenaEvent] :
        """Get and clear pending events."""
        events = self._events.copy()
        self._events.clear()
        return events
    
    def clear(self) -> None:
        """Clear all power-ups."""
        self.powerups.clear()
        self._events.clear()
