"""
Unit tests for rate limiting.

Tests sliding window algorithm, message rate limiting, and edge cases.
"""

import time
import pytest
from unittest.mock import MagicMock, patch
from concurrent.futures import ThreadPoolExecutor

from app.middleware.rate_limit import (
    RateLimiter,
    RateLimitConfig,
    MessageRateLimiter,
    check_rate_limit,
    LOBBY_CREATE_LIMIT,
    LOBBY_JOIN_LIMIT,
)
from fastapi import HTTPException


class TestRateLimitConfig:
    """RateLimitConfig tests."""
    
    def test_config_creation(self):
        """Test config stores values correctly."""
        config = RateLimitConfig(requests=10, window_seconds=60)
        
        assert config.requests == 10
        assert config.window_seconds == 60
    
    def test_config_str(self):
        """Test config string representation."""
        config = RateLimitConfig(requests=5, window_seconds=30)
        
        assert str(config) == "5 requests per 30s"


class TestRateLimiter:
    """RateLimiter tests."""
    
    def test_allows_under_limit(self):
        """Test allows requests under limit."""
        limiter = RateLimiter()
        config = RateLimitConfig(requests=5, window_seconds=60)
        
        for _ in range(5):
            assert limiter.is_allowed("user1", config) is True
    
    def test_blocks_over_limit(self):
        """Test blocks requests over limit."""
        limiter = RateLimiter()
        config = RateLimitConfig(requests=3, window_seconds=60)
        
        # Use up the limit
        for _ in range(3):
            limiter.is_allowed("user1", config)
        
        # Next request should be blocked
        assert limiter.is_allowed("user1", config) is False
    
    def test_different_keys_independent(self):
        """Test different keys have independent limits."""
        limiter = RateLimiter()
        config = RateLimitConfig(requests=2, window_seconds=60)
        
        # User 1 uses their limit
        limiter.is_allowed("user1", config)
        limiter.is_allowed("user1", config)
        assert limiter.is_allowed("user1", config) is False
        
        # User 2 should still have their limit
        assert limiter.is_allowed("user2", config) is True
    
    def test_window_expiration(self):
        """Test requests expire after window."""
        limiter = RateLimiter()
        config = RateLimitConfig(requests=2, window_seconds=1)  # 1 second window
        
        # Use up limit
        limiter.is_allowed("user1", config)
        limiter.is_allowed("user1", config)
        assert limiter.is_allowed("user1", config) is False
        
        # Wait for window to expire
        time.sleep(1.1)
        
        # Should be allowed again
        assert limiter.is_allowed("user1", config) is True
    
    def test_get_remaining(self):
        """Test get_remaining returns correct count."""
        limiter = RateLimiter()
        config = RateLimitConfig(requests=5, window_seconds=60)
        
        assert limiter.get_remaining("user1", config) == 5
        
        limiter.is_allowed("user1", config)
        limiter.is_allowed("user1", config)
        
        assert limiter.get_remaining("user1", config) == 3
    
    def test_get_reset_time(self):
        """Test get_reset_time returns time until reset."""
        limiter = RateLimiter()
        config = RateLimitConfig(requests=1, window_seconds=10)
        
        # Not limited yet
        assert limiter.get_reset_time("user1", config) is None
        
        # Use up limit
        limiter.is_allowed("user1", config)
        
        # Should have reset time
        reset_time = limiter.get_reset_time("user1", config)
        assert reset_time is not None
        assert 9 < reset_time <= 10
    
    def test_get_stats(self):
        """Test stats tracking."""
        limiter = RateLimiter()
        config = RateLimitConfig(requests=2, window_seconds=60)
        
        limiter.is_allowed("user1", config)  # Allowed
        limiter.is_allowed("user1", config)  # Allowed
        limiter.is_allowed("user1", config)  # Blocked
        
        stats = limiter.get_stats()
        assert stats["total_requests"] == 3
        assert stats["blocked_requests"] == 1
        assert stats["block_rate"] > 0
    
    def test_clear_specific_key(self):
        """Test clearing specific key."""
        limiter = RateLimiter()
        config = RateLimitConfig(requests=1, window_seconds=60)
        
        limiter.is_allowed("user1", config)
        limiter.is_allowed("user2", config)
        
        limiter.clear("user1")
        
        # User 1 should be allowed again
        assert limiter.is_allowed("user1", config) is True
        # User 2 should still be limited
        assert limiter.is_allowed("user2", config) is False
    
    def test_clear_all(self):
        """Test clearing all keys."""
        limiter = RateLimiter()
        config = RateLimitConfig(requests=1, window_seconds=60)
        
        limiter.is_allowed("user1", config)
        limiter.is_allowed("user2", config)
        
        limiter.clear()
        
        # Both should be allowed
        assert limiter.is_allowed("user1", config) is True
        assert limiter.is_allowed("user2", config) is True


