"""
Unit tests for LobbyCache.

Tests TTL expiration, cache operations, and thread safety.
"""

import time
import pytest
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch

from app.utils.lobby_cache import LobbyCache, CacheEntry


class TestLobbyCacheBasics:
    """Basic cache operations."""
    
    def test_set_and_get(self):
        """Test basic set and get."""
        cache = LobbyCache(ttl_seconds=10.0)
        lobby_data = {"id": "123", "code": "ABCDEF", "status": "waiting"}
        
        cache.set("ABCDEF", lobby_data)
        result = cache.get("ABCDEF")
        
        assert result == lobby_data
    
    def test_get_nonexistent_returns_none(self):
        """Test get on missing key returns None."""
        cache = LobbyCache()
        
        result = cache.get("NOTHERE")
        
        assert result is None
    
    def test_case_insensitive_codes(self):
        """Test that lobby codes are case-insensitive."""
        cache = LobbyCache()
        lobby_data = {"id": "123", "code": "ABCDEF"}
        
        cache.set("abcdef", lobby_data)
        
        assert cache.get("ABCDEF") == lobby_data
        assert cache.get("AbCdEf") == lobby_data
        assert cache.get("abcdef") == lobby_data
    
    def test_invalidate_removes_entry(self):
        """Test invalidate removes cached entry."""
        cache = LobbyCache()
        cache.set("ABCDEF", {"id": "123"})
        
        result = cache.invalidate("ABCDEF")
        
        assert result is True
        assert cache.get("ABCDEF") is None
    
    def test_invalidate_nonexistent_returns_false(self):
        """Test invalidate on missing key returns False."""
        cache = LobbyCache()
        
        result = cache.invalidate("NOTHERE")
        
        assert result is False
    
    def test_clear_removes_all(self):
        """Test clear removes all entries."""
        cache = LobbyCache()
        cache.set("ABC123", {"id": "1"})
        cache.set("DEF456", {"id": "2"})
        cache.set("GHI789", {"id": "3"})
        
        count = cache.clear()
        
        assert count == 3
        assert cache.get("ABC123") is None
        assert cache.get("DEF456") is None
        assert cache.get("GHI789") is None


class TestLobbyCacheTTL:
    """TTL expiration tests."""
    
    def test_expired_entry_returns_none(self):
        """Test that expired entries return None."""
        cache = LobbyCache(ttl_seconds=0.1)  # 100ms TTL
        cache.set("ABCDEF", {"id": "123"})
        
        # Should exist immediately
        assert cache.get("ABCDEF") is not None
        
        # Wait for expiration
        time.sleep(0.15)
        
        # Should be gone
        assert cache.get("ABCDEF") is None
    
    def test_entry_valid_before_ttl(self):
        """Test entry is valid before TTL expires."""
        cache = LobbyCache(ttl_seconds=1.0)
        cache.set("ABCDEF", {"id": "123"})
        
        # Check multiple times before expiration
        for _ in range(5):
            assert cache.get("ABCDEF") is not None
            time.sleep(0.1)
    
    def test_cleanup_expired_removes_old_entries(self):
        """Test cleanup_expired removes expired entries."""
        cache = LobbyCache(ttl_seconds=0.1)
        cache.set("OLD1", {"id": "1"})
        cache.set("OLD2", {"id": "2"})
        
        time.sleep(0.15)
        
        # Add a fresh entry
        cache.set("NEW1", {"id": "3"})
        
        removed = cache.cleanup_expired()
        
        assert removed == 2
        assert cache.get("OLD1") is None
        assert cache.get("OLD2") is None
        assert cache.get("NEW1") is not None


