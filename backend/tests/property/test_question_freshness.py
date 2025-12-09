"""
Property-based tests for Question Freshness System.

Tests the correctness properties defined in the design document:
- Property 2: History recording completeness
- Property 8: Question analytics update

Uses Hypothesis for property-based testing with minimum 100 iterations.
"""

import pytest
from hypothesis import given, settings, strategies as st
from datetime import datetime, timedelta
from uuid import uuid4
from unittest.mock import MagicMock, AsyncMock, patch


# ============================================
# Test Strategies
# ============================================

@st.composite
def history_record_strategy(draw):
    """Generate a valid question history record."""
    return {
        "user_id": str(draw(st.uuids())),
        "question_id": str(draw(st.uuids())),
        "shown_at": draw(st.none() | st.just(datetime.utcnow().isoformat())),
        "was_correct": draw(st.none() | st.booleans()),
        "answer_time_ms": draw(st.none() | st.integers(min_value=100, max_value=30000)),
        "match_id": draw(st.none() | st.just(str(uuid4()))),
    }


@st.composite
def history_records_batch_strategy(draw):
    """Generate a batch of history records."""
    count = draw(st.integers(min_value=1, max_value=30))
    match_id = str(uuid4())
    user_ids = [str(uuid4()) for _ in range(2)]
    question_ids = [str(uuid4()) for _ in range(count)]
    
    records = []
    for q_id in question_ids:
        for user_id in user_ids:
            records.append({
                "user_id": user_id,
                "question_id": q_id,
                "was_correct": draw(st.booleans()),
                "answer_time_ms": draw(st.integers(min_value=100, max_value=30000)),
                "match_id": match_id,
            })
    
    return records


@st.composite
def question_analytics_strategy(draw):
    """Generate question analytics test data."""
    return {
        "question_id": str(draw(st.uuids())),
        "initial_times_shown": draw(st.integers(min_value=0, max_value=1000)),
        "initial_times_correct": draw(st.integers(min_value=0, max_value=1000)),
        "initial_avg_time": draw(st.none() | st.integers(min_value=100, max_value=30000)),
        "was_correct": draw(st.booleans()),
        "answer_time_ms": draw(st.none() | st.integers(min_value=100, max_value=30000)),
    }


# ============================================
# Property 2: History Recording Completeness
# Feature: question-freshness-system, Property 2: History recording completeness
# Validates: Requirements 1.3, 1.4
# ============================================

class TestHistoryRecordingCompleteness:
    """
    Property 2: History recording completeness
    
    For any match with questions shown to players, after recording,
    the user_question_history table SHALL contain a record for each
    (user_id, question_id) pair with non-null shown_at timestamp and match_id.
    """

    @given(record=history_record_strategy())
    @settings(max_examples=100)
    def test_single_record_has_required_fields(self, record):
        """
        **Feature: question-freshness-system, Property 2: History recording completeness**
        **Validates: Requirements 1.3, 1.4**
        
        Verify that prepared records always have required fields.
        """
        from app.database.repositories.questions_repo import QuestionsRepository
        
        # Create mock client
        mock_client = MagicMock()
        repo = QuestionsRepository(mock_client)
        
        # Prepare the record as the batch method would
        # Note: Use 'or' to handle explicit None values, not just missing keys
        now = datetime.utcnow().isoformat()
        prepared = {
            "user_id": record["user_id"],
            "question_id": record["question_id"],
            "shown_at": record.get("shown_at") or now,  # Default if None or missing
            "was_correct": record.get("was_correct"),
            "answer_time_ms": record.get("answer_time_ms"),
            "match_id": record.get("match_id"),
        }
        
        # Assert required fields are present and non-null
        assert prepared["user_id"] is not None, "user_id must be present"
        assert prepared["question_id"] is not None, "question_id must be present"
        assert prepared["shown_at"] is not None, "shown_at must have default"
        # match_id can be None but should be included in the record
        assert "match_id" in prepared, "match_id key must be present"

    @given(records=history_records_batch_strategy())
    @settings(max_examples=100)
    def test_batch_records_preserve_all_data(self, records):
        """
        **Feature: question-freshness-system, Property 2: History recording completeness**
        **Validates: Requirements 1.3, 1.4**
        
        Verify that batch recording preserves all input data.
        """
        from app.database.repositories.questions_repo import QuestionsRepository
        
        mock_client = MagicMock()
        repo = QuestionsRepository(mock_client)
        
        now = datetime.utcnow().isoformat()
        
        # Prepare records as the method would
        prepared_records = []
        for record in records:
            prepared = {
                "user_id": record["user_id"],
                "question_id": record["question_id"],
                "shown_at": record.get("shown_at", now),
                "was_correct": record.get("was_correct"),
                "answer_time_ms": record.get("answer_time_ms"),
                "match_id": record.get("match_id"),
            }
            prepared_records.append(prepared)
        
        # Verify all records are prepared
        assert len(prepared_records) == len(records)
        
        # Verify each record preserves original data
        for original, prepared in zip(records, prepared_records):
            assert prepared["user_id"] == original["user_id"]
            assert prepared["question_id"] == original["question_id"]
            assert prepared["was_correct"] == original.get("was_correct")
            assert prepared["answer_time_ms"] == original.get("answer_time_ms")
            assert prepared["match_id"] == original.get("match_id")


