"""
WebSocket event types and message builders.
"""

from enum import Enum
from typing import Any, Dict, List, Optional

from app.utils.helpers import get_timestamp_ms


class WSEventType(str, Enum):
    """WebSocket event types."""
    
    # Server -> Client
    PLAYER_JOINED = "player_joined"
    PLAYER_LEFT = "player_left"
    PLAYER_READY = "player_ready"
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


def build_message(event_type: WSEventType, payload: Optional[Dict] = None) -> Dict:
    """Build a WebSocket message."""
    return {
        "type": event_type.value,
        "payload": payload,
    }


def build_player_joined(
    player_id: str,
    display_name: Optional[str],
    players: List[Dict],
    can_start: bool,
) -> Dict:
    """Build player_joined message."""
    return build_message(WSEventType.PLAYER_JOINED, {
        "player_id": player_id,
        "display_name": display_name,
        "players": players,
        "can_start": can_start,
    })


def build_player_left(player_id: str, players: List[Dict]) -> Dict:
    """Build player_left message."""
    return build_message(WSEventType.PLAYER_LEFT, {
        "player_id": player_id,
        "players": players,
    })


def build_game_start(total_questions: int, players: List[Dict]) -> Dict:
    """Build game_start message."""
    return build_message(WSEventType.GAME_START, {
        "total_questions": total_questions,
        "players": players,
    })


def build_question(
    q_num: int,
    text: str,
    options: List[str],
    start_time: Optional[int] = None,
) -> Dict:
    """Build question message."""
    return build_message(WSEventType.QUESTION, {
        "q_num": q_num,
        "text": text,
        "options": options,
        "start_time": start_time or get_timestamp_ms(),
    })


def build_round_result(
    q_num: int,
    correct_answer: str,
    scores: Dict[str, int],
    answers: Dict[str, Optional[str]],
    total_scores: Dict[str, int],
) -> Dict:
    """Build round_result message."""
    return build_message(WSEventType.ROUND_RESULT, {
        "q_num": q_num,
        "correct_answer": correct_answer,
        "scores": scores,
        "answers": answers,
        "total_scores": total_scores,
    })


def build_game_end(
    winner_id: Optional[str],
    final_scores: Dict[str, int],
    is_tie: bool = False,
    total_times: Optional[Dict[str, int]] = None,
    won_by_time: bool = False,
) -> Dict:
    """Build game_end message."""
    return build_message(WSEventType.GAME_END, {
        "winner_id": winner_id,
        "final_scores": final_scores,
        "is_tie": is_tie,
        "total_times": total_times or {},
        "won_by_time": won_by_time,
    })


def build_error(code: str, message: str) -> Dict:
    """Build error message."""
    return build_message(WSEventType.ERROR, {
        "code": code,
        "message": message,
    })


def build_lobby_state(
    lobby_id: str,
    status: str,
    players: List[Dict],
    can_start: bool,
    host_id: str,
) -> Dict:
    """Build lobby_state message."""
    return build_message(WSEventType.LOBBY_STATE, {
        "lobby_id": lobby_id,
        "status": status,
        "players": players,
        "can_start": can_start,
        "host_id": host_id,
    })


def build_player_ready(
    player_id: str,
    players: List[Dict],
    can_start: bool,
) -> Dict:
    """Build player_ready message."""
    return build_message(WSEventType.PLAYER_READY, {
        "player_id": player_id,
        "players": players,
        "can_start": can_start,
    })
