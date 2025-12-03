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

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    # Game Settings
    QUESTIONS_PER_GAME: int = 15
    QUESTION_TIME_SECONDS: int = 30
    QUESTION_TIME_MS: int = 30000  # Computed from QUESTION_TIME_SECONDS
    RECONNECT_TIMEOUT_SECONDS: int = 30
    LOBBY_ABANDON_TIMEOUT_SECONDS: int = 60

    # Scoring
    MAX_SCORE_PER_QUESTION: int = 1000
    SCORE_TIME_DIVISOR: int = 30

    # CORS (for development)
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

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
