"""
Property-based tests for profile validation.
Property 5: Profile Field Validation
Validates: Requirements 2.2
"""

import pytest
from hypothesis import given, strategies as st, assume, settings

from app.schemas.profile import (
    ProfileUpdate,
    SocialLinks,
    PrivacySettings,
    Profile,
)
from app.services.profile_service import ProfileService
from app.database.repositories.profile_repo import ProfileRepository
from pydantic import ValidationError


class TestProfileFieldValidation:
    """
    Property 5: Profile Field Validation
    
    For any profile update request:
    - bio length exceeding 200 characters SHALL be rejected
    - display_name outside 3-50 characters SHALL be rejected
    - country code not matching 2-letter format SHALL be rejected
    - banner_color not matching hex format SHALL be rejected
    """

    @given(bio=st.text(min_size=201, max_size=500))
    @settings(max_examples=50)
    def test_bio_exceeding_200_chars_rejected(self, bio: str):
        """Bio exceeding 200 characters should be rejected."""
        assume(len(bio) > 200)
        
        with pytest.raises(ValidationError) as exc_info:
            ProfileUpdate(bio=bio)
        
        # Verify the error is about bio length
        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("bio",) and "200" in str(error["msg"]).lower()
            for error in errors
        )

    @given(bio=st.text(min_size=0, max_size=200))
    @settings(max_examples=50)
    def test_bio_within_200_chars_accepted(self, bio: str):
        """Bio within 200 characters should be accepted."""
        # Should not raise
        update = ProfileUpdate(bio=bio)
        assert update.bio is not None or bio == ""

    @given(display_name=st.text(min_size=0, max_size=2))
    @settings(max_examples=50)
    def test_display_name_under_3_chars_rejected(self, display_name: str):
        """Display name under 3 characters should be rejected."""
        assume(len(display_name) < 3 and len(display_name) > 0)
        
        with pytest.raises(ValidationError) as exc_info:
            ProfileUpdate(display_name=display_name)
        
        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("display_name",)
            for error in errors
        )

    @given(display_name=st.text(min_size=51, max_size=100, alphabet=st.characters(whitelist_categories=('L', 'N'))))
    @settings(max_examples=50)
    def test_display_name_over_50_chars_rejected(self, display_name: str):
        """Display name over 50 characters should be rejected."""
        assume(len(display_name) > 50)
        
        with pytest.raises(ValidationError) as exc_info:
            ProfileUpdate(display_name=display_name)
        
        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("display_name",)
            for error in errors
        )

    @given(display_name=st.text(min_size=3, max_size=50, alphabet=st.characters(whitelist_categories=('L', 'N', 'P', 'S'))))
    @settings(max_examples=50)
    def test_display_name_within_3_50_chars_accepted(self, display_name: str):
        """Display name within 3-50 characters should be accepted."""
        assume(3 <= len(display_name) <= 50)
        
        # Should not raise
        update = ProfileUpdate(display_name=display_name)
        assert update.display_name == display_name

    @given(country=st.text(min_size=1, max_size=1))
    @settings(max_examples=20)
    def test_country_code_1_char_rejected(self, country: str):
        """Country code with 1 character should be rejected."""
        with pytest.raises(ValidationError) as exc_info:
            ProfileUpdate(country=country)
        
        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("country",)
            for error in errors
        )

    @given(country=st.text(min_size=3, max_size=5, alphabet=st.characters(whitelist_categories=('L', 'N'))))
    @settings(max_examples=20)
    def test_country_code_over_2_chars_rejected(self, country: str):
        """Country code over 2 characters should be rejected."""
        assume(len(country) > 2)
        
        with pytest.raises(ValidationError) as exc_info:
            ProfileUpdate(country=country)
        
        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("country",)
            for error in errors
        )

    @given(country=st.from_regex(r"^[A-Za-z]{2}$", fullmatch=True))
    @settings(max_examples=50)
    def test_country_code_2_letters_accepted(self, country: str):
        """Country code with exactly 2 letters should be accepted."""
        # Should not raise
        update = ProfileUpdate(country=country)
        # Should be uppercased
        assert update.country == country.upper()

    @given(color=st.text(min_size=1, max_size=10).filter(lambda x: not x.startswith('#') or len(x) != 7))
    @settings(max_examples=50)
    def test_invalid_banner_color_rejected(self, color: str):
        """Invalid banner color format should be rejected."""
        # Skip valid hex colors
        import re
        if re.match(r'^#[0-9A-Fa-f]{6}$', color):
            return
        
        with pytest.raises(ValidationError):
            ProfileUpdate(banner_color=color)

    @given(color=st.from_regex(r"^#[0-9A-Fa-f]{6}$", fullmatch=True))
    @settings(max_examples=50)
    def test_valid_banner_color_accepted(self, color: str):
        """Valid hex banner color should be accepted."""
        # Should not raise
        update = ProfileUpdate(banner_color=color)
        assert update.banner_color == color