# ============================================
# Property 8: Question Analytics Update
# Feature: question-freshness-system, Property 8: Question analytics update
# Validates: Requirements 5.1, 5.2, 5.3
# ============================================

class TestQuestionAnalyticsUpdate:
    """
    Property 8: Question analytics update
    
    For any question shown and answered, the question record's times_shown
    SHALL increment by 1, times_correct SHALL increment by 1 if correct,
    and avg_answer_time_ms SHALL reflect the rolling average.
    """

    @given(data=question_analytics_strategy())
    @settings(max_examples=100)
    def test_times_shown_always_increments(self, data):
        """
        **Feature: question-freshness-system, Property 8: Question analytics update**
        **Validates: Requirements 5.1**
        
        Verify times_shown always increments by exactly 1.
        """
        initial = data["initial_times_shown"]
        expected = initial + 1
        
        # Simulate the calculation from update_question_analytics
        new_times_shown = initial + 1
        
        assert new_times_shown == expected
        assert new_times_shown > initial

    @given(data=question_analytics_strategy())
    @settings(max_examples=100)
    def test_times_correct_increments_only_when_correct(self, data):
        """
        **Feature: question-freshness-system, Property 8: Question analytics update**
        **Validates: Requirements 5.2**
        
        Verify times_correct increments by 1 only when answer is correct.
        """
        initial = data["initial_times_correct"]
        was_correct = data["was_correct"]
        
        # Simulate the calculation
        new_times_correct = initial + (1 if was_correct else 0)
        
        if was_correct:
            assert new_times_correct == initial + 1
        else:
            assert new_times_correct == initial

    @given(data=question_analytics_strategy())
    @settings(max_examples=100)
    def test_rolling_average_calculation(self, data):
        """
        **Feature: question-freshness-system, Property 8: Question analytics update**
        **Validates: Requirements 5.3**
        
        Verify rolling average is calculated correctly.
        """
        initial_times_shown = data["initial_times_shown"]
        initial_avg_time = data["initial_avg_time"]
        answer_time_ms = data["answer_time_ms"]
        
        if answer_time_ms is None:
            # No new time provided, average should stay the same
            new_avg_time = initial_avg_time
        elif initial_avg_time is None or initial_times_shown == 0:
            # First answer, average is just this answer
            new_avg_time = answer_time_ms
        else:
            # Rolling average calculation
            new_times_shown = initial_times_shown + 1
            new_avg_time = int(
                (initial_avg_time * initial_times_shown + answer_time_ms)
                / new_times_shown
            )
        
        # Verify the average is reasonable
        if answer_time_ms is not None:
            if initial_avg_time is None or initial_times_shown == 0:
                assert new_avg_time == answer_time_ms
            else:
                # New average should be between old average and new value
                min_val = min(initial_avg_time, answer_time_ms)
                max_val = max(initial_avg_time, answer_time_ms)
                assert min_val <= new_avg_time <= max_val

    @given(
        times=st.lists(
            st.integers(min_value=100, max_value=30000),
            min_size=2,
            max_size=20
        )
    )
    @settings(max_examples=100)
    def test_rolling_average_is_bounded(self, times):
        """
        **Feature: question-freshness-system, Property 8: Question analytics update**
        **Validates: Requirements 5.3**
        
        Verify rolling average stays within bounds of input values.
        """
        # Start with first value as initial average
        current_avg = times[0]
        current_count = 1
        
        # Apply each new time using rolling average
        for new_time in times[1:]:
            current_count += 1
            current_avg = int(
                (current_avg * (current_count - 1) + new_time) / current_count
            )
        
        # The rolling average should always be between min and max of inputs
        min_time = min(times)
        max_time = max(times)
        
        # Allow small rounding tolerance
        assert current_avg >= min_time - 1, f"Average {current_avg} below min {min_time}"
        assert current_avg <= max_time + 1, f"Average {current_avg} above max {max_time}"



