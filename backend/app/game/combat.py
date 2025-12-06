"""
Server-Side Combat System

Handles authoritative combat state:
- Projectile tracking and physics
- Hit detection with lag compensation
- Health management
- Death/respawn logic
- Buff-modified damage calculations
"""

import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, TYPE_CHECKING
from collections import deque
import math

if TYPE_CHECKING:
    from .buffs import BuffManager


@dataclass
class ServerProjectile:
    """Server-side projectile state."""
    id: str
    owner_id: str
    x: float
    y: float
    vx: float
    vy: float
    spawn_x: float
    spawn_y: float
    spawn_time: float
    damage: int = 10
    
    def distance_traveled(self) -> float:
        dx = self.x - self.spawn_x
        dy = self.y - self.spawn_y
        return math.sqrt(dx * dx + dy * dy)


@dataclass
class PlayerCombatState:
    """Combat state for a player."""
    player_id: str
    health: int = 100
    max_health: int = 100
    is_dead: bool = False
    respawn_time: Optional[float] = None
    invulnerable_until: Optional[float] = None
    last_fire_time: float = 0.0
    

@dataclass
class CombatEvent:
    """Combat event to broadcast to clients."""
    event_type: str  # 'fire', 'hit', 'death', 'respawn'
    data: dict
    timestamp: float = field(default_factory=time.time)


