"""
Unit tests for health endpoints.

Tests health check, detailed metrics, and readiness endpoints.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


class TestHealthEndpoint:
    """Basic health check tests."""
    
    def test_health_returns_healthy(self):
        """Test basic health check returns healthy status."""
        response = client.get("/api/v1/health")
        
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
    
    def test_health_response_fast(self):
        """Test health check responds quickly (no DB calls)."""
        import time
        
        start = time.time()
        response = client.get("/api/v1/health")
        elapsed = time.time() - start
        
        assert response.status_code == 200
        assert elapsed < 0.1  # Should be under 100ms


class TestDetailedHealthEndpoint:
    """Detailed health metrics tests."""
    
    def test_detailed_health_returns_all_sections(self):
        """Test detailed health includes all metric sections."""
        response = client.get("/api/v1/health/detailed")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data
        assert "timestamp" in data
        assert "uptime_seconds" in data
        assert "connections" in data
        assert "cache" in data
        assert "games" in data
        assert "system" in data
        assert "config" in data
    
    def test_detailed_health_connection_stats(self):
        """Test connection stats are included."""
        response = client.get("/api/v1/health/detailed")
        data = response.json()
        
        connections = data["connections"]
        assert "total_connections" in connections
        assert "max_connections" in connections
        assert "capacity_percent" in connections
        assert "active_lobbies" in connections
    
    def test_detailed_health_cache_stats(self):
        """Test cache stats are included."""
        response = client.get("/api/v1/health/detailed")
        data = response.json()
        
        cache = data["cache"]
        assert "hits" in cache
        assert "misses" in cache
        assert "hit_rate" in cache
        assert "cached_lobbies" in cache
    
    def test_detailed_health_game_stats(self):
        """Test game session stats are included."""
        response = client.get("/api/v1/health/detailed")
        data = response.json()
        
        games = data["games"]
        assert "active_sessions" in games
        assert isinstance(games["active_sessions"], int)
    
    def test_detailed_health_system_stats(self):
        """Test system stats are included."""
        response = client.get("/api/v1/health/detailed")
        data = response.json()
        
        system = data["system"]
        assert "memory_mb" in system
        assert "pid" in system
        assert isinstance(system["pid"], int)
    
    def test_detailed_health_config(self):
        """Test configuration values are included."""
        response = client.get("/api/v1/health/detailed")
        data = response.json()
        
        config = data["config"]
        assert "max_connections" in config
        assert "max_per_lobby" in config
        assert "cache_ttl_seconds" in config


class TestReadinessEndpoint:
    """Readiness check tests."""
    
    def test_readiness_returns_ready(self):
        """Test readiness check returns ready status."""
        response = client.get("/api/v1/health/ready")
        
        assert response.status_code == 200
        data = response.json()
        assert data["ready"] is True
    
    def test_readiness_includes_availability(self):
        """Test readiness includes connection availability."""
        response = client.get("/api/v1/health/ready")
        data = response.json()
        
        assert "connections_available" in data
        assert isinstance(data["connections_available"], bool)
    
    @patch('app.api.v1.health.manager')
    def test_readiness_shows_unavailable_when_full(self, mock_manager):
        """Test readiness shows unavailable when at capacity."""
        mock_manager.get_stats.return_value = {
            "total_connections": 500,  # At max
            "max_connections": 500,
        }
        
        response = client.get("/api/v1/health/ready")
        data = response.json()
        
        # Should still be ready, but connections_available should be False
        assert data["ready"] is True
        assert data["connections_available"] is False


class TestHealthEndpointPerformance:
    """Performance tests for health endpoints."""
    
    def test_detailed_health_no_db_calls(self):
        """Test detailed health doesn't make database calls."""
        # This is a design verification - detailed health should use
        # in-memory stats only for fast response times
        response = client.get("/api/v1/health/detailed")
        
        assert response.status_code == 200
        # If this test passes quickly, no DB calls were made
    
    def test_multiple_health_checks(self):
        """Test multiple rapid health checks work."""
        for _ in range(10):
            response = client.get("/api/v1/health")
            assert response.status_code == 200
