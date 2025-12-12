"""
Achievement service for tracking and awarding achievements.
Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3
"""

import logging
from typing import Optional, List, Dict, Any
from uuid import uuid4
from dataclasses import dataclass

from supabase import Client

from app.database.repositories.achievement_repo import AchievementRepository
from app.database.supabase_client import get_supabase_service_client
from app.services.base import BaseService


logger = logging.getLogger(__name__)

# Constants
COIN_REWARD_PER_ACHIEVEMENT = 3

# Criteria type to user_profiles column mapping
CRITERIA_MAPPING = {
    "games_played": "games_played",
    "games_won": "games_won",
    "win_streak": "best_streak",  # Use best_streak for win streak achievements
    "total_kills": "total_kills",
    "accuracy": None,  # Calculated from shots_hit/shots_fired
    "friends_count": None,  # Calculated from friendships table
}


@dataclass
class AchievementUnlock:
    """Represents a newly unlocked achievement."""
    achievement_id: str
    achievement_name: str
    achievement_description: str
    achievement_rarity: str
    achievement_icon_url: str
    coins_awarded: int
    earned_at: str
    notification_id: Optional[str] = None


@dataclass
class AchievementProgress:
    """Progress toward an achievement."""
    achievement_id: str
    achievement_name: str
    achievement_description: str
    achievement_rarity: str
    achievement_category: str
    achievement_icon_url: str
    criteria_type: str
    current_value: int
    target_value: int
    percentage: int
    is_unlocked: bool
    coin_reward: int = COIN_REWARD_PER_ACHIEVEMENT


@dataclass
class AchievementStats:
    """Achievement statistics for profile display."""
    total_earned: int
    total_possible: int
    completion_percentage: int
    by_rarity: Dict[str, int]
    recent_achievements: List[Dict[str, Any]]
    total_coins_earned: int


