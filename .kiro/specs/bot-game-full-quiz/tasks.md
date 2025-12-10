# Implementation Plan

- [x] 1. Update BotGame question fetching and error handling
  - [x] 1.1 Remove FALLBACK_QUESTIONS constant and update QUESTIONS_PER_GAME to 15
    - Remove the hardcoded `FALLBACK_QUESTIONS` array
    - Change `QUESTIONS_PER_GAME` from 10 to 15
    - _Requirements: 2.1_
  - [x] 1.2 Add error state management for question loading
    - Add `questionsError` state variable
    - Update `fetchQuestions` to set error state on API failure
    - Handle empty questions array as a distinct state
    - _Requirements: 3.1, 3.2_
  - [x] 1.3 Update fetchQuestions to properly handle all response cases
    - Remove fallback to `FALLBACK_QUESTIONS` on error
    - Set appropriate error messages for different failure modes
    - Ensure category slug is correctly passed in API URL
    - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3_
  - [x] 1.4 Write property test for API request category correctness
    - **Property 1: API Request Category Correctness**
    - **Validates: Requirements 1.1, 2.1**
  - [x] 1.5 Write property test for category isolation
    - **Property 2: Category Isolation**
    - **Validates: Requirements 1.2, 1.3, 1.4**

- [x] 2. Update pre-game UI for error states and category validation
  - [x] 2.1 Add error display in pre-game screen
    - Show error message when questions fail to load
    - Add retry button for failed loads
    - Show "no questions available" message for empty categories
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 2.2 Add category validation in selection UI
    - Disable or warn for categories with zero questions
    - Show actual question counts from API
    - _Requirements: 4.1, 4.2_
  - [x] 2.3 Write property test for question count consistency
    - **Property 3: Question Count Consistency**
    - **Validates: Requirements 2.2, 2.3**
  - [x] 2.4 Write property test for category display accuracy
    - **Property 4: Category Display Accuracy**
    - **Validates: Requirements 4.1**

- [x] 3. Update game flow to handle dynamic question counts
  - [x] 3.1 Update game progress display to use actual question count
    - Use `questions.length` instead of hardcoded `QUESTIONS_PER_GAME` for progress
    - Update "Question X of Y" display
    - _Requirements: 2.2, 2.3_
  - [x] 3.2 Handle edge case of fewer questions than expected
    - Gracefully end game when questions run out
    - Show appropriate message if game is shorter than expected
    - _Requirements: 2.2_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Write unit tests for error handling
  - [x] 5.1 Test API error state rendering
    - Test that error message displays on API failure
    - Test retry button functionality
    - _Requirements: 3.1, 3.3_
  - [x] 5.2 Test empty category handling
    - Test "no questions available" message
    - Test category selection with zero-question categories
    - _Requirements: 3.2, 4.2_

- [x] 6. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
