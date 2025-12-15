"""
Tests for SurvivalValidator - Server-side run validation
"""

import pytest
import json
from app.services.survival_validator import (
    SurvivalValidator,
    ValidationResult,
    ValidationReport,
    SeededRandom,
    INPUT_JUMP,
    INPUT_MOVE_LEFT,
    INPUT_MOVE_RIGHT,
    INPUT_SLIDE,
)


class TestSeededRandom:
    """Tests for deterministic random number generator."""
    
    def test_same_seed_same_sequence(self):
        """Same seed should produce identical sequence."""
        rng1 = SeededRandom(12345)
        rng2 = SeededRandom(12345)
        
        for _ in range(100):
            assert rng1.next() == rng2.next()
    
    def test_different_seeds_different_sequence(self):
        """Different seeds should produce different sequences."""
        rng1 = SeededRandom(12345)
        rng2 = SeededRandom(54321)
        
        # Very unlikely to match
        matches = sum(1 for _ in range(100) if rng1.next() == rng2.next())
        assert matches < 5
    
    def test_range_0_to_1(self):
        """Output should be in [0, 1) range."""
        rng = SeededRandom(42)
        
        for _ in range(1000):
            val = rng.next()
            assert 0 <= val < 1
    
    def test_next_int(self):
        """next_int should return integers in range."""
        rng = SeededRandom(42)
        
        for _ in range(100):
            val = rng.next_int(5, 10)
            assert 5 <= val <= 10
            assert isinstance(val, int)


class TestSanityChecks:
    """Tests for sanity check validation."""
    
    @pytest.fixture
    def validator(self):
        return SurvivalValidator()
    
    def test_valid_run_passes(self, validator):
        """Normal run should pass sanity checks."""
        report = validator.validate_run(
            claimed_distance=500,
            claimed_score=2500,
            duration_seconds=30,
            max_speed=25.0,
            max_combo=15,
            total_near_misses=20,
            perfect_dodges=5,
            obstacles_cleared=30,
            seed=None,
            ghost_data=None,
        )
        
        assert report.result != ValidationResult.REJECTED
    
    def test_impossible_score_ratio_rejected(self, validator):
        """Score too high for distance should be rejected."""
        report = validator.validate_run(
            claimed_distance=100,
            claimed_score=100000,  # Way too high
            duration_seconds=10,
            max_speed=20.0,
            max_combo=10,
            total_near_misses=5,
            perfect_dodges=2,
            obstacles_cleared=10,
            seed=None,
            ghost_data=None,
        )
        
        assert report.result == ValidationResult.REJECTED
        assert any("IMPOSSIBLE_SCORE_RATIO" in f for f in report.flags)
    
    def test_impossible_speed_rejected(self, validator):
        """Speed faster than max should be rejected."""
        report = validator.validate_run(
            claimed_distance=1000,
            claimed_score=5000,
            duration_seconds=10,  # 100 m/s - impossible
            max_speed=100.0,
            max_combo=10,
            total_near_misses=5,
            perfect_dodges=2,
            obstacles_cleared=10,
            seed=None,
            ghost_data=None,
        )
        
        assert report.result == ValidationResult.REJECTED
        assert any("IMPOSSIBLE" in f for f in report.flags)
    
    def test_impossible_combo_rejected(self, validator):
        """Combo higher than possible from obstacles should be rejected."""
        report = validator.validate_run(
            claimed_distance=500,
            claimed_score=2500,
            duration_seconds=30,
            max_speed=25.0,
            max_combo=100,  # Way too high for 10 obstacles
            total_near_misses=5,
            perfect_dodges=2,
            obstacles_cleared=10,
            seed=None,
            ghost_data=None,
        )
        
        assert report.result == ValidationResult.REJECTED
        assert any("IMPOSSIBLE_COMBO" in f for f in report.flags)
    
    def test_suspicious_perfect_ratio_flagged(self, validator):
        """Very high perfect dodge ratio should be flagged."""
        report = validator.validate_run(
            claimed_distance=500,
            claimed_score=2500,
            duration_seconds=30,
            max_speed=25.0,
            max_combo=15,
            total_near_misses=2,
            perfect_dodges=48,  # 96% perfect - suspicious
            obstacles_cleared=50,
            seed=None,
            ghost_data=None,
        )
        
        assert any("SUSPICIOUS_PERFECT_RATIO" in f for f in report.flags)


