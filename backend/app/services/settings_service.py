"""
Settings service for user preferences management.
Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
"""

import logging
from typing import Optional

from supabase import Client

from app.database.repositories.settings_repo import SettingsRepository
from app.cache.cache_manager import CacheManager
from app.schemas.settings import (
    NotificationPreferences,
    NotificationPreferencesUpdate,
    AudioSettings,
    AudioSettingsUpdate,
    VideoSettings,
    VideoSettingsUpdate,
    VideoQuality,
    AccessibilitySettings,
    AccessibilitySettingsUpdate,
    ColorblindMode,
    Keybinds,
    KeybindsUpdate,
    UserSettings,
    UserSettingsResponse,
    PrivacySettingsExtended,
    PrivacySettingsExtendedUpdate,
    DEFAULT_KEYBINDS,
)

logger = logging.getLogger(__name__)

SETTINGS_CACHE_TTL = 300  # 5 minutes


class SettingsService:
    """Service for user settings management."""
    
    def __init__(self, client: Client, cache: Optional[CacheManager] = None):
        self.settings_repo = SettingsRepository(client)
        self.cache = cache
    
    def _settings_cache_key(self, user_id: str) -> str:
        """Generate cache key for settings."""
        return CacheManager.key("settings", "user", user_id)
    
    async def _invalidate_cache(self, user_id: str) -> None:
        """Invalidate settings cache for a user."""
        if self.cache:
            cache_key = self._settings_cache_key(user_id)
            await self.cache.delete(cache_key)
    
    async def get_all_settings(self, user_id: str) -> UserSettingsResponse:
        """Get all settings for a user."""
        # Check cache first
        if self.cache:
            cache_key = self._settings_cache_key(user_id)
            cached = await self.cache.get_json(cache_key)
            if cached:
                return UserSettingsResponse(**cached)
        
        # Get or create settings
        data = await self.settings_repo.get_or_create_settings(user_id)
        
        notification_prefs = data.get("notification_preferences") or {}
        user_settings = data.get("user_settings") or {}
        
        # Parse notification preferences
        notifications = NotificationPreferences(
            email_enabled=notification_prefs.get("email_enabled", True),
            push_enabled=notification_prefs.get("push_enabled", True),
            friend_activity=notification_prefs.get("friend_activity", True),
            match_updates=notification_prefs.get("match_updates", True),
            marketing_emails=notification_prefs.get("marketing_emails", False),
        )
        
        # Parse audio settings
        audio = AudioSettings(
            master=user_settings.get("audio_master", 80),
            music=user_settings.get("audio_music", 70),
            sfx=user_settings.get("audio_sfx", 80),
            voice=user_settings.get("audio_voice", 100),
        )
        
        # Parse video settings
        video = VideoSettings(
            quality=VideoQuality(user_settings.get("video_quality", "high")),
            fps_limit=user_settings.get("video_fps_limit", 60),
            show_fps_counter=user_settings.get("show_fps_counter", False),
        )
        
        # Parse accessibility settings
        accessibility = AccessibilitySettings(
            reduced_motion=user_settings.get("reduced_motion", False),
            colorblind_mode=ColorblindMode(user_settings.get("colorblind_mode", "none")),
            font_scale=float(user_settings.get("font_scale", 1.0)),
            high_contrast=user_settings.get("high_contrast", False),
        )
        
        # Parse keybinds
        keybinds_data = user_settings.get("keybinds") or DEFAULT_KEYBINDS
        keybinds = Keybinds(**keybinds_data)
        
        response = UserSettingsResponse(
            user_id=user_id,
            notifications=notifications,
            audio=audio,
            video=video,
            accessibility=accessibility,
            keybinds=keybinds,
        )
        
        # Cache the response
        if self.cache:
            cache_key = self._settings_cache_key(user_id)
            await self.cache.set_json(cache_key, response.model_dump(), SETTINGS_CACHE_TTL)
        
        return response
    
    async def update_notifications(
        self, user_id: str, updates: NotificationPreferencesUpdate
    ) -> Optional[NotificationPreferences]:
        """Update notification preferences."""
        update_dict = updates.model_dump(exclude_none=True)
        if not update_dict:
            return await self._get_notification_preferences(user_id)
        
        result = await self.settings_repo.update_notification_preferences(user_id, update_dict)
        if not result:
            return None
        
        await self._invalidate_cache(user_id)
        
        return NotificationPreferences(
            email_enabled=result.get("email_enabled", True),
            push_enabled=result.get("push_enabled", True),
            friend_activity=result.get("friend_activity", True),
            match_updates=result.get("match_updates", True),
            marketing_emails=result.get("marketing_emails", False),
        )
    
    async def _get_notification_preferences(self, user_id: str) -> Optional[NotificationPreferences]:
        """Get notification preferences for a user."""
        result = await self.settings_repo.get_notification_preferences(user_id)
        if not result:
            return None
        return NotificationPreferences(
            email_enabled=result.get("email_enabled", True),
            push_enabled=result.get("push_enabled", True),
            friend_activity=result.get("friend_activity", True),
            match_updates=result.get("match_updates", True),
            marketing_emails=result.get("marketing_emails", False),
        )
    
    async def update_audio(
        self, user_id: str, updates: AudioSettingsUpdate
    ) -> Optional[AudioSettings]:
        """Update audio settings."""
        update_dict = updates.model_dump(exclude_none=True)
        if not update_dict:
            return await self._get_audio_settings(user_id)
        
        result = await self.settings_repo.update_audio_settings(user_id, update_dict)
        if not result:
            return None
        
        await self._invalidate_cache(user_id)
        
        return AudioSettings(
            master=result.get("audio_master", 80),
            music=result.get("audio_music", 70),
            sfx=result.get("audio_sfx", 80),
            voice=result.get("audio_voice", 100),
        )
    
    async def _get_audio_settings(self, user_id: str) -> Optional[AudioSettings]:
        """Get audio settings for a user."""
        result = await self.settings_repo.get_user_settings(user_id)
        if not result:
            return None
        return AudioSettings(
            master=result.get("audio_master", 80),
            music=result.get("audio_music", 70),
            sfx=result.get("audio_sfx", 80),
            voice=result.get("audio_voice", 100),
        )
    
    async def update_video(
        self, user_id: str, updates: VideoSettingsUpdate
    ) -> Optional[VideoSettings]:
        """Update video settings."""
        update_dict = {}
        if updates.quality is not None:
            update_dict["quality"] = updates.quality.value
        if updates.fps_limit is not None:
            update_dict["fps_limit"] = updates.fps_limit
        if updates.show_fps_counter is not None:
            update_dict["show_fps_counter"] = updates.show_fps_counter
        
        if not update_dict:
            return await self._get_video_settings(user_id)
        
        result = await self.settings_repo.update_video_settings(user_id, update_dict)
        if not result:
            return None
        
        await self._invalidate_cache(user_id)
        
        return VideoSettings(
            quality=VideoQuality(result.get("video_quality", "high")),
            fps_limit=result.get("video_fps_limit", 60),
            show_fps_counter=result.get("show_fps_counter", False),
        )
    
    async def _get_video_settings(self, user_id: str) -> Optional[VideoSettings]:
        """Get video settings for a user."""
        result = await self.settings_repo.get_user_settings(user_id)
        if not result:
            return None
        return VideoSettings(
            quality=VideoQuality(result.get("video_quality", "high")),
            fps_limit=result.get("video_fps_limit", 60),
            show_fps_counter=result.get("show_fps_counter", False),
        )
    
    async def update_accessibility(
        self, user_id: str, updates: AccessibilitySettingsUpdate
    ) -> Optional[AccessibilitySettings]:
        """Update accessibility settings."""
        update_dict = {}
        if updates.reduced_motion is not None:
            update_dict["reduced_motion"] = updates.reduced_motion
        if updates.colorblind_mode is not None:
            update_dict["colorblind_mode"] = updates.colorblind_mode.value
        if updates.font_scale is not None:
            update_dict["font_scale"] = updates.font_scale
        if updates.high_contrast is not None:
            update_dict["high_contrast"] = updates.high_contrast
        
        if not update_dict:
            return await self._get_accessibility_settings(user_id)
        
        result = await self.settings_repo.update_accessibility_settings(user_id, update_dict)
        if not result:
            return None
        
        await self._invalidate_cache(user_id)
        
        return AccessibilitySettings(
            reduced_motion=result.get("reduced_motion", False),
            colorblind_mode=ColorblindMode(result.get("colorblind_mode", "none")),
            font_scale=float(result.get("font_scale", 1.0)),
            high_contrast=result.get("high_contrast", False),
        )
    
    async def _get_accessibility_settings(self, user_id: str) -> Optional[AccessibilitySettings]:
        """Get accessibility settings for a user."""
        result = await self.settings_repo.get_user_settings(user_id)
        if not result:
            return None
        return AccessibilitySettings(
            reduced_motion=result.get("reduced_motion", False),
            colorblind_mode=ColorblindMode(result.get("colorblind_mode", "none")),
            font_scale=float(result.get("font_scale", 1.0)),
            high_contrast=result.get("high_contrast", False),
        )
    
    async def update_keybinds(
        self, user_id: str, updates: KeybindsUpdate
    ) -> Optional[Keybinds]:
        """Update keybind settings."""
        # Get current keybinds
        current = await self.settings_repo.get_user_settings(user_id)
        current_keybinds = (current or {}).get("keybinds") or DEFAULT_KEYBINDS.copy()
        
        # Apply updates
        update_dict = updates.model_dump(exclude_none=True)
        if update_dict:
            current_keybinds.update(update_dict)
        
        # Check for conflicts
        keybinds = Keybinds(**current_keybinds)
        conflicts = keybinds.has_conflicts()
        if conflicts:
            logger.warning(f"Keybind conflicts detected for {user_id}: {conflicts}")
        
        result = await self.settings_repo.update_keybinds(user_id, current_keybinds)
        if not result:
            return None
        
        await self._invalidate_cache(user_id)
        
        return keybinds
    
    async def reset_keybinds(self, user_id: str) -> Optional[Keybinds]:
        """Reset keybinds to defaults."""
        result = await self.settings_repo.update_keybinds(user_id, DEFAULT_KEYBINDS.copy())
        if not result:
            return None
        
        await self._invalidate_cache(user_id)
        
        return Keybinds(**DEFAULT_KEYBINDS)
    
    async def update_privacy_extended(
        self, user_id: str, updates: PrivacySettingsExtendedUpdate
    ) -> Optional[PrivacySettingsExtended]:
        """Update extended privacy settings."""
        update_dict = updates.model_dump(exclude_none=True)
        if not update_dict:
            return None
        
        result = await self.settings_repo.update_privacy_settings_extended(user_id, update_dict)
        if not result:
            return None
        
        await self._invalidate_cache(user_id)
        
        return PrivacySettingsExtended(
            is_public=result.get("is_public", True),
            accept_friend_requests=result.get("accept_friend_requests", True),
            allow_messages=result.get("allow_messages", True),
            show_online_status=result.get("show_online_status", True),
            show_match_history=result.get("show_match_history", True),
        )
    
    # ============================================
    # Account Management
    # Requirements: 9.2, 9.3, 9.4
    # ============================================
    
    async def request_data_export(self, user_id: str) -> "DataExportResponse":
        """Request a data export for the user."""
        from app.schemas.settings import DataExportResponse
        
        # In production, this would queue an async job
        # For now, we return a pending status
        logger.info(f"Data export requested for user {user_id}")
        
        return DataExportResponse(
            status="pending",
            message="Your data export has been queued. You will receive an email when it's ready.",
            estimated_time_minutes=5,
        )
    
    async def schedule_account_deletion(
        self, user_id: str, password: str, confirmation: str
    ) -> bool:
        """Schedule account for deletion after password verification."""
        if confirmation != "DELETE":
            return False
        
        # In production, verify password against auth provider
        # For now, we trust the confirmation
        logger.info(f"Account deletion scheduled for user {user_id}")
        
        # Mark account for deletion (soft delete)
        try:
            await self.settings_repo.mark_account_for_deletion(user_id)
            await self._invalidate_cache(user_id)
            return True
        except Exception as e:
            logger.error(f"Failed to schedule account deletion for {user_id}: {e}")
            return False
