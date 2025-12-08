"""
Property-based tests for NFL category WebSocket events and lobby category.

Tests:
- Property 6: Lobby Category Immutability
- Property 7: WebSocket Event Category Inclusion
"""

import pytest
from datetime import datetime
from hypothesis import given, strategies as st, settings, assume

from app.websocket.events import (
    build_lobby_state,
    build_game_start,
)


# Strategy for generating valid category slugs
category_strategy = st.sampled_from(['fortnite', 'nfl', 'sports', 'movies', 'music'])


# =============================================================================
# Property 7: WebSocket Event Category Inclusion
# =============================================================================

class TestWebSocketEventCategoryInclusion:
    """
    Property 7: WebSocket Event Category Inclusion
    
    For any lobby_state or game_start WebSocket event, the event payload
    should include a non-null category field matching the lobby's category.
    
    **Validates: Requirements 4.4, 10.1, 10.2**
    """
    
    @given(
        lobby_id=st.uuids().map(str),
        status=st.sampled_from(['waiting', 'in_progress', 'completed']),
        host_id=st.uuids().map(str),
        category=category_strategy,
        num_players=st.integers(min_value=0, max_value=2),
    )
    @settings(max_examples=100)
    def test_lobby_state_includes_category(
        self, lobby_id, status, host_id, category, num_players
    ):
        """
        Property: lobby_state events must include non-null category field.
        
        **Feature: nfl-trivia-category, Property 7: WebSocket Event Category Inclusion**
        **Validates: Requirements 4.4, 10.1**
        """
        # Generate players list
        players = [
            {
                'id': f'player_{i}',
                'display_name': f'Player{i}',
                'is_host': i == 0,
                'is_ready': True,
            }
            for i in range(num_players)
        ]
        
        # Build lobby_state event
        event = build_lobby_state(
            lobby_id=lobby_id,
            status=status,
            players=players,
            can_start=num_players >= 2,
            host_id=host_id,
            category=category,
        )
        
        # Verify event structure
        assert event['type'] == 'lobby_state'
        assert event['payload'] is not None
        
        # Property: category must be present and match input
        payload = event['payload']
        assert 'category' in payload, "lobby_state payload missing 'category' field"
        assert payload['category'] is not None, "lobby_state category is null"
        assert payload['category'] == category, f"Category mismatch: {payload['category']} != {category}"
    
    @given(
        total_questions=st.integers(min_value=5, max_value=20),
        player1_id=st.uuids().map(str),
        player2_id=st.uuids().map(str),
        category=category_strategy,
    )
    @settings(max_examples=100)
    def test_game_start_includes_category(
        self, total_questions, player1_id, player2_id, category
    ):
        """
        Property: game_start events must include non-null category field.
        
        **Feature: nfl-trivia-category, Property 7: WebSocket Event Category Inclusion**
        **Validates: Requirements 10.2**
        """
        # Ensure different player IDs
        assume(player1_id != player2_id)
        
        # Generate players list
        players = [
            {'id': player1_id, 'display_name': 'Player1', 'is_host': True, 'is_ready': True},
            {'id': player2_id, 'display_name': 'Player2', 'is_host': False, 'is_ready': True},
        ]
        
        # Build game_start event
        event = build_game_start(
            total_questions=total_questions,
            players=players,
            player1_id=player1_id,
            player2_id=player2_id,
            player_skins={},
            category=category,
        )
        
        # Verify event structure
        assert event['type'] == 'game_start'
        assert event['payload'] is not None
        
        # Property: category must be present and match input
        payload = event['payload']
        assert 'category' in payload, "game_start payload missing 'category' field"
        assert payload['category'] is not None, "game_start category is null"
        assert payload['category'] == category, f"Category mismatch: {payload['category']} != {category}"
    
    @given(category=category_strategy)
    @settings(max_examples=50)
    def test_lobby_state_default_category(self, category):
        """
        Property: lobby_state with explicit category should use that category.
        
        **Feature: nfl-trivia-category, Property 7: WebSocket Event Category Inclusion**
        **Validates: Requirements 4.4, 10.1**
        """
        event = build_lobby_state(
            lobby_id='test-lobby',
            status='waiting',
            players=[],
            can_start=False,
            host_id='test-host',
            category=category,
        )
        
        assert event['payload']['category'] == category
    
    def test_lobby_state_defaults_to_fortnite(self):
        """
        When no category is specified, lobby_state should default to 'fortnite'.
        
        **Feature: nfl-trivia-category, Property 7: WebSocket Event Category Inclusion**
        **Validates: Requirements 4.4, 10.1**
        """
        event = build_lobby_state(
            lobby_id='test-lobby',
            status='waiting',
            players=[],
            can_start=False,
            host_id='test-host',
            # No category specified - should default to 'fortnite'
        )
        
        assert event['payload']['category'] == 'fortnite'
    
    def test_game_start_defaults_to_fortnite(self):
        """
        When no category is specified, game_start should default to 'fortnite'.
        
        **Feature: nfl-trivia-category, Property 7: WebSocket Event Category Inclusion**
        **Validates: Requirements 10.2**
        """
        event = build_game_start(
            total_questions=10,
            players=[],
            player1_id='p1',
            player2_id='p2',
            # No category specified - should default to 'fortnite'
        )
        
        assert event['payload']['category'] == 'fortnite'


# =============================================================================
# Property 6: Lobby Category Immutability (Unit Test Version)
# =============================================================================

class TestLobbyCategoryImmutability:
    """
    Property 6: Lobby Category Immutability
    
    For any lobby, once created with a category, all questions served
    in that lobby should be from that category only.
    
    This is tested at the event builder level - the category passed to
    build_lobby_state and build_game_start should be preserved.
    
    **Validates: Requirements 4.1, 5.1, 5.2**
    """
    
    @given(
        category=category_strategy,
        num_events=st.integers(min_value=1, max_value=10),
    )
    @settings(max_examples=50)
    def test_category_preserved_across_events(self, category, num_events):
        """
        Property: Category should be preserved across multiple event builds.
        
        **Feature: nfl-trivia-category, Property 6: Lobby Category Immutability**
        **Validates: Requirements 4.1, 5.1, 5.2**
        """
        lobby_id = 'test-lobby'
        host_id = 'test-host'
        
        # Build multiple lobby_state events with same category
        for i in range(num_events):
            event = build_lobby_state(
                lobby_id=lobby_id,
                status='waiting',
                players=[],
                can_start=False,
                host_id=host_id,
                category=category,
            )
            
            # Category should always match
            assert event['payload']['category'] == category, \
                f"Event {i}: Category changed from {category} to {event['payload']['category']}"
    
    @given(
        category=category_strategy,
    )
    @settings(max_examples=50)
    def test_game_start_preserves_lobby_category(self, category):
        """
        Property: game_start event should preserve the lobby's category.
        
        **Feature: nfl-trivia-category, Property 6: Lobby Category Immutability**
        **Validates: Requirements 4.1, 5.1, 5.2**
        """
        # Simulate lobby creation with category
        lobby_state = build_lobby_state(
            lobby_id='test-lobby',
            status='waiting',
            players=[],
            can_start=True,
            host_id='host',
            category=category,
        )
        
        # Simulate game start with same category
        game_start = build_game_start(
            total_questions=10,
            players=[],
            player1_id='p1',
            player2_id='p2',
            category=category,
        )
        
        # Both events should have same category
        assert lobby_state['payload']['category'] == game_start['payload']['category'], \
            "Category mismatch between lobby_state and game_start"
        assert game_start['payload']['category'] == category
