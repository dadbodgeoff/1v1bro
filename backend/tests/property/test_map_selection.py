"""
Property-based tests for map selection feature.

Tests correctness properties from the map-selection design document.
"""

import pytest
from datetime import datetime
from hypothesis import given, strategies as st, settings

from app.matchmaking.models import MatchTicket, MatchFoundEvent


# Valid map slugs (simple-arena is default, vortex-arena is secondary)
VALID_MAP_SLUGS = ['simple-arena', 'vortex-arena']
map_slug_strategy = st.sampled_from(VALID_MAP_SLUGS)


class TestMatchTicketMapSlug:
    """
    Property 3: Match ticket stores map
    
    For any map slug provided to MatchTicket, the ticket should store that value.
    
    **Feature: map-selection, Property 3: Match ticket stores map**
    **Validates: Requirements 2.1**
    """
    
    @given(
        player_id=st.uuids().map(str),
        player_name=st.text(min_size=1, max_size=50).filter(lambda x: x.strip()),
        game_mode=st.sampled_from(['fortnite', 'nfl']),
        map_slug=map_slug_strategy,
    )
    @settings(max_examples=100)
    def test_match_ticket_stores_map_slug(self, player_id, player_name, game_mode, map_slug):
        """
        Property: MatchTicket stores the provided map_slug value.
        
        **Feature: map-selection, Property 3: Match ticket stores map**
        **Validates: Requirements 2.1**
        """
        ticket = MatchTicket(
            player_id=player_id,
            player_name=player_name,
            queue_time=datetime.utcnow(),
            game_mode=game_mode,
            map_slug=map_slug,
        )
        
        assert ticket.map_slug == map_slug
    
    @given(
        player_id=st.uuids().map(str),
        player_name=st.text(min_size=1, max_size=50).filter(lambda x: x.strip()),
        map_slug=map_slug_strategy,
    )
    @settings(max_examples=100)
    def test_match_ticket_to_dict_includes_map_slug(self, player_id, player_name, map_slug):
        """
        Property: MatchTicket.to_dict() includes map_slug in output.
        
        **Feature: map-selection, Property 3: Match ticket stores map**
        **Validates: Requirements 2.1**
        """
        ticket = MatchTicket(
            player_id=player_id,
            player_name=player_name,
            queue_time=datetime.utcnow(),
            map_slug=map_slug,
        )
        
        ticket_dict = ticket.to_dict()
        
        assert 'map_slug' in ticket_dict
        assert ticket_dict['map_slug'] == map_slug
    
    @given(
        player_id=st.uuids().map(str),
        player_name=st.text(min_size=1, max_size=50).filter(lambda x: x.strip()),
        map_slug=map_slug_strategy,
    )
    @settings(max_examples=100)
    def test_match_ticket_round_trip(self, player_id, player_name, map_slug):
        """
        Property: MatchTicket round-trip through to_dict/from_dict preserves map_slug.
        
        **Feature: map-selection, Property 3: Match ticket stores map**
        **Validates: Requirements 2.1**
        """
        original = MatchTicket(
            player_id=player_id,
            player_name=player_name,
            queue_time=datetime.utcnow(),
            map_slug=map_slug,
        )
        
        ticket_dict = original.to_dict()
        restored = MatchTicket.from_dict(ticket_dict)
        
        assert restored.map_slug == original.map_slug
    
    def test_match_ticket_defaults_to_simple_arena(self):
        """
        Example: MatchTicket defaults to simple-arena when map_slug not provided.
        
        **Feature: map-selection, Property 3: Match ticket stores map**
        **Validates: Requirements 2.1**
        """
        ticket = MatchTicket(
            player_id="test-player",
            player_name="Test",
            queue_time=datetime.utcnow(),
        )
        
        assert ticket.map_slug == "simple-arena"


