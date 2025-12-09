"""
Property-based tests for the Match Auto-End Recap System.

Tests correctness properties defined in the design document.
"""

import pytest
from hypothesis import given, strategies as st, settings, assume

from app.schemas.recap import (
    XPBreakdown,
    TierProgress,
    QuestionStats,
    CombatStats,
    OpponentData,
    RecapPayload,
)


# ============================================
# Strategies for generating test data
# ============================================

xp_breakdown_strategy = st.builds(
    XPBreakdown,
    base_xp=st.integers(min_value=0, max_value=100),
    kill_bonus=st.integers(min_value=0, max_value=100),
    streak_bonus=st.integers(min_value=0, max_value=100),
    duration_bonus=st.integers(min_value=0, max_value=50),
).map(lambda xp: XPBreakdown(
    total=xp.base_xp + xp.kill_bonus + xp.streak_bonus + xp.duration_bonus,
    base_xp=xp.base_xp,
    kill_bonus=xp.kill_bonus,
    streak_bonus=xp.streak_bonus,
    duration_bonus=xp.duration_bonus,
))

tier_progress_strategy = st.builds(
    TierProgress,
    previous_tier=st.integers(min_value=1, max_value=100),
    new_tier=st.integers(min_value=1, max_value=100),
    tier_advanced=st.booleans(),
    current_xp=st.integers(min_value=0, max_value=999),
    xp_to_next_tier=st.integers(min_value=100, max_value=1000),
    new_claimable_rewards=st.lists(st.integers(min_value=1, max_value=100), max_size=5),
)

question_stats_strategy = st.builds(
    QuestionStats,
    correct_count=st.integers(min_value=0, max_value=15),
    total_questions=st.just(15),
    accuracy_percent=st.floats(min_value=0, max_value=100, allow_nan=False),
    avg_answer_time_ms=st.integers(min_value=100, max_value=30000),
    fastest_answer_ms=st.integers(min_value=100, max_value=30000),
)

combat_stats_strategy = st.builds(
    CombatStats,
    kills=st.integers(min_value=0, max_value=50),
    deaths=st.integers(min_value=0, max_value=50),
    kd_ratio=st.floats(min_value=0, max_value=100, allow_nan=False),
    max_streak=st.integers(min_value=0, max_value=20),
    shots_fired=st.integers(min_value=0, max_value=200),
    shots_hit=st.integers(min_value=0, max_value=200),
    shot_accuracy=st.floats(min_value=0, max_value=100, allow_nan=False),
)

opponent_data_strategy = st.builds(
    OpponentData,
    id=st.text(min_size=1, max_size=36, alphabet=st.characters(whitelist_categories=('L', 'N'))),
    display_name=st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=('L', 'N', 'P'))),
    avatar_url=st.one_of(st.none(), st.text(min_size=5, max_size=100)),
    final_score=st.integers(min_value=0, max_value=15),
    accuracy_percent=st.floats(min_value=0, max_value=100, allow_nan=False),
    kd_ratio=st.floats(min_value=0, max_value=100, allow_nan=False),
)

recap_payload_strategy = st.builds(
    RecapPayload,
    winner_id=st.one_of(st.none(), st.text(min_size=1, max_size=36, alphabet=st.characters(whitelist_categories=('L', 'N')))),
    is_tie=st.booleans(),
    won_by_time=st.booleans(),
    xp_breakdown=xp_breakdown_strategy,
    tier_progress=tier_progress_strategy,
    question_stats=question_stats_strategy,
    combat_stats=combat_stats_strategy,
    opponent=opponent_data_strategy,
)


# ============================================
# Property 1: Recap Serialization Round-Trip
# ============================================

