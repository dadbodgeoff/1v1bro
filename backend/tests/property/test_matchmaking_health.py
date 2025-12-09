"""
Property-based tests for matchmaking health checking.

Tests correctness properties for connection health verification.

**Feature: matchmaking-hardening**
"""

import asyncio
from datetime import datetime
from typing import Dict, Optional, Tuple
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from hypothesis import given, strategies as st, settings

from app.matchmaking.models import HealthCheckResult
from app.matchmaking.health_checker import ConnectionHealthChecker


# ============================================
# Test Helpers
# ============================================

class MockConnectionManager:
    """Mock connection manager for testing health checks."""
    
    def __init__(self):
        self._connected_users: Dict[str, bool] = {}
        self._response_delays: Dict[str, float] = {}
        self._should_fail_send: Dict[str, bool] = {}
        self._pending_pings: Dict[str, asyncio.Event] = {}
    
    def set_user_connected(self, user_id: str, connected: bool = True):
        """Set whether a user is connected."""
        self._connected_users[user_id] = connected
    
    def set_response_delay(self, user_id: str, delay: float):
        """Set how long the user takes to respond to ping."""
        self._response_delays[user_id] = delay
    
    def set_send_fails(self, user_id: str, fails: bool = True):
        """Set whether sending to user fails."""
        self._should_fail_send[user_id] = fails
    
    def is_user_connected(self, user_id: str) -> bool:
        """Check if user is connected."""
        return self._connected_users.get(user_id, False)
    
    async def ping_user(self, user_id: str, timeout: float = 2.0) -> Tuple[bool, Optional[float]]:
        """Simulate ping-pong with configurable delay."""
        if not self.is_user_connected(user_id):
            return False, None
        
        if self._should_fail_send.get(user_id, False):
            return False, None
        
        delay = self._response_delays.get(user_id, 0.01)
        
        # Simulate response delay
        if delay > timeout:
            # Timeout - no response
            await asyncio.sleep(timeout)
            return False, None
        else:
            # Response received
            await asyncio.sleep(delay)
            latency_ms = delay * 1000
            return True, latency_ms


# ============================================
# Property 3: Health Check Timeout Enforcement
# ============================================