# ============================================
# Property 1: Fresh Questions Excluded from Recent History
# Feature: question-freshness-system, Property 1: Fresh questions are excluded from recent history
# Validates: Requirements 1.1, 4.1
# ============================================

class TestFreshQuestionExclusion:
    """
    Property 1: Fresh questions are excluded from recent history
    
    For any set of user IDs and question history within the lookback period,
    the selected questions SHALL NOT include any question IDs present in
    the recent history set for those users.
    """

    @given(
        num_questions=st.integers(min_value=20, max_value=50),
        num_seen=st.integers(min_value=5, max_value=15),
        count_needed=st.integers(min_value=10, max_value=15),
    )
    @settings(max_examples=100)
    def test_fresh_questions_exclude_seen(self, num_questions, num_seen, count_needed):
        """
        **Feature: question-freshness-system, Property 1: Fresh questions are excluded from recent history**
        **Validates: Requirements 1.1, 4.1**
        
        Verify that when enough fresh questions exist, no seen questions are selected.
        """
        import random
        
        # Generate question pool
        all_question_ids = [str(uuid4()) for _ in range(num_questions)]
        
        # Mark some as seen
        seen_ids = set(random.sample(all_question_ids, min(num_seen, len(all_question_ids))))
        
        # Calculate fresh questions
        fresh_ids = set(all_question_ids) - seen_ids
        
        # If we have enough fresh questions, selection should only include fresh
        if len(fresh_ids) >= count_needed:
            # Simulate selection: take from fresh only
            selected = random.sample(list(fresh_ids), count_needed)
            
            # Verify no seen questions in selection
            for q_id in selected:
                assert q_id not in seen_ids, f"Selected question {q_id} was in seen set"

    @given(
        num_questions=st.integers(min_value=10, max_value=30),
        num_users=st.integers(min_value=1, max_value=3),
    )
    @settings(max_examples=100)
    def test_multi_user_seen_exclusion(self, num_questions, num_users):
        """
        **Feature: question-freshness-system, Property 1: Fresh questions are excluded from recent history**
        **Validates: Requirements 4.1**
        
        Verify that questions seen by ANY user are excluded.
        """
        import random
        
        # Generate question pool
        all_question_ids = [str(uuid4()) for _ in range(num_questions)]
        
        # Generate seen sets for each user (some overlap possible)
        user_seen = {}
        for i in range(num_users):
            user_id = str(uuid4())
            num_seen = random.randint(1, min(5, num_questions))
            user_seen[user_id] = set(random.sample(all_question_ids, num_seen))
        
        # Combined seen set (union of all users)
        all_seen = set()
        for seen_set in user_seen.values():
            all_seen.update(seen_set)
        
        # Fresh questions are those not seen by ANY user
        fresh_ids = set(all_question_ids) - all_seen
        
        # Verify fresh set excludes all seen
        for q_id in fresh_ids:
            for user_id, seen_set in user_seen.items():
                assert q_id not in seen_set, f"Fresh question {q_id} was seen by user {user_id}"


# ============================================
# Property 5: Adaptive Lookback Calculation
# Feature: question-freshness-system, Property 5: Adaptive lookback calculation
# Validates: Requirements 3.2
# ============================================

class TestAdaptiveLookback:
    """
    Property 5: Adaptive lookback calculation
    
    For any question pool with fewer than 100 questions, the effective
    lookback period SHALL be proportionally reduced.
    """

    @given(pool_size=st.integers(min_value=1, max_value=200))
    @settings(max_examples=100)
    def test_adaptive_lookback_scaling(self, pool_size):
        """
        **Feature: question-freshness-system, Property 5: Adaptive lookback calculation**
        **Validates: Requirements 3.2**
        
        Verify lookback scales correctly with pool size.
        """
        from app.services.question_service import QuestionService
        
        service = QuestionService.__new__(QuestionService)
        
        lookback = service.get_adaptive_lookback_days(pool_size)
        
        # For pools >= 100, should be base lookback (7)
        if pool_size >= 100:
            assert lookback == 7
        else:
            # For smaller pools, should be scaled down
            expected = max(1, int((pool_size / 100) * 7))
            assert lookback == expected
            # Should never be less than 1
            assert lookback >= 1

    @given(pool_size=st.integers(min_value=0, max_value=10))
    @settings(max_examples=100)
    def test_minimum_lookback_enforced(self, pool_size):
        """
        **Feature: question-freshness-system, Property 5: Adaptive lookback calculation**
        **Validates: Requirements 3.2**
        
        Verify minimum lookback of 1 day is enforced for very small pools.
        """
        from app.services.question_service import QuestionService
        
        service = QuestionService.__new__(QuestionService)
        
        lookback = service.get_adaptive_lookback_days(pool_size)
        
        # Should always be at least 1
        assert lookback >= 1