class TestReplayVerification:
    """Tests for ghost data replay verification."""
    
    @pytest.fixture
    def validator(self):
        return SurvivalValidator()
    
    def _create_ghost_data(self, seed: int, events: list, duration_ms: int) -> str:
        """Helper to create ghost data JSON."""
        # Delta encode timestamps
        delta_events = []
        prev_t = 0
        for event in events:
            delta_events.append({
                "t": event["t"] - prev_t,
                "i": event["i"],
            })
            prev_t = event["t"]
        
        return json.dumps({
            "v": 1,
            "s": seed,
            "st": 0,
            "d": duration_ms,
            "e": delta_events,
        })
    
    def test_valid_ghost_data_passes(self, validator):
        """Valid ghost data should verify successfully."""
        seed = 12345
        # Simple run: just move forward for 5 seconds
        # At base speed 15 m/s, should travel ~75-80m
        ghost_data = self._create_ghost_data(seed, [], 5000)
        
        report = validator.validate_run(
            claimed_distance=78,  # ~15 m/s * 5s (with slight speed increase)
            claimed_score=150,    # Distance score + some combo bonus
            duration_seconds=5,
            max_speed=15.5,
            max_combo=5,
            total_near_misses=3,
            perfect_dodges=1,
            obstacles_cleared=5,
            seed=seed,
            ghost_data=ghost_data,
        )
        
        # Should not be rejected (may have small tolerance flags)
        assert report.result != ValidationResult.REJECTED
    
    def test_seed_mismatch_rejected(self, validator):
        """Mismatched seed should be rejected."""
        ghost_data = self._create_ghost_data(12345, [], 5000)
        
        report = validator.validate_run(
            claimed_distance=75,
            claimed_score=75,
            duration_seconds=5,
            max_speed=15.0,
            max_combo=0,
            total_near_misses=0,
            perfect_dodges=0,
            obstacles_cleared=0,
            seed=99999,  # Different seed
            ghost_data=ghost_data,
        )
        
        assert report.result == ValidationResult.REJECTED
        assert any("SEED_MISMATCH" in f for f in report.flags)
    
    def test_invalid_ghost_format_flagged(self, validator):
        """Invalid ghost data format should be flagged."""
        report = validator.validate_run(
            claimed_distance=500,
            claimed_score=2500,
            duration_seconds=30,
            max_speed=25.0,
            max_combo=15,
            total_near_misses=20,
            perfect_dodges=5,
            obstacles_cleared=30,
            seed=12345,
            ghost_data="not valid json {{{",
        )
        
        assert any("INVALID_GHOST_FORMAT" in f for f in report.flags)
    
    def test_distance_mismatch_rejected(self, validator):
        """Large distance mismatch should be rejected."""
        seed = 12345
        ghost_data = self._create_ghost_data(seed, [], 5000)
        
        report = validator.validate_run(
            claimed_distance=10000,  # Way more than 5s of running (~78m actual)
            claimed_score=10000,
            duration_seconds=5,
            max_speed=15.0,
            max_combo=0,
            total_near_misses=0,
            perfect_dodges=0,
            obstacles_cleared=0,
            seed=seed,
            ghost_data=ghost_data,
        )
        
        # Should be rejected - either by distance mismatch or sanity checks
        assert report.result == ValidationResult.REJECTED
        # Could be rejected by sanity check (impossible speed) or replay verification
        has_rejection_flag = (
            any("DISTANCE_MISMATCH" in f for f in report.flags) or
            any("IMPOSSIBLE" in f for f in report.flags)
        )
        assert has_rejection_flag


