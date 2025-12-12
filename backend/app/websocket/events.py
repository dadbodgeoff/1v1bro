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
    
    # Position sync (bidirectional)
    POSITION_UPDATE = "position_update"
    
    # Combat events (Client -> Server)
    COMBAT_KILL = "combat_kill"
    COMBAT_DAMAGE = "combat_damage"
    COMBAT_SHOT = "combat_shot"
    
    # Power-up events
    POWERUP_SPAWN = "powerup_spawn"
    POWERUP_COLLECTED = "powerup_collected"
    POWERUP_USE = "powerup_use"
    SHIELD_ACTIVATED = "shield_activated"
    DOUBLE_POINTS_ACTIVATED = "double_points_activated"
    
    # Friend events (Server -> Client)
    FRIEND_REQUEST = "friend_request"
    FRIEND_ACCEPTED = "friend_accepted"
    FRIEND_ONLINE = "friend_online"
    FRIEND_OFFLINE = "friend_offline"
    GAME_INVITE = "game_invite"
    
    # Matchmaking events
    QUEUE_JOIN = "queue_join"
    QUEUE_LEAVE = "queue_leave"
    QUEUE_JOINED = "queue_joined"
    QUEUE_STATUS = "queue_status"
    QUEUE_CANCELLED = "queue_cancelled"
    MATCH_FOUND = "match_found"
    
    # Progression events (Server -> Client)
    XP_AWARDED = "xp_awarded"
    TIER_ADVANCED = "tier_advanced"
    REWARD_CLAIMED = "reward_claimed"
    
    # Arena state sync (Server -> Client)
    ARENA_STATE = "arena_state"
    ARENA_EVENT = "arena_event"
    
    # Barrier events (Server -> Client)
    BARRIER_DAMAGED = "barrier_damaged"
    BARRIER_DESTROYED = "barrier_destroyed"
    
    # Buff events (Server -> Client)
    BUFF_APPLIED = "buff_applied"
    BUFF_EXPIRED = "buff_expired"


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