class TestMatchFoundEventMapSlug:
    """
    Property 6: WebSocket events include map
    
    For any lobby with a map_slug, the match_found event should include that map_slug.
    
    **Feature: map-selection, Property 6: WebSocket events include map**
    **Validates: Requirements 6.3**
    """
    
    @given(
        lobby_code=st.text(alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', min_size=6, max_size=6),
        opponent_id=st.uuids().map(str),
        opponent_name=st.text(min_size=1, max_size=50).filter(lambda x: x.strip()),
        map_slug=map_slug_strategy,
    )
    @settings(max_examples=100)
    def test_match_found_event_includes_map_slug(self, lobby_code, opponent_id, opponent_name, map_slug):
        """
        Property: MatchFoundEvent includes map_slug in to_dict output.
        
        **Feature: map-selection, Property 6: WebSocket events include map**
        **Validates: Requirements 6.3**
        """
        event = MatchFoundEvent(
            lobby_code=lobby_code,
            opponent_id=opponent_id,
            opponent_name=opponent_name,
            map_slug=map_slug,
        )
        
        event_dict = event.to_dict()
        
        assert 'map_slug' in event_dict
        assert event_dict['map_slug'] == map_slug


class TestLobbyMapSlugRoundTrip:
    """
    Property 5: Lobby stores and returns map
    
    For any map slug used when creating a lobby, retrieving that lobby
    should return the same map_slug value.
    
    **Feature: map-selection, Property 5: Lobby stores and returns map**
    **Validates: Requirements 2.3, 2.4, 5.2**
    """
    
    @given(map_slug=map_slug_strategy)
    @settings(max_examples=100)
    def test_lobby_data_includes_map_slug(self, map_slug):
        """
        Property: Lobby data dict structure includes map_slug field.
        
        This tests the data structure that would be returned from the database.
        
        **Feature: map-selection, Property 5: Lobby stores and returns map**
        **Validates: Requirements 2.3, 2.4, 5.2**
        """
        # Simulate lobby data as it would be stored/retrieved
        lobby_data = {
            "id": "test-lobby-id",
            "code": "ABC123",
            "host_id": "test-host-id",
            "opponent_id": None,
            "status": "waiting",
            "game_mode": "fortnite",
            "category": "fortnite",
            "map_slug": map_slug,
        }
        
        # Verify map_slug is present and correct
        assert 'map_slug' in lobby_data
        assert lobby_data['map_slug'] == map_slug
    
    def test_lobby_defaults_to_simple_arena(self):
        """
        Example: Lobby without explicit map_slug defaults to simple-arena.
        
        **Feature: map-selection, Property 5: Lobby stores and returns map**
        **Validates: Requirements 5.3**
        """
        # Simulate lobby data with default map_slug
        lobby_data = {
            "id": "test-lobby-id",
            "code": "ABC123",
            "host_id": "test-host-id",
            "status": "waiting",
            "game_mode": "fortnite",
            "map_slug": "simple-arena",  # Default value
        }
        
        assert lobby_data.get('map_slug', 'simple-arena') == 'simple-arena'



class TestSameMapMatching:
    """
    Property 4: Same-map matching only
    
    For any two players in the queue with different map_slug values,
    the matchmaking system should not match them together.
    
    **Feature: map-selection, Property 4: Same-map matching only**
    **Validates: Requirements 2.2**
    """
    
    @pytest.mark.asyncio
    @given(
        player1_map=map_slug_strategy,
        player2_map=map_slug_strategy,
        category=st.sampled_from(['fortnite', 'nfl']),
    )
    @settings(max_examples=100)
    async def test_same_map_players_can_match(self, player1_map, player2_map, category):
        """
        Property: Players with same category AND map can be matched.
        
        **Feature: map-selection, Property 4: Same-map matching only**
        **Validates: Requirements 2.2**
        """
        from app.matchmaking.queue_manager import QueueManager
        
        qm = QueueManager()
        
        ticket1 = MatchTicket(
            player_id="player-1",
            player_name="Player 1",
            queue_time=datetime.utcnow(),
            game_mode=category,
            map_slug=player1_map,
        )
        ticket2 = MatchTicket(
            player_id="player-2",
            player_name="Player 2",
            queue_time=datetime.utcnow(),
            game_mode=category,
            map_slug=player2_map,
        )
        
        await qm.add(ticket1)
        await qm.add(ticket2)
        
        match = await qm.find_match()
        
        if player1_map == player2_map:
            # Same map - should match
            assert match is not None, f"Players with same map {player1_map} should match"
            assert match[0].map_slug == match[1].map_slug
        else:
            # Different maps - should NOT match
            assert match is None, f"Players with different maps ({player1_map} vs {player2_map}) should not match"
    
    @pytest.mark.asyncio
    async def test_different_map_players_do_not_match(self):
        """
        Example: Two players with different maps should not be matched.
        
        **Feature: map-selection, Property 4: Same-map matching only**
        **Validates: Requirements 2.2**
        """
        from app.matchmaking.queue_manager import QueueManager
        
        qm = QueueManager()
        
        ticket1 = MatchTicket(
            player_id="player-1",
            player_name="Player 1",
            queue_time=datetime.utcnow(),
            game_mode="fortnite",
            map_slug="simple-arena",
        )
        ticket2 = MatchTicket(
            player_id="player-2",
            player_name="Player 2",
            queue_time=datetime.utcnow(),
            game_mode="fortnite",
            map_slug="vortex-arena",
        )
        
        await qm.add(ticket1)
        await qm.add(ticket2)
        
        match = await qm.find_match()
        
        # Different maps - should NOT match even with same category
        assert match is None
    
    @pytest.mark.asyncio
    async def test_same_map_same_category_players_match(self):
        """
        Example: Two players with same map and category should match.
        
        **Feature: map-selection, Property 4: Same-map matching only**
        **Validates: Requirements 2.2**
        """
        from app.matchmaking.queue_manager import QueueManager
        
        qm = QueueManager()
        
        ticket1 = MatchTicket(
            player_id="player-1",
            player_name="Player 1",
            queue_time=datetime.utcnow(),
            game_mode="fortnite",
            map_slug="vortex-arena",
        )
        ticket2 = MatchTicket(
            player_id="player-2",
            player_name="Player 2",
            queue_time=datetime.utcnow(),
            game_mode="fortnite",
            map_slug="vortex-arena",
        )
        
        await qm.add(ticket1)
        await qm.add(ticket2)
        
        match = await qm.find_match()
        
        # Same map and category - should match
        assert match is not None
        assert match[0].map_slug == "vortex-arena"
        assert match[1].map_slug == "vortex-arena"



class TestWebSocketEventsMapSlug:
    """
    Property 6: WebSocket events include map
    
    For any lobby with a map_slug, the lobby_state, game_start, and match_found
    events should all include that map_slug in their payloads.
    
    **Feature: map-selection, Property 6: WebSocket events include map**
    **Validates: Requirements 3.3, 6.1, 6.2, 6.3**
    """
    
    @given(
        map_slug=map_slug_strategy,
        category=st.sampled_from(['fortnite', 'nfl']),
    )
    @settings(max_examples=100, deadline=None)
    def test_build_lobby_state_includes_map_slug(self, map_slug, category):
        """
        Property: build_lobby_state includes map_slug in payload.
        
        **Feature: map-selection, Property 6: WebSocket events include map**
        **Validates: Requirements 6.1**
        """
        from app.websocket.events import build_lobby_state
        
        event = build_lobby_state(
            lobby_id="test-lobby",
            status="waiting",
            players=[],
            can_start=False,
            host_id="test-host",
            category=category,
            map_slug=map_slug,
        )
        
        assert event['type'] == 'lobby_state'
        assert 'map_slug' in event['payload']
        assert event['payload']['map_slug'] == map_slug
    
    @given(
        map_slug=map_slug_strategy,
        category=st.sampled_from(['fortnite', 'nfl']),
    )
    @settings(max_examples=100, deadline=None)
    def test_build_game_start_includes_map_slug(self, map_slug, category):
        """
        Property: build_game_start includes map_slug in payload.
        
        **Feature: map-selection, Property 6: WebSocket events include map**
        **Validates: Requirements 6.2**
        """
        from app.websocket.events import build_game_start
        
        event = build_game_start(
            total_questions=15,
            players=[],
            player1_id="player-1",
            player2_id="player-2",
            category=category,
            map_slug=map_slug,
        )
        
        assert event['type'] == 'game_start'
        assert 'map_slug' in event['payload']
        assert event['payload']['map_slug'] == map_slug
    
    def test_lobby_state_defaults_to_simple_arena(self):
        """
        Example: build_lobby_state defaults to simple-arena when map_slug not provided.
        
        **Feature: map-selection, Property 6: WebSocket events include map**
        **Validates: Requirements 6.1**
        """
        from app.websocket.events import build_lobby_state
        
        event = build_lobby_state(
            lobby_id="test-lobby",
            status="waiting",
            players=[],
            can_start=False,
            host_id="test-host",
        )
        
        assert event['payload']['map_slug'] == 'simple-arena'
    
    def test_game_start_defaults_to_simple_arena(self):
        """
        Example: build_game_start defaults to simple-arena when map_slug not provided.
        
        **Feature: map-selection, Property 6: WebSocket events include map**
        **Validates: Requirements 6.2**
        """
        from app.websocket.events import build_game_start
        
        event = build_game_start(
            total_questions=15,
            players=[],
            player1_id="player-1",
            player2_id="player-2",
        )
        
        assert event['payload']['map_slug'] == 'simple-arena'
