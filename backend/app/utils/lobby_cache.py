"""
Lobby Cache - TTL-based in-memory cache for lobby data.

Reduces Supabase calls during gameplay by caching lobby lookups.
Position updates happen at 60Hz per player - without caching, that's
120 DB calls/second for a single game.
"""

import time
from dataclasses import dataclass, field
from typing import Optional, Dict
from threading import Lock

from app.core.logging import get_logger

logger = get_logger("lobby_cache")


@dataclass
class CacheEntry:
    """Single cache entry with expiration."""
    data: dict
    expires_at: float
    created_at: float = field(default_factory=time.time)


class LobbyCache:
    """
    TTL-based cache for lobby data.
    
    Thread-safe with lock protection for concurrent access.
    """
    
    def __init__(self, ttl_seconds: float = 5.0):
        """
        Initialize cache.
        
        Args:
            ttl_seconds: Time-to-live for cache entries (default 5s)
        """
        self._cache: Dict[str, CacheEntry] = {}
        self._ttl = ttl_seconds
        self._lock = Lock()
        
        # Stats for monitoring
        self._hits = 0
        self._misses = 0
        self._invalidations = 0
    
    def get(self, code: str) -> Optional[dict]:
        """
        Get cached lobby data.
        
        Args:
            code: Lobby code (case-insensitive)
            
        Returns:
            Cached lobby dict or None if not found/expired
        """
        code = code.upper()
        
        with self._lock:
            entry = self._cache.get(code)
            
            if entry is None:
                self._misses += 1
                return None
            
            if time.time() >= entry.expires_at:
                # Expired - remove and return None
                del self._cache[code]
                self._misses += 1
                return None
            
            self._hits += 1
            return entry.data
    
    def set(self, code: str, data: dict) -> None:
        """
        Cache lobby data.
        
        Args:
            code: Lobby code (case-insensitive)
            data: Lobby data dict to cache
        """
        code = code.upper()
        now = time.time()
        
        with self._lock:
            self._cache[code] = CacheEntry(
                data=data,
                expires_at=now + self._ttl,
                created_at=now,
            )
    
    def invalidate(self, code: str) -> bool:
        """
        Remove lobby from cache.
        
        Args:
            code: Lobby code (case-insensitive)
            
        Returns:
            True if entry was removed, False if not found
        """
        code = code.upper()
        
        with self._lock:
            if code in self._cache:
                del self._cache[code]
                self._invalidations += 1
                logger.debug(f"Cache invalidated for lobby {code}")
                return True
            return False
    
    def get_stats(self) -> dict:
        """
        Get cache statistics for monitoring.
        
        Returns:
            Dict with hits, misses, hit_rate, cached_lobbies, invalidations
        """
        with self._lock:
            total = self._hits + self._misses
            return {
                "hits": self._hits,
                "misses": self._misses,
                "hit_rate": round(self._hits / total, 3) if total > 0 else 0.0,
                "cached_lobbies": len(self._cache),
                "invalidations": self._invalidations,
                "ttl_seconds": self._ttl,
            }
    
    def clear(self) -> int:
        """
        Clear all cached entries.
        
        Returns:
            Number of entries cleared
        """
        with self._lock:
            count = len(self._cache)
            self._cache.clear()
            return count
    
    def cleanup_expired(self) -> int:
        """
        Remove all expired entries.
        
        Returns:
            Number of entries removed
        """
        now = time.time()
        removed = 0
        
        with self._lock:
            expired_codes = [
                code for code, entry in self._cache.items()
                if now >= entry.expires_at
            ]
            for code in expired_codes:
                del self._cache[code]
                removed += 1
        
        return removed


# Global singleton instance
lobby_cache = LobbyCache()
