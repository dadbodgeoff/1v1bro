"""
Unit tests for profile schemas.
Tests validation rules for ProfileUpdate, SocialLinks, PrivacySettings.
Requirements: 2.1, 2.2, 2.8, 2.9
"""

import pytest
from pydantic import ValidationError

from app.schemas.profile import (
    SocialLinks,
    PrivacySettings,
    ProfileUpdate,
    Profile,
    PublicProfile,
    SignedUploadUrl,
    UploadConfirmRequest,
    UploadConfirmResponse,
    PrivacySettingsUpdate,
)


class TestSocialLinks:
    """Tests for SocialLinks schema URL validation."""

    def test_valid_twitch_url(self):
        """Valid Twitch URLs should be accepted."""
        links = SocialLinks(twitch="https://twitch.tv/username")
        assert links.twitch == "https://twitch.tv/username"
        
        links2 = SocialLinks(twitch="https://www.twitch.tv/username")
        assert links2.twitch == "https://www.twitch.tv/username"

    def test_invalid_twitch_url(self):
        """Invalid Twitch URLs should be rejected."""
        with pytest.raises(ValidationError) as exc_info:
            SocialLinks(twitch="https://youtube.com/channel")
        assert "Twitch URL must start with" in str(exc_info.value)

    def test_valid_youtube_url(self):
        """Valid YouTube URLs should be accepted."""
        links = SocialLinks(youtube="https://youtube.com/channel/123")
        assert links.youtube == "https://youtube.com/channel/123"
        
        links2 = SocialLinks(youtube="https://www.youtube.com/@username")
        assert links2.youtube == "https://www.youtube.com/@username"
        
        links3 = SocialLinks(youtube="https://youtu.be/video123")
        assert links3.youtube == "https://youtu.be/video123"

    def test_invalid_youtube_url(self):
        """Invalid YouTube URLs should be rejected."""
        with pytest.raises(ValidationError) as exc_info:
            SocialLinks(youtube="https://twitch.tv/username")
        assert "YouTube URL must be a valid" in str(exc_info.value)

    def test_valid_twitter_url(self):
        """Valid Twitter/X URLs should be accepted."""
        links = SocialLinks(twitter="https://twitter.com/username")
        assert links.twitter == "https://twitter.com/username"
        
        links2 = SocialLinks(twitter="https://x.com/username")
        assert links2.twitter == "https://x.com/username"

    def test_invalid_twitter_url(self):
        """Invalid Twitter URLs should be rejected."""
        with pytest.raises(ValidationError) as exc_info:
            SocialLinks(twitter="https://facebook.com/username")
        assert "Twitter URL must be a valid" in str(exc_info.value)

    def test_all_links_optional(self):
        """All social links should be optional."""
        links = SocialLinks()
        assert links.twitch is None
        assert links.youtube is None
        assert links.twitter is None

    def test_partial_links(self):
        """Should accept partial social links."""
        links = SocialLinks(twitch="https://twitch.tv/user")
        assert links.twitch == "https://twitch.tv/user"
        assert links.youtube is None
        assert links.twitter is None


class TestPrivacySettings:
    """Tests for PrivacySettings schema."""

    def test_default_values(self):
        """Default privacy settings should be permissive."""
        settings = PrivacySettings()
        assert settings.is_public is True
        assert settings.accept_friend_requests is True
        assert settings.allow_messages is True

    def test_custom_values(self):
        """Should accept custom privacy settings."""
        settings = PrivacySettings(
            is_public=False,
            accept_friend_requests=False,
            allow_messages=False
        )
        assert settings.is_public is False
        assert settings.accept_friend_requests is False
        assert settings.allow_messages is False


