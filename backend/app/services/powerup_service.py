"""
Power-up service.
Handles power-up spawning, collection, and effects.
"""

import random
import uuid
from typing import Dict, List, Optional
from dataclasses import dataclass, field

from app.schemas.ws_messages import PowerUpType


# Map spawn points (x, y coordinates)
SPAWN_POINTS = [
    (200, 200), (600, 200), (1000, 200),
    (200, 400), (600, 400), (1000, 400),
    (200, 600), (600, 600), (1000, 600),
]

# Power-up weights (probability distribution)
POWERUP_WEIGHTS = {
    PowerUpType.SOS: 0.35,
    PowerUpType.TIME_STEAL: 0.30,
    PowerUpType.SHIELD: 0.20,
    PowerUpType.DOUBLE_POINTS: 0.15,
}


@dataclass
class MapPowerUp:
    """A power-up on the map."""
    id: str
    type: PowerUpType
    x: float
    y: float
    collected: bool = False


class PowerUpService:
    """Service for power-up management."""
    
    def __init__(self):
        self.active_powerups: Dict[str, List[MapPowerUp]] = {}  # lobby_id -> powerups
    
    def initialize_for_lobby(self, lobby_id: str) -> List[MapPowerUp]:
        """
        Initialize power-ups for a new game.
        Spawns 3-5 power-ups at random spawn points.
        """
        count = random.randint(3, 5)
        spawn_points = random.sample(SPAWN_POINTS, count)
        
        powerups = []
        for x, y in spawn_points:
            powerup = MapPowerUp(
                id=str(uuid.uuid4()),
                type=self._random_type(),
                x=float(x),
                y=float(y),
            )
            powerups.append(powerup)
        
        self.active_powerups[lobby_id] = powerups
        return powerups
    
    def _random_type(self) -> PowerUpType:
        """Select a random power-up type based on weights."""
        types = list(POWERUP_WEIGHTS.keys())
        weights = list(POWERUP_WEIGHTS.values())
        return random.choices(types, weights=weights, k=1)[0]
    
    def get_powerups(self, lobby_id: str) -> List[MapPowerUp]:
        """Get all active (uncollected) power-ups for a lobby."""
        return [p for p in self.active_powerups.get(lobby_id, []) if not p.collected]
    
    def get_all_powerups(self, lobby_id: str) -> List[MapPowerUp]:
        """Get all power-ups for a lobby (including collected)."""
        return self.active_powerups.get(lobby_id, [])
    
    def collect_powerup(
        self,
        lobby_id: str,
        powerup_id: str,
        player_inventory: List[str],
    ) -> Optional[MapPowerUp]:
        """
        Attempt to collect a power-up.
        Returns the power-up if successful, None if already collected or inventory full.
        """
        if len(player_inventory) >= 3:
            return None  # Inventory full
        
        powerups = self.active_powerups.get(lobby_id, [])
        for powerup in powerups:
            if powerup.id == powerup_id and not powerup.collected:
                powerup.collected = True
                return powerup
        
        return None
    
    def spawn_new_powerup(self, lobby_id: str) -> Optional[MapPowerUp]:
        """
        Spawn a new power-up at a random unoccupied spawn point.
        Called periodically during the game.
        """
        existing = self.active_powerups.get(lobby_id, [])
        occupied = {(p.x, p.y) for p in existing if not p.collected}
        
        available = [sp for sp in SPAWN_POINTS if sp not in occupied]
        if not available:
            return None
        
        x, y = random.choice(available)
        powerup = MapPowerUp(
            id=str(uuid.uuid4()),
            type=self._random_type(),
            x=float(x),
            y=float(y),
        )
        
        if lobby_id not in self.active_powerups:
            self.active_powerups[lobby_id] = []
        self.active_powerups[lobby_id].append(powerup)
        
        return powerup
    
    def apply_sos(self, correct_answer: str, options: List[str]) -> List[str]:
        """
        Apply SOS power-up: eliminate 2 wrong answers.
        Returns list of eliminated option letters.
        """
        wrong_options = [
            chr(ord('A') + i) 
            for i, _ in enumerate(options) 
            if chr(ord('A') + i) != correct_answer
        ]
        return random.sample(wrong_options, min(2, len(wrong_options)))
    
    def cleanup_lobby(self, lobby_id: str) -> None:
        """Clean up power-ups when game ends."""
        if lobby_id in self.active_powerups:
            del self.active_powerups[lobby_id]


# Singleton instance
powerup_service = PowerUpService()
