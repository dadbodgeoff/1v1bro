"""
Game persistence service.
Handles database operations and stats updates.
"""

import logging
from typing import List, Optional

from supabase import Client

logger = logging.getLogger(__name__)

from app.database.repositories.game_repo import GameRepository
from app.database.repositories.stats_repo import StatsRepository
from app.schemas.game import GameResult
from app.utils.combat_tracker import CombatTracker
from .session import GameSession
from .scoring import ScoringService


class GamePersistenceService:
    """Handles game persistence and stats updates."""
    
    def __init__(self, client: Client):
        from app.database.supabase_client import get_supabase_service_client
        service_client = get_supabase_service_client()
        self.game_repo = GameRepository(service_client)
        self.stats_repo = StatsRepository(service_client)
        self.scoring = ScoringService()
    
    async def save_game(self, session: GameSession) -> GameResult:
        """Save completed game to database."""
        p1_state = session.player_states[session.player1_id]
        p2_state = session.player_states[session.player2_id]
        
        winner_id, is_tie, won_by_time = self._determine_winner(
            session.player1_id, p1_state.score, p1_state.total_time_ms,
            session.player2_id, p2_state.score, p2_state.total_time_ms,
        )
        
        # Prepare data
        questions_data = [q.model_dump() for q in session.questions]
        answers_data = {
            player_id: [a.model_dump() for a in state.answers]
            for player_id, state in session.player_states.items()
        }
        
        # Get combat summaries
        p1_combat = CombatTracker.get_summary(session.lobby_id, session.player1_id)
        p2_combat = CombatTracker.get_summary(session.lobby_id, session.player2_id)
        
        # Save to database
        game_record = await self.game_repo.create_game(
            lobby_id=session.lobby_id,
            player1_id=session.player1_id,
            player1_score=p1_state.score,
            player2_id=session.player2_id,
            player2_score=p2_state.score,
            questions_data=questions_data,
            answers_data=answers_data,
            winner_id=winner_id,
            player1_combat_stats=p1_combat,
            player2_combat_stats=p2_combat,
        )
        
        # Calculate game duration (total time from both players / 1000 for seconds)
        total_time_ms = p1_state.total_time_ms + p2_state.total_time_ms
        duration_seconds = total_time_ms // 1000 if total_time_ms > 0 else 0
        
        return GameResult(
            id=game_record["id"],
            lobby_id=session.lobby_id,
            winner_id=winner_id,
            player1_id=session.player1_id,
            player1_score=p1_state.score,
            player1_total_time_ms=p1_state.total_time_ms,
            player2_id=session.player2_id,
            player2_score=p2_state.score,
            player2_total_time_ms=p2_state.total_time_ms,
            is_tie=is_tie,
            won_by_time=won_by_time,
            duration_seconds=duration_seconds,
        )
    
    async def update_player_stats(self, session: GameSession, winner_id: Optional[str]) -> None:
        """Update stats for all players."""
        for player_id, state in session.player_states.items():
            game_won = (player_id == winner_id)
            trivia_stats = self.scoring.aggregate_trivia_stats(state.answers)
            combat_summary = CombatTracker.get_summary(session.lobby_id, player_id)
            
            await self.stats_repo.increment_stats(
                user_id=player_id,
                games_played_delta=1,
                games_won_delta=1 if game_won else 0,
                score_delta=state.score,
                questions_delta=trivia_stats.questions_answered,
                correct_delta=trivia_stats.correct_answers,
                answer_time_delta=trivia_stats.answer_time_ms,
                kills_delta=combat_summary.get("kills", 0),
                deaths_delta=combat_summary.get("deaths", 0),
                damage_dealt_delta=combat_summary.get("damage_dealt", 0),
                damage_taken_delta=combat_summary.get("damage_taken", 0),
                shots_fired_delta=combat_summary.get("shots_fired", 0),
                shots_hit_delta=combat_summary.get("shots_hit", 0),
                powerups_delta=combat_summary.get("powerups_collected", 0),
                elo_delta=0,  # ELO not implemented yet
                new_tier=None,  # Tier not implemented yet
            )
            
            try:
                await self.stats_repo.update_win_streak(player_id, game_won)
            except Exception as e:
                logger.error(f"Failed to update win streak for {player_id}: {e}")
            
            if trivia_stats.fastest_in_game:
                try:
                    await self.stats_repo.update_fastest_answer(
                        player_id, trivia_stats.fastest_in_game
                    )
                except Exception as e:
                    logger.error(f"Failed to update fastest answer for {player_id}: {e}")
    
    async def save_recap_data(
        self,
        game_id: str,
        player1_id: str,
        player1_recap: dict,
        player2_id: str,
        player2_recap: dict,
    ) -> None:
        """
        Save recap data for both players to the games table.
        
        Requirements: 7.3 - Persist recap data to games table recap_data JSONB column.
        
        Args:
            game_id: The game record ID
            player1_id: Player 1's user ID
            player1_recap: Player 1's RecapPayload as dict
            player2_id: Player 2's user ID
            player2_recap: Player 2's RecapPayload as dict
        """
        recap_data = {
            player1_id: player1_recap,
            player2_id: player2_recap,
        }
        await self.game_repo.update_recap_data(game_id, recap_data)
    
    async def get_user_history(self, user_id: str, limit: int = 20) -> List[dict]:
        """Get game history for a user with opponent details and ELO changes."""
        return await self.game_repo.get_user_history_enhanced(user_id, limit)
    
    def _determine_winner(
        self,
        p1_id: str, p1_score: int, p1_time: int,
        p2_id: str, p2_score: int, p2_time: int,
    ) -> tuple:
        """Determine winner with tiebreaker logic."""
        if p1_score > p2_score:
            return p1_id, False, False
        elif p2_score > p1_score:
            return p2_id, False, False
        elif p1_time < p2_time:
            return p1_id, False, True
        elif p2_time < p1_time:
            return p2_id, False, True
        else:
            return None, True, False
