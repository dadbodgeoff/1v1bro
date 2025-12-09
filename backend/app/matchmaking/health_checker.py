"""
Connection health checker for matchmaking.

Verifies WebSocket connections are responsive before creating matches.
"""

import asyncio
from datetime import datetime
from typing import Dict, List

from app.core.logging import get_logger
from app.matchmaking.models import HealthCheckResult
from app.websocket.manager import manager

logger = get_logger("matchmaking.health")


class ConnectionHealthChecker:
    """
    Verifies WebSocket connections are responsive.
    
    Uses ping-pong exchange to confirm connections can receive messages
    before creating matches.
    """
    
    # Default timeout for health check ping-pong
    PING_TIMEOUT = 2.0  # seconds
    
    def __init__(self, connection_manager=None):
        """
        Initialize health checker.
        
        Args:
            connection_manager: Optional ConnectionManager instance (defaults to global)
        """
        self._manager = connection_manager or manager
    
    async def verify_health(self, user_id: str, timeout: float = None) -> HealthCheckResult:
        """
        Verify a user's connection is healthy via ping-pong.
        
        Args:
            user_id: Target user UUID
            timeout: Optional custom timeout (defaults to PING_TIMEOUT)
            
        Returns:
            HealthCheckResult with status and latency
        """
        timeout = timeout or self.PING_TIMEOUT
        checked_at = datetime.utcnow()
        
        # Check if user is connected at all
        if not self._manager.is_user_connected(user_id):
            logger.debug(f"Health check failed for {user_id}: not connected")
            return HealthCheckResult(
                user_id=user_id,
                healthy=False,
                failure_reason="not_connected",
                checked_at=checked_at,
            )
        
        # Perform ping-pong health check
        try:
            success, latency_ms = await self._manager.ping_user(user_id, timeout=timeout)
            
            if success:
                logger.debug(f"Health check passed for {user_id}: {latency_ms:.1f}ms")
                return HealthCheckResult(
                    user_id=user_id,
                    healthy=True,
                    latency_ms=latency_ms,
                    checked_at=checked_at,
                )
            else:
                logger.debug(f"Health check failed for {user_id}: ping timeout")
                return HealthCheckResult(
                    user_id=user_id,
                    healthy=False,
                    failure_reason="ping_timeout",
                    checked_at=checked_at,
                )
                
        except Exception as e:
            logger.warning(f"Health check error for {user_id}: {e}")
            return HealthCheckResult(
                user_id=user_id,
                healthy=False,
                failure_reason="send_failed",
                checked_at=checked_at,
            )
    
    async def verify_multiple(
        self,
        user_ids: List[str],
        timeout: float = None,
    ) -> Dict[str, HealthCheckResult]:
        """
        Verify multiple connections in parallel.
        
        Args:
            user_ids: List of user UUIDs to check
            timeout: Optional custom timeout per check
            
        Returns:
            Dict mapping user_id to HealthCheckResult
        """
        timeout = timeout or self.PING_TIMEOUT
        
        # Run all health checks in parallel
        tasks = [
            self.verify_health(user_id, timeout=timeout)
            for user_id in user_ids
        ]
        
        results = await asyncio.gather(*tasks)
        
        return {
            result.user_id: result
            for result in results
        }
    
    async def verify_both_healthy(
        self,
        user_id_1: str,
        user_id_2: str,
        timeout: float = None,
    ) -> tuple:
        """
        Verify both players have healthy connections.
        
        Convenience method for match creation.
        
        Args:
            user_id_1: First player UUID
            user_id_2: Second player UUID
            timeout: Optional custom timeout
            
        Returns:
            Tuple of (both_healthy, result_1, result_2)
        """
        results = await self.verify_multiple([user_id_1, user_id_2], timeout=timeout)
        
        result_1 = results[user_id_1]
        result_2 = results[user_id_2]
        
        both_healthy = result_1.healthy and result_2.healthy
        
        if not both_healthy:
            if not result_1.healthy:
                logger.info(
                    f"Player {user_id_1} failed health check: {result_1.failure_reason}"
                )
            if not result_2.healthy:
                logger.info(
                    f"Player {user_id_2} failed health check: {result_2.failure_reason}"
                )
        
        return both_healthy, result_1, result_2


# Global health checker instance
health_checker = ConnectionHealthChecker()
