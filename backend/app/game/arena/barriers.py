"""
Server-Side Barrier Manager - Server-authoritative barrier/destructible management.

Barriers can be:
- Solid: Permanent collision
- Destructible: Can be damaged and destroyed
- Half Wall: Blocks movement but not projectiles
- One Way: Allows passage in one direction only
"""

import math
from enum import Enum
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from .types import ArenaEvent


class BarrierType(str, Enum):
    """Types of barriers."""
    SOLID = "solid"
    DESTRUCTIBLE = "destructible"
    HALF_WALL = "half_wall"
    ONE_WAY = "one_way"


@dataclass
class DamageResult:
    """Result of applying damage to a barrier."""
    health: int
    max_health: int
    destroyed: bool
    damage_applied: int


@dataclass
class ServerBarrier:
    """Server-side barrier instance."""
    id: str
    x: float
    y: float
    width: float
    height: float
    barrier_type: BarrierType
    health: int
    max_health: int
    is_active: bool = True
    direction: Optional[str] = None  # For one-way barriers: 'up', 'down', 'left', 'right'


class BarrierManager:
    """
    Server-authoritative barrier management.
    
    Handles barrier state, collision, damage, and destruction.
    """
    
    def __init__(self):
        self.barriers: Dict[str, ServerBarrier] = {}
        self._events: List[ArenaEvent] = []
    
    def add(
        self,
        id: str,
        x: float,
        y: float,
        width: float,
        height: float,
        barrier_type: str = "solid",
        health: int = 100,
        direction: Optional[str] = None,
    ) -> ServerBarrier:
        """Add a barrier to the system."""
        barrier = ServerBarrier(
            id=id,
            x=x,
            y=y,
            width=width,
            height=height,
            barrier_type=BarrierType(barrier_type),
            health=health,
            max_health=health,
            is_active=True,
            direction=direction,
        )
        self.barriers[id] = barrier
        
        self._events.append(ArenaEvent(
            event_type="barrier_spawn",
            data={
                "id": id,
                "x": x,
                "y": y,
                "width": width,
                "height": height,
                "type": barrier_type,
                "health": health,
                "max_health": health,
                "direction": direction,
            },
        ))
        
        return barrier
    
    def remove(self, id: str) -> None:
        """Remove a barrier."""
        if id in self.barriers:
            del self.barriers[id]
            self._events.append(ArenaEvent(
                event_type="barrier_removed",
                data={"id": id},
            ))
    
    def apply_damage(
        self,
        id: str,
        damage: int,
        source_player_id: Optional[str] = None,
    ) -> Optional[DamageResult]:
        """
        Apply damage to a destructible barrier.
        
        Returns DamageResult or None if barrier not found/not destructible.
        """
        barrier = self.barriers.get(id)
        if not barrier or not barrier.is_active:
            return None
        
        if barrier.barrier_type != BarrierType.DESTRUCTIBLE:
            return None
        
        # Clamp damage to non-negative
        damage = max(0, damage)
        
        old_health = barrier.health
        barrier.health = max(0, barrier.health - damage)
        actual_damage = old_health - barrier.health
        
        destroyed = barrier.health <= 0
        
        # Emit damage event
        self._events.append(ArenaEvent(
            event_type="barrier_damaged",
            data={
                "id": id,
                "damage": actual_damage,
                "health": barrier.health,
                "max_health": barrier.max_health,
                "source_player_id": source_player_id,
            },
        ))
        
        # Handle destruction
        if destroyed:
            barrier.is_active = False
            self._events.append(ArenaEvent(
                event_type="barrier_destroyed",
                data={
                    "id": id,
                    "source_player_id": source_player_id,
                },
            ))
        
        return DamageResult(
            health=barrier.health,
            max_health=barrier.max_health,
            destroyed=destroyed,
            damage_applied=actual_damage,
        )
    
    def check_collision(
        self,
        x: float,
        y: float,
        radius: float,
    ) -> Optional[str]:
        """
        Check if a circle collides with any active barrier.
        
        Returns barrier ID if collision, None otherwise.
        """
        for barrier in self.barriers.values():
            if not barrier.is_active:
                continue
            
            # One-way barriers have special collision logic
            if barrier.barrier_type == BarrierType.ONE_WAY:
                if not self._should_one_way_block(barrier, x, y):
                    continue
            
            if self._circle_rect_collision(x, y, radius, barrier):
                return barrier.id
        
        return None
    
    def check_projectile_collision(
        self,
        x: float,
        y: float,
    ) -> Optional[str]:
        """
        Check if a point collides with any barrier that blocks projectiles.
        
        Half walls don't block projectiles.
        Returns barrier ID if collision, None otherwise.
        """
        for barrier in self.barriers.values():
            if not barrier.is_active:
                continue
            
            # Half walls don't block projectiles
            if barrier.barrier_type == BarrierType.HALF_WALL:
                continue
            
            if self._point_in_rect(x, y, barrier):
                return barrier.id
        
        return None
    
    def _should_one_way_block(
        self,
        barrier: ServerBarrier,
        x: float,
        y: float,
    ) -> bool:
        """Check if one-way barrier should block based on approach direction."""
        if not barrier.direction:
            return True
        
        # Calculate center of barrier
        center_x = barrier.x + barrier.width / 2
        center_y = barrier.y + barrier.height / 2
        
        # Direction from barrier center to position
        dx = x - center_x
        dy = y - center_y
        
        # Block if approaching from the blocked side
        if barrier.direction == "up":
            return dy < 0  # Block from below
        elif barrier.direction == "down":
            return dy > 0  # Block from above
        elif barrier.direction == "left":
            return dx < 0  # Block from right
        elif barrier.direction == "right":
            return dx > 0  # Block from left
        
        return True
    
    def _circle_rect_collision(
        self,
        cx: float,
        cy: float,
        radius: float,
        barrier: ServerBarrier,
    ) -> bool:
        """Check circle-rectangle collision."""
        # Find closest point on rectangle to circle center
        closest_x = max(barrier.x, min(cx, barrier.x + barrier.width))
        closest_y = max(barrier.y, min(cy, barrier.y + barrier.height))
        
        # Calculate distance from circle center to closest point
        dx = cx - closest_x
        dy = cy - closest_y
        
        return (dx * dx + dy * dy) < (radius * radius)
    
    def _point_in_rect(
        self,
        x: float,
        y: float,
        barrier: ServerBarrier,
    ) -> bool:
        """Check if point is inside rectangle."""
        return (barrier.x <= x <= barrier.x + barrier.width and
                barrier.y <= y <= barrier.y + barrier.height)
    
    def get_state(self) -> List[dict]:
        """Get current barrier state for broadcast."""
        return [
            {
                "id": b.id,
                "x": b.x,
                "y": b.y,
                "width": b.width,
                "height": b.height,
                "type": b.barrier_type.value,
                "health": b.health,
                "max_health": b.max_health,
                "is_active": b.is_active,
                "direction": b.direction,
            }
            for b in self.barriers.values()
        ]
    
    def get_and_clear_events(self) -> List[ArenaEvent]:
        """Get and clear pending events."""
        events = self._events.copy()
        self._events.clear()
        return events
    
    def clear(self) -> None:
        """Clear all barriers."""
        self.barriers.clear()
        self._events.clear()