class TestProfileUpdate:
    """Tests for ProfileUpdate schema validation."""

    def test_valid_display_name(self):
        """Display names within 3-50 chars should be accepted."""
        update = ProfileUpdate(display_name="abc")  # min length
        assert update.display_name == "abc"
        
        update2 = ProfileUpdate(display_name="a" * 50)  # max length
        assert len(update2.display_name) == 50

    def test_display_name_too_short(self):
        """Display names under 3 chars should be rejected."""
        with pytest.raises(ValidationError) as exc_info:
            ProfileUpdate(display_name="ab")
        assert "display_name" in str(exc_info.value)

    def test_display_name_too_long(self):
        """Display names over 50 chars should be rejected."""
        with pytest.raises(ValidationError) as exc_info:
            ProfileUpdate(display_name="a" * 51)
        assert "display_name" in str(exc_info.value)

    def test_valid_bio(self):
        """Bios within 200 chars should be accepted."""
        update = ProfileUpdate(bio="This is my bio")
        assert update.bio == "This is my bio"
        
        update2 = ProfileUpdate(bio="a" * 200)  # max length
        assert len(update2.bio) == 200

    def test_bio_too_long(self):
        """Bios over 200 chars should be rejected."""
        with pytest.raises(ValidationError) as exc_info:
            ProfileUpdate(bio="a" * 201)
        assert "bio" in str(exc_info.value)

    def test_bio_whitespace_normalization(self):
        """Bio should normalize excessive whitespace."""
        update = ProfileUpdate(bio="Hello    world   test")
        assert update.bio == "Hello world test"

    def test_valid_country_code(self):
        """Valid ISO 3166-1 alpha-2 codes should be accepted."""
        update = ProfileUpdate(country="US")
        assert update.country == "US"
        
        # Should uppercase
        update2 = ProfileUpdate(country="gb")
        assert update2.country == "GB"

    def test_invalid_country_code_length(self):
        """Country codes not exactly 2 chars should be rejected."""
        with pytest.raises(ValidationError):
            ProfileUpdate(country="USA")
        
        with pytest.raises(ValidationError):
            ProfileUpdate(country="U")

    def test_valid_banner_color(self):
        """Valid hex color codes should be accepted."""
        update = ProfileUpdate(banner_color="#1a1a2e")
        assert update.banner_color == "#1a1a2e"
        
        update2 = ProfileUpdate(banner_color="#FFFFFF")
        assert update2.banner_color == "#FFFFFF"

    def test_invalid_banner_color(self):
        """Invalid hex color codes should be rejected."""
        with pytest.raises(ValidationError):
            ProfileUpdate(banner_color="1a1a2e")  # missing #
        
        with pytest.raises(ValidationError):
            ProfileUpdate(banner_color="#1a1a2")  # too short
        
        with pytest.raises(ValidationError):
            ProfileUpdate(banner_color="#1a1a2ee")  # too long

    def test_all_fields_optional(self):
        """All ProfileUpdate fields should be optional."""
        update = ProfileUpdate()
        assert update.display_name is None
        assert update.bio is None
        assert update.country is None
        assert update.banner_color is None
        assert update.social_links is None

    def test_nested_social_links(self):
        """Should accept nested SocialLinks."""
        update = ProfileUpdate(
            social_links=SocialLinks(twitch="https://twitch.tv/user")
        )
        assert update.social_links.twitch == "https://twitch.tv/user"


class TestProfile:
    """Tests for Profile response schema."""

    def test_required_fields(self):
        """Profile should require user_id."""
        profile = Profile(user_id="123e4567-e89b-12d3-a456-426614174000")
        assert profile.user_id == "123e4567-e89b-12d3-a456-426614174000"

    def test_default_values(self):
        """Profile should have sensible defaults."""
        profile = Profile(user_id="test-id")
        assert profile.banner_color == "#1a1a2e"
        assert profile.level == 1
        assert profile.total_xp == 0
        assert profile.title == "Rookie"
        assert profile.is_public is True
        assert profile.accept_friend_requests is True
        assert profile.allow_messages is True


class TestPublicProfile:
    """Tests for PublicProfile schema."""

    def test_required_fields(self):
        """PublicProfile should require user_id."""
        profile = PublicProfile(user_id="test-id")
        assert profile.user_id == "test-id"

    def test_optional_privacy_fields(self):
        """Bio and social_links should be optional (privacy-filtered)."""
        profile = PublicProfile(user_id="test-id")
        assert profile.bio is None
        assert profile.social_links is None


class TestSignedUploadUrl:
    """Tests for SignedUploadUrl schema."""

    def test_required_fields(self):
        """SignedUploadUrl should require all fields."""
        from datetime import datetime, timedelta
        
        url = SignedUploadUrl(
            upload_url="https://storage.example.com/upload",
            storage_path="avatars/user123/avatar.jpg",
            expires_at=datetime.now() + timedelta(minutes=5),
            max_size_bytes=5242880,
            allowed_types=["image/jpeg", "image/png", "image/webp"]
        )
        assert url.upload_url == "https://storage.example.com/upload"
        assert url.max_size_bytes == 5242880
        assert len(url.allowed_types) == 3


class TestUploadConfirmRequest:
    """Tests for UploadConfirmRequest schema."""

    def test_required_storage_path(self):
        """UploadConfirmRequest should require storage_path."""
        request = UploadConfirmRequest(storage_path="avatars/user123/avatar.jpg")
        assert request.storage_path == "avatars/user123/avatar.jpg"


class TestPrivacySettingsUpdate:
    """Tests for PrivacySettingsUpdate schema."""

    def test_all_fields_optional(self):
        """All fields should be optional for partial updates."""
        update = PrivacySettingsUpdate()
        assert update.is_public is None
        assert update.accept_friend_requests is None
        assert update.allow_messages is None

    def test_partial_update(self):
        """Should accept partial privacy updates."""
        update = PrivacySettingsUpdate(is_public=False)
        assert update.is_public is False
        assert update.accept_friend_requests is None
