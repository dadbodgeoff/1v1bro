# Design Document: Question Freshness System

## Overview

This design implements a question freshness system that ensures players encounter new trivia questions in each match. The system tracks which questions each player has seen, prioritizes fresh questions during selection, and gracefully degrades when the fresh question pool is exhausted.

The core insight is that the existing `user_question_history` table and `record_question_shown()` method exist but are never called. This design integrates history tracking into the game flow and enhances the selection algorithm.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Game Service                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ create_      │───▶│ Question     │───▶│ Questions    │       │
│  │ session()    │    │ Service      │    │ Repository   │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                    │               │
│         │                   │                    ▼               │
│         │                   │           ┌──────────────┐        │
│         │                   │           │ questions    │        │
│         │                   │           │ table        │        │
│         │                   │           └──────────────┘        │
│         │                   │                    │               │
│         ▼                   ▼                    ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ end_game()   │───▶│ record_      │───▶│ user_        │       │
│  │              │    │ match_       │    │ question_    │       │
│  │              │    │ questions()  │    │ history      │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### QuestionService (Enhanced)

```python
class QuestionService:
    async def load_questions_async(
        self,
        count: int = 15,
        category: str = "fortnite",
        user_ids: Optional[List[str]] = None,
    ) -> List[Question]:
        """Load fresh questions, avoiding recently seen ones."""
        
    async def record_match_questions(
        self,
        user_ids: List[str],
        questions: List[Question],
        answers: List[List[PlayerAnswer]],
        match_id: str,
    ) -> None:
        """Record all questions shown in a match for both players."""
        
    def get_adaptive_lookback_days(
        self,
        pool_size: int,
        base_lookback: int = 7,
    ) -> int:
        """Calculate lookback period based on question pool size."""
```

### QuestionsRepository (Enhanced)

```python
class QuestionsRepository:
    async def get_questions_for_match(
        self,
        category_slug: str,
        count: int = 15,
        user_ids: Optional[List[str]] = None,
        avoid_recent_days: int = 7,
    ) -> List[dict]:
        """
        Get questions with smart freshness selection:
        1. Exclude questions seen by ANY user in user_ids within lookback
        2. If not enough fresh, include oldest-seen questions
        3. Shuffle and return requested count
        """
        
    async def record_questions_batch(
        self,
        records: List[dict],
    ) -> None:
        """Batch insert question history records."""
        
    async def update_question_analytics(
        self,
        question_id: str,
        was_correct: bool,
        answer_time_ms: int,
    ) -> None:
        """Update question analytics counters."""
        
    async def get_seen_question_ids(
        self,
        user_ids: List[str],
        category_id: str,
        since_days: int = 7,
    ) -> Set[str]:
        """Get question IDs seen by any of the users within timeframe."""
```

### GameService Integration

The `end_game()` method will be enhanced to call `record_match_questions()` after the match completes, passing the questions shown and player answers.

## Data Models

### User Question History Record

```python
@dataclass
class QuestionHistoryRecord:
    user_id: str
    question_id: str
    shown_at: datetime
    was_correct: Optional[bool]
    answer_time_ms: Optional[int]
    match_id: Optional[str]
```

### Question Selection Result

```python
@dataclass
class QuestionSelectionResult:
    questions: List[Question]
    fresh_count: int  # How many were truly fresh
    repeat_count: int  # How many were repeats (oldest-seen)
    pool_exhaustion_pct: float  # % of pool seen by players
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Fresh questions are excluded from recent history

*For any* set of user IDs and question history within the lookback period, the selected questions SHALL NOT include any question IDs present in the recent history set for those users.

**Validates: Requirements 1.1, 4.1**

### Property 2: History recording completeness

*For any* match with questions shown to players, after recording, the user_question_history table SHALL contain a record for each (user_id, question_id) pair with non-null shown_at timestamp and match_id.

**Validates: Requirements 1.3, 1.4**

### Property 3: Answer recording completeness

*For any* answered question, the recorded history SHALL include the was_correct boolean matching the actual correctness and answer_time_ms matching the submitted time.

**Validates: Requirements 2.1, 2.2**

### Property 4: History ordering

*For any* user's question history retrieval, the records SHALL be ordered by shown_at descending (most recent first).

**Validates: Requirements 2.3**

### Property 5: Adaptive lookback calculation

*For any* question pool with fewer than 100 questions, the effective lookback period SHALL be proportionally reduced (e.g., 50 questions = 3.5 days lookback).

**Validates: Requirements 3.2**

### Property 6: Pool exhaustion graceful degradation

*For any* user who has seen all questions in a category within the lookback period, the system SHALL still return the requested number of questions (selecting oldest-seen).

**Validates: Requirements 1.2, 3.3**

### Property 7: Multi-player fresh prioritization

*For any* 2-player match where players have different history, questions fresh to both players SHALL be selected before questions fresh to only one player.

**Validates: Requirements 4.2, 4.3**

### Property 8: Question analytics update

*For any* question shown and answered, the question record's times_shown SHALL increment by 1, times_correct SHALL increment by 1 if correct, and avg_answer_time_ms SHALL reflect the rolling average.

**Validates: Requirements 5.1, 5.2, 5.3**

## Error Handling

| Error Condition | Handling Strategy |
|-----------------|-------------------|
| No questions in category | Return fallback questions, log warning |
| Database connection failure | Use cached questions if available, log error |
| History recording failure | Log error, don't fail game end |
| Analytics update failure | Log error, don't fail game end |

## Testing Strategy

### Property-Based Testing

We will use **Hypothesis** (Python's property-based testing library) to verify the correctness properties.

Each property-based test MUST:
- Run a minimum of 100 iterations
- Be tagged with a comment referencing the correctness property
- Generate realistic test data using custom strategies

### Test Strategies

```python
# Strategy for generating user question history
@st.composite
def question_history_strategy(draw):
    user_id = draw(st.uuids())
    question_ids = draw(st.lists(st.uuids(), min_size=0, max_size=50))
    days_ago = draw(st.integers(min_value=0, max_value=30))
    return {
        "user_id": str(user_id),
        "question_ids": [str(q) for q in question_ids],
        "shown_at": datetime.utcnow() - timedelta(days=days_ago),
    }

# Strategy for generating question pools
@st.composite  
def question_pool_strategy(draw):
    count = draw(st.integers(min_value=10, max_value=200))
    return [{"id": str(uuid4()), "text": f"Q{i}"} for i in range(count)]
```

### Unit Tests

Unit tests will cover:
- Edge cases (empty history, single question pool)
- Configuration defaults
- Error handling paths

### Integration Tests

Integration tests will verify:
- End-to-end flow from match start to history recording
- Database operations work correctly
- Multi-player scenarios
