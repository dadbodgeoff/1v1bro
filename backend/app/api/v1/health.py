"""
Health and metrics endpoints.

Provides server health status and detailed metrics for monitoring.
"""

import os
import time
from fastapi import APIRouter

from app.websocket.manager import manager
from app.services.game.session import SessionManager
from app.utils.lobby_cache import lobby_cache
from app.core.config import get_settings

router = APIRouter(prefix="/health", tags=["health"])

settings = get_settings()

# Track server start time
_server_start_time = time.time()


@router.get("")
async def health_check():
    """
    Basic health check endpoint.
    
    Returns minimal response for load balancer health checks.
    Fast response time (no DB calls).
    """
    return {"status": "healthy"}


@router.get("/detailed")
async def detailed_health():
    """
    Detailed health metrics for monitoring.
    
    Returns comprehensive server metrics including:
    - Connection statistics
    - Cache performance
    - Active game sessions
    - System resource usage
    
    Suitable for CloudWatch, Datadog, or Prometheus ingestion.
    """
    # Get memory usage (without psutil for simplicity)
    try:
        import resource
        mem_usage = resource.getrusage(resource.RUSAGE_SELF)
        memory_mb = mem_usage.ru_maxrss / 1024 / 1024  # Convert to MB on macOS
        # On Linux, ru_maxrss is in KB
        if os.uname().sysname == 'Linux':
            memory_mb = mem_usage.ru_maxrss / 1024
    except Exception:
        memory_mb = 0
    
    uptime_seconds = time.time() - _server_start_time
    
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "uptime_seconds": round(uptime_seconds, 1),
        
        # Connection metrics
        "connections": manager.get_stats(),
        
        # Cache metrics
        "cache": lobby_cache.get_stats(),
        
        # Game session metrics
        "games": {
            "active_sessions": len(SessionManager._sessions),
            "session_ids": list(SessionManager._sessions.keys())[:10],  # First 10 for debugging
        },
        
        # System metrics
        "system": {
            "memory_mb": round(memory_mb, 1),
            "pid": os.getpid(),
        },
        
        # Configuration
        "config": {
            "max_connections": settings.MAX_WEBSOCKET_CONNECTIONS,
            "max_per_lobby": settings.MAX_CONNECTIONS_PER_LOBBY,
            "cache_ttl_seconds": settings.LOBBY_CACHE_TTL_SECONDS,
        }
    }


@router.get("/ready")
async def readiness_check():
    """
    Readiness check for Kubernetes/container orchestration.
    
    Returns 200 if server is ready to accept traffic.
    Could be extended to check database connectivity, etc.
    """
    return {
        "ready": True,
        "connections_available": manager.get_stats()["total_connections"] < settings.MAX_WEBSOCKET_CONNECTIONS,
    }
