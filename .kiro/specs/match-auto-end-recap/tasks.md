# Implementation Plan

- [x] 1. Create RecapPayload data models and RecapBuilder service
  - [x] 1.1 Create Pydantic schemas for RecapPayload and nested types
    - Create `backend/app/schemas/recap.py` with XPBreakdown, TierProgress, QuestionStats, CombatStats, OpponentData, RecapPayload models
    - _Requirements: 7.1, 7.2_
  - [x] 1.2 Write property test for recap serialization round-trip
    - **Property 1: Recap Serialization Round-Trip**
    - **Validates: Requirements 7.1, 7.2, 7.4**
  - [x] 1.3 Create RecapBuilder service
    - Create `backend/app/services/recap_builder.py` with build_recap(), calculate_question_stats(), calculate_combat_stats() methods
    - _Requirements: 2.2, 4.2, 5.2_
  - [x] 1.4 Write property test for XP breakdown sum consistency
    - **Property 2: XP Breakdown Sum Consistency**
    - **Validates: Requirements 2.2, 2.5**
  - [x] 1.5 Write property test for question accuracy calculation
    - **Property 3: Question Accuracy Calculation**
    - **Validates: Requirements 4.2, 4.5**
  - [x] 1.6 Write property test for K/D ratio calculation
    - **Property 4: K/D Ratio Calculation**
    - **Validates: Requirements 5.2, 5.5**
  - [x] 1.7 Write property test for shot accuracy calculation
    - **Property 5: Shot Accuracy Calculation**
    - **Validates: Requirements 5.4, 5.5**

- [x] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Add database schema for recap_data persistence
  - [x] 3.1 Create migration to add recap_data JSONB column to games table
    - Create `backend/app/database/migrations/023_recap_data.sql` with ALTER TABLE and index
    - _Requirements: 7.3_
  - [x] 3.2 Update GamePersistenceService to save recap_data
    - Add save_recap_data() method to `backend/app/services/game/persistence.py`
    - _Requirements: 7.3_

- [x] 4. Enhance GameService to build and include recap in game end
  - [x] 4.1 Integrate RecapBuilder into GameService.end_game()
    - Modify `backend/app/services/game/game_service.py` to build RecapPayload for both players
    - Call RecapBuilder with session data, XP results, and combat stats
    - _Requirements: 1.4, 2.5, 3.5, 4.5, 5.5, 6.6_
  - [x] 4.2 Write property test for RecapPayload completeness
    - **Property 6: RecapPayload Completeness**
    - **Validates: Requirements 2.5, 3.5, 4.5, 5.5, 6.6**
  - [x] 4.3 Persist recap_data to database in end_game()
    - Call persistence.save_recap_data() with both player recaps
    - _Requirements: 7.3_

- [x] 5. Enhance QuizHandler for final question detection
  - [x] 5.1 Add is_final_question flag to round_result event
    - Modify `backend/app/websocket/handlers/quiz.py` process_round_end() to detect Q15
    - Update build_round_result() in events.py to accept is_final_question parameter
    - _Requirements: 1.5_
  - [x] 5.2 Write property test for final question flag
    - **Property 7: Final Question Flag**
    - **Validates: Requirements 1.5**

- [x] 6. Enhance WebSocket game_end event with recap data
  - [x] 6.1 Update build_game_end() to include recaps parameter
    - Modify `backend/app/websocket/events.py` build_game_end() to accept and include recaps dict
    - _Requirements: 2.5, 3.5, 4.5, 5.5, 6.6_
  - [x] 6.2 Update QuizHandler.process_game_end() to broadcast recaps
    - Pass recaps from GameResult to build_game_end()
    - _Requirements: 1.2_
  - [x] 6.3 Write property test for game end trigger after Q15
    - **Property 8: Game End Trigger After Q15**
    - **Validates: Requirements 1.1**

- [x] 7. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Create TypeScript types for recap data
  - [x] 8.1 Create recap types file
    - Create `frontend/src/types/recap.ts` with XPBreakdown, TierProgress, QuestionStats, CombatStats, OpponentData, RecapPayload interfaces
    - _Requirements: 7.4_
  - [x] 8.2 Update WebSocket payload types
    - Update `frontend/src/types/websocket.ts` to include RecapPayload in GameEndPayload
    - _Requirements: 2.5_

- [x] 9. Update gameStore to handle recap data
  - [x] 9.1 Add recap state to gameStore
    - Modify `frontend/src/stores/gameStore.ts` to add recap: RecapPayload | null state
    - Add setRecap() action
    - _Requirements: 1.2_
  - [x] 9.2 Update useQuizEvents to extract and store recap
    - Modify `frontend/src/hooks/arena/useQuizEvents.ts` game_end handler to extract player's recap from payload
    - Call setRecap() with the player's recap data
    - _Requirements: 1.2_

- [x] 10. Create recap display components
  - [x] 10.1 Create XPBreakdownCard component
    - Create `frontend/src/components/recap/XPBreakdownCard.tsx` with animated counter and breakdown display
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 10.2 Create TierProgressCard component
    - Create `frontend/src/components/recap/TierProgressCard.tsx` with progress bar and tier-up celebration
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 10.3 Create QuestionStatsCard component
    - Create `frontend/src/components/recap/QuestionStatsCard.tsx` with accuracy display and Perfect badge
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 10.4 Create CombatStatsCard component
    - Create `frontend/src/components/recap/CombatStatsCard.tsx` with K/D ratio and streak display
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 10.5 Create component index file
    - Create `frontend/src/components/recap/index.ts` exporting all recap components
    - _Requirements: N/A_

- [x] 11. Enhance Results page with full recap UI
  - [x] 11.1 Update Results page to display recap components
    - Modify `frontend/src/pages/Results.tsx` to use recap from gameStore
    - Add XPBreakdownCard, TierProgressCard, QuestionStatsCard, CombatStatsCard
    - Add opponent comparison section with scores and stats
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 11.2 Add graceful degradation for missing recap data
    - Show basic results (current behavior) if recap is null
    - Hide individual sections if their data is missing
    - _Requirements: 1.2_
  - [x] 11.3 Update navigation buttons
    - Ensure "Play Again" resets state and navigates to matchmaking
    - Ensure "Return to Dashboard" resets all state and navigates to dashboard
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [x] 11.4 Add auto-dismiss timeout
    - Add 60-second inactivity timer that navigates to dashboard
    - _Requirements: 8.5_

- [x] 12. Update match history to include recap data
  - [x] 12.1 Update match history API to return recap_data
    - Modify `backend/app/services/game/persistence.py` get_user_history() to include recap_data
    - _Requirements: 7.5_
  - [x] 12.2 Update MatchHistory page to display recap data
    - Modify `frontend/src/pages/MatchHistory.tsx` to show recap summary for each match
    - _Requirements: 7.5_

- [x] 13. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
