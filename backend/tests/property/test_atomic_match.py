"""
Property-based tests for atomic match creation.

Tests correctness properties for match creation with rollback.

**Feature: matchmaking-hardening**
"""

import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Set, Tuple
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from hypothesis import given, strategies as st, settings, assume

from app.matchmaking.models import MatchTicket, MatchResult, HealthCheckResult
from app.matchmaking.atomic_match import AtomicMatchCreator
from app.matchmaking.health_checker import ConnectionHealthChecker


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


class MockHealthChecker:
    """Mock health checker for testing."""
    
    def __init__(self):
        self._health_results: Dict[str, bool] = {}
        self._latencies: Dict[str, float] = {}
    
    def set_healthy(self, user_id: str, healthy: bool = True, latency: float = 10.0):
        """Set health status for a user."""
        self._health_results[user_id] = healthy
        self._latencies[user_id] = latency
    
    async def verify_health(self, user_id: str, timeout: float = 2.0) -> HealthCheckResult:
        """Return configured health result."""
        healthy = self._health_results.get(user_id, False)
        return HealthCheckResult(
            user_id=user_id,
            healthy=healthy,
            latency_ms=self._latencies.get(user_id) if healthy else None,
            failure_reason=None if healthy else "not_connected",
        )
    
    async def verify_both_healthy(
        self,
        user_id_1: str,
        user_id_2: str,
        timeout: float = None,
    ) -> tuple:
        """Verify both players."""
        result1 = await self.verify_health(user_id_1)
        result2 = await self.verify_health(user_id_2)
        both_healthy = result1.healthy and result2.healthy
        return both_healthy, result1, result2


class MockConnectionManager:
    """Mock connection manager for testing notifications."""
    
    def __init__(self):
        self._connected_users: Set[str] = set()
        self._sent_messages: List[Tuple[str, dict]] = []
        self._should_fail_send: Set[str] = set()
    
    def set_connected(self, user_id: str, connected: bool = True):
        """Set connection status."""
        if connected:
            self._connected_users.add(user_id)
        else:
            self._connected_users.discard(user_id)
    
    def set_send_fails(self, user_id: str, fails: bool = True):
        """Set whether sending to user fails."""
        if fails:
            self._should_fail_send.add(user_id)
        else:
            self._should_fail_send.discard(user_id)
    
    async def send_to_user(self, user_id: str, message: dict) -> bool:
        """Send message to user."""
        if user_id in self._should_fail_send:
            return False
        if user_id not in self._connected_users:
            return False
        self._sent_messages.append((user_id, message))
        return True
    
    def get_sent_messages(self, user_id: str = None) -> List[Tuple[str, dict]]:
        """Get sent messages, optionally filtered by user."""
        if user_id:
            return [(uid, msg) for uid, msg in self._sent_messages if uid == user_id]
        return self._sent_messages


class MockLobbyService:
    """Mock lobby service for testing."""
    
    def __init__(self):
        self._lobbies: Dict[str, dict] = {}
        self._should_fail = False
    
    def set_should_fail(self, fail: bool = True):
        """Set whether lobby creation should fail."""
        self._should_fail = fail
    
    async def create_lobby(self, host_id: str, game_mode: str, category: str, map_slug: str) -> dict:
        """Create a mock lobby."""
        if self._should_fail:
            raise Exception("Lobby creation failed")
        
        code = f"TEST{len(self._lobbies):04d}"
        lobby = {
            "code": code,
            "host_id": host_id,
            "game_mode": game_mode,
            "players": [host_id],
        }
        self._lobbies[code] = lobby
        return lobby
    
    async def join_lobby(self, code: str, player_id: str) -> dict:
        """Join a mock lobby."""
        lobby = self._lobbies.get(code)
        if lobby:
            lobby["players"].append(player_id)
        return lobby
    
    async def leave_lobby(self, code: str, player_id: str) -> None:
        """Leave a mock lobby."""
        lobby = self._lobbies.get(code)
        if lobby and player_id in lobby["players"]:
            lobby["players"].remove(player_id)


