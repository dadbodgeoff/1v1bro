"""
Profile schemas for user profile management.
Requirements: 2.1, 2.2, 2.8, 2.9
"""

from datetime import datetime
from typing import Optional, List
from enum import Enum

from pydantic import Field, HttpUrl, field_validator

from app.schemas.base import BaseSchema, TimestampMixin


# ============================================
# Social Links Schema
# ============================================

class SocialLinks(BaseSchema):
    """Social media links with URL validation."""
    
    twitch: Optional[str] = Field(None, description="Twitch profile URL")
    youtube: Optional[str] = Field(None, description="YouTube channel URL")
    twitter: Optional[str] = Field(None, description="Twitter/X profile URL")
    
    @field_validator('twitch')
    @classmethod
    def validate_twitch_url(cls, v: Optional[str]) -> Optional[str]:
        """Validate Twitch URL format."""
        if v is None:
            return v
        if not v.startswith(('https://twitch.tv/', 'https://www.twitch.tv/')):
            raise ValueError('Twitch URL must start with https://twitch.tv/ or https://www.twitch.tv/')
        return v
    
    @field_validator('youtube')
    @classmethod
    def validate_youtube_url(cls, v: Optional[str]) -> Optional[str]:
        """Validate YouTube URL format."""
        if v is None:
            return v
        valid_prefixes = (
            'https://youtube.com/',
            'https://www.youtube.com/',
            'https://youtu.be/',
        )
        if not v.startswith(valid_prefixes):
            raise ValueError('YouTube URL must be a valid youtube.com or youtu.be URL')
        return v
    
    @field_validator('twitter')
    @classmethod
    def validate_twitter_url(cls, v: Optional[str]) -> Optional[str]:
        """Validate Twitter/X URL format."""
        if v is None:
            return v
        valid_prefixes = (
            'https://twitter.com/',
            'https://www.twitter.com/',
            'https://x.com/',
            'https://www.x.com/',
        )
        if not v.startswith(valid_prefixes):
            raise ValueError('Twitter URL must be a valid twitter.com or x.com URL')
        return v


# ============================================
# Privacy Settings Schema
# ============================================

class PrivacySettings(BaseSchema):
    """Profile privacy settings."""
    
    is_public: bool = Field(default=True, description="Whether profile is publicly visible")
    accept_friend_requests: bool = Field(default=True, description="Whether to accept friend requests")
    allow_messages: bool = Field(default=True, description="Whether to allow direct messages")


# ============================================
# Profile Update Schema
# ============================================

class ProfileUpdate(BaseSchema):
    """Request schema for updating profile fields."""
    
    display_name: Optional[str] = Field(
        None,
        min_length=3,
        max_length=50,
        description="Display name (3-50 characters)"
    )
    bio: Optional[str] = Field(
        None,
        max_length=200,
        description="Profile bio (max 200 characters)"
    )
    country: Optional[str] = Field(
        None,
        min_length=2,
        max_length=2,
        description="ISO 3166-1 alpha-2 country code"
    )
    banner_color: Optional[str] = Field(
        None,
        pattern=r'^#[0-9A-Fa-f]{6}$',
        description="Banner color as hex code (e.g., #1a1a2e)"
    )
    social_links: Optional[SocialLinks] = Field(
        None,
        description="Social media links"
    )
    
    @field_validator('country')
    @classmethod
    def validate_country_code(cls, v: Optional[str]) -> Optional[str]:
        """Validate country code is uppercase."""
        if v is None:
            return v
        return v.upper()
    
    @field_validator('bio')
    @classmethod
    def validate_bio_content(cls, v: Optional[str]) -> Optional[str]:
        """Validate bio doesn't contain prohibited content."""
        if v is None:
            return v
        # Strip excessive whitespace
        return ' '.join(v.split())


# ============================================
# Profile Response Schema
# ============================================

class Profile(BaseSchema, TimestampMixin):
    """Complete profile response schema."""
    
    user_id: str = Field(..., description="User UUID")
    display_name: Optional[str] = Field(None, description="Display name")
    bio: Optional[str] = Field(None, description="Profile bio")
    avatar_url: Optional[str] = Field(None, description="Avatar image URL")
    banner_url: Optional[str] = Field(None, description="Banner image URL")
    banner_color: str = Field(default="#1a1a2e", description="Banner background color")
    level: int = Field(default=1, description="Player level")
    total_xp: int = Field(default=0, description="Total experience points")
    title: str = Field(default="Rookie", description="Player title")
    country: Optional[str] = Field(None, description="Country code")
    social_links: SocialLinks = Field(default_factory=SocialLinks, description="Social media links")
    is_public: bool = Field(default=True, description="Profile visibility")
    accept_friend_requests: bool = Field(default=True, description="Accept friend requests")
    allow_messages: bool = Field(default=True, description="Allow direct messages")


class PublicProfile(BaseSchema):
    """Public profile view (respects privacy settings)."""
    
    user_id: str = Field(..., description="User UUID")
    display_name: Optional[str] = Field(None, description="Display name")
    avatar_url: Optional[str] = Field(None, description="Avatar image URL")
    banner_url: Optional[str] = Field(None, description="Banner image URL")
    banner_color: str = Field(default="#1a1a2e", description="Banner background color")
    level: int = Field(default=1, description="Player level")
    title: str = Field(default="Rookie", description="Player title")
    country: Optional[str] = Field(None, description="Country code")
    # Bio and social links only shown if profile is public
    bio: Optional[str] = Field(None, description="Profile bio (if public)")
    social_links: Optional[SocialLinks] = Field(None, description="Social links (if public)")


# ============================================
# File Upload Schemas
# ============================================

class SignedUploadUrl(BaseSchema):
    """Signed URL response for file upload."""
    
    upload_url: str = Field(..., description="Pre-signed URL for direct upload")
    storage_path: str = Field(..., description="Path where file will be stored")
    expires_at: datetime = Field(..., description="URL expiration timestamp")
    max_size_bytes: int = Field(..., description="Maximum allowed file size")
    allowed_types: List[str] = Field(..., description="Allowed MIME types")


class UploadConfirmRequest(BaseSchema):
    """Request to confirm file upload completion."""
    
    storage_path: str = Field(..., description="Storage path from upload URL response")


class UploadConfirmResponse(BaseSchema):
    """Response after confirming file upload."""
    
    url: str = Field(..., description="Public CDN URL for the uploaded file")
    variants: List[str] = Field(default_factory=list, description="URLs for resized variants")


# ============================================
# Privacy Settings Update
# ============================================

class PrivacySettingsUpdate(BaseSchema):
    """Request to update privacy settings."""
    
    is_public: Optional[bool] = Field(None, description="Profile visibility")
    accept_friend_requests: Optional[bool] = Field(None, description="Accept friend requests")
    allow_messages: Optional[bool] = Field(None, description="Allow direct messages")
