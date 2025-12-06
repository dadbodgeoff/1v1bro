# Pydantic schemas
from app.schemas.base import BaseSchema, TimestampMixin
from app.schemas.auth import LoginRequest, RegisterRequest, AuthResponse, UserResponse
from app.schemas.lobby import LobbyCreate, LobbyJoin, LobbyResponse, LobbyCodeResponse
from app.schemas.game import Question, QuestionPublic, PlayerScore, GameState, GameResult
from app.schemas.player import PlayerInfo, PlayerState
from app.schemas.ws_messages import (
    WSEventType,
    WSMessage,
    QuestionPayload,
    AnswerPayload,
    RoundResultPayload,
    GameEndPayload,
)
from app.schemas.stats import (
    TriviaStats,
    CombatStats,
    StreakStats,
    PlayerStats,
    GameCombatSummary,
    TriviaStatsDelta,
    StatsUpdateRequest,
)
from app.schemas.leaderboard import (
    LeaderboardCategory,
    LeaderboardEntry,
    LeaderboardResponse,
    UserRankResponse,
    LeaderboardQueryParams,
)
from app.schemas.profile import (
    SocialLinks,
    PrivacySettings,
    ProfileUpdate,
    Profile,
    PublicProfile,
    SignedUploadUrl,
    UploadConfirmRequest,
    UploadConfirmResponse,
    PrivacySettingsUpdate,
)

__all__ = [
    "BaseSchema",
    "TimestampMixin",
    "LoginRequest",
    "RegisterRequest",
    "AuthResponse",
    "UserResponse",
    "LobbyCreate",
    "LobbyJoin",
    "LobbyResponse",
    "LobbyCodeResponse",
    "Question",
    "QuestionPublic",
    "PlayerScore",
    "GameState",
    "GameResult",
    "PlayerInfo",
    "PlayerState",
    "WSEventType",
    "WSMessage",
    "QuestionPayload",
    "AnswerPayload",
    "RoundResultPayload",
    "GameEndPayload",
    # Stats schemas
    "TriviaStats",
    "CombatStats",
    "StreakStats",
    "PlayerStats",
    "GameCombatSummary",
    "TriviaStatsDelta",
    "StatsUpdateRequest",
    # Leaderboard schemas
    "LeaderboardCategory",
    "LeaderboardEntry",
    "LeaderboardResponse",
    "UserRankResponse",
    "LeaderboardQueryParams",
    # Profile schemas
    "SocialLinks",
    "PrivacySettings",
    "ProfileUpdate",
    "Profile",
    "PublicProfile",
    "SignedUploadUrl",
    "UploadConfirmRequest",
    "UploadConfirmResponse",
    "PrivacySettingsUpdate",
]
