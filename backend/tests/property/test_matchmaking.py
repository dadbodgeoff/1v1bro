"""
Property-based tests for matchmaking system.
Tests correctness properties defined in design document.
"""

import asyncio
from datetime import datetime, timedelta
from typing import List
from uuid import uuid4

import pytest
from hypothesis import given, strategies as st, settings, assume

from app.matchmaking.models import MatchTicket, QueueStatus, CooldownInfo
from app.matchmaking.queue_manager import QueueManager


# ============================================
# Test Helpers
# ============================================

def make_ticket(
    player_id: str = None,
    player_name: str = "TestPlayer",
    queue_time: datetime = None,
) -> MatchTicket:
    """Create a test ticket with defaults."""
    return MatchTicket(
        player_id=player_id or str(uuid4()),
        player_name=player_name,
        queue_time=queue_time or datetime.utcnow(),
    )


def make_tickets_with_times(count: int, base_time: datetime = None) -> List[MatchTicket]:
    """Create tickets with sequential queue times (oldest first)."""
    base = base_time or datetime.utcnow()
    return [
        make_ticket(
            player_id=str(uuid4()),
            player_name=f"Player{i}",
            queue_time=base + timedelta(seconds=i),
        )
        for i in range(count)
    ]


# ============================================
# Property 1: No Duplicate Queue Entries
# ============================================

class TestNoDuplicateEntries:
    """
    Property 1: No Duplicate Queue Entries
    
    For any player who is already in the queue, attempting to join again
    SHALL be rejected, and the queue size SHALL remain unchanged.
    """
    
    @pytest.mark.asyncio
    async def test_duplicate_rejected(self):
        """Adding same player twice should fail."""
        manager = QueueManager()
        ticket = make_ticket()
        
        # First add succeeds
        result1 = await manager.add(ticket)
        assert result1 is True
        assert manager.get_queue_size() == 1
        
        # Second add fails
        result2 = await manager.add(ticket)
        assert result2 is False
        assert manager.get_queue_size() == 1  # Size unchanged
    
    @pytest.mark.asyncio
    @given(st.integers(min_value=1, max_value=10))
    @settings(max_examples=20)
    async def test_duplicate_rejected_property(self, num_attempts: int):
        """Property: duplicate adds never increase queue size."""
        manager = QueueManager()
        ticket = make_ticket()
        
        # First add
        await manager.add(ticket)
        initial_size = manager.get_queue_size()
        
        # Multiple duplicate attempts
        for _ in range(num_attempts):
            result = await manager.add(ticket)
            assert result is False
            assert manager.get_queue_size() == initial_size
    
    @pytest.mark.asyncio
    async def test_different_players_allowed(self):
        """Different players can join queue."""
        manager = QueueManager()
        
        ticket1 = make_ticket(player_id="player1")
        ticket2 = make_ticket(player_id="player2")
        
        result1 = await manager.add(ticket1)
        result2 = await manager.add(ticket2)
        
        assert result1 is True
        assert result2 is True
        assert manager.get_queue_size() == 2


# ============================================
# Property 2: FIFO Ordering Preserved
# ============================================

class TestFIFOOrdering:
    """
    Property 2: FIFO Ordering Preserved
    
    For any queue with N players, when a match is created, the two players
    with the earliest queue_time SHALL be selected.
    """
    
    @pytest.mark.asyncio
    async def test_fifo_basic(self):
        """Oldest two players should be matched."""
        manager = QueueManager()
        
        base_time = datetime.utcnow()
        tickets = [
            make_ticket(player_id="oldest", queue_time=base_time),
            make_ticket(player_id="middle", queue_time=base_time + timedelta(seconds=1)),
            make_ticket(player_id="newest", queue_time=base_time + timedelta(seconds=2)),
        ]
        
        for t in tickets:
            await manager.add(t)
        
        match = await manager.find_match()
        assert match is not None
        
        player1, player2 = match
        matched_ids = {player1.player_id, player2.player_id}
        
        # Should match oldest and middle, not newest
        assert matched_ids == {"oldest", "middle"}
    
    @pytest.mark.asyncio
    @given(st.integers(min_value=2, max_value=20))
    @settings(max_examples=20)
    async def test_fifo_property(self, queue_size: int):
        """Property: match always selects two oldest players."""
        manager = QueueManager()
        
        tickets = make_tickets_with_times(queue_size)
        for t in tickets:
            await manager.add(t)
        
        match = await manager.find_match()
        assert match is not None
        
        player1, player2 = match
        matched_times = {player1.queue_time, player2.queue_time}
        expected_times = {tickets[0].queue_time, tickets[1].queue_time}
        
        assert matched_times == expected_times
    
    @pytest.mark.asyncio
    async def test_position_reflects_fifo(self):
        """Queue position should reflect FIFO order."""
        manager = QueueManager()
        
        tickets = make_tickets_with_times(5)
        for t in tickets:
            await manager.add(t)
        
        # Check positions
        for i, ticket in enumerate(tickets):
            position = await manager.get_position(ticket.player_id)
            assert position == i + 1  # 1-indexed