class MockRepo:
    """Mock repository for testing."""
    
    def __init__(self):
        self._ticket_statuses: Dict[str, str] = {}
    
    async def update_ticket_status(self, player_id: str, status: str) -> None:
        """Update ticket status."""
        self._ticket_statuses[player_id] = status


# ============================================
# Property 1: Pre-match Connection Verification
# ============================================

class TestPreMatchVerification:
    """
    **Feature: matchmaking-hardening, Property 1: Pre-match connection verification**
    
    For any two players matched by the queue manager, both players must have
    verified healthy connections before any lobby is created.
    
    **Validates: Requirements 1.1**
    """
    
    @pytest.mark.asyncio
    async def test_both_healthy_creates_match(self):
        """Match should be created when both players are healthy."""
        health_checker = MockHealthChecker()
        conn_manager = MockConnectionManager()
        lobby_service = MockLobbyService()
        repo = MockRepo()
        
        player1 = make_ticket(player_id="p1", player_name="Player1")
        player2 = make_ticket(player_id="p2", player_name="Player2")
        
        # Both players healthy and connected
        health_checker.set_healthy("p1", True)
        health_checker.set_healthy("p2", True)
        conn_manager.set_connected("p1", True)
        conn_manager.set_connected("p2", True)
        
        creator = AtomicMatchCreator(
            health_checker=health_checker,
            connection_manager=conn_manager,
        )
        
        result = await creator.create_match(player1, player2, lobby_service, repo)
        
        assert result.success is True
        assert result.lobby_code is not None
        assert result.player1_notified is True
        assert result.player2_notified is True
    
    @pytest.mark.asyncio
    async def test_unhealthy_player1_no_match(self):
        """Match should not be created when player1 is unhealthy."""
        health_checker = MockHealthChecker()
        conn_manager = MockConnectionManager()
        lobby_service = MockLobbyService()
        repo = MockRepo()
        
        player1 = make_ticket(player_id="p1", player_name="Player1")
        player2 = make_ticket(player_id="p2", player_name="Player2")
        
        # Player1 unhealthy
        health_checker.set_healthy("p1", False)
        health_checker.set_healthy("p2", True)
        conn_manager.set_connected("p2", True)
        
        creator = AtomicMatchCreator(
            health_checker=health_checker,
            connection_manager=conn_manager,
        )
        
        result = await creator.create_match(player1, player2, lobby_service, repo)
        
        assert result.success is False
        assert result.lobby_code is None
        assert "player1_unhealthy" in result.failure_reason
    
    @pytest.mark.asyncio
    async def test_unhealthy_player2_no_match(self):
        """Match should not be created when player2 is unhealthy."""
        health_checker = MockHealthChecker()
        conn_manager = MockConnectionManager()
        lobby_service = MockLobbyService()
        repo = MockRepo()
        
        player1 = make_ticket(player_id="p1", player_name="Player1")
        player2 = make_ticket(player_id="p2", player_name="Player2")
        
        # Player2 unhealthy
        health_checker.set_healthy("p1", True)
        health_checker.set_healthy("p2", False)
        conn_manager.set_connected("p1", True)
        
        creator = AtomicMatchCreator(
            health_checker=health_checker,
            connection_manager=conn_manager,
        )
        
        result = await creator.create_match(player1, player2, lobby_service, repo)
        
        assert result.success is False
        assert result.lobby_code is None
        assert "player2_unhealthy" in result.failure_reason
    
    @pytest.mark.asyncio
    @given(
        p1_healthy=st.booleans(),
        p2_healthy=st.booleans(),
    )
    @settings(max_examples=20)
    async def test_verification_property(self, p1_healthy: bool, p2_healthy: bool):
        """
        Property: match succeeds iff both players are healthy.
        
        **Feature: matchmaking-hardening, Property 1: Pre-match connection verification**
        **Validates: Requirements 1.1**
        """
        health_checker = MockHealthChecker()
        conn_manager = MockConnectionManager()
        lobby_service = MockLobbyService()
        repo = MockRepo()
        
        player1 = make_ticket(player_id="p1", player_name="Player1")
        player2 = make_ticket(player_id="p2", player_name="Player2")
        
        health_checker.set_healthy("p1", p1_healthy)
        health_checker.set_healthy("p2", p2_healthy)
        
        # Set connected for healthy players
        if p1_healthy:
            conn_manager.set_connected("p1", True)
        if p2_healthy:
            conn_manager.set_connected("p2", True)
        
        creator = AtomicMatchCreator(
            health_checker=health_checker,
            connection_manager=conn_manager,
        )
        
        result = await creator.create_match(player1, player2, lobby_service, repo)
        
        # Property: success iff both healthy
        expected_success = p1_healthy and p2_healthy
        assert result.success == expected_success


