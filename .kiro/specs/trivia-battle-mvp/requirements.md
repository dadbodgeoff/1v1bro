# Requirements Document

## Introduction

This document defines the requirements for a real-time 1v1 trivia battle platform (working title: "1v1 Bro"). The system enables two players to compete in synchronized quiz matches with 15 questions per game. Players join via lobby codes, experience synchronized timers and questions, and see live results. The MVP focuses on Fortnite-themed questions with plans to expand to AI-generated custom topics for premium users.

The platform uses FastAPI with WebSockets for real-time game synchronization, Supabase for authentication and data persistence, and a React PWA frontend proxied through Nginx on Digital Ocean.

## Glossary

- **Lobby**: A virtual waiting room identified by a unique 6-character code where two players gather before starting a game
- **Host**: The player who creates a lobby and has the ability to start the game
- **Opponent**: The player who joins an existing lobby using the lobby code
- **Game Session**: An active match consisting of 15 questions played between two synchronized players
- **Round**: A single question within a game session, including the 30-second answer window
- **WebSocket Manager**: Server-side component that maintains real-time connections and broadcasts game state to connected players
- **Sync Point**: A moment where the server ensures both players are aligned (question start, round end, game end)
- **PWA**: Progressive Web App - a web application that can be installed and used like a native mobile app

## Requirements

### Requirement 1: User Authentication

**User Story:** As a player, I want to authenticate with the platform, so that my game history and scores are tracked.

#### Acceptance Criteria

1. WHEN a user visits the platform without authentication THEN the System SHALL display login and registration options
2. WHEN a user submits valid credentials THEN the System SHALL authenticate via Supabase Auth and establish a session
3. WHEN a user submits invalid credentials THEN the System SHALL display an error message without revealing whether email or password was incorrect
4. WHEN an authenticated user's session expires THEN the System SHALL redirect to login and preserve the intended destination
5. WHEN a user requests logout THEN the System SHALL invalidate the session and clear local authentication state

### Requirement 2: Lobby Creation

**User Story:** As a host, I want to create a game lobby, so that I can invite an opponent to play.

#### Acceptance Criteria

1. WHEN an authenticated user requests to create a lobby THEN the System SHALL generate a unique 6-character alphanumeric code
2. WHEN a lobby is created THEN the System SHALL store the lobby with status "waiting" and associate it with the host
3. WHEN a lobby is created THEN the System SHALL establish a WebSocket connection for the host
4. WHEN a lobby code is generated THEN the System SHALL ensure the code does not conflict with any active lobby codes
5. WHEN a host disconnects from a waiting lobby THEN the System SHALL mark the lobby as abandoned after 60 seconds

### Requirement 3: Lobby Joining

**User Story:** As an opponent, I want to join a lobby using a code, so that I can compete against the host.

#### Acceptance Criteria

1. WHEN a user enters a valid lobby code THEN the System SHALL add the user to the lobby and establish a WebSocket connection
2. WHEN a user enters an invalid or expired lobby code THEN the System SHALL display an error message indicating the lobby was not found
3. WHEN a user attempts to join a full lobby THEN the System SHALL reject the join request with an appropriate message
4. WHEN a second player joins a lobby THEN the System SHALL notify the host via WebSocket that an opponent has joined
5. WHEN a player joins a lobby THEN the System SHALL broadcast the updated player list to all connected clients

### Requirement 4: Game Synchronization

**User Story:** As a player, I want the game to be perfectly synchronized with my opponent, so that we have a fair competition.

#### Acceptance Criteria

1. WHEN the host starts a game THEN the System SHALL broadcast a "game_start" event to all connected players simultaneously
2. WHEN a new question begins THEN the System SHALL send the question with a server timestamp to both players
3. WHEN displaying a question THEN the Client SHALL calculate remaining time based on the server-provided start timestamp
4. WHEN the 30-second timer expires THEN the System SHALL treat unanswered questions as incorrect for scoring
5. WHEN both players have answered OR the timer expires THEN the System SHALL broadcast round results to both players
6. WHEN transitioning between questions THEN the System SHALL wait for a 3-second delay before sending the next question

