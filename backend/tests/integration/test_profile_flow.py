"""
Integration tests for profile service flow.
Requirements: 2.1-2.10
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch


class TestProfileSchemas:
    """Test profile schema validation."""

    def test_profile_schema_fields(self):
        """Profile schema should have required fields."""
        from app.schemas.profile import Profile
        
        # Check schema has expected fields
        fields = Profile.model_fields
        assert "display_name" in fields
        assert "bio" in fields
        assert "avatar_url" in fields

    def test_profile_update_schema(self):
        """ProfileUpdate schema should validate correctly."""
        from app.schemas.profile import ProfileUpdate
        
        # Valid update
        update = ProfileUpdate(display_name="NewName", bio="New bio")
        assert update.display_name == "NewName"
        assert update.bio == "New bio"


class TestPrivacySettingsSchema:
    """Test privacy settings schema."""

    def test_privacy_settings_defaults(self):
        """Privacy settings should have sensible defaults."""
        from app.schemas.profile import PrivacySettings
        
        settings = PrivacySettings()
        assert settings.is_public is True
        assert settings.accept_friend_requests is True
        assert settings.allow_messages is True


class TestSocialLinksSchema:
    """Test social links schema."""

    def test_social_links_optional(self):
        """Social links should all be optional."""
        from app.schemas.profile import SocialLinks
        
        # Empty social links should be valid
        links = SocialLinks()
        assert links.twitter is None
        assert links.twitch is None

    def test_social_links_with_values(self):
        """Social links should accept valid URLs."""
        from app.schemas.profile import SocialLinks
        
        links = SocialLinks(
            twitter="https://twitter.com/user",
            twitch="https://twitch.tv/user",
        )
        assert links.twitter == "https://twitter.com/user"
        assert links.twitch == "https://twitch.tv/user"


class TestSignedUploadUrlSchema:
    """Test signed upload URL schema."""

    def test_signed_upload_url_fields(self):
        """SignedUploadUrl should have required fields."""
        from app.schemas.profile import SignedUploadUrl
        
        url = SignedUploadUrl(
            upload_url="https://storage.example.com/upload",
            storage_path="avatars/user-id/avatar.jpg",
            expires_at="2024-01-01T00:00:00Z",
            max_size_bytes=10485760,
            allowed_types=["image/jpeg", "image/png"],
        )
        
        assert url.upload_url == "https://storage.example.com/upload"
        assert url.storage_path == "avatars/user-id/avatar.jpg"
        # expires_at is parsed as datetime
        assert url.expires_at is not None
