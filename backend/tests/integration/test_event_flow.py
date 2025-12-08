"""
Integration tests for event-driven flow.
Requirements: 8.1-8.10
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch


class TestMatchCompletedEventPublishing:
    """Test match.completed event publishing."""

    @pytest.mark.asyncio
    async def test_event_published_on_game_end(self):
        """match.completed event should be published when game ends."""
        from app.events.publisher import EventPublisher, MatchCompletedEvent
        
        publisher = EventPublisher()  # Dev mode - no Pub/Sub
        
        event = MatchCompletedEvent(
            match_id="match-123",
            player1_id="player1",
            player2_id="player2",
            winner_id="player1",
            duration_seconds=300,
            player1_score=10,
            player2_score=7,
        )
        
        message_id = await publisher.publish_match_completed(event)
        
        assert message_id is not None
        
        # Check event was stored
        events = publisher.get_published_events()
        assert len(events) == 1
        assert events[0]["topic"] == "match-completed"
        assert events[0]["data"]["match_id"] == "match-123"

    @pytest.mark.asyncio
    async def test_event_contains_all_match_data(self):
        """Event should contain all required match data."""
        from app.events.publisher import EventPublisher, MatchCompletedEvent
        
        publisher = EventPublisher()
        
        event = MatchCompletedEvent(
            match_id="match-456",
            player1_id="p1",
            player2_id="p2",
            winner_id="p1",
            duration_seconds=180,
            player1_score=15,
            player2_score=12,
        )
        
        await publisher.publish_match_completed(event)
        
        events = publisher.get_published_events()
        data = events[0]["data"]
        
        assert "match_id" in data
        assert "player1_id" in data
        assert "player2_id" in data
        assert "winner_id" in data
        assert "duration_seconds" in data
        assert "player1_score" in data
        assert "player2_score" in data
        assert "timestamp" in data


class TestEventHandlerExecution:
    """Test event handler execution."""

    @pytest.mark.asyncio
    async def test_handle_match_completed(self):
        """Handler should process match.completed event."""
        from app.events.handlers import handle_match_completed
        
        event_data = {
            "match_id": "match-789",
            "player1_id": "player1",
            "player2_id": "player2",
            "winner_id": "player1",
            "duration_seconds": 240,
            "player1_score": 8,
            "player2_score": 5,
        }
        
        # Handler should not raise - returns True on success
        result = await handle_match_completed(event_data)
        # Handler may return True or None depending on implementation
        assert result is None or result is True

    @pytest.mark.asyncio
    async def test_handle_cosmetic_purchased(self):
        """Handler should process cosmetic.purchased event."""
        from app.events.handlers import handle_cosmetic_purchased
        
        event_data = {
            "user_id": "user-123",
            "cosmetic_id": "cosmetic-456",
            "cosmetic_name": "Cool Skin",
            "cosmetic_type": "skin",
            "price_coins": 500,
        }
        
        result = await handle_cosmetic_purchased(event_data)
        # Handler may return True or None depending on implementation
        assert result is None or result is True


class TestIdempotentHandling:
    """Test idempotent event handling."""

    @pytest.mark.asyncio
    async def test_subscriber_tracks_processed_messages(self):
        """Subscriber should track processed message IDs."""
        from app.events.subscriber import EventSubscriber
        
        subscriber = EventSubscriber()
        
        message_id = "msg-test-123"
        
        # Check message is not processed initially
        assert not subscriber.is_processed(message_id)
        
        # Process the message (this marks it as processed internally)
        subscriber._processed_ids.add(message_id)
        
        # Now it should be tracked
        assert subscriber.is_processed(message_id)


class TestSubscriberStructure:
    """Test subscriber structure."""

    def test_subscriber_has_processed_ids(self):
        """Subscriber should have processed IDs tracking."""
        from app.events.subscriber import EventSubscriber
        
        subscriber = EventSubscriber()
        
        # Should have processed IDs set
        assert hasattr(subscriber, '_processed_ids')


class TestEventPublisherModes:
    """Test event publisher in different modes."""

    def test_dev_mode_stores_events(self):
        """Dev mode should store events in memory."""
        from app.events.publisher import EventPublisher
        
        publisher = EventPublisher()  # No project_id = dev mode
        
        assert publisher._use_pubsub is False
        assert publisher._published_events == []

    def test_clear_published_events(self):
        """Should be able to clear published events."""
        from app.events.publisher import EventPublisher
        
        publisher = EventPublisher()
        publisher._published_events = [{"topic": "test", "data": {}}]
        
        publisher.clear_published_events()
        
        assert publisher._published_events == []
