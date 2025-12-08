# Requirements Document

## Introduction

This feature adds NFL trivia as a second question category alongside Fortnite, allowing players to choose their preferred trivia topic when playing matches. The system will convert 1000 NFL trivia questions from CSV format into the existing database schema and add category selection to the lobby/matchmaking flow.

## Glossary

- **Question Category**: A top-level grouping of trivia questions (e.g., "fortnite", "nfl")
- **Question Subcategory**: A secondary grouping within a category (e.g., "Super Bowls", "2024 Season")
- **Quiz System**: The backend service that loads and serves questions during matches
- **Lobby**: The pre-game waiting room where players ready up before a match
- **CSV Parser**: Script that converts raw CSV question data into database-ready format

## Requirements

### Requirement 1

**User Story:** As a developer, I want to convert NFL trivia CSV files into the database format, so that questions can be served during matches.

#### Acceptance Criteria

1. WHEN the parser script runs THEN the system SHALL read both NFL CSV files and parse all 1000 questions
2. WHEN parsing a CSV row THEN the system SHALL extract question text, 4 options (A-D), and correct answer
3. WHEN parsing the correct answer column THEN the system SHALL convert the answer text to a correct_index (0-3)
4. WHEN a question has a Category column THEN the system SHALL map it to a subcategory slug
5. WHEN inserting questions THEN the system SHALL skip duplicates based on question text

### Requirement 2

**User Story:** As a developer, I want NFL subcategories created automatically, so that questions are organized properly.

#### Acceptance Criteria

1. WHEN the parser encounters a new Category value THEN the system SHALL create a subcategory if it doesn't exist
2. WHEN creating subcategories THEN the system SHALL use slugified versions of category names
3. WHEN questions are inserted THEN the system SHALL link them to the appropriate subcategory

### Requirement 3

**User Story:** As a player, I want to select a trivia category before searching for a match, so that I'm matched with opponents who want the same topic.

#### Acceptance Criteria

1. WHEN a player clicks "Find Match" THEN the system SHALL require them to select a category first (Fortnite or NFL)
2. WHEN no category is selected THEN the system SHALL default to Fortnite
3. WHEN searching for a match THEN the system SHALL only match players with the same category selection
4. WHEN a player is in queue THEN the system SHALL display their selected category
5. WHEN matched with an opponent THEN the system SHALL guarantee both players have the same category

### Requirement 4

**User Story:** As a player, I want to see the match category in the lobby, so that I know what trivia topic we're playing.

#### Acceptance Criteria

1. WHEN the lobby is created THEN the system SHALL store the category as a lobby property
2. WHEN a player joins the lobby THEN the system SHALL display the lobby's trivia category
3. WHEN displaying the category THEN the system SHALL show a visual indicator (icon and label)
4. WHEN the lobby state is broadcast THEN the system SHALL include the lobby's category

### Requirement 5

**User Story:** As a player, I want questions from the lobby's category during the match, so that both players answer the same topic.

#### Acceptance Criteria

1. WHEN the game starts THEN the system SHALL load questions from the lobby's category
2. WHEN loading questions THEN the system SHALL fetch from the single shared category
3. WHEN the lobby has no category set THEN the system SHALL use the default category (Fortnite)
4. WHEN questions are served THEN the system SHALL avoid recently shown questions for both users

### Requirement 6

**User Story:** As a system administrator, I want question counts per category visible, so that I can ensure adequate content.

#### Acceptance Criteria

1. WHEN categories are queried THEN the system SHALL return the question_count for each
2. WHEN questions are added THEN the system SHALL update the category question_count automatically
3. WHEN a category has fewer than 50 questions THEN the system SHALL log a warning

### Requirement 7

**User Story:** As a developer, I want the parser to handle CSV edge cases, so that all questions import correctly.

#### Acceptance Criteria

1. WHEN a CSV row has quoted fields with commas THEN the system SHALL parse them correctly
2. WHEN the correct answer contains the full option text THEN the system SHALL match it to the correct index
3. WHEN a row is malformed THEN the system SHALL skip it and log a warning
4. WHEN the parser completes THEN the system SHALL report total imported and skipped counts

### Requirement 8

**User Story:** As a player, I want the category selection UI to be intuitive, so that I can quickly choose my preference.

#### Acceptance Criteria

1. WHEN displaying category options THEN the system SHALL show category name and icon
2. WHEN a category is selected THEN the system SHALL highlight it visually
3. WHEN hovering over a category THEN the system SHALL show the question count available

### Requirement 9

**User Story:** As a developer, I want the pretty printer to output questions in a readable format, so that I can verify imports.

#### Acceptance Criteria

1. WHEN printing a question THEN the system SHALL format it with text, options, and correct answer
2. WHEN printing questions THEN the system SHALL include category and subcategory labels
3. WHEN round-tripping (parse then print) THEN the system SHALL produce equivalent output

### Requirement 10

**User Story:** As a developer, I want the WebSocket events to include category data, so that the frontend can display the match topic.

#### Acceptance Criteria

1. WHEN building lobby_state event THEN the system SHALL include the lobby's category
2. WHEN building game_start event THEN the system SHALL include the category being used for the match
3. WHEN building question events THEN the system SHALL include the category for context

### Requirement 11

**User Story:** As a player, I want separate matchmaking queues per category, so that I'm matched quickly with like-minded players.

#### Acceptance Criteria

1. WHEN a player searches for a match THEN the system SHALL add them to the category-specific queue
2. WHEN matching players THEN the system SHALL only consider players in the same category queue
3. WHEN a player cancels search THEN the system SHALL remove them from their category queue
4. WHEN displaying queue status THEN the system SHALL show the selected category
