"""
Combat tracker utility.
Tracks combat events during a game session for stats aggregation.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional
import time


def get_timestamp_ms() -> int:
    """Get current timestamp in milliseconds."""
    return int(time.time() * 1000)


@dataclass
class CombatEvent:
    """Base combat event."""
    timestamp: int
    player_id: str


@dataclass
class KillEvent(CombatEvent):
    """Player killed another player."""
    victim_id: str
    weapon: str = "projectile"


@dataclass
class DamageEvent(CombatEvent):
    """Player dealt damage."""
    target_id: str
    amount: int
    source: str  # "projectile", "trap", "hazard"


@dataclass
class ShotEvent(CombatEvent):
    """Player fired a shot."""
    hit: bool


@dataclass
class PowerupEvent(CombatEvent):
    """Player collected a powerup."""
    powerup_type: str


@dataclass
class PlayerCombatData:
    """Combat data for a single player."""
    events: List[CombatEvent] = field(default_factory=list)
    powerups_collected: int = 0


class CombatTracker:
    """
    Tracks combat events during a game session.
    
    This is a singleton-style class with class methods for global access.
    Data is stored per-lobby and cleaned up when games end.
    """
    
    # lobby_id -> player_id -> PlayerCombatData
    _sessions: Dict[str, Dict[str, PlayerCombatData]] = {}

    @classmethod
    def initialize(cls, lobby_id: str, player_ids: List[str]) -> None:
        """
        Initialize tracking for a new game.
        
        Args:
            lobby_id: Lobby UUID
            player_ids: List of player UUIDs in the game
        """
        cls._sessions[lobby_id] = {
            pid: PlayerCombatData() for pid in player_ids
        }

    @classmethod
    def record_kill(
        cls,
        lobby_id: str,
        killer_id: str,
        victim_id: str,
        weapon: str = "projectile",
    ) -> None:
        """Record a kill event."""
        if lobby_id not in cls._sessions:
            return
        if killer_id not in cls._sessions[lobby_id]:
            return
        
        cls._sessions[lobby_id][killer_id].events.append(
            KillEvent(
                timestamp=get_timestamp_ms(),
                player_id=killer_id,
                victim_id=victim_id,
                weapon=weapon,
            )
        )

    @classmethod
    def record_damage(
        cls,
        lobby_id: str,
        dealer_id: str,
        target_id: str,
        amount: int,
        source: str = "projectile",
    ) -> None:
        """Record damage dealt."""
        if lobby_id not in cls._sessions:
            return
        if dealer_id not in cls._sessions[lobby_id]:
            return
        
        cls._sessions[lobby_id][dealer_id].events.append(
            DamageEvent(
                timestamp=get_timestamp_ms(),
                player_id=dealer_id,
                target_id=target_id,
                amount=amount,
                source=source,
            )
        )

    @classmethod
    def record_shot(cls, lobby_id: str, player_id: str, hit: bool) -> None:
        """Record a shot fired."""
        if lobby_id not in cls._sessions:
            return
        if player_id not in cls._sessions[lobby_id]:
            return
        
        cls._sessions[lobby_id][player_id].events.append(
            ShotEvent(
                timestamp=get_timestamp_ms(),
                player_id=player_id,
                hit=hit,
            )
        )

    @classmethod
    def record_powerup(cls, lobby_id: str, player_id: str, powerup_type: str) -> None:
        """Record a powerup collection."""
        if lobby_id not in cls._sessions:
            return
        if player_id not in cls._sessions[lobby_id]:
            return
        
        cls._sessions[lobby_id][player_id].powerups_collected += 1
        cls._sessions[lobby_id][player_id].events.append(
            PowerupEvent(
                timestamp=get_timestamp_ms(),
                player_id=player_id,
                powerup_type=powerup_type,
            )
        )

    @classmethod
    def get_summary(cls, lobby_id: str, player_id: str) -> dict:
        """
        Get combat summary for a player in a game.
        
        Args:
            lobby_id: Lobby UUID
            player_id: Player UUID
            
        Returns:
            Dict with kills, deaths, damage_dealt, damage_taken, etc.
        """
        if lobby_id not in cls._sessions:
            return cls._empty_summary()
        if player_id not in cls._sessions[lobby_id]:
            return cls._empty_summary()
        
        data = cls._sessions[lobby_id][player_id]
        events = data.events
        
        kills = sum(1 for e in events if isinstance(e, KillEvent))
        damage_dealt = sum(e.amount for e in events if isinstance(e, DamageEvent))
        shots_fired = sum(1 for e in events if isinstance(e, ShotEvent))
        shots_hit = sum(1 for e in events if isinstance(e, ShotEvent) and e.hit)
        
        # Deaths are counted from other players' kill events
        deaths = 0
        damage_taken = 0
        for pid, pdata in cls._sessions[lobby_id].items():
            if pid != player_id:
                for e in pdata.events:
                    if isinstance(e, KillEvent) and e.victim_id == player_id:
                        deaths += 1
                    if isinstance(e, DamageEvent) and e.target_id == player_id:
                        damage_taken += e.amount
        
        return {
            "kills": kills,
            "deaths": deaths,
            "damage_dealt": damage_dealt,
            "damage_taken": damage_taken,
            "shots_fired": shots_fired,
            "shots_hit": shots_hit,
            "powerups_collected": data.powerups_collected,
        }

    @classmethod
    def _empty_summary(cls) -> dict:
        """Return empty combat summary."""
        return {
            "kills": 0,
            "deaths": 0,
            "damage_dealt": 0,
            "damage_taken": 0,
            "shots_fired": 0,
            "shots_hit": 0,
            "powerups_collected": 0,
        }

    @classmethod
    def cleanup(cls, lobby_id: str) -> None:
        """Clean up tracking data for a completed game."""
        cls._sessions.pop(lobby_id, None)

    @classmethod
    def clear_all(cls) -> None:
        """Clear all tracking data (for testing)."""
        cls._sessions.clear()