### Requirement 5: Question Delivery

**User Story:** As a player, I want to receive trivia questions with multiple choice answers, so that I can compete in the quiz.

#### Acceptance Criteria

1. WHEN a game starts THEN the System SHALL load 15 questions for the game session
2. WHEN a question is delivered THEN the System SHALL include question text, four answer options, and the question number
3. WHEN delivering questions THEN the System SHALL send questions in the same order to both players
4. WHEN a question is displayed THEN the System SHALL randomize the order of answer options consistently for both players
5. WHEN all 15 questions have been answered THEN the System SHALL trigger the game end sequence

### Requirement 6: Answer Submission and Scoring

**User Story:** As a player, I want to submit my answer and see my score, so that I know how I'm performing.

#### Acceptance Criteria

1. WHEN a player submits an answer THEN the System SHALL record the answer and the time taken in milliseconds
2. WHEN a player submits a correct answer THEN the System SHALL calculate score as (1000 - (time_ms / 30)) points
3. WHEN a player submits an incorrect answer THEN the System SHALL award zero points for that round
4. WHEN a player fails to answer within 30 seconds THEN the System SHALL record a timeout and award zero points
5. WHEN a round ends THEN the System SHALL broadcast the correct answer and updated scores to both players

### Requirement 7: Game Results

**User Story:** As a player, I want to see the final results after a game, so that I know who won.

#### Acceptance Criteria

1. WHEN all questions are completed THEN the System SHALL calculate final scores for both players
2. WHEN the game ends THEN the System SHALL broadcast a "game_end" event with winner and final scores
3. WHEN the game ends THEN the System SHALL persist the game results to the database
4. WHEN displaying results THEN the System SHALL show each player's final score and the winner
5. WHEN a game ends THEN the System SHALL provide options to play again or return to the main menu

### Requirement 8: WebSocket Connection Management

**User Story:** As a player, I want stable real-time communication, so that the game doesn't lag or disconnect unexpectedly.

#### Acceptance Criteria

1. WHEN a WebSocket connection is established THEN the System SHALL associate it with the authenticated user and lobby
2. WHEN a player disconnects during a game THEN the System SHALL pause the game and notify the opponent
3. WHEN a disconnected player reconnects within 30 seconds THEN the System SHALL restore their game state
4. WHEN a player fails to reconnect within 30 seconds THEN the System SHALL forfeit the game to the remaining player
5. WHEN sending WebSocket messages THEN the System SHALL use a consistent JSON message format with type and payload fields

### Requirement 9: API Structure

**User Story:** As a developer, I want a well-structured API, so that the frontend can interact with the backend reliably.

#### Acceptance Criteria

1. WHEN the API receives a request THEN the System SHALL validate the request against defined Pydantic schemas
2. WHEN the API returns a response THEN the System SHALL use a standardized response envelope with status, data, and error fields
3. WHEN an error occurs THEN the System SHALL return appropriate HTTP status codes and descriptive error messages
4. WHEN a protected endpoint is accessed THEN the System SHALL verify the Supabase JWT token
5. WHEN the API starts THEN the System SHALL expose endpoints under the /api/v1 prefix

### Requirement 10: Data Persistence

**User Story:** As a player, I want my game history saved, so that I can track my performance over time.

#### Acceptance Criteria

1. WHEN a game completes THEN the System SHALL store the game record with both player IDs, scores, and timestamp
2. WHEN storing game data THEN the System SHALL include the questions and answers for that session
3. WHEN a user requests their game history THEN the System SHALL return their past games with results
4. WHEN storing lobby data THEN the System SHALL track lobby status transitions (waiting, in_progress, completed)
5. WHEN a lobby is abandoned THEN the System SHALL mark it as expired rather than deleting it
