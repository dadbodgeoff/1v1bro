"""
Survival Run Validator - Enterprise-grade server-side validation
Prevents cheating through replay verification and sanity checks.

Validation Layers:
1. Schema validation (Pydantic) - types, ranges
2. Sanity checks - physically possible values
3. Replay verification - deterministic simulation
4. Statistical anomaly detection - outlier flagging
"""

from dataclasses import dataclass
from enum import Enum
from typing import List, Optional, Tuple
import json
import math


class ValidationResult(Enum):
    """Validation outcome"""
    VALID = "valid"
    SUSPICIOUS = "suspicious"  # Flagged for review but allowed
    REJECTED = "rejected"      # Blocked from leaderboard


@dataclass
class ValidationReport:
    """Detailed validation report"""
    result: ValidationResult
    score_verified: int        # Server-calculated score
    distance_verified: int     # Server-calculated distance
    flags: List[str]           # Warning flags
    rejection_reason: Optional[str] = None
    confidence: float = 1.0    # 0-1, how confident we are in validation


# ============================================
# Game Constants (must match frontend)
# ============================================
BASE_SPEED = 15.0
MAX_SPEED = 40.0
SPEED_INCREASE_RATE = 0.3
LANE_WIDTH = 1.5

# Scoring constants
NEAR_MISS_BASE_SCORE = 25
PERFECT_DODGE_BASE_SCORE = 100
DISTANCE_SCORE_PER_METER = 1

# Thresholds
NEAR_MISS_THRESHOLD = 0.5
PERFECT_DODGE_THRESHOLD = 0.2

# Physics constants
JUMP_VELOCITY = 12.0
GRAVITY = 30.0
SLIDE_DURATION = 0.6

# Validation thresholds
MAX_SCORE_PER_METER = 50          # Impossible to score more than this per meter
MAX_PERFECT_DODGE_RATIO = 0.8     # Can't have >80% perfect dodges
MIN_DURATION_PER_DISTANCE = 0.02  # At max speed, ~25m/s = 0.04s/m minimum
MAX_DURATION_PER_DISTANCE = 0.1   # At base speed, ~15m/s = 0.067s/m
MAX_COMBO_PER_OBSTACLE = 3        # Perfect dodge gives +3 combo max
STATISTICAL_OUTLIER_SIGMA = 3.5   # Flag runs > 3.5 std devs from mean


class SeededRandom:
    """
    Mulberry32 PRNG - Must match frontend implementation exactly
    """
    def __init__(self, seed: int):
        self.state = seed
    
    def next(self) -> float:
        self.state = (self.state + 0x6D2B79F5) & 0xFFFFFFFF
        t = self.state
        t = (t ^ (t >> 15)) & 0xFFFFFFFF
        t = (t * (t | 1)) & 0xFFFFFFFF
        t = (t ^ (t + ((t ^ (t >> 7)) * (t | 61)))) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296
    
    def next_int(self, min_val: int, max_val: int) -> int:
        return int(self.next() * (max_val - min_val + 1)) + min_val


# Input type constants (must match frontend)
INPUT_MOVE_LEFT = 0
INPUT_MOVE_RIGHT = 1
INPUT_JUMP = 2
INPUT_SLIDE = 3


@dataclass
class SimulationState:
    """State during replay simulation"""
    time_ms: float = 0
    distance: float = 0
    speed: float = BASE_SPEED
    player_z: float = 8.0
    player_x: float = 0.0
    player_y: float = 0.0
    target_lane: int = 0
    is_jumping: bool = False
    is_sliding: bool = False
    velocity_y: float = 0.0
    combo: int = 0
    score: int = 0
    near_misses: int = 0
    perfect_dodges: int = 0
    obstacles_cleared: int = 0
    slide_timer: float = 0.0


