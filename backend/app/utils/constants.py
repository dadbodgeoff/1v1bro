"""
Application-wide constants and enums.
"""

from enum import Enum


class LobbyStatus(str, Enum):
    """Lobby status values."""
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class GameMode(str, Enum):
    """Available game modes/categories."""
    FORTNITE = "fortnite"
    # Future modes can be added here
    # MINECRAFT = "minecraft"
    # CUSTOM = "custom"


class WSEventType(str, Enum):
    """WebSocket event types."""
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
    LOBBY_STATE = "lobby_state"
    
    # Client -> Server
    READY = "ready"
    ANSWER = "answer"
    START_GAME = "start_game"


# Game constants
QUESTIONS_PER_GAME = 15
QUESTION_TIME_SECONDS = 30
QUESTION_TIME_MS = 30000
TRANSITION_DELAY_SECONDS = 3
RECONNECT_TIMEOUT_SECONDS = 30
LOBBY_ABANDON_TIMEOUT_SECONDS = 60

# Scoring constants
MAX_SCORE_PER_QUESTION = 1000
SCORE_TIME_DIVISOR = 30

# Lobby code constants
LOBBY_CODE_LENGTH = 6
LOBBY_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
