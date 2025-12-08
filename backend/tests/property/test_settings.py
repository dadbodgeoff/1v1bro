"""
Property-based tests for settings schemas.
**Feature: settings-enterprise-system**

Tests validation rules for settings schemas using Hypothesis.
Requirements: 5.1, 6.1, 10.1, 10.3
"""

import pytest
from hypothesis import given, strategies as st, settings, assume
from pydantic import ValidationError

from app.schemas.settings import (
    AudioSettings,
    AudioSettingsUpdate,
    VideoSettings,
    VideoSettingsUpdate,
    VideoQuality,
    AccessibilitySettings,
    AccessibilitySettingsUpdate,
    ColorblindMode,
    FPSLimit,
    Keybinds,
    KeybindsUpdate,
    NotificationPreferences,
    NotificationPreferencesUpdate,
    UserSettings,
    DEFAULT_KEYBINDS,
)


class TestAudioSettingsProperties:
    """Property tests for audio settings validation."""

    @given(
        master=st.integers(min_value=-1000, max_value=1000),
        music=st.integers(min_value=-1000, max_value=1000),
        sfx=st.integers(min_value=-1000, max_value=1000),
        voice=st.integers(min_value=-1000, max_value=1000),
    )
    @settings(max_examples=100)
    def test_audio_volume_bounds(self, master: int, music: int, sfx: int, voice: int):
        """
        **Property 1: Audio Volume Bounds**
        *For any* audio setting, value SHALL be in [0, 100].
        **Validates: Requirements 5.1**
        """
        audio = AudioSettings(master=master, music=music, sfx=sfx, voice=voice)
        
        assert 0 <= audio.master <= 100, f"Master volume {audio.master} out of bounds"
        assert 0 <= audio.music <= 100, f"Music volume {audio.music} out of bounds"
        assert 0 <= audio.sfx <= 100, f"SFX volume {audio.sfx} out of bounds"
        assert 0 <= audio.voice <= 100, f"Voice volume {audio.voice} out of bounds"

    @given(
        master=st.integers(min_value=0, max_value=100),
        music=st.integers(min_value=0, max_value=100),
        sfx=st.integers(min_value=0, max_value=100),
        voice=st.integers(min_value=0, max_value=100),
    )
    @settings(max_examples=100)
    def test_valid_audio_values_preserved(self, master: int, music: int, sfx: int, voice: int):
        """
        *For any* valid audio values in [0, 100], the values SHALL be preserved exactly.
        **Validates: Requirements 5.1**
        """
        audio = AudioSettings(master=master, music=music, sfx=sfx, voice=voice)
        
        assert audio.master == master
        assert audio.music == music
        assert audio.sfx == sfx
        assert audio.voice == voice


class TestVideoSettingsProperties:
    """Property tests for video settings validation."""

    @given(quality=st.sampled_from(list(VideoQuality)))
    @settings(max_examples=100)
    def test_video_quality_enum_validity(self, quality: VideoQuality):
        """
        **Property 6: Video Quality Enum Validity**
        *For any* video_quality, value SHALL be valid enum.
        **Validates: Requirements 6.1**
        """
        video = VideoSettings(quality=quality)
        assert video.quality in VideoQuality
        assert video.quality.value in ['low', 'medium', 'high', 'ultra']

    @given(fps_limit=st.integers(min_value=-100, max_value=200))
    @settings(max_examples=100)
    def test_fps_limit_enum_validity(self, fps_limit: int):
        """
        **Property 8: FPS Limit Enum Validity**
        *For any* fps_limit, value SHALL be valid enum (0, 30, 60, 120).
        **Validates: Requirements 6.1**
        """
        video = VideoSettings(fps_limit=fps_limit)
        assert video.fps_limit in [0, 30, 60, 120], f"FPS limit {video.fps_limit} not in allowed values"

    @given(
        quality=st.sampled_from(list(VideoQuality)),
        fps_limit=st.sampled_from([0, 30, 60, 120]),
        show_fps_counter=st.booleans(),
    )
    @settings(max_examples=100)
    def test_valid_video_settings_preserved(
        self, quality: VideoQuality, fps_limit: int, show_fps_counter: bool
    ):
        """
        *For any* valid video settings, the values SHALL be preserved exactly.
        **Validates: Requirements 6.1**
        """
        video = VideoSettings(quality=quality, fps_limit=fps_limit, show_fps_counter=show_fps_counter)
        
        assert video.quality == quality
        assert video.fps_limit == fps_limit
        assert video.show_fps_counter == show_fps_counter


