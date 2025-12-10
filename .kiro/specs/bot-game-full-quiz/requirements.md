# Requirements Document

## Introduction

This feature ensures the Bot Game (practice mode) provides a complete trivia experience by properly fetching questions from the database for the selected category. Currently, the bot game falls back to 10 hardcoded Fortnite questions when the API fails or returns empty results, and there may be issues with category filtering causing NFL category to return Fortnite questions. The goal is to ensure players get a full playthrough of all available quizzes in their selected category with proper category isolation.

## Glossary

- **Bot_Game**: The single-player practice mode where users play against an AI opponent
- **Category**: A trivia topic (e.g., 'fortnite', 'nfl') that groups related questions
- **Practice_API**: The `/api/v1/questions/practice/{category}` endpoint that returns questions with answers
- **Fallback_Questions**: Hardcoded questions used when the API fails (currently 10 Fortnite questions)
- **Question_Pool**: The complete set of questions available in the database for a category

## Requirements

### Requirement 1

**User Story:** As a player, I want the bot game to fetch questions from my selected category, so that I get relevant trivia for the topic I chose.

#### Acceptance Criteria

1. WHEN a user selects a category and starts a bot game THEN the Bot_Game SHALL request questions from the Practice_API with the selected category slug
2. WHEN the Practice_API returns questions THEN the Bot_Game SHALL use only those questions for the game session
3. WHEN a user selects the NFL category THEN the Bot_Game SHALL display only NFL-related questions
4. WHEN a user selects the Fortnite category THEN the Bot_Game SHALL display only Fortnite-related questions

### Requirement 2

**User Story:** As a player, I want to play through more than 10 questions per session, so that I can have a longer and more engaging practice experience.

#### Acceptance Criteria

1. WHEN starting a bot game THEN the Bot_Game SHALL request a configurable number of questions (default 15)
2. WHEN the question pool for a category contains fewer questions than requested THEN the Bot_Game SHALL use all available questions
3. WHEN displaying game progress THEN the Bot_Game SHALL show the correct total question count based on questions received

### Requirement 3

**User Story:** As a player, I want graceful error handling when questions cannot be loaded, so that I can still play even if there are technical issues.

#### Acceptance Criteria

1. IF the Practice_API returns an error THEN the Bot_Game SHALL display an error message to the user
2. IF the Practice_API returns zero questions for a category THEN the Bot_Game SHALL inform the user that no questions are available for that category
3. IF network connectivity fails THEN the Bot_Game SHALL allow retry or category change without crashing

### Requirement 4

**User Story:** As a player, I want to see accurate category information before starting, so that I know how many questions are available.

#### Acceptance Criteria

1. WHEN displaying category selection THEN the Bot_Game SHALL show the actual question count from the categories API
2. WHEN a category has zero questions THEN the Bot_Game SHALL disable selection or show a warning for that category