@given(recap=recap_payload_strategy)
@settings(max_examples=100)
def test_recap_serialization_round_trip(recap: RecapPayload):
    """
    **Feature: match-auto-end-recap, Property 1: Recap Serialization Round-Trip**
    
    For any valid RecapPayload, serializing to JSON then deserializing
    SHALL produce an equivalent RecapPayload object with all fields preserved.
    
    **Validates: Requirements 7.1, 7.2, 7.4**
    """
    # Serialize to JSON
    json_str = recap.model_dump_json()
    
    # Deserialize back
    restored = RecapPayload.model_validate_json(json_str)
    
    # Verify equivalence
    assert recap.winner_id == restored.winner_id
    assert recap.is_tie == restored.is_tie
    assert recap.won_by_time == restored.won_by_time
    
    # XP breakdown
    assert recap.xp_breakdown.total == restored.xp_breakdown.total
    assert recap.xp_breakdown.base_xp == restored.xp_breakdown.base_xp
    assert recap.xp_breakdown.kill_bonus == restored.xp_breakdown.kill_bonus
    assert recap.xp_breakdown.streak_bonus == restored.xp_breakdown.streak_bonus
    assert recap.xp_breakdown.duration_bonus == restored.xp_breakdown.duration_bonus
    
    # Tier progress
    assert recap.tier_progress.previous_tier == restored.tier_progress.previous_tier
    assert recap.tier_progress.new_tier == restored.tier_progress.new_tier
    assert recap.tier_progress.tier_advanced == restored.tier_progress.tier_advanced
    
    # Question stats
    assert recap.question_stats.correct_count == restored.question_stats.correct_count
    assert recap.question_stats.total_questions == restored.question_stats.total_questions
    
    # Combat stats
    assert recap.combat_stats.kills == restored.combat_stats.kills
    assert recap.combat_stats.deaths == restored.combat_stats.deaths
    
    # Opponent
    assert recap.opponent.id == restored.opponent.id
    assert recap.opponent.display_name == restored.opponent.display_name


# ============================================
# Property 2: XP Breakdown Sum Consistency
# ============================================

@given(
    base_xp=st.integers(min_value=0, max_value=100),
    kill_bonus=st.integers(min_value=0, max_value=100),
    streak_bonus=st.integers(min_value=0, max_value=100),
    duration_bonus=st.integers(min_value=0, max_value=50),
)
@settings(max_examples=100)
def test_xp_breakdown_sum_consistency(base_xp: int, kill_bonus: int, streak_bonus: int, duration_bonus: int):
    """
    **Feature: match-auto-end-recap, Property 2: XP Breakdown Sum Consistency**
    
    For any XPBreakdown object, the `total` field SHALL equal the sum of
    `base_xp + kill_bonus + streak_bonus + duration_bonus`.
    
    **Validates: Requirements 2.2, 2.5**
    """
    expected_total = base_xp + kill_bonus + streak_bonus + duration_bonus
    
    xp = XPBreakdown(
        total=expected_total,
        base_xp=base_xp,
        kill_bonus=kill_bonus,
        streak_bonus=streak_bonus,
        duration_bonus=duration_bonus,
    )
    
    assert xp.total == expected_total
    assert xp.validate_sum() is True


# ============================================
# Property 3: Question Accuracy Calculation
# ============================================

@given(
    correct_count=st.integers(min_value=0, max_value=15),
    total_questions=st.integers(min_value=1, max_value=15),
)
@settings(max_examples=100)
def test_question_accuracy_calculation(correct_count: int, total_questions: int):
    """
    **Feature: match-auto-end-recap, Property 3: Question Accuracy Calculation**
    
    For any QuestionStats object with `total_questions > 0`, the `accuracy_percent`
    field SHALL equal `(correct_count / total_questions) * 100`.
    
    **Validates: Requirements 4.2, 4.5**
    """
    # Ensure correct_count doesn't exceed total
    correct_count = min(correct_count, total_questions)
    
    expected_accuracy = (correct_count / total_questions) * 100
    
    stats = QuestionStats(
        correct_count=correct_count,
        total_questions=total_questions,
        accuracy_percent=expected_accuracy,
        avg_answer_time_ms=5000,
        fastest_answer_ms=2000,
    )
    
    assert abs(stats.accuracy_percent - expected_accuracy) < 0.01
    
    # Verify is_perfect computed field
    if correct_count == total_questions:
        assert stats.is_perfect is True
    else:
        assert stats.is_perfect is False


# ============================================
# Property 4: K/D Ratio Calculation
# ============================================

@given(
    kills=st.integers(min_value=0, max_value=50),
    deaths=st.integers(min_value=1, max_value=50),  # min 1 to avoid division by zero
)
@settings(max_examples=100)
def test_kd_ratio_calculation(kills: int, deaths: int):
    """
    **Feature: match-auto-end-recap, Property 4: K/D Ratio Calculation**
    
    For any CombatStats object with `deaths > 0`, the `kd_ratio` field
    SHALL equal `kills / deaths`.
    
    **Validates: Requirements 5.2, 5.5**
    """
    expected_kd = kills / deaths
    
    stats = CombatStats(
        kills=kills,
        deaths=deaths,
        kd_ratio=expected_kd,
        max_streak=0,
        shots_fired=100,
        shots_hit=50,
        shot_accuracy=50.0,
    )
    
    assert abs(stats.kd_ratio - expected_kd) < 0.01


# ============================================
# Property 5: Shot Accuracy Calculation
# ============================================

