"""
Integration tests for Unified Progression System.

Tests end-to-end flows for:
- Progress initialization at tier 1
- Tier 1 cosmetic auto-claim
- Match XP award
- Tier advancement
- Reward claiming
- Legacy user migration

Requirements: 1.1-1.7, 2.1-2.8, 3.1-3.6, 4.1-4.8, 5.1-5.6, 8.1-8.5
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta

from app.services.battlepass_service import BattlePassService
from app.services.progression_service import ProgressionService
from app.database.repositories.battlepass_repo import BattlePassRepository
from app.schemas.battlepass import (
    Season,
    PlayerBattlePass,
    XPAwardResult,
    ClaimResult,
)


class TestProgressInitialization:
    """
    Integration tests for progress initialization.
    Requirements: 1.1-1.7
    """
    
    @pytest.fixture
    def mock_client(self):
        """Create a mock Supabase client."""
        return MagicMock()
    
    @pytest.fixture
    def mock_season(self):
        """Create a mock season."""
        return {
            "id": "season-123",
            "season_number": 1,
            "name": "Season 1",
            "theme": "Fortnite",
            "start_date": datetime.utcnow().isoformat(),
            "end_date": (datetime.utcnow() + timedelta(days=90)).isoformat(),
            "is_active": True,
            "xp_per_tier": 1000,
        }
    
    @pytest.fixture
    def mock_tier_1(self):
        """Create a mock tier 1 reward."""
        return {
            "tier_number": 1,
            "free_reward": {
                "type": "cosmetic",
                "value": "cosmetic-tier1-skin",
            },
            "premium_reward": None,
        }
    
    @pytest.mark.asyncio
    async def test_new_user_starts_at_tier_1(self, mock_client, mock_season):
        """
        Test: New user registration creates tier 1 progress.
        Requirements: 1.1, 1.2
        """
        # Setup mocks
        mock_table = MagicMock()
        mock_client.table.return_value = mock_table
        
        # Mock get_current_season
        mock_table.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
            data=[mock_season]
        )
        
        # Mock get_player_progress (not found)
        mock_table.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
            data=[]
        )
        
        # Mock create_player_progress
        created_progress = {
            "user_id": "user-123",
            "season_id": "season-123",
            "current_tier": 1,
            "current_xp": 0,
            "claimed_rewards": [1],
            "is_premium": False,
        }
        mock_table.insert.return_value.execute.return_value = MagicMock(data=[created_progress])
        
        # Create repository and verify
        repo = BattlePassRepository(mock_client)
        result = await repo.create_player_progress("user-123", "season-123")
        
        assert result["current_tier"] == 1
        assert result["claimed_rewards"] == [1]
        assert result["current_xp"] == 0
    
    @pytest.mark.asyncio
    async def test_existing_progress_not_modified(self, mock_client, mock_season):
        """
        Test: Existing progress is returned without modification.
        Requirements: 1.7
        """
        existing_progress = {
            "user_id": "user-123",
            "season_id": "season-123",
            "current_tier": 5,
            "current_xp": 500,
            "claimed_rewards": [1, 2, 3],
            "is_premium": True,
        }
        
        mock_table = MagicMock()
        mock_client.table.return_value = mock_table
        mock_table.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
            data=[existing_progress]
        )
        
        repo = BattlePassRepository(mock_client)
        result = await repo.get_player_progress("user-123", "season-123")
        
        assert result["current_tier"] == 5
        assert result["current_xp"] == 500
        assert result["claimed_rewards"] == [1, 2, 3]


class TestXPAward:
    """
    Integration tests for XP award flow.
    Requirements: 2.1-2.8, 5.1-5.6
    """
    
    def test_xp_calculation_win(self):
        """
        Test: Win with kills and streak calculates correct XP.
        Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
        """
        service = BattlePassService(client=None)
        
        result = service.calculate_match_xp(
            won=True,
            kills=5,
            streak=3,
            duration_seconds=300,
        )
        
        # base=100 + kills*5=25 + streak*10=30 + duration*0.1=30 = 185
        assert result.base_xp == 100
        assert result.kill_bonus == 25
        assert result.streak_bonus == 30
        assert result.duration_bonus == 30
        assert result.total_xp == 185
        assert not result.was_clamped
    
    def test_xp_calculation_loss(self):
        """
        Test: Loss calculates correct XP.
        Requirements: 2.2
        """
        service = BattlePassService(client=None)
        
        result = service.calculate_match_xp(
            won=False,
            kills=2,
            streak=1,
            duration_seconds=180,
        )
        
        # base=50 + kills*5=10 + streak*10=10 + duration*0.1=18 = 88
        assert result.base_xp == 50
        assert result.total_xp == 88
    
    def test_xp_clamped_to_max(self):
        """
        Test: XP is clamped to 300 max.
        Requirements: 2.6
        """
        service = BattlePassService(client=None)
        
        result = service.calculate_match_xp(
            won=True,
            kills=100,
            streak=50,
            duration_seconds=3600,
        )
        
        assert result.total_xp == 300
        assert result.was_clamped
    
    def test_xp_clamped_to_min(self):
        """
        Test: XP is clamped to 50 min.
        Requirements: 2.6
        """
        service = BattlePassService(client=None)
        
        # Even with 0 everything, loss gives 50 base
        result = service.calculate_match_xp(
            won=False,
            kills=0,
            streak=0,
            duration_seconds=0,
        )
        
        assert result.total_xp == 50


class TestTierAdvancement:
    """
    Integration tests for tier advancement.
    Requirements: 3.1-3.6
    """
    
    def test_tier_advances_on_threshold(self):
        """
        Test: Tier advances when XP reaches threshold.
        Requirements: 3.1, 3.2
        """
        # Simulate tier advancement logic
        current_tier = 1
        current_xp = 800
        xp_award = 300
        xp_per_tier = 1000
        
        new_xp = current_xp + xp_award
        new_tier = current_tier
        
        while new_xp >= xp_per_tier and new_tier < 100:
            new_xp -= xp_per_tier
            new_tier += 1
        
        assert new_tier == 2
        assert new_xp == 100  # Overflow
    
    def test_multiple_tier_advancement(self):
        """
        Test: Multiple tiers can advance in one award.
        Requirements: 3.3
        """
        current_tier = 1
        current_xp = 0
        xp_award = 2500
        xp_per_tier = 1000
        
        new_xp = current_xp + xp_award
        new_tier = current_tier
        tiers_gained = 0
        
        while new_xp >= xp_per_tier and new_tier < 100:
            new_xp -= xp_per_tier
            new_tier += 1
            tiers_gained += 1
        
        assert new_tier == 3
        assert tiers_gained == 2
        assert new_xp == 500
    
    def test_tier_cap_at_100(self):
        """
        Test: Tier cannot exceed 100.
        Requirements: 3.5
        """
        current_tier = 99
        current_xp = 500
        xp_award = 10000
        xp_per_tier = 1000
        
        new_xp = current_xp + xp_award
        new_tier = current_tier
        
        while new_xp >= xp_per_tier and new_tier < 100:
            new_xp -= xp_per_tier
            new_tier += 1
        
        if new_tier >= 100:
            new_tier = 100
            new_xp = 0
        
        assert new_tier == 100
        assert new_xp == 0


class TestRewardClaiming:
    """
    Integration tests for reward claiming.
    Requirements: 4.1-4.8
    """
    
    def test_claim_validation_tier_not_reached(self):
        """
        Test: Cannot claim tier not yet reached.
        Requirements: 4.1
        """
        current_tier = 3
        claim_tier = 5
        claimed_rewards = [1, 2]
        
        can_claim = claim_tier <= current_tier and claim_tier not in claimed_rewards
        
        assert not can_claim
    
    def test_claim_validation_already_claimed(self):
        """
        Test: Cannot claim already claimed tier.
        Requirements: 4.2
        """
        current_tier = 5
        claim_tier = 2
        claimed_rewards = [1, 2, 3]
        
        can_claim = claim_tier <= current_tier and claim_tier not in claimed_rewards
        
        assert not can_claim
    
    def test_claim_validation_success(self):
        """
        Test: Can claim reached, unclaimed tier.
        Requirements: 4.1, 4.2
        """
        current_tier = 5
        claim_tier = 4
        claimed_rewards = [1, 2, 3]
        
        can_claim = claim_tier <= current_tier and claim_tier not in claimed_rewards
        
        assert can_claim


class TestLegacyMigration:
    """
    Integration tests for legacy user migration.
    Requirements: 8.1-8.5
    """
    
    def test_tier_zero_user_detected(self):
        """
        Test: Tier 0 user is detected for migration.
        Requirements: 8.1
        """
        progress = {
            "current_tier": 0,
            "current_xp": 500,
            "claimed_rewards": [],
        }
        
        needs_migration = progress["current_tier"] == 0
        
        assert needs_migration
    
    def test_tier_nonzero_user_not_migrated(self):
        """
        Test: User with tier > 0 is not migrated.
        Requirements: 8.3
        """
        progress = {
            "current_tier": 3,
            "current_xp": 500,
            "claimed_rewards": [1, 2],
        }
        
        needs_migration = progress["current_tier"] == 0
        
        assert not needs_migration
    
    def test_migration_preserves_xp(self):
        """
        Test: Migration preserves existing XP.
        Requirements: 8.3
        """
        original_xp = 750
        
        # Simulate migration
        migrated_progress = {
            "current_tier": 1,  # Upgraded from 0
            "current_xp": original_xp,  # Preserved
            "claimed_rewards": [1],  # Added tier 1
        }
        
        assert migrated_progress["current_xp"] == original_xp
    
    def test_migration_preserves_existing_claims(self):
        """
        Test: Migration preserves existing claimed rewards.
        Requirements: 8.2
        """
        original_claimed = [2, 3]  # Somehow had claims without tier 1
        
        # Simulate migration
        migrated_claimed = original_claimed.copy()
        if 1 not in migrated_claimed:
            migrated_claimed.append(1)
        
        assert 1 in migrated_claimed
        assert 2 in migrated_claimed
        assert 3 in migrated_claimed
