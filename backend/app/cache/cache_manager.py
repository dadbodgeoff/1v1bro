"""
Cache manager for Redis operations with consistent key naming.
Requirements: 11.2-11.8
"""

import json
from typing import Any, List, Optional, Tuple
import redis.asyncio as aioredis

from .redis_client import get_redis_client


class CacheManager:
    """
    Redis cache operations with consistent key naming.
    Key format: {service}:{entity}:{id}
    """
    
    def __init__(self, redis_client: Optional[aioredis.Redis] = None):
        self._client = redis_client
    
    async def _get_client(self) -> aioredis.Redis:
        """Get Redis client, initializing if needed."""
        if self._client is None:
            self._client = await get_redis_client()
        return self._client
    
    # ============================================
    # Key Naming Helpers
    # ============================================
    
    @staticmethod
    def key(service: str, entity: str, id: str) -> str:
        """Generate consistent cache key: {service}:{entity}:{id}."""
        return f"{service}:{entity}:{id}"
    
    # ============================================
    # Basic Operations
    # ============================================
    
    async def get(self, key: str) -> Optional[str]:
        """Get cached string value."""
        client = await self._get_client()
        return await client.get(key)
    
    async def set(self, key: str, value: str, ttl_seconds: int) -> None:
        """Set cached string value with TTL."""
        client = await self._get_client()
        await client.set(key, value, ex=ttl_seconds)
    
    async def delete(self, key: str) -> None:
        """Delete cached value."""
        client = await self._get_client()
        await client.delete(key)
    
    async def exists(self, key: str) -> bool:
        """Check if key exists."""
        client = await self._get_client()
        return await client.exists(key) > 0
    
    async def ttl(self, key: str) -> int:
        """Get remaining TTL for key (-1 if no expiry, -2 if not exists)."""
        client = await self._get_client()
        return await client.ttl(key)
    
    # ============================================
    # JSON Operations
    # ============================================
    
    async def get_json(self, key: str) -> Optional[dict]:
        """Get and deserialize JSON value."""
        value = await self.get(key)
        if value is None:
            return None
        return json.loads(value)
    
    async def set_json(self, key: str, value: Any, ttl_seconds: int) -> None:
        """Serialize and set JSON value."""
        json_str = json.dumps(value, default=str)
        await self.set(key, json_str, ttl_seconds)
    
    # ============================================
    # Sorted Set Operations (for leaderboards)
    # ============================================
    
    async def zadd(self, key: str, score: float, member: str) -> None:
        """Add member to sorted set with score."""
        client = await self._get_client()
        await client.zadd(key, {member: score})
    
    async def zadd_many(self, key: str, items: List[Tuple[str, float]]) -> None:
        """Add multiple members to sorted set."""
        client = await self._get_client()
        mapping = {member: score for member, score in items}
        await client.zadd(key, mapping)
    
    async def zrange(
        self, 
        key: str, 
        start: int, 
        stop: int, 
        withscores: bool = False,
        desc: bool = False
    ) -> List:
        """Get range from sorted set."""
        client = await self._get_client()
        if desc:
            return await client.zrevrange(key, start, stop, withscores=withscores)
        return await client.zrange(key, start, stop, withscores=withscores)
    
    async def zrank(self, key: str, member: str, desc: bool = False) -> Optional[int]:
        """Get rank of member in sorted set (0-indexed)."""
        client = await self._get_client()
        if desc:
            return await client.zrevrank(key, member)
        return await client.zrank(key, member)
    
    async def zscore(self, key: str, member: str) -> Optional[float]:
        """Get score of member in sorted set."""
        client = await self._get_client()
        return await client.zscore(key, member)
    
    async def zcard(self, key: str) -> int:
        """Get number of members in sorted set."""
        client = await self._get_client()
        return await client.zcard(key)
    
    # ============================================
    # Rate Limiting Operations
    # ============================================
    
    async def incr_with_ttl(self, key: str, ttl_seconds: int) -> int:
        """Increment counter with TTL (for rate limiting)."""
        client = await self._get_client()
        pipe = client.pipeline()
        pipe.incr(key)
        pipe.expire(key, ttl_seconds)
        results = await pipe.execute()
        return results[0]  # Return the incremented value
    
    # ============================================
    # Bulk Operations
    # ============================================
    
    async def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern. Use with caution."""
        client = await self._get_client()
        cursor = 0
        deleted = 0
        while True:
            cursor, keys = await client.scan(cursor, match=pattern, count=100)
            if keys:
                await client.delete(*keys)
                deleted += len(keys)
            if cursor == 0:
                break
        return deleted