# ============================================
# Property 2: Disconnected Player Skip and Re-queue
# ============================================

class TestDisconnectedPlayerHandling:
    """
    **Feature: matchmaking-hardening, Property 2: Disconnected player skip and re-queue**
    
    For any match attempt where one player's connection is unhealthy,
    the healthy player must be re-queued and the unhealthy player must be removed.
    
    **Validates: Requirements 1.2, 1.4**
    """
    
    @pytest.mark.asyncio
    async def test_healthy_player_requeued_when_opponent_unhealthy(self):
        """Healthy player should be re-queued when opponent is unhealthy."""
        health_checker = MockHealthChecker()
        conn_manager = MockConnectionManager()
        lobby_service = MockLobbyService()
        repo = MockRepo()
        
        player1 = make_ticket(player_id="p1", player_name="Player1")
        player2 = make_ticket(player_id="p2", player_name="Player2")
        
        # Player1 unhealthy, Player2 healthy
        health_checker.set_healthy("p1", False)
        health_checker.set_healthy("p2", True)
        conn_manager.set_connected("p2", True)
        
        creator = AtomicMatchCreator(
            health_checker=health_checker,
            connection_manager=conn_manager,
        )
        
        result = await creator.create_match(player1, player2, lobby_service, repo)
        
        assert result.success is False
        assert result.rollback_performed is True
        assert result.requeued_player_id == "p2"
    
    @pytest.mark.asyncio
    async def test_match_cancelled_notification_sent(self):
        """Healthy player should receive match_cancelled notification."""
        health_checker = MockHealthChecker()
        conn_manager = MockConnectionManager()
        lobby_service = MockLobbyService()
        repo = MockRepo()
        
        player1 = make_ticket(player_id="p1", player_name="Player1")
        player2 = make_ticket(player_id="p2", player_name="Player2")
        
        # Player1 unhealthy, Player2 healthy
        health_checker.set_healthy("p1", False)
        health_checker.set_healthy("p2", True)
        conn_manager.set_connected("p2", True)
        
        creator = AtomicMatchCreator(
            health_checker=health_checker,
            connection_manager=conn_manager,
        )
        
        await creator.create_match(player1, player2, lobby_service, repo)
        
        # Check that match_cancelled was sent to player2
        messages = conn_manager.get_sent_messages("p2")
        assert len(messages) > 0
        
        cancelled_msgs = [m for _, m in messages if m.get("type") == "match_cancelled"]
        assert len(cancelled_msgs) == 1
        assert cancelled_msgs[0]["payload"]["reason"] == "opponent_disconnected"
    
    @pytest.mark.asyncio
    @given(
        p1_healthy=st.booleans(),
        p2_healthy=st.booleans(),
    )
    @settings(max_examples=20)
    async def test_requeue_property(self, p1_healthy: bool, p2_healthy: bool):
        """
        Property: exactly one player is re-queued when exactly one is unhealthy.
        
        **Feature: matchmaking-hardening, Property 2: Disconnected player skip and re-queue**
        **Validates: Requirements 1.2, 1.4**
        """
        # Skip if both healthy (success case) or both unhealthy (no requeue)
        assume(p1_healthy != p2_healthy)
        
        health_checker = MockHealthChecker()
        conn_manager = MockConnectionManager()
        lobby_service = MockLobbyService()
        repo = MockRepo()
        
        player1 = make_ticket(player_id="p1", player_name="Player1")
        player2 = make_ticket(player_id="p2", player_name="Player2")
        
        health_checker.set_healthy("p1", p1_healthy)
        health_checker.set_healthy("p2", p2_healthy)
        
        if p1_healthy:
            conn_manager.set_connected("p1", True)
        if p2_healthy:
            conn_manager.set_connected("p2", True)
        
        creator = AtomicMatchCreator(
            health_checker=health_checker,
            connection_manager=conn_manager,
        )
        
        result = await creator.create_match(player1, player2, lobby_service, repo)
        
        # Property: healthy player is re-queued
        assert result.rollback_performed is True
        expected_requeued = "p1" if p1_healthy else "p2"
        assert result.requeued_player_id == expected_requeued


