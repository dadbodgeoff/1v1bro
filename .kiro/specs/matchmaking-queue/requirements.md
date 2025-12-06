# Matchmaking Queue System - Requirements Document

## Introduction

This document defines the comprehensive requirements for implementing an enterprise-grade matchmaking queue system that enables players to be automatically paired with opponents of similar skill level. The system follows competitive gaming industry patterns established by Riot Games (League of Legends), Epic Games (Fortnite), Valve (Dota 2/CS2), and Blizzard (Overwatch).

The current implementation requires players to manually share lobby codes to find opponents. While functional for friends playing together, this approach fails to support the core competitive gaming use case: finding random opponents quickly and fairly. This upgrade introduces a server-side matchmaking queue with skill-based matching (MMR), queue time optimization, and anti-abuse protections.

The matchmaking system is designed for horizontal scalability, supporting future enhancements including party queue (queue with friends), ranked/unranked modes, and region-based matching. All implementations adhere to the established codebase patterns: Repository Pattern for data access, Service Pattern for business logic, and WebSocket events for real-time communication.

## Glossary

- **Matchmaking_System**: The server-side service that manages player queues and creates matches
- **MMR (Matchmaking Rating)**: A numerical skill rating (default: 1000) calculated from player performance using the Elo algorithm
- **Queue**: An ordered collection of players waiting to be matched, stored in-memory with database persistence
- **Match_Ticket**: A record representing a player's position and parameters in the queue (player_id, mmr, queue_time, game_mode)
- **Skill_Bracket**: A range of MMR values (±100 initially) used to group similar-skill players for matching
- **Queue_Expansion**: The process of widening skill brackets over time (every 30 seconds) to reduce wait times
- **Match_Found_Event**: A WebSocket event notifying players that a match has been created
- **Queue_Status_Event**: A periodic WebSocket event (every 5 seconds) updating players on queue state
- **Elo_Rating**: A rating system where points are exchanged between players based on match outcome and rating difference
- **K_Factor**: The maximum rating change per game (32 for this system, standard for competitive games)
- **Queue_Cooldown**: A temporary ban from queueing applied to players who abuse the system (early leavers)
- **Heartbeat**: A periodic signal confirming a queued player is still connected and waiting

---

## Current State Analysis

| Component | Current Implementation | Limitation |
|-----------|----------------------|------------|
| Match Finding | Manual lobby code sharing | No random matchmaking, requires external coordination |
| Skill Matching | None | New players matched against veterans, unfair games |
| Queue System | None | No way to wait for opponents automatically |
| MMR/Rating | None (only win/loss stats) | No skill-based pairing possible |
| Wait Time | N/A | Players must actively search for opponents |
| Anti-Abuse | None | No protection against queue dodging or early leaving |
| Scalability | Single lobby per code | No concurrent queue processing |

### Problems to Solve

1. **No Random Matchmaking**: Players cannot find opponents without sharing codes externally
2. **No Skill-Based Matching**: A player with 100 wins can face a brand new player
3. **No Queue UI**: No way to indicate "searching for match" state
4. **No Wait Time Estimation**: Players have no idea how long they'll wait
5. **No Anti-Abuse**: Players can leave matches without consequence
6. **No Persistence**: If server restarts, any "waiting" state is lost
7. **No Scalability Path**: Current lobby system doesn't support high concurrent users

---

## Requirements

### Requirement 1: Queue Entry

**User Story:** As a player, I want to join a matchmaking queue, so that I can be automatically matched against an opponent without needing a lobby code.

#### Acceptance Criteria

1. WHEN a player clicks "Find Match" THEN the Matchmaking_System SHALL create a Match_Ticket with the player's current MMR and queue entry timestamp
2. WHEN a player clicks "Find Match" THEN the Matchmaking_System SHALL add the Match_Ticket to the active queue within 100ms
3. WHEN a player is already in queue THEN the Matchmaking_System SHALL reject the duplicate queue request and return error code ALREADY_IN_QUEUE
4. WHEN a player joins the queue THEN the Matchmaking_System SHALL persist the Match_Ticket to the database for crash recovery
5. WHEN a player joins the queue THEN the Frontend SHALL display a "Searching for match..." UI with elapsed time counter starting at 00:00
6. WHEN a player is in queue THEN the Matchmaking_System SHALL send queue_status events every 5 seconds containing: elapsed_time, estimated_wait, current_bracket, queue_position
7. WHEN a player has an active queue cooldown THEN the Matchmaking_System SHALL reject the queue request with remaining cooldown time in seconds
8. WHEN a player joins the queue THEN the Matchmaking_System SHALL validate the player has no active game sessions before accepting

