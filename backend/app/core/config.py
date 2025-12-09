"""
Application configuration using Pydantic Settings.
Loads environment variables with validation and type coercion.
"""

from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    APP_NAME: str = "1v1 Bro"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str

    # JWT - RS256 Configuration (Requirements: 1.2, 12.4)
    JWT_SECRET_KEY: str = ""  # Fallback for HS256
    JWT_ALGORITHM: str = "RS256"
    JWT_EXPIRATION_HOURS: int = 24
    JWT_PRIVATE_KEY_PATH: Optional[str] = None
    JWT_PUBLIC_KEY_PATH: Optional[str] = None

    # Redis Configuration (Requirements: 11.1)
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_PASSWORD: str = ""
    REDIS_DB: int = 0
    REDIS_MAX_CONNECTIONS: int = 20

    # Google Cloud Storage (Requirements: 10.1)
    GCS_BUCKET_NAME: str = "1v1bro-user-media"
    GCS_PROJECT_ID: Optional[str] = None
    GCS_CREDENTIALS_PATH: Optional[str] = None
    CDN_BASE_URL: str = "https://cdn.1v1bro.com"

    # Google Cloud Pub/Sub (Requirements: 8.1)
    PUBSUB_PROJECT_ID: Optional[str] = None
    PUBSUB_CREDENTIALS_PATH: Optional[str] = None
    PUBSUB_TOPIC_PREFIX: str = "1v1bro"

    # Rate Limiting (Requirements: 1.3, 7.2)
    RATE_LIMIT_AUTH: int = 10
    RATE_LIMIT_GAME: int = 1000
    RATE_LIMIT_LEADERBOARD: int = 100
    RATE_LIMIT_UPLOAD: int = 10

    # Battle Pass Settings (Requirements: 4.3, 4.4)
    XP_WIN: int = 100
    XP_LOSS: int = 50
    XP_PER_KILL: int = 5
    XP_PER_STREAK: int = 10
    XP_PER_SECOND: float = 0.1
    XP_MIN: int = 50
    XP_MAX: int = 300
    XP_PER_TIER: int = 400  # ~3-4 games per tier at avg 100-130 XP/game

    # ELO Settings (Requirements: 5.1, 5.4)
    ELO_STARTING: int = 1200
    ELO_MIN: int = 100
    ELO_MAX: int = 3000
    ELO_K_FACTOR_LOW: int = 32
    ELO_K_FACTOR_MID: int = 24
    ELO_K_FACTOR_HIGH: int = 16

    # Game Settings
    QUESTIONS_PER_GAME: int = 15
    QUESTION_TIME_SECONDS: int = 30
    QUESTION_TIME_MS: int = 30000  # Computed from QUESTION_TIME_SECONDS
    RECONNECT_TIMEOUT_SECONDS: int = 30
    LOBBY_ABANDON_TIMEOUT_SECONDS: int = 60
    
    # Question Freshness Settings (Requirements: 3.1)
    QUESTION_LOOKBACK_DAYS: int = 7  # Days to look back for avoiding repeat questions

    # Scoring
    MAX_SCORE_PER_QUESTION: int = 1000
    SCORE_TIME_DIVISOR: int = 30
    POINTS_PER_KILL: int = 50  # Kill bonus points added to game score

    # CORS (for development)
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # Frontend URL for redirects
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Stripe Configuration (Requirements: 7.2)
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""

    # Power-up settings
    POWERUP_SPAWN_INTERVAL_MS: int = 15000  # Spawn new power-up every 15s
    MAX_POWERUPS_PER_PLAYER: int = 3
    TIME_STEAL_SECONDS: int = 5
    
    # Position sync settings
    POSITION_SYNC_INTERVAL_MS: int = 100
    
    # Map settings
    MAP_WIDTH: int = 1920
    MAP_HEIGHT: int = 1080
    
    # Transition delay
    TRANSITION_DELAY_SECONDS: int = 3
    
    # Scaling settings
    MAX_WEBSOCKET_CONNECTIONS: int = 500
    MAX_CONNECTIONS_PER_LOBBY: int = 10
    LOBBY_CACHE_TTL_SECONDS: float = 5.0

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Compute derived values
        object.__setattr__(self, "QUESTION_TIME_MS", self.QUESTION_TIME_SECONDS * 1000)


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached application settings.
    Uses lru_cache to ensure settings are only loaded once.
    """
    return Settings()
