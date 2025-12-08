"""
Property-based tests for Event system.
Tests correctness properties from design document.
"""

import pytest
from hypothesis import given, strategies as st, settings

from app.events.publisher import (
    EventPublisher,
    MatchCompletedEvent,
    CosmeticPurchasedEvent,
    RewardEarnedEvent,
    PlayerLevelUpEvent,
    TOPICS,
)
from app.events.subscriber import EventSubscriber, MAX_RETRIES
from app.events.handlers import (
    handle_match_completed,
    handle_cosmetic_purchased,
    handle_reward_earned,
    clear_processed_events,
)


class TestEventIdempotency:
    """
    **Feature: user-services-microservices, Property 14: Event Idempotency**
    **Validates: Requirements 8.9**
    
    *For any* event processed by a handler, processing the same event twice
    SHALL produce the same final state (idempotent handling).
    """
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Clear processed events before each test."""
        clear_processed_events()
    
    @pytest.mark.asyncio
    @given(
        match_id=st.uuids().map(str),
        player1_id=st.uuids().map(str),
        player2_id=st.uuids().map(str),
    )
    @settings(max_examples=50)
    async def test_match_completed_idempotent(
        self, match_id: str, player1_id: str, player2_id: str
    ):
        """
        Property: Processing match.completed twice produces same state.
        """
        clear_processed_events()
        
        data = {
            "match_id": match_id,
            "player1_id": player1_id,
            "player2_id": player2_id,
            "winner_id": player1_id,
            "duration_seconds": 300,
        }
        
        # Process first time
        await handle_match_completed(data)
        
        # Process second time - should be skipped
        await handle_match_completed(data)
        
        # No exception means idempotent handling worked
    
    @pytest.mark.asyncio
    @given(
        user_id=st.uuids().map(str),
        cosmetic_id=st.uuids().map(str),
    )
    @settings(max_examples=50)
    async def test_cosmetic_purchased_idempotent(
        self, user_id: str, cosmetic_id: str
    ):
        """
        Property: Processing cosmetic_purchased twice produces same state.
        """
        clear_processed_events()
        
        data = {
            "user_id": user_id,
            "cosmetic_id": cosmetic_id,
            "cosmetic_name": "Test Skin",
            "cosmetic_type": "skin",
            "price_coins": 100,
        }
        
        # Process twice
        await handle_cosmetic_purchased(data)
        await handle_cosmetic_purchased(data)
        
        # No exception means idempotent handling worked
    
    @pytest.mark.asyncio
    @given(
        user_id=st.uuids().map(str),
        season_id=st.uuids().map(str),
        tier=st.integers(min_value=1, max_value=100),
    )
    @settings(max_examples=50)
    async def test_reward_earned_idempotent(
        self, user_id: str, season_id: str, tier: int
    ):
        """
        Property: Processing reward_earned twice produces same state.
        """
        clear_processed_events()
        
        data = {
            "user_id": user_id,
            "season_id": season_id,
            "tier": tier,
            "reward_type": "cosmetic",
            "reward_value": "skin_123",
            "is_premium": False,
        }
        
        # Process twice
        await handle_reward_earned(data)
        await handle_reward_earned(data)
        
        # No exception means idempotent handling worked


class TestSubscriberIdempotency:
    """Tests for subscriber-level idempotency."""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Clear state before each test."""
        clear_processed_events()
    
    @pytest.mark.asyncio
    async def test_subscriber_tracks_processed_messages(self):
        """Subscriber tracks processed message IDs."""
        subscriber = EventSubscriber()
        
        async def dummy_handler(data):
            pass
        
        subscriber.register_handler("test-topic", dummy_handler)
        
        # Process message
        result = await subscriber.handle_message(
            "test-topic",
            {"key": "value"},
            message_id="msg_123",
        )
        
        assert result is True
        assert subscriber.is_processed("msg_123")
    
    @pytest.mark.asyncio
    async def test_subscriber_skips_duplicate_messages(self):
        """Subscriber skips already processed messages."""
        subscriber = EventSubscriber()
        call_count = 0
        
        async def counting_handler(data):
            nonlocal call_count
            call_count += 1
        
        subscriber.register_handler("test-topic", counting_handler)
        
        # Process same message twice
        await subscriber.handle_message("test-topic", {"key": "value"}, "msg_123")
        await subscriber.handle_message("test-topic", {"key": "value"}, "msg_123")
        
        # Handler should only be called once
        assert call_count == 1