class TestStatisticalAnomalyDetection:
    """Tests for statistical outlier detection."""
    
    def test_outlier_flagged_with_population_stats(self):
        """Statistical outliers should be flagged when stats available."""
        validator = SurvivalValidator(population_stats={
            "avg_score_per_meter": 5,
            "std_score_per_meter": 2,
            "avg_distance": 300,
            "std_distance": 100,
        })
        
        report = validator.validate_run(
            claimed_distance=2000,  # Very high
            claimed_score=40000,    # 20 per meter - way above avg
            duration_seconds=100,
            max_speed=30.0,
            max_combo=50,
            total_near_misses=100,
            perfect_dodges=30,
            obstacles_cleared=200,
            seed=None,
            ghost_data=None,
        )
        
        assert any("STATISTICAL_OUTLIER" in f for f in report.flags)
    
    def test_normal_run_not_flagged(self):
        """Normal runs should not be flagged as outliers."""
        validator = SurvivalValidator(population_stats={
            "avg_score_per_meter": 5,
            "std_score_per_meter": 2,
            "avg_distance": 300,
            "std_distance": 100,
        })
        
        report = validator.validate_run(
            claimed_distance=350,
            claimed_score=1750,  # 5 per meter - exactly average
            duration_seconds=25,
            max_speed=20.0,
            max_combo=10,
            total_near_misses=15,
            perfect_dodges=5,
            obstacles_cleared=25,
            seed=None,
            ghost_data=None,
        )
        
        assert not any("STATISTICAL_OUTLIER" in f for f in report.flags)


class TestNoGhostData:
    """Tests for runs without ghost data."""
    
    @pytest.fixture
    def validator(self):
        return SurvivalValidator()
    
    def test_no_ghost_data_flagged(self, validator):
        """Runs without ghost data should be flagged."""
        report = validator.validate_run(
            claimed_distance=500,
            claimed_score=2500,
            duration_seconds=30,
            max_speed=25.0,
            max_combo=15,
            total_near_misses=20,
            perfect_dodges=5,
            obstacles_cleared=30,
            seed=12345,
            ghost_data=None,
        )
        
        assert "NO_GHOST_DATA" in report.flags
        assert report.confidence < 1.0
    
    def test_no_ghost_still_validates_sanity(self, validator):
        """Even without ghost data, sanity checks should run."""
        report = validator.validate_run(
            claimed_distance=100,
            claimed_score=100000,  # Impossible
            duration_seconds=10,
            max_speed=20.0,
            max_combo=10,
            total_near_misses=5,
            perfect_dodges=2,
            obstacles_cleared=10,
            seed=None,
            ghost_data=None,
        )
        
        assert report.result == ValidationResult.REJECTED


class TestValidationReport:
    """Tests for validation report structure."""
    
    @pytest.fixture
    def validator(self):
        return SurvivalValidator()
    
    def test_report_contains_verified_values(self, validator):
        """Report should contain server-verified values."""
        seed = 12345
        ghost_data = json.dumps({
            "v": 1,
            "s": seed,
            "st": 0,
            "d": 5000,
            "e": [],
        })
        
        report = validator.validate_run(
            claimed_distance=75,
            claimed_score=75,
            duration_seconds=5,
            max_speed=15.0,
            max_combo=0,
            total_near_misses=0,
            perfect_dodges=0,
            obstacles_cleared=0,
            seed=seed,
            ghost_data=ghost_data,
        )
        
        assert report.score_verified >= 0
        assert report.distance_verified >= 0
        assert 0 <= report.confidence <= 1
    
    def test_rejected_report_has_reason(self, validator):
        """Rejected runs should have rejection reason."""
        report = validator.validate_run(
            claimed_distance=100,
            claimed_score=100000,
            duration_seconds=10,
            max_speed=20.0,
            max_combo=10,
            total_near_misses=5,
            perfect_dodges=2,
            obstacles_cleared=10,
            seed=None,
            ghost_data=None,
        )
        
        assert report.result == ValidationResult.REJECTED
        assert report.rejection_reason is not None
