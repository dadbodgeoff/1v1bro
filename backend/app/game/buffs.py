"""
Buff System - Server-authoritative combat modifiers.

Handles temporary buffs/debuffs from quiz answers and power-ups.
All buff effects are applied server-side for anti-cheat.
"""

import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional


class BuffType(Enum):
    """Types of combat buffs."""
    DAMAGE_BOOST = "damage_boost"      # +% damage dealt
    SPEED_BOOST = "speed_boost"        # +% movement speed
    VULNERABILITY = "vulnerability"     # +% damage taken
    SHIELD = "shield"                  # Flat damage absorption
    INVULNERABLE = "invulnerable"      # No damage taken


@dataclass
class Buff:
    """Single active buff instance."""
    buff_type: BuffType
    value: float              # Percentage or flat value
    expires_at: float         # Unix timestamp
    source: str               # "quiz_correct", "quiz_fast", "powerup", etc.
    
    def is_expired(self, current_time: float) -> bool:
        return current_time >= self.expires_at
    
    def time_remaining(self, current_time: float) -> float:
        return max(0, self.expires_at - current_time)


@dataclass
class PlayerBuffState:
    """All active buffs for a player."""
    player_id: str
    buffs: List[Buff] = field(default_factory=list)
    
    def add_buff(self, buff: Buff) -> None:
        """Add a buff, replacing existing of same type."""
        self.buffs = [b for b in self.buffs if b.buff_type != buff.buff_type]
        self.buffs.append(buff)
    
    def remove_expired(self, current_time: float) -> List[Buff]:
        """Remove expired buffs, return list of removed."""
        expired = [b for b in self.buffs if b.is_expired(current_time)]
        self.buffs = [b for b in self.buffs if not b.is_expired(current_time)]
        return expired
    
    def get_buff(self, buff_type: BuffType) -> Optional[Buff]:
        """Get active buff of type, if any."""
        for buff in self.buffs:
            if buff.buff_type == buff_type:
                return buff
        return None
    
    def has_buff(self, buff_type: BuffType) -> bool:
        return self.get_buff(buff_type) is not None


class BuffManager:
    """
    Manages all player buffs server-side.
    
    Integrates with combat system for damage/speed modifiers.
    """
    
    def __init__(self):
        self._players: Dict[str, PlayerBuffState] = {}
    
    def init_player(self, player_id: str) -> None:
        """Initialize buff tracking for a player."""
        self._players[player_id] = PlayerBuffState(player_id=player_id)
    
    def apply_buff(
        self,
        player_id: str,
        buff_type: BuffType,
        value: float,
        duration_s: float,
        source: str,
    ) -> Optional[Buff]:
        """Apply a buff to a player."""
        state = self._players.get(player_id)
        if not state:
            return None
        
        buff = Buff(
            buff_type=buff_type,
            value=value,
            expires_at=time.time() + duration_s,
            source=source,
        )
        state.add_buff(buff)
        return buff
    
    def update(self, current_time: float) -> Dict[str, List[Buff]]:
        """Update all buffs, return dict of expired buffs by player."""
        expired_by_player: Dict[str, List[Buff]] = {}
        for player_id, state in self._players.items():
            expired = state.remove_expired(current_time)
            if expired:
                expired_by_player[player_id] = expired
        return expired_by_player
    
    def get_damage_multiplier(self, player_id: str) -> float:
        """Get damage dealt multiplier (1.0 = normal)."""
        state = self._players.get(player_id)
        if not state:
            return 1.0
        
        buff = state.get_buff(BuffType.DAMAGE_BOOST)
        return 1.0 + (buff.value if buff else 0.0)
    
    def get_damage_taken_multiplier(self, player_id: str) -> float:
        """Get damage taken multiplier (1.0 = normal)."""
        state = self._players.get(player_id)
        if not state:
            return 1.0
        
        # Check invulnerability first
        if state.has_buff(BuffType.INVULNERABLE):
            return 0.0
        
        buff = state.get_buff(BuffType.VULNERABILITY)
        return 1.0 + (buff.value if buff else 0.0)
    
    def get_speed_multiplier(self, player_id: str) -> float:
        """Get movement speed multiplier (1.0 = normal)."""
        state = self._players.get(player_id)
        if not state:
            return 1.0
        
        buff = state.get_buff(BuffType.SPEED_BOOST)
        return 1.0 + (buff.value if buff else 0.0)
    
    def get_active_buffs(self, player_id: str) -> List[Buff]:
        """Get all active buffs for a player."""
        state = self._players.get(player_id)
        return state.buffs if state else []
    
    def get_buff_state_for_broadcast(self) -> Dict[str, List[dict]]:
        """Get buff state formatted for client broadcast."""
        current_time = time.time()
        result = {}
        for player_id, state in self._players.items():
            result[player_id] = [
                {
                    "type": b.buff_type.value,
                    "value": b.value,
                    "remaining": b.time_remaining(current_time),
                    "source": b.source,
                }
                for b in state.buffs
            ]
        return result
    
    def clear_player(self, player_id: str) -> None:
        """Clear all buffs for a player (on death/respawn)."""
        if player_id in self._players:
            self._players[player_id].buffs = []
    
    def reset(self) -> None:
        """Reset all buff state."""
        self._players.clear()
