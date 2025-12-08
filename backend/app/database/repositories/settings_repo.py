"""
Settings repository for database operations.
Requirements: 2.1, 2.2, 11.1
"""

import logging
from typing import Optional, Dict, Any

from supabase import Client

logger = logging.getLogger(__name__)


class SettingsRepository:
    """Repository for user settings database operations."""
    
    def __init__(self, client: Client):
        self.client = client
    
    # ============================================
    # Notification Preferences
    # ============================================
    
    async def get_notification_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get notification preferences for a user."""
        try:
            response = self.client.table("notification_preferences").select("*").eq("user_id", user_id).single().execute()
            return response.data
        except Exception as e:
            logger.warning(f"Failed to get notification preferences for {user_id}: {e}")
            return None
    
    async def update_notification_preferences(
        self, user_id: str, settings: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update notification preferences for a user."""
        try:
            response = self.client.table("notification_preferences").update(settings).eq("user_id", user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Failed to update notification preferences for {user_id}: {e}")
            return None
    
    async def create_notification_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Create default notification preferences for a user."""
        try:
            response = self.client.table("notification_preferences").insert({"user_id": user_id}).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Failed to create notification preferences for {user_id}: {e}")
            return None
    
    # ============================================
    # User Settings (Audio, Video, Accessibility, Keybinds)
    # ============================================
    
    async def get_user_settings(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get all user settings."""
        try:
            response = self.client.table("user_settings").select("*").eq("user_id", user_id).single().execute()
            return response.data
        except Exception as e:
            logger.warning(f"Failed to get user settings for {user_id}: {e}")
            return None
    
    async def update_audio_settings(
        self, user_id: str, settings: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update audio settings for a user."""
        try:
            update_data = {
                "audio_master": settings.get("master"),
                "audio_music": settings.get("music"),
                "audio_sfx": settings.get("sfx"),
                "audio_voice": settings.get("voice"),
            }
            update_data = {k: v for k, v in update_data.items() if v is not None}
            
            response = self.client.table("user_settings").update(update_data).eq("user_id", user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Failed to update audio settings for {user_id}: {e}")
            return None
    
    async def update_video_settings(
        self, user_id: str, settings: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update video settings for a user."""
        try:
            update_data = {}
            if "quality" in settings:
                update_data["video_quality"] = settings["quality"]
            if "fps_limit" in settings:
                update_data["video_fps_limit"] = settings["fps_limit"]
            if "show_fps_counter" in settings:
                update_data["show_fps_counter"] = settings["show_fps_counter"]
            
            response = self.client.table("user_settings").update(update_data).eq("user_id", user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Failed to update video settings for {user_id}: {e}")
            return None
    
    async def update_accessibility_settings(
        self, user_id: str, settings: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update accessibility settings for a user."""
        try:
            update_data = {}
            if "reduced_motion" in settings:
                update_data["reduced_motion"] = settings["reduced_motion"]
            if "colorblind_mode" in settings:
                update_data["colorblind_mode"] = settings["colorblind_mode"]
            if "font_scale" in settings:
                update_data["font_scale"] = settings["font_scale"]
            if "high_contrast" in settings:
                update_data["high_contrast"] = settings["high_contrast"]
            
            response = self.client.table("user_settings").update(update_data).eq("user_id", user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Failed to update accessibility settings for {user_id}: {e}")
            return None
    
    async def update_keybinds(
        self, user_id: str, keybinds: Dict[str, str]
    ) -> Optional[Dict[str, Any]]:
        """Update keybind settings for a user."""
        try:
            response = self.client.table("user_settings").update({"keybinds": keybinds}).eq("user_id", user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Failed to update keybinds for {user_id}: {e}")
            return None
    
    async def create_user_settings(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Create default user settings."""
        try:
            response = self.client.table("user_settings").insert({"user_id": user_id}).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Failed to create user settings for {user_id}: {e}")
            return None
    
    # ============================================
    # Combined Operations
    # ============================================
    
    async def get_or_create_settings(self, user_id: str) -> Dict[str, Any]:
        """Get or create all settings for a user."""
        notification_prefs = await self.get_notification_preferences(user_id)
        if not notification_prefs:
            notification_prefs = await self.create_notification_preferences(user_id)
        
        user_settings = await self.get_user_settings(user_id)
        if not user_settings:
            user_settings = await self.create_user_settings(user_id)
        
        return {
            "notification_preferences": notification_prefs,
            "user_settings": user_settings,
        }
    
    # ============================================
    # Privacy Settings (Extended)
    # ============================================
    
    async def update_privacy_settings_extended(
        self, user_id: str, settings: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update extended privacy settings including show_match_history."""
        try:
            update_data = {}
            if "is_public" in settings:
                update_data["is_public"] = settings["is_public"]
            if "accept_friend_requests" in settings:
                update_data["accept_friend_requests"] = settings["accept_friend_requests"]
            if "allow_messages" in settings:
                update_data["allow_messages"] = settings["allow_messages"]
            if "show_online_status" in settings:
                update_data["show_online_status"] = settings["show_online_status"]
            if "show_match_history" in settings:
                update_data["show_match_history"] = settings["show_match_history"]
            
            response = self.client.table("user_profiles").update(update_data).eq("id", user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Failed to update privacy settings for {user_id}: {e}")
            return None
    
    # ============================================
    # Account Management
    # ============================================
    
    async def mark_account_for_deletion(self, user_id: str) -> bool:
        """Mark an account for deletion (soft delete)."""
        try:
            from datetime import datetime, timedelta
            deletion_date = datetime.utcnow() + timedelta(days=30)
            
            response = self.client.table("user_profiles").update({
                "scheduled_deletion_at": deletion_date.isoformat(),
            }).eq("id", user_id).execute()
            
            return bool(response.data)
        except Exception as e:
            logger.error(f"Failed to mark account for deletion {user_id}: {e}")
            return False
