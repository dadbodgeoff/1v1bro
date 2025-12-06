# Matchmaking Queue System - Design Document

## Overview

This document describes the technical design for implementing a matchmaking queue system that enables players to find random opponents automatically. The system uses simple FIFO (first-in-first-out) matching for Phase 1 to minimize wait times with a small player base, while tracking MMR passively for future ranked mode.

The design follows established codebase patterns:
- **Repository Pattern**: Database access via `MatchmakingRepository`
- **Service Pattern**: Business logic in `MatchmakingService`
- **WebSocket Events**: Real-time communication via existing `WebSocketManager`
- **Background Tasks**: Queue processing via `asyncio` task

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend                                   │
├─────────────────────────────────────────────────────────────────────┤
│  Home.tsx          │  useMatchmaking.ts  │  matchmakingStore.ts     │
│  - Find Match btn  │  - Queue hooks      │  - Queue state           │
│  - Queue status UI │  - WS subscriptions │  - Status tracking       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ REST + WebSocket
┌─────────────────────────────────────────────────────────────────────┐
│                           Backend                                    │
├─────────────────────────────────────────────────────────────────────┤
│  matchmaking.py (API)      │  MatchmakingService                    │
│  - POST /queue             │  - join_queue()                        │
│  - DELETE /queue           │  - leave_queue()                       │
│  - GET /status             │  - process_queue() [background]        │
├─────────────────────────────────────────────────────────────────────┤
│  QueueManager              │  MatchmakingRepository                 │
│  - In-memory queue         │  - Ticket persistence                  │
│  - FIFO matching           │  - Cooldown management                 │
│  - Match creation          │  - MMR storage                         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Database                                     │
├─────────────────────────────────────────────────────────────────────┤
│  matchmaking_queue         │  queue_cooldowns    │  user_profiles   │
│  - player_id               │  - player_id        │  - mmr (new)     │
│  - queue_time              │  - cooldown_until   │  - early_leaves  │
│  - status                  │  - reason           │                  │
└─────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Backend Components

#### 1. MatchmakingService (`backend/app/services/matchmaking_service.py`)

Main service orchestrating queue operations.

```python
class MatchmakingService:
    async def join_queue(self, player_id: str) -> MatchTicket:
        """Add player to matchmaking queue."""
        
    async def leave_queue(self, player_id: str) -> bool:
        """Remove player from queue."""
        
    async def get_queue_status(self, player_id: str) -> QueueStatus:
        """Get player's current queue status."""
        
    async def check_cooldown(self, player_id: str) -> Optional[int]:
        """Check if player has active cooldown, return remaining seconds."""
        
    async def apply_cooldown(self, player_id: str, minutes: int, reason: str) -> None:
        """Apply queue cooldown to player."""
```

#### 2. QueueManager (`backend/app/matchmaking/queue_manager.py`)

In-memory queue with FIFO matching logic.

```python
class QueueManager:
    def __init__(self):
        self._queue: Dict[str, MatchTicket] = {}  # player_id -> ticket
        self._lock: asyncio.Lock = asyncio.Lock()
        
    async def add(self, ticket: MatchTicket) -> bool:
        """Add ticket to queue. Returns False if already queued."""
        
    async def remove(self, player_id: str) -> Optional[MatchTicket]:
        """Remove and return ticket from queue."""
        
    async def find_match(self) -> Optional[Tuple[MatchTicket, MatchTicket]]:
        """Find two players to match using FIFO."""
        
    async def get_position(self, player_id: str) -> Optional[int]:
        """Get player's position in queue (1-indexed)."""
        
    def get_queue_size(self) -> int:
        """Get current queue size."""
```

#### 3. MatchmakingRepository (`backend/app/database/repositories/matchmaking_repo.py`)

Database operations for queue persistence and cooldowns.

