"""
Game API endpoints.
"""

from typing import List

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, GameServiceDep
from app.core.responses import APIResponse
from app.schemas.game import GameResult, GameHistoryItem


router = APIRouter(prefix="/games", tags=["Games"])


@router.get(
    "/history",
    response_model=APIResponse[List[GameHistoryItem]],
)
async def get_game_history(
    current_user: CurrentUser,
    game_service: GameServiceDep,
    limit: int = Query(default=20, ge=1, le=100, description="Max results"),
):
    """
    Get current user's game history with opponent details and ELO changes.
    
    Returns a list of past games with results, ordered by most recent.
    Includes opponent name, avatar, and ELO change for each match.
    Returns empty list if user has no games yet.
    """
    try:
        games = await game_service.get_user_history(current_user.id, limit=limit)
    except Exception:
        # If query fails (e.g., tables don't exist yet), return empty list
        games = []
    
    # No games yet - return empty list
    if not games:
        return APIResponse.ok([])
    
    history = []
    for game in games:
        # Determine if current user was player1 or player2
        is_player1 = game.get("player1_id") == current_user.id
        
        my_score = game.get("player1_score", 0) if is_player1 else game.get("player2_score", 0)
        opponent_score = game.get("player2_score", 0) if is_player1 else game.get("player1_score", 0)
        opponent_id = game.get("player2_id") if is_player1 else game.get("player1_id")
        
        won = game.get("winner_id") == current_user.id
        is_tie = game.get("winner_id") is None and my_score == opponent_score
        
        history.append(
            GameHistoryItem(
                id=game.get("id", ""),
                opponent_id=opponent_id,
                opponent_name=game.get("opponent_name"),  # From enhanced query
                opponent_avatar_url=game.get("opponent_avatar_url"),  # From enhanced query
                my_score=my_score,
                opponent_score=opponent_score,
                won=won,
                is_tie=is_tie,
                elo_change=game.get("elo_change", 0),  # From match_results join
                created_at=game.get("completed_at"),
            )
        )
    
    return APIResponse.ok(history)


@router.get(
    "/{game_id}",
    response_model=APIResponse[GameResult],
)
async def get_game(
    game_id: str,
    current_user: CurrentUser,
    game_service: GameServiceDep,
):
    """
    Get detailed game result by ID.
    
    Returns full game details including questions and answers.
    """
    game = await game_service.game_repo.get_by_id(game_id)
    
    if not game:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Game", game_id)
    
    # Verify user was a participant
    if current_user.id not in [game["player1_id"], game["player2_id"]]:
        from app.core.exceptions import AuthorizationError
        raise AuthorizationError("You are not a participant in this game")
    
    return APIResponse.ok(
        GameResult(
            id=game["id"],
            lobby_id=game["lobby_id"],
            winner_id=game.get("winner_id"),
            player1_id=game["player1_id"],
            player1_score=game["player1_score"],
            player2_id=game["player2_id"],
            player2_score=game["player2_score"],
            is_tie=game.get("winner_id") is None and game["player1_score"] == game["player2_score"],
            questions_data=game.get("questions_data"),
            answers_data=game.get("answers_data"),
            created_at=game.get("completed_at"),
        )
    )
