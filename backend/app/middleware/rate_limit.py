"""
Rate limiting middleware.

Provides in-memory rate limiting with sliding window algorithm.
Protects against abuse and reduces load from misbehaving clients.
"""

import time
from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, List, Optional
from threading import Lock

from fastapi import Request, HTTPException, status

from app.core.logging import get_logger

logger = get_logger("rate_limit")


@dataclass
class RateLimitConfig:
    """Configuration for a rate limit."""
    requests: int  # Max requests allowed
    window_seconds: int  # Time window in seconds
    
    def __str__(self) -> str:
        return f"{self.requests} requests per {self.window_seconds}s"


# Default rate limit configurations
LOBBY_CREATE_LIMIT = RateLimitConfig(requests=5, window_seconds=60)
LOBBY_JOIN_LIMIT = RateLimitConfig(requests=10, window_seconds=60)
API_LIMIT = RateLimitConfig(requests=100, window_seconds=60)
WS_MESSAGE_LIMIT = RateLimitConfig(requests=60, window_seconds=1)

# Per-endpoint category limits (Requirements 1.3, 7.2)
AUTH_LIMIT = RateLimitConfig(requests=10, window_seconds=60)  # 10/min for auth
GAME_LIMIT = RateLimitConfig(requests=1000, window_seconds=60)  # 1000/min for game
LEADERBOARD_LIMIT = RateLimitConfig(requests=100, window_seconds=60)  # 100/min
UPLOAD_LIMIT = RateLimitConfig(requests=10, window_seconds=60)  # 10/min for uploads
LOGIN_LIMIT = RateLimitConfig(requests=5, window_seconds=60)  # 5/min per IP for login

# Endpoint category mapping
ENDPOINT_LIMITS = {
    "/api/v1/auth/": AUTH_LIMIT,
    "/api/v1/auth/login": LOGIN_LIMIT,  # Stricter for login
    "/api/v1/game/": GAME_LIMIT,
    "/api/v1/leaderboards/": LEADERBOARD_LIMIT,
    "/api/v1/profiles/avatar": UPLOAD_LIMIT,
    "/api/v1/profiles/banner": UPLOAD_LIMIT,
}


class RateLimiter:
    """
    In-memory rate limiter using sliding window algorithm.
    
    Thread-safe with lock protection.
    """
    
    def __init__(self):
        self._requests: Dict[str, List[float]] = defaultdict(list)
        self._lock = Lock()
        
        # Stats
        self._total_requests = 0
        self._blocked_requests = 0
    
    def is_allowed(self, key: str, config: RateLimitConfig) -> bool:
        """
        Check if a request is allowed under the rate limit.
        
        Args:
            key: Unique identifier (e.g., user_id, IP address)
            config: Rate limit configuration
            
        Returns:
            True if allowed, False if rate limited
        """
        now = time.time()
        window_start = now - config.window_seconds
        
        with self._lock:
            self._total_requests += 1
            
            # Clean old requests outside the window
            self._requests[key] = [
                t for t in self._requests[key]
                if t > window_start
            ]
            
            # Check if under limit
            if len(self._requests[key]) >= config.requests:
                self._blocked_requests += 1
                return False
            
            # Record this request
            self._requests[key].append(now)
            return True
    
    def get_remaining(self, key: str, config: RateLimitConfig) -> int:
        """
        Get remaining requests allowed in current window.
        
        Args:
            key: Unique identifier
            config: Rate limit configuration
            
        Returns:
            Number of remaining requests allowed
        """
        now = time.time()
        window_start = now - config.window_seconds
        
        with self._lock:
            current_requests = [
                t for t in self._requests[key]
                if t > window_start
            ]
            return max(0, config.requests - len(current_requests))
    
    def get_reset_time(self, key: str, config: RateLimitConfig) -> Optional[float]:
        """
        Get time until rate limit resets.
        
        Args:
            key: Unique identifier
            config: Rate limit configuration
            
        Returns:
            Seconds until oldest request expires, or None if not limited
        """
        now = time.time()
        window_start = now - config.window_seconds
        
        with self._lock:
            requests = [t for t in self._requests[key] if t > window_start]
            if len(requests) >= config.requests and requests:
                oldest = min(requests)
                return (oldest + config.window_seconds) - now
            return None
    
    def get_stats(self) -> dict:
        """Get rate limiter statistics."""
        with self._lock:
            return {
                "total_requests": self._total_requests,
                "blocked_requests": self._blocked_requests,
                "block_rate": round(
                    self._blocked_requests / self._total_requests, 3
                ) if self._total_requests > 0 else 0,
                "tracked_keys": len(self._requests),
            }
    
    def clear(self, key: Optional[str] = None) -> None:
        """
        Clear rate limit data.
        
        Args:
            key: Specific key to clear, or None to clear all
        """
        with self._lock:
            if key:
                self._requests.pop(key, None)
            else:
                self._requests.clear()


class MessageRateLimiter:
    """
    Specialized rate limiter for high-frequency WebSocket messages.
    
    Uses a simpler per-second counter for efficiency.
    """
    
    def __init__(self, max_per_second: int = 60):
        self._max = max_per_second
        self._counts: Dict[str, tuple] = {}  # user_id -> (second, count)
        self._lock = Lock()
        
        # Stats
        self._total = 0
        self._blocked = 0
    
    def check(self, user_id: str) -> bool:
        """
        Check if a message is allowed.
        
        Args:
            user_id: User identifier
            
        Returns:
            True if allowed, False if rate limited
        """
        now = int(time.time())
        
        with self._lock:
            self._total += 1
            
            last_second, count = self._counts.get(user_id, (now, 0))
            
            # New second - reset counter
            if now != last_second:
                self._counts[user_id] = (now, 1)
                return True
            
            # Same second - check limit
            if count >= self._max:
                self._blocked += 1
                return False
            
            self._counts[user_id] = (last_second, count + 1)
            return True
    
    def get_stats(self) -> dict:
        """Get message rate limiter statistics."""
        with self._lock:
            return {
                "total_messages": self._total,
                "blocked_messages": self._blocked,
                "max_per_second": self._max,
            }


