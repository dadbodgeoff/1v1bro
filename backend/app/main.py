"""
FastAPI application entry point.

Requirements: 7.5, 7.9, 7.10, 14.6
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.middleware.error_handler import app_exception_handler

logger = logging.getLogger(__name__)
from app.middleware.auth import decode_jwt_token, AuthenticationError, RequestTracingMiddleware
from app.middleware.request_logging import RequestLoggingMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.api.v1.router import router as v1_router
from app.websocket.manager import manager
from app.websocket.handlers import GameHandler
from app.websocket.events import build_lobby_state, build_player_joined
from app.services.lobby_service import LobbyService
from app.services.game_service import GameService
from app.services.matchmaking_service import init_matchmaking_service, matchmaking_service
from app.services.cosmetics_service import CosmeticsService
from app.database.supabase_client import get_supabase_client, get_supabase_service_client


settings = get_settings()

# Request size limits (Requirements: 7.9)
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB for uploads
MAX_REQUEST_SIZE = 1 * 1024 * 1024  # 1MB for regular requests


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup - Initialize matchmaking service with service client to bypass RLS
    service_client = get_supabase_service_client()
    mm_service = init_matchmaking_service(service_client)
    await mm_service.start()
    
    # Initialize event handlers with Supabase client for XP/progression tracking
    from app.events.handlers import set_supabase_client
    set_supabase_client(service_client)
    
    yield
    
    # Shutdown - Stop matchmaking service
    if matchmaking_service:
        await matchmaking_service.stop()


app = FastAPI(
    title=settings.APP_NAME,
    description="Real-time 1v1 trivia battle platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

# Middleware stack (order matters - first added = last executed)
# 1. CORS middleware (Requirements: 7.5)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
)

# 2. GZip compression middleware (Requirements: 7.10)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 3. Request tracing middleware (Requirements: 7.8)
app.add_middleware(RequestTracingMiddleware)

# 4. Request logging middleware (Requirements: 7.4, 14.2)
app.add_middleware(RequestLoggingMiddleware)

# Exception handlers
app.add_exception_handler(AppException, app_exception_handler)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Log validation errors for debugging."""
    logger.error(f"Validation error on {request.method} {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )


# Health check (Requirements: 14.6)
@app.get("/health")
async def health_check():
    """
    Health check endpoint for load balancers and monitoring.
    
    Returns:
        JSON with status, app name, and service health
    """
    # Check Redis connection
    redis_healthy = True
    try:
        from app.cache.redis_client import redis_client
        if redis_client._redis:
            await redis_client._redis.ping()
    except Exception:
        redis_healthy = False
    
    return {
        "status": "healthy" if redis_healthy else "degraded",
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "services": {
            "redis": "healthy" if redis_healthy else "unhealthy",
        }
    }


@app.get("/metrics")
async def metrics():
    """
    Basic metrics endpoint for monitoring.
    
    Returns:
        JSON with rate limiter stats and connection counts
    """
    from app.middleware.rate_limit import rate_limiter, message_rate_limiter
    
    return {
        "rate_limiter": rate_limiter.get_stats(),
        "message_rate_limiter": message_rate_limiter.get_stats(),
        "websocket_connections": manager.get_connection_count(),
    }


# API routes
app.include_router(v1_router, prefix=settings.API_V1_PREFIX)


def extract_token_from_subprotocol(websocket: WebSocket) -> str | None:
    """
    Extract JWT token from Sec-WebSocket-Protocol header.
    
    The client sends the token as a subprotocol with format: auth.{jwt_token}
    This prevents token exposure in server logs, browser history, and referrer headers.
    """
    protocols = websocket.headers.get("sec-websocket-protocol", "")
    for protocol in protocols.split(","):
        protocol = protocol.strip()
        if protocol.startswith("auth."):
            return protocol[5:]  # Remove "auth." prefix
    return None


# Matchmaking WebSocket endpoint
@app.websocket("/ws/matchmaking")
async def matchmaking_websocket_endpoint(
    websocket: WebSocket,
):
    """
    WebSocket endpoint for matchmaking queue updates.
    
    Connect with: ws://host/ws/matchmaking
    Authentication: Pass JWT token via Sec-WebSocket-Protocol header as 'auth.{token}'
    
    Send messages:
    - join_queue: Join the matchmaking queue
    - leave_queue: Leave the matchmaking queue
    - ping: Keepalive
    
    Receives:
    - matchmaking_connected: Connection confirmed
    - queue_joined: When successfully joined queue
    - queue_status: Periodic updates with position, wait time, queue size
    - match_found: When a match is found with lobby code
    - queue_cancelled: When removed from queue
    - error: When an error occurs
    """
    from app.services.matchmaking_service import get_matchmaking_service
    from app.matchmaking.heartbeat_monitor import heartbeat_monitor
    
    # Extract token from Sec-WebSocket-Protocol header (security: not in URL)
    token = extract_token_from_subprotocol(websocket)
    
    # Validate token
    user_id = None
    user_email = None
    
    if token:
        try:
            payload = decode_jwt_token(token)
            user_id = payload.get("sub")
            user_email = payload.get("email")
        except AuthenticationError:
            await websocket.close(code=4001, reason="Invalid token")
            return
    
    if not user_id:
        await websocket.close(code=4001, reason="Authentication required")
        return
    
    # Use special lobby code for matchmaking connections
    matchmaking_lobby = "__MATCHMAKING__"
    
    try:
        # Accept with the auth subprotocol to complete the handshake
        await manager.connect(websocket, matchmaking_lobby, user_id, subprotocol=f"auth.{token}")
        
        # Send confirmation - client should join queue after receiving this
        await manager.send_personal(websocket, {
            "type": "matchmaking_connected",
            "payload": {"user_id": user_id}
        })
        
        # Message loop - handle join/leave queue via WebSocket
        while True:
            try:
                data = await websocket.receive_json()
                msg_type = data.get("type")
                
                if msg_type == "ping":
                    await manager.send_personal(websocket, {"type": "pong"})
                
                elif msg_type == "health_pong":
                    # Response to health check ping from ConnectionManager
                    manager.record_pong(user_id)
                
                elif msg_type == "heartbeat_pong":
                    # Response to heartbeat ping from HeartbeatMonitor
                    await heartbeat_monitor.record_pong(user_id)
                    manager.update_last_message_time(user_id)
                
                elif msg_type == "queue_join":
                    # Join queue via WebSocket (ensures connection is ready)
                    try:
                        service = get_matchmaking_service()
                        payload = data.get("payload", {})
                        category = payload.get("category", "fortnite")
                        map_slug = payload.get("map_slug", "simple-arena")
                        ticket = await service.join_queue(
                            player_id=user_id,
                            player_name=user_email or "Unknown",
                            category=category,
                            map_slug=map_slug,
                        )
                        # queue_joined event is sent by the service
                        pass
                    except ValueError as e:
                        error_msg = str(e)
                        await manager.send_personal(websocket, {
                            "type": "error",
                            "payload": {"code": error_msg, "message": error_msg}
                        })
                
                elif msg_type == "leave_queue":
                    try:
                        service = get_matchmaking_service()
                        await service.leave_queue(user_id, "user_cancelled")
                    except Exception:
                        pass  # Silently handle leave queue errors
                    
            except WebSocketDisconnect:
                break
            except Exception:
                break
                
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        manager.disconnect(websocket)


# WebSocket endpoint
@app.websocket("/ws/{lobby_code}")
async def websocket_endpoint(
    websocket: WebSocket,
    lobby_code: str,
):
    """
    WebSocket endpoint for real-time game communication.
    
    Connect with: ws://host/ws/{lobby_code}
    Authentication: Pass JWT token via Sec-WebSocket-Protocol header as 'auth.{token}'
    
    Close codes:
    - 4001: Authentication required/invalid
    - 4003: Server full or lobby full
    """
    # Extract token from Sec-WebSocket-Protocol header (security: not in URL)
    token = extract_token_from_subprotocol(websocket)
    
    # Validate token
    user_id = None
    
    if token:
        try:
            payload = decode_jwt_token(token)
            user_id = payload.get("sub")
        except AuthenticationError:
            await websocket.close(code=4001, reason="Invalid token")
            return
    
    if not user_id:
        await websocket.close(code=4001, reason="Authentication required")
        return
    
    lobby_code = lobby_code.upper()
    
    # Check connection limits before accepting
    can_connect, reason = manager.can_accept_connection(lobby_code)
    if not can_connect:
        await websocket.accept()  # Must accept before closing with custom code
        await websocket.close(code=4003, reason=reason)
        return
    
    # Create services - use service client to bypass RLS for better performance
    service_client = get_supabase_service_client()
    lobby_service = LobbyService(service_client)
    game_service = GameService(service_client)
    cosmetics_service = CosmeticsService(service_client)
    handler = GameHandler(lobby_service, game_service, cosmetics_service)
    
    # Connect to lobby
    try:
        # Accept with the auth subprotocol to complete the handshake
        await manager.connect(websocket, lobby_code, user_id, subprotocol=f"auth.{token}")
        
        # Send initial lobby state and notify others
        try:
            await handler.handle_connect(lobby_code, user_id, None)
        except Exception as e:
            # Send error to client but keep connection open
            await manager.send_personal(websocket, {
                "type": "error",
                "payload": {"code": "CONNECT_ERROR", "message": str(e)}
            })
        
        # Message loop
        while True:
            data = await websocket.receive_json()
            await handler.handle_message(websocket, data, lobby_code, user_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await handler.handle_disconnect(lobby_code, user_id)
    except Exception:
        manager.disconnect(websocket)
