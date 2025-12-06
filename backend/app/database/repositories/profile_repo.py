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
            .single()
            .execute()
        )

        if not result.data:
            return None

        profile = result.data

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