# ============================================
# Property 4: Atomic Rollback with Position Preservation
# ============================================

class TestAtomicRollback:
    """
    **Feature: matchmaking-hardening, Property 4: Atomic match rollback with position preservation**
    
    For any match creation where notification fails for one player,
    the successfully-notified player must be re-queued at their original position
    and the lobby must be cancelled.
    
    **Validates: Requirements 2.2, 2.4**
    """
    
    @pytest.mark.asyncio
    async def test_notification_failure_triggers_rollback(self):
        """Notification failure should trigger rollback."""
        health_checker = MockHealthChecker()
        conn_manager = MockConnectionManager()
        lobby_service = MockLobbyService()
        repo = MockRepo()
        
        player1 = make_ticket(player_id="p1", player_name="Player1")
        player2 = make_ticket(player_id="p2", player_name="Player2")
        
        # Both healthy
        health_checker.set_healthy("p1", True)
        health_checker.set_healthy("p2", True)
        
        # Player1 connected, Player2 notification fails
        conn_manager.set_connected("p1", True)
        conn_manager.set_connected("p2", True)
        conn_manager.set_send_fails("p2", True)
        
        creator = AtomicMatchCreator(
            health_checker=health_checker,
            connection_manager=conn_manager,
        )
        
        result = await creator.create_match(player1, player2, lobby_service, repo)
        
        assert result.success is False
        assert result.rollback_performed is True
        assert result.player1_notified is True
        assert result.player2_notified is False
        assert result.requeued_player_id == "p1"
    
    @pytest.mark.asyncio
    async def test_both_notification_failures_no_requeue(self):
        """Both notification failures should not re-queue either player."""
        health_checker = MockHealthChecker()
        conn_manager = MockConnectionManager()
        lobby_service = MockLobbyService()
        repo = MockRepo()
        
        player1 = make_ticket(player_id="p1", player_name="Player1")
        player2 = make_ticket(player_id="p2", player_name="Player2")
        
        # Both healthy but notifications fail
        health_checker.set_healthy("p1", True)
        health_checker.set_healthy("p2", True)
        conn_manager.set_connected("p1", True)
        conn_manager.set_connected("p2", True)
        conn_manager.set_send_fails("p1", True)
        conn_manager.set_send_fails("p2", True)
        
        creator = AtomicMatchCreator(
            health_checker=health_checker,
            connection_manager=conn_manager,
        )
        
        result = await creator.create_match(player1, player2, lobby_service, repo)
        
        assert result.success is False
        assert result.rollback_performed is True
        assert result.player1_notified is False
        assert result.player2_notified is False
        assert result.requeued_player_id is None  # Neither re-queued
    
    @pytest.mark.asyncio
    @given(
        p1_notified=st.booleans(),
        p2_notified=st.booleans(),
    )
    @settings(max_examples=20, deadline=5000)  # 5 second deadline for retry delays
    async def test_rollback_property(self, p1_notified: bool, p2_notified: bool):
        """
        Property: exactly one player is re-queued when exactly one notification succeeds.
        
        **Feature: matchmaking-hardening, Property 4: Atomic match rollback with position preservation**
        **Validates: Requirements 2.2, 2.4**
        """
        # Skip if both succeed (success case)
        assume(not (p1_notified and p2_notified))
        
        health_checker = MockHealthChecker()
        conn_manager = MockConnectionManager()
        lobby_service = MockLobbyService()
        repo = MockRepo()
        
        player1 = make_ticket(player_id="p1", player_name="Player1")
        player2 = make_ticket(player_id="p2", player_name="Player2")
        
        # Both healthy
        health_checker.set_healthy("p1", True)
        health_checker.set_healthy("p2", True)
        conn_manager.set_connected("p1", True)
        conn_manager.set_connected("p2", True)
        
        # Set notification failures
        if not p1_notified:
            conn_manager.set_send_fails("p1", True)
        if not p2_notified:
            conn_manager.set_send_fails("p2", True)
        
        creator = AtomicMatchCreator(
            health_checker=health_checker,
            connection_manager=conn_manager,
        )
        
        result = await creator.create_match(player1, player2, lobby_service, repo)
        
        assert result.success is False
        assert result.rollback_performed is True
        
        # Property: notified player is re-queued
        if p1_notified and not p2_notified:
            assert result.requeued_player_id == "p1"
        elif p2_notified and not p1_notified:
            assert result.requeued_player_id == "p2"
        else:
            # Neither notified - neither re-queued
            assert result.requeued_player_id is None



