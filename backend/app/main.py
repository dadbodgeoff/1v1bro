"""
FastAPI application entry point.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.middleware.error_handler import app_exception_handler
from app.middleware.auth import decode_jwt_token, AuthenticationError
from app.api.v1.router import router as v1_router
from app.websocket.manager import manager
from app.websocket.handlers import GameHandler
from app.websocket.events import build_lobby_state, build_player_joined
from app.services.lobby_service import LobbyService
from app.services.game_service import GameService
from app.database.supabase_client import get_supabase_client


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print(f"Starting {settings.APP_NAME}...")
    yield
    # Shutdown
    print(f"Shutting down {settings.APP_NAME}...")


app = FastAPI(
    title=settings.APP_NAME,
    description="Real-time 1v1 trivia battle platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(AppException, app_exception_handler)


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "app": settings.APP_NAME}


# API routes
app.include_router(v1_router, prefix=settings.API_V1_PREFIX)


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
    
    # Create services
    client = get_supabase_client()
    lobby_service = LobbyService(client)
    game_service = GameService(client)
    handler = GameHandler(lobby_service, game_service)
    
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