class ServerCombatSystem:
    """
    Server-authoritative combat system.
    
    Processes fire inputs, simulates projectiles, detects hits,
    and broadcasts authoritative combat state.
    """
    
    # Combat config
    PROJECTILE_SPEED = 800.0  # pixels per second
    PROJECTILE_MAX_RANGE = 600.0
    FIRE_COOLDOWN = 0.25  # seconds between shots
    HIT_RADIUS = 25.0  # collision radius
    RESPAWN_TIME = 3.0  # seconds
    INVULNERABILITY_TIME = 2.0  # seconds after respawn
    
    # Arena bounds
    ARENA_WIDTH = 1280
    ARENA_HEIGHT = 720
    
    # Barriers (same as frontend)
    BARRIERS = [
        {"x": 200, "y": 200, "width": 80, "height": 80},
        {"x": 1000, "y": 200, "width": 80, "height": 80},
        {"x": 200, "y": 440, "width": 80, "height": 80},
        {"x": 1000, "y": 440, "width": 80, "height": 80},
        {"x": 590, "y": 310, "width": 100, "height": 100},
    ]
    
    # Spawn points
    SPAWN_POINTS = [
        (160, 360),
        (1120, 360),
        (640, 100),
        (640, 620),
    ]
    
    def __init__(self, buff_manager: Optional["BuffManager"] = None):
        self._projectiles: Dict[str, ServerProjectile] = {}
        self._combat_states: Dict[str, PlayerCombatState] = {}
        self._pending_events: List[CombatEvent] = []
        self._next_projectile_id = 0
        self._buff_manager: Optional["BuffManager"] = buff_manager
    
    def set_buff_manager(self, buff_manager: "BuffManager") -> None:
        """Set the buff manager for damage modifiers."""
        self._buff_manager = buff_manager
    
    def init_player(self, player_id: str) -> None:
        """Initialize combat state for a player."""
        self._combat_states[player_id] = PlayerCombatState(player_id=player_id)
    
    def process_fire(
        self,
        player_id: str,
        position: Tuple[float, float],
        direction: Tuple[float, float],
        client_timestamp: float,
    ) -> Optional[str]:
        """
        Process a fire request from a player.
        Returns projectile ID if successful, None if rejected.
        """
        state = self._combat_states.get(player_id)
        if not state:
            return None
        
        # Check if player can fire
        current_time = time.time()
        if state.is_dead:
            return None
        if current_time - state.last_fire_time < self.FIRE_COOLDOWN:
            return None
        
        # Normalize direction
        dx, dy = direction
        length = math.sqrt(dx * dx + dy * dy)
        if length < 0.001:
            return None
        dx, dy = dx / length, dy / length
        
        # Create projectile
        proj_id = f"p_{player_id}_{self._next_projectile_id}"
        self._next_projectile_id += 1
        
        projectile = ServerProjectile(
            id=proj_id,
            owner_id=player_id,
            x=position[0],
            y=position[1],
            vx=dx * self.PROJECTILE_SPEED,
            vy=dy * self.PROJECTILE_SPEED,
            spawn_x=position[0],
            spawn_y=position[1],
            spawn_time=current_time,
        )
        
        self._projectiles[proj_id] = projectile
        state.last_fire_time = current_time
        
        # Queue fire event for broadcast
        self._pending_events.append(CombatEvent(
            event_type='fire',
            data={
                'projectile_id': proj_id,
                'owner_id': player_id,
                'x': position[0],
                'y': position[1],
                'vx': projectile.vx,
                'vy': projectile.vy,
            }
        ))
        
        return proj_id
    
    def update(self, delta_time: float, player_positions: Dict[str, Tuple[float, float]]) -> None:
        """
        Update combat simulation for one tick.
        
        Args:
            delta_time: Time since last tick in seconds
            player_positions: Current positions of all players
        """
        current_time = time.time()
        
        # Update projectiles
        projectiles_to_remove = []
        
        for proj_id, proj in self._projectiles.items():
            # Move projectile
            proj.x += proj.vx * delta_time
            proj.y += proj.vy * delta_time
            
            # Check max range
            if proj.distance_traveled() >= self.PROJECTILE_MAX_RANGE:
                projectiles_to_remove.append(proj_id)
                continue
            
            # Check arena bounds
            if proj.x < 0 or proj.x > self.ARENA_WIDTH or proj.y < 0 or proj.y > self.ARENA_HEIGHT:
                projectiles_to_remove.append(proj_id)
                continue
            
            # Check barrier collision
            if self._check_barrier_collision(proj.x, proj.y):
                projectiles_to_remove.append(proj_id)
                continue
            
            # Check player hits
            for player_id, (px, py) in player_positions.items():
                # Skip self-hits
                if player_id == proj.owner_id:
                    continue
                
                state = self._combat_states.get(player_id)
                if not state or state.is_dead:
                    continue
                
                # Check invulnerability
                if state.invulnerable_until and current_time < state.invulnerable_until:
                    continue
                
                # Check collision
                dx = proj.x - px
                dy = proj.y - py
                dist = math.sqrt(dx * dx + dy * dy)
                
                if dist <= self.HIT_RADIUS:
                    # Hit!
                    self._apply_damage(player_id, proj.owner_id, proj.damage, current_time)
                    projectiles_to_remove.append(proj_id)
                    break
        
        # Remove destroyed projectiles
        for proj_id in projectiles_to_remove:
            self._projectiles.pop(proj_id, None)
        
        # Check respawns
        for player_id, state in self._combat_states.items():
            if state.is_dead and state.respawn_time and current_time >= state.respawn_time:
                self._respawn_player(player_id, player_positions, current_time)
    
    def _check_barrier_collision(self, x: float, y: float) -> bool:
        """Check if position collides with any barrier."""
        for barrier in self.BARRIERS:
            if (barrier["x"] <= x <= barrier["x"] + barrier["width"] and
                barrier["y"] <= y <= barrier["y"] + barrier["height"]):
                return True
        return False
    
    def _apply_damage(
        self,
        target_id: str,
        shooter_id: str,
        base_damage: int,
        current_time: float,
    ) -> None:
        """Apply damage to a player with buff modifiers."""
        state = self._combat_states.get(target_id)
        if not state:
            return
        
        # Apply buff modifiers
        damage = base_damage
        if self._buff_manager:
            # Shooter's damage boost
            damage_mult = self._buff_manager.get_damage_multiplier(shooter_id)
            # Target's vulnerability
            taken_mult = self._buff_manager.get_damage_taken_multiplier(target_id)
            damage = int(base_damage * damage_mult * taken_mult)
        
        state.health = max(0, state.health - damage)
        
        # Queue hit event (include actual damage dealt for client feedback)
        self._pending_events.append(CombatEvent(
            event_type='hit',
            data={
                'target_id': target_id,
                'shooter_id': shooter_id,
                'damage': damage,
                'base_damage': base_damage,
                'health_remaining': state.health,
            }
        ))
        
        # Check for death
        if state.health <= 0:
            state.is_dead = True
            state.respawn_time = current_time + self.RESPAWN_TIME
            
            self._pending_events.append(CombatEvent(
                event_type='death',
                data={
                    'victim_id': target_id,
                    'killer_id': shooter_id,
                }
            ))
    
    def _respawn_player(
        self,
        player_id: str,
        player_positions: Dict[str, Tuple[float, float]],
        current_time: float,
    ) -> None:
        """Respawn a dead player at a safe location."""
        state = self._combat_states.get(player_id)
        if not state:
            return
        
        # Find spawn point furthest from enemies
        best_spawn = self.SPAWN_POINTS[0]
        best_min_dist = 0
        
        for spawn in self.SPAWN_POINTS:
            min_dist = float('inf')
            for pid, (px, py) in player_positions.items():
                if pid == player_id:
                    continue
                dx = spawn[0] - px
                dy = spawn[1] - py
                dist = math.sqrt(dx * dx + dy * dy)
                min_dist = min(min_dist, dist)
            
            if min_dist > best_min_dist:
                best_min_dist = min_dist
                best_spawn = spawn
        
        # Reset state
        state.health = state.max_health
        state.is_dead = False
        state.respawn_time = None
        state.invulnerable_until = current_time + self.INVULNERABILITY_TIME
        
        self._pending_events.append(CombatEvent(
            event_type='respawn',
            data={
                'player_id': player_id,
                'x': best_spawn[0],
                'y': best_spawn[1],
                'invulnerable_until': state.invulnerable_until,
            }
        ))
    
    def get_and_clear_events(self) -> List[CombatEvent]:
        """Get pending events and clear the queue."""
        events = self._pending_events
        self._pending_events = []
        return events
    
    def get_combat_state(self) -> dict:
        """Get current combat state for broadcast."""
        return {
            'projectiles': [
                {
                    'id': p.id,
                    'owner_id': p.owner_id,
                    'x': round(p.x, 1),
                    'y': round(p.y, 1),
                    'vx': round(p.vx, 1),
                    'vy': round(p.vy, 1),
                }
                for p in self._projectiles.values()
            ],
            'players': {
                pid: {
                    'health': s.health,
                    'max_health': s.max_health,
                    'is_dead': s.is_dead,
                    'invulnerable': s.invulnerable_until is not None and time.time() < s.invulnerable_until,
                }
                for pid, s in self._combat_states.items()
            }
        }
    
    def get_player_health(self, player_id: str) -> Optional[int]:
        """Get a player's current health."""
        state = self._combat_states.get(player_id)
        return state.health if state else None
    
    def is_player_dead(self, player_id: str) -> bool:
        """Check if a player is dead."""
        state = self._combat_states.get(player_id)
        return state.is_dead if state else False
    
    def reset(self) -> None:
        """Reset all combat state."""
        self._projectiles.clear()
        self._combat_states.clear()
        self._pending_events.clear()
        self._next_projectile_id = 0