# ============================================
# Property 6: Match Cancelled Notification Content
# ============================================

class TestMatchCancelledNotification:
    """
    **Feature: matchmaking-hardening, Property 6: Match cancelled notification content**
    
    For any player re-queued due to opponent connection failure,
    they must receive a match_cancelled event with reason "opponent_disconnected".
    
    **Validates: Requirements 6.1**
    """
    
    @pytest.mark.asyncio
    async def test_notification_contains_correct_reason(self):
        """match_cancelled notification should have correct reason."""
        health_checker = MockHealthChecker()
        conn_manager = MockConnectionManager()
        lobby_service = MockLobbyService()
        repo = MockRepo()
        
        player1 = make_ticket(player_id="p1", player_name="Player1")
        player2 = make_ticket(player_id="p2", player_name="Player2")
        
        # Player1 unhealthy, Player2 healthy
        health_checker.set_healthy("p1", False)
        health_checker.set_healthy("p2", True)
        conn_manager.set_connected("p2", True)
        
        creator = AtomicMatchCreator(
            health_checker=health_checker,
            connection_manager=conn_manager,
        )
        
        await creator.create_match(player1, player2, lobby_service, repo)
        
        # Check notification content
        messages = conn_manager.get_sent_messages("p2")
        cancelled_msgs = [m for _, m in messages if m.get("type") == "match_cancelled"]
        
        assert len(cancelled_msgs) == 1
        assert cancelled_msgs[0]["payload"]["reason"] == "opponent_disconnected"
        assert "timestamp" in cancelled_msgs[0]["payload"]
    
    @pytest.mark.asyncio
    @given(
        p1_healthy=st.booleans(),
        p2_healthy=st.booleans(),
    )
    @settings(max_examples=20)
    async def test_notification_content_property(self, p1_healthy: bool, p2_healthy: bool):
        """
        Property: match_cancelled always has reason "opponent_disconnected".
        
        **Feature: matchmaking-hardening, Property 6: Match cancelled notification content**
        **Validates: Requirements 6.1**
        """
        # Only test when exactly one player is unhealthy
        assume(p1_healthy != p2_healthy)
        
        health_checker = MockHealthChecker()
        conn_manager = MockConnectionManager()
        lobby_service = MockLobbyService()
        repo = MockRepo()
        
        player1 = make_ticket(player_id="p1", player_name="Player1")
        player2 = make_ticket(player_id="p2", player_name="Player2")
        
        health_checker.set_healthy("p1", p1_healthy)
        health_checker.set_healthy("p2", p2_healthy)
        
        if p1_healthy:
            conn_manager.set_connected("p1", True)
        if p2_healthy:
            conn_manager.set_connected("p2", True)
        
        creator = AtomicMatchCreator(
            health_checker=health_checker,
            connection_manager=conn_manager,
        )
        
        await creator.create_match(player1, player2, lobby_service, repo)
        
        # Find the healthy player who should receive notification
        healthy_player = "p1" if p1_healthy else "p2"
        messages = conn_manager.get_sent_messages(healthy_player)
        cancelled_msgs = [m for _, m in messages if m.get("type") == "match_cancelled"]
        
        # Property: notification has correct reason
        assert len(cancelled_msgs) == 1
        assert cancelled_msgs[0]["payload"]["reason"] == "opponent_disconnected"


