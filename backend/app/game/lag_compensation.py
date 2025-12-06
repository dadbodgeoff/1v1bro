"""
Lag compensation for hit detection.

Single responsibility: rewind player positions for fair hit detection.
"""

from typing import Optional, Tuple
import time
from app.core.logging import get_logger
from .models import PlayerState, PositionFrame
from .config import LAG_COMP_CONFIG

logger = get_logger("game.lag_comp")


class LagCompensator:
    """Handles position history and lag-compensated hit detection."""
    
    def __init__(self, config=LAG_COMP_CONFIG):
        self.config = config
    
    def record_position(
        self,
        player: PlayerState,
        timestamp: float,
        sequence: int,
    ) -> None:
        """Record current position in history."""
        player.position_history.append(PositionFrame(
            timestamp=timestamp,
            x=player.x,
            y=player.y,
            sequence=sequence,
        ))
    
    def get_position_at_time(
        self,
        player: PlayerState,
        target_time: float,
    ) -> Optional[PositionFrame]:
        """
        Get interpolated position at a specific time.
        
        Clamps to max rewind window.
        """
        if not player.position_history:
            return None
        
        # Clamp to max rewind
        current_time = time.time()
        min_time = current_time - self.config.max_rewind_s
        target_time = max(target_time, min_time)
        
        # Find frames to interpolate
        before: Optional[PositionFrame] = None
        after: Optional[PositionFrame] = None
        
        for frame in player.position_history:
            if frame.timestamp <= target_time:
                before = frame
            else:
                after = frame
                break
        
        # Interpolate if we have both
        if before and after:
            dt = after.timestamp - before.timestamp
            if dt > 0:
                t = min(1.0, max(0.0, (target_time - before.timestamp) / dt))
                return PositionFrame(
                    timestamp=target_time,
                    x=before.x + (after.x - before.x) * t,
                    y=before.y + (after.y - before.y) * t,
                    sequence=before.sequence,
                )
        
        # Return closest (freeze, don't extrapolate)
        return before or after
    
    def check_hit(
        self,
        target: PlayerState,
        shot_position: Tuple[float, float],
        client_timestamp: float,
        hitbox_radius: float = 15.0,
    ) -> Tuple[bool, str]:
        """
        Check if shot hit with lag compensation.
        
        Returns:
            (hit, debug_info)
        """
        current_time = time.time()
        rewind_ms = (current_time - client_timestamp) * 1000
        
        # Clamp rewind
        if rewind_ms > self.config.max_rewind_ms:
            client_timestamp = current_time - self.config.max_rewind_s
            rewind_ms = self.config.max_rewind_ms
        
        # Get historical position
        frame = self.get_position_at_time(target, client_timestamp)
        if frame:
            target_x, target_y = frame.x, frame.y
            debug = f"rewound={rewind_ms:.0f}ms"
        else:
            target_x, target_y = target.x, target.y
            debug = f"no_history,current"
        
        # Check distance
        dx = shot_position[0] - target_x
        dy = shot_position[1] - target_y
        distance = (dx * dx + dy * dy) ** 0.5
        
        hit = distance <= hitbox_radius
        debug += f",dist={distance:.1f},hit={hit}"
        
        return hit, debug
