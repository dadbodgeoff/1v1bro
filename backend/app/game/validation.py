"""
Input validation and anti-cheat.

Single responsibility: validate player inputs.
"""

from typing import Tuple
from app.core.logging import get_logger
from .models import GameState, PlayerState, PlayerInput, ViolationType, Violation
from .config import MOVEMENT_CONFIG, ANTI_CHEAT_CONFIG, TICK_CONFIG
import time

logger = get_logger("game.validation")


class InputValidator:
    """Validates player inputs for anti-cheat."""
    
    def __init__(
        self,
        movement_config=MOVEMENT_CONFIG,
        anti_cheat_config=ANTI_CHEAT_CONFIG,
        tick_config=TICK_CONFIG,
    ):
        self.movement = movement_config
        self.anti_cheat = anti_cheat_config
        self.tick = tick_config
        self._max_dist_per_tick = self.movement.max_distance_per_tick(self.tick.duration_s)
    
    def validate(
        self,
        game: GameState,
        player: PlayerState,
        input_data: PlayerInput,
    ) -> Tuple[bool, str]:
        """
        Validate player input.
        
        Returns:
            (is_valid, reason)
        """
        # If anti-cheat is disabled, accept all inputs
        if not self.anti_cheat.enabled:
            return True, "anti_cheat_disabled"
        
        if player.is_kicked:
            return False, "player_kicked"
        
        # Check sequence
        if not self._validate_sequence(player, input_data):
            return False, "sequence_too_old"
        
        # Check teleport
        distance = self._calculate_distance(player, input_data)
        logger.debug(f"[VALIDATE] Player {player.player_id}: current=({player.x}, {player.y}), input=({input_data.x}, {input_data.y}), distance={distance:.1f}")
        if distance > self.movement.teleport_threshold_px:
            self._add_violation(
                player,
                ViolationType.TELEPORT,
                f"dist={distance:.1f}px > {self.movement.teleport_threshold_px}px"
            )
            logger.warning(f"[VALIDATE] TELEPORT detected for {player.player_id}: distance={distance:.1f}px")
            return False, "teleport_detected"
        
        # Check speed (warn but don't reject)
        self._validate_speed(game, player, input_data, distance)
        
        return True, "valid"
    
    def _validate_sequence(self, player: PlayerState, input_data: PlayerInput) -> bool:
        """Check if sequence number is valid."""
        delta = input_data.sequence - player.last_input_sequence
        if delta < -self.anti_cheat.sequence_tolerance:
            self._add_violation(
                player,
                ViolationType.SEQUENCE,
                f"seq={input_data.sequence}, expected>{player.last_input_sequence - self.anti_cheat.sequence_tolerance}"
            )
            return False
        return True
    
    def _calculate_distance(self, player: PlayerState, input_data: PlayerInput) -> float:
        """Calculate distance between current and input position."""
        dx = input_data.x - player.x
        dy = input_data.y - player.y
        return (dx * dx + dy * dy) ** 0.5
    
    def _validate_speed(
        self,
        game: GameState,
        player: PlayerState,
        input_data: PlayerInput,
        distance: float,
    ) -> None:
        """Check speed and add violation if exceeded (doesn't reject)."""
        ticks_since = max(1, min(
            game.tick_count - player.last_input_tick,
            self.movement.max_ticks_between_updates
        ))
        max_distance = self._max_dist_per_tick * ticks_since
        
        if distance > max_distance:
            self._add_violation(
                player,
                ViolationType.SPEED,
                f"dist={distance:.1f}px > max={max_distance:.1f}px (ticks={ticks_since})"
            )
    
    def _add_violation(
        self,
        player: PlayerState,
        vtype: ViolationType,
        details: str,
    ) -> None:
        """Record a violation."""
        player.violations.append(Violation(
            type=vtype,
            timestamp=time.time(),
            details=details,
        ))
        player.violation_count += 1
        
        if player.violation_count == self.anti_cheat.warning_threshold:
            logger.warning(f"Player {player.player_id}: {self.anti_cheat.warning_threshold} violations")
        
        if player.violation_count >= self.anti_cheat.kick_threshold:
            player.is_kicked = True
            logger.error(f"Player {player.player_id} KICKED: {player.violation_count} violations")
    
    def decay_violations(self, player: PlayerState, current_tick: int) -> None:
        """Decay violation count over time."""
        if player.violation_count > 0:
            if current_tick - player.last_decay_tick >= self.anti_cheat.decay_ticks:
                player.violation_count = max(0, player.violation_count - 1)
                player.last_decay_tick = current_tick