### Requirement 2: Queue Cancellation

**User Story:** As a player, I want to cancel my queue search, so that I can stop looking for a match if I change my mind.

#### Acceptance Criteria

1. WHEN a player clicks "Cancel" while in queue THEN the Matchmaking_System SHALL remove the Match_Ticket from the queue within 100ms
2. WHEN a player disconnects while in queue THEN the Matchmaking_System SHALL remove the Match_Ticket after a 5-second grace period (allows reconnection)
3. WHEN a player is removed from queue THEN the Matchmaking_System SHALL send a queue_cancelled event with reason: "user_cancelled" or "disconnected"
4. WHEN a player is removed from queue THEN the Matchmaking_System SHALL delete the Match_Ticket from the database
5. WHEN queue cancellation succeeds THEN the Frontend SHALL return to the home screen within 200ms
6. WHEN a player reconnects within the 5-second grace period THEN the Matchmaking_System SHALL restore their queue position without penalty

### Requirement 3: FIFO Matching (Phase 1 - No MMR)

**User Story:** As a player, I want to be matched against the next available opponent quickly, so that I can start playing without long wait times.

#### Acceptance Criteria

1. WHEN matching players THEN the Matchmaking_System SHALL use FIFO (first-in-first-out) ordering - longest waiting player gets matched first
2. WHEN two or more players are in queue THEN the Matchmaking_System SHALL immediately match the two longest-waiting players
3. WHEN only one player is in queue THEN the Matchmaking_System SHALL wait until a second player joins before creating a match
4. WHEN a match is created THEN the Matchmaking_System SHALL log both players' wait times for analytics
5. THE Matchmaking_System SHALL NOT use MMR for matching in Phase 1 (to minimize wait times with small player base)
6. THE Matchmaking_System SHALL store MMR infrastructure in the database for future Phase 2 ranked mode
7. WHEN the player base grows (configurable threshold: 100+ concurrent queue) THEN the system can enable MMR-based matching via feature flag

### Requirement 4: Match Creation

**User Story:** As a player, I want to be notified when a match is found, so that I can join the game.

#### Acceptance Criteria

1. WHEN two compatible players are found THEN the Matchmaking_System SHALL atomically remove both Match_Tickets from the queue to prevent double-matching
2. WHEN a match is created THEN the Matchmaking_System SHALL create a new lobby with both players assigned (host = player who queued first)
3. WHEN a match is created THEN the Matchmaking_System SHALL send a match_found event to both players containing: lobby_code, opponent_display_name
4. WHEN a match_found event is received THEN the Frontend SHALL display a "Match Found!" notification with opponent info for 3 seconds
5. WHEN a match_found event is received THEN the Frontend SHALL automatically navigate to the game lobby after the 3-second notification
6. WHEN a match is created THEN the Matchmaking_System SHALL initialize the tick system for the new lobby
7. WHEN a match is created THEN the Matchmaking_System SHALL record the match in the database with both player IDs and initial MMRs

### Requirement 5: MMR Tracking (Passive - Phase 1)

**User Story:** As a system operator, I want MMR tracked passively, so that we have data ready when we enable ranked mode.

#### Acceptance Criteria

1. WHEN a game ends THEN the Matchmaking_System SHALL calculate and store MMR changes using the Elo formula (but NOT use for matching)
2. THE Matchmaking_System SHALL use K_Factor = 32 for all players (standard competitive value)
3. WHEN a new player is created THEN the Matchmaking_System SHALL assign default MMR of 1000
4. WHEN a player's MMR changes THEN the Matchmaking_System SHALL persist the new value to user_profiles.mmr column silently
5. THE Matchmaking_System SHALL NOT display MMR to players in Phase 1 (casual mode)
6. THE Matchmaking_System SHALL log MMR distribution statistics for monitoring when to enable ranked mode
7. WHEN MMR is calculated THEN the Matchmaking_System SHALL clamp to range [100, 3000] to prevent extreme outliers