# Global instances
rate_limiter = RateLimiter()
message_rate_limiter = MessageRateLimiter()


def check_rate_limit(key: str, config: RateLimitConfig) -> None:
    """
    Check rate limit and raise HTTPException if exceeded.
    
    Args:
        key: Unique identifier for rate limiting
        config: Rate limit configuration
        
    Raises:
        HTTPException: 429 Too Many Requests if rate limited
    """
    if not rate_limiter.is_allowed(key, config):
        reset_time = rate_limiter.get_reset_time(key, config)
        logger.warning(f"Rate limit exceeded for {key}: {config}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "Rate limit exceeded",
                "limit": str(config),
                "retry_after": round(reset_time, 1) if reset_time else None,
            },
            headers={
                "Retry-After": str(int(reset_time)) if reset_time else "60",
                "X-RateLimit-Limit": str(config.requests),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(int(time.time() + (reset_time or 60))),
            }
        )


def get_rate_limit_for_endpoint(path: str) -> RateLimitConfig:
    """
    Get rate limit config for an endpoint path.
    
    Args:
        path: Request path
        
    Returns:
        Appropriate RateLimitConfig for the endpoint
    """
    # Check for exact match first
    if path in ENDPOINT_LIMITS:
        return ENDPOINT_LIMITS[path]
    
    # Check for prefix match
    for prefix, config in ENDPOINT_LIMITS.items():
        if path.startswith(prefix):
            return config
    
    # Default to API limit
    return API_LIMIT


def add_rate_limit_headers(
    response_headers: dict,
    key: str,
    config: RateLimitConfig
) -> dict:
    """
    Add rate limit headers to response.
    
    Args:
        response_headers: Existing headers dict
        key: Rate limit key
        config: Rate limit configuration
        
    Returns:
        Updated headers dict
    """
    remaining = rate_limiter.get_remaining(key, config)
    reset_time = rate_limiter.get_reset_time(key, config)
    
    response_headers["X-RateLimit-Limit"] = str(config.requests)
    response_headers["X-RateLimit-Remaining"] = str(remaining)
    response_headers["X-RateLimit-Reset"] = str(
        int(time.time() + (reset_time or config.window_seconds))
    )
    
    return response_headers


async def get_rate_limit_key(request: Request) -> str:
    """
    Get rate limit key from request.
    
    Uses user ID if authenticated, otherwise IP address.
    """
    # Try to get user ID from request state (set by auth middleware)
    user_id = getattr(request.state, "user_id", None)
    if user_id:
        return f"user:{user_id}"
    
    # Fall back to IP address
    client_ip = request.client.host if request.client else "unknown"
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    
    return f"ip:{client_ip}"


class RateLimitMiddleware:
    """
    ASGI middleware for rate limiting with X-RateLimit headers.
    
    Requirements: 7.2, 7.3
    """
    
    def __init__(self, app, exclude_paths: Optional[List[str]] = None):
        self.app = app
        self.exclude_paths = exclude_paths or ["/health", "/metrics", "/docs", "/openapi.json"]
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        path = scope.get("path", "")
        
        # Skip excluded paths
        if any(path.startswith(p) for p in self.exclude_paths):
            await self.app(scope, receive, send)
            return
        
        # Get rate limit config for this endpoint
        config = get_rate_limit_for_endpoint(path)
        
        # Get client identifier
        client_ip = "unknown"
        for header_name, header_value in scope.get("headers", []):
            if header_name == b"x-forwarded-for":
                client_ip = header_value.decode().split(",")[0].strip()
                break
        else:
            client = scope.get("client")
            if client:
                client_ip = client[0]
        
        key = f"ip:{client_ip}:{path.split('/')[3] if len(path.split('/')) > 3 else 'api'}"
        
        # Check rate limit
        if not rate_limiter.is_allowed(key, config):
            reset_time = rate_limiter.get_reset_time(key, config)
            
            # Send 429 response
            response_headers = [
                (b"content-type", b"application/json"),
                (b"retry-after", str(int(reset_time or 60)).encode()),
                (b"x-ratelimit-limit", str(config.requests).encode()),
                (b"x-ratelimit-remaining", b"0"),
                (b"x-ratelimit-reset", str(int(time.time() + (reset_time or 60))).encode()),
            ]
            
            await send({
                "type": "http.response.start",
                "status": 429,
                "headers": response_headers,
            })
            await send({
                "type": "http.response.body",
                "body": b'{"detail":"Rate limit exceeded"}',
            })
            return
        
        # Wrap send to add rate limit headers
        remaining = rate_limiter.get_remaining(key, config)
        reset_time = rate_limiter.get_reset_time(key, config)
        
        async def send_with_headers(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers.extend([
                    (b"x-ratelimit-limit", str(config.requests).encode()),
                    (b"x-ratelimit-remaining", str(remaining).encode()),
                    (b"x-ratelimit-reset", str(int(time.time() + (reset_time or config.window_seconds))).encode()),
                ])
                message = {**message, "headers": headers}
            await send(message)
        
        await self.app(scope, receive, send_with_headers)
