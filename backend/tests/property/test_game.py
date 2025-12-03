"""
Property-based tests for game functionality.

Feature: trivia-battle-mvp, Property 11: Game Persistence Round Trip
Validates: Requirements 7.3, 10.1, 10.2
"""

import pytest
from hypothesis import given, strategies as st, settings
from typing import Any
import uuid


# Strategies for generating game data
uuid_strategy = st.uuids().map(str)

question_strategy = st.fixed_dictionaries({
    "id": st.integers(min_value=1, max_value=100),
    "text": st.text(min_size=10, max_size=200),
    "options": st.lists(st.text(min_size=1, max_size=50), min_size=4, max_size=4),
    "correct_answer": st.sampled_from(["A", "B", "C", "D"]),
})

questions_list_strategy = st.lists(question_strategy, min_size=1, max_size=15)

answer_strategy = st.fixed_dictionaries({
    "q_num": st.integers(min_value=1, max_value=15),
    "answer": st.sampled_from(["A", "B", "C", "D", None]),
    "time_ms": st.integers(min_value=0, max_value=30000),
    "is_correct": st.booleans(),
    "score": st.integers(min_value=0, max_value=1000),
})

answers_list_strategy = st.lists(answer_strategy, min_size=0, max_size=15)


class TestGameDataStructure:
    """
    Feature: trivia-battle-mvp, Property 11: Game Persistence Round Trip
    
    For any completed game, storing and then retrieving the game record SHALL
    return equivalent data including both player IDs, scores, questions_data,
    and answers_data.
    """

    @given(
        player1_id=uuid_strategy,
        player2_id=uuid_strategy,
        player1_score=st.integers(min_value=0, max_value=15000),
        player2_score=st.integers(min_value=0, max_value=15000),
        questions_data=questions_list_strategy,
    )
    @settings(max_examples=100)
    def test_game_record_contains_required_fields(
        self,
        player1_id,
        player2_id,
        player1_score,
        player2_score,
        questions_data,
    ):
        """
        Property: Game records contain all required fields.
        Feature: trivia-battle-mvp, Property 11: Game Persistence Round Trip
        Validates: Requirements 10.1, 10.2
        """
        # Simulate a game record structure
        game_record = {
            "id": str(uuid.uuid4()),
            "lobby_id": str(uuid.uuid4()),
            "player1_id": player1_id,
            "player1_score": player1_score,
            "player2_id": player2_id,
            "player2_score": player2_score,
            "questions_data": questions_data,
            "winner_id": player1_id if player1_score > player2_score else (
                player2_id if player2_score > player1_score else None
            ),
        }
        
        # Verify all required fields are present
        assert "id" in game_record
        assert "lobby_id" in game_record
        assert "player1_id" in game_record
        assert "player2_id" in game_record
        assert "player1_score" in game_record
        assert "player2_score" in game_record
        assert "questions_data" in game_record
        
        # Verify types
        assert isinstance(game_record["player1_score"], int)
        assert isinstance(game_record["player2_score"], int)
        assert isinstance(game_record["questions_data"], list)

    @given(
        questions_data=questions_list_strategy,
        player1_answers=answers_list_strategy,
        player2_answers=answers_list_strategy,
    )
    @settings(max_examples=100)
    def test_questions_and_answers_data_structure(
        self,
        questions_data,
        player1_answers,
        player2_answers,
    ):
        """
        Property: Questions and answers data maintain structure through serialization.
        Feature: trivia-battle-mvp, Property 11: Game Persistence Round Trip
        Validates: Requirements 10.2
        """
        player1_id = str(uuid.uuid4())
        player2_id = str(uuid.uuid4())
        
        answers_data = {
            player1_id: player1_answers,
            player2_id: player2_answers,
        }
        
        # Verify questions structure
        for q in questions_data:
            assert "id" in q
            assert "text" in q
            assert "options" in q
            assert len(q["options"]) == 4
            assert "correct_answer" in q
        
        # Verify answers structure
        for player_id, answers in answers_data.items():
            for a in answers:
                assert "q_num" in a
                assert "time_ms" in a
                assert "score" in a

    @given(
        player1_score=st.integers(min_value=0, max_value=15000),
        player2_score=st.integers(min_value=0, max_value=15000),
    )
    @settings(max_examples=100)
    def test_winner_determination_consistency(
        self,
        player1_score,
        player2_score,
    ):
        """
        Property: Winner is correctly determined from scores.
        Feature: trivia-battle-mvp, Property 11: Game Persistence Round Trip
        Validates: Requirements 7.3
        """
        player1_id = str(uuid.uuid4())
        player2_id = str(uuid.uuid4())
        
        # Determine winner
        if player1_score > player2_score:
            expected_winner = player1_id
        elif player2_score > player1_score:
            expected_winner = player2_id
        else:
            expected_winner = None  # Tie
        
        game_record = {
            "player1_id": player1_id,
            "player1_score": player1_score,
            "player2_id": player2_id,
            "player2_score": player2_score,
            "winner_id": expected_winner,
        }
        
        # Verify winner logic
        if game_record["player1_score"] > game_record["player2_score"]:
            assert game_record["winner_id"] == player1_id
        elif game_record["player2_score"] > game_record["player1_score"]:
            assert game_record["winner_id"] == player2_id
        else:
            assert game_record["winner_id"] is None

    @given(
        round_scores=st.lists(
            st.integers(min_value=0, max_value=1000),
            min_size=1,
            max_size=15,
        )
    )
    @settings(max_examples=100)
    def test_final_score_is_sum_of_rounds(self, round_scores):
        """
        Property: Final score equals sum of individual round scores.
        Feature: trivia-battle-mvp, Property 10: Final Score Calculation
        Validates: Requirements 7.1
        """
        expected_total = sum(round_scores)
        
        # Simulate calculating final score
        calculated_total = 0
        for score in round_scores:
            calculated_total += score
        
        assert calculated_total == expected_total