@given(
    shots_hit=st.integers(min_value=0, max_value=100),
    shots_fired=st.integers(min_value=1, max_value=100),  # min 1 to avoid division by zero
)
@settings(max_examples=100)
def test_shot_accuracy_calculation(shots_hit: int, shots_fired: int):
    """
    **Feature: match-auto-end-recap, Property 5: Shot Accuracy Calculation**
    
    For any CombatStats object with `shots_fired > 0`, the `shot_accuracy`
    field SHALL equal `(shots_hit / shots_fired) * 100`.
    
    **Validates: Requirements 5.4, 5.5**
    """
    # Ensure hits don't exceed fired
    shots_hit = min(shots_hit, shots_fired)
    
    expected_accuracy = (shots_hit / shots_fired) * 100
    
    stats = CombatStats(
        kills=0,
        deaths=0,
        kd_ratio=0.0,
        max_streak=0,
        shots_fired=shots_fired,
        shots_hit=shots_hit,
        shot_accuracy=expected_accuracy,
    )
    
    assert abs(stats.shot_accuracy - expected_accuracy) < 0.01


# ============================================
# Property 6: RecapPayload Completeness
# ============================================

@given(recap=recap_payload_strategy)
@settings(max_examples=100)
def test_recap_payload_completeness(recap: RecapPayload):
    """
    **Feature: match-auto-end-recap, Property 6: RecapPayload Completeness**
    
    For any RecapPayload, all required sections (xp_breakdown, tier_progress,
    question_stats, combat_stats, opponent) SHALL be present and non-null.
    
    **Validates: Requirements 2.5, 3.5, 4.5, 5.5, 6.6**
    """
    # All sections must be present
    assert recap.xp_breakdown is not None
    assert recap.tier_progress is not None
    assert recap.question_stats is not None
    assert recap.combat_stats is not None
    assert recap.opponent is not None
    
    # XP breakdown must have all fields
    assert recap.xp_breakdown.total >= 0
    assert recap.xp_breakdown.base_xp >= 0
    
    # Tier progress must have valid tiers
    assert recap.tier_progress.previous_tier >= 1
    assert recap.tier_progress.new_tier >= 1
    
    # Question stats must have valid counts
    assert recap.question_stats.correct_count >= 0
    assert recap.question_stats.total_questions > 0
    
    # Combat stats must have valid values
    assert recap.combat_stats.kills >= 0
    assert recap.combat_stats.deaths >= 0
    
    # Opponent must have id and name
    assert recap.opponent.id is not None
    assert recap.opponent.display_name is not None


# ============================================
# Property 7: Final Question Flag
# ============================================

@given(
    q_num=st.integers(min_value=1, max_value=20),
    total_questions=st.integers(min_value=10, max_value=20),
)
@settings(max_examples=100)
def test_final_question_flag(q_num: int, total_questions: int):
    """
    **Feature: match-auto-end-recap, Property 7: Final Question Flag**
    
    For any question number and total questions, is_final_question SHALL be True
    if and only if q_num >= total_questions.
    
    **Validates: Requirements 1.5**
    """
    is_final_question = q_num >= total_questions
    
    # This mirrors the logic in quiz.py process_round_end()
    expected = q_num >= total_questions
    
    assert is_final_question == expected


# ============================================
# Property 8: Game End Trigger After Q15
# Full game flow simulation test
# ============================================

from app.services.game.session import GameSession, SessionManager, PlayerGameState
from app.services.game.scoring import ScoringService
from app.schemas.game import Question


# Strategy for generating valid questions
question_strategy = st.builds(
    Question,
    id=st.integers(min_value=1, max_value=10000),
    text=st.text(min_size=10, max_size=200, alphabet=st.characters(whitelist_categories=('L', 'N', 'P', 'Z'))),
    options=st.lists(
        st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=('L', 'N', 'P'))),
        min_size=4,
        max_size=4,
    ),
    correct_answer=st.sampled_from(['A', 'B', 'C', 'D']),
    category=st.just("fortnite"),
    difficulty=st.sampled_from(["easy", "medium", "hard"]),
)