# ============================================
# Property 7: Rollback Notification Timing
# ============================================

class TestRollbackNotificationTiming:
    """
    **Feature: matchmaking-hardening, Property 7: Rollback notification timing**
    
    For any match rollback, the affected player must be notified
    within 1 second of the rollback decision.
    
    **Validates: Requirements 6.3**
    """
    
    @pytest.mark.asyncio
    async def test_notification_sent_immediately(self):
        """Notification should be sent immediately after rollback decision."""
        import time
        
        health_checker = MockHealthChecker()
        conn_manager = MockConnectionManager()
        lobby_service = MockLobbyService()
        repo = MockRepo()
        
        player1 = make_ticket(player_id="p1", player_name="Player1")
        player2 = make_ticket(player_id="p2", player_name="Player2")
        
        # Player1 unhealthy
        health_checker.set_healthy("p1", False)
        health_checker.set_healthy("p2", True)
        conn_manager.set_connected("p2", True)
        
        creator = AtomicMatchCreator(
            health_checker=health_checker,
            connection_manager=conn_manager,
        )
        
        start_time = time.time()
        await creator.create_match(player1, player2, lobby_service, repo)
        elapsed = time.time() - start_time
        
        # Should complete quickly (health check failure is immediate)
        # The 1 second requirement is for notification after decision
        assert elapsed < 1.0
        
        # Verify notification was sent
        messages = conn_manager.get_sent_messages("p2")
        cancelled_msgs = [m for _, m in messages if m.get("type") == "match_cancelled"]
        assert len(cancelled_msgs) == 1
    
    @pytest.mark.asyncio
    @given(
        p1_healthy=st.booleans(),
        p2_healthy=st.booleans(),
    )
    @settings(max_examples=10)
    async def test_timing_property(self, p1_healthy: bool, p2_healthy: bool):
        """
        Property: rollback notification is sent within 1 second.
        
        **Feature: matchmaking-hardening, Property 7: Rollback notification timing**
        **Validates: Requirements 6.3**
        """
        import time
        
        # Only test rollback cases
        assume(not (p1_healthy and p2_healthy))
        
        health_checker = MockHealthChecker()
        conn_manager = MockConnectionManager()
        lobby_service = MockLobbyService()
        repo = MockRepo()
        
        player1 = make_ticket(player_id="p1", player_name="Player1")
        player2 = make_ticket(player_id="p2", player_name="Player2")
        
        health_checker.set_healthy("p1", p1_healthy)
        health_checker.set_healthy("p2", p2_healthy)
        
        if p1_healthy:
            conn_manager.set_connected("p1", True)
        if p2_healthy:
            conn_manager.set_connected("p2", True)
        
        creator = AtomicMatchCreator(
            health_checker=health_checker,
            connection_manager=conn_manager,
        )
        
        start_time = time.time()
        await creator.create_match(player1, player2, lobby_service, repo)
        elapsed = time.time() - start_time
        
        # Property: notification sent within 1 second
        assert elapsed < 1.0
