"""
Profile service for user profile management.
Requirements: 2.1-2.10
"""

import math
import logging
from typing import Optional

from supabase import Client

from app.database.repositories.profile_repo import ProfileRepository
from app.services.storage_service import StorageService
from app.cache.cache_manager import CacheManager
from app.schemas.profile import (
    Profile,
    PublicProfile,
    ProfileUpdate,
    PrivacySettings,
    SignedUploadUrl,
    UploadConfirmResponse,
    SocialLinks,
)

logger = logging.getLogger(__name__)


# Cache TTLs
PROFILE_CACHE_TTL = 300  # 5 minutes


class ProfileService:
    """Service for user profile management."""
    
    def __init__(
        self,
        client: Client,
        storage: Optional[StorageService] = None,
        cache: Optional[CacheManager] = None,
    ):
        self.profile_repo = ProfileRepository(client)
        self.storage = storage or StorageService()
        self.cache = cache
    
    def _profile_cache_key(self, user_id: str) -> str:
        """Generate cache key for profile."""
        return CacheManager.key("profile", "user", user_id)
    
    async def get_profile(
        self, user_id: str, viewer_id: Optional[str] = None
    ) -> Optional[Profile]:
        """
        Get profile with privacy filtering for viewers.
        
        Args:
            user_id: Profile owner's user ID
            viewer_id: ID of user viewing the profile (None for anonymous)
            
        Returns:
            Profile or PublicProfile based on privacy settings
        """
        # Check cache first (only for owner viewing own profile)
        if self.cache and viewer_id == user_id:
            cache_key = self._profile_cache_key(user_id)
            cached = await self.cache.get_json(cache_key)
            if cached:
                return Profile(**cached)
        
        # Fetch from database
        profile_data = await self.profile_repo.get_profile(user_id, viewer_id)
        
        if not profile_data:
            return None
        
        # Parse social_links if it's a dict
        if "social_links" in profile_data and isinstance(profile_data["social_links"], dict):
            profile_data["social_links"] = SocialLinks(**profile_data["social_links"])
        elif "social_links" not in profile_data:
            profile_data["social_links"] = SocialLinks()
        
        # Map 'id' to 'user_id' if needed
        if "id" in profile_data and "user_id" not in profile_data:
            profile_data["user_id"] = profile_data.pop("id")
        
        # Cache owner's full profile
        if self.cache and viewer_id == user_id:
            cache_key = self._profile_cache_key(user_id)
            await self.cache.set_json(cache_key, profile_data, PROFILE_CACHE_TTL)
        
        return Profile(**profile_data)

    
    async def update_profile(
        self, user_id: str, updates: ProfileUpdate
    ) -> Optional[Profile]:
        """
        Update profile fields with validation.
        
        Args:
            user_id: User ID
            updates: ProfileUpdate schema with fields to update
            
        Returns:
            Updated Profile or None if not found
        """
        # Convert to dict, excluding None values
        update_dict = updates.model_dump(exclude_none=True)
        
        # Handle social_links separately
        if "social_links" in update_dict and update_dict["social_links"]:
            update_dict["social_links"] = update_dict["social_links"]
        
        # Update in database
        updated_data = await self.profile_repo.update_profile(user_id, update_dict)
        
        if not updated_data:
            return None
        
        # Invalidate cache
        if self.cache:
            cache_key = self._profile_cache_key(user_id)
            await self.cache.delete(cache_key)
        
        # Map 'id' to 'user_id' if needed
        if "id" in updated_data and "user_id" not in updated_data:
            updated_data["user_id"] = updated_data.pop("id")
        
        # Parse social_links
        if "social_links" in updated_data and isinstance(updated_data["social_links"], dict):
            updated_data["social_links"] = SocialLinks(**updated_data["social_links"])
        elif "social_links" not in updated_data:
            updated_data["social_links"] = SocialLinks()
        
        return Profile(**updated_data)
    
    async def get_avatar_upload_url(self, user_id: str, content_type: str) -> SignedUploadUrl:
        """
        Generate signed URL for avatar upload.
        
        Args:
            user_id: User ID
            content_type: MIME type of the file
            
        Returns:
            SignedUploadUrl with upload details
        """
        result = self.storage.generate_signed_upload_url(
            user_id=user_id,
            file_type=self.storage._get_extension_from_content_type(content_type).lstrip('.'),
            content_type=content_type,
            is_avatar=True,
        )
        
        return SignedUploadUrl(**result)
    
    async def confirm_avatar_upload(
        self, user_id: str, storage_path: str
    ) -> UploadConfirmResponse:
        """
        Confirm avatar upload and trigger resize processing.
        
        Args:
            user_id: User ID
            storage_path: Path where file was uploaded
            
        Returns:
            UploadConfirmResponse with CDN URLs
        """
        # Process avatar (resize to multiple sizes)
        variant_urls = await self.storage.process_avatar(storage_path, user_id)
        
        # Use the medium size (256x256) as the main avatar URL
        main_url = variant_urls[1] if len(variant_urls) > 1 else variant_urls[0]
        
        # Update profile with new avatar URL
        await self.profile_repo.update_avatar_url(user_id, main_url)
        
        # Invalidate cache
        if self.cache:
            cache_key = self._profile_cache_key(user_id)
            await self.cache.delete(cache_key)
        
        # Clean up old versions
        await self.storage.delete_old_versions(
            user_id=user_id,
            prefix=self.storage.AVATAR_PREFIX,
            keep_latest=1,
        )
        
        return UploadConfirmResponse(url=main_url, variants=variant_urls)
    
    async def get_banner_upload_url(self, user_id: str, content_type: str) -> SignedUploadUrl:
        """
        Generate signed URL for banner upload.
        
        Args:
            user_id: User ID
            content_type: MIME type of the file
            
        Returns:
            SignedUploadUrl with upload details
        """
        result = self.storage.generate_signed_upload_url(
            user_id=user_id,
            file_type=self.storage._get_extension_from_content_type(content_type).lstrip('.'),
            content_type=content_type,
            is_avatar=False,
        )
        
        return SignedUploadUrl(**result)
    
    async def confirm_banner_upload(
        self, user_id: str, storage_path: str
    ) -> UploadConfirmResponse:
        """
        Confirm banner upload and trigger resize processing.
        
        Args:
            user_id: User ID
            storage_path: Path where file was uploaded
            
        Returns:
            UploadConfirmResponse with CDN URLs
        """
        # Process banner (resize to multiple sizes)
        variant_urls = await self.storage.process_banner(storage_path, user_id)
        
        # Use the larger size (1920x540) as the main banner URL
        main_url = variant_urls[-1] if variant_urls else self.storage.get_cdn_url(storage_path)
        
        # Update profile with new banner URL
        await self.profile_repo.update_banner_url(user_id, main_url)
        
        # Invalidate cache
        if self.cache:
            cache_key = self._profile_cache_key(user_id)
            await self.cache.delete(cache_key)
        
        # Clean up old versions
        await self.storage.delete_old_versions(
            user_id=user_id,
            prefix=self.storage.BANNER_PREFIX,
            keep_latest=1,
        )
        
        return UploadConfirmResponse(url=main_url, variants=variant_urls)
    
    async def update_privacy_settings(
        self, user_id: str, settings: PrivacySettings
    ) -> Optional[Profile]:
        """
        Update profile privacy settings.
        
        Args:
            user_id: User ID
            settings: PrivacySettings with new values
            
        Returns:
            Updated Profile or None if not found
        """
        updated_data = await self.profile_repo.update_privacy_settings(
            user_id=user_id,
            is_public=settings.is_public,
            accept_friend_requests=settings.accept_friend_requests,
            allow_messages=settings.allow_messages,
        )
        
        if not updated_data:
            return None
        
        # Invalidate cache
        if self.cache:
            cache_key = self._profile_cache_key(user_id)
            await self.cache.delete(cache_key)
        
        # Map 'id' to 'user_id' if needed
        if "id" in updated_data and "user_id" not in updated_data:
            updated_data["user_id"] = updated_data.pop("id")
        
        # Parse social_links
        if "social_links" in updated_data and isinstance(updated_data["social_links"], dict):
            updated_data["social_links"] = SocialLinks(**updated_data["social_links"])
        elif "social_links" not in updated_data:
            updated_data["social_links"] = SocialLinks()
        
        return Profile(**updated_data)
    
    @staticmethod
    def compute_level(total_xp: int) -> int:
        """
        Compute level from total XP.
        
        Formula: level = floor(sqrt(total_xp / 100))
        Minimum level is 1.
        
        Args:
            total_xp: Total experience points
            
        Returns:
            Computed level (minimum 1)
        """
        if total_xp <= 0:
            return 1
        level = int(math.floor(math.sqrt(total_xp / 100)))
        return max(1, level)
    
    async def add_xp(self, user_id: str, xp_amount: int) -> Optional[Profile]:
        """
        Add XP to user and update level.
        
        Args:
            user_id: User ID
            xp_amount: Amount of XP to add
            
        Returns:
            Updated Profile or None if not found
        """
        updated_data = await self.profile_repo.increment_xp(user_id, xp_amount)
        
        if not updated_data:
            return None
        
        # Invalidate cache
        if self.cache:
            cache_key = self._profile_cache_key(user_id)
            await self.cache.delete(cache_key)
        
        # Map 'id' to 'user_id' if needed
        if "id" in updated_data and "user_id" not in updated_data:
            updated_data["user_id"] = updated_data.pop("id")
        
        # Parse social_links
        if "social_links" in updated_data and isinstance(updated_data["social_links"], dict):
            updated_data["social_links"] = SocialLinks(**updated_data["social_links"])
        elif "social_links" not in updated_data:
            updated_data["social_links"] = SocialLinks()
        
        return Profile(**updated_data)
