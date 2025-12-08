"""
Integration tests for battle pass service flow.
Requirements: 4.1-4.10
"""

import pytest


class TestBattlePassSchemas:
    """Test battle pass schema validation."""

    def test_season_schema(self):
        """Season schema should validate correctly."""
        from app.schemas.battlepass import Season
        
        season = Season(
            id="season-1",
            name="Season 1",
            season_number=1,
            start_date="2024-01-01T00:00:00Z",
            end_date="2024-03-31T23:59:59Z",
            is_active=True,
        )
        
        assert season.id == "season-1"
        assert season.name == "Season 1"
        assert season.season_number == 1
        assert season.is_active is True

    def test_xp_source_enum(self):
        """XPSource enum should have expected values."""
        from app.schemas.battlepass import XPSource
        
        assert XPSource.MATCH_WIN.value == "match_win"
        assert XPSource.MATCH_LOSS.value == "match_loss"
        assert XPSource.DAILY_BONUS.value == "daily_bonus"


class TestTierSchemas:
    """Test tier schema validation."""

    def test_battlepass_tier_schema(self):
        """BattlePassTier schema should validate correctly."""
        from app.schemas.battlepass import BattlePassTier
        
        tier = BattlePassTier(
            tier_number=5,
            free_reward=None,
            premium_reward=None,
        )
        
        assert tier.tier_number == 5


class TestPlayerProgressSchemas:
    """Test player progress schema validation."""

    def test_player_battlepass_simple_schema(self):
        """PlayerBattlePassSimple schema should validate correctly."""
        from app.schemas.battlepass import PlayerBattlePassSimple
        
        progress = PlayerBattlePassSimple(
            id="progress-1",
            user_id="user-1",
            season_id="season-1",
            current_tier=5,
            current_xp=450,
            is_premium=False,
            claimed_rewards=[1, 2, 3, 4],
        )
        
        assert progress.user_id == "user-1"
        assert progress.current_tier == 5
        assert progress.current_xp == 450
        assert progress.is_premium is False
        assert len(progress.claimed_rewards) == 4


class TestXPCalculation:
    """Test XP calculation logic."""

    def test_xp_bounds_constants(self):
        """XP bounds should be defined."""
        from app.services.battlepass_service import XP_MIN, XP_MAX
        
        assert XP_MIN == 50
        assert XP_MAX == 300
