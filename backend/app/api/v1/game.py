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
    Get current user's game history.
    
    Returns a list of past games with results, ordered by most recent.
    """
    games = await game_service.get_user_history(current_user.id, limit=limit)
    
    history = []
    for game in games:
        # Determine if current user was player1 or player2
        is_player1 = game["player1_id"] == current_user.id
        
        my_score = game["player1_score"] if is_player1 else game["player2_score"]
        opponent_score = game["player2_score"] if is_player1 else game["player1_score"]
        opponent_id = game["player2_id"] if is_player1 else game["player1_id"]
        
        won = game.get("winner_id") == current_user.id
        is_tie = game.get("winner_id") is None and my_score == opponent_score
        
        history.append(
            GameHistoryItem(
                id=game["id"],
                opponent_id=opponent_id,
                opponent_name=None,  # Could fetch from user_repo if needed
                my_score=my_score,
                opponent_score=opponent_score,
                won=won,
                is_tie=is_tie,
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