class TestLobbyCacheStats:
    """Cache statistics tests."""
    
    def test_stats_track_hits(self):
        """Test hit counter increments."""
        cache = LobbyCache()
        cache.set("ABCDEF", {"id": "123"})
        
        cache.get("ABCDEF")
        cache.get("ABCDEF")
        cache.get("ABCDEF")
        
        stats = cache.get_stats()
        assert stats["hits"] == 3
    
    def test_stats_track_misses(self):
        """Test miss counter increments."""
        cache = LobbyCache()
        
        cache.get("NOTHERE1")
        cache.get("NOTHERE2")
        
        stats = cache.get_stats()
        assert stats["misses"] == 2
    
    def test_stats_track_invalidations(self):
        """Test invalidation counter increments."""
        cache = LobbyCache()
        cache.set("ABC123", {"id": "1"})
        cache.set("DEF456", {"id": "2"})
        
        cache.invalidate("ABC123")
        cache.invalidate("DEF456")
        
        stats = cache.get_stats()
        assert stats["invalidations"] == 2
    
    def test_hit_rate_calculation(self):
        """Test hit rate is calculated correctly."""
        cache = LobbyCache()
        cache.set("ABCDEF", {"id": "123"})
        
        # 3 hits
        cache.get("ABCDEF")
        cache.get("ABCDEF")
        cache.get("ABCDEF")
        
        # 1 miss
        cache.get("NOTHERE")
        
        stats = cache.get_stats()
        assert stats["hit_rate"] == 0.75  # 3/4
    
    def test_cached_lobbies_count(self):
        """Test cached_lobbies reflects current count."""
        cache = LobbyCache()
        
        assert cache.get_stats()["cached_lobbies"] == 0
        
        cache.set("ABC123", {"id": "1"})
        cache.set("DEF456", {"id": "2"})
        
        assert cache.get_stats()["cached_lobbies"] == 2
        
        cache.invalidate("ABC123")
        
        assert cache.get_stats()["cached_lobbies"] == 1


class TestLobbyCacheThreadSafety:
    """Thread safety tests."""
    
    def test_concurrent_reads_and_writes(self):
        """Test cache handles concurrent access."""
        cache = LobbyCache(ttl_seconds=10.0)
        errors = []
        
        def writer(code: str):
            try:
                for i in range(100):
                    cache.set(code, {"id": str(i), "iteration": i})
            except Exception as e:
                errors.append(e)
        
        def reader(code: str):
            try:
                for _ in range(100):
                    result = cache.get(code)
                    # Result should be None or a valid dict
                    if result is not None:
                        assert "id" in result
            except Exception as e:
                errors.append(e)
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            # Multiple writers and readers on same keys
            futures = []
            for code in ["ABC123", "DEF456", "GHI789"]:
                futures.append(executor.submit(writer, code))
                futures.append(executor.submit(reader, code))
                futures.append(executor.submit(reader, code))
            
            for f in futures:
                f.result()
        
        assert len(errors) == 0
    
    def test_concurrent_invalidations(self):
        """Test concurrent invalidations don't cause issues."""
        cache = LobbyCache()
        
        # Pre-populate
        for i in range(100):
            cache.set(f"CODE{i:03d}", {"id": str(i)})
        
        errors = []
        
        def invalidator(start: int, end: int):
            try:
                for i in range(start, end):
                    cache.invalidate(f"CODE{i:03d}")
            except Exception as e:
                errors.append(e)
        
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [
                executor.submit(invalidator, 0, 50),
                executor.submit(invalidator, 25, 75),  # Overlapping
                executor.submit(invalidator, 50, 100),
            ]
            for f in futures:
                f.result()
        
        assert len(errors) == 0


class TestCacheEntry:
    """CacheEntry dataclass tests."""
    
    def test_entry_stores_data(self):
        """Test CacheEntry stores data correctly."""
        data = {"id": "123", "code": "ABCDEF"}
        entry = CacheEntry(data=data, expires_at=time.time() + 10)
        
        assert entry.data == data
    
    def test_entry_has_created_at(self):
        """Test CacheEntry has created_at timestamp."""
        before = time.time()
        entry = CacheEntry(data={}, expires_at=time.time() + 10)
        after = time.time()
        
        assert before <= entry.created_at <= after
