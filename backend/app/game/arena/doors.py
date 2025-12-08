"""
Server-Side Door System - Server-authoritative door/gate management.

Doors can be triggered by:
- Pressure plates (linked by trigger_id)
- Trivia completion
- Timers
- Manual server commands
"""

import time
from enum import Enum
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from .types import ArenaEvent


class DoorState(str, Enum):
    """Door state machine states."""
    OPEN = "open"
    CLOSED = "closed"
    OPENING = "opening"
    CLOSING = "closing"


class DoorTrigger(str, Enum):
    """What triggers the door."""
    PRESSURE_PLATE = "pressure_plate"
    TRIVIA = "trivia"
    TIMER = "timer"
    MANUAL = "manual"


@dataclass
class ServerDoor:
    """Server-side door instance."""
    id: str
    x: float
    y: float
    width: float
    height: float
    direction: str  # "horizontal" or "vertical"
    trigger: DoorTrigger
    linked_trigger_id: Optional[str] = None
    auto_close_delay: float = 0  # seconds, 0 = stays open
    open_duration: float = 0.5  # seconds for animation
    
    # Runtime state
    state: DoorState = DoorState.CLOSED
    progress: float = 0.0  # 0-1 animation progress
    last_trigger_time: float = 0.0
    is_blocking: bool = True



class DoorManager:
    """
    Server-authoritative door management.
    
    Handles door state, collision, and trigger linking.
    """
    
    def __init__(self):
        self.doors: Dict[str, ServerDoor] = {}
        self.trigger_links: Dict[str, List[str]] = {}  # trigger_id -> door_ids
        self._events: List[ArenaEvent] = []
    
    def add(
        self,
        id: str,
        x: float,
        y: float,
        width: float,
        height: float,
        direction: str = "horizontal",
        trigger: str = "manual",
        linked_trigger_id: Optional[str] = None,
        auto_close_delay: float = 0,
        open_duration: float = 0.5,
    ) -> None:
        """Add a door to the system."""
        door = ServerDoor(
            id=id,
            x=x,
            y=y,
            width=width,
            height=height,
            direction=direction,
            trigger=DoorTrigger(trigger),
            linked_trigger_id=linked_trigger_id,
            auto_close_delay=auto_close_delay,
            open_duration=open_duration,
        )
        self.doors[id] = door
        
        # Link to trigger
        if linked_trigger_id:
            if linked_trigger_id not in self.trigger_links:
                self.trigger_links[linked_trigger_id] = []
            self.trigger_links[linked_trigger_id].append(id)
    
    def remove(self, id: str) -> None:
        """Remove a door."""
        door = self.doors.pop(id, None)
        if door and door.linked_trigger_id:
            links = self.trigger_links.get(door.linked_trigger_id, [])
            if id in links:
                links.remove(id)
    
    def trigger_by_link(self, trigger_id: str, current_time: float) -> None:
        """Trigger all doors linked to a trigger ID."""
        door_ids = self.trigger_links.get(trigger_id, [])
        for door_id in door_ids:
            self.toggle(door_id, current_time)
    
    def toggle(self, door_id: str, current_time: float) -> None:
        """Toggle a door open/closed."""
        door = self.doors.get(door_id)
        if not door:
            return
        
        if door.state in (DoorState.CLOSED, DoorState.CLOSING):
            self.open(door_id, current_time)
        else:
            self.close(door_id, current_time)
    
    def open(self, door_id: str, current_time: float) -> None:
        """Open a door."""
        door = self.doors.get(door_id)
        if not door or door.state in (DoorState.OPEN, DoorState.OPENING):
            return
        
        door.state = DoorState.OPENING
        door.last_trigger_time = current_time
        self._events.append(ArenaEvent(
            event_type="door_opening",
            data={"door_id": door_id},
        ))
    
    def close(self, door_id: str, current_time: float) -> None:
        """Close a door."""
        door = self.doors.get(door_id)
        if not door or door.state in (DoorState.CLOSED, DoorState.CLOSING):
            return
        
        door.state = DoorState.CLOSING
        door.last_trigger_time = current_time
        self._events.append(ArenaEvent(
            event_type="door_closing",
            data={"door_id": door_id},
        ))

    
    def update(self, delta_time: float, current_time: float) -> None:
        """Update all doors for one tick."""
        for door in self.doors.values():
            anim_speed = 1.0 / door.open_duration if door.open_duration > 0 else 10.0
            
            if door.state == DoorState.OPENING:
                door.progress = min(1.0, door.progress + delta_time * anim_speed)
                door.is_blocking = door.progress < 0.8
                
                if door.progress >= 1.0:
                    door.state = DoorState.OPEN
                    door.progress = 1.0
                    door.is_blocking = False
                    self._events.append(ArenaEvent(
                        event_type="door_opened",
                        data={"door_id": door.id},
                    ))
            
            elif door.state == DoorState.CLOSING:
                door.progress = max(0.0, door.progress - delta_time * anim_speed)
                door.is_blocking = door.progress > 0.2
                
                if door.progress <= 0.0:
                    door.state = DoorState.CLOSED
                    door.progress = 0.0
                    door.is_blocking = True
                    self._events.append(ArenaEvent(
                        event_type="door_closed",
                        data={"door_id": door.id},
                    ))
            
            elif door.state == DoorState.OPEN:
                # Auto-close check
                if door.auto_close_delay > 0:
                    if current_time - door.last_trigger_time > door.auto_close_delay:
                        self.close(door.id, current_time)
    
    def check_collision(
        self, x: float, y: float, radius: float
    ) -> Optional[str]:
        """Check if position collides with any blocking door."""
        for door in self.doors.values():
            if not door.is_blocking:
                continue
            
            rect = self._get_door_rect(door)
            
            # AABB vs circle collision
            closest_x = max(rect["x"], min(x, rect["x"] + rect["width"]))
            closest_y = max(rect["y"], min(y, rect["y"] + rect["height"]))
            
            dx = x - closest_x
            dy = y - closest_y
            
            if dx * dx + dy * dy < radius * radius:
                return door.id
        
        return None
    
    def _get_door_rect(self, door: ServerDoor) -> Dict[str, float]:
        """Get current collision rect accounting for animation."""
        if door.direction == "horizontal":
            slide_offset = door.width * door.progress
            return {
                "x": door.x + slide_offset,
                "y": door.y,
                "width": door.width * (1 - door.progress),
                "height": door.height,
            }
        else:
            slide_offset = door.height * door.progress
            return {
                "x": door.x,
                "y": door.y + slide_offset,
                "width": door.width,
                "height": door.height * (1 - door.progress),
            }
    
    def get_state(self) -> List[dict]:
        """Get current door state for broadcast."""
        return [
            {
                "id": d.id,
                "state": d.state.value,
                "progress": d.progress,
                "is_blocking": d.is_blocking,
            }
            for d in self.doors.values()
        ]
    
    def get_and_clear_events(self) -> List[ArenaEvent]:
        """Get and clear pending events."""
        events = self._events.copy()
        self._events.clear()
        return events
    
    def clear(self) -> None:
        """Clear all doors."""
        self.doors.clear()
        self.trigger_links.clear()
        self._events.clear()
