# Requirements Document

## Introduction

This specification defines the Match Auto-End and Recap System for the 1v1bro gaming platform. The system ensures matches automatically terminate after the final question (question 15) is answered by both players, followed by a comprehensive post-match recap screen that provides players with meaningful feedback on their performance.

The current implementation has gaps:
1. The Results page (`frontend/src/pages/Results.tsx`) only shows basic win/loss and final scores
2. No XP breakdown is displayed to players after matches
3. No tier progress visualization on the results screen
4. No question accuracy statistics shown
5. No combat performance metrics (K/D, streaks, shot accuracy) displayed
6. No comparison view between player and opponent performance
7. Recap data is not persisted for match history viewing

This upgrade ensures players receive comprehensive feedback after every match, understand their progression impact, and can review detailed performance metrics. The recap screen becomes a key engagement point that reinforces the progression loop and encourages continued play.

## Glossary

- **Match_System**: The backend game service at `backend/app/services/game/game_service.py` managing match lifecycle
- **Recap_System**: The frontend and backend components responsible for generating and displaying post-match summaries
- **Quiz_Handler**: The WebSocket handler at `backend/app/websocket/handlers/quiz.py` managing question/answer flow
- **Game_End_Sequence**: The process triggered when all 15 questions are answered, including XP award, stats persistence, and client notification
- **XP_Breakdown**: The itemized calculation showing base XP, win bonus, kill bonus, and streak bonus components
- **Tier_Progress**: The player's current position within the Battle Pass tier system, including XP toward next tier
- **Question_Accuracy**: The ratio of correct answers to total questions, expressed as a percentage
- **Combat_Stats**: Player performance metrics including kills, deaths, K/D ratio, kill streaks, shots fired, and shot accuracy
- **Recap_Payload**: The JSON data structure containing all match statistics sent to clients via WebSocket
- **Match_History**: The persistent record of completed matches stored in the database for later viewing
- **Final_Question**: Question 15, the last question in a standard match
- **Auto_End**: Automatic match termination triggered when both players answer the final question

## Current State Analysis

| Component | Current Implementation | Problem |
|-----------|----------------------|---------|
| Results Page | Shows win/loss and final scores only | No XP, tier, accuracy, or combat stats |
| Game End Event | Sends winner_id, final_scores, is_tie | Missing XP breakdown and detailed stats |
| XP Award | Calculated and persisted server-side | Not displayed to player in recap |
| Tier Progress | Updated server-side after match | No visual feedback on results screen |
| Question Stats | Tracked in game session | Not included in game_end payload |
| Combat Stats | Tracked by CombatTracker | Not included in game_end payload |
| Match History | Basic game record stored | No detailed recap data persisted |

### Problems to Solve

1. **No XP Visibility**: Players complete matches but don't see how much XP they earned or why
2. **No Tier Feedback**: Players don't see tier advancement or progress toward next tier
3. **No Accuracy Stats**: Players can't evaluate their trivia performance
4. **No Combat Metrics**: Players can't assess their arena gameplay skills
5. **No Comparison View**: Players can't compare performance against opponent
6. **No Persistent Recap**: Match history doesn't include detailed performance data
7. **Basic Results UI**: Current results page lacks engagement and information density

---

## Requirements

### Requirement 1: Match Auto-End Trigger

**User Story:** As a player, I want the match to automatically end when question 15 is answered by both players, so that I don't have to wait or manually exit the game.

#### Acceptance Criteria

1.1. WHEN both players submit answers for question 15 THEN the Match_System SHALL trigger the game end sequence within 3 seconds of the last answer

1.2. WHEN the final round result is processed THEN the Match_System SHALL transition all connected players to the recap screen automatically

1.3. IF a player disconnects before question 15 is answered THEN the Match_System SHALL auto-submit a null answer for the disconnected player after the timeout period and proceed with game end

1.4. WHEN the game end sequence triggers THEN the Match_System SHALL persist all match statistics to the database before sending the game_end event to clients

1.5. WHEN question 15 round result is broadcast THEN the Match_System SHALL include a `is_final_question: true` flag to signal imminent game end

### Requirement 2: XP Earned Display

**User Story:** As a player, I want to see how much XP I earned from the match, so that I can track my progression toward battle pass rewards.

#### Acceptance Criteria

2.1. WHEN the recap screen displays THEN the Recap_System SHALL show the total XP earned from the match prominently

2.2. WHEN displaying XP earned THEN the Recap_System SHALL show a breakdown including: base_xp (win=100/loss=50), kill_bonus (5 per kill), streak_bonus (10 per streak), and duration_bonus

2.3. WHEN XP is awarded THEN the Recap_System SHALL animate the XP gain with a counting-up visual effect over 1.5 seconds

2.4. WHEN the player earned XP THEN the Recap_System SHALL display each XP component with its calculated value and label

2.5. WHEN the game_end event is sent THEN the Match_System SHALL include the complete XP calculation breakdown in the payload

### Requirement 3: Tier Progress Visualization

**User Story:** As a player, I want to see my battle pass tier progress, so that I understand how close I am to unlocking the next reward.

#### Acceptance Criteria

3.1. WHEN the recap screen displays THEN the Recap_System SHALL show the player's current tier number and tier name

3.2. WHEN the player advanced tiers during the match THEN the Recap_System SHALL display a tier-up celebration animation with the new tier badge

3.3. WHEN displaying tier progress THEN the Recap_System SHALL show a progress bar indicating current XP and XP required for next tier

3.4. WHEN the player unlocked new rewards THEN the Recap_System SHALL display preview thumbnails of newly claimable reward items