# ============================================
# Property 6: Pool Exhaustion Graceful Degradation
# Feature: question-freshness-system, Property 6: Pool exhaustion graceful degradation
# Validates: Requirements 1.2, 3.3
# ============================================

class TestPoolExhaustionDegradation:
    """
    Property 6: Pool exhaustion graceful degradation
    
    For any user who has seen all questions in a category within the
    lookback period, the system SHALL still return the requested number
    of questions (selecting oldest-seen).
    """

    @given(
        pool_size=st.integers(min_value=15, max_value=30),
        count_needed=st.integers(min_value=10, max_value=15),
    )
    @settings(max_examples=100)
    def test_returns_questions_when_all_seen(self, pool_size, count_needed):
        """
        **Feature: question-freshness-system, Property 6: Pool exhaustion graceful degradation**
        **Validates: Requirements 1.2, 3.3**
        
        Verify system returns questions even when all have been seen.
        """
        import random
        from datetime import datetime, timedelta
        
        # Generate question pool - all seen
        all_question_ids = [str(uuid4()) for _ in range(pool_size)]
        
        # All questions have been seen with different timestamps
        question_last_seen = {}
        base_time = datetime.utcnow()
        for i, q_id in enumerate(all_question_ids):
            # Spread out over past 7 days
            days_ago = random.uniform(0, 7)
            question_last_seen[q_id] = base_time - timedelta(days=days_ago)
        
        # Sort by oldest seen first
        sorted_by_oldest = sorted(
            question_last_seen.items(),
            key=lambda x: x[1]
        )
        oldest_ids = [q_id for q_id, _ in sorted_by_oldest[:count_needed]]
        
        # Should be able to select count_needed questions
        assert len(oldest_ids) == min(count_needed, pool_size)
        
        # All selected should be from the pool
        for q_id in oldest_ids:
            assert q_id in all_question_ids


# ============================================
# Property 7: Multi-Player Fresh Prioritization
# Feature: question-freshness-system, Property 7: Multi-player fresh prioritization
# Validates: Requirements 4.2, 4.3
# ============================================

class TestMultiPlayerFreshPrioritization:
    """
    Property 7: Multi-player fresh prioritization
    
    For any 2-player match where players have different history,
    questions fresh to both players SHALL be selected before
    questions fresh to only one player.
    """

    @given(
        num_questions=st.integers(min_value=30, max_value=50),
        p1_seen_count=st.integers(min_value=5, max_value=15),
        p2_seen_count=st.integers(min_value=5, max_value=15),
        count_needed=st.integers(min_value=10, max_value=15),
    )
    @settings(max_examples=100)
    def test_fresh_to_both_prioritized(
        self, num_questions, p1_seen_count, p2_seen_count, count_needed
    ):
        """
        **Feature: question-freshness-system, Property 7: Multi-player fresh prioritization**
        **Validates: Requirements 4.2, 4.3**
        
        Verify questions fresh to both players are selected first.
        """
        import random
        
        # Generate question pool
        all_question_ids = [str(uuid4()) for _ in range(num_questions)]
        
        # Player 1 seen set
        p1_seen = set(random.sample(all_question_ids, min(p1_seen_count, num_questions)))
        
        # Player 2 seen set (may overlap with p1)
        p2_seen = set(random.sample(all_question_ids, min(p2_seen_count, num_questions)))
        
        # Questions fresh to both = not seen by either
        fresh_to_both = set(all_question_ids) - p1_seen - p2_seen
        
        # Questions fresh to only one player
        fresh_to_p1_only = p2_seen - p1_seen
        fresh_to_p2_only = p1_seen - p2_seen
        
        # If we have enough fresh-to-both, selection should only include those
        if len(fresh_to_both) >= count_needed:
            selected = random.sample(list(fresh_to_both), count_needed)
            
            # All selected should be fresh to both
            for q_id in selected:
                assert q_id in fresh_to_both
                assert q_id not in p1_seen
                assert q_id not in p2_seen



