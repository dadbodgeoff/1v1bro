"""
FastAPI application entry point.

Requirements: 7.5, 7.9, 7.10, 14.6
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.middleware.error_handler import app_exception_handler
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
    # Startup
    print(f"Starting {settings.APP_NAME}...")
    
    # Initialize matchmaking service with service client to bypass RLS
    service_client = get_supabase_service_client()
    mm_service = init_matchmaking_service(service_client)
    await mm_service.start()
    
    # Initialize event handlers with Supabase client for XP/progression tracking
    from app.events.handlers import set_supabase_client
    set_supabase_client(service_client)
    print("Event handlers initialized with Supabase client")
    
    yield
    
    # Shutdown
    print(f"Shutting down {settings.APP_NAME}...")
    
    # Stop matchmaking service
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


# Matchmaking WebSocket endpoint
@app.websocket("/ws/matchmaking")
async def matchmaking_websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(None),
):
    """
    WebSocket endpoint for matchmaking queue updates.
    
    Connect with: ws://host/ws/matchmaking?token={jwt_token}
    
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
        print(f"[WS-MM] Connecting user {user_id} to matchmaking")
        await manager.connect(websocket, matchmaking_lobby, user_id)
        
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
                
                elif msg_type == "join_queue":
                    # Join queue via WebSocket (ensures connection is ready)
                    try:
                        service = get_matchmaking_service()
                        payload = data.get("payload", {})
                        category = payload.get("category", "fortnite")
                        ticket = await service.join_queue(
                            player_id=user_id,
                            player_name=user_email or "Unknown",
                            category=category,
                        )
                        # queue_joined event is sent by the service
                        print(f"[WS-MM] User {user_id} joined queue via WebSocket (category: {category})")
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
                        print(f"[WS-MM] User {user_id} left queue via WebSocket")
                    except Exception as e:
                        print(f"[WS-MM] Error leaving queue: {e}")
                    
            except WebSocketDisconnect:
                break
            except Exception as e:
                print(f"[WS-MM] Error receiving message: {e}")
                break
                
    except WebSocketDisconnect:
        print(f"[WS-MM] WebSocketDisconnect for user {user_id}")
    except Exception as e:
        print(f"[WS-MM] Exception for user {user_id}: {e}")
    finally:
        manager.disconnect(websocket)
        print(f"[WS-MM] User {user_id} disconnected from matchmaking")


# WebSocket endpoint
@app.websocket("/ws/{lobby_code}")
async def websocket_endpoint(
    websocket: WebSocket,
    lobby_code: str,
    token: str = Query(None),
):
    """
    WebSocket endpoint for real-time game communication.
    
    Connect with: ws://host/ws/{lobby_code}?token={jwt_token}
    
    Close codes:
    - 4001: Authentication required/invalid
    - 4003: Server full or lobby full
    """
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
    
    # Create services
    client = get_supabase_client()
    service_client = get_supabase_service_client()  # Use service client for cosmetics to bypass RLS
    lobby_service = LobbyService(client)
    game_service = GameService(client)
    cosmetics_service = CosmeticsService(service_client)
    handler = GameHandler(lobby_service, game_service, cosmetics_service)
    
    # Connect to lobby
    try:
        print(f"[WS] Connecting user {user_id} to lobby {lobby_code}")
        await manager.connect(websocket, lobby_code, user_id)
        print(f"[WS] Connected, calling handle_connect")
        
        # Send initial lobby state and notify others
        try:
            await handler.handle_connect(lobby_code, user_id, None)
            print(f"[WS] handle_connect completed successfully")
        except Exception as e:
            print(f"Error in handle_connect: {e}")
            import traceback
            traceback.print_exc()
            # Send error to client but keep connection open
            await manager.send_personal(websocket, {
                "type": "error",
                "payload": {"code": "CONNECT_ERROR", "message": str(e)}
            })
        
        print(f"[WS] Entering message loop")
        # Message loop
        while True:
            data = await websocket.receive_json()
            print(f"[WS] Received message: {data.get('type')}")
            await handler.handle_message(websocket, data, lobby_code, user_id)
            
    except WebSocketDisconnect:
        print(f"[WS] WebSocketDisconnect for user {user_id}")
        manager.disconnect(websocket)
        await handler.handle_disconnect(lobby_code, user_id)
    except Exception as e:
        print(f"[WS] Exception for user {user_id}: {e}")
        manager.disconnect(websocket)
        import traceback
        traceback.print_exc()