```python
class MatchmakingRepository:
    async def save_ticket(self, ticket: MatchTicket) -> None:
        """Persist ticket to database."""
        
    async def delete_ticket(self, player_id: str) -> None:
        """Remove ticket from database."""
        
    async def get_active_tickets(self) -> List[MatchTicket]:
        """Get all active tickets for recovery."""
        
    async def get_cooldown(self, player_id: str) -> Optional[datetime]:
        """Get player's cooldown expiry time."""
        
    async def set_cooldown(self, player_id: str, until: datetime, reason: str) -> None:
        """Set player's queue cooldown."""
        
    async def update_mmr(self, player_id: str, new_mmr: int) -> None:
        """Update player's MMR."""
```

### Frontend Components

#### 1. useMatchmaking Hook (`frontend/src/hooks/useMatchmaking.ts`)

```typescript
interface UseMatchmaking {
  isInQueue: boolean
  queueTime: number          // seconds elapsed
  queuePosition: number | null
  estimatedWait: number | null
  
  joinQueue: () => Promise<void>
  leaveQueue: () => Promise<void>
}
```

#### 2. matchmakingStore (`frontend/src/stores/matchmakingStore.ts`)

```typescript
interface MatchmakingState {
  status: 'idle' | 'queuing' | 'match_found'
  ticketId: string | null
  queueStartTime: number | null
  queuePosition: number | null
  matchData: MatchFoundData | null
  
  setQueuing: (ticketId: string) => void
  setMatchFound: (data: MatchFoundData) => void
  reset: () => void
}
```

## Data Models

### MatchTicket

```python
@dataclass
class MatchTicket:
    id: str                    # UUID
    player_id: str             # User UUID
    player_name: str           # Display name for opponent info
    queue_time: datetime       # When player joined queue
    game_mode: str = "fortnite"
    
    @property
    def wait_seconds(self) -> float:
        return (datetime.utcnow() - self.queue_time).total_seconds()
```

### QueueStatus

```python
@dataclass
class QueueStatus:
    in_queue: bool
    position: Optional[int]    # 1-indexed position
    wait_seconds: int
    estimated_wait: Optional[int]
    queue_size: int
```

### MatchFoundEvent

```python
@dataclass
class MatchFoundEvent:
    lobby_code: str
    opponent_id: str
    opponent_name: str
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: No Duplicate Queue Entries
*For any* player who is already in the queue, attempting to join again SHALL be rejected with ALREADY_IN_QUEUE error, and the queue size SHALL remain unchanged.
**Validates: Requirements 1.3**

### Property 2: FIFO Ordering Preserved
*For any* queue with N players, when a match is created, the two players with the earliest queue_time SHALL be selected.
**Validates: Requirements 3.1, 3.2**

### Property 3: Atomic Match Removal
*For any* match created, both matched players SHALL be removed from the queue atomically - the queue size SHALL decrease by exactly 2.
**Validates: Requirements 4.1**

### Property 4: Ticket Persistence Round-Trip
*For any* MatchTicket saved to the database, restoring it SHALL preserve the original queue_time timestamp exactly.
**Validates: Requirements 8.3**

### Property 5: Cooldown Enforcement
*For any* player with an active cooldown (cooldown_until > now), attempting to join the queue SHALL be rejected.
**Validates: Requirements 1.7, 9.1**

### Property 6: Cooldown Expiry
*For any* player whose cooldown has expired (cooldown_until <= now), they SHALL be allowed to join the queue.
**Validates: Requirements 9.6**

### Property 7: Default MMR Assignment
*For any* new player without an MMR value, the system SHALL assign MMR = 1000.
**Validates: Requirements 5.3**

### Property 8: Queue Cancellation Removes Ticket
*For any* player who cancels their queue, their ticket SHALL be removed from both in-memory queue and database.
**Validates: Requirements 2.1**

## Error Handling

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| ALREADY_IN_QUEUE | 409 Conflict | Player already has active queue ticket |
| QUEUE_COOLDOWN | 403 Forbidden | Player has active cooldown |
| NOT_IN_QUEUE | 404 Not Found | Player not in queue (for cancel) |
| QUEUE_FULL | 503 Service Unavailable | Queue at capacity (future) |

## Testing Strategy

### Property-Based Testing (Hypothesis)

The following properties will be tested using the Hypothesis library:

1. **FIFO Ordering**: Generate random queue states, verify oldest players matched first
2. **No Duplicates**: Generate random join sequences, verify duplicates rejected
3. **Atomic Removal**: Generate matches, verify queue size decreases by exactly 2
4. **Persistence Round-Trip**: Generate tickets, save/restore, verify equality
5. **Cooldown Logic**: Generate cooldown states, verify enforcement/expiry

### Unit Tests

- Queue join/leave operations
- Match creation flow
- Cooldown calculation
- WebSocket event formatting

### Integration Tests

- Full queue → match → lobby flow
- Database persistence and recovery
- WebSocket event delivery

## WebSocket Events

### Server → Client

```typescript
// Player successfully joined queue
{ type: "queue_joined", payload: { ticket_id: string, position: number } }

