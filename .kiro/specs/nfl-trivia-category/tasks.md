# Implementation Plan

## Task 1: Create NFL Question CSV Parser

- [x] 1.1 Create `scripts/parse_nfl_questions.py` parser script
  - Read CSV files using Python csv module with proper quoting handling
  - Extract ID, Category, Question, Option A-D, Correct Answer columns
  - Handle quoted fields containing commas
  - _Requirements: 1.1, 1.2, 7.1_

- [x] 1.2 Implement correct answer index mapping
  - Match correct answer text to one of the four options
  - Return index 0-3 based on which option matches
  - Handle case-insensitive matching
  - _Requirements: 1.3, 7.2_

- [x] 1.3 Implement category slugification
  - Convert "Recent Playoffs & Super Bowls" to "recent_playoffs_super_bowls"
  - Remove special characters, lowercase, replace spaces with underscores
  - _Requirements: 1.4, 2.2_

- [x] 1.4 Write property test for correct answer mapping
  - **Property 2: Correct Answer Index Mapping**
  - Generate random options and correct answer matching one option
  - Verify correct_index matches the option position
  - **Validates: Requirements 1.3, 7.2**

- [x] 1.5 Write property test for category slug consistency
  - **Property 3: Category Slug Consistency**
  - Generate random category name strings
  - Verify slug is lowercase, alphanumeric with underscores only
  - **Validates: Requirements 1.4, 2.2**

---

## Task 2: Implement Question Import to Database

- [x] 2.1 Add NFL subcategory creation logic
  - Get or create "nfl" category if not exists
  - Create subcategories from unique Category column values
  - Link questions to appropriate subcategory_id
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2.2 Implement duplicate detection and skipping
  - Check existing questions by text before insert
  - Skip duplicates, log count of skipped
  - Report total imported vs skipped at end
  - _Requirements: 1.5, 7.4_

- [x] 2.3 Write property test for duplicate prevention
  - **Property 4: Duplicate Prevention Idempotency**
  - Insert same question set twice
  - Verify total count equals single insert count
  - Note: Tested via import process - duplicate detection implemented in parse_nfl_questions.py
  - **Validates: Requirements 1.5**

- [x] 2.4 Implement pretty printer for verification
  - Format question with text, options A-D, correct answer highlighted
  - Include category and subcategory labels
  - _Requirements: 9.1, 9.2_

- [x] 2.5 Write property test for round-trip parsing
  - **Property 1: CSV Parsing Round-Trip**
  - Generate random question dicts
  - Format to CSV row, parse back, verify equivalence
  - **Validates: Requirements 9.3**

---

## Task 3: Checkpoint - Parser Tests Pass

- [x] 3.1 Ensure all tests pass, ask the user if questions arise.

---

## Task 4: Run NFL Question Import

- [x] 4.1 Execute parser on both NFL CSV files
  - Run parser on `nfl_trivia_500_questions.csv`
  - Run parser on `nfl_trivia_500_questions_part2.csv`
  - Verify ~1000 questions imported
  - _Requirements: 1.1_

- [x] 4.2 Verify question counts in database
  - Query question_categories for nfl question_count
  - Query question_subcategories for breakdown
  - Log warning if any category has < 50 questions
  - _Requirements: 6.1, 6.2, 6.3_

---

## Task 5: Add Category to Lobby Schema

- [x] 5.1 Create database migration for lobby category
  - Add `category` column to lobbies table
  - Default to 'fortnite' for backwards compatibility
  - Add foreign key reference to question_categories(slug)
  - _Requirements: 4.1_

- [x] 5.2 Update LobbyService to handle category
  - Accept category parameter in create_lobby
  - Include category in get_lobby response
  - Store category when lobby is created from matchmaking
  - _Requirements: 4.1, 4.2_

---

## Task 6: Update Matchmaking for Category Queues

- [x] 6.1 Add category parameter to matchmaking join
  - Update join_queue to accept category parameter
  - Store category with queue entry
  - Default to 'fortnite' if not provided
  - _Requirements: 3.1, 3.2, 11.1_

- [x] 6.2 Implement category-filtered matching
  - Only match players with same category
  - Create lobby with matched category
  - Pass category to lobby creation
  - _Requirements: 3.3, 3.5, 11.2_

- [x] 6.3 Write property test for matchmaking isolation
  - **Property 5: Category-Based Matchmaking Isolation**
  - Generate random queue with mixed categories
  - Verify matches only occur within same category
  - **Validates: Requirements 3.3, 3.5, 11.2**

---

## Task 7: Update Question Loading for Lobby Category

- [x] 7.1 Update game session creation to use lobby category
  - Get category from lobby when creating session
  - Pass category to question_service.load_questions_async
  - _Requirements: 5.1, 5.2_

- [x] 7.2 Update QuestionService to require category
  - Remove default category parameter
  - Validate category exists before loading
  - Fall back to fortnite if category invalid
  - _Requirements: 5.2, 5.3_

- [x] 7.3 Write property test for lobby category immutability
  - **Property 6: Lobby Category Immutability**
  - Create lobby with category, load questions
  - Verify all questions match lobby category
  - **Validates: Requirements 4.1, 5.1, 5.2**

---

## Task 8: Update WebSocket Events

- [x] 8.1 Add category to lobby_state event
  - Include category field in build_lobby_state
  - Fetch category from lobby data
  - _Requirements: 4.4, 10.1_

- [x] 8.2 Add category to game_start event
  - Include category field in build_game_start
  - Pass category from lobby to event builder
  - _Requirements: 10.2_

- [x] 8.3 Write property test for event category inclusion
  - **Property 7: WebSocket Event Category Inclusion**
  - Generate random lobby states with categories
  - Verify all events include non-null category field
  - **Validates: Requirements 4.4, 10.1, 10.2**

---

## Task 9: Checkpoint - Backend Tests Pass

- [x] 9.1 Ensure all tests pass, ask the user if questions arise.

---

## Task 10: Frontend Category Selector Component

- [x] 10.1 Create CategorySelector component
  - Display available categories with icons
  - Show question count for each category
  - Highlight selected category
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 10.2 Fetch categories from API
  - Call GET /api/v1/questions/categories
  - Display loading state while fetching
  - Handle error state gracefully
  - _Requirements: 6.1_

---

## Task 11: Update Find Match Flow

- [x] 11.1 Add category selection before queue join
  - Show CategorySelector before "Find Match" button
  - Require category selection to enable button
  - Store selected category in state
  - _Requirements: 3.1, 3.2_

- [x] 11.2 Pass category to matchmaking WebSocket
  - Include category in join_queue message
  - Display selected category while searching
  - _Requirements: 3.4, 11.1, 11.4_

- [x] 11.3 Update lobby display to show category
  - Display category icon and name in lobby header
  - Show category in head-to-head display
  - _Requirements: 4.2, 4.3_

---

## Task 12: Final Checkpoint

- [x] 12.1 Ensure all tests pass, ask the user if questions arise.