### Requirement 6: Queue Status Display

**User Story:** As a player, I want to see my queue status and estimated wait time, so that I know how long I might wait.

#### Acceptance Criteria

1. WHEN a player is in queue THEN the Frontend SHALL display elapsed queue time in MM:SS format, updating every second
2. WHEN a player is in queue THEN the Frontend SHALL display estimated wait time based on: avg_wait = total_recent_wait_time / recent_matches_count
3. WHEN a player is in queue THEN the Frontend SHALL display the current skill bracket being searched (e.g., "Searching: 900-1100 MMR")
4. WHEN queue expansion occurs THEN the Frontend SHALL update the displayed skill bracket range with a subtle animation
5. WHEN the queue population changes THEN the Matchmaking_System SHALL recalculate and broadcast updated estimated wait times
6. WHEN estimated wait exceeds 2 minutes THEN the Frontend SHALL display "Extended search - expanding skill range"
7. THE Frontend SHALL display a pulsing animation on the search indicator to show the system is actively working
8. WHEN queue status updates THEN the Frontend SHALL display current queue position (e.g., "#3 in queue")

### Requirement 7: Concurrent Queue Management

**User Story:** As a system operator, I want the queue to handle many concurrent players, so that the system remains responsive under load.

#### Acceptance Criteria

1. THE Matchmaking_System SHALL evaluate the queue for matches at least once per second (1Hz tick rate)
2. WHEN multiple valid matches exist THEN the Matchmaking_System SHALL process them in parallel using asyncio.gather()
3. WHEN a player is matched THEN the Matchmaking_System SHALL use atomic database operations (SELECT FOR UPDATE) to prevent double-matching race conditions
4. WHEN the queue contains more than 100 players THEN the Matchmaking_System SHALL complete a full evaluation cycle within 500ms
5. THE Matchmaking_System SHALL maintain an in-memory queue structure (sorted by queue_time) with database persistence for crash recovery
6. WHEN the server starts THEN the Matchmaking_System SHALL restore active Match_Tickets from the database that are less than 10 minutes old
7. THE Matchmaking_System SHALL use a background asyncio task for queue processing, separate from the main request handlers
8. WHEN queue processing encounters an error THEN the Matchmaking_System SHALL log the error and continue processing remaining tickets

### Requirement 8: Queue Persistence and Recovery

**User Story:** As a player, I want my queue position to survive brief server restarts, so that I don't lose my place in line.

#### Acceptance Criteria

1. WHEN a player joins the queue THEN the Matchmaking_System SHALL persist the Match_Ticket to the matchmaking_queue table within 100ms
2. WHEN the server restarts THEN the Matchmaking_System SHALL restore active Match_Tickets from the database on startup
3. WHEN restoring Match_Tickets THEN the Matchmaking_System SHALL preserve original queue entry timestamps for fair ordering
4. WHEN a Match_Ticket is older than 10 minutes THEN the Matchmaking_System SHALL expire and remove the ticket, sending queue_expired event
5. WHEN a player reconnects after server restart THEN the Matchmaking_System SHALL resume their queue session if the ticket is still valid
6. THE Matchmaking_System SHALL delete Match_Tickets from the database when: match is found, player cancels, ticket expires, or player disconnects past grace period
7. WHEN cleaning up expired tickets THEN the Matchmaking_System SHALL run a cleanup job every 60 seconds

### Requirement 9: Anti-Abuse Protection

**User Story:** As a system operator, I want to prevent queue abuse, so that the matchmaking system remains fair for all players.

#### Acceptance Criteria

1. WHEN a player leaves a match within 60 seconds of game start THEN the Matchmaking_System SHALL apply a 5-minute queue cooldown
2. WHEN a player accumulates 3 early leaves within 24 hours THEN the Matchmaking_System SHALL apply a 30-minute queue cooldown
3. WHEN a player accumulates 5 early leaves within 24 hours THEN the Matchmaking_System SHALL apply a 2-hour queue cooldown
4. WHEN a player attempts to queue during cooldown THEN the Matchmaking_System SHALL reject with error QUEUE_COOLDOWN and remaining_seconds
5. WHEN checking queue eligibility THEN the Matchmaking_System SHALL query the queue_cooldowns table for active cooldowns
6. WHEN a cooldown expires THEN the Matchmaking_System SHALL automatically allow the player to queue again (no manual reset needed)
7. THE Matchmaking_System SHALL track early_leave_count per player in user_profiles, resetting daily at 00:00 UTC
8. WHEN a player completes a full match THEN the Matchmaking_System SHALL NOT increment their early_leave_count