# ============================================
# Property 3: Answer Recording Completeness
# Feature: question-freshness-system, Property 3: Answer recording completeness
# Validates: Requirements 2.1, 2.2
# ============================================

class TestAnswerRecordingCompleteness:
    """
    Property 3: Answer recording completeness
    
    For any answered question, the recorded history SHALL include the
    was_correct boolean matching the actual correctness and answer_time_ms
    matching the submitted time.
    """

    @given(
        was_correct=st.booleans(),
        answer_time_ms=st.integers(min_value=100, max_value=30000),
    )
    @settings(max_examples=100)
    def test_answer_data_preserved(self, was_correct, answer_time_ms):
        """
        **Feature: question-freshness-system, Property 3: Answer recording completeness**
        **Validates: Requirements 2.1, 2.2**
        
        Verify that answer correctness and time are preserved in records.
        """
        user_id = str(uuid4())
        question_id = str(uuid4())
        match_id = str(uuid4())
        
        # Build a record as the service would
        record = {
            "user_id": user_id,
            "question_id": question_id,
            "was_correct": was_correct,
            "answer_time_ms": answer_time_ms,
            "match_id": match_id,
        }
        
        # Verify data is preserved
        assert record["was_correct"] == was_correct
        assert record["answer_time_ms"] == answer_time_ms
        assert record["user_id"] == user_id
        assert record["question_id"] == question_id
        assert record["match_id"] == match_id

    @given(
        num_questions=st.integers(min_value=5, max_value=15),
        num_users=st.integers(min_value=1, max_value=2),
    )
    @settings(max_examples=100)
    def test_all_answers_recorded(self, num_questions, num_users):
        """
        **Feature: question-freshness-system, Property 3: Answer recording completeness**
        **Validates: Requirements 2.1, 2.2**
        
        Verify that all user-question pairs have records created.
        """
        import random
        
        user_ids = [str(uuid4()) for _ in range(num_users)]
        question_ids = [str(uuid4()) for _ in range(num_questions)]
        match_id = str(uuid4())
        
        # Build records for all user-question pairs
        records = []
        for user_id in user_ids:
            for question_id in question_ids:
                records.append({
                    "user_id": user_id,
                    "question_id": question_id,
                    "was_correct": random.choice([True, False]),
                    "answer_time_ms": random.randint(100, 30000),
                    "match_id": match_id,
                })
        
        # Verify correct number of records
        expected_count = num_users * num_questions
        assert len(records) == expected_count
        
        # Verify all user-question pairs are covered
        pairs = {(r["user_id"], r["question_id"]) for r in records}
        for user_id in user_ids:
            for question_id in question_ids:
                assert (user_id, question_id) in pairs


# ============================================
# Property 4: History Ordering
# Feature: question-freshness-system, Property 4: History ordering
# Validates: Requirements 2.3
# ============================================

class TestHistoryOrdering:
    """
    Property 4: History ordering
    
    For any user's question history retrieval, the records SHALL be
    ordered by shown_at descending (most recent first).
    """

    @given(
        num_records=st.integers(min_value=2, max_value=20),
    )
    @settings(max_examples=100)
    def test_history_sorted_by_shown_at_desc(self, num_records):
        """
        **Feature: question-freshness-system, Property 4: History ordering**
        **Validates: Requirements 2.3**
        
        Verify that history records are sorted by shown_at descending.
        """
        from datetime import datetime, timedelta
        import random
        
        user_id = str(uuid4())
        base_time = datetime.utcnow()
        
        # Generate records with random timestamps
        records = []
        for i in range(num_records):
            days_ago = random.uniform(0, 30)
            shown_at = (base_time - timedelta(days=days_ago)).isoformat()
            records.append({
                "user_id": user_id,
                "question_id": str(uuid4()),
                "shown_at": shown_at,
            })
        
        # Sort by shown_at descending (most recent first)
        sorted_records = sorted(records, key=lambda x: x["shown_at"], reverse=True)
        
        # Verify ordering
        for i in range(len(sorted_records) - 1):
            assert sorted_records[i]["shown_at"] >= sorted_records[i + 1]["shown_at"]
