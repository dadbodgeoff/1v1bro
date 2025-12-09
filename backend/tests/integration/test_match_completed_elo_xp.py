"""
Integration tests for match.completed event handler ELO and XP updates.
Verifies the fix for Requirements 8.4 (ELO) and 8.5 (XP).

This test ensures that when a match completes:
1. ELO ratings are calculated and updated for both players
2. XP is awarded to both players based on match results
3. Match results are recorded in the database
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import uuid


class TestMatchCompletedELOAndXP:
    """
    Test that handle_match_completed properly updates ELO and awards XP.
    
    This is the critical test for verifying the fix where ELO was showing ±0
    because update_ratings was never being called.
    """

    @pytest.fixture(autouse=True)
    def setup(self):
        """Clear processed events before each test."""
        from app.events.handlers import clear_processed_events
        clear_processed_events()

    @pytest.mark.asyncio
    async def test_elo_update_is_called_on_match_completed(self):
        """
        Verify that leaderboard_service.update_ratings() is called
        when handle_match_completed processes an event.
        
        This was the root cause of the ±0 ELO bug - update_ratings
        was never being called.
        """
        from app.events.handlers import handle_match_completed, set_supabase_client
        
        # Create mock client
        mock_client = MagicMock()
        set_supabase_client(mock_client)
        
        match_id = str(uuid.uuid4())
        player1_id = str(uuid.uuid4())
        player2_id = str(uuid.uuid4())
        
        event_data = {
            "match_id": match_id,
            "player1_id": player1_id,
            "player2_id": player2_id,
            "winner_id": player1_id,
            "duration_seconds": 300,
            "player1_score": 10,
            "player2_score": 7,
            "player1_kills": 3,
            "player2_kills": 1,
            "player1_streak": 2,
            "player2_streak": 0,
        }
        
        # Mock at the service module level where the import happens
        with patch('app.services.leaderboard_service.LeaderboardService') as MockLeaderboardService:
            mock_leaderboard = AsyncMock()
            mock_leaderboard.update_ratings = AsyncMock(return_value=MagicMock(
                player1_pre_elo=1200,
                player1_post_elo=1216,
                player2_pre_elo=1200,
                player2_post_elo=1184,
                elo_delta_p1=16,
                elo_delta_p2=-16,
            ))
            MockLeaderboardService.return_value = mock_leaderboard
            
            # Also mock BattlePassService to avoid database calls
            with patch('app.services.battlepass_service.BattlePassService') as MockBattlePassService:
                mock_battlepass = AsyncMock()
                mock_battlepass.award_match_xp = AsyncMock(return_value=MagicMock(
                    xp_awarded=100,
                    previous_tier=0,
                    new_tier=0,
                ))
                MockBattlePassService.return_value = mock_battlepass
                
                # Process the event
                await handle_match_completed(event_data)
                
                # CRITICAL ASSERTION: update_ratings must be called
                mock_leaderboard.update_ratings.assert_called_once_with(
                    match_id=match_id,
                    player1_id=player1_id,
                    player2_id=player2_id,
                    winner_id=player1_id,
                    duration_seconds=300,
                )

    @pytest.mark.asyncio
    async def test_xp_awarded_to_both_players_on_match_completed(self):
        """
        Verify that battlepass_service.award_match_xp() is called
        for both players when handle_match_completed processes an event.
        """
        from app.events.handlers import handle_match_completed, set_supabase_client
        
        # Create mock client
        mock_client = MagicMock()
        set_supabase_client(mock_client)
        
        match_id = str(uuid.uuid4())
        player1_id = str(uuid.uuid4())
        player2_id = str(uuid.uuid4())
        
        event_data = {
            "match_id": match_id,
            "player1_id": player1_id,
            "player2_id": player2_id,
            "winner_id": player1_id,
            "duration_seconds": 300,
            "player1_score": 10,
            "player2_score": 7,
            "player1_kills": 3,
            "player2_kills": 1,
            "player1_streak": 2,
            "player2_streak": 0,
        }
        
        with patch('app.services.leaderboard_service.LeaderboardService') as MockLeaderboardService:
            mock_leaderboard = AsyncMock()
            mock_leaderboard.update_ratings = AsyncMock(return_value=MagicMock(
                player1_pre_elo=1200,
                player1_post_elo=1216,
                player2_pre_elo=1200,
                player2_post_elo=1184,
                elo_delta_p1=16,
                elo_delta_p2=-16,
            ))
            MockLeaderboardService.return_value = mock_leaderboard
            
            with patch('app.services.battlepass_service.BattlePassService') as MockBattlePassService:
                mock_battlepass = AsyncMock()
                mock_battlepass.award_match_xp = AsyncMock(return_value=MagicMock(
                    xp_awarded=100,
                    previous_tier=0,
                    new_tier=0,
                ))
                MockBattlePassService.return_value = mock_battlepass
                
                await handle_match_completed(event_data)
                
                # CRITICAL ASSERTION: award_match_xp must be called for BOTH players
                assert mock_battlepass.award_match_xp.call_count == 2
                
                # Verify player 1 XP call (winner)
                calls = mock_battlepass.award_match_xp.call_args_list
                player1_call = calls[0]
                assert player1_call.kwargs['user_id'] == player1_id
                assert player1_call.kwargs['won'] is True
                assert player1_call.kwargs['kills'] == 3
                assert player1_call.kwargs['streak'] == 2
                assert player1_call.kwargs['duration_seconds'] == 300
                assert player1_call.kwargs['match_id'] == match_id
                
                # Verify player 2 XP call (loser)
                player2_call = calls[1]
                assert player2_call.kwargs['user_id'] == player2_id
                assert player2_call.kwargs['won'] is False
                assert player2_call.kwargs['kills'] == 1
                assert player2_call.kwargs['streak'] == 0

    @pytest.mark.asyncio
    async def test_elo_update_happens_before_xp_award(self):
        """
        Verify that ELO is updated before XP is awarded.
        This ensures the correct order of operations.
        """
        from app.events.handlers import handle_match_completed, set_supabase_client
        
        mock_client = MagicMock()
        set_supabase_client(mock_client)
        
        call_order = []
        
        event_data = {
            "match_id": str(uuid.uuid4()),
            "player1_id": str(uuid.uuid4()),
            "player2_id": str(uuid.uuid4()),
            "winner_id": str(uuid.uuid4()),
            "duration_seconds": 300,
        }
        
        with patch('app.services.leaderboard_service.LeaderboardService') as MockLeaderboardService:
            mock_leaderboard = AsyncMock()
            
            async def track_elo_call(*args, **kwargs):
                call_order.append('elo')
                return MagicMock(
                    player1_pre_elo=1200, player1_post_elo=1216,
                    player2_pre_elo=1200, player2_post_elo=1184,
                    elo_delta_p1=16, elo_delta_p2=-16,
                )
            
            mock_leaderboard.update_ratings = track_elo_call
            MockLeaderboardService.return_value = mock_leaderboard
            
            with patch('app.services.battlepass_service.BattlePassService') as MockBattlePassService:
                mock_battlepass = AsyncMock()
                
                async def track_xp_call(*args, **kwargs):
                    call_order.append('xp')
                    return MagicMock(xp_awarded=100, previous_tier=0, new_tier=0)
                
                mock_battlepass.award_match_xp = track_xp_call
                MockBattlePassService.return_value = mock_battlepass
                
                await handle_match_completed(event_data)
                
                # ELO should be updated before XP is awarded
                assert call_order[0] == 'elo'
                assert 'xp' in call_order

    @pytest.mark.asyncio
    async def test_handler_skips_without_supabase_client(self):
        """
        Verify that handler gracefully handles missing Supabase client.
        """
        from app.events.handlers import handle_match_completed, set_supabase_client
        
        # Set client to None
        set_supabase_client(None)
        
        event_data = {
            "match_id": str(uuid.uuid4()),
            "player1_id": str(uuid.uuid4()),
            "player2_id": str(uuid.uuid4()),
            "winner_id": str(uuid.uuid4()),
            "duration_seconds": 300,
        }
        
        # Should not raise, just skip processing
        await handle_match_completed(event_data)

    @pytest.mark.asyncio
    async def test_handler_skips_without_player_ids(self):
        """
        Verify that handler gracefully handles missing player IDs.
        """
        from app.events.handlers import handle_match_completed, set_supabase_client
        
        mock_client = MagicMock()
        set_supabase_client(mock_client)
        
        event_data = {
            "match_id": str(uuid.uuid4()),
            "player1_id": None,  # Missing
            "player2_id": str(uuid.uuid4()),
            "winner_id": str(uuid.uuid4()),
            "duration_seconds": 300,
        }
        
        with patch('app.services.leaderboard_service.LeaderboardService') as MockLeaderboardService:
            mock_leaderboard = AsyncMock()
            MockLeaderboardService.return_value = mock_leaderboard
            
            # Should not raise, just skip ELO/XP processing
            await handle_match_completed(event_data)
            
            # update_ratings should NOT be called with missing player IDs
            mock_leaderboard.update_ratings.assert_not_called()


class TestELOCalculationIntegrity:
    """
    Test that ELO calculations produce correct non-zero deltas.
    """

    def test_elo_calculation_produces_nonzero_delta(self):
        """
        Verify that ELO calculation produces non-zero deltas for wins/losses.
        This ensures the ±0 display issue is not from calculation.
        """
        from app.services.leaderboard_service import LeaderboardService
        
        # Create service without client (just for calculation)
        service = LeaderboardService.__new__(LeaderboardService)
        
        # Test equal ELO players
        delta1, delta2 = service.calculate_elo_change(
            player1_elo=1200,
            player2_elo=1200,
            player1_won=True,
        )
        
        # Winner should gain, loser should lose
        assert delta1 > 0, "Winner should gain ELO"
        assert delta2 < 0, "Loser should lose ELO"
        assert delta1 == -delta2, "Deltas should be symmetric for equal ELO"
        
        # With K=32 and equal ELO, expected delta is 16
        assert delta1 == 16, f"Expected +16 for winner, got {delta1}"
        assert delta2 == -16, f"Expected -16 for loser, got {delta2}"

    def test_elo_calculation_with_different_ratings(self):
        """
        Verify ELO calculation with different starting ratings.
        """
        from app.services.leaderboard_service import LeaderboardService
        
        service = LeaderboardService.__new__(LeaderboardService)
        
        # Higher rated player wins (expected outcome)
        delta1, delta2 = service.calculate_elo_change(
            player1_elo=1400,  # Higher rated
            player2_elo=1200,  # Lower rated
            player1_won=True,
        )
        
        # Winner gains less when expected to win
        assert delta1 > 0
        assert delta2 < 0
        assert delta1 < 16, "Higher rated winner should gain less than 16"
        
        # Lower rated player wins (upset)
        delta1, delta2 = service.calculate_elo_change(
            player1_elo=1200,  # Lower rated
            player2_elo=1400,  # Higher rated
            player1_won=True,
        )
        
        # Winner gains more for upset
        assert delta1 > 16, "Lower rated winner should gain more than 16"


class TestXPCalculationIntegrity:
    """
    Test that XP calculations produce correct values.
    """

    def test_xp_calculation_for_win(self):
        """
        Verify XP calculation for a winning player.
        Requirements: 4.3 - Win=100, +5/kill, +10/streak, +0.1/sec
        """
        from app.services.battlepass_service import BattlePassService
        
        service = BattlePassService.__new__(BattlePassService)
        
        result = service.calculate_match_xp(
            won=True,
            kills=3,
            streak=2,
            duration_seconds=300,
        )
        
        # Base: 100 (win) + 15 (3 kills) + 20 (2 streak) + 30 (300 sec) = 165
        assert result.base_xp == 100
        assert result.kill_bonus == 15
        assert result.streak_bonus == 20
        assert result.duration_bonus == 30
        assert result.total_xp == 165

    def test_xp_calculation_for_loss(self):
        """
        Verify XP calculation for a losing player.
        Requirements: 4.3 - Loss=50
        """
        from app.services.battlepass_service import BattlePassService
        
        service = BattlePassService.__new__(BattlePassService)
        
        result = service.calculate_match_xp(
            won=False,
            kills=1,
            streak=0,
            duration_seconds=300,
        )
        
        # Base: 50 (loss) + 5 (1 kill) + 0 (0 streak) + 30 (300 sec) = 85
        assert result.base_xp == 50
        assert result.kill_bonus == 5
        assert result.streak_bonus == 0
        assert result.duration_bonus == 30
        assert result.total_xp == 85

    def test_xp_clamping(self):
        """
        Verify XP is clamped to [50, 300] range.
        Requirements: 4.4
        """
        from app.services.battlepass_service import BattlePassService
        
        service = BattlePassService.__new__(BattlePassService)
        
        # Test max clamping
        result = service.calculate_match_xp(
            won=True,
            kills=50,  # 250 bonus
            streak=20,  # 200 bonus
            duration_seconds=1000,  # 100 bonus
        )
        
        # Should be clamped to 300
        assert result.total_xp == 300
        assert result.was_clamped is True
