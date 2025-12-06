# Implementation Plan

## Phase 1: Backend Infrastructure

- [x] 1. Database Migration and Models
  - [x] 1.1 Create migration file `004_matchmaking.sql`
    - Create `matchmaking_queue` table with player_id, queue_time, status
    - Create `queue_cooldowns` table with player_id, cooldown_until, reason
    - Add `mmr` column to `user_profiles` (default 1000)
    - Add `early_leave_count` column to `user_profiles`
    - Create indexes for queue queries
    - _Requirements: 1.4, 8.1, 5.3_
  - [x] 1.2 Create matchmaking models (`backend/app/matchmaking/models.py`)
    - Define `MatchTicket` dataclass
    - Define `QueueStatus` dataclass
    - Define `MatchFoundEvent` dataclass
    - _Requirements: 1.1_

- [x] 2. Repository Layer
  - [x] 2.1 Create `MatchmakingRepository` (`backend/app/database/repositories/matchmaking_repo.py`)
    - Implement `save_ticket()` for persistence
    - Implement `delete_ticket()` for removal
    - Implement `get_active_tickets()` for recovery
    - Implement `get_cooldown()` and `set_cooldown()`
    - _Requirements: 1.4, 8.2, 9.1_
  - [x] 2.2 Write property test for ticket persistence round-trip
    - **Property 4: Ticket Persistence Round-Trip**
    - **Validates: Requirements 8.3**

- [x] 3. Queue Manager
  - [x] 3.1 Create `QueueManager` (`backend/app/matchmaking/queue_manager.py`)
    - Implement in-memory queue with dict storage
    - Implement `add()` with duplicate check
    - Implement `remove()` for cancellation
    - Implement `find_match()` with FIFO logic
    - Implement `get_position()` for status
    - _Requirements: 1.1, 1.3, 2.1, 3.1, 3.2_
  - [x] 3.2 Write property test for FIFO ordering
    - **Property 2: FIFO Ordering Preserved**
    - **Validates: Requirements 3.1, 3.2**
  - [x] 3.3 Write property test for no duplicate entries
    - **Property 1: No Duplicate Queue Entries**
    - **Validates: Requirements 1.3**
  - [x] 3.4 Write property test for atomic match removal
    - **Property 3: Atomic Match Removal**
    - **Validates: Requirements 4.1**

- [x] 4. Checkpoint - Ensure all tests pass
  - 21 matchmaking property tests passing

## Phase 2: Service Layer and API

- [x] 5. Matchmaking Service
  - [x] 5.1 Create `MatchmakingService` (`backend/app/services/matchmaking_service.py`)
    - Implement `join_queue()` with cooldown check
    - Implement `leave_queue()` with cleanup
    - Implement `get_queue_status()`
    - Implement `check_cooldown()` and `apply_cooldown()`
    - Wire up to QueueManager and Repository
    - _Requirements: 1.1, 1.7, 2.1, 6.1_
  - [ ] 5.2 Write property test for cooldown enforcement
    - **Property 5: Cooldown Enforcement**
    - **Validates: Requirements 1.7, 9.1**
  - [ ] 5.3 Write property test for cooldown expiry
    - **Property 6: Cooldown Expiry**
    - **Validates: Requirements 9.6**

- [x] 6. Background Queue Processor
  - [x] 6.1 Implement queue processor task in MatchmakingService
    - Create async background task running at 1Hz
    - Call `find_match()` each tick
    - Create lobby when match found via LobbyService
    - Send `match_found` WebSocket events to both players
    - _Requirements: 4.1, 4.2, 4.3, 7.1_

- [x] 7. REST API Endpoints
  - [x] 7.1 Create matchmaking API router (`backend/app/api/v1/matchmaking.py`)
    - POST `/api/v1/matchmaking/queue` - Join queue
    - DELETE `/api/v1/matchmaking/queue` - Leave queue
    - GET `/api/v1/matchmaking/status` - Get queue status
    - _Requirements: 1.1, 2.1, 6.1_
  - [x] 7.2 Register router in main app
    - Add to `backend/app/api/v1/router.py`
    - _Requirements: 1.1_