def build_game_start(
    total_questions: int,
    players: List[Dict],
    player1_id: str,
    player2_id: str,
    player_skins: Optional[Dict[str, Dict]] = None,
    category: str = "fortnite",
    map_slug: str = "simple-arena",
) -> Dict:
    """Build game_start message with explicit player assignments, skin data, trivia category, and arena map."""
    return build_message(WSEventType.GAME_START, {
        "total_questions": total_questions,
        "players": players,
        "player1_id": player1_id,
        "player2_id": player2_id,
        "player_skins": player_skins or {},
        "category": category,
        "map_slug": map_slug,
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
    rewards: Optional[Dict[str, Dict]] = None,
    is_final_question: bool = False,
) -> Dict:
    """Build round_result message with optional quiz rewards and final question flag."""
    return build_message(WSEventType.ROUND_RESULT, {
        "q_num": q_num,
        "correct_answer": correct_answer,
        "scores": scores,
        "answers": answers,
        "total_scores": total_scores,
        "rewards": rewards or {},
        "is_final_question": is_final_question,
    })


def build_game_end(
    winner_id: Optional[str],
    final_scores: Dict[str, int],
    is_tie: bool = False,
    total_times: Optional[Dict[str, int]] = None,
    won_by_time: bool = False,
    recaps: Optional[Dict[str, Dict]] = None,
) -> Dict:
    """Build game_end message with optional recap data."""
    return build_message(WSEventType.GAME_END, {
        "winner_id": winner_id,
        "final_scores": final_scores,
        "is_tie": is_tie,
        "total_times": total_times or {},
        "won_by_time": won_by_time,
        "recaps": recaps or {},
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
    category: str = "fortnite",
    map_slug: str = "simple-arena",
) -> Dict:
    """Build lobby_state message with trivia category and arena map."""
    return build_message(WSEventType.LOBBY_STATE, {
        "lobby_id": lobby_id,
        "status": status,
        "players": players,
        "can_start": can_start,
        "host_id": host_id,
        "category": category,
        "map_slug": map_slug,
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


# ============================================
# Progression Events (UNIFIED PROGRESSION)
# ============================================

def build_xp_awarded(
    xp_amount: int,
    new_total_xp: int,
    previous_tier: int,
    new_tier: int,
    tier_advanced: bool,
    calculation: Optional[Dict] = None,
) -> Dict:
    """
    Build xp_awarded message.
    
    UNIFIED PROGRESSION: Sent after match XP is calculated and awarded.
    Requirements: 2.8
    """
    return build_message(WSEventType.XP_AWARDED, {
        "xp_amount": xp_amount,
        "new_total_xp": new_total_xp,
        "previous_tier": previous_tier,
        "new_tier": new_tier,
        "tier_advanced": tier_advanced,
        "calculation": calculation,
    })


def build_tier_advanced(
    previous_tier: int,
    new_tier: int,
    tiers_gained: int,
    new_claimable_rewards: List[int],
) -> Dict:
    """
    Build tier_advanced message.
    
    UNIFIED PROGRESSION: Sent when player advances to a new tier.
    Requirements: 3.6
    """
    return build_message(WSEventType.TIER_ADVANCED, {
        "previous_tier": previous_tier,
        "new_tier": new_tier,
        "tiers_gained": tiers_gained,
        "new_claimable_rewards": new_claimable_rewards,
    })


def build_reward_claimed(
    tier: int,
    reward_type: str,
    reward_value: Any,
    inventory_item_id: Optional[str] = None,
) -> Dict:
    """
    Build reward_claimed message.
    
    UNIFIED PROGRESSION: Sent when player claims a tier reward.
    """
    return build_message(WSEventType.REWARD_CLAIMED, {
        "tier": tier,
        "reward_type": reward_type,
        "reward_value": reward_value,
        "inventory_item_id": inventory_item_id,
    })



# ============================================
# Arena State Events (SERVER AUTHORITY)
# ============================================

def build_arena_state(
    hazards: List[Dict],
    traps: List[Dict],
    doors: List[Dict],
    platforms: List[Dict],
    barriers: List[Dict],
    powerups: List[Dict],
    buffs: Optional[Dict[str, List[Dict]]] = None,
) -> Dict:
    """
    Build arena_state message with full arena state.
    
    SERVER AUTHORITY: Broadcast complete arena state to all clients.
    Requirements: 5.4, 6.4
    """
    return build_message(WSEventType.ARENA_STATE, {
        "hazards": hazards,
        "traps": traps,
        "doors": doors,
        "platforms": platforms,
        "barriers": barriers,
        "powerups": powerups,
        "buffs": buffs or {},
    })


def build_arena_event(
    event_type: str,
    data: Dict,
) -> Dict:
    """
    Build arena_event message for individual arena events.
    
    SERVER AUTHORITY: Broadcast individual arena events.
    Requirements: 5.1, 5.2
    """
    return build_message(WSEventType.ARENA_EVENT, {
        "event_type": event_type,
        "data": data,
    })


def build_barrier_damaged(
    barrier_id: str,
    damage: int,
    health: int,
    max_health: int,
    source_player_id: Optional[str] = None,
) -> Dict:
    """
    Build barrier_damaged message.
    
    SERVER AUTHORITY: Notify clients of barrier damage.
    Requirements: 1.1
    """
    return build_message(WSEventType.BARRIER_DAMAGED, {
        "barrier_id": barrier_id,
        "damage": damage,
        "health": health,
        "max_health": max_health,
        "source_player_id": source_player_id,
    })


def build_barrier_destroyed(
    barrier_id: str,
    source_player_id: Optional[str] = None,
) -> Dict:
    """
    Build barrier_destroyed message.
    
    SERVER AUTHORITY: Notify clients of barrier destruction.
    Requirements: 1.2
    """
    return build_message(WSEventType.BARRIER_DESTROYED, {
        "barrier_id": barrier_id,
        "source_player_id": source_player_id,
    })


def build_buff_applied(
    player_id: str,
    buff_type: str,
    value: float,
    duration: float,
    source: str,
) -> Dict:
    """
    Build buff_applied message.
    
    SERVER AUTHORITY: Notify clients of buff application.
    Requirements: 3.1
    """
    return build_message(WSEventType.BUFF_APPLIED, {
        "player_id": player_id,
        "buff_type": buff_type,
        "value": value,
        "duration": duration,
        "source": source,
    })


def build_buff_expired(
    player_id: str,
    buff_type: str,
) -> Dict:
    """
    Build buff_expired message.
    
    SERVER AUTHORITY: Notify clients of buff expiration.
    Requirements: 3.2
    """
    return build_message(WSEventType.BUFF_EXPIRED, {
        "player_id": player_id,
        "buff_type": buff_type,
    })
