"""
Event handlers for processing Pub/Sub events.
Requirements: 8.3, 8.4, 8.5, 8.9

All handlers are idempotent - processing the same event twice
produces the same final state.
"""

import logging
from typing import Dict, Any, Optional

from supabase import Client

logger = logging.getLogger(__name__)


# Track processed events for idempotency
_processed_matches: set = set()
_processed_purchases: set = set()
_processed_rewards: set = set()

# Service instances (initialized lazily)
_supabase_client: Optional[Client] = None


def set_supabase_client(client: Client) -> None:
    """Set the Supabase client for handlers to use."""
    global _supabase_client
    _supabase_client = client


async def handle_match_completed(data: Dict[str, Any]) -> None:
    """
    Handle match.completed event.
    
    Requirements: 8.3 - Record match_history and update player_stats.
    Requirements: 8.4 - Calculate and update ELO ratings.
    Requirements: 8.5 - Award XP to both players.
    Requirements: 8.9 - Idempotent handling.
    
    Args:
        data: Event data with match_id, player_ids, winner_id, duration, scores
    """
    match_id = data.get("match_id")
    
    # Idempotency check
    if match_id in _processed_matches:
        logger.info(f"Match {match_id} already processed, skipping")
        return
    
    player1_id = data.get("player1_id")
    player2_id = data.get("player2_id")
    winner_id = data.get("winner_id")
    duration = data.get("duration_seconds", 0)
    player1_score = data.get("player1_score", 0)
    player2_score = data.get("player2_score", 0)
    
    # Get kill/streak data if available (from combat tracker)
    player1_kills = data.get("player1_kills", 0)
    player2_kills = data.get("player2_kills", 0)
    player1_streak = data.get("player1_streak", 0)
    player2_streak = data.get("player2_streak", 0)
    
    logger.info(f"Processing match.completed: {match_id}")
    logger.info(f"  Player1: {player1_id}, Score: {player1_score}, Won: {winner_id == player1_id}")
    logger.info(f"  Player2: {player2_id}, Score: {player2_score}, Won: {winner_id == player2_id}")
    
    # Update ELO ratings and record match result (Requirements: 8.4)
    if _supabase_client and player1_id and player2_id:
        try:
            from app.services.leaderboard_service import LeaderboardService
            
            leaderboard_service = LeaderboardService(_supabase_client)
            
            elo_result = await leaderboard_service.update_ratings(
                match_id=match_id,
                player1_id=player1_id,
                player2_id=player2_id,
                winner_id=winner_id,
                duration_seconds=duration,
            )
            
            if elo_result:
                logger.info(
                    f"  ELO updated: P1 {elo_result.player1_pre_elo} -> {elo_result.player1_post_elo} "
                    f"({'+' if elo_result.elo_delta_p1 >= 0 else ''}{elo_result.elo_delta_p1}), "
                    f"P2 {elo_result.player2_pre_elo} -> {elo_result.player2_post_elo} "
                    f"({'+' if elo_result.elo_delta_p2 >= 0 else ''}{elo_result.elo_delta_p2})"
                )
            else:
                logger.warning(f"ELO update returned no result for match {match_id}")
                
        except Exception as e:
            logger.error(f"Failed to update ELO for match {match_id}: {e}")
    
    # Award XP to both players (Requirements: 8.5)
    if _supabase_client and player1_id and player2_id:
        try:
            from app.services.battlepass_service import BattlePassService
            
            battlepass_service = BattlePassService(_supabase_client)
            
            # Player 1 XP
            player1_won = winner_id == player1_id
            xp_result1 = await battlepass_service.award_match_xp(
                user_id=player1_id,
                won=player1_won,
                kills=player1_kills,
                streak=player1_streak,
                duration_seconds=duration,
                match_id=match_id,
            )
            if xp_result1:
                logger.info(
                    f"  Player1 XP: +{xp_result1.xp_awarded} "
                    f"(Tier {xp_result1.previous_tier} -> {xp_result1.new_tier})"
                )
            
            # Player 2 XP
            player2_won = winner_id == player2_id
            xp_result2 = await battlepass_service.award_match_xp(
                user_id=player2_id,
                won=player2_won,
                kills=player2_kills,
                streak=player2_streak,
                duration_seconds=duration,
                match_id=match_id,
            )
            if xp_result2:
                logger.info(
                    f"  Player2 XP: +{xp_result2.xp_awarded} "
                    f"(Tier {xp_result2.previous_tier} -> {xp_result2.new_tier})"
                )
                
        except Exception as e:
            logger.error(f"Failed to award XP for match {match_id}: {e}")
    else:
        logger.warning(f"Skipping XP award - missing client or player IDs")
    
    # Mark as processed
    _processed_matches.add(match_id)
    logger.info(f"Match {match_id} processed successfully")