class TestAccessibilitySettingsProperties:
    """Property tests for accessibility settings validation."""

    @given(colorblind_mode=st.sampled_from(list(ColorblindMode)))
    @settings(max_examples=100)
    def test_colorblind_mode_enum_validity(self, colorblind_mode: ColorblindMode):
        """
        **Property 7: Colorblind Mode Enum Validity**
        *For any* colorblind_mode, value SHALL be valid enum.
        **Validates: Requirements 10.1**
        """
        accessibility = AccessibilitySettings(colorblind_mode=colorblind_mode)
        assert accessibility.colorblind_mode in ColorblindMode
        assert accessibility.colorblind_mode.value in ['none', 'protanopia', 'deuteranopia', 'tritanopia']

    @given(font_scale=st.floats(min_value=-10.0, max_value=10.0, allow_nan=False, allow_infinity=False))
    @settings(max_examples=100)
    def test_font_scale_bounds(self, font_scale: float):
        """
        **Property 2: Font Scale Bounds**
        *For any* font_scale, value SHALL be in [0.8, 1.5].
        **Validates: Requirements 10.3**
        """
        accessibility = AccessibilitySettings(font_scale=font_scale)
        assert 0.8 <= accessibility.font_scale <= 1.5, f"Font scale {accessibility.font_scale} out of bounds"

    @given(font_scale=st.floats(min_value=0.8, max_value=1.5, allow_nan=False, allow_infinity=False))
    @settings(max_examples=100)
    def test_valid_font_scale_preserved(self, font_scale: float):
        """
        *For any* valid font_scale in [0.8, 1.5], the value SHALL be preserved.
        **Validates: Requirements 10.3**
        """
        accessibility = AccessibilitySettings(font_scale=font_scale)
        assert abs(accessibility.font_scale - font_scale) < 0.01  # Allow small float precision differences


class TestKeybindsProperties:
    """Property tests for keybind validation."""

    # Valid key codes for testing
    VALID_KEY_CODES = [
        "KeyA", "KeyB", "KeyC", "KeyD", "KeyE", "KeyF", "KeyG", "KeyH", "KeyI", "KeyJ",
        "KeyK", "KeyL", "KeyM", "KeyN", "KeyO", "KeyP", "KeyQ", "KeyR", "KeyS", "KeyT",
        "KeyU", "KeyV", "KeyW", "KeyX", "KeyY", "KeyZ", "Digit0", "Digit1", "Digit2",
        "Space", "Tab", "Enter", "Escape", "ShiftLeft", "ShiftRight", "ControlLeft",
    ]

    @given(
        move_up=st.sampled_from(VALID_KEY_CODES),
        move_down=st.sampled_from(VALID_KEY_CODES),
        move_left=st.sampled_from(VALID_KEY_CODES),
        move_right=st.sampled_from(VALID_KEY_CODES),
    )
    @settings(max_examples=100)
    def test_keybind_conflict_detection(
        self, move_up: str, move_down: str, move_left: str, move_right: str
    ):
        """
        **Property 4: Keybind Uniqueness**
        *For any* keybind config, conflict detection SHALL identify duplicate keys.
        **Validates: Requirements 7.3**
        """
        keybinds = Keybinds(
            move_up=move_up,
            move_down=move_down,
            move_left=move_left,
            move_right=move_right,
        )
        
        conflicts = keybinds.has_conflicts()
        
        # Count unique keys among all 7 keybinds
        all_keys = [move_up, move_down, move_left, move_right, "Space", "KeyE", "Tab"]
        unique_keys = set(all_keys)
        
        # If all keys are unique, no conflicts
        if len(unique_keys) == 7:
            assert len(conflicts) == 0, f"Expected no conflicts but got {conflicts}"
        
        # If there are duplicate keys, conflicts should be detected
        if len(unique_keys) < 7:
            assert len(conflicts) > 0, f"Expected conflicts for duplicates in {all_keys}"

    def test_default_keybinds_no_conflicts(self):
        """
        Default keybinds SHALL have no conflicts.
        **Validates: Requirements 7.4**
        """
        keybinds = Keybinds()
        conflicts = keybinds.has_conflicts()
        assert len(conflicts) == 0, f"Default keybinds have conflicts: {conflicts}"