class AchievementService(BaseService):
    """Service for achievement operations."""

    def __init__(self, client: Client):
        super().__init__(client)
        self.service_client = get_supabase_service_client()
        self.achievement_repo = AchievementRepository(self.service_client)

    async def check_and_award_achievements(
        self,
        user_id: str
    ) -> List[AchievementUnlock]:
        """
        Check all achievements against user stats and award any newly qualified.
        
        Requirements: 1.1, 1.2, 1.4, 1.5
        
        Returns:
            List of newly unlocked achievements
        """
        unlocked = []
        
        try:
            # Get user stats
            user_stats = await self._get_user_stats(user_id)
            
            # Get all active achievements
            achievements = await self.achievement_repo.get_active_achievements()
            
            # Get already earned achievement IDs
            earned_ids = await self.achievement_repo.get_user_earned_achievement_ids(user_id)
            
            # Check each achievement
            achievements_to_award = []
            for achievement in achievements:
                if achievement["id"] in earned_ids:
                    continue  # Already earned
                
                if self._check_criteria(achievement, user_stats):
                    achievements_to_award.append(achievement)
            
            # Award all qualifying achievements
            for achievement in achievements_to_award:
                unlock = await self._award_single_achievement(user_id, achievement)
                if unlock:
                    unlocked.append(unlock)
            
        except Exception as e:
            logger.error(f"Achievement check failed for user {user_id}: {e}")
            raise
        
        return unlocked

    async def get_all_achievements(
        self,
        category: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get all achievement definitions.
        
        Requirements: 7.1
        """
        return await self.achievement_repo.get_active_achievements(
            category=category,
            limit=limit,
            offset=offset
        )

    async def get_user_achievements(
        self,
        user_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get all achievements earned by a user.
        
        Requirements: 7.2
        """
        return await self.achievement_repo.get_user_achievements_with_details(
            user_id=user_id,
            limit=limit,
            offset=offset
        )

    async def get_achievement_progress(
        self,
        user_id: str
    ) -> List[AchievementProgress]:
        """
        Get progress toward all achievements.
        
        Requirements: 7.3, 8.1, 8.2
        """
        # Get user stats
        user_stats = await self._get_user_stats(user_id)
        
        # Get all achievements
        achievements = await self.achievement_repo.get_active_achievements()
        
        # Get earned achievement IDs
        earned_ids = await self.achievement_repo.get_user_earned_achievement_ids(user_id)
        
        progress_list = []
        for achievement in achievements:
            is_unlocked = achievement["id"] in earned_ids
            current_value = self._get_stat_value(achievement["criteria_type"], user_stats)
            target_value = achievement["criteria_value"]
            
            # Calculate percentage (capped at 100)
            if target_value > 0:
                percentage = min(100, int((current_value / target_value) * 100))
            else:
                percentage = 100 if is_unlocked else 0
            
            progress_list.append(AchievementProgress(
                achievement_id=achievement["id"],
                achievement_name=achievement["name"],
                achievement_description=achievement["description"],
                achievement_rarity=achievement["rarity"],
                achievement_category=achievement["category"],
                achievement_icon_url=achievement.get("icon_url", ""),
                criteria_type=achievement["criteria_type"],
                current_value=current_value,
                target_value=target_value,
                percentage=percentage,
                is_unlocked=is_unlocked,
                coin_reward=achievement.get("coin_reward", COIN_REWARD_PER_ACHIEVEMENT),
            ))
        
        return progress_list

    async def get_achievement_stats(
        self,
        user_id: str
    ) -> AchievementStats:
        """
        Get achievement statistics for profile display.
        
        Requirements: 10.1, 10.2, 10.3, 10.4
        """
        # Get counts
        total_earned = await self.achievement_repo.get_user_achievement_count(user_id)
        total_possible = await self.achievement_repo.get_total_achievement_count()
        
        # Calculate completion percentage
        if total_possible > 0:
            completion_percentage = int((total_earned / total_possible) * 100)
        else:
            completion_percentage = 0
        
        # Get breakdown by rarity
        by_rarity = await self.achievement_repo.get_user_achievements_by_rarity(user_id)
        
        # Get recent achievements
        recent = await self.achievement_repo.get_recent_user_achievements(user_id, limit=3)
        
        return AchievementStats(
            total_earned=total_earned,
            total_possible=total_possible,
            completion_percentage=completion_percentage,
            by_rarity=by_rarity,
            recent_achievements=recent,
            total_coins_earned=total_earned * COIN_REWARD_PER_ACHIEVEMENT,
        )

    # ============================================
    # Private helpers
    # ============================================

    async def _get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user statistics from user_profiles and related tables."""
        # Get user profile stats
        result = (
            self.service_client.table("user_profiles")
            .select("games_played, games_won, best_streak, total_kills, shots_fired, shots_hit")
            .eq("id", user_id)
            .execute()
        )
        
        if not result.data:
            return {
                "games_played": 0,
                "games_won": 0,
                "best_streak": 0,
                "total_kills": 0,
                "accuracy": 0,
                "friends_count": 0,
            }
        
        profile = result.data[0]
        
        # Calculate accuracy
        shots_fired = profile.get("shots_fired", 0) or 0
        shots_hit = profile.get("shots_hit", 0) or 0
        accuracy = int((shots_hit / shots_fired * 100)) if shots_fired > 0 else 0
        
        # Get friends count
        friends_result = self.service_client.rpc(
            "get_friend_count",
            {"p_user_id": user_id}
        ).execute()
        friends_count = friends_result.data if friends_result.data else 0
        
        return {
            "games_played": profile.get("games_played", 0) or 0,
            "games_won": profile.get("games_won", 0) or 0,
            "best_streak": profile.get("best_streak", 0) or 0,
            "total_kills": profile.get("total_kills", 0) or 0,
            "accuracy": accuracy,
            "friends_count": friends_count,
        }

    def _check_criteria(self, achievement: Dict[str, Any], user_stats: Dict[str, Any]) -> bool:
        """Check if user stats meet achievement criteria."""
        criteria_type = achievement["criteria_type"]
        criteria_value = achievement["criteria_value"]
        
        stat_value = self._get_stat_value(criteria_type, user_stats)
        return stat_value >= criteria_value

    def _get_stat_value(self, criteria_type: str, user_stats: Dict[str, Any]) -> int:
        """Get the stat value for a criteria type."""
        # Map criteria type to stat key
        stat_key_map = {
            "games_played": "games_played",
            "games_won": "games_won",
            "win_streak": "best_streak",
            "total_kills": "total_kills",
            "accuracy": "accuracy",
            "friends_count": "friends_count",
        }
        
        stat_key = stat_key_map.get(criteria_type, criteria_type)
        return user_stats.get(stat_key, 0)

    async def _award_single_achievement(
        self,
        user_id: str,
        achievement: Dict[str, Any]
    ) -> Optional[AchievementUnlock]:
        """Award a single achievement to a user."""
        from datetime import datetime, timezone
        
        try:
            # Award achievement (handles duplicates)
            record = await self.achievement_repo.award_achievement(
                user_id=user_id,
                achievement_id=achievement["id"]
            )
            
            if not record:
                # Already earned (duplicate)
                return None
            
            earned_at = record.get("earned_at", datetime.now(timezone.utc).isoformat())
            
            # Credit coins
            notification_id = None
            try:
                await self._credit_achievement_coins(user_id, achievement)
            except Exception as coin_error:
                logger.error(f"Coin credit failed for achievement {achievement['id']}: {coin_error}")
                # Continue - achievement is still awarded
            
            # Send notification
            try:
                notification_id = await self._send_achievement_notification(user_id, achievement)
            except Exception as notif_error:
                logger.error(f"Notification failed for achievement {achievement['id']}: {notif_error}")
                # Continue - achievement is still awarded
            
            return AchievementUnlock(
                achievement_id=achievement["id"],
                achievement_name=achievement["name"],
                achievement_description=achievement["description"],
                achievement_rarity=achievement["rarity"],
                achievement_icon_url=achievement.get("icon_url", ""),
                coins_awarded=COIN_REWARD_PER_ACHIEVEMENT,
                earned_at=earned_at,
                notification_id=notification_id,
            )
            
        except Exception as e:
            logger.error(f"Failed to award achievement {achievement['id']} to user {user_id}: {e}")
            raise

    async def _credit_achievement_coins(
        self,
        user_id: str,
        achievement: Dict[str, Any]
    ) -> None:
        """Credit coins for achievement unlock."""
        from app.services.balance_service import BalanceService
        
        balance_service = BalanceService(self.service_client)
        transaction_id = f"achievement_{achievement['id']}_{user_id}"
        
        await balance_service.credit_coins(
            user_id=user_id,
            amount=COIN_REWARD_PER_ACHIEVEMENT,
            transaction_id=transaction_id,
            source="achievement",
        )

    async def _send_achievement_notification(
        self,
        user_id: str,
        achievement: Dict[str, Any]
    ) -> Optional[str]:
        """Send notification for achievement unlock."""
        from app.services.notification_service import NotificationService
        from app.schemas.notification import NotificationType
        
        notification_service = NotificationService(self.service_client)
        
        notification = await notification_service.create_notification(
            user_id=user_id,
            notification_type=NotificationType.REWARD,
            title=f"Achievement Unlocked: {achievement['name']}",
            message=f"{achievement['description']} (+{COIN_REWARD_PER_ACHIEVEMENT} coins)",
            action_url="/achievements",
            metadata={
                "achievement_id": achievement["id"],
                "achievement_name": achievement["name"],
                "achievement_description": achievement["description"],
                "achievement_rarity": achievement["rarity"],
                "achievement_icon_url": achievement.get("icon_url"),
                "coin_reward": COIN_REWARD_PER_ACHIEVEMENT,
            },
            send_realtime=True,
        )
        
        return notification.get("id")

    async def check_achievements_for_user(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Check and award achievements for a user.
        
        This is an alias for check_and_award_achievements that returns
        a list of dicts for compatibility with ProgressionService.
        
        Args:
            user_id: User UUID
            
        Returns:
            List of newly awarded achievement dicts
        """
        unlocks = await self.check_and_award_achievements(user_id)
        
        return [
            {
                "id": u.achievement_id,
                "name": u.achievement_name,
                "description": u.achievement_description,
                "rarity": u.achievement_rarity,
                "icon_url": u.achievement_icon_url,
                "coins_awarded": u.coins_awarded,
                "earned_at": u.earned_at,
            }
            for u in unlocks
        ]
