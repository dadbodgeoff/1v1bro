"""
Property-based tests for WebSocket message format.

Feature: trivia-battle-mvp, Property 13: WebSocket Message Format
Validates: Requirements 8.5
"""

import json
import pytest
from hypothesis import given, strategies as st, settings

from app.schemas.ws_messages import (
    WSEventType,
    WSMessage,
    QuestionPayload,
    AnswerPayload,
    RoundResultPayload,
    GameEndPayload,
)


# Strategies
event_types = st.sampled_from(list(WSEventType))
simple_payload = st.one_of(
    st.none(),
    st.dictionaries(st.text(min_size=1, max_size=20), st.integers(), max_size=5),
)


class TestWebSocketMessageFormat:
    """
    Feature: trivia-battle-mvp, Property 13: WebSocket Message Format
    
    For any WebSocket message sent by the server, it SHALL be valid JSON
    with a "type" field (string) and optional "payload" field.
    """

    @given(event_type=event_types, payload=simple_payload)
    @settings(max_examples=100)
    def test_ws_message_has_type_field(self, event_type, payload):
        """
        Property: All WS messages have a type field.
        Feature: trivia-battle-mvp, Property 13: WebSocket Message Format
        Validates: Requirements 8.5
        """
        message = WSMessage(type=event_type, payload=payload)
        
        # Must have type field
        assert message.type is not None
        assert isinstance(message.type, WSEventType)

    @given(event_type=event_types, payload=simple_payload)
    @settings(max_examples=100)
    def test_ws_message_serializes_to_valid_json(self, event_type, payload):
        """
        Property: All WS messages serialize to valid JSON.
        Feature: trivia-battle-mvp, Property 13: WebSocket Message Format
        Validates: Requirements 8.5
        """
        message = WSMessage(type=event_type, payload=payload)
        
        # Should serialize to valid JSON
        json_str = message.model_dump_json()
        parsed = json.loads(json_str)
        
        # Must have type field in JSON
        assert "type" in parsed
        assert isinstance(parsed["type"], str)

    @given(
        q_num=st.integers(min_value=1, max_value=15),
        text=st.text(min_size=5, max_size=200),
        options=st.lists(st.text(min_size=1, max_size=50), min_size=4, max_size=4),
        start_time=st.integers(min_value=0, max_value=2000000000000),
    )
    @settings(max_examples=100)
    def test_question_payload_structure(self, q_num, text, options, start_time):
        """
        Property: Question payloads have required structure.
        Feature: trivia-battle-mvp, Property 13: WebSocket Message Format
        Validates: Requirements 8.5
        """
        payload = QuestionPayload(
            q_num=q_num,
            text=text,
            options=options,
            start_time=start_time,
        )
        
        assert payload.q_num == q_num
        assert len(payload.options) == 4
        assert payload.start_time == start_time

    @given(
        q_num=st.integers(min_value=1, max_value=15),
        answer=st.sampled_from(["A", "B", "C", "D"]),
        time_ms=st.integers(min_value=0, max_value=30000),
    )
    @settings(max_examples=100)
    def test_answer_payload_structure(self, q_num, answer, time_ms):
        """
        Property: Answer payloads have required structure.
        Feature: trivia-battle-mvp, Property 13: WebSocket Message Format
        Validates: Requirements 8.5
        """
        payload = AnswerPayload(q_num=q_num, answer=answer, time_ms=time_ms)
        
        assert payload.q_num == q_num
        assert payload.answer in ["A", "B", "C", "D"]
        assert 0 <= payload.time_ms <= 30000

    @given(
        player1_score=st.integers(min_value=0, max_value=15000),
        player2_score=st.integers(min_value=0, max_value=15000),
    )
    @settings(max_examples=100)
    def test_game_end_payload_structure(self, player1_score, player2_score):
        """
        Property: Game end payloads have required structure.
        Feature: trivia-battle-mvp, Property 13: WebSocket Message Format
        Validates: Requirements 8.5
        """
        player1_id = "player1-uuid"
        player2_id = "player2-uuid"
        
        winner_id = None
        is_tie = False
        if player1_score > player2_score:
            winner_id = player1_id
        elif player2_score > player1_score:
            winner_id = player2_id
        else:
            is_tie = True
        
        payload = GameEndPayload(
            winner_id=winner_id,
            final_scores={player1_id: player1_score, player2_id: player2_score},
            is_tie=is_tie,
        )
        
        assert "final_scores" in payload.model_dump()
        assert len(payload.final_scores) == 2
        if is_tie:
            assert payload.winner_id is None
            assert payload.is_tie is True

    @given(event_type=event_types)
    @settings(max_examples=100)
    def test_all_event_types_are_valid_strings(self, event_type):
        """
        Property: All event types are valid string values.
        Feature: trivia-battle-mvp, Property 13: WebSocket Message Format
        Validates: Requirements 8.5
        """
        assert isinstance(event_type.value, str)
        assert len(event_type.value) > 0
        
        # Should be able to create message with any event type
        message = WSMessage(type=event_type)
        assert message.type == event_type