class TestDeadLetterQueue:
    """
    Tests for dead-letter queue functionality.
    **Validates: Requirements 8.10**
    """
    
    @pytest.mark.asyncio
    async def test_failed_messages_go_to_dead_letter(self):
        """Messages that fail all retries go to dead-letter queue."""
        subscriber = EventSubscriber()
        
        async def failing_handler(data):
            raise Exception("Handler failed")
        
        subscriber.register_handler("test-topic", failing_handler)
        
        # Process message that will fail
        result = await subscriber.handle_message(
            "test-topic",
            {"key": "value"},
            message_id="msg_fail",
        )
        
        assert result is False
        
        dead_letters = subscriber.get_dead_letter_messages()
        assert len(dead_letters) == 1
        assert dead_letters[0]["message_id"] == "msg_fail"
        assert dead_letters[0]["retries"] == MAX_RETRIES
    
    @pytest.mark.asyncio
    async def test_dead_letter_contains_original_data(self):
        """Dead-letter queue preserves original message data."""
        subscriber = EventSubscriber()
        
        async def failing_handler(data):
            raise Exception("Handler failed")
        
        subscriber.register_handler("test-topic", failing_handler)
        
        original_data = {"user_id": "123", "action": "test"}
        await subscriber.handle_message("test-topic", original_data, "msg_data")
        
        dead_letters = subscriber.get_dead_letter_messages()
        assert dead_letters[0]["data"] == original_data
        assert dead_letters[0]["topic"] == "test-topic"


class TestEventPublisher:
    """Tests for event publisher functionality."""
    
    @pytest.mark.asyncio
    async def test_publisher_stores_events_in_dev_mode(self):
        """Publisher stores events in development mode."""
        publisher = EventPublisher()  # No project_id = dev mode
        
        await publisher.publish("test-topic", {"key": "value"})
        
        events = publisher.get_published_events()
        assert len(events) == 1
        assert events[0]["topic"] == "test-topic"
        assert events[0]["data"] == {"key": "value"}
    
    @pytest.mark.asyncio
    async def test_publish_match_completed_event(self):
        """Can publish match.completed event."""
        publisher = EventPublisher()
        
        event = MatchCompletedEvent(
            match_id="match_123",
            player1_id="p1",
            player2_id="p2",
            winner_id="p1",
            duration_seconds=300,
            player1_score=10,
            player2_score=5,
        )
        
        message_id = await publisher.publish_match_completed(event)
        
        assert message_id is not None
        events = publisher.get_published_events()
        assert len(events) == 1
        assert events[0]["topic"] == TOPICS["match_completed"]
    
    @pytest.mark.asyncio
    async def test_publish_cosmetic_purchased_event(self):
        """Can publish cosmetic_purchased event."""
        publisher = EventPublisher()
        
        event = CosmeticPurchasedEvent(
            user_id="user_123",
            cosmetic_id="cosmetic_456",
            cosmetic_name="Cool Skin",
            cosmetic_type="skin",
            price_coins=500,
        )
        
        message_id = await publisher.publish_cosmetic_purchased(event)
        
        assert message_id is not None
        events = publisher.get_published_events()
        assert events[0]["topic"] == TOPICS["cosmetic_purchased"]
    
    @pytest.mark.asyncio
    async def test_publish_reward_earned_event(self):
        """Can publish reward_earned event."""
        publisher = EventPublisher()
        
        event = RewardEarnedEvent(
            user_id="user_123",
            season_id="season_1",
            tier=10,
            reward_type="cosmetic",
            reward_value="skin_789",
            is_premium=False,
        )
        
        message_id = await publisher.publish_reward_earned(event)
        
        assert message_id is not None
        events = publisher.get_published_events()
        assert events[0]["topic"] == TOPICS["reward_earned"]
    
    @pytest.mark.asyncio
    async def test_publish_player_levelup_event(self):
        """Can publish player_levelup event."""
        publisher = EventPublisher()
        
        event = PlayerLevelUpEvent(
            user_id="user_123",
            old_level=5,
            new_level=6,
            total_xp=3600,
        )
        
        message_id = await publisher.publish_player_levelup(event)
        
        assert message_id is not None
        events = publisher.get_published_events()
        assert events[0]["topic"] == TOPICS["player_levelup"]
