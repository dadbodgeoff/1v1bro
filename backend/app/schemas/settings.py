"""
Settings schemas for user preferences management.
Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
"""

from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum

from pydantic import Field, field_validator

from app.schemas.base import BaseSchema, TimestampMixin


# ============================================
# Enums
# ============================================

class VideoQuality(str, Enum):
    """Video quality preset options."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    ULTRA = "ultra"


class ColorblindMode(str, Enum):
    """Colorblind accessibility mode options."""
    NONE = "none"
    PROTANOPIA = "protanopia"
    DEUTERANOPIA = "deuteranopia"
    TRITANOPIA = "tritanopia"


class FPSLimit(int, Enum):
    """FPS limit options. 0 means unlimited."""
    UNLIMITED = 0
    FPS_30 = 30
    FPS_60 = 60
    FPS_120 = 120


# ============================================
# Notification Preferences
# ============================================

class NotificationPreferences(BaseSchema):
    """User notification preferences."""
    
    email_enabled: bool = Field(default=True, description="Master toggle for email notifications")
    push_enabled: bool = Field(default=True, description="Master toggle for push notifications")
    friend_activity: bool = Field(default=True, description="Notifications for friend requests and online status")
    match_updates: bool = Field(default=True, description="Notifications for match found and results")
    marketing_emails: bool = Field(default=False, description="Promotional and news emails")


class NotificationPreferencesUpdate(BaseSchema):
    """Request to update notification preferences."""
    
    email_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None
    friend_activity: Optional[bool] = None
    match_updates: Optional[bool] = None
    marketing_emails: Optional[bool] = None


# ============================================
# Audio Settings
# ============================================

class AudioSettings(BaseSchema):
    """User audio settings."""
    
    master: int = Field(default=80, ge=0, le=100, description="Master volume (0-100)")
    music: int = Field(default=70, ge=0, le=100, description="Music volume (0-100)")
    sfx: int = Field(default=80, ge=0, le=100, description="Sound effects volume (0-100)")
    voice: int = Field(default=100, ge=0, le=100, description="Voice/announcer volume (0-100)")
    
    @field_validator('master', 'music', 'sfx', 'voice', mode='before')
    @classmethod
    def clamp_volume(cls, v: int) -> int:
        """Clamp volume values to valid range."""
        if v is None:
            return 80
        return max(0, min(100, int(v)))


class AudioSettingsUpdate(BaseSchema):
    """Request to update audio settings."""
    
    master: Optional[int] = Field(None, ge=0, le=100)
    music: Optional[int] = Field(None, ge=0, le=100)
    sfx: Optional[int] = Field(None, ge=0, le=100)
    voice: Optional[int] = Field(None, ge=0, le=100)


# ============================================
# Video Settings
# ============================================

class VideoSettings(BaseSchema):
    """User video settings."""
    
    quality: VideoQuality = Field(default=VideoQuality.HIGH, description="Video quality preset")
    fps_limit: int = Field(default=60, description="FPS limit (0 for unlimited)")
    show_fps_counter: bool = Field(default=False, description="Show FPS counter in game")
    
    @field_validator('fps_limit', mode='before')
    @classmethod
    def validate_fps_limit(cls, v: int) -> int:
        """Validate FPS limit is one of allowed values."""
        allowed = [0, 30, 60, 120]
        if v not in allowed:
            # Find closest allowed value
            return min(allowed, key=lambda x: abs(x - v))
        return v


class VideoSettingsUpdate(BaseSchema):
    """Request to update video settings."""
    
    quality: Optional[VideoQuality] = None
    fps_limit: Optional[int] = None
    show_fps_counter: Optional[bool] = None


# ============================================
# Accessibility Settings
# ============================================

class AccessibilitySettings(BaseSchema):
    """User accessibility settings."""
    
    reduced_motion: bool = Field(default=False, description="Reduce animations and motion effects")
    colorblind_mode: ColorblindMode = Field(default=ColorblindMode.NONE, description="Colorblind accessibility mode")
    font_scale: float = Field(default=1.0, ge=0.8, le=1.5, description="Font scale multiplier (0.8-1.5)")
    high_contrast: bool = Field(default=False, description="Enable high contrast mode")
    
    @field_validator('font_scale', mode='before')
    @classmethod
    def clamp_font_scale(cls, v: float) -> float:
        """Clamp font scale to valid range."""
        if v is None:
            return 1.0
        return max(0.8, min(1.5, float(v)))


class AccessibilitySettingsUpdate(BaseSchema):
    """Request to update accessibility settings."""
    
    reduced_motion: Optional[bool] = None
    colorblind_mode: Optional[ColorblindMode] = None
    font_scale: Optional[float] = Field(None, ge=0.8, le=1.5)
    high_contrast: Optional[bool] = None


# ============================================
# Keybinds
# ============================================

DEFAULT_KEYBINDS = {
    "move_up": "KeyW",
    "move_down": "KeyS",
    "move_left": "KeyA",
    "move_right": "KeyD",
    "use_powerup": "Space",
    "open_emote": "KeyE",
    "toggle_scoreboard": "Tab",
}


class Keybinds(BaseSchema):
    """User keybind settings."""
    
    move_up: str = Field(default="KeyW", description="Move up key")
    move_down: str = Field(default="KeyS", description="Move down key")
    move_left: str = Field(default="KeyA", description="Move left key")
    move_right: str = Field(default="KeyD", description="Move right key")
    use_powerup: str = Field(default="Space", description="Use power-up key")
    open_emote: str = Field(default="KeyE", description="Open emote wheel key")
    toggle_scoreboard: str = Field(default="Tab", description="Toggle scoreboard key")
    
    def has_conflicts(self) -> list[tuple[str, str, str]]:
        """Check for keybind conflicts. Returns list of (key, action1, action2) tuples."""
        conflicts = []
        bindings = self.model_dump()
        keys_seen: Dict[str, str] = {}
        
        for action, key in bindings.items():
            if key in keys_seen:
                conflicts.append((key, keys_seen[key], action))
            else:
                keys_seen[key] = action
        
        return conflicts


class KeybindsUpdate(BaseSchema):
    """Request to update keybinds."""
    
    move_up: Optional[str] = None
    move_down: Optional[str] = None
    move_left: Optional[str] = None
    move_right: Optional[str] = None
    use_powerup: Optional[str] = None
    open_emote: Optional[str] = None
    toggle_scoreboard: Optional[str] = None


# ============================================
# Privacy Settings Extended
# ============================================

class PrivacySettingsExtended(BaseSchema):
    """Extended privacy settings including show_match_history."""
    
    is_public: bool = Field(default=True, description="Whether profile is publicly visible")
    accept_friend_requests: bool = Field(default=True, description="Whether to accept friend requests")
    allow_messages: bool = Field(default=True, description="Whether to allow direct messages")
    show_online_status: bool = Field(default=True, description="Whether to show online status to friends")
    show_match_history: bool = Field(default=True, description="Whether to show match history on profile")


class PrivacySettingsExtendedUpdate(BaseSchema):
    """Request to update extended privacy settings."""
    
    is_public: Optional[bool] = None
    accept_friend_requests: Optional[bool] = None
    allow_messages: Optional[bool] = None
    show_online_status: Optional[bool] = None
    show_match_history: Optional[bool] = None


# ============================================
# Composite User Settings
# ============================================

class UserSettings(BaseSchema):
    """Complete user settings response."""
    
    notifications: NotificationPreferences = Field(default_factory=NotificationPreferences)
    audio: AudioSettings = Field(default_factory=AudioSettings)
    video: VideoSettings = Field(default_factory=VideoSettings)
    accessibility: AccessibilitySettings = Field(default_factory=AccessibilitySettings)
    keybinds: Keybinds = Field(default_factory=Keybinds)


class UserSettingsResponse(BaseSchema, TimestampMixin):
    """User settings with metadata."""
    
    user_id: str = Field(..., description="User UUID")
    notifications: NotificationPreferences
    audio: AudioSettings
    video: VideoSettings
    accessibility: AccessibilitySettings
    keybinds: Keybinds


# ============================================
# 2FA Schemas
# ============================================

class TwoFactorSetupResponse(BaseSchema):
    """Response for 2FA setup initiation."""
    
    secret: str = Field(..., description="TOTP secret for manual entry")
    qr_code_url: str = Field(..., description="URL for QR code image")
    recovery_codes: list[str] = Field(..., description="One-time recovery codes")


class TwoFactorVerifyRequest(BaseSchema):
    """Request to verify 2FA code."""
    
    code: str = Field(..., min_length=6, max_length=6, description="6-digit TOTP code")


class TwoFactorVerifyResponse(BaseSchema):
    """Response after 2FA verification."""
    
    success: bool = Field(..., description="Whether verification succeeded")
    enabled: bool = Field(..., description="Whether 2FA is now enabled")


class TwoFactorRecoveryCodesResponse(BaseSchema):
    """Response with recovery codes."""
    
    recovery_codes: list[str] = Field(..., description="Recovery codes")


# ============================================
# Account Management Schemas
# ============================================

class DeleteAccountRequest(BaseSchema):
    """Request to delete account."""
    
    password: str = Field(..., min_length=1, description="Current password for verification")
    confirmation: str = Field(..., description="Must be 'DELETE' to confirm")
    
    @field_validator('confirmation')
    @classmethod
    def validate_confirmation(cls, v: str) -> str:
        """Validate confirmation text."""
        if v != "DELETE":
            raise ValueError("Confirmation must be 'DELETE'")
        return v


class DataExportResponse(BaseSchema):
    """Response for data export request."""
    
    status: str = Field(..., description="Export status")
    message: str = Field(..., description="Status message")
    estimated_time_minutes: int = Field(default=5, description="Estimated time to complete")