class TestRateLimiterThreadSafety:
    """Thread safety tests for RateLimiter."""
    
    def test_concurrent_requests(self):
        """Test concurrent requests are handled correctly."""
        limiter = RateLimiter()
        config = RateLimitConfig(requests=100, window_seconds=60)
        
        results = []
        errors = []
        
        def make_request():
            try:
                result = limiter.is_allowed("shared_user", config)
                results.append(result)
            except Exception as e:
                errors.append(e)
        
        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(make_request) for _ in range(200)]
            for f in futures:
                f.result()
        
        assert len(errors) == 0
        # Should have exactly 100 allowed, 100 blocked
        assert results.count(True) == 100
        assert results.count(False) == 100


class TestMessageRateLimiter:
    """MessageRateLimiter tests."""
    
    def test_allows_under_limit(self):
        """Test allows messages under limit."""
        limiter = MessageRateLimiter(max_per_second=10)
        
        for _ in range(10):
            assert limiter.check("user1") is True
    
    def test_blocks_over_limit(self):
        """Test blocks messages over limit."""
        limiter = MessageRateLimiter(max_per_second=5)
        
        for _ in range(5):
            limiter.check("user1")
        
        assert limiter.check("user1") is False
    
    def test_resets_each_second(self):
        """Test counter resets each second."""
        limiter = MessageRateLimiter(max_per_second=2)
        
        limiter.check("user1")
        limiter.check("user1")
        assert limiter.check("user1") is False
        
        # Wait for new second
        time.sleep(1.1)
        
        assert limiter.check("user1") is True
    
    def test_different_users_independent(self):
        """Test different users have independent limits."""
        limiter = MessageRateLimiter(max_per_second=1)
        
        limiter.check("user1")
        assert limiter.check("user1") is False
        
        # User 2 should still be allowed
        assert limiter.check("user2") is True
    
    def test_get_stats(self):
        """Test stats tracking."""
        limiter = MessageRateLimiter(max_per_second=2)
        
        limiter.check("user1")  # Allowed
        limiter.check("user1")  # Allowed
        limiter.check("user1")  # Blocked
        
        stats = limiter.get_stats()
        assert stats["total_messages"] == 3
        assert stats["blocked_messages"] == 1
        assert stats["max_per_second"] == 2


class TestCheckRateLimit:
    """check_rate_limit helper tests."""
    
    def test_raises_429_when_limited(self):
        """Test raises HTTPException when rate limited."""
        config = RateLimitConfig(requests=1, window_seconds=60)
        
        # First request OK
        check_rate_limit("test_user", config)
        
        # Second request should raise
        with pytest.raises(HTTPException) as exc_info:
            check_rate_limit("test_user", config)
        
        assert exc_info.value.status_code == 429
        assert "Rate limit exceeded" in str(exc_info.value.detail)
    
    def test_includes_retry_after_header(self):
        """Test includes Retry-After header."""
        config = RateLimitConfig(requests=1, window_seconds=60)
        
        check_rate_limit("header_test", config)
        
        with pytest.raises(HTTPException) as exc_info:
            check_rate_limit("header_test", config)
        
        assert "Retry-After" in exc_info.value.headers


class TestDefaultConfigs:
    """Test default rate limit configurations."""
    
    def test_lobby_create_limit(self):
        """Test lobby create limit is reasonable."""
        assert LOBBY_CREATE_LIMIT.requests == 5
        assert LOBBY_CREATE_LIMIT.window_seconds == 60
    
    def test_lobby_join_limit(self):
        """Test lobby join limit is reasonable."""
        assert LOBBY_JOIN_LIMIT.requests == 10
        assert LOBBY_JOIN_LIMIT.window_seconds == 60