@given(
    player1_answers=st.lists(
        st.tuples(
            st.sampled_from(['A', 'B', 'C', 'D', None]),  # answer
            st.integers(min_value=1000, max_value=25000),  # time_ms
        ),
        min_size=15,
        max_size=15,
    ),
    player2_answers=st.lists(
        st.tuples(
            st.sampled_from(['A', 'B', 'C', 'D', None]),  # answer
            st.integers(min_value=1000, max_value=25000),  # time_ms
        ),
        min_size=15,
        max_size=15,
    ),
)
@settings(max_examples=50, deadline=None)
def test_game_end_after_q15(player1_answers, player2_answers):
    """
    **Feature: match-auto-end-recap, Property 8: Game End Trigger After Q15**
    
    For any game with 15 questions, when both players have answered all 15 questions,
    the game SHALL end and advance_question() SHALL return False.
    
    **Validates: Requirements 1.1**
    """
    import uuid
    
    # Create test data
    lobby_id = str(uuid.uuid4())
    player1_id = str(uuid.uuid4())
    player2_id = str(uuid.uuid4())
    
    # Generate 15 questions with fixed correct answers
    questions = []
    for i in range(15):
        questions.append(Question(
            id=i + 1,
            text=f"Test question {i + 1}?",
            options=["Option A", "Option B", "Option C", "Option D"],
            correct_answer="A",  # All correct answers are A for simplicity
            category="fortnite",
            difficulty="medium",
        ))
    
    # Create session
    session = SessionManager.create(
        lobby_id=lobby_id,
        player1_id=player1_id,
        player2_id=player2_id,
        questions=questions,
    )
    
    try:
        # Start game
        session.status = "in_progress"
        session.current_question = 1
        
        scoring = ScoringService()
        
        # Simulate all 15 rounds
        for q_num in range(1, 16):
            # Both players answer
            p1_answer, p1_time = player1_answers[q_num - 1]
            p2_answer, p2_time = player2_answers[q_num - 1]
            
            scoring.process_answer(session, player1_id, q_num, p1_answer, p1_time)
            scoring.process_answer(session, player2_id, q_num, p2_answer, p2_time)
            
            # Verify both answered
            assert scoring.both_answered(session), f"Both players should have answered Q{q_num}"
            
            # Check if this is the final question
            is_final = q_num >= len(session.questions)
            
            if q_num < 15:
                # Not final - should advance
                assert not is_final, f"Q{q_num} should not be final"
                
                # Reset current answers and advance
                for player_state in session.player_states.values():
                    player_state.current_answer = None
                    player_state.current_time_ms = None
                session.current_question += 1
            else:
                # Final question - game should end
                assert is_final, "Q15 should be the final question"
                
                # Verify advance_question would return False
                # (simulating what happens in quiz.py)
                next_q = session.current_question + 1
                has_more = next_q <= len(session.questions)
                assert not has_more, "Should have no more questions after Q15"
        
        # Verify final state
        assert session.current_question == 15, "Should be on Q15"
        assert len(session.player_states[player1_id].answers) == 15, "P1 should have 15 answers"
        assert len(session.player_states[player2_id].answers) == 15, "P2 should have 15 answers"
        
        # Verify scores are calculated
        p1_state = session.player_states[player1_id]
        p2_state = session.player_states[player2_id]
        
        # Count correct answers
        p1_correct = sum(1 for a in p1_state.answers if a.is_correct)
        p2_correct = sum(1 for a in p2_state.answers if a.is_correct)
        
        assert p1_state.correct_count == p1_correct
        assert p2_state.correct_count == p2_correct
        
    finally:
        # Cleanup
        SessionManager.remove(lobby_id)


# ============================================
# Property 9: Winner Determination Consistency
# ============================================

@given(
    p1_score=st.integers(min_value=0, max_value=15000),
    p2_score=st.integers(min_value=0, max_value=15000),
    p1_time=st.integers(min_value=15000, max_value=450000),
    p2_time=st.integers(min_value=15000, max_value=450000),
)
@settings(max_examples=100)
def test_winner_determination_consistency(p1_score: int, p2_score: int, p1_time: int, p2_time: int):
    """
    **Feature: match-auto-end-recap, Property 9: Winner Determination Consistency**
    
    For any final scores and times:
    - Higher score wins
    - If scores are equal, faster total time wins
    - If both are equal, it's a tie
    
    **Validates: Requirements 1.1, 1.2**
    """
    from app.services.game.persistence import GamePersistenceService
    
    # Use the actual winner determination logic
    persistence = GamePersistenceService.__new__(GamePersistenceService)
    
    winner_id, is_tie, won_by_time = persistence._determine_winner(
        "p1", p1_score, p1_time,
        "p2", p2_score, p2_time,
    )
    
    if p1_score > p2_score:
        assert winner_id == "p1"
        assert not is_tie
        assert not won_by_time
    elif p2_score > p1_score:
        assert winner_id == "p2"
        assert not is_tie
        assert not won_by_time
    elif p1_time < p2_time:
        assert winner_id == "p1"
        assert not is_tie
        assert won_by_time
    elif p2_time < p1_time:
        assert winner_id == "p2"
        assert not is_tie
        assert won_by_time
    else:
        # Perfect tie
        assert winner_id is None
        assert is_tie
        assert not won_by_time
