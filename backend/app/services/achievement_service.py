"""
Achievement awarding service.
Requirements: Profile Enterprise - Achievement Auto-Awarding

Automatically checks and awards achievements based on user stats.
"""

import logging
from typing import Optional, List
from datetime import datetime

from supabase import Client

logger = logging.getLogger(__name__)


# Achievement criteria types
CRITERIA_GAMES_PLAYED = "games_played"
CRITERIA_GAMES_WON = "games_won"
CRITERIA_WIN_STREAK = "win_streak"
CRITERIA_LEVEL = "level"


class AchievementService:
    """Service for checking and awarding achievements."""
    
    def __init__(self, client: Client):
        self._client = client
    
    def _achievements(self):
        return self._client.table("achievements")
    
    def _user_achievements(self):
        return self._client.table("user_achievements")
    
    def _profiles(self):
        return self._client.table("user_profiles")
    
    async def get_all_achievements(self) -> List[dict]:
        """Get all active achievements."""
        result = (
            self._achievements()
            .select("*")
            .eq("is_active", True)
            .order("sort_order")
            .execute()
        )
        return result.data or []
    
    async def get_user_earned_achievement_ids(self, user_id: str) -> set:
        """Get set of achievement IDs already earned by user."""
        result = (
            self._user_achievements()
            .select("achievement_id")
            .eq("user_id", user_id)
            .execute()
        )
        return {ua["achievement_id"] for ua in (result.data or [])}
    
    async def award_achievement(self, user_id: str, achievement_id: str) -> bool:
        """
        Award an achievement to a user.
        
        Args:
            user_id: User UUID
            achievement_id: Achievement UUID
            
        Returns:
            True if awarded, False if already earned or error
        """
        try:
            result = (
                self._user_achievements()
                .insert({
                    "user_id": user_id,
                    "achievement_id": achievement_id,
                    "earned_at": datetime.utcnow().isoformat(),
                })
                .execute()
            )
            return bool(result.data)
        except Exception as e:
            # Likely duplicate - user already has this achievement
            logger.debug(f"Could not award achievement {achievement_id} to {user_id}: {e}")
            return False
    
    async def check_and_award_achievements(
        self,
        user_id: str,
        games_played: Optional[int] = None,
        games_won: Optional[int] = None,
        best_win_streak: Optional[int] = None,
        level: Optional[int] = None,
    ) -> List[dict]:
        """
        Check user stats against all achievements and award any newly earned.
        
        Args:
            user_id: User UUID
            games_played: Current games played count
            games_won: Current games won count
            best_win_streak: Current best win streak
            level: Current player level
            
        Returns:
            List of newly awarded achievements
        """
        # Get all achievements and user's earned ones
        all_achievements = await self.get_all_achievements()
        earned_ids = await self.get_user_earned_achievement_ids(user_id)
        
        newly_awarded = []
        
        for achievement in all_achievements:
            # Skip if already earned
            if achievement["id"] in earned_ids:
                continue
            
            criteria_type = achievement.get("criteria_type")
            criteria_value = achievement.get("criteria_value", 0)
            
            # Check if criteria is met
            should_award = False
            
            if criteria_type == CRITERIA_GAMES_PLAYED and games_played is not None:
                should_award = games_played >= criteria_value
            elif criteria_type == CRITERIA_GAMES_WON and games_won is not None:
                should_award = games_won >= criteria_value
            elif criteria_type == CRITERIA_WIN_STREAK and best_win_streak is not None:
                should_award = best_win_streak >= criteria_value
            elif criteria_type == CRITERIA_LEVEL and level is not None:
                should_award = level >= criteria_value
            
            if should_award:
                awarded = await self.award_achievement(user_id, achievement["id"])
                if awarded:
                    newly_awarded.append(achievement)
                    logger.info(
                        f"Awarded achievement '{achievement['name']}' to user {user_id}"
                    )
        
        return newly_awarded
    
    async def check_achievements_for_user(self, user_id: str) -> List[dict]:
        """
        Check all achievements for a user based on their current profile stats.
        
        Fetches user profile and checks all criteria.
        
        Args:
            user_id: User UUID
            
        Returns:
            List of newly awarded achievements
        """
        # Get user profile stats
        result = (
            self._profiles()
            .select("games_played, games_won, best_win_streak, level")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
        
        if not result.data:
            return []
        
        profile = result.data[0]
        
        return await self.check_and_award_achievements(
            user_id=user_id,
            games_played=profile.get("games_played", 0),
            games_won=profile.get("games_won", 0),
            best_win_streak=profile.get("best_win_streak", 0),
            level=profile.get("level", 1),
        )