// Periodic status update (every 5 seconds)
{ type: "queue_status", payload: { elapsed: number, position: number, queue_size: number } }

// Queue cancelled (by user or disconnect)
{ type: "queue_cancelled", payload: { reason: "user_cancelled" | "disconnected" | "expired" } }

// Match found!
{ type: "match_found", payload: { lobby_code: string, opponent_name: string } }
```

## Background Queue Processing

```python
async def queue_processor(self):
    """Background task that processes queue every second."""
    while True:
        try:
            async with self._lock:
                match = await self.find_match()
                if match:
                    player1, player2 = match
                    await self._create_match(player1, player2)
        except Exception as e:
            logger.error(f"Queue processor error: {e}")
        
        await asyncio.sleep(1.0)  # 1Hz tick rate
```

## Migration Plan

### Database Migration (`004_matchmaking.sql`)

```sql
-- Match tickets for queue persistence
CREATE TABLE IF NOT EXISTS matchmaking_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    player_name VARCHAR(100),
    game_mode VARCHAR(50) NOT NULL DEFAULT 'fortnite',
    queue_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'waiting',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id)
);

CREATE INDEX idx_matchmaking_queue_status ON matchmaking_queue(status);
CREATE INDEX idx_matchmaking_queue_time ON matchmaking_queue(queue_time);

-- Queue cooldowns for anti-abuse
CREATE TABLE IF NOT EXISTS queue_cooldowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    cooldown_until TIMESTAMP WITH TIME ZONE NOT NULL,
    reason VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_queue_cooldowns_player ON queue_cooldowns(player_id);

-- Add MMR to user_profiles (passive tracking)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS mmr INTEGER DEFAULT 1000;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS early_leave_count INTEGER DEFAULT 0;
```

## UI Flow

```
Home Page
    │
    ├── [Find Match] button clicked
    │       │
    │       ▼
    │   POST /api/v1/matchmaking/queue
    │       │
    │       ▼
    │   Queue Status UI appears
    │   - "Searching for opponent..."
    │   - Elapsed time: 00:00
    │   - [Cancel] button
    │       │
    │       ├── [Cancel] clicked → DELETE /queue → Return to Home
    │       │
    │       ▼
    │   WebSocket: queue_status (every 5s)
    │   - Update elapsed time
    │   - Update position
    │       │
    │       ▼
    │   WebSocket: match_found
    │       │
    │       ▼
    │   "Match Found!" modal (3 seconds)
    │   - Opponent name displayed
    │       │
    │       ▼
    │   Auto-navigate to /lobby/{code}
    │       │
    │       ▼
    │   Normal lobby → game flow
```

## Performance Considerations

1. **In-Memory Queue**: Primary queue stored in memory for fast access, database for persistence only
2. **1Hz Processing**: Queue evaluated once per second (sufficient for small player base)
3. **Async Lock**: Prevents race conditions during match creation
4. **Batch Status Updates**: Status events sent every 5 seconds, not on every change

## Future Enhancements (Phase 2+)

- MMR-based matching when player base grows
- Party queue (queue with friends)
- Ranked mode with seasons
- Region-based matching
- Queue accept/decline flow
