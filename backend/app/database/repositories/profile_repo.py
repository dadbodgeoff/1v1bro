"""
Profile repository - Database operations for user profiles.
Requirements: 2.1, 2.7, 2.10
"""

import math
from typing import Optional
from datetime import datetime

from supabase import Client


class ProfileRepository:
    """Repository for profile database operations."""

    def __init__(self, client: Client):
        self._client = client

    def _profiles(self):
        return self._client.table("user_profiles")

    async def get_profile(
        self, user_id: str, viewer_id: Optional[str] = None
    ) -> Optional[dict]:
        """
        Get profile by user_id with privacy filtering.
        
        If viewer_id is provided and differs from user_id, privacy settings
        are checked to determine what data to return.
        """
        result = (
            self._profiles()
            .select("*")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )

        if not result.data:
            return None

        profile = result.data[0]

        # If viewer is the owner, return full profile
        if viewer_id == user_id:
            return profile

        # Apply privacy filtering for other viewers
        if not profile.get("is_public", True):
            # Return limited public data for private profiles
            return {
                "id": profile["id"],
                "display_name": profile.get("display_name"),
                "avatar_url": profile.get("avatar_url"),
                "banner_url": profile.get("banner_url"),
                "banner_color": profile.get("banner_color", "#1a1a2e"),
                "level": profile.get("level", 1),
                "title": profile.get("title", "Rookie"),
                "country": profile.get("country"),
                "is_public": False,
                "created_at": profile.get("created_at"),
                "updated_at": profile.get("updated_at"),
            }

        return profile


    async def update_profile(self, user_id: str, updates: dict) -> Optional[dict]:
        """
        Update profile fields with validation.
        
        Args:
            user_id: User UUID
            updates: Dictionary of fields to update
            
        Returns:
            Updated profile or None if not found
        """
        # Filter out None values and empty updates
        filtered_updates = {k: v for k, v in updates.items() if v is not None}
        
        if not filtered_updates:
            # No updates, just return current profile
            return await self.get_profile(user_id, user_id)

        # Add updated_at timestamp
        filtered_updates["updated_at"] = datetime.utcnow().isoformat()

        result = (
            self._profiles()
            .update(filtered_updates)
            .eq("id", user_id)
            .execute()
        )

        if not result.data:
            return None

        return result.data[0]

    async def update_avatar_url(self, user_id: str, avatar_url: str) -> Optional[dict]:
        """Update user's avatar URL."""
        result = (
            self._profiles()
            .update({
                "avatar_url": avatar_url,
                "updated_at": datetime.utcnow().isoformat(),
            })
            .eq("id", user_id)
            .execute()
        )

        if not result.data:
            return None

        return result.data[0]

    async def update_banner_url(self, user_id: str, banner_url: str) -> Optional[dict]:
        """Update user's banner URL."""
        result = (
            self._profiles()
            .update({
                "banner_url": banner_url,
                "updated_at": datetime.utcnow().isoformat(),
            })
            .eq("id", user_id)
            .execute()
        )

        if not result.data:
            return None

        return result.data[0]

    async def update_privacy_settings(
        self,
        user_id: str,
        is_public: Optional[bool] = None,
        accept_friend_requests: Optional[bool] = None,
        allow_messages: Optional[bool] = None,
    ) -> Optional[dict]:
        """Update profile privacy settings."""
        updates = {}
        
        if is_public is not None:
            updates["is_public"] = is_public
        if accept_friend_requests is not None:
            updates["accept_friend_requests"] = accept_friend_requests
        if allow_messages is not None:
            updates["allow_messages"] = allow_messages

        if not updates:
            return await self.get_profile(user_id, user_id)

        updates["updated_at"] = datetime.utcnow().isoformat()

        result = (
            self._profiles()
            .update(updates)
            .eq("id", user_id)
            .execute()
        )

        if not result.data:
            return None

        return result.data[0]

    async def increment_xp(self, user_id: str, xp_amount: int) -> Optional[dict]:
        """
        Increment user's XP and recompute level.
        
        Args:
            user_id: User UUID
            xp_amount: Amount of XP to add
            
        Returns:
            Updated profile with new XP and level
        """
        # Get current profile
        current = await self.get_profile(user_id, user_id)
        if not current:
            return None

        current_xp = current.get("total_xp", 0)
        new_total_xp = current_xp + xp_amount
        new_level = self.compute_level(new_total_xp)

        result = (
            self._profiles()
            .update({
                "total_xp": new_total_xp,
                "level": new_level,
                "updated_at": datetime.utcnow().isoformat(),
            })
            .eq("id", user_id)
            .execute()
        )

        if not result.data:
            return None

        return result.data[0]

    @staticmethod
    def compute_level(total_xp: int) -> int:
        """
        Compute level from total XP.
        
        Formula: level = floor(sqrt(total_xp / 100))
        Minimum level is 1.
        """
        if total_xp <= 0:
            return 1
        level = int(math.floor(math.sqrt(total_xp / 100)))
        return max(1, level)

    async def get_profile_by_display_name(
        self, display_name: str
    ) -> Optional[dict]:
        """Get profile by display name (case-insensitive)."""
        result = (
            self._profiles()
            .select("*")
            .ilike("display_name", display_name)
            .limit(1)
            .execute()
        )

        if not result.data:
            return None

        return result.data[0]

    async def profile_exists(self, user_id: str) -> bool:
        """Check if a profile exists."""
        result = (
            self._profiles()
            .select("id")
            .eq("id", user_id)
            .execute()
        )
        return bool(result.data)

    async def get_profiles_by_country(
        self, country: str, limit: int = 100, offset: int = 0
    ) -> list[dict]:
        """Get profiles filtered by country code."""
        result = (
            self._profiles()
            .select("*")
            .eq("country", country.upper())
            .eq("is_public", True)
            .order("level", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return result.data or []

    def _match_results(self):
        return self._client.table("match_results")

    async def get_match_history(
        self, user_id: str, limit: int = 10, offset: int = 0
    ) -> tuple[list[dict], int]:
        """
        Get match history for a user.
        
        Fetches matches where user was player1 or player2, ordered by played_at desc.
        Includes opponent profile info via join.
        
        Args:
            user_id: User UUID
            limit: Number of matches to return
            offset: Offset for pagination
            
        Returns:
            Tuple of (matches list, total count)
        """
        # Get total count first
        count_result = (
            self._match_results()
            .select("id", count="exact")
            .or_(f"player1_id.eq.{user_id},player2_id.eq.{user_id}")
            .execute()
        )
        total = count_result.count or 0
        
        # Get matches with opponent profile info
        # We need to fetch matches and then get opponent profiles separately
        matches_result = (
            self._match_results()
            .select("*")
            .or_(f"player1_id.eq.{user_id},player2_id.eq.{user_id}")
            .order("played_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        
        matches = matches_result.data or []
        
        # Get opponent profiles
        opponent_ids = set()
        for match in matches:
            if match.get("player1_id") == user_id:
                opponent_ids.add(match.get("player2_id"))
            else:
                opponent_ids.add(match.get("player1_id"))
        
        opponent_profiles = {}
        if opponent_ids:
            profiles_result = (
                self._profiles()
                .select("id, display_name, avatar_url")
                .in_("id", list(opponent_ids))
                .execute()
            )
            for profile in (profiles_result.data or []):
                opponent_profiles[profile["id"]] = profile
        
        # Attach opponent profile to each match
        for match in matches:
            opponent_id = match.get("player2_id") if match.get("player1_id") == user_id else match.get("player1_id")
            match["opponent_profile"] = opponent_profiles.get(opponent_id, {})
        
        return matches, total


    def _achievements(self):
        return self._client.table("achievements")

    def _user_achievements(self):
        return self._client.table("user_achievements")

    async def get_user_achievements(self, user_id: str) -> list[dict]:
        """
        Get all achievements earned by a user.
        
        Joins user_achievements with achievements to get full achievement info.
        Ordered by rarity (legendary first) then by earned_at (newest first).
        
        Args:
            user_id: User UUID
            
        Returns:
            List of achievement dicts with earned_at
        """
        # Get user's earned achievement IDs with earned_at
        user_ach_result = (
            self._user_achievements()
            .select("achievement_id, earned_at")
            .eq("user_id", user_id)
            .order("earned_at", desc=True)
            .execute()
        )
        
        user_achievements = user_ach_result.data or []
        
        if not user_achievements:
            return []
        
        # Get achievement details
        achievement_ids = [ua["achievement_id"] for ua in user_achievements]
        
        ach_result = (
            self._achievements()
            .select("id, name, description, icon_url, rarity")
            .in_("id", achievement_ids)
            .execute()
        )
        
        achievements_map = {a["id"]: a for a in (ach_result.data or [])}
        
        # Combine and sort by rarity then date
        rarity_order = {"legendary": 0, "epic": 1, "rare": 2, "uncommon": 3, "common": 4}
        
        result = []
        for ua in user_achievements:
            ach = achievements_map.get(ua["achievement_id"])
            if ach:
                result.append({
                    **ach,
                    "earned_at": ua["earned_at"],
                })
        
        # Sort by rarity (legendary first) then by earned_at (newest first)
        result.sort(key=lambda x: (
            rarity_order.get(x.get("rarity", "common"), 4),
            x.get("earned_at", ""),
        ))
        
        return result