# ============================================
# Property 3: Atomic Match Removal
# ============================================

class TestAtomicMatchRemoval:
    """
    Property 3: Atomic Match Removal
    
    For any match created, both matched players SHALL be removed from
    the queue atomically - the queue size SHALL decrease by exactly 2.
    """
    
    @pytest.mark.asyncio
    async def test_match_removes_both(self):
        """Match should remove exactly 2 players."""
        manager = QueueManager()
        
        tickets = make_tickets_with_times(4)
        for t in tickets:
            await manager.add(t)
        
        initial_size = manager.get_queue_size()
        assert initial_size == 4
        
        match = await manager.find_match()
        assert match is not None
        
        final_size = manager.get_queue_size()
        assert final_size == initial_size - 2
    
    @pytest.mark.asyncio
    @given(st.integers(min_value=2, max_value=20))
    @settings(max_examples=20)
    async def test_atomic_removal_property(self, queue_size: int):
        """Property: each match reduces queue by exactly 2."""
        manager = QueueManager()
        
        tickets = make_tickets_with_times(queue_size)
        for t in tickets:
            await manager.add(t)
        
        initial_size = manager.get_queue_size()
        
        match = await manager.find_match()
        assert match is not None
        
        assert manager.get_queue_size() == initial_size - 2
    
    @pytest.mark.asyncio
    async def test_matched_players_not_in_queue(self):
        """Matched players should no longer be in queue."""
        manager = QueueManager()
        
        tickets = make_tickets_with_times(3)
        for t in tickets:
            await manager.add(t)
        
        match = await manager.find_match()
        player1, player2 = match
        
        # Matched players should not be in queue
        assert await manager.contains(player1.player_id) is False
        assert await manager.contains(player2.player_id) is False
        
        # Third player should still be in queue
        assert await manager.contains(tickets[2].player_id) is True
    
    @pytest.mark.asyncio
    async def test_no_match_with_one_player(self):
        """Cannot match with only one player."""
        manager = QueueManager()
        
        ticket = make_ticket()
        await manager.add(ticket)
        
        match = await manager.find_match()
        assert match is None
        assert manager.get_queue_size() == 1  # Player still in queue


# ============================================
# Property 4: Ticket Persistence Round-Trip
# ============================================

