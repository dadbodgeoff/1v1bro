"""
Property-based tests for Pydantic schemas.

Feature: trivia-battle-mvp, Property 5: Question Structure Completeness
Validates: Requirements 5.2
"""

import pytest
from hypothesis import given, strategies as st, settings, assume
from pydantic import ValidationError

from app.schemas.game import QuestionPublic, Question, PlayerAnswer


class TestQuestionStructureCompleteness:
    """
    Feature: trivia-battle-mvp, Property 5: Question Structure Completeness
    
    For any question delivered to players, it SHALL contain a question number (1-15),
    question text (non-empty string), and exactly 4 answer options.
    """

    @given(
        q_num=st.integers(min_value=1, max_value=15),
        text=st.text(min_size=10, max_size=500),
        options=st.lists(st.text(min_size=1, max_size=100), min_size=4, max_size=4),
    )
    @settings(max_examples=100)
    def test_valid_question_has_required_fields(self, q_num, text, options):
        """
        Property: Valid questions contain q_num, text, and exactly 4 options.
        Feature: trivia-battle-mvp, Property 5: Question Structure Completeness
        Validates: Requirements 5.2
        """
        question = QuestionPublic(q_num=q_num, text=text, options=options)
        
        # Must have question number between 1-15
        assert 1 <= question.q_num <= 15
        
        # Must have non-empty text
        assert len(question.text) > 0
        
        # Must have exactly 4 options
        assert len(question.options) == 4

    @given(q_num=st.integers(max_value=0))
    @settings(max_examples=50)
    def test_question_number_below_1_rejected(self, q_num):
        """
        Property: Question numbers below 1 are rejected.
        Feature: trivia-battle-mvp, Property 5: Question Structure Completeness
        Validates: Requirements 5.2
        """
        with pytest.raises(ValidationError):
            QuestionPublic(q_num=q_num, text="Test question", options=["A", "B", "C", "D"])

    @given(q_num=st.integers(min_value=16, max_value=100))
    @settings(max_examples=50)
    def test_question_number_above_15_rejected(self, q_num):
        """
        Property: Question numbers above 15 are rejected.
        Feature: trivia-battle-mvp, Property 5: Question Structure Completeness
        Validates: Requirements 5.2
        """
        with pytest.raises(ValidationError):
            QuestionPublic(q_num=q_num, text="Test question", options=["A", "B", "C", "D"])

    @given(
        options=st.lists(st.text(min_size=1, max_size=50), min_size=0, max_size=3)
    )
    @settings(max_examples=50)
    def test_fewer_than_4_options_rejected(self, options):
        """
        Property: Questions with fewer than 4 options are rejected.
        Feature: trivia-battle-mvp, Property 5: Question Structure Completeness
        Validates: Requirements 5.2
        """
        assume(len(options) < 4)
        with pytest.raises(ValidationError):
            QuestionPublic(q_num=1, text="Test question", options=options)

    @given(
        options=st.lists(st.text(min_size=1, max_size=50), min_size=5, max_size=10)
    )
    @settings(max_examples=50)
    def test_more_than_4_options_rejected(self, options):
        """
        Property: Questions with more than 4 options are rejected.
        Feature: trivia-battle-mvp, Property 5: Question Structure Completeness
        Validates: Requirements 5.2
        """
        with pytest.raises(ValidationError):
            QuestionPublic(q_num=1, text="Test question", options=options)

    @given(
        q_num=st.integers(min_value=1, max_value=15),
        text=st.text(min_size=10, max_size=200, alphabet=st.characters(whitelist_categories=('L', 'N', 'P', 'S', 'Z'))),
        options=st.lists(st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=('L', 'N', 'P', 'S'))), min_size=4, max_size=4),
        correct_answer=st.sampled_from(["A", "B", "C", "D"]),
    )
    @settings(max_examples=100)
    def test_full_question_schema_valid(self, q_num, text, options, correct_answer):
        """
        Property: Full Question schema (with correct_answer) validates correctly.
        Feature: trivia-battle-mvp, Property 5: Question Structure Completeness
        Validates: Requirements 5.2
        """
        question = Question(
            id=q_num,
            text=text,
            options=options,
            correct_answer=correct_answer,
        )
        
        assert question.id == q_num
        # Text may be stripped of whitespace by schema
        assert len(question.text) > 0
        assert len(question.options) == 4
        assert question.correct_answer in ["A", "B", "C", "D"]


class TestPlayerAnswerSchema:
    """Tests for PlayerAnswer schema validation."""

    @given(
        q_num=st.integers(min_value=1, max_value=15),
        answer=st.sampled_from(["A", "B", "C", "D", None]),
        time_ms=st.integers(min_value=0, max_value=30000),
        score=st.integers(min_value=0, max_value=1000),
    )
    @settings(max_examples=100)
    def test_valid_player_answer(self, q_num, answer, time_ms, score):
        """
        Property: Valid player answers pass validation.
        Feature: trivia-battle-mvp, Property 9: Answer Recording Completeness
        Validates: Requirements 6.1
        """
        player_answer = PlayerAnswer(
            q_num=q_num,
            answer=answer,
            time_ms=time_ms,
            is_correct=answer is not None,
            score=score,
        )
        
        assert player_answer.q_num == q_num
        assert player_answer.time_ms == time_ms
        assert 0 <= player_answer.score <= 1000

    @given(time_ms=st.integers(min_value=30001, max_value=100000))
    @settings(max_examples=50)
    def test_time_ms_above_30000_rejected(self, time_ms):
        """
        Property: Answer time above 30000ms is rejected.
        Feature: trivia-battle-mvp, Property 9: Answer Recording Completeness
        Validates: Requirements 6.1
        """
        with pytest.raises(ValidationError):
            PlayerAnswer(q_num=1, answer="A", time_ms=time_ms, score=0)