class TestHealthCheckTimeout:
    """
    **Feature: matchmaking-hardening, Property 3: Health check timeout enforcement**
    
    For any connection health check, if no pong response is received
    within 2 seconds, the check must return unhealthy.
    
    **Validates: Requirements 1.3**
    """
    
    @pytest.mark.asyncio
    async def test_timeout_returns_unhealthy(self):
        """Health check should return unhealthy on timeout."""
        mock_manager = MockConnectionManager()
        mock_manager.set_user_connected("user1", True)
        mock_manager.set_response_delay("user1", 5.0)  # 5 second delay > 2 second timeout
        
        checker = ConnectionHealthChecker(connection_manager=mock_manager)
        
        result = await checker.verify_health("user1", timeout=0.1)  # Short timeout for test
        
        assert result.healthy is False
        assert result.failure_reason == "ping_timeout"
    
    @pytest.mark.asyncio
    async def test_fast_response_returns_healthy(self):
        """Health check should return healthy for fast response."""
        mock_manager = MockConnectionManager()
        mock_manager.set_user_connected("user1", True)
        mock_manager.set_response_delay("user1", 0.01)  # 10ms delay
        
        checker = ConnectionHealthChecker(connection_manager=mock_manager)
        
        result = await checker.verify_health("user1", timeout=2.0)
        
        assert result.healthy is True
        assert result.latency_ms is not None
        assert result.latency_ms < 2000  # Less than timeout
    
    @pytest.mark.asyncio
    @given(
        response_delay=st.floats(min_value=0.001, max_value=0.05),
        timeout=st.floats(min_value=0.1, max_value=0.5),
    )
    @settings(max_examples=50)
    async def test_timeout_property_fast_response(self, response_delay: float, timeout: float):
        """
        Property: responses faster than timeout always return healthy.
        
        **Feature: matchmaking-hardening, Property 3: Health check timeout enforcement**
        **Validates: Requirements 1.3**
        """
        # Ensure response is faster than timeout
        if response_delay >= timeout:
            response_delay = timeout * 0.5
        
        mock_manager = MockConnectionManager()
        mock_manager.set_user_connected("user1", True)
        mock_manager.set_response_delay("user1", response_delay)
        
        checker = ConnectionHealthChecker(connection_manager=mock_manager)
        
        result = await checker.verify_health("user1", timeout=timeout)
        
        assert result.healthy is True
        assert result.latency_ms is not None
    
    @pytest.mark.asyncio
    @given(
        timeout=st.floats(min_value=0.05, max_value=0.2),
    )
    @settings(max_examples=30)
    async def test_timeout_property_slow_response(self, timeout: float):
        """
        Property: responses slower than timeout always return unhealthy.
        
        **Feature: matchmaking-hardening, Property 3: Health check timeout enforcement**
        **Validates: Requirements 1.3**
        """
        # Response delay is 2x the timeout
        response_delay = timeout * 2
        
        mock_manager = MockConnectionManager()
        mock_manager.set_user_connected("user1", True)
        mock_manager.set_response_delay("user1", response_delay)
        
        checker = ConnectionHealthChecker(connection_manager=mock_manager)
        
        result = await checker.verify_health("user1", timeout=timeout)
        
        assert result.healthy is False
        assert result.failure_reason == "ping_timeout"
    
    @pytest.mark.asyncio
    async def test_not_connected_returns_unhealthy(self):
        """Health check should return unhealthy for disconnected user."""
        mock_manager = MockConnectionManager()
        # User not connected
        
        checker = ConnectionHealthChecker(connection_manager=mock_manager)
        
        result = await checker.verify_health("user1")
        
        assert result.healthy is False
        assert result.failure_reason == "not_connected"
    
    @pytest.mark.asyncio
    async def test_send_failure_returns_unhealthy(self):
        """Health check should return unhealthy when send fails."""
        mock_manager = MockConnectionManager()
        mock_manager.set_user_connected("user1", True)
        mock_manager.set_send_fails("user1", True)
        
        checker = ConnectionHealthChecker(connection_manager=mock_manager)
        
        result = await checker.verify_health("user1")
        
        assert result.healthy is False
        # Could be ping_timeout or send_failed depending on implementation


# ============================================
# Multiple User Health Checks
# ============================================

class TestMultipleHealthChecks:
    """Tests for verifying multiple connections in parallel."""
    
    @pytest.mark.asyncio
    async def test_verify_multiple_all_healthy(self):
        """All healthy users should return healthy results."""
        mock_manager = MockConnectionManager()
        mock_manager.set_user_connected("user1", True)
        mock_manager.set_user_connected("user2", True)
        mock_manager.set_response_delay("user1", 0.01)
        mock_manager.set_response_delay("user2", 0.01)
        
        checker = ConnectionHealthChecker(connection_manager=mock_manager)
        
        results = await checker.verify_multiple(["user1", "user2"])
        
        assert results["user1"].healthy is True
        assert results["user2"].healthy is True
    
    @pytest.mark.asyncio
    async def test_verify_multiple_mixed_health(self):
        """Mixed health states should be correctly reported."""
        mock_manager = MockConnectionManager()
        mock_manager.set_user_connected("user1", True)
        mock_manager.set_user_connected("user2", False)  # Disconnected
        mock_manager.set_response_delay("user1", 0.01)
        
        checker = ConnectionHealthChecker(connection_manager=mock_manager)
        
        results = await checker.verify_multiple(["user1", "user2"])
        
        assert results["user1"].healthy is True
        assert results["user2"].healthy is False
        assert results["user2"].failure_reason == "not_connected"
    
    @pytest.mark.asyncio
    async def test_verify_both_healthy(self):
        """verify_both_healthy should return correct tuple."""
        mock_manager = MockConnectionManager()
        mock_manager.set_user_connected("user1", True)
        mock_manager.set_user_connected("user2", True)
        mock_manager.set_response_delay("user1", 0.01)
        mock_manager.set_response_delay("user2", 0.01)
        
        checker = ConnectionHealthChecker(connection_manager=mock_manager)
        
        both_healthy, result1, result2 = await checker.verify_both_healthy("user1", "user2")
        
        assert both_healthy is True
        assert result1.healthy is True
        assert result2.healthy is True
    
    @pytest.mark.asyncio
    async def test_verify_both_one_unhealthy(self):
        """verify_both_healthy should return False if one is unhealthy."""
        mock_manager = MockConnectionManager()
        mock_manager.set_user_connected("user1", True)
        mock_manager.set_user_connected("user2", False)
        mock_manager.set_response_delay("user1", 0.01)
        
        checker = ConnectionHealthChecker(connection_manager=mock_manager)
        
        both_healthy, result1, result2 = await checker.verify_both_healthy("user1", "user2")
        
        assert both_healthy is False
        assert result1.healthy is True
        assert result2.healthy is False


