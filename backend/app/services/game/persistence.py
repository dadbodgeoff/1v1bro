"""
Game persistence service.
Handles database operations and stats updates.
"""

from typing import List, Optional

from supabase import Client

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
            )
            
            await self.stats_repo.update_win_streak(player_id, game_won)
            
            if trivia_stats.fastest_in_game:
                await self.stats_repo.update_fastest_answer(
                    player_id, trivia_stats.fastest_in_game
                )
    
    async def get_user_history(self, user_id: str, limit: int = 20) -> List[dict]:
        """Get game history for a user."""
        return await self.game_repo.get_user_history(user_id, limit)
    
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
