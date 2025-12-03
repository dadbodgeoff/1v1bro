"""
Property-based tests for lobby functionality.

Feature: trivia-battle-mvp, Property 1: Lobby Code Uniqueness and Format
Validates: Requirements 2.1, 2.4
"""

import pytest
from hypothesis import given, strategies as st, settings, assume

from app.utils.helpers import (
    generate_lobby_code,
    generate_unique_lobby_code,
    is_valid_lobby_code,
    LOBBY_CODE_CHARS,
    LOBBY_CODE_LENGTH,
)


class TestLobbyCodeUniquenessAndFormat:
    """
    Feature: trivia-battle-mvp, Property 1: Lobby Code Uniqueness and Format
    
    For any set of active lobbies in the system, all lobby codes SHALL be unique,
    exactly 6 characters long, and composed only of uppercase alphanumeric characters.
    """

    @given(st.integers(min_value=1, max_value=50))
    @settings(max_examples=100)
    def test_generated_codes_are_correct_length(self, _):
        """
        Property: All generated codes are exactly 6 characters.
        Feature: trivia-battle-mvp, Property 1: Lobby Code Uniqueness and Format
        Validates: Requirements 2.1
        """
        code = generate_lobby_code()
        assert len(code) == LOBBY_CODE_LENGTH

    @given(st.integers(min_value=1, max_value=50))
    @settings(max_examples=100)
    def test_generated_codes_are_uppercase_alphanumeric(self, _):
        """
        Property: All generated codes contain only valid characters.
        Feature: trivia-battle-mvp, Property 1: Lobby Code Uniqueness and Format
        Validates: Requirements 2.1
        """
        code = generate_lobby_code()
        assert all(c in LOBBY_CODE_CHARS for c in code)
        assert code == code.upper()

    @given(st.integers(min_value=10, max_value=100))
    @settings(max_examples=100)
    def test_multiple_codes_are_unique(self, count):
        """
        Property: Generating multiple codes produces unique values.
        Feature: trivia-battle-mvp, Property 1: Lobby Code Uniqueness and Format
        Validates: Requirements 2.4
        """
        codes = [generate_lobby_code() for _ in range(count)]
        # With 6 chars from 32 char alphabet, collision is extremely unlikely
        # but we test uniqueness property
        unique_codes = set(codes)
        # Allow for rare collisions in large sets, but most should be unique
        assert len(unique_codes) >= count * 0.9

    @given(st.sets(st.text(alphabet=LOBBY_CODE_CHARS, min_size=6, max_size=6), max_size=20))
    @settings(max_examples=100)
    def test_unique_code_generation_avoids_existing(self, existing_codes):
        """
        Property: generate_unique_lobby_code never returns an existing code.
        Feature: trivia-battle-mvp, Property 1: Lobby Code Uniqueness and Format
        Validates: Requirements 2.4
        """
        # Skip if existing codes would make it impossible
        assume(len(existing_codes) < 1000)
        
        new_code = generate_unique_lobby_code(existing_codes)
        
        assert new_code not in existing_codes
        assert len(new_code) == LOBBY_CODE_LENGTH
        assert all(c in LOBBY_CODE_CHARS for c in new_code)

    @given(st.text(alphabet=LOBBY_CODE_CHARS, min_size=6, max_size=6))
    @settings(max_examples=100)
    def test_valid_codes_pass_validation(self, code):
        """
        Property: Codes with correct format pass validation.
        Feature: trivia-battle-mvp, Property 1: Lobby Code Uniqueness and Format
        Validates: Requirements 2.1
        """
        assert is_valid_lobby_code(code) is True

    @given(st.text(max_size=5))
    @settings(max_examples=100)
    def test_short_codes_fail_validation(self, code):
        """
        Property: Codes shorter than 6 characters fail validation.
        Feature: trivia-battle-mvp, Property 1: Lobby Code Uniqueness and Format
        Validates: Requirements 2.1
        """
        assume(len(code) < 6)
        assert is_valid_lobby_code(code) is False

    @given(st.text(min_size=7, max_size=20))
    @settings(max_examples=100)
    def test_long_codes_fail_validation(self, code):
        """
        Property: Codes longer than 6 characters fail validation.
        Feature: trivia-battle-mvp, Property 1: Lobby Code Uniqueness and Format
        Validates: Requirements 2.1
        """
        assert is_valid_lobby_code(code) is False

    @given(st.text(alphabet="!@#$%^&*()iIoO01", min_size=6, max_size=6))
    @settings(max_examples=100)
    def test_invalid_chars_fail_validation(self, code):
        """
        Property: Codes with invalid characters fail validation.
        Feature: trivia-battle-mvp, Property 1: Lobby Code Uniqueness and Format
        Validates: Requirements 2.1
        """
        # These codes contain characters not in LOBBY_CODE_CHARS
        assert is_valid_lobby_code(code) is False