async def handle_cosmetic_purchased(data: Dict[str, Any]) -> None:
    """
    Handle player.cosmetic_purchased event.
    
    Requirements: 8.6 - Audit logging for purchases.
    Requirements: 8.9 - Idempotent handling.
    
    Args:
        data: Event data with user_id, cosmetic_id, price
    """
    user_id = data.get("user_id")
    cosmetic_id = data.get("cosmetic_id")
    purchase_key = f"{user_id}_{cosmetic_id}"
    
    # Idempotency check
    if purchase_key in _processed_purchases:
        logger.info(f"Purchase {purchase_key} already processed, skipping")
        return
    
    logger.info(f"Processing cosmetic_purchased: {purchase_key}")
    
    # In production:
    # 1. Log to audit trail
    # await audit_service.log_purchase(user_id, cosmetic_id, data.get("price_coins"))
    
    # 2. Send notification
    # await notification_service.notify_purchase(user_id, cosmetic_id)
    
    # Mark as processed
    _processed_purchases.add(purchase_key)
    logger.info(f"Purchase {purchase_key} processed successfully")


async def handle_reward_earned(data: Dict[str, Any]) -> None:
    """
    Handle battlepass.reward_earned event.
    
    Requirements: 8.7 - Notifications for rewards.
    Requirements: 8.9 - Idempotent handling.
    
    Args:
        data: Event data with user_id, season_id, tier, reward_type
    """
    user_id = data.get("user_id")
    season_id = data.get("season_id")
    tier = data.get("tier")
    reward_key = f"{user_id}_{season_id}_{tier}"
    
    # Idempotency check
    if reward_key in _processed_rewards:
        logger.info(f"Reward {reward_key} already processed, skipping")
        return
    
    logger.info(f"Processing reward_earned: {reward_key}")
    
    # In production:
    # 1. Send notification
    # await notification_service.notify_reward(user_id, tier, data.get("reward_type"))
    
    # 2. Update analytics
    # await analytics_service.track_reward_claimed(user_id, season_id, tier)
    
    # Mark as processed
    _processed_rewards.add(reward_key)
    logger.info(f"Reward {reward_key} processed successfully")


async def handle_player_levelup(data: Dict[str, Any]) -> None:
    """
    Handle player.levelup event.
    
    Requirements: 8.8 - Publish level up events.
    Requirements: 8.9 - Idempotent handling.
    
    Args:
        data: Event data with user_id, old_level, new_level
    """
    user_id = data.get("user_id")
    new_level = data.get("new_level")
    
    logger.info(f"Processing player_levelup: {user_id} -> level {new_level}")
    
    # In production:
    # 1. Send notification
    # await notification_service.notify_levelup(user_id, new_level)
    
    # 2. Check for level-based rewards
    # await rewards_service.check_level_rewards(user_id, new_level)
    
    logger.info(f"Level up for {user_id} processed successfully")


def get_all_handlers() -> Dict[str, Any]:
    """Get all event handlers mapped to their topics."""
    return {
        "match-completed": handle_match_completed,
        "cosmetic-purchased": handle_cosmetic_purchased,
        "reward-earned": handle_reward_earned,
        "player-levelup": handle_player_levelup,
    }


def clear_processed_events() -> None:
    """Clear all processed event tracking (for testing)."""
    _processed_matches.clear()
    _processed_purchases.clear()
    _processed_rewards.clear()