class TestTicketPersistence:
    """
    Property 4: Ticket Persistence Round-Trip
    
    For any MatchTicket saved to the database, restoring it SHALL
    preserve the original queue_time timestamp exactly.
    """
    
    def test_to_dict_from_dict_roundtrip(self):
        """Ticket should survive dict conversion."""
        original = make_ticket(
            player_id="test-player",
            player_name="TestName",
            queue_time=datetime(2024, 12, 5, 10, 30, 45),
        )
        
        # Convert to dict and back
        data = original.to_dict()
        restored = MatchTicket.from_dict(data)
        
        assert restored.player_id == original.player_id
        assert restored.player_name == original.player_name
        assert restored.game_mode == original.game_mode
        # Queue time should be preserved
        assert restored.queue_time.replace(tzinfo=None) == original.queue_time.replace(tzinfo=None)
    
    @given(
        player_id=st.uuids().map(str),
        player_name=st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=('L', 'N'))),
    )
    @settings(max_examples=20)
    def test_roundtrip_property(self, player_id: str, player_name: str):
        """Property: any ticket survives dict roundtrip."""
        assume(len(player_name.strip()) > 0)
        
        original = make_ticket(
            player_id=player_id,
            player_name=player_name,
        )
        
        data = original.to_dict()
        restored = MatchTicket.from_dict(data)
        
        assert restored.player_id == original.player_id
        assert restored.player_name == original.player_name
    
    @pytest.mark.asyncio
    async def test_restore_preserves_order(self):
        """Restored tickets should maintain FIFO order."""
        manager = QueueManager()
        
        tickets = make_tickets_with_times(5)
        
        # Restore tickets
        await manager.restore_tickets(tickets)
        
        # Check order is preserved
        for i, ticket in enumerate(tickets):
            position = await manager.get_position(ticket.player_id)
            assert position == i + 1


# ============================================
# Property 8: Queue Cancellation Removes Ticket
# ============================================

class TestQueueCancellation:
    """
    Property 8: Queue Cancellation Removes Ticket
    
    For any player who cancels their queue, their ticket SHALL be
    removed from the in-memory queue.
    """
    
    @pytest.mark.asyncio
    async def test_cancel_removes_ticket(self):
        """Cancellation should remove player from queue."""
        manager = QueueManager()
        
        ticket = make_ticket()
        await manager.add(ticket)
        
        assert await manager.contains(ticket.player_id) is True
        
        removed = await manager.remove(ticket.player_id)
        
        assert removed is not None
        assert removed.player_id == ticket.player_id
        assert await manager.contains(ticket.player_id) is False
    
    @pytest.mark.asyncio
    async def test_cancel_nonexistent_returns_none(self):
        """Cancelling non-queued player returns None."""
        manager = QueueManager()
        
        removed = await manager.remove("nonexistent-player")
        assert removed is None
    
    @pytest.mark.asyncio
    async def test_cancel_decreases_size(self):
        """Cancellation should decrease queue size by 1."""
        manager = QueueManager()
        
        tickets = make_tickets_with_times(3)
        for t in tickets:
            await manager.add(t)
        
        initial_size = manager.get_queue_size()
        
        await manager.remove(tickets[1].player_id)
        
        assert manager.get_queue_size() == initial_size - 1


# ============================================
# Model Tests
# ============================================

class TestMatchTicketModel:
    """Tests for MatchTicket model."""
    
    def test_wait_seconds(self):
        """wait_seconds should calculate elapsed time."""
        past_time = datetime.utcnow() - timedelta(seconds=30)
        ticket = make_ticket(queue_time=past_time)
        
        # Should be approximately 30 seconds
        assert 29 <= ticket.wait_seconds <= 31
    
    def test_default_game_mode(self):
        """Default game mode should be fortnite."""
        ticket = make_ticket()
        assert ticket.game_mode == "fortnite"


class TestQueueStatusModel:
    """Tests for QueueStatus model."""
    
    def test_to_dict(self):
        """QueueStatus should convert to dict correctly."""
        status = QueueStatus(
            in_queue=True,
            position=3,
            wait_seconds=45,
            estimated_wait=60,
            queue_size=10,
        )
        
        data = status.to_dict()
        
        assert data["in_queue"] is True
        assert data["position"] == 3
        assert data["wait_seconds"] == 45
        assert data["estimated_wait"] == 60
        assert data["queue_size"] == 10


class TestCooldownInfoModel:
    """Tests for CooldownInfo model."""
    
    def test_is_active_true(self):
        """is_active should be True when remaining > 0."""
        cooldown = CooldownInfo(
            cooldown_until=datetime.utcnow() + timedelta(minutes=5),
            reason="early_leave",
            remaining_seconds=300,
        )
        assert cooldown.is_active is True
    
    def test_is_active_false(self):
        """is_active should be False when remaining = 0."""
        cooldown = CooldownInfo(
            cooldown_until=datetime.utcnow() - timedelta(minutes=5),
            reason="early_leave",
            remaining_seconds=0,
        )
        assert cooldown.is_active is False
