# Launch Scaling - Technical Design

## Overview
Implement caching, connection limits, and monitoring to handle viral traffic without infrastructure changes.

---

## Component 1: Lobby Cache Layer

### Design
Create a `LobbyCache` class that wraps lobby lookups with TTL-based caching.

```python
# backend/app/utils/lobby_cache.py

from dataclasses import dataclass
from typing import Optional
import time

@dataclass
class CacheEntry:
    data: dict
    expires_at: float
    
class LobbyCache:
    def __init__(self, ttl_seconds: float = 5.0):
        self._cache: dict[str, CacheEntry] = {}
        self._ttl = ttl_seconds
        self._hits = 0
        self._misses = 0
    
    def get(self, code: str) -> Optional[dict]:
        entry = self._cache.get(code)
        if entry and time.time() < entry.expires_at:
            self._hits += 1
            return entry.data
        self._misses += 1
        return None
    
    def set(self, code: str, data: dict) -> None:
        self._cache[code] = CacheEntry(
            data=data,
            expires_at=time.time() + self._ttl
        )
    
    def invalidate(self, code: str) -> None:
        self._cache.pop(code, None)
    
    def get_stats(self) -> dict:
        total = self._hits + self._misses
        return {
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": self._hits / total if total > 0 else 0,
            "cached_lobbies": len(self._cache)
        }

# Global instance
lobby_cache = LobbyCache()
```

### Integration Points
- `LobbyService.get_lobby()` - Check cache first, populate on miss
- `LobbyService.join_lobby()` - Invalidate cache after join
- `LobbyService.leave_lobby()` - Invalidate cache after leave
- `LobbyService.start_game()` - Invalidate cache after start
- `handle_position_update()` - Use cached lobby (main win)

---

## Component 2: Connection Limits

### Design
Add connection tracking to `ConnectionManager` with configurable limits.

```python
# Updates to backend/app/websocket/manager.py

class ConnectionManager:
    def __init__(
        self,
        max_connections: int = 500,
        max_per_lobby: int = 10,
    ):
        self.max_connections = max_connections
        self.max_per_lobby = max_per_lobby
        # ... existing fields
    
    def can_accept_connection(self, lobby_code: str) -> tuple[bool, str]:
        """Check if we can accept a new connection."""
        total = sum(len(conns) for conns in self.active_connections.values())
        
        if total >= self.max_connections:
            return False, "server_full"
        
        lobby_count = len(self.active_connections.get(lobby_code, set()))
        if lobby_count >= self.max_per_lobby:
            return False, "lobby_full"
        
        return True, ""
    
    def get_stats(self) -> dict:
        """Get connection statistics."""
        return {
            "total_connections": sum(len(c) for c in self.active_connections.values()),
            "max_connections": self.max_connections,
            "active_lobbies": len(self.active_connections),
            "connections_by_lobby": {
                code: len(conns) 
                for code, conns in self.active_connections.items()
            }
        }
```

### WebSocket Rejection Flow
```python
# In main.py websocket_endpoint

can_connect, reason = manager.can_accept_connection(lobby_code)
if not can_connect:
    await websocket.close(code=4003, reason=reason)
    return
```

### Frontend Handling
```typescript
// In websocket.ts - handle rejection codes

this.ws.onclose = (event) => {
    if (event.code === 4003) {
        if (event.reason === 'server_full') {
            this.dispatch('server_full', {
                message: 'Servers are busy right now. Please try again in a few minutes!'
            })
        }
    }
    // ... existing handling
}
```

---

## Component 3: Health & Metrics Endpoint

### Design
Enhanced `/health` endpoint with detailed metrics.