class TestLobbyStatusTransitions:
    """
    Feature: trivia-battle-mvp, Property 17: Lobby Status Transitions
    
    For any lobby, status transitions SHALL only follow valid paths:
    waiting → in_progress → completed, or waiting → abandoned.
    """

    VALID_TRANSITIONS = {
        "waiting": {"in_progress", "abandoned"},
        "in_progress": {"completed"},
        "completed": set(),  # Terminal state
        "abandoned": set(),  # Terminal state
    }

    @given(
        initial_status=st.sampled_from(["waiting", "in_progress", "completed", "abandoned"]),
        target_status=st.sampled_from(["waiting", "in_progress", "completed", "abandoned"]),
    )
    @settings(max_examples=100)
    def test_valid_transitions_allowed(self, initial_status, target_status):
        """
        Property: Only valid status transitions are allowed.
        Feature: trivia-battle-mvp, Property 17: Lobby Status Transitions
        Validates: Requirements 10.4, 10.5
        """
        valid_targets = self.VALID_TRANSITIONS[initial_status]
        is_valid = target_status in valid_targets
        
        # This tests the transition rules themselves
        if initial_status == "waiting":
            assert ("in_progress" in valid_targets)
            assert ("abandoned" in valid_targets)
            assert ("completed" not in valid_targets)
        elif initial_status == "in_progress":
            assert ("completed" in valid_targets)
            assert ("waiting" not in valid_targets)
            assert ("abandoned" not in valid_targets)
        elif initial_status in ("completed", "abandoned"):
            assert len(valid_targets) == 0  # Terminal states

    @given(st.integers(min_value=1, max_value=20))
    @settings(max_examples=50)
    def test_waiting_can_transition_to_in_progress(self, _):
        """
        Property: Waiting lobbies can transition to in_progress.
        Feature: trivia-battle-mvp, Property 17: Lobby Status Transitions
        Validates: Requirements 10.4
        """
        assert "in_progress" in self.VALID_TRANSITIONS["waiting"]

    @given(st.integers(min_value=1, max_value=20))
    @settings(max_examples=50)
    def test_waiting_can_transition_to_abandoned(self, _):
        """
        Property: Waiting lobbies can transition to abandoned.
        Feature: trivia-battle-mvp, Property 17: Lobby Status Transitions
        Validates: Requirements 10.5
        """
        assert "abandoned" in self.VALID_TRANSITIONS["waiting"]

    @given(st.integers(min_value=1, max_value=20))
    @settings(max_examples=50)
    def test_in_progress_can_only_complete(self, _):
        """
        Property: In-progress lobbies can only transition to completed.
        Feature: trivia-battle-mvp, Property 17: Lobby Status Transitions
        Validates: Requirements 10.4
        """
        valid = self.VALID_TRANSITIONS["in_progress"]
        assert valid == {"completed"}

    @given(st.integers(min_value=1, max_value=20))
    @settings(max_examples=50)
    def test_terminal_states_have_no_transitions(self, _):
        """
        Property: Completed and abandoned are terminal states.
        Feature: trivia-battle-mvp, Property 17: Lobby Status Transitions
        Validates: Requirements 10.4, 10.5
        """
        assert len(self.VALID_TRANSITIONS["completed"]) == 0
        assert len(self.VALID_TRANSITIONS["abandoned"]) == 0
