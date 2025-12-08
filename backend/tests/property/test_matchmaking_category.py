"""
Property-based tests for category-based matchmaking.

Tests:
- Property 5: Category-Based Matchmaking Isolation
"""

import pytest
from datetime import datetime
from hypothesis import given, strategies as st, settings

from app.matchmaking.models import MatchTicket
from app.matchmaking.queue_manager import QueueManager


# Strategy for generating valid category slugs
category_strategy = st.sampled_from(['fortnite', 'nfl', 'sports', 'movies', 'music'])


# Strategy for generating a match ticket
def ticket_strategy(category: str | None = None):
    """Generate a MatchTicket with optional fixed category."""
    return st.builds(
        MatchTicket,
        player_id=st.uuids().map(str),
        player_name=st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=('L', 'N'))),
        queue_time=st.just(datetime.utcnow()),
        game_mode=st.just(category) if category else category_strategy,
    )


class TestCategoryMatchmakingIsolation:
    """Property 5: Category-Based Matchmaking Isolation"""
    
    @pytest.mark.asyncio
    async def test_match_only_same_category(self):
        """Players should only be matched with others in the same category."""
        queue = QueueManager()
        
        # Add players from different categories
        fortnite_player1 = MatchTicket(
            player_id="p1",
            player_name="Player1",
            queue_time=datetime.utcnow(),
            game_mode="fortnite",
        )
        nfl_player1 = MatchTicket(
            player_id="p2",
            player_name="Player2",
            queue_time=datetime.utcnow(),
            game_mode="nfl",
        )
        
        await queue.add(fortnite_player1)
        await queue.add(nfl_player1)
        
        # Should not match - different categories
        match = await queue.find_match()
        assert match is None
        
        # Add another fortnite player
        fortnite_player2 = MatchTicket(
            player_id="p3",
            player_name="Player3",
            queue_time=datetime.utcnow(),
            game_mode="fortnite",
        )
        await queue.add(fortnite_player2)
        
        # Now should match the two fortnite players
        match = await queue.find_match()
        assert match is not None
        player1, player2 = match
        assert player1.game_mode == player2.game_mode == "fortnite"
        
        # NFL player should still be in queue
        assert await queue.contains("p2")
    
    @pytest.mark.asyncio
    async def test_fifo_within_category(self):
        """Within a category, oldest players should be matched first."""
        queue = QueueManager()
        
        # Add 3 fortnite players with different queue times
        from datetime import timedelta
        
        base_time = datetime.utcnow()
        
        player1 = MatchTicket(
            player_id="oldest",
            player_name="Oldest",
            queue_time=base_time - timedelta(minutes=5),
            game_mode="fortnite",
        )
        player2 = MatchTicket(
            player_id="middle",
            player_name="Middle",
            queue_time=base_time - timedelta(minutes=2),
            game_mode="fortnite",
        )
        player3 = MatchTicket(
            player_id="newest",
            player_name="Newest",
            queue_time=base_time,
            game_mode="fortnite",
        )
        
        await queue.add(player1)
        await queue.add(player2)
        await queue.add(player3)
        
        # Match should be oldest two players
        match = await queue.find_match()
        assert match is not None
        matched_ids = {match[0].player_id, match[1].player_id}
        assert matched_ids == {"oldest", "middle"}
        
        # Newest should still be in queue
        assert await queue.contains("newest")
    
    @pytest.mark.asyncio
    async def test_multiple_categories_independent(self):
        """Multiple categories should have independent queues."""
        queue = QueueManager()
        
        # Add 2 players each for fortnite and nfl
        fortnite1 = MatchTicket(player_id="f1", player_name="F1", queue_time=datetime.utcnow(), game_mode="fortnite")
        fortnite2 = MatchTicket(player_id="f2", player_name="F2", queue_time=datetime.utcnow(), game_mode="fortnite")
        nfl1 = MatchTicket(player_id="n1", player_name="N1", queue_time=datetime.utcnow(), game_mode="nfl")
        nfl2 = MatchTicket(player_id="n2", player_name="N2", queue_time=datetime.utcnow(), game_mode="nfl")
        
        await queue.add(fortnite1)
        await queue.add(nfl1)
        await queue.add(fortnite2)
        await queue.add(nfl2)
        
        # First match
        match1 = await queue.find_match()
        assert match1 is not None
        cat1 = match1[0].game_mode
        assert match1[0].game_mode == match1[1].game_mode
        
        # Second match should be the other category
        match2 = await queue.find_match()
        assert match2 is not None
        cat2 = match2[0].game_mode
        assert match2[0].game_mode == match2[1].game_mode
        
        # Both categories should have been matched
        assert {cat1, cat2} == {"fortnite", "nfl"}
        
        # Queue should be empty
        assert queue.get_queue_size() == 0
    
    @pytest.mark.asyncio
    @given(st.lists(category_strategy, min_size=4, max_size=20))
    @settings(max_examples=20)
    async def test_all_matches_same_category_property(self, categories):
        """Property: All matches must have players from the same category."""
        queue = QueueManager()
        
        # Add players with the given categories
        for i, cat in enumerate(categories):
            ticket = MatchTicket(
                player_id=f"player_{i}",
                player_name=f"Player{i}",
                queue_time=datetime.utcnow(),
                game_mode=cat,
            )
            await queue.add(ticket)
        
        # Keep matching until no more matches possible
        matches = []
        while True:
            match = await queue.find_match()
            if match is None:
                break
            matches.append(match)
        
        # Verify all matches have same category
        for match in matches:
            assert match[0].game_mode == match[1].game_mode, \
                f"Mismatched categories: {match[0].game_mode} vs {match[1].game_mode}"