# ============================================
# Health Check Result Model Tests
# ============================================

class TestHealthCheckResultModel:
    """Tests for HealthCheckResult model."""
    
    def test_healthy_result_to_dict(self):
        """Healthy result should serialize correctly."""
        result = HealthCheckResult(
            user_id="test-user",
            healthy=True,
            latency_ms=15.5,
        )
        
        data = result.to_dict()
        
        assert data["user_id"] == "test-user"
        assert data["healthy"] is True
        assert data["latency_ms"] == 15.5
        assert data["failure_reason"] is None
    
    def test_unhealthy_result_to_dict(self):
        """Unhealthy result should include failure reason."""
        result = HealthCheckResult(
            user_id="test-user",
            healthy=False,
            failure_reason="ping_timeout",
        )
        
        data = result.to_dict()
        
        assert data["user_id"] == "test-user"
        assert data["healthy"] is False
        assert data["failure_reason"] == "ping_timeout"
        assert data["latency_ms"] is None



# ============================================
# Property 5: Stale Detection After Missed Heartbeats
# ============================================

class TestStaleDetection:
    """
    **Feature: matchmaking-hardening, Property 5: Stale detection after missed heartbeats**
    
    For any queued player who misses 2 consecutive heartbeat pings,
    that player must be marked as stale and removed from the queue.
    
    **Validates: Requirements 3.2, 3.3**
    """
    
    def test_heartbeat_status_initial_state(self):
        """HeartbeatStatus should start with zero missed heartbeats."""
        from app.matchmaking.models import HeartbeatStatus
        
        status = HeartbeatStatus(user_id="test-user")
        
        assert status.missed_count == 0
        assert status.is_stale is False
        assert status.last_ping_sent is None
        assert status.last_pong_received is None
    
    def test_record_pong_resets_missed_count(self):
        """Recording a pong should reset missed count."""
        from app.matchmaking.models import HeartbeatStatus
        
        status = HeartbeatStatus(user_id="test-user", missed_count=1)
        status.record_pong_received()
        
        assert status.missed_count == 0
        assert status.is_stale is False
        assert status.last_pong_received is not None
    
    def test_missed_heartbeat_increments_count(self):
        """Missing a heartbeat should increment count."""
        from app.matchmaking.models import HeartbeatStatus
        
        status = HeartbeatStatus(user_id="test-user")
        
        status.record_missed_heartbeat(max_missed=2)
        assert status.missed_count == 1
        assert status.is_stale is False
    
    def test_two_missed_heartbeats_marks_stale(self):
        """Missing 2 heartbeats should mark player as stale."""
        from app.matchmaking.models import HeartbeatStatus
        
        status = HeartbeatStatus(user_id="test-user")
        
        status.record_missed_heartbeat(max_missed=2)
        assert status.is_stale is False
        
        status.record_missed_heartbeat(max_missed=2)
        assert status.is_stale is True
        assert status.missed_count == 2
    
    @given(
        missed_before_stale=st.integers(min_value=1, max_value=5),
        num_misses=st.integers(min_value=0, max_value=10),
    )
    @settings(max_examples=50)
    def test_stale_detection_property(self, missed_before_stale: int, num_misses: int):
        """
        Property: player is marked stale iff missed_count >= max_missed.
        
        **Feature: matchmaking-hardening, Property 5: Stale detection after missed heartbeats**
        **Validates: Requirements 3.2, 3.3**
        """
        from app.matchmaking.models import HeartbeatStatus
        
        status = HeartbeatStatus(user_id="test-user")
        
        for _ in range(num_misses):
            status.record_missed_heartbeat(max_missed=missed_before_stale)
        
        # Property: stale iff missed >= threshold
        expected_stale = num_misses >= missed_before_stale
        assert status.is_stale == expected_stale
        assert status.missed_count == num_misses
    
    @given(
        num_misses=st.integers(min_value=0, max_value=5),
    )
    @settings(max_examples=30)
    def test_pong_always_resets_stale(self, num_misses: int):
        """
        Property: recording a pong always resets stale status.
        
        **Feature: matchmaking-hardening, Property 5: Stale detection after missed heartbeats**
        **Validates: Requirements 3.2, 3.3**
        """
        from app.matchmaking.models import HeartbeatStatus
        
        status = HeartbeatStatus(user_id="test-user")
        
        # Miss some heartbeats
        for _ in range(num_misses):
            status.record_missed_heartbeat(max_missed=2)
        
        # Record pong
        status.record_pong_received()
        
        # Should always reset
        assert status.missed_count == 0
        assert status.is_stale is False


