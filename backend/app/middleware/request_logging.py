"""
Request logging middleware.
Logs all requests with structured JSON format.
Requirements: 7.4, 14.2
"""

import json
import time
import logging
from typing import Optional

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("request_logger")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all HTTP requests with structured JSON format.
    
    Requirements: 7.4 - Request logging
    Requirements: 14.2 - Structured logging format
    
    Logs:
    - timestamp: ISO format timestamp
    - request_id: X-Request-ID header value
    - user_id: Authenticated user ID (if available)
    - method: HTTP method
    - path: Request path
    - query: Query parameters
    - status_code: Response status code
    - response_time_ms: Response time in milliseconds
    - client_ip: Client IP address
    - user_agent: User agent string
    """
    
    def __init__(self, app, exclude_paths: Optional[list] = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or ["/health", "/metrics", "/favicon.ico"]
    
    async def dispatch(self, request: Request, call_next):
        # Skip logging for excluded paths
        if request.url.path in self.exclude_paths:
            return await call_next(request)
        
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Calculate response time
        response_time_ms = (time.time() - start_time) * 1000
        
        # Get user ID if authenticated
        user_id = None
        if hasattr(request.state, "user") and request.state.user:
            user_id = request.state.user.id
        
        # Get request ID
        request_id = getattr(request.state, "request_id", None)
        if not request_id:
            request_id = response.headers.get("X-Request-ID")
        
        # Build log entry
        log_entry = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime()),
            "request_id": request_id,
            "user_id": user_id,
            "method": request.method,
            "path": request.url.path,
            "query": str(request.query_params) if request.query_params else None,
            "status_code": response.status_code,
            "response_time_ms": round(response_time_ms, 2),
            "client_ip": _get_client_ip(request),
            "user_agent": request.headers.get("User-Agent"),
        }
        
        # Log based on status code
        if response.status_code >= 500:
            logger.error(json.dumps(log_entry))
        elif response.status_code >= 400:
            logger.warning(json.dumps(log_entry))
        else:
            logger.info(json.dumps(log_entry))
        
        return response


def _get_client_ip(request: Request) -> str:
    """Extract client IP from request, handling proxies."""
    # Check X-Forwarded-For header (from load balancer/proxy)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # First IP in the list is the original client
        return forwarded_for.split(",")[0].strip()
    
    # Check X-Real-IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fall back to direct client IP
    if request.client:
        return request.client.host
    
    return "unknown"
