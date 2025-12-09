# Requirements Document

## Introduction

This feature ensures that trivia quizzes feel fresh for players by implementing a robust question rotation system. With 1000+ Fortnite questions and 900+ NFL questions available, the system should intelligently select questions that players haven't seen recently, only allowing repeats when the question pool is exhausted. This creates a more engaging experience where players encounter new content in each match.

## Glossary

- **Question_Service**: The backend service responsible for loading and managing trivia questions
- **Questions_Repository**: The database layer handling question storage and retrieval
- **User_Question_History**: Database table tracking which questions each user has seen
- **Question_Pool**: The total set of available questions for a given category
- **Fresh_Question**: A question the user has not seen within the configured lookback period
- **Repeat_Question**: A question the user has previously seen within the lookback period
- **Lookback_Period**: The time window (in days) used to determine if a question is "fresh"
- **Category**: A question topic grouping (e.g., 'fortnite', 'nfl')

## Requirements

### Requirement 1

**User Story:** As a player, I want to see different questions each match, so that the game feels fresh and I'm not memorizing answers.

#### Acceptance Criteria

1. WHEN a match starts THEN the Question_Service SHALL select questions that the participating players have not seen within the Lookback_Period
2. WHEN fewer than 15 Fresh_Questions exist for both players THEN the Question_Service SHALL prioritize questions seen longest ago
3. WHEN a question is shown to a player THEN the Question_Service SHALL record the question ID, user ID, and timestamp in User_Question_History
4. WHEN recording question history THEN the Question_Service SHALL include the match_id for audit purposes

### Requirement 2

**User Story:** As a player, I want the system to track my answers, so that question selection can be personalized over time.

#### Acceptance Criteria

1. WHEN a player answers a question THEN the Question_Service SHALL record whether the answer was correct
2. WHEN a player answers a question THEN the Question_Service SHALL record the answer time in milliseconds
3. WHEN retrieving question history THEN the Questions_Repository SHALL return records ordered by most recent first

### Requirement 3

**User Story:** As a system administrator, I want configurable freshness parameters, so that I can tune the experience based on question pool size.

#### Acceptance Criteria

1. WHEN the Question_Service initializes THEN the system SHALL use a configurable Lookback_Period defaulting to 7 days
2. WHEN the question pool for a category has fewer than 100 questions THEN the system SHALL reduce the Lookback_Period proportionally
3. WHEN all questions in a category have been seen by a player THEN the system SHALL reset and allow all questions to be selected again

### Requirement 4

**User Story:** As a player in a 2-player match, I want fair question selection, so that neither player has an advantage from having seen questions before.

#### Acceptance Criteria

1. WHEN selecting questions for a match THEN the Question_Service SHALL exclude questions seen by either player within the Lookback_Period
2. WHEN one player has seen more questions than the other THEN the Question_Service SHALL prioritize questions fresh to both players
3. WHEN no questions are fresh for both players THEN the Question_Service SHALL select questions that are fresh for at least one player

### Requirement 5

**User Story:** As a developer, I want question analytics, so that I can identify problematic or overused questions.

#### Acceptance Criteria

1. WHEN a question is shown THEN the Questions_Repository SHALL increment the times_shown counter on the question record
2. WHEN a question is answered correctly THEN the Questions_Repository SHALL increment the times_correct counter
3. WHEN a question is answered THEN the Questions_Repository SHALL update the rolling average answer time
