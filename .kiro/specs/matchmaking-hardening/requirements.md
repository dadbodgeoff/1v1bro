# Requirements Document

## Introduction

This specification defines enterprise-grade hardening for the matchmaking system to eliminate edge cases that can leave players in inconsistent states. The primary issue addressed is the scenario where a match is created but one player never receives the notification, leaving them stuck in queue while their opponent loads into an empty lobby.

The hardening covers: connection health verification, atomic match creation with rollback, stale connection cleanup, and client-side resilience.

## Glossary

- **Matchmaking_System**: The backend service that manages the queue, finds matches, and creates lobbies for matched players
- **Queue_Manager**: The in-memory component that tracks players waiting for matches
- **Connection_Manager**: The WebSocket manager that tracks active connections and sends messages to users
- **Match_Ticket**: A record representing a player's position in the matchmaking queue
- **Match_Found_Event**: The notification sent to both players when a match is created
- **Stale_Connection**: A WebSocket connection that appears open but can no longer deliver messages
- **Atomic_Match**: A match creation process that either succeeds completely for both players or rolls back entirely

## Requirements

### Requirement 1

**User Story:** As a player in the matchmaking queue, I want the system to verify my connection is healthy before matching me, so that I never miss a match notification.

#### Acceptance Criteria

1. WHEN the Matchmaking_System finds two players to match THEN the Matchmaking_System SHALL verify both players have active WebSocket connections before creating the lobby
2. WHEN a player's WebSocket connection is not active at match time THEN the Matchmaking_System SHALL skip that player and re-queue the other player
3. WHEN verifying connection health THEN the Matchmaking_System SHALL use a ping-pong exchange with a 2-second timeout to confirm the connection is responsive
4. IF a player fails the connection health check THEN the Matchmaking_System SHALL remove that player from the queue and clean up their database ticket

### Requirement 2

**User Story:** As a player, I want match creation to be atomic, so that either both players are successfully notified or neither player's state changes.

#### Acceptance Criteria

1. WHEN creating a match THEN the Matchmaking_System SHALL send Match_Found_Event to both players and confirm delivery before finalizing the lobby
2. IF the Match_Found_Event fails to deliver to either player THEN the Matchmaking_System SHALL cancel the lobby and re-queue the player who was successfully notified
3. WHEN a match notification fails THEN the Matchmaking_System SHALL log the failure with player IDs and connection state for debugging
4. WHEN rolling back a failed match THEN the Matchmaking_System SHALL restore the successfully-notified player to their original queue position

### Requirement 3

**User Story:** As a player waiting in queue for an extended period, I want the system to detect if my connection becomes stale, so that I'm not matched when I can't receive notifications.

#### Acceptance Criteria

1. WHILE a player is in the matchmaking queue THEN the Matchmaking_System SHALL send periodic heartbeat pings every 15 seconds
2. WHEN a player fails to respond to 2 consecutive heartbeat pings THEN the Matchmaking_System SHALL mark that player's connection as stale
3. WHEN a player's connection is marked stale THEN the Matchmaking_System SHALL remove them from the queue and send a queue_cancelled event
4. WHEN a stale player's WebSocket reconnects THEN the Matchmaking_System SHALL allow them to rejoin the queue from scratch

### Requirement 4

**User Story:** As a player, I want the client to detect connection issues and automatically attempt recovery, so that I don't get stuck in a broken queue state.

#### Acceptance Criteria

1. WHEN the client WebSocket connection closes unexpectedly THEN the Client SHALL attempt to reconnect up to 3 times with exponential backoff
2. WHEN the client successfully reconnects THEN the Client SHALL check queue status and resync state with the server
3. WHEN the client fails all reconnection attempts THEN the Client SHALL display an error message and reset to idle state
4. WHEN the client receives no heartbeat response for 30 seconds THEN the Client SHALL consider the connection dead and trigger reconnection

### Requirement 5

**User Story:** As a system operator, I want comprehensive logging of matchmaking edge cases, so that I can diagnose and fix issues in production.

#### Acceptance Criteria

1. WHEN a match creation fails THEN the Matchmaking_System SHALL log the failure reason, both player IDs, connection states, and timestamps
2. WHEN a player is removed due to stale connection THEN the Matchmaking_System SHALL log the player ID, time in queue, and last successful heartbeat
3. WHEN a rollback occurs THEN the Matchmaking_System SHALL log the rollback reason and which player was re-queued
4. WHEN connection health check fails THEN the Matchmaking_System SHALL log the player ID and failure type (not connected, ping timeout, send failed)

### Requirement 6

**User Story:** As a player who was in a failed match, I want to be notified of what happened, so that I understand why I'm back in queue or need to rejoin.

#### Acceptance Criteria

1. WHEN a player is re-queued due to opponent connection failure THEN the Matchmaking_System SHALL send a match_cancelled event with reason "opponent_disconnected"
2. WHEN a player is removed due to their own stale connection THEN the Matchmaking_System SHALL send a queue_timeout event when they reconnect
3. WHEN a match rollback occurs THEN the Matchmaking_System SHALL notify the affected player within 1 second of the rollback decision