3.5. WHEN the game_end event is sent THEN the Match_System SHALL include previous_tier, new_tier, tier_advanced, and xp_to_next_tier in the payload

### Requirement 4: Question Accuracy Statistics

**User Story:** As a player, I want to see my question accuracy statistics, so that I can evaluate my trivia knowledge performance.

#### Acceptance Criteria

4.1. WHEN the recap screen displays THEN the Recap_System SHALL show the number of correct answers out of 15 total questions

4.2. WHEN displaying accuracy THEN the Recap_System SHALL show the accuracy as a percentage with one decimal place

4.3. WHEN displaying question stats THEN the Recap_System SHALL show average answer time in seconds

4.4. WHEN the player achieved 100% accuracy (15/15) THEN the Recap_System SHALL display a special "Perfect" badge with celebration effect

4.5. WHEN the game_end event is sent THEN the Match_System SHALL include correct_count, total_questions, accuracy_percent, and avg_answer_time_ms in the payload

### Requirement 5: Combat Performance Display

**User Story:** As a player, I want to see my combat performance (kills vs deaths), so that I can evaluate my arena gameplay skills.

#### Acceptance Criteria

5.1. WHEN the recap screen displays THEN the Recap_System SHALL show total kills and total deaths for the match

5.2. WHEN displaying combat stats THEN the Recap_System SHALL show the K/D ratio calculated as kills divided by deaths

5.3. WHEN the player achieved a kill streak of 3 or more THEN the Recap_System SHALL display the maximum streak achieved with a streak badge

5.4. WHEN displaying combat stats THEN the Recap_System SHALL show shots fired, shots hit, and shot accuracy percentage

5.5. WHEN the game_end event is sent THEN the Match_System SHALL include kills, deaths, max_streak, shots_fired, shots_hit, and shot_accuracy in the payload

### Requirement 6: Opponent Comparison View

**User Story:** As a player, I want to see a comparison with my opponent's performance, so that I can understand the competitive context of the match.

#### Acceptance Criteria

6.1. WHEN the recap screen displays THEN the Recap_System SHALL show both players' final scores side by side with player names and avatars

6.2. WHEN displaying comparison THEN the Recap_System SHALL highlight the winner with a crown icon and gold border styling

6.3. WHEN the match ended in a tie THEN the Recap_System SHALL display tie-breaker information based on resolution method

6.4. WHEN displaying comparison THEN the Recap_System SHALL show both players' question accuracy percentages

6.5. WHEN displaying comparison THEN the Recap_System SHALL show both players' K/D ratios

6.6. WHEN the game_end event is sent THEN the Match_System SHALL include opponent stats in the payload for comparison display

### Requirement 7: Recap Data Persistence

**User Story:** As a player, I want the recap data to be serialized and persisted, so that I can view my match history later.

#### Acceptance Criteria

7.1. WHEN the match ends THEN the Recap_System SHALL serialize all recap data to JSON format

7.2. WHEN serializing recap data THEN the Recap_System SHALL include xp_breakdown, tier_progress, question_stats, combat_stats, and opponent_comparison

7.3. WHEN the recap is persisted THEN the Recap_System SHALL store it in the games table recap_data JSONB column

7.4. WHEN deserializing recap data THEN the Recap_System SHALL reconstruct the complete recap object from JSON for match history display

7.5. WHEN the match history API is called THEN the Match_System SHALL return recap_data for each historical match

### Requirement 8: Navigation Actions

**User Story:** As a player, I want to navigate from the recap screen to play again or return to the dashboard, so that I can continue playing or exit gracefully.

#### Acceptance Criteria

8.1. WHEN the recap screen displays THEN the Recap_System SHALL provide a "Play Again" button that queues for a new match

8.2. WHEN the recap screen displays THEN the Recap_System SHALL provide a "Return to Dashboard" button

8.3. WHEN the player clicks "Play Again" THEN the Recap_System SHALL reset game state and navigate to the matchmaking queue

8.4. WHEN the player clicks "Return to Dashboard" THEN the Recap_System SHALL reset all game and lobby state and navigate to dashboard

8.5. WHEN the recap screen displays THEN the Recap_System SHALL auto-dismiss after 60 seconds of inactivity and navigate to dashboard

---

## Integration Points

### With Existing Systems

| System | Integration |
|--------|-------------|
| QuizHandler | Triggers game end after Q15, provides question stats |
| GameService | Calculates final results, awards XP, persists recap |
| BattlePassService | Provides tier progress data for recap |
| CombatTracker | Provides kills, deaths, streaks, shot stats |
| WebSocketManager | Broadcasts enhanced game_end event |
| Results Page | Displays comprehensive recap UI |
| Match History | Retrieves and displays historical recap data |

### Event Flow

```
Q15 Both Answered -> QuizHandler.process_round_end()
                  -> QuizHandler.process_game_end()
                  -> GameService.end_game()
                  -> Calculate question stats from session
                  -> Get combat stats from CombatTracker
                  -> Award XP via BattlePassService
                  -> Build RecapPayload
                  -> Persist recap_data to games table
                  -> Broadcast enhanced game_end event
                  -> Client navigates to Results page
                  -> Results page renders full recap UI
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Auto-End Trigger | 100% of matches end after Q15 | Match completion logs |
| Recap Display | 100% of players see recap | Client analytics |
| XP Visibility | 100% of recaps show XP breakdown | UI audit |
| Data Persistence | 100% of matches have recap_data | Database query |
| Navigation Success | 100% of nav actions work | Error logs |

---

*Document Version: 1.0*
*Created: December 2024*
