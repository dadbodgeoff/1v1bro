"""
Server-Side Dynamic Spawn Manager

Controls random spawning of hazards and traps with server authority.
Ensures both clients see the same spawns at the same time.
"""

import time
import random
import math
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Set
from .arena_systems import HazardType, TrapType, TrapEffect


@dataclass
class SpawnConfig:
    """Configuration for dynamic spawning."""
    # Hazard spawn settings
    hazard_spawn_interval: float = 15.0  # seconds between hazard spawns
    hazard_lifetime: float = 20.0  # how long hazards last
    max_hazards: int = 3
    hazard_types: List[HazardType] = field(default_factory=lambda: [HazardType.DAMAGE, HazardType.SLOW])
    
    # Trap spawn settings
    trap_spawn_interval: float = 10.0  # seconds between trap spawns
    trap_lifetime: float = 30.0  # how long traps last
    max_traps: int = 4
    trap_types: List[TrapType] = field(default_factory=lambda: [TrapType.PRESSURE, TrapType.TIMED])
    
    # Arena bounds
    arena_width: float = 1280
    arena_height: float = 720
    spawn_margin: float = 100  # margin from edges


@dataclass
class ExclusionZone:
    """Area where spawns are not allowed."""
    x: float
    y: float
    radius: float


class ServerDynamicSpawnManager:
    """
    Server-authoritative dynamic spawn manager.
    
    Controls when and where hazards/traps spawn, ensuring
    both clients see identical spawns.
    """
    
    def __init__(self, config: Optional[SpawnConfig] = None):
        self.config = config or SpawnConfig()
        self._exclusion_zones: List[ExclusionZone] = []
        self._last_hazard_spawn: float = 0
        self._last_trap_spawn: float = 0
        self._active_hazard_count: int = 0
        self._active_trap_count: int = 0
        self._next_id: int = 0
        self._initialized: bool = False
    
    def initialize(self, exclusion_zones: List[Dict]) -> None:
        """Initialize with exclusion zones (teleporters, spawn points, etc)."""
        self._exclusion_zones = [
            ExclusionZone(z["x"], z["y"], z["radius"])
            for z in exclusion_zones
        ]
        self._last_hazard_spawn = time.time()
        self._last_trap_spawn = time.time()
        self._active_hazard_count = 0
        self._active_trap_count = 0
        self._initialized = True
    
    def update(self, current_time: float) -> Dict:
        """
        Check if new spawns should occur.
        
        Returns dict with:
        - new_hazards: List of hazard configs to spawn
        - new_traps: List of trap configs to spawn
        """
        if not self._initialized:
            return {"new_hazards": [], "new_traps": []}
        
        result = {"new_hazards": [], "new_traps": []}
        
        # Check hazard spawn
        if (current_time - self._last_hazard_spawn >= self.config.hazard_spawn_interval and
            self._active_hazard_count < self.config.max_hazards):
            hazard = self._spawn_hazard(current_time)
            if hazard:
                result["new_hazards"].append(hazard)
                self._last_hazard_spawn = current_time
                self._active_hazard_count += 1
        
        # Check trap spawn
        if (current_time - self._last_trap_spawn >= self.config.trap_spawn_interval and
            self._active_trap_count < self.config.max_traps):
            trap = self._spawn_trap(current_time)
            if trap:
                result["new_traps"].append(trap)
                self._last_trap_spawn = current_time
                self._active_trap_count += 1
        
        return result
    
    def on_hazard_despawn(self) -> None:
        """Called when a hazard despawns."""
        self._active_hazard_count = max(0, self._active_hazard_count - 1)
    
    def on_trap_despawn(self) -> None:
        """Called when a trap despawns."""
        self._active_trap_count = max(0, self._active_trap_count - 1)
    
    def _spawn_hazard(self, current_time: float) -> Optional[Dict]:
        """Generate a random hazard spawn."""
        position = self._find_valid_position(80)  # hazard size
        if not position:
            return None
        
        self._next_id += 1
        hazard_type = random.choice(self.config.hazard_types)
        
        # Random size
        width = random.randint(60, 120)
        height = random.randint(60, 120)
        
        return {
            "id": f"dyn_hazard_{self._next_id}",
            "type": hazard_type.value,
            "bounds": {
                "x": position[0] - width / 2,
                "y": position[1] - height / 2,
                "width": width,
                "height": height,
            },
            "intensity": random.uniform(0.5, 1.5),
            "despawn_time": current_time + self.config.hazard_lifetime,
        }
    
    def _spawn_trap(self, current_time: float) -> Optional[Dict]:
        """Generate a random trap spawn."""
        position = self._find_valid_position(40)  # trap radius
        if not position:
            return None
        
        self._next_id += 1
        trap_type = random.choice(self.config.trap_types)
        
        # Effect based on type
        if trap_type == TrapType.PRESSURE:
            effect = random.choice([TrapEffect.DAMAGE, TrapEffect.STUN, TrapEffect.KNOCKBACK])
        else:
            effect = TrapEffect.DAMAGE
        
        return {
            "id": f"dyn_trap_{self._next_id}",
            "type": trap_type.value,
            "position": {"x": position[0], "y": position[1]},
            "radius": random.randint(25, 40),
            "effect": effect.value,
            "effectValue": random.randint(10, 25),
            "cooldown": random.uniform(3.0, 6.0),
            "interval": random.uniform(4.0, 8.0) if trap_type == TrapType.TIMED else None,
            "despawn_time": current_time + self.config.trap_lifetime,
        }
    
    def _find_valid_position(self, min_distance: float, max_attempts: int = 20) -> Optional[Tuple[float, float]]:
        """Find a valid spawn position avoiding exclusion zones."""
        cfg = self.config
        
        for _ in range(max_attempts):
            x = random.uniform(cfg.spawn_margin, cfg.arena_width - cfg.spawn_margin)
            y = random.uniform(cfg.spawn_margin, cfg.arena_height - cfg.spawn_margin)
            
            # Check exclusion zones
            valid = True
            for zone in self._exclusion_zones:
                dx = x - zone.x
                dy = y - zone.y
                dist = math.sqrt(dx * dx + dy * dy)
                if dist < zone.radius + min_distance:
                    valid = False
                    break
            
            if valid:
                return (x, y)
        
        return None
    
    def reset(self) -> None:
        """Reset spawn manager state."""
        self._last_hazard_spawn = 0
        self._last_trap_spawn = 0
        self._active_hazard_count = 0
        self._active_trap_count = 0
        self._next_id = 0
        self._initialized = False