class SurvivalValidator:
    """
    Enterprise-grade run validation service
    """
    
    def __init__(self, population_stats: Optional[dict] = None):
        """
        Initialize validator with optional population statistics
        for anomaly detection.
        
        Args:
            population_stats: Dict with keys like 'avg_score_per_meter',
                            'std_score_per_meter', etc.
        """
        self.population_stats = population_stats or {}
    
    def validate_run(
        self,
        claimed_distance: int,
        claimed_score: int,
        duration_seconds: float,
        max_speed: float,
        max_combo: int,
        total_near_misses: int,
        perfect_dodges: int,
        obstacles_cleared: int,
        seed: Optional[int],
        ghost_data: Optional[str],
        difficulty_tier: str = "rookie",
    ) -> ValidationReport:
        """
        Full validation pipeline for a survival run.
        
        Returns ValidationReport with result, verified values, and flags.
        """
        flags: List[str] = []
        
        # Layer 1: Sanity checks (fast, catches obvious cheats)
        sanity_result, sanity_flags = self._sanity_checks(
            claimed_distance,
            claimed_score,
            duration_seconds,
            max_speed,
            max_combo,
            total_near_misses,
            perfect_dodges,
            obstacles_cleared,
        )
        flags.extend(sanity_flags)
        
        if sanity_result == ValidationResult.REJECTED:
            return ValidationReport(
                result=ValidationResult.REJECTED,
                score_verified=0,
                distance_verified=0,
                flags=flags,
                rejection_reason="Failed sanity checks",
                confidence=1.0,
            )
        
        # Layer 2: Replay verification (if ghost data provided)
        if ghost_data and seed is not None:
            replay_result, replay_state, replay_flags = self._replay_verify(
                seed, ghost_data, claimed_distance, claimed_score
            )
            flags.extend(replay_flags)
            
            if replay_result == ValidationResult.REJECTED:
                return ValidationReport(
                    result=ValidationResult.REJECTED,
                    score_verified=replay_state.score if replay_state else 0,
                    distance_verified=int(replay_state.distance) if replay_state else 0,
                    flags=flags,
                    rejection_reason="Replay verification failed",
                    confidence=1.0,
                )
            
            # Use server-calculated values
            verified_score = replay_state.score if replay_state else claimed_score
            verified_distance = int(replay_state.distance) if replay_state else claimed_distance
        else:
            # No ghost data - can only do sanity checks
            flags.append("NO_GHOST_DATA")
            verified_score = claimed_score
            verified_distance = claimed_distance
        
        # Layer 3: Statistical anomaly detection
        anomaly_flags = self._check_anomalies(
            verified_distance,
            verified_score,
            duration_seconds,
            max_combo,
        )
        flags.extend(anomaly_flags)
        
        # Determine final result
        if "REJECTED" in str(flags):
            result = ValidationResult.REJECTED
        elif len(flags) > 2 or any("SUSPICIOUS" in f for f in flags):
            result = ValidationResult.SUSPICIOUS
        else:
            result = ValidationResult.VALID
        
        # Calculate confidence based on validation depth
        confidence = 1.0
        if "NO_GHOST_DATA" in flags:
            confidence = 0.6  # Lower confidence without replay
        if anomaly_flags:
            confidence *= 0.8
        
        return ValidationReport(
            result=result,
            score_verified=verified_score,
            distance_verified=verified_distance,
            flags=flags,
            confidence=confidence,
        )
    
    def _sanity_checks(
        self,
        distance: int,
        score: int,
        duration: float,
        max_speed: float,
        max_combo: int,
        near_misses: int,
        perfect_dodges: int,
        obstacles_cleared: int,
    ) -> Tuple[ValidationResult, List[str]]:
        """
        Fast sanity checks for physically impossible values.
        """
        flags: List[str] = []
        
        # Check score per meter ratio
        if distance > 0:
            score_per_meter = score / distance
            if score_per_meter > MAX_SCORE_PER_METER:
                flags.append(f"IMPOSSIBLE_SCORE_RATIO:{score_per_meter:.1f}")
                return ValidationResult.REJECTED, flags
        
        # Check duration vs distance consistency
        if distance > 0 and duration > 0:
            meters_per_second = distance / duration
            if meters_per_second > MAX_SPEED * 1.1:  # 10% tolerance
                flags.append(f"IMPOSSIBLE_SPEED:{meters_per_second:.1f}")
                return ValidationResult.REJECTED, flags
            if meters_per_second < BASE_SPEED * 0.5:  # Very slow is suspicious
                flags.append(f"SUSPICIOUS_SLOW_SPEED:{meters_per_second:.1f}")
        
        # Check max speed claim
        if max_speed > MAX_SPEED * 1.05:  # 5% tolerance for float precision
            flags.append(f"IMPOSSIBLE_MAX_SPEED:{max_speed:.1f}")
            return ValidationResult.REJECTED, flags
        
        # Check perfect dodge ratio
        if obstacles_cleared > 10:  # Need enough data
            perfect_ratio = perfect_dodges / obstacles_cleared
            if perfect_ratio > MAX_PERFECT_DODGE_RATIO:
                flags.append(f"SUSPICIOUS_PERFECT_RATIO:{perfect_ratio:.2f}")
        
        # Check combo vs obstacles relationship
        max_possible_combo = obstacles_cleared * MAX_COMBO_PER_OBSTACLE
        if max_combo > max_possible_combo and obstacles_cleared > 5:
            flags.append(f"IMPOSSIBLE_COMBO:{max_combo}>{max_possible_combo}")
            return ValidationResult.REJECTED, flags
        
        # Check near misses + perfect dodges vs obstacles
        total_dodges = near_misses + perfect_dodges
        if total_dodges > obstacles_cleared * 2:  # Some tolerance for edge cases
            flags.append(f"SUSPICIOUS_DODGE_COUNT:{total_dodges}>{obstacles_cleared}")
        
        return ValidationResult.VALID, flags
    
    def _replay_verify(
        self,
        seed: int,
        ghost_data: str,
        claimed_distance: int,
        claimed_score: int,
    ) -> Tuple[ValidationResult, Optional[SimulationState], List[str]]:
        """
        Replay the run server-side using ghost data and seed.
        Verifies that claimed values match simulation.
        """
        flags: List[str] = []
        
        try:
            # Parse ghost data
            recording = self._parse_ghost_data(ghost_data)
            if not recording:
                flags.append("INVALID_GHOST_FORMAT")
                return ValidationResult.SUSPICIOUS, None, flags
            
            # Verify seed matches
            if recording.get("s") != seed:
                flags.append("SEED_MISMATCH")
                return ValidationResult.REJECTED, None, flags
            
            # Run simulation
            final_state = self._simulate_run(seed, recording)
            
            # Compare results with tolerance
            distance_diff = abs(final_state.distance - claimed_distance)
            
            # Allow 5% tolerance for floating point and timing differences
            distance_tolerance = max(10, claimed_distance * 0.05)
            
            if distance_diff > distance_tolerance:
                flags.append(f"DISTANCE_MISMATCH:{claimed_distance}vs{int(final_state.distance)}")
                return ValidationResult.REJECTED, final_state, flags
            
            # Score validation is more complex because we can't fully replay
            # obstacle interactions. We verify:
            # 1. Distance-based score component matches
            # 2. Total score is within reasonable bounds for the distance
            
            # Base score from distance should be close
            base_score_diff = abs(final_state.score - int(claimed_distance * DISTANCE_SCORE_PER_METER))
            
            # Claimed score should be >= base score (can't have less than distance score)
            if claimed_score < final_state.score * 0.8:  # Allow 20% tolerance
                flags.append(f"SCORE_TOO_LOW:{claimed_score}<{final_state.score}")
            
            # Claimed score shouldn't be impossibly high for the distance
            max_reasonable_score = int(claimed_distance * MAX_SCORE_PER_METER)
            if claimed_score > max_reasonable_score:
                flags.append(f"SCORE_TOO_HIGH:{claimed_score}>{max_reasonable_score}")
                return ValidationResult.REJECTED, final_state, flags
            
            # Use claimed score if within bounds (we trust combo/near-miss scoring)
            # but cap at reasonable maximum
            final_state.score = min(claimed_score, max_reasonable_score)
            
            return ValidationResult.VALID, final_state, flags
            
        except Exception as e:
            flags.append(f"REPLAY_ERROR:{str(e)[:50]}")
            return ValidationResult.SUSPICIOUS, None, flags
    
    def _parse_ghost_data(self, ghost_data: str) -> Optional[dict]:
        """Parse compressed ghost data JSON"""
        try:
            return json.loads(ghost_data)
        except json.JSONDecodeError:
            return None
    
    def _simulate_run(self, seed: int, recording: dict) -> SimulationState:
        """
        Deterministic simulation of a run.
        Uses same physics and obstacle generation as frontend.
        
        Note: This is a simplified simulation that calculates distance-based score.
        Full obstacle collision/near-miss scoring would require full obstacle
        generation replay, which is computationally expensive.
        """
        state = SimulationState()
        rng = SeededRandom(seed)
        
        events = recording.get("e", [])
        duration_ms = recording.get("d", 0)
        
        # Reconstruct absolute timestamps from deltas
        absolute_time = 0
        processed_events = []
        for event in events:
            absolute_time += event.get("t", 0)
            processed_events.append({
                "t": absolute_time,
                "i": event.get("i"),
                "p": event.get("p"),
            })
        
        # Simulation loop at 60Hz
        dt = 1.0 / 60.0
        event_index = 0
        score_accumulator = 0.0  # Use float for precision
        
        while state.time_ms < duration_ms:
            # Process inputs at this timestamp
            while (event_index < len(processed_events) and 
                   processed_events[event_index]["t"] <= state.time_ms):
                self._process_input(state, processed_events[event_index])
                event_index += 1
            
            # Update physics
            self._update_physics(state, dt)
            
            # Update speed
            state.speed = min(
                state.speed + SPEED_INCREASE_RATE * dt,
                MAX_SPEED
            )
            
            # Move forward
            move_amount = state.speed * dt
            state.player_z -= move_amount
            state.distance += move_amount
            
            # Base distance score (accumulate fractional amounts)
            score_accumulator += move_amount * DISTANCE_SCORE_PER_METER
            
            # Update lane position
            target_x = state.target_lane * LANE_WIDTH
            lane_diff = target_x - state.player_x
            if abs(lane_diff) > 0.01:
                state.player_x += lane_diff * min(1.0, 8.0 * dt)
            
            # Update slide timer
            if state.is_sliding:
                state.slide_timer -= dt
                if state.slide_timer <= 0:
                    state.is_sliding = False
            
            state.time_ms += dt * 1000
        
        # Convert accumulated score to int
        state.score = int(score_accumulator)
        
        return state
    
    def _process_input(self, state: SimulationState, event: dict) -> None:
        """Process a single input event"""
        input_type = event.get("i")
        
        if input_type == INPUT_MOVE_LEFT:
            if state.target_lane > -1:
                state.target_lane -= 1
        elif input_type == INPUT_MOVE_RIGHT:
            if state.target_lane < 1:
                state.target_lane += 1
        elif input_type == INPUT_JUMP:
            if state.player_y <= 0.01 and not state.is_jumping:
                state.is_jumping = True
                state.velocity_y = JUMP_VELOCITY
        elif input_type == INPUT_SLIDE:
            if not state.is_sliding and not state.is_jumping:
                state.is_sliding = True
                state.slide_timer = SLIDE_DURATION
    
    def _update_physics(self, state: SimulationState, dt: float) -> None:
        """Update physics simulation"""
        if state.is_jumping or state.player_y > 0:
            state.velocity_y -= GRAVITY * dt
            state.player_y += state.velocity_y * dt
            
            if state.player_y <= 0:
                state.player_y = 0
                state.velocity_y = 0
                state.is_jumping = False
    
    def _check_anomalies(
        self,
        distance: int,
        score: int,
        duration: float,
        max_combo: int,
    ) -> List[str]:
        """
        Statistical anomaly detection using population data.
        """
        flags: List[str] = []
        
        if not self.population_stats:
            return flags
        
        # Check if score per meter is statistical outlier
        avg_spm = self.population_stats.get("avg_score_per_meter", 10)
        std_spm = self.population_stats.get("std_score_per_meter", 5)
        
        if distance > 100 and std_spm > 0:
            actual_spm = score / distance
            z_score = (actual_spm - avg_spm) / std_spm
            
            if z_score > STATISTICAL_OUTLIER_SIGMA:
                flags.append(f"STATISTICAL_OUTLIER_SCORE:z={z_score:.1f}")
        
        # Check if distance is statistical outlier
        avg_dist = self.population_stats.get("avg_distance", 500)
        std_dist = self.population_stats.get("std_distance", 300)
        
        if std_dist > 0:
            z_score = (distance - avg_dist) / std_dist
            if z_score > STATISTICAL_OUTLIER_SIGMA:
                flags.append(f"STATISTICAL_OUTLIER_DISTANCE:z={z_score:.1f}")
        
        return flags
    
    def update_population_stats(self, stats: dict) -> None:
        """Update population statistics for anomaly detection"""
        self.population_stats = stats