class TestSocialLinksValidation:
    """Tests for social links URL validation."""

    @given(url=st.text(min_size=1, max_size=100).filter(lambda x: not x.startswith('https://twitch.tv/') and not x.startswith('https://www.twitch.tv/')))
    @settings(max_examples=30)
    def test_invalid_twitch_url_rejected(self, url: str):
        """Invalid Twitch URL should be rejected."""
        assume(url and not url.startswith('https://twitch.tv/') and not url.startswith('https://www.twitch.tv/'))
        
        with pytest.raises(ValidationError):
            SocialLinks(twitch=url)

    def test_valid_twitch_url_accepted(self):
        """Valid Twitch URL should be accepted."""
        links = SocialLinks(twitch="https://twitch.tv/testuser")
        assert links.twitch == "https://twitch.tv/testuser"
        
        links2 = SocialLinks(twitch="https://www.twitch.tv/testuser")
        assert links2.twitch == "https://www.twitch.tv/testuser"

    def test_valid_youtube_url_accepted(self):
        """Valid YouTube URL should be accepted."""
        links = SocialLinks(youtube="https://youtube.com/channel/test")
        assert links.youtube == "https://youtube.com/channel/test"
        
        links2 = SocialLinks(youtube="https://www.youtube.com/channel/test")
        assert links2.youtube == "https://www.youtube.com/channel/test"

    def test_valid_twitter_url_accepted(self):
        """Valid Twitter/X URL should be accepted."""
        links = SocialLinks(twitter="https://twitter.com/testuser")
        assert links.twitter == "https://twitter.com/testuser"
        
        links2 = SocialLinks(twitter="https://x.com/testuser")
        assert links2.twitter == "https://x.com/testuser"

    def test_none_values_accepted(self):
        """None values for social links should be accepted."""
        links = SocialLinks(twitch=None, youtube=None, twitter=None)
        assert links.twitch is None
        assert links.youtube is None
        assert links.twitter is None


class TestComputeLevelProperty:
    """Property tests for level computation."""

    @given(xp=st.integers(min_value=0, max_value=1000000))
    @settings(max_examples=100)
    def test_level_always_at_least_1(self, xp: int):
        """Level should always be at least 1."""
        level = ProfileService.compute_level(xp)
        assert level >= 1

    @given(xp=st.integers(min_value=-1000000, max_value=-1))
    @settings(max_examples=50)
    def test_negative_xp_returns_level_1(self, xp: int):
        """Negative XP should return level 1."""
        level = ProfileService.compute_level(xp)
        assert level == 1

    @given(xp=st.integers(min_value=0, max_value=1000000))
    @settings(max_examples=100)
    def test_level_formula_correctness(self, xp: int):
        """Level should follow formula: floor(sqrt(xp / 100))."""
        import math
        level = ProfileService.compute_level(xp)
        
        if xp <= 0:
            assert level == 1
        else:
            expected = max(1, int(math.floor(math.sqrt(xp / 100))))
            assert level == expected

    @given(level=st.integers(min_value=1, max_value=100))
    @settings(max_examples=50)
    def test_xp_to_level_mapping(self, level: int):
        """XP required for level should be level^2 * 100."""
        # XP required to reach level N is N^2 * 100
        xp_required = level * level * 100
        computed_level = ProfileService.compute_level(xp_required)
        assert computed_level == level


class TestPrivacySettingsValidation:
    """Tests for privacy settings validation."""

    @given(
        is_public=st.booleans(),
        accept_friend_requests=st.booleans(),
        allow_messages=st.booleans()
    )
    @settings(max_examples=50)
    def test_all_boolean_combinations_valid(
        self, is_public: bool, accept_friend_requests: bool, allow_messages: bool
    ):
        """All boolean combinations should be valid."""
        settings = PrivacySettings(
            is_public=is_public,
            accept_friend_requests=accept_friend_requests,
            allow_messages=allow_messages
        )
        assert settings.is_public == is_public
        assert settings.accept_friend_requests == accept_friend_requests
        assert settings.allow_messages == allow_messages

    def test_default_values(self):
        """Default values should be True."""
        settings = PrivacySettings()
        assert settings.is_public is True
        assert settings.accept_friend_requests is True
        assert settings.allow_messages is True
