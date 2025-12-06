# Repository pattern implementations
from app.database.repositories.base import BaseRepository
from app.database.repositories.user_repo import UserRepository
from app.database.repositories.lobby_repo import LobbyRepository
from app.database.repositories.game_repo import GameRepository
from app.database.repositories.stats_repo import StatsRepository
from app.database.repositories.leaderboard_repo import LeaderboardRepository

__all__ = [
    "BaseRepository",
    "UserRepository",
    "LobbyRepository",
    "GameRepository",
    "StatsRepository",
    "LeaderboardRepository",
]