---

## Data Model

### New Database Tables

```sql
-- Match tickets for queue persistence
CREATE TABLE matchmaking_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    mmr INTEGER NOT NULL DEFAULT 1000,
    game_mode VARCHAR(50) NOT NULL DEFAULT 'fortnite',
    queue_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    bracket_expansion INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- waiting, matched, expired, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, status) -- Only one active ticket per player
);

CREATE INDEX idx_matchmaking_queue_status ON matchmaking_queue(status) WHERE status = 'waiting';
CREATE INDEX idx_matchmaking_queue_mmr ON matchmaking_queue(mmr) WHERE status = 'waiting';
CREATE INDEX idx_matchmaking_queue_time ON matchmaking_queue(queue_time) WHERE status = 'waiting';

-- Queue cooldowns for anti-abuse
CREATE TABLE queue_cooldowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    cooldown_until TIMESTAMP WITH TIME ZONE NOT NULL,
    reason VARCHAR(50) NOT NULL, -- early_leave, abuse, manual
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_queue_cooldowns_player ON queue_cooldowns(player_id);
CREATE INDEX idx_queue_cooldowns_until ON queue_cooldowns(cooldown_until);
```

### Extended user_profiles Table

```sql
-- Add MMR column to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS mmr INTEGER DEFAULT 1000;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS early_leave_count INTEGER DEFAULT 0;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS early_leave_reset_date DATE DEFAULT CURRENT_DATE;

CREATE INDEX idx_user_profiles_mmr ON user_profiles(mmr);
```

### Match_Ticket Schema (In-Memory)

```python
@dataclass
class MatchTicket:
    id: str                    # UUID
    player_id: str             # User UUID
    mmr: int                   # Current MMR at queue time
    game_mode: str             # "fortnite" (future: "ranked", "casual")
    queue_time: datetime       # When player joined queue
    bracket_expansion: int     # Number of expansions (0, 1, 2, 3+)
    websocket: WebSocket       # For sending events
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/matchmaking/queue` | Join the matchmaking queue |
| DELETE | `/api/v1/matchmaking/queue` | Leave the matchmaking queue |
| GET | `/api/v1/matchmaking/status` | Get current queue status |
| GET | `/api/v1/matchmaking/stats` | Get queue statistics (admin) |

### WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `queue_joined` | Server → Client | `{ ticket_id, position, estimated_wait }` |
| `queue_status` | Server → Client | `{ elapsed, estimated_wait, bracket, position }` |
| `queue_cancelled` | Server → Client | `{ reason }` |
| `queue_expired` | Server → Client | `{ reason: "timeout" }` |
| `match_found` | Server → Client | `{ lobby_code, opponent_name, opponent_mmr, match_quality }` |
| `mmr_update` | Server → Client | `{ old_mmr, new_mmr, change, rank_tier }` |

---

## System Architecture

```
backend/app/
├── matchmaking/                    # Matchmaking module
│   ├── __init__.py                 # Module exports
│   ├── config.py                   # Matchmaking configuration (<100 lines)
│   ├── models.py                   # Data models (<150 lines)
│   ├── queue_manager.py            # Queue operations (<300 lines)
│   ├── matcher.py                  # Matching algorithm (<250 lines)
│   ├── mmr_calculator.py           # Elo calculations (<150 lines)
│   └── cooldown_manager.py         # Anti-abuse (<150 lines)
│
├── database/repositories/
│   └── matchmaking_repo.py         # Database operations (<200 lines)
│
├── api/v1/
│   └── matchmaking.py              # REST endpoints (<150 lines)
│
└── websocket/
    └── matchmaking_handlers.py     # WS event handlers (<200 lines)

frontend/src/
├── hooks/
│   └── useMatchmaking.ts           # Matchmaking hook (<200 lines)
│
├── components/matchmaking/
│   ├── QueueButton.tsx             # Find Match button (<100 lines)
│   ├── QueueStatus.tsx             # Queue status display (<150 lines)
│   ├── MatchFoundModal.tsx         # Match found notification (<100 lines)
│   └── index.ts                    # Exports
│
├── stores/
│   └── matchmakingStore.ts         # Queue state (<100 lines)
│
└── services/
    └── matchmakingAPI.ts           # API client (<100 lines)
```

