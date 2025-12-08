"""
Integration tests for ELO rating flow.
Requirements: 5.1-5.10
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.schemas.leaderboard import RankTier


class TestELOCalculationAfterMatch:
    """Test ELO calculation after match completion."""

    @pytest.mark.asyncio
    async def test_elo_zero_sum(self):
        """ELO changes should be zero-sum for equal ratings."""
        from app.services.leaderboard_service import LeaderboardService
        
        service = LeaderboardService(MagicMock())
        
        # Calculate ELO change for equal players
        winner_elo = 1200
        loser_elo = 1200
        
        delta1, delta2 = service.calculate_elo_change(winner_elo, loser_elo, player1_won=True)
        
        # Changes should sum to zero (approximately, due to rounding)
        assert abs(delta1 + delta2) <= 1


class TestTierAssignment:
    """Test rank tier assignment based on ELO."""

    def test_bronze_tier(self):
        """ELO 100-799 should be Bronze."""
        from app.services.leaderboard_service import LeaderboardService
        
        service = LeaderboardService(MagicMock())
        
        assert service.get_tier(100) == RankTier.BRONZE
        assert service.get_tier(500) == RankTier.BRONZE
        assert service.get_tier(799) == RankTier.BRONZE

    def test_silver_tier(self):
        """ELO 800-1199 should be Silver."""
        from app.services.leaderboard_service import LeaderboardService
        
        service = LeaderboardService(MagicMock())
        
        assert service.get_tier(800) == RankTier.SILVER
        assert service.get_tier(1000) == RankTier.SILVER
        assert service.get_tier(1199) == RankTier.SILVER

    def test_gold_tier(self):
        """ELO 1200-1599 should be Gold."""
        from app.services.leaderboard_service import LeaderboardService
        
        service = LeaderboardService(MagicMock())
        
        assert service.get_tier(1200) == RankTier.GOLD
        assert service.get_tier(1400) == RankTier.GOLD
        assert service.get_tier(1599) == RankTier.GOLD

    def test_grandmaster_tier(self):
        """ELO 2800+ should be Grandmaster."""
        from app.services.leaderboard_service import LeaderboardService
        
        service = LeaderboardService(MagicMock())
        
        assert service.get_tier(2800) == RankTier.GRANDMASTER
        assert service.get_tier(3000) == RankTier.GRANDMASTER


class TestELOBounds:
    """Test ELO clamping to bounds."""

    def test_elo_minimum_bound(self):
        """ELO should not go below 100."""
        from app.services.leaderboard_service import LeaderboardService
        
        service = LeaderboardService(MagicMock())
        
        # Very low ELO player loses
        result = service._clamp_elo(50)
        assert result == 100

    def test_elo_maximum_bound(self):
        """ELO should not exceed 3000."""
        from app.services.leaderboard_service import LeaderboardService
        
        service = LeaderboardService(MagicMock())
        
        # Very high ELO
        result = service._clamp_elo(3500)
        assert result == 3000


class TestKFactor:
    """Test K-factor calculation."""

    def test_k_factor_low_elo(self):
        """K-factor should be 32 for ELO < 2000."""
        from app.services.leaderboard_service import LeaderboardService
        
        service = LeaderboardService(MagicMock())
        
        assert service.get_k_factor(1000) == 32
        assert service.get_k_factor(1500) == 32
        assert service.get_k_factor(1999) == 32

    def test_k_factor_mid_elo(self):
        """K-factor should be 24 for ELO 2000-2399."""
        from app.services.leaderboard_service import LeaderboardService
        
        service = LeaderboardService(MagicMock())
        
        assert service.get_k_factor(2000) == 24
        assert service.get_k_factor(2200) == 24
        assert service.get_k_factor(2399) == 24

    def test_k_factor_high_elo(self):
        """K-factor should be 16 for ELO 2400+."""
        from app.services.leaderboard_service import LeaderboardService
        
        service = LeaderboardService(MagicMock())
        
        assert service.get_k_factor(2400) == 16
        assert service.get_k_factor(2800) == 16
        assert service.get_k_factor(3000) == 16
