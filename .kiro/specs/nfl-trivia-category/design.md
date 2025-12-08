# Design Document: NFL Trivia Category System

## Overview

This feature adds NFL trivia as a second question category alongside Fortnite, with category-based matchmaking to ensure players compete on their preferred topic. The system includes a CSV parser for importing 1000 NFL questions and updates to the matchmaking flow to support category-specific queues.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Category     │───▶│ Matchmaking  │───▶│ Lobby        │      │
│  │ Selector     │    │ Queue        │    │ Display      │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend                                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Matchmaking  │───▶│ Lobby        │───▶│ Question     │      │
│  │ Service      │    │ Service      │    │ Service      │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────────────────────────────────────────────┐       │
│  │                    Supabase                          │       │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │       │
│  │  │ lobbies    │  │ questions  │  │ categories │    │       │
│  │  │ +category  │  │            │  │            │    │       │
│  │  └────────────┘  └────────────┘  └────────────┘    │       │
│  └─────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. CSV Parser Script (`scripts/parse_nfl_questions.py`)

Converts NFL trivia CSV files to database format.

```python
class NFLQuestionParser:
    def parse_csv(self, filepath: str) -> List[dict]:
        """Parse CSV file and return list of question dicts."""
        
    def map_correct_answer(self, answer_text: str, options: List[str]) -> int:
        """Convert answer text to correct_index (0-3)."""
        
    def slugify_category(self, category: str) -> str:
        """Convert category name to slug format."""
        
    def format_question(self, question: dict) -> str:
        """Pretty print a question for verification."""
```

### 2. Matchmaking Service Updates

```python
class MatchmakingService:
    async def join_queue(self, user_id: str, category: str = "fortnite") -> dict:
        """Add player to category-specific matchmaking queue."""
        
    async def find_match(self, user_id: str, category: str) -> Optional[dict]:
        """Find opponent in same category queue."""
        
    async def leave_queue(self, user_id: str) -> None:
        """Remove player from their current queue."""
```

### 3. Lobby Service Updates

```python
class LobbyService:
    async def create_lobby(
        self, 
        host_id: str, 
        category: str = "fortnite"
    ) -> dict:
        """Create lobby with specified trivia category."""
        
    async def get_lobby(self, lobby_code: str) -> dict:
        """Get lobby including category field."""
```

### 4. Question Service Updates

```python
class QuestionService:
    async def load_questions_async(
        self,
        count: int,
        category: str,  # Now required, from lobby
        user_ids: List[str],
    ) -> List[Question]:
        """Load questions from specified category."""
```

### 5. Frontend Components

```typescript
// CategorySelector.tsx
interface CategorySelectorProps {
  selectedCategory: string;
  onSelect: (category: string) => void;
  categories: Category[];
}

// Updated FindMatch flow
interface FindMatchProps {
  category: string;  // Required before searching
}
```

## Data Models

### Lobby Table Update

```sql
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS 
    category VARCHAR(50) DEFAULT 'fortnite' 
    REFERENCES question_categories(slug);
```

### Matchmaking Queue (In-Memory or Redis)

```python
@dataclass
class QueueEntry:
    user_id: str
    category: str
    joined_at: datetime
    
# Queues organized by category
queues: Dict[str, List[QueueEntry]] = {
    "fortnite": [],
    "nfl": [],
}
```

### WebSocket Events

```typescript
// lobby_state event
interface LobbyState {
  lobby_id: string;
  status: string;
  players: Player[];
  category: string;  // NEW: lobby's trivia category
  can_start: boolean;
}

// game_start event
interface GameStart {
  total_questions: number;
  players: Player[];
  category: string;  // NEW: category for this match
  player_skins: Record<string, Skin>;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: CSV Parsing Round-Trip
*For any* valid question dict, formatting it as CSV and parsing it back should produce an equivalent question dict (same text, options, correct_index).
**Validates: Requirements 9.3**

### Property 2: Correct Answer Index Mapping
*For any* CSV row where the correct answer column matches one of the four options exactly, the parser should produce a correct_index (0-3) that corresponds to the matching option's position.
**Validates: Requirements 1.3, 7.2**

### Property 3: Category Slug Consistency
*For any* category name string, slugifying it should produce a lowercase string with spaces replaced by underscores, containing only alphanumeric characters and underscores.
**Validates: Requirements 1.4, 2.2**

### Property 4: Duplicate Prevention Idempotency
*For any* set of questions, inserting them twice should result in the same total count as inserting once (no duplicates created).
**Validates: Requirements 1.5**

### Property 5: Category-Based Matchmaking Isolation
*For any* two players in the matchmaking queue, they should only be matched if they have the same category selection.
**Validates: Requirements 3.3, 3.5, 11.2**

### Property 6: Lobby Category Immutability
*For any* lobby, once created with a category, all questions served in that lobby should be from that category only.
**Validates: Requirements 4.1, 5.1, 5.2**

### Property 7: WebSocket Event Category Inclusion
*For any* lobby_state or game_start WebSocket event, the event payload should include a non-null category field matching the lobby's category.
**Validates: Requirements 4.4, 10.1, 10.2**

### Property 8: Question Count Trigger Accuracy
*For any* sequence of question insertions and deletions, the category's question_count should equal the actual count of active questions in that category.
**Validates: Requirements 6.2**

## Error Handling

| Error Case | Handling |
|------------|----------|
| CSV row missing required fields | Skip row, log warning, continue |
| Correct answer doesn't match any option | Skip row, log error with row number |
| Category not found in database | Create category automatically |
| Matchmaking timeout | Return to category selection with message |
| Insufficient questions in category | Log warning, fall back to available questions |

## Testing Strategy

### Unit Tests
- CSV parser field extraction
- Correct answer index mapping
- Category slug generation
- WebSocket event building

### Property-Based Tests (Hypothesis)
- Round-trip parsing (Property 1)
- Correct answer mapping (Property 2)
- Slug consistency (Property 3)
- Duplicate prevention (Property 4)
- Matchmaking isolation (Property 5)
- Category immutability (Property 6)
- Event category inclusion (Property 7)
- Question count accuracy (Property 8)

### Integration Tests
- Full CSV import flow
- Matchmaking with category selection
- Game session with category-specific questions
- WebSocket event broadcasting

### Testing Framework
- Backend: pytest with hypothesis for property-based testing
- Frontend: vitest for component tests