- [x] 8. WebSocket Events
  - [x] 8.1 Add matchmaking WebSocket handlers (`backend/app/websocket/handlers.py`)
    - Handle `queue_join` message type
    - Handle `queue_leave` message type
    - Implement `queue_status` periodic broadcast (every 5s)
    - Implement `match_found` event sending
    - _Requirements: 1.6, 2.3, 4.3_

- [x] 9. Checkpoint - Ensure all tests pass
  - 282 backend tests passing

## Phase 3: Frontend Implementation

- [x] 10. State Management
  - [x] 10.1 Create matchmaking store (`frontend/src/stores/matchmakingStore.ts`)
    - Define state: status, ticketId, queueStartTime, matchData
    - Implement actions: setQueuing, setMatchFound, reset
    - _Requirements: 1.5, 4.4_

- [x] 11. API and Hooks
  - [x] 11.1 Create matchmaking API client (`frontend/src/services/matchmakingAPI.ts`)
    - Implement `joinQueue()` POST request
    - Implement `leaveQueue()` DELETE request
    - Implement `getStatus()` GET request
    - _Requirements: 1.1, 2.1_
  - [x] 11.2 Create useMatchmaking hook (`frontend/src/hooks/useMatchmaking.ts`)
    - Manage queue state and WebSocket subscriptions
    - Subscribe to `queue_joined`, `queue_status`, `match_found`, `queue_cancelled`
    - Implement `joinQueue()` and `leaveQueue()` functions
    - Track elapsed time with interval
    - Auto-navigate on match found
    - _Requirements: 1.5, 1.6, 2.4, 4.4, 4.5, 6.1_

- [x] 12. UI Components
  - [x] 12.1 Create QueueStatus component (`frontend/src/components/matchmaking/QueueStatus.tsx`)
    - Display "Searching for opponent..." text
    - Display elapsed time in MM:SS format
    - Display queue position
    - Show Cancel button
    - _Requirements: 1.5, 6.1, 6.2_
  - [x] 12.2 Create MatchFoundModal component (`frontend/src/components/matchmaking/MatchFoundModal.tsx`)
    - Display "Match Found!" notification
    - Show opponent name
    - Auto-dismiss after 3 seconds
    - _Requirements: 4.4_
  - [x] 12.3 Update Home page (`frontend/src/pages/Home.tsx`)
    - Add "Find Match" button alongside "Create Lobby"
    - Integrate QueueStatus component
    - Integrate MatchFoundModal component
    - Handle queue state transitions
    - _Requirements: 1.1, 1.5_

- [x] 13. WebSocket Type Definitions
  - [x] 13.1 Types defined inline in useMatchmaking hook
    - Add `QueueJoinedPayload` type
    - Add `QueueStatusPayload` type
    - Add `MatchFoundPayload` type
    - _Requirements: 1.6, 4.3_

- [x] 14. Checkpoint - Ensure all tests pass
  - Frontend builds successfully

## Phase 4: Integration and Polish

- [ ] 15. Integration Testing
  - [ ] 15.1 Test full queue → match → lobby flow
    - Verify two players can queue and get matched
    - Verify lobby is created correctly
    - Verify both players navigate to game
    - _Requirements: 4.1, 4.2, 4.5_

- [ ] 16. Early Leave Detection
  - [ ] 16.1 Implement early leave tracking in game end handler
    - Detect if game ended within 60 seconds of start
    - Apply cooldown via MatchmakingService
    - Increment early_leave_count in user_profiles
    - _Requirements: 9.1, 9.2, 9.7_

- [ ] 17. Queue Recovery
  - [x] 17.1 Implement queue restoration on server startup
    - Load active tickets from database on MatchmakingService init
    - Filter out expired tickets (>10 minutes old)
    - Restore to in-memory queue
    - _Requirements: 8.2, 8.3, 8.4_

- [ ] 18. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