---

## Integration Points

### With Existing Systems

| System | Integration |
|--------|-------------|
| LobbyService | Matchmaking creates lobbies via existing lobby_service.create_lobby() |
| TickSystem | Match creation triggers tick_system.create_game() and start_game() |
| WebSocketManager | Queue events sent via existing manager.send_to_user() |
| GameService | Game end triggers MMR calculation via game_service hooks |
| UserRepository | MMR stored in user_profiles, queried for matching |

### Event Flow

```
Player clicks "Find Match" → POST /api/v1/matchmaking/queue
                          → MatchTicket created and persisted
                          → queue_joined event sent
                          → QueueManager.add_to_queue()

QueueManager tick (1Hz) → Evaluate all waiting tickets
                       → Find compatible pairs (MMR + wait time)
                       → Atomically match pairs
                       → Create lobbies via LobbyService
                       → Send match_found events
                       → Start tick system

Game ends → GameService.end_game() → MMRCalculator.calculate()
         → Update both players' MMR
         → Send mmr_update events
         → Check for early leave (if game < 60s)
         → Apply cooldown if needed
```

---

## Matching Algorithm (Phase 1 - FIFO)

```python
def find_match(queue: List[MatchTicket]) -> Optional[Tuple[MatchTicket, MatchTicket]]:
    """
    Simple FIFO matching - match the two longest-waiting players.
    
    Phase 1: No MMR consideration, just fastest possible matches.
    Phase 2 (future): Add MMR brackets when player base grows.
    """
    # Need at least 2 players to make a match
    if len(queue) < 2:
        return None
    
    # Sort by queue time (oldest first)
    sorted_queue = sorted(queue, key=lambda t: t.queue_time)
    
    # Match the two longest-waiting players
    player1 = sorted_queue[0]
    player2 = sorted_queue[1]
    
    return (player1, player2)
```

---

## MMR Rank Tiers (Display Only)

| Tier | MMR Range | Icon |
|------|-----------|------|
| Bronze | 100-799 | 🥉 |
| Silver | 800-1199 | 🥈 |
| Gold | 1200-1599 | 🥇 |
| Platinum | 1600-1999 | 💎 |
| Diamond | 2000-2399 | 💠 |
| Master | 2400-2799 | 👑 |
| Grandmaster | 2800-3000 | 🏆 |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Queue Time (median) | <30 seconds | Queue analytics |
| Queue Time (p95) | <120 seconds | Queue analytics |
| Match Quality | >0.7 average | Match quality scores |
| Early Leave Rate | <5% | Cooldown triggers |
| Queue Abandonment | <10% | Cancel rate |
| System Uptime | 99.9% | Monitoring |
| API Response Time | <100ms p95 | API metrics |

---

## Out of Scope (Future Phases)

These features are explicitly NOT part of this initial implementation:

- **Party Queue**: Queue with friends as a group (Phase 2)
- **Ranked Mode**: Separate ranked queue with seasons and rewards (Phase 2)
- **Region Matching**: Match players by geographic region (Phase 3)
- **Game Mode Selection**: Different queues for different game modes (Phase 2)
- **Placement Matches**: Initial calibration games for new players (Phase 2)
- **MMR Decay**: Rating decay for inactive players (Phase 3)
- **Leaderboard Integration**: MMR-based leaderboards (Phase 2)
- **Anti-Smurf Detection**: Detecting skilled players on new accounts (Phase 3)
- **Queue Dodging Penalties**: Penalties for not accepting found matches (Phase 2)

---

## Testing Strategy

### Unit Tests
- MMR calculation accuracy (Elo formula)
- Bracket expansion timing
- Cooldown application and expiry
- Match quality scoring

### Integration Tests
- Queue join/leave flow
- Match creation with lobby
- Database persistence and recovery
- WebSocket event delivery

### Property-Based Tests
- MMR changes are zero-sum (winner gains = loser loses)
- Queue ordering is stable (FIFO within brackets)
- No double-matching under concurrent load
- Cooldowns expire correctly

---

*Document Version: 1.0*
*Created: December 2024*
