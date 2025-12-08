"""
Server-Side Moving Platform System - Server-authoritative platform management.

Platforms follow waypoint paths and can carry players.
"""

import math
from enum import Enum
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from .types import ArenaEvent


class MovementType(str, Enum):
    """Platform movement patterns."""
    LINEAR = "linear"
    SINE_WAVE = "sine_wave"
    CIRCULAR = "circular"
    PINGPONG = "pingpong"


@dataclass
class Waypoint:
    """A point in the platform's path."""
    x: float
    y: float


@dataclass
class ServerPlatform:
    """Server-side moving platform instance."""
    id: str
    width: float
    height: float
    waypoints: List[Waypoint]
    speed: float  # units per second
    movement_type: MovementType
    loop: bool = True
    pause_at_waypoints: float = 0  # seconds
    
    # Runtime state
    x: float = 0
    y: float = 0
    current_waypoint: int = 0
    progress: float = 0.0  # 0-1 between waypoints
    direction: int = 1  # 1 or -1 for pingpong
    pause_timer: float = 0
    velocity_x: float = 0
    velocity_y: float = 0
    
    def __post_init__(self):
        if self.waypoints:
            self.x = self.waypoints[0].x
            self.y = self.waypoints[0].y



class PlatformManager:
    """
    Server-authoritative moving platform management.
    
    Handles platform movement, player riding, and state sync.
    """
    
    def __init__(self):
        self.platforms: Dict[str, ServerPlatform] = {}
        self._events: List[ArenaEvent] = []
    
    def add(
        self,
        id: str,
        width: float,
        height: float,
        waypoints: List[Dict[str, float]],
        speed: float,
        movement_type: str = "linear",
        loop: bool = True,
        pause_at_waypoints: float = 0,
    ) -> None:
        """Add a platform to the system."""
        wp_list = [Waypoint(x=wp["x"], y=wp["y"]) for wp in waypoints]
        
        platform = ServerPlatform(
            id=id,
            width=width,
            height=height,
            waypoints=wp_list,
            speed=speed,
            movement_type=MovementType(movement_type),
            loop=loop,
            pause_at_waypoints=pause_at_waypoints,
        )
        self.platforms[id] = platform
    
    def remove(self, id: str) -> None:
        """Remove a platform."""
        self.platforms.pop(id, None)
    
    def update(self, delta_time: float) -> None:
        """Update all platforms for one tick."""
        for platform in self.platforms.values():
            self._update_platform(platform, delta_time)
    
    def _update_platform(self, platform: ServerPlatform, delta_time: float) -> None:
        """Update a single platform."""
        # Handle pause at waypoints
        if platform.pause_timer > 0:
            platform.pause_timer -= delta_time
            platform.velocity_x = 0
            platform.velocity_y = 0
            return
        
        waypoints = platform.waypoints
        if len(waypoints) < 2:
            return
        
        # Get current and next waypoint
        current_idx = platform.current_waypoint
        
        if platform.movement_type == MovementType.PINGPONG:
            next_idx = current_idx + platform.direction
            if next_idx < 0 or next_idx >= len(waypoints):
                platform.direction *= -1
                next_idx = current_idx + platform.direction
        else:
            next_idx = (current_idx + 1) % len(waypoints)
        
        start = waypoints[current_idx]
        end = waypoints[next_idx]
        
        # Calculate distance and travel time
        dx = end.x - start.x
        dy = end.y - start.y
        distance = math.sqrt(dx * dx + dy * dy)
        travel_time = distance / platform.speed if platform.speed > 0 else 1
        
        # Update progress
        platform.progress += delta_time / travel_time
        
        # Apply movement type easing
        eased_progress = platform.progress
        if platform.movement_type == MovementType.SINE_WAVE:
            eased_progress = (1 - math.cos(platform.progress * math.pi)) / 2
        
        # Calculate new position
        prev_x, prev_y = platform.x, platform.y
        platform.x = start.x + dx * eased_progress
        platform.y = start.y + dy * eased_progress
        
        # Calculate velocity for player movement
        if delta_time > 0:
            platform.velocity_x = (platform.x - prev_x) / delta_time
            platform.velocity_y = (platform.y - prev_y) / delta_time
        
        # Check if reached waypoint
        if platform.progress >= 1.0:
            platform.progress = 0
            platform.current_waypoint = next_idx
            platform.pause_timer = platform.pause_at_waypoints
            
            self._events.append(ArenaEvent(
                type="platform_waypoint",
                data={"platform_id": platform.id, "waypoint": next_idx},
            ))
            
            # Check for loop completion
            if next_idx == 0 and platform.loop:
                self._events.append(ArenaEvent(
                    type="platform_loop",
                    data={"platform_id": platform.id},
                ))

    
    def check_player_on_platform(
        self, player_x: float, player_y: float, player_radius: float
    ) -> Optional[Tuple[str, float, float]]:
        """
        Check if player is standing on any platform.
        
        Returns (platform_id, velocity_x, velocity_y) if on platform, None otherwise.
        """
        for platform in self.platforms.values():
            # Check if player's feet are on the platform
            # Player center is at (player_x, player_y), feet at bottom
            feet_y = player_y + player_radius
            
            # Platform top surface
            platform_top = platform.y
            platform_bottom = platform.y + platform.height
            platform_left = platform.x
            platform_right = platform.x + platform.width
            
            # Check if player is horizontally within platform bounds
            if player_x < platform_left or player_x > platform_right:
                continue
            
            # Check if player's feet are near platform top (within small tolerance)
            tolerance = 5.0
            if abs(feet_y - platform_top) < tolerance:
                return (platform.id, platform.velocity_x, platform.velocity_y)
        
        return None
    
    def get_platform_velocity(self, platform_id: str) -> Tuple[float, float]:
        """Get velocity of a specific platform."""
        platform = self.platforms.get(platform_id)
        if platform:
            return (platform.velocity_x, platform.velocity_y)
        return (0, 0)
    
    def get_state(self) -> List[dict]:
        """Get current platform state for broadcast."""
        return [
            {
                "id": p.id,
                "x": p.x,
                "y": p.y,
                "current_waypoint": p.current_waypoint,
                "progress": p.progress,
                "velocity_x": p.velocity_x,
                "velocity_y": p.velocity_y,
            }
            for p in self.platforms.values()
        ]
    
    def get_and_clear_events(self) -> List[ArenaEvent]:
        """Get and clear pending events."""
        events = self._events.copy()
        self._events.clear()
        return events
    
    def clear(self) -> None:
        """Clear all platforms."""
        self.platforms.clear()
        self._events.clear()