```python
# backend/app/api/v1/health.py

from fastapi import APIRouter
from app.websocket.manager import manager
from app.services.game_service import GameService
from app.utils.lobby_cache import lobby_cache
import psutil
import os

router = APIRouter()

@router.get("/health")
async def health_check():
    """Basic health check."""
    return {"status": "healthy"}

@router.get("/health/detailed")
async def detailed_health():
    """Detailed health metrics for monitoring."""
    process = psutil.Process(os.getpid())
    
    return {
        "status": "healthy",
        "connections": manager.get_stats(),
        "cache": lobby_cache.get_stats(),
        "games": {
            "active_sessions": len(GameService._sessions),
        },
        "system": {
            "memory_mb": process.memory_info().rss / 1024 / 1024,
            "cpu_percent": process.cpu_percent(),
            "threads": process.num_threads(),
        }
    }
```

### Monitoring Integration
Response format is JSON, compatible with:
- CloudWatch custom metrics (via Lambda scraper)
- Datadog agent
- Prometheus (with json_exporter)
- Simple curl-based alerting scripts

---

## Component 4: Rate Limiting

### Design
Use in-memory rate limiting with sliding window.

```python
# backend/app/middleware/rate_limit.py

from collections import defaultdict
from dataclasses import dataclass
import time

@dataclass
class RateLimitConfig:
    requests: int
    window_seconds: int

class RateLimiter:
    def __init__(self):
        self._requests: dict[str, list[float]] = defaultdict(list)
    
    def is_allowed(self, key: str, config: RateLimitConfig) -> bool:
        now = time.time()
        window_start = now - config.window_seconds
        
        # Clean old requests
        self._requests[key] = [
            t for t in self._requests[key] 
            if t > window_start
        ]
        
        if len(self._requests[key]) >= config.requests:
            return False
        
        self._requests[key].append(now)
        return True

rate_limiter = RateLimiter()

# Configs
LOBBY_CREATE_LIMIT = RateLimitConfig(requests=5, window_seconds=60)
LOBBY_JOIN_LIMIT = RateLimitConfig(requests=10, window_seconds=60)
API_LIMIT = RateLimitConfig(requests=100, window_seconds=60)
```

### WebSocket Message Rate Limiting
```python
# In ConnectionManager or handlers

class MessageRateLimiter:
    def __init__(self, max_per_second: int = 60):
        self._counts: dict[str, tuple[float, int]] = {}
        self._max = max_per_second
    
    def check(self, user_id: str) -> bool:
        now = time.time()
        last_second, count = self._counts.get(user_id, (now, 0))
        
        if now - last_second >= 1.0:
            self._counts[user_id] = (now, 1)
            return True
        
        if count >= self._max:
            return False
        
        self._counts[user_id] = (last_second, count + 1)
        return True
```

---

## Configuration

Add to `backend/app/core/config.py`:

```python
class Settings(BaseSettings):
    # ... existing settings
    
    # Scaling settings
    MAX_WEBSOCKET_CONNECTIONS: int = 500
    MAX_CONNECTIONS_PER_LOBBY: int = 10
    LOBBY_CACHE_TTL_SECONDS: float = 5.0
    
    # Rate limits
    RATE_LIMIT_LOBBY_CREATE: int = 5  # per minute
    RATE_LIMIT_LOBBY_JOIN: int = 10   # per minute
    RATE_LIMIT_API: int = 100         # per minute
    RATE_LIMIT_WS_MESSAGES: int = 60  # per second
```

---

## File Changes Summary

| File | Change |
|------|--------|
| `backend/app/utils/lobby_cache.py` | New - Cache implementation |
| `backend/app/middleware/rate_limit.py` | New - Rate limiting |
| `backend/app/websocket/manager.py` | Add connection limits & stats |
| `backend/app/services/lobby_service.py` | Integrate cache |
| `backend/app/websocket/handlers.py` | Use cached lookups, add rate limiting |
| `backend/app/main.py` | Connection limit check, health routes |
| `backend/app/core/config.py` | Add scaling settings |
| `frontend/src/services/websocket.ts` | Handle server_full rejection |
| `frontend/src/components/ui/ServerBusyModal.tsx` | New - User-friendly error |

---

## Testing Strategy

1. **Unit tests** for cache TTL, rate limiting logic
2. **Load test** with k6 or locust to verify 500 CCU
3. **Manual test** connection rejection flow
