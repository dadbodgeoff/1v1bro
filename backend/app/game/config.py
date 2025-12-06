"""
Game system configuration.

All tunable parameters in one place for easy adjustment.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class TickConfig:
    """Tick rate configuration."""
    rate_hz: int = 60
    broadcast_divisor: int = 6  # Broadcast every N ticks (60/6 = 10Hz)
    
    @property
    def duration_ms(self) -> float:
        return 1000 / self.rate_hz
    
    @property
    def duration_s(self) -> float:
        return 1.0 / self.rate_hz


@dataclass(frozen=True)
class MovementConfig:
    """Player movement configuration."""
    max_speed_px_per_sec: float = 300
    speed_tolerance: float = 1.5  # Allow 50% over for lag
    max_ticks_between_updates: int = 6
    teleport_threshold_px: float = 500  # Increased to allow initial position sync
    
    def max_distance_per_tick(self, tick_duration_s: float) -> float:
        return self.max_speed_px_per_sec * tick_duration_s * self.speed_tolerance
    
    def max_distance_per_update(self, tick_duration_s: float) -> float:
        return self.max_distance_per_tick(tick_duration_s) * self.max_ticks_between_updates


@dataclass(frozen=True)
class LagCompConfig:
    """Lag compensation configuration."""
    max_rewind_ms: int = 250
    history_duration_s: float = 5.0
    
    @property
    def max_rewind_s(self) -> float:
        return self.max_rewind_ms / 1000
    
    def history_size(self, tick_rate: int) -> int:
        return int(tick_rate * self.history_duration_s)


@dataclass(frozen=True)
class AntiCheatConfig:
    """Anti-cheat violation configuration."""
    enabled: bool = False  # Disabled for now - causing issues with position sync
    warning_threshold: int = 3
    kick_threshold: int = 10
    decay_ticks: int = 600  # Decay 1 violation every 10 seconds at 60Hz
    sequence_tolerance: int = 10  # Allow sequences up to N behind


# Default configurations
TICK_CONFIG = TickConfig()
MOVEMENT_CONFIG = MovementConfig()
LAG_COMP_CONFIG = LagCompConfig()
ANTI_CHEAT_CONFIG = AntiCheatConfig()