class TestHeartbeatMonitorRegistration:
    """Tests for HeartbeatMonitor player registration."""
    
    @pytest.mark.asyncio
    async def test_register_player(self):
        """Registering a player should track them."""
        from app.matchmaking.heartbeat_monitor import HeartbeatMonitor
        
        monitor = HeartbeatMonitor(connection_manager=MockConnectionManager())
        
        monitor.register_player("user1")
        
        assert monitor.get_registered_count() == 1
        assert monitor.get_player_status("user1") is not None
    
    @pytest.mark.asyncio
    async def test_unregister_player(self):
        """Unregistering a player should remove them."""
        from app.matchmaking.heartbeat_monitor import HeartbeatMonitor
        
        monitor = HeartbeatMonitor(connection_manager=MockConnectionManager())
        
        monitor.register_player("user1")
        status = monitor.unregister_player("user1")
        
        assert status is not None
        assert monitor.get_registered_count() == 0
        assert monitor.get_player_status("user1") is None
    
    @pytest.mark.asyncio
    async def test_record_pong_updates_status(self):
        """Recording a pong should update player status."""
        from app.matchmaking.heartbeat_monitor import HeartbeatMonitor
        
        monitor = HeartbeatMonitor(connection_manager=MockConnectionManager())
        
        monitor.register_player("user1")
        
        # Simulate missed heartbeat
        status = monitor.get_player_status("user1")
        status.record_missed_heartbeat(max_missed=2)
        assert status.missed_count == 1
        
        # Record pong (now async)
        await monitor.record_pong("user1")
        
        # Should reset
        assert status.missed_count == 0
    
    @pytest.mark.asyncio
    async def test_get_stale_players(self):
        """get_stale_players should return only stale players."""
        from app.matchmaking.heartbeat_monitor import HeartbeatMonitor
        
        monitor = HeartbeatMonitor(connection_manager=MockConnectionManager())
        
        monitor.register_player("user1")
        monitor.register_player("user2")
        
        # Mark user1 as stale
        status1 = monitor.get_player_status("user1")
        status1.record_missed_heartbeat(max_missed=2)
        status1.record_missed_heartbeat(max_missed=2)
        
        stale = monitor.get_stale_players()
        
        assert "user1" in stale
        assert "user2" not in stale
