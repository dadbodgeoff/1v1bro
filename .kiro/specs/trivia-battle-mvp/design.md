# Design Document

## Overview

This document outlines the technical design for the 1v1 Trivia Battle platform — a real-time synchronized quiz game built with FastAPI, Supabase, and a React PWA frontend. The system enables two authenticated players to compete in 15-question matches with synchronized timers, live scoring, and persistent game history.

The architecture follows enterprise patterns including dependency injection, repository pattern, service layer abstraction, and standardized API responses. The backend runs on FastAPI at port 8000, proxied through Nginx alongside the static frontend.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Nginx                                │
│                    (port 80/443)                             │
├─────────────────────────────────────────────────────────────┤
│  /              → Static frontend (React PWA)                │
│  /api/*         → FastAPI :8000                              │
│  /ws/*          → FastAPI WebSocket :8000                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  API Layer  │  │  Services   │  │ Repositories│          │
│  │  (Routers)  │──│  (Logic)    │──│  (Data)     │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│         │                │                │                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Middleware  │  │  WebSocket  │  │   Schemas   │          │
│  │ (Auth/Err)  │  │  Manager    │  │  (Pydantic) │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Supabase                               │
│  ┌─────────────┐  ┌─────────────────────────────────┐       │
│  │    Auth     │  │           Postgres               │       │
│  │   (JWT)     │  │  (users, lobbies, games)         │       │
│  └─────────────┘  └─────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
1v1bro/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app entry point
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py              # Pydantic Settings, env loading
│   │   │   ├── exceptions.py          # Custom exception hierarchy
│   │   │   ├── responses.py           # Standardized API response models
│   │   │   └── logging.py             # Structured logging setup
│   │   ├── middleware/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                # JWT + Supabase auth middleware
│   │   │   ├── error_handler.py       # Global exception → response mapping
│   │   │   └── request_context.py     # Request ID, timing, correlation
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   ├── supabase_client.py     # Client factory + connection management
│   │   │   ├── migrations/
│   │   │   │   └── 001_initial_schema.sql
│   │   │   └── repositories/
│   │   │       ├── __init__.py
│   │   │       ├── base.py            # Generic CRUD operations
│   │   │       ├── user_repo.py       # User profile operations
│   │   │       ├── lobby_repo.py      # Lobby CRUD
│   │   │       └── game_repo.py       # Game history operations
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── base.py                # BaseService with common patterns
│   │   │   ├── auth_service.py        # Token creation, validation
│   │   │   ├── lobby_service.py       # Lobby business logic
│   │   │   ├── game_service.py        # Game orchestration
│   │   │   └── question_service.py    # Question loading/management
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── deps.py                # Shared FastAPI dependencies
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── router.py          # Aggregates all v1 routes
│   │   │       ├── auth.py            # Auth endpoints
│   │   │       ├── lobby.py           # Lobby endpoints
│   │   │       └── game.py            # Game/history endpoints
│   │   ├── websocket/
│   │   │   ├── __init__.py
│   │   │   ├── manager.py             # Connection manager
│   │   │   ├── handlers.py            # Message handlers
│   │   │   └── events.py              # Event type definitions
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── base.py                # BaseSchema with common config
│   │   │   ├── auth.py                # Auth request/response schemas
│   │   │   ├── lobby.py               # Lobby schemas
│   │   │   ├── game.py                # Game state schemas
│   │   │   ├── player.py              # Player schemas
│   │   │   └── ws_messages.py         # WebSocket message schemas
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── helpers.py             # Generic helpers (code generation)
│   │       ├── validators.py          # Custom Pydantic validators
│   │       └── constants.py           # App-wide constants
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py                # Pytest fixtures
│   │   ├── test_auth.py
│   │   ├── test_lobby.py
│   │   ├── test_game.py
│   │   └── test_websocket.py
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   └── pytest.ini
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Lobby.tsx
│   │   │   ├── Game.tsx
│   │   │   └── Results.tsx
│   │   ├── components/
│   │   │   ├── Timer.tsx
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── Scoreboard.tsx
│   │   │   └── LobbyCode.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useWebSocket.ts
│   │   │   └── useGame.ts
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── styles/
│   │       └── globals.css
│   ├── public/
│   │   ├── manifest.json
│   │   └── sw.js
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── nginx/
│   └── trivia.conf
├── docker-compose.yml
├── .env.example
└── README.md
```

## Components and Interfaces

### Core Infrastructure

#### Config (core/config.py)
```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # App
    APP_NAME: str = "1v1 Bro"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str
    
    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # Game
    QUESTIONS_PER_GAME: int = 15
    QUESTION_TIME_SECONDS: int = 30
    RECONNECT_TIMEOUT_SECONDS: int = 30
    LOBBY_ABANDON_TIMEOUT_SECONDS: int = 60
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

#### Custom Exceptions (core/exceptions.py)
```python
from typing import Optional, Any

class AppException(Exception):
    """Base exception for all application errors"""
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: str = "INTERNAL_ERROR",
        details: Optional[Any] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details
        super().__init__(message)

class AuthenticationError(AppException):
    def __init__(self, message: str = "Authentication failed", details: Optional[Any] = None):
        super().__init__(message, 401, "AUTH_ERROR", details)

class AuthorizationError(AppException):
    def __init__(self, message: str = "Not authorized", details: Optional[Any] = None):
        super().__init__(message, 403, "FORBIDDEN", details)

class NotFoundError(AppException):
    def __init__(self, resource: str, identifier: str):
        super().__init__(f"{resource} not found: {identifier}", 404, "NOT_FOUND")

class ValidationError(AppException):
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message, 422, "VALIDATION_ERROR", details)

class LobbyFullError(AppException):
    def __init__(self, lobby_code: str):
        super().__init__(f"Lobby {lobby_code} is full", 409, "LOBBY_FULL")

class GameStateError(AppException):
    def __init__(self, message: str):
        super().__init__(message, 409, "GAME_STATE_ERROR")
```

#### Standardized Responses (core/responses.py)
```python
from typing import TypeVar, Generic, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[str] = None
    error_code: Optional[str] = None
    details: Optional[Any] = None

    @classmethod
    def ok(cls, data: T) -> "APIResponse[T]":
        return cls(success=True, data=data)

    @classmethod
    def fail(cls, error: str, error_code: str = "ERROR", details: Any = None) -> "APIResponse":
        return cls(success=False, error=error, error_code=error_code, details=details)
```

### Middleware

#### Auth Middleware (middleware/auth.py)
```python
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, NamedTuple
import jwt
from datetime import datetime, timedelta

from app.core.config import get_settings
from app.database.supabase_client import get_supabase_client, get_supabase_service_client
from app.core.exceptions import AuthenticationError

security = HTTPBearer()
settings = get_settings()

class AuthenticatedUser(NamedTuple):
    id: str
    email: Optional[str] = None

async def get_current_user(
    request: Request,
    supabase = Depends(get_supabase_client)
) -> AuthenticatedUser:
    """
    Extract and validate JWT token from httpOnly cookie or Authorization header.
    """
    token = None
    
    # Try cookie first (secure method)
    token = request.cookies.get("access_token")
    
    # Fallback to Authorization header
    if not token:
        authorization = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
    
    if not token:
        raise AuthenticationError("Not authenticated")
    
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: Optional[str] = payload.get("sub")
        email: Optional[str] = payload.get("email")
        
        if user_id is None:
            raise AuthenticationError("Invalid authentication token")
        
        # Verify token expiration
        exp = payload.get("exp")
        if exp and datetime.utcnow().timestamp() > exp:
            raise AuthenticationError("Token has expired")
        
        auth_user = AuthenticatedUser(id=user_id, email=email)
        request.state.user = auth_user
        return auth_user
        
    except jwt.PyJWTError:
        raise AuthenticationError("Invalid authentication token")

async def get_current_user_optional(
    request: Request,
    supabase = Depends(get_supabase_client)
) -> Optional[AuthenticatedUser]:
    """Try to get current user without requiring authentication."""
    try:
        return await get_current_user(request, supabase)
    except AuthenticationError:
        return None

def create_jwt_token(user_id: str, email: str) -> str:
    """Create a JWT token for the user."""
    expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    to_encode = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    }
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
```

#### Error Handler Middleware (middleware/error_handler.py)
```python
from fastapi import Request
from fastapi.responses import JSONResponse
from app.core.exceptions import AppException
from app.core.responses import APIResponse

async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=APIResponse.fail(
            error=exc.message,
            error_code=exc.error_code,
            details=exc.details
        ).model_dump()
    )
```

### Database Layer

#### Supabase Client (database/supabase_client.py)
```python
from supabase import create_client, Client
from functools import lru_cache
from app.core.config import get_settings

settings = get_settings()

@lru_cache()
def get_supabase_client() -> Client:
    """Get Supabase client with anon key for user-context operations."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

@lru_cache()
def get_supabase_service_client() -> Client:
    """Get Supabase client with service key for admin operations."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
```

#### Base Repository (database/repositories/base.py)
```python
from typing import TypeVar, Generic, Optional, List, Any
from supabase import Client

T = TypeVar("T")

class BaseRepository(Generic[T]):
    def __init__(self, client: Client, table_name: str):
        self.client = client
        self.table_name = table_name
    
    async def get_by_id(self, id: str) -> Optional[dict]:
        result = self.client.table(self.table_name).select("*").eq("id", id).execute()
        return result.data[0] if result.data else None
    
    async def get_all(self, limit: int = 100) -> List[dict]:
        result = self.client.table(self.table_name).select("*").limit(limit).execute()
        return result.data
    
    async def create(self, data: dict) -> dict:
        result = self.client.table(self.table_name).insert(data).execute()
        return result.data[0]
    
    async def update(self, id: str, data: dict) -> Optional[dict]:
        result = self.client.table(self.table_name).update(data).eq("id", id).execute()
        return result.data[0] if result.data else None
    
    async def delete(self, id: str) -> bool:
        result = self.client.table(self.table_name).delete().eq("id", id).execute()
        return len(result.data) > 0
```

#### Lobby Repository (database/repositories/lobby_repo.py)
```python
from typing import Optional
from supabase import Client
from app.database.repositories.base import BaseRepository

class LobbyRepository(BaseRepository):
    def __init__(self, client: Client):
        super().__init__(client, "lobbies")
    
    async def get_by_code(self, code: str) -> Optional[dict]:
        result = self.client.table(self.table_name).select("*").eq("code", code).eq("status", "waiting").execute()
        return result.data[0] if result.data else None
    
    async def get_active_by_code(self, code: str) -> Optional[dict]:
        result = self.client.table(self.table_name).select("*").eq("code", code).in_("status", ["waiting", "in_progress"]).execute()
        return result.data[0] if result.data else None
    
    async def update_status(self, lobby_id: str, status: str) -> Optional[dict]:
        return await self.update(lobby_id, {"status": status})
    
    async def code_exists(self, code: str) -> bool:
        result = self.client.table(self.table_name).select("id").eq("code", code).in_("status", ["waiting", "in_progress"]).execute()
        return len(result.data) > 0
```

### Services

#### Lobby Service (services/lobby_service.py)
```python
from typing import Optional
import secrets
import string
from app.database.repositories.lobby_repo import LobbyRepository
from app.core.exceptions import NotFoundError, LobbyFullError, ValidationError

class LobbyService:
    def __init__(self, lobby_repo: LobbyRepository):
        self.lobby_repo = lobby_repo
    
    def _generate_code(self, length: int = 6) -> str:
        """Generate a random alphanumeric lobby code."""
        alphabet = string.ascii_uppercase + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    async def create_lobby(self, host_id: str, game_mode: str = "fortnite") -> dict:
        """Create a new lobby with a unique code."""
        # Generate unique code
        code = self._generate_code()
        while await self.lobby_repo.code_exists(code):
            code = self._generate_code()
        
        lobby_data = {
            "code": code,
            "host_id": host_id,
            "status": "waiting",
            "game_mode": game_mode
        }
        return await self.lobby_repo.create(lobby_data)
    
    async def join_lobby(self, code: str, player_id: str) -> dict:
        """Join an existing lobby."""
        lobby = await self.lobby_repo.get_by_code(code.upper())
        if not lobby:
            raise NotFoundError("Lobby", code)
        
        if lobby.get("opponent_id"):
            raise LobbyFullError(code)
        
        if lobby["host_id"] == player_id:
            raise ValidationError("Cannot join your own lobby")
        
        updated = await self.lobby_repo.update(lobby["id"], {"opponent_id": player_id})
        return updated
    
    async def get_lobby(self, code: str) -> dict:
        """Get lobby by code."""
        lobby = await self.lobby_repo.get_active_by_code(code.upper())
        if not lobby:
            raise NotFoundError("Lobby", code)
        return lobby
    
    async def start_game(self, lobby_id: str, host_id: str) -> dict:
        """Start the game (host only)."""
        lobby = await self.lobby_repo.get_by_id(lobby_id)
        if not lobby:
            raise NotFoundError("Lobby", lobby_id)
        
        if lobby["host_id"] != host_id:
            raise ValidationError("Only the host can start the game")
        
        if not lobby.get("opponent_id"):
            raise ValidationError("Cannot start game without an opponent")
        
        return await self.lobby_repo.update_status(lobby_id, "in_progress")
```

### WebSocket Layer

#### WebSocket Manager (websocket/manager.py)
```python
from typing import Dict, Set, Optional
from fastapi import WebSocket
import json
import asyncio

class ConnectionManager:
    def __init__(self):
        # lobby_code -> set of websockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # websocket -> (lobby_code, user_id)
        self.connection_info: Dict[WebSocket, tuple] = {}
    
    async def connect(self, websocket: WebSocket, lobby_code: str, user_id: str):
        await websocket.accept()
        if lobby_code not in self.active_connections:
            self.active_connections[lobby_code] = set()
        self.active_connections[lobby_code].add(websocket)
        self.connection_info[websocket] = (lobby_code, user_id)
    
    def disconnect(self, websocket: WebSocket):
        info = self.connection_info.get(websocket)
        if info:
            lobby_code, _ = info
            if lobby_code in self.active_connections:
                self.active_connections[lobby_code].discard(websocket)
                if not self.active_connections[lobby_code]:
                    del self.active_connections[lobby_code]
            del self.connection_info[websocket]
    
    async def broadcast_to_lobby(self, lobby_code: str, message: dict):
        if lobby_code in self.active_connections:
            data = json.dumps(message)
            for connection in self.active_connections[lobby_code]:
                try:
                    await connection.send_text(data)
                except:
                    pass
    
    async def send_personal(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_text(json.dumps(message))
        except:
            pass
    
    def get_lobby_connections(self, lobby_code: str) -> int:
        return len(self.active_connections.get(lobby_code, set()))
    
    def get_user_id(self, websocket: WebSocket) -> Optional[str]:
        info = self.connection_info.get(websocket)
        return info[1] if info else None

manager = ConnectionManager()
```

#### WebSocket Events (websocket/events.py)
```python
from enum import Enum
from typing import Optional, List, Any
from pydantic import BaseModel

class WSEventType(str, Enum):
    # Server -> Client
    PLAYER_JOINED = "player_joined"
    PLAYER_LEFT = "player_left"
    GAME_START = "game_start"
    QUESTION = "question"
    ROUND_RESULT = "round_result"
    GAME_END = "game_end"
    ERROR = "error"
    PLAYER_DISCONNECTED = "player_disconnected"
    PLAYER_RECONNECTED = "player_reconnected"
    
    # Client -> Server
    READY = "ready"
    ANSWER = "answer"
    START_GAME = "start_game"

class WSMessage(BaseModel):
    type: WSEventType
    payload: Optional[Any] = None

class QuestionPayload(BaseModel):
    q_num: int
    text: str
    options: List[str]
    start_time: int  # Unix timestamp in milliseconds

class AnswerPayload(BaseModel):
    q_num: int
    answer: str
    time_ms: int

class RoundResultPayload(BaseModel):
    q_num: int
    correct_answer: str
    scores: dict  # {player_id: score}
    answers: dict  # {player_id: answer}

class GameEndPayload(BaseModel):
    winner_id: Optional[str]
    final_scores: dict
    is_tie: bool = False
```

### Schemas

#### Base Schema (schemas/base.py)
```python
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class TimestampMixin(BaseModel):
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
```

#### Lobby Schemas (schemas/lobby.py)
```python
from typing import Optional, List
from pydantic import Field
from app.schemas.base import BaseSchema, TimestampMixin

class LobbyCreate(BaseSchema):
    game_mode: str = Field(default="fortnite", description="Game mode/category")

class LobbyJoin(BaseSchema):
    code: str = Field(..., min_length=6, max_length=6, description="6-character lobby code")

class PlayerInfo(BaseSchema):
    id: str
    display_name: Optional[str] = None
    is_host: bool = False

class LobbyResponse(BaseSchema, TimestampMixin):
    id: str
    code: str
    host_id: str
    opponent_id: Optional[str] = None
    status: str
    game_mode: str
    players: List[PlayerInfo] = []

class LobbyCodeResponse(BaseSchema):
    code: str
    lobby_id: str
```

#### Game Schemas (schemas/game.py)
```python
from typing import Optional, List, Dict, Any
from pydantic import Field
from app.schemas.base import BaseSchema, TimestampMixin

class Question(BaseSchema):
    id: int
    text: str
    options: List[str]
    correct_answer: str  # Only used server-side

class QuestionPublic(BaseSchema):
    """Question without the correct answer - sent to clients"""
    q_num: int
    text: str
    options: List[str]

class PlayerScore(BaseSchema):
    player_id: str
    score: int
    correct_count: int

class GameState(BaseSchema):
    lobby_id: str
    current_question: int
    total_questions: int
    scores: Dict[str, int]
    status: str  # waiting, in_progress, completed

class GameResult(BaseSchema, TimestampMixin):
    id: str
    lobby_id: str
    winner_id: Optional[str]
    player1_id: str
    player1_score: int
    player2_id: str
    player2_score: int
    is_tie: bool = False
```

## Data Models

### Database Schema (migrations/001_initial_schema.sql)
```sql
-- User profiles (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(50),
    avatar_url TEXT,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game lobbies
CREATE TABLE IF NOT EXISTS lobbies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(6) UNIQUE NOT NULL,
    host_id UUID NOT NULL REFERENCES auth.users(id),
    opponent_id UUID REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'abandoned')),
    game_mode VARCHAR(50) DEFAULT 'fortnite',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Completed games
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id UUID NOT NULL REFERENCES lobbies(id),
    winner_id UUID REFERENCES auth.users(id),
    player1_id UUID NOT NULL REFERENCES auth.users(id),
    player1_score INTEGER NOT NULL DEFAULT 0,
    player2_id UUID NOT NULL REFERENCES auth.users(id),
    player2_score INTEGER NOT NULL DEFAULT 0,
    questions_data JSONB NOT NULL,
    answers_data JSONB,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lobbies_code ON lobbies(code);
CREATE INDEX idx_lobbies_status ON lobbies(status);
CREATE INDEX idx_lobbies_host ON lobbies(host_id);
CREATE INDEX idx_games_players ON games(player1_id, player2_id);
CREATE INDEX idx_games_winner ON games(winner_id);
CREATE INDEX idx_games_completed ON games(completed_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lobbies_updated_at
    BEFORE UPDATE ON lobbies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Lobby Code Uniqueness and Format

*For any* set of active lobbies in the system, all lobby codes SHALL be unique, exactly 6 characters long, and composed only of uppercase alphanumeric characters.

**Validates: Requirements 2.1, 2.4**

### Property 2: Lobby Creation State

*For any* newly created lobby, the lobby SHALL have status "waiting", the correct host_id, no opponent_id, and a valid unique code.

**Validates: Requirements 2.2**

### Property 3: Invalid Lobby Code Rejection

*For any* lobby code that does not exist or belongs to a non-active lobby, attempting to join SHALL return a NotFoundError.

**Validates: Requirements 3.2**

### Property 4: Full Lobby Rejection

*For any* lobby that already has both a host and an opponent, attempting to join with a third player SHALL return a LobbyFullError.

**Validates: Requirements 3.3**

### Property 5: Question Structure Completeness

*For any* question delivered to players, it SHALL contain a question number (1-15), question text (non-empty string), and exactly 4 answer options.

**Validates: Requirements 5.2**

### Property 6: Question Delivery Consistency

*For any* game session, both players SHALL receive questions in the same order with the same option ordering per question.

**Validates: Requirements 5.3, 5.4**

### Property 7: Game Question Count

*For any* started game, exactly 15 questions SHALL be loaded and the game SHALL end after all 15 questions are answered or timed out.

**Validates: Requirements 5.1, 5.5**

### Property 8: Scoring Formula Correctness

*For any* answer submission:
- If correct: score = max(0, 1000 - (time_ms / 30)), rounded to integer
- If incorrect or timeout: score = 0

**Validates: Requirements 6.2, 6.3, 6.4**

### Property 9: Answer Recording Completeness

*For any* submitted answer, the system SHALL record the player_id, question_number, selected_answer, and time_ms.

**Validates: Requirements 6.1**

### Property 10: Final Score Calculation

*For any* completed game, each player's final score SHALL equal the sum of their individual round scores.

**Validates: Requirements 7.1**

### Property 11: Game Persistence Round Trip

*For any* completed game, storing and then retrieving the game record SHALL return equivalent data including both player IDs, scores, questions_data, and answers_data.

**Validates: Requirements 7.3, 10.1, 10.2**

### Property 12: Game History Retrieval

*For any* user who has completed games, requesting their game history SHALL return all games where they were player1 or player2.

**Validates: Requirements 10.3**

### Property 13: WebSocket Message Format

*For any* WebSocket message sent by the server, it SHALL be valid JSON with a "type" field (string) and optional "payload" field.

**Validates: Requirements 8.5**

### Property 14: API Response Envelope

*For any* API response, it SHALL contain a "success" boolean field, and either "data" (on success) or "error" and "error_code" fields (on failure).

**Validates: Requirements 9.2**

### Property 15: Request Validation

*For any* API request with invalid data according to the Pydantic schema, the system SHALL return HTTP 422 with validation error details.

**Validates: Requirements 9.1**

### Property 16: Protected Endpoint Authentication

*For any* request to a protected endpoint without a valid JWT token, the system SHALL return HTTP 401 Unauthorized.

**Validates: Requirements 9.4**

### Property 17: Lobby Status Transitions

*For any* lobby, status transitions SHALL only follow valid paths: waiting → in_progress → completed, or waiting → abandoned.

**Validates: Requirements 10.4, 10.5**

### Property 18: Timer Calculation Consistency

*For any* question with a server-provided start_time, the client-calculated remaining time SHALL equal max(0, 30000 - (current_time - start_time)) milliseconds.

**Validates: Requirements 4.3**

### Property 19: Timeout Scoring

*For any* question where no answer is submitted within 30 seconds, the player SHALL receive 0 points for that round.

**Validates: Requirements 4.4**

### Property 20: Reconnection State Restoration

*For any* player who disconnects and reconnects within 30 seconds, their game state (current question, score, lobby) SHALL be restored.

**Validates: Requirements 8.3**

## Error Handling

### Exception Hierarchy

```
AppException (base)
├── AuthenticationError (401)
│   ├── Invalid token
│   ├── Expired token
│   └── Missing token
├── AuthorizationError (403)
│   └── Not authorized for action
├── NotFoundError (404)
│   ├── Lobby not found
│   ├── Game not found
│   └── User not found
├── ValidationError (422)
│   ├── Invalid lobby code format
│   ├── Cannot join own lobby
│   └── Schema validation failures
├── LobbyFullError (409)
│   └── Lobby already has 2 players
└── GameStateError (409)
    ├── Game already started
    ├── Game not in progress
    └── Not your turn
```

### Error Response Format

All errors return a consistent JSON structure:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "error_code": "MACHINE_READABLE_CODE",
  "details": null
}
```

### WebSocket Error Handling

WebSocket errors are sent as messages rather than closing the connection:

```json
{
  "type": "error",
  "payload": {
    "code": "INVALID_ACTION",
    "message": "Cannot start game without opponent"
  }
}
```

## Testing Strategy

### Testing Framework

- **Unit Tests**: pytest with pytest-asyncio for async code
- **Property-Based Tests**: Hypothesis library for Python
- **Integration Tests**: pytest with TestClient for FastAPI
- **WebSocket Tests**: pytest with websockets library

### Property-Based Testing Configuration

Each property-based test MUST:
1. Run a minimum of 100 iterations
2. Be tagged with a comment referencing the correctness property: `# Feature: trivia-battle-mvp, Property {number}: {property_text}`
3. Use Hypothesis strategies for generating test data

### Test Categories

#### Unit Tests
- Lobby code generation (format, uniqueness)
- Scoring calculation
- Timer calculations
- Schema validation
- JWT token creation/validation

#### Property-Based Tests
- Lobby code uniqueness across many generations
- Scoring formula correctness across all valid inputs
- API response envelope consistency
- WebSocket message format consistency
- Game state transitions

#### Integration Tests
- Full lobby creation → join → start flow
- WebSocket connection and message exchange
- Authentication flow with Supabase
- Game completion and persistence

### Test File Structure

```
tests/
├── conftest.py              # Shared fixtures
├── unit/
│   ├── test_lobby_code.py   # Lobby code generation
│   ├── test_scoring.py      # Score calculations
│   └── test_schemas.py      # Pydantic schema validation
├── property/
│   ├── test_lobby_props.py  # Lobby-related properties
│   ├── test_game_props.py   # Game-related properties
│   └── test_api_props.py    # API format properties
└── integration/
    ├── test_auth_flow.py    # Authentication integration
    ├── test_lobby_flow.py   # Lobby lifecycle
    └── test_game_flow.py    # Full game flow
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register | Register new user |
| POST | /api/v1/auth/login | Login and get JWT |
| POST | /api/v1/auth/logout | Invalidate session |
| GET | /api/v1/auth/me | Get current user |

### Lobbies

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/lobbies | Create new lobby |
| GET | /api/v1/lobbies/{code} | Get lobby by code |
| POST | /api/v1/lobbies/{code}/join | Join existing lobby |
| DELETE | /api/v1/lobbies/{code} | Leave/close lobby |

### Games

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/games/history | Get user's game history |
| GET | /api/v1/games/{id} | Get specific game details |

### WebSocket

| Endpoint | Description |
|----------|-------------|
| /ws/{lobby_code} | Game WebSocket connection |

## WebSocket Protocol

### Connection Flow

```
1. Client connects to /ws/{lobby_code}?token={jwt}
2. Server validates token and lobby
3. Server sends current lobby state
4. Server broadcasts player_joined to all
```

### Message Types

#### Server → Client

```typescript
// Player joined lobby
{ "type": "player_joined", "payload": { "players": [...], "can_start": boolean } }

// Game starting
{ "type": "game_start", "payload": { "total_questions": 15 } }

// New question
{ "type": "question", "payload": { "q_num": 1, "text": "...", "options": [...], "start_time": 1701234567890 } }

// Round results
{ "type": "round_result", "payload": { "q_num": 1, "correct_answer": "B", "scores": {...}, "answers": {...} } }

// Game ended
{ "type": "game_end", "payload": { "winner_id": "...", "final_scores": {...}, "is_tie": false } }

// Error
{ "type": "error", "payload": { "code": "...", "message": "..." } }
```

#### Client → Server

```typescript
// Player ready
{ "type": "ready" }

// Start game (host only)
{ "type": "start_game" }

// Submit answer
{ "type": "answer", "payload": { "q_num": 1, "answer": "B", "time_ms": 4500 } }
```

## Environment Configuration

```env
# .env.example

# App
APP_NAME="1v1 Bro"
DEBUG=false
API_V1_PREFIX=/api/v1

# Supabase
SUPABASE_URL=https://ikbshpdvvkydbpirbahl.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrYnNocGR2dmt5ZGJwaXJiYWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTM3OTIsImV4cCI6MjA4MDI4OTc5Mn0.5JmbUYYKsxuQN3XLJxXll-W-gQH_ZsyNrtqzqDrYFk4
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrYnNocGR2dmt5ZGJwaXJiYWhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzc5MiwiZXhwIjoyMDgwMjg5NzkyfQ.mfEmm6fURTaP4iVZA1gfxkY5f9R0LdcORv7GCox05-k

# JWT (generate your own secret for production)
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Game Settings
QUESTIONS_PER_GAME=15
QUESTION_TIME_SECONDS=30
RECONNECT_TIMEOUT_SECONDS=30
LOBBY_ABANDON_TIMEOUT_SECONDS=60
```

## Nginx Configuration

```nginx
# /etc/nginx/sites-available/trivia.conf

upstream fastapi {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Frontend static files
    location / {
        root /var/www/trivia/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://fastapi;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket proxy
    location /ws/ {
        proxy_pass http://fastapi;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
```
