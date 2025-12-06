"""
Unit tests for ConnectionManager.

Tests connection limits, stats, and graceful degradation.
"""

import pytest
from unittest.mock import MagicMock, AsyncMock

from app.websocket.manager import ConnectionManager


class TestConnectionLimits:
    """Connection limit tests."""
    
    def test_can_accept_when_under_limit(self):
        """Test accepts connections when under limit."""
        manager = ConnectionManager(max_connections=100, max_per_lobby=10)
        
        can_accept, reason = manager.can_accept_connection("ABCDEF")
        
        assert can_accept is True
        assert reason == ""
    
    def test_rejects_when_server_full(self):
        """Test rejects when total connections at limit."""
        manager = ConnectionManager(max_connections=2, max_per_lobby=10)
        
        # Simulate 2 existing connections
        ws1, ws2 = MagicMock(), MagicMock()
        manager.active_connections["LOBBY1"] = {ws1}
        manager.active_connections["LOBBY2"] = {ws2}
        
        can_accept, reason = manager.can_accept_connection("NEWLOBBY")
        
        assert can_accept is False
        assert reason == "server_full"
    
    def test_rejects_when_lobby_full(self):
        """Test rejects when lobby at per-lobby limit."""
        manager = ConnectionManager(max_connections=100, max_per_lobby=2)
        
        # Simulate 2 connections in one lobby
        ws1, ws2 = MagicMock(), MagicMock()
        manager.active_connections["ABCDEF"] = {ws1, ws2}
        
        can_accept, reason = manager.can_accept_connection("ABCDEF")
        
        assert can_accept is False
        assert reason == "lobby_full"
    
    def test_allows_different_lobby_when_one_full(self):
        """Test allows connection to different lobby when one is full."""
        manager = ConnectionManager(max_connections=100, max_per_lobby=2)
        
        # Fill one lobby
        ws1, ws2 = MagicMock(), MagicMock()
        manager.active_connections["FULL01"] = {ws1, ws2}
        
        # Should allow connection to different lobby
        can_accept, reason = manager.can_accept_connection("EMPTY1")
        
        assert can_accept is True
        assert reason == ""
    
    def test_default_limits(self):
        """Test default connection limits."""
        manager = ConnectionManager()
        
        assert manager.max_connections == 500
        assert manager.max_per_lobby == 10
    
    def test_custom_limits(self):
        """Test custom connection limits."""
        manager = ConnectionManager(max_connections=1000, max_per_lobby=20)
        
        assert manager.max_connections == 1000
        assert manager.max_per_lobby == 20


class TestConnectionStats:
    """Connection statistics tests."""
    
    def test_stats_empty(self):
        """Test stats when no connections."""
        manager = ConnectionManager(max_connections=100)
        
        stats = manager.get_stats()
        
        assert stats["total_connections"] == 0
        assert stats["active_lobbies"] == 0
        assert stats["capacity_percent"] == 0.0
    
    def test_stats_with_connections(self):
        """Test stats with active connections."""
        manager = ConnectionManager(max_connections=100, max_per_lobby=10)
        
        # Add some connections
        manager.active_connections["LOBBY1"] = {MagicMock(), MagicMock()}
        manager.active_connections["LOBBY2"] = {MagicMock()}
        
        stats = manager.get_stats()
        
        assert stats["total_connections"] == 3
        assert stats["active_lobbies"] == 2
        assert stats["capacity_percent"] == 3.0
        assert stats["connections_by_lobby"]["LOBBY1"] == 2
        assert stats["connections_by_lobby"]["LOBBY2"] == 1
    
    def test_stats_capacity_percent(self):
        """Test capacity percentage calculation."""
        manager = ConnectionManager(max_connections=50)
        
        # Add 25 connections (50% capacity)
        for i in range(25):
            manager.active_connections[f"LOBBY{i}"] = {MagicMock()}
        
        stats = manager.get_stats()
        
        assert stats["capacity_percent"] == 50.0
    
    def test_stats_includes_limits(self):
        """Test stats include configured limits."""
        manager = ConnectionManager(max_connections=200, max_per_lobby=5)
        
        stats = manager.get_stats()
        
        assert stats["max_connections"] == 200
        assert stats["max_per_lobby"] == 5


class TestConnectionManagerOperations:
    """Test existing connection manager operations still work."""
    
    @pytest.mark.asyncio
    async def test_connect_adds_to_tracking(self):
        """Test connect adds connection to all tracking structures."""
        manager = ConnectionManager()
        ws = MagicMock()
        ws.accept = AsyncMock()
        
        await manager.connect(ws, "ABCDEF", "user-123")
        
        assert ws in manager.active_connections["ABCDEF"]
        assert manager.connection_info[ws] == ("ABCDEF", "user-123")
        assert manager.user_connections["user-123"] == ws
    
    def test_disconnect_removes_from_tracking(self):
        """Test disconnect removes from all tracking structures."""
        manager = ConnectionManager()
        ws = MagicMock()
        
        # Manually add connection
        manager.active_connections["ABCDEF"] = {ws}
        manager.connection_info[ws] = ("ABCDEF", "user-123")
        manager.user_connections["user-123"] = ws
        
        result = manager.disconnect(ws)
        
        assert result == ("ABCDEF", "user-123")
        assert ws not in manager.active_connections.get("ABCDEF", set())
        assert ws not in manager.connection_info
        assert "user-123" not in manager.user_connections
    
    def test_get_lobby_connections_count(self):
        """Test get_lobby_connections returns correct count."""
        manager = ConnectionManager()
        manager.active_connections["ABCDEF"] = {MagicMock(), MagicMock(), MagicMock()}
        
        count = manager.get_lobby_connections("ABCDEF")
        
        assert count == 3
    
    def test_get_lobby_connections_empty(self):
        """Test get_lobby_connections returns 0 for empty lobby."""
        manager = ConnectionManager()
        
        count = manager.get_lobby_connections("NOTHERE")
        
        assert count == 0
    
    def test_is_user_connected(self):
        """Test is_user_connected check."""
        manager = ConnectionManager()
        manager.user_connections["user-123"] = MagicMock()
        
        assert manager.is_user_connected("user-123") is True
        assert manager.is_user_connected("user-456") is False
    
    def test_get_user_id(self):
        """Test get_user_id from websocket."""
        manager = ConnectionManager()
        ws = MagicMock()
        manager.connection_info[ws] = ("ABCDEF", "user-123")
        
        user_id = manager.get_user_id(ws)
        
        assert user_id == "user-123"
    
    def test_get_lobby_code(self):
        """Test get_lobby_code from websocket."""
        manager = ConnectionManager()
        ws = MagicMock()
        manager.connection_info[ws] = ("ABCDEF", "user-123")
        
        code = manager.get_lobby_code(ws)
        
        assert code == "ABCDEF"


class TestEdgeCases:
    """Edge case tests."""
    
    def test_zero_max_connections(self):
        """Test behavior with zero max connections."""
        manager = ConnectionManager(max_connections=0)
        
        can_accept, reason = manager.can_accept_connection("ABCDEF")
        
        assert can_accept is False
        assert reason == "server_full"
    
    def test_stats_with_zero_max(self):
        """Test stats don't divide by zero."""
        manager = ConnectionManager(max_connections=0)
        
        stats = manager.get_stats()
        
        assert stats["capacity_percent"] == 0
    
    def test_disconnect_nonexistent(self):
        """Test disconnect on unknown websocket."""
        manager = ConnectionManager()
        ws = MagicMock()
        
        result = manager.disconnect(ws)
        
        assert result is None