class TestNotificationPreferencesProperties:
    """Property tests for notification preferences."""

    @given(
        email_enabled=st.booleans(),
        push_enabled=st.booleans(),
        friend_activity=st.booleans(),
        match_updates=st.booleans(),
        marketing_emails=st.booleans(),
    )
    @settings(max_examples=100)
    def test_notification_preferences_preserved(
        self,
        email_enabled: bool,
        push_enabled: bool,
        friend_activity: bool,
        match_updates: bool,
        marketing_emails: bool,
    ):
        """
        *For any* notification preferences, boolean values SHALL be preserved exactly.
        **Validates: Requirements 4.1**
        """
        prefs = NotificationPreferences(
            email_enabled=email_enabled,
            push_enabled=push_enabled,
            friend_activity=friend_activity,
            match_updates=match_updates,
            marketing_emails=marketing_emails,
        )
        
        assert prefs.email_enabled == email_enabled
        assert prefs.push_enabled == push_enabled
        assert prefs.friend_activity == friend_activity
        assert prefs.match_updates == match_updates
        assert prefs.marketing_emails == marketing_emails


class TestUserSettingsProperties:
    """Property tests for composite user settings."""

    def test_default_user_settings_valid(self):
        """
        **Property 11: Settings Initialization**
        Default UserSettings SHALL have all valid default values.
        **Validates: Requirements 2.1, 2.2**
        """
        settings = UserSettings()
        
        # Verify all defaults are valid
        assert 0 <= settings.audio.master <= 100
        assert 0 <= settings.audio.music <= 100
        assert 0 <= settings.audio.sfx <= 100
        assert 0 <= settings.audio.voice <= 100
        
        assert settings.video.quality in VideoQuality
        assert settings.video.fps_limit in [0, 30, 60, 120]
        
        assert settings.accessibility.colorblind_mode in ColorblindMode
        assert 0.8 <= settings.accessibility.font_scale <= 1.5
        
        assert len(settings.keybinds.has_conflicts()) == 0

    @given(
        master=st.integers(min_value=0, max_value=100),
        quality=st.sampled_from(list(VideoQuality)),
        colorblind_mode=st.sampled_from(list(ColorblindMode)),
        font_scale=st.floats(min_value=0.8, max_value=1.5, allow_nan=False, allow_infinity=False),
    )
    @settings(max_examples=100)
    def test_user_settings_composition(
        self,
        master: int,
        quality: VideoQuality,
        colorblind_mode: ColorblindMode,
        font_scale: float,
    ):
        """
        *For any* valid component settings, UserSettings SHALL compose them correctly.
        **Validates: Requirements 2.3**
        """
        user_settings = UserSettings(
            audio=AudioSettings(master=master),
            video=VideoSettings(quality=quality),
            accessibility=AccessibilitySettings(colorblind_mode=colorblind_mode, font_scale=font_scale),
        )
        
        assert user_settings.audio.master == master
        assert user_settings.video.quality == quality
        assert user_settings.accessibility.colorblind_mode == colorblind_mode
        assert abs(user_settings.accessibility.font_scale - font_scale) < 0.01
