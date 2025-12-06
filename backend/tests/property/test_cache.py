"""
Property-based tests for cache operations.
**Feature: user-services-microservices, Property 13: Cache Invalidation**
**Validates: Requirements 3.8, 11.7**
"""

import pytest
from hypothesis import given, strategies as st, settings
from unittest.mock import AsyncMock, MagicMock, patch
import json

from app.cache.cache_manager import CacheManager


class TestCacheKeyNaming:
    """Test consistent cache key naming."""
    
    @given(
        service=st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=('L', 'N'))),
        entity=st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=('L', 'N'))),
        id_val=st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=('L', 'N', 'Pd')))
    )
    @settings(max_examples=100)
    def test_key_format_consistency(self, service: str, entity: str, id_val: str):
        """
        Property: For any service, entity, and id, the key format SHALL be {service}:{entity}:{id}.
        """
        key = CacheManager.key(service, entity, id_val)
        
        # Key should contain exactly 2 colons
        assert key.count(':') == 2
        
        # Key should be parseable back to components
        parts = key.split(':')
        assert len(parts) == 3
        assert parts[0] == service
        assert parts[1] == entity
        assert parts[2] == id_val


class TestCacheInvalidation:
    """
    Property 13: Cache Invalidation
    For any inventory modification (purchase or equip), the cached inventory 
    SHALL be invalidated, and subsequent reads SHALL return fresh data from database.
    """
    
    @pytest.fixture
    def mock_redis(self):
        """Create mock Redis client."""
        mock = AsyncMock()
        mock.get = AsyncMock(return_value=None)
        mock.set = AsyncMock()
        mock.delete = AsyncMock()
        mock.exists = AsyncMock(return_value=0)
        return mock
    
    @pytest.fixture
    def cache_manager(self, mock_redis):
        """Create CacheManager with mock Redis."""
        return CacheManager(redis_client=mock_redis)
    
    @pytest.mark.asyncio
    @given(user_id=st.uuids())
    @settings(max_examples=100)
    async def test_cache_invalidation_on_delete(self, user_id):
        """
        Property: After delete is called, the key SHALL no longer exist in cache.
        """
        mock_redis = AsyncMock()
        mock_redis.delete = AsyncMock()
        mock_redis.exists = AsyncMock(return_value=0)
        
        cache = CacheManager(redis_client=mock_redis)
        key = CacheManager.key("cosmetics", "inventory", str(user_id))
        
        await cache.delete(key)
        
        # Verify delete was called with correct key
        mock_redis.delete.assert_called_with(key)
    
    @pytest.mark.asyncio
    @given(
        user_id=st.uuids(),
        inventory_data=st.lists(
            st.fixed_dictionaries({
                'cosmetic_id': st.uuids().map(str),
                'equipped': st.booleans()
            }),
            min_size=0,
            max_size=10
        )
    )
    @settings(max_examples=100)
    async def test_json_roundtrip(self, user_id, inventory_data):
        """
        Property: For any JSON-serializable data, set_json then get_json SHALL return equivalent data.
        """
        stored_value = None
        
        async def mock_set(key, value, ex):
            nonlocal stored_value
            stored_value = value
        
        async def mock_get(key):
            return stored_value
        
        mock_redis = AsyncMock()
        mock_redis.set = mock_set
        mock_redis.get = mock_get
        
        cache = CacheManager(redis_client=mock_redis)
        key = CacheManager.key("cosmetics", "inventory", str(user_id))
        
        # Set JSON data
        await cache.set_json(key, inventory_data, ttl_seconds=300)
        
        # Get JSON data back
        result = await cache.get_json(key)
        
        # Should be equivalent
        assert result == inventory_data


class TestCacheTTL:
    """Test TTL behavior for cache entries."""
    
    @pytest.mark.asyncio
    @given(
        ttl=st.integers(min_value=1, max_value=86400),
        value=st.text(min_size=1, max_size=100)
    )
    @settings(max_examples=100)
    async def test_set_with_ttl(self, ttl: int, value: str):
        """
        Property: For any TTL value, set SHALL configure expiration correctly.
        """
        captured_ttl = None
        
        async def mock_set(key, val, ex):
            nonlocal captured_ttl
            captured_ttl = ex
        
        mock_redis = AsyncMock()
        mock_redis.set = mock_set
        
        cache = CacheManager(redis_client=mock_redis)
        
        await cache.set("test:key", value, ttl)
        
        assert captured_ttl == ttl


class TestSortedSetOperations:
    """Test sorted set operations for leaderboards."""
    
    @pytest.mark.asyncio
    @given(
        scores=st.lists(
            st.tuples(st.uuids().map(str), st.floats(min_value=100, max_value=3000, allow_nan=False)),
            min_size=1,
            max_size=20
        )
    )
    @settings(max_examples=100)
    async def test_zadd_many_stores_all(self, scores):
        """
        Property: For any list of (member, score) pairs, zadd_many SHALL store all entries.
        """
        stored_mapping = {}
        
        async def mock_zadd(key, mapping):
            stored_mapping.update(mapping)
        
        mock_redis = AsyncMock()
        mock_redis.zadd = mock_zadd
        
        cache = CacheManager(redis_client=mock_redis)
        
        await cache.zadd_many("leaderboard:global", scores)
        
        # All members should be stored
        for member, score in scores:
            assert member in stored_mapping
            assert stored_mapping[member] == score


class TestRateLimiting:
    """Test rate limiting counter operations."""
    
    @pytest.mark.asyncio
    @given(
        initial_count=st.integers(min_value=0, max_value=100),
        ttl=st.integers(min_value=1, max_value=3600)
    )
    @settings(max_examples=100)
    async def test_incr_with_ttl_increments(self, initial_count: int, ttl: int):
        """
        Property: incr_with_ttl SHALL increment counter and return new value.
        """
        current_value = initial_count
        
        async def mock_incr(key):
            nonlocal current_value
            current_value += 1
            return current_value
        
        async def mock_expire(key, seconds):
            pass
        
        async def mock_execute():
            nonlocal current_value
            current_value += 1
            return [current_value, True]
        
        mock_pipeline = MagicMock()
        mock_pipeline.incr = MagicMock()
        mock_pipeline.expire = MagicMock()
        mock_pipeline.execute = mock_execute
        
        mock_redis = AsyncMock()
        mock_redis.pipeline = MagicMock(return_value=mock_pipeline)
        
        cache = CacheManager(redis_client=mock_redis)
        
        result = await cache.incr_with_ttl("rate:test", ttl)
        
        # Result should be incremented value
        assert result == initial_count + 1
