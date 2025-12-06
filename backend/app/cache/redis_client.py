"""
Redis client connection management.
Requirements: 11.1, 9.10
"""

import os
from typing import Optional
import redis.asyncio as aioredis
from redis.asyncio.connection import ConnectionPool

# Global connection pool
_redis_pool: Optional[ConnectionPool] = None
_redis_client: Optional[aioredis.Redis] = None


def get_redis_url() -> str:
    """Get Redis URL from environment."""
    return os.getenv("REDIS_URL", "redis://localhost:6379/0")


async def get_redis_client() -> aioredis.Redis:
    """
    Get or create Redis client with connection pooling.
    Max 20 connections per service as per requirements.
    """
    global _redis_pool, _redis_client
    
    if _redis_client is None:
        redis_url = get_redis_url()
        _redis_pool = ConnectionPool.from_url(
            redis_url,
            max_connections=20,
            decode_responses=True,
        )
        _redis_client = aioredis.Redis(connection_pool=_redis_pool)
    
    return _redis_client


async def close_redis_client() -> None:
    """Close Redis connection pool."""
    global _redis_pool, _redis_client
    
    if _redis_client is not None:
        await _redis_client.close()
        _redis_client = None
    
    if _redis_pool is not None:
        await _redis_pool.disconnect()
        _redis_pool = None


async def redis_health_check() -> dict:
    """
    Check Redis connection health.
    Returns status and latency info.
    """
    try:
        client = await get_redis_client()
        # Ping to check connection
        await client.ping()
        # Get info for diagnostics
        info = await client.info("memory")
        
        return {
            "status": "healthy",
            "connected": True,
            "used_memory": info.get("used_memory_human", "unknown"),
            "max_memory": info.get("maxmemory_human", "unlimited"),
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "connected": False,
            "error": str(e),
        }
