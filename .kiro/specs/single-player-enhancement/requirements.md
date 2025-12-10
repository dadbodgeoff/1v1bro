# Requirements Document

## Introduction

This document specifies requirements for enhancing the single-player practice mode in 1v1Bro. The goal is to create a polished, engaging solo experience that serves as both a training ground for new players and a compelling standalone mode for users who want to practice without matchmaking. The enhancements focus on difficulty customization, multiple practice modes, progress tracking, and player onboarding.

## Glossary

- **Practice_Mode**: A single-player game session against an AI bot opponent
- **Bot_AI**: The artificial intelligence controlling the opponent in practice mode
- **Difficulty_Level**: A preset configuration controlling bot behavior parameters
- **Practice_Type**: The game mode variant (quiz-only, combat-only, or full game)
- **Session_Stats**: Performance metrics tracked during a single practice session
- **Personal_Best**: The highest score achieved by a user in a specific category/mode combination
- **Streak**: Consecutive correct answers without an incorrect response
- **Adaptive_Difficulty**: System that adjusts bot parameters based on player performance

## Requirements

### Requirement 1: Difficulty Level Selection

**User Story:** As a player, I want to select a difficulty level before starting practice mode, so that I can match the challenge to my skill level.

#### Acceptance Criteria

1. WHEN a user opens the practice mode setup screen THEN the Practice_Mode SHALL display three difficulty options: Easy, Medium, and Hard
2. WHEN a user selects Easy difficulty THEN the Bot_AI SHALL use quiz accuracy of 40%, shoot cooldown of 1200ms, and movement speed of 80 units/second
3. WHEN a user selects Medium difficulty THEN the Bot_AI SHALL use quiz accuracy of 55%, shoot cooldown of 800ms, and movement speed of 120 units/second
4. WHEN a user selects Hard difficulty THEN the Bot_AI SHALL use quiz accuracy of 75%, shoot cooldown of 500ms, and movement speed of 160 units/second
5. WHEN no difficulty is explicitly selected THEN the Practice_Mode SHALL default to Medium difficulty

### Requirement 2: Practice Type Selection

**User Story:** As a player, I want to choose between different practice types, so that I can focus on improving specific skills.

#### Acceptance Criteria

1. WHEN a user opens the practice mode setup screen THEN the Practice_Mode SHALL display three practice type options: Quiz Only, Combat Only, and Full Game
2. WHEN a user selects Quiz Only mode THEN the Practice_Mode SHALL disable all combat mechanics and present rapid-fire trivia questions
3. WHEN a user selects Combat Only mode THEN the Practice_Mode SHALL disable quiz questions and enable arena combat with respawning
4. WHEN a user selects Full Game mode THEN the Practice_Mode SHALL enable both quiz and combat mechanics as in the current implementation
5. WHEN no practice type is explicitly selected THEN the Practice_Mode SHALL default to Full Game mode

### Requirement 3: Session Statistics Display

**User Story:** As a player, I want to see detailed statistics after each practice session, so that I can understand my performance and track improvement.

#### Acceptance Criteria

1. WHEN a practice session ends THEN the Practice_Mode SHALL display quiz accuracy percentage calculated as correct answers divided by total questions
2. WHEN a practice session ends THEN the Practice_Mode SHALL display average answer time in seconds
3. WHEN a practice session ends THEN the Practice_Mode SHALL display longest streak of consecutive correct answers achieved during the session
4. WHEN a practice session ends THEN the Practice_Mode SHALL display combat K/D ratio and total damage dealt
5. WHEN a practice session ends THEN the Practice_Mode SHALL display total session duration in minutes and seconds

### Requirement 4: Personal Best Tracking

**User Story:** As a player, I want my best scores to be saved per category and difficulty, so that I can track my improvement over time.

#### Acceptance Criteria

1. WHEN a user completes a practice session with a score higher than their stored personal best THEN the Session_Stats SHALL update the Personal_Best record for that category and difficulty combination
2. WHEN a user views the practice mode setup screen THEN the Practice_Mode SHALL display the user's Personal_Best score for the currently selected category and difficulty
3. WHEN a user achieves a new Personal_Best THEN the Practice_Mode SHALL display a celebratory notification on the results screen
4. WHEN a guest user completes a practice session THEN the Session_Stats SHALL store Personal_Best data in localStorage
5. WHEN an authenticated user completes a practice session THEN the Session_Stats SHALL persist Personal_Best data to the backend database

### Requirement 5: Adaptive Difficulty System

**User Story:** As a player, I want the bot to adjust its difficulty based on my performance, so that the game remains challenging but fair.

#### Acceptance Criteria

1. WHEN a user wins three consecutive rounds by more than 500 points THEN the Adaptive_Difficulty SHALL increase bot quiz accuracy by 10 percentage points up to a maximum of 85%
2. WHEN a user loses three consecutive rounds by more than 500 points THEN the Adaptive_Difficulty SHALL decrease bot quiz accuracy by 10 percentage points down to a minimum of 30%
3. WHEN adaptive difficulty adjusts bot parameters THEN the Practice_Mode SHALL display a subtle indicator showing the current effective difficulty
4. WHEN a user explicitly selects a difficulty level THEN the Adaptive_Difficulty SHALL use that level as the baseline for adjustments
5. WHEN a practice session ends THEN the Session_Stats SHALL record the final effective difficulty level reached

### Requirement 6: First-Time Player Tutorial

**User Story:** As a new player, I want a guided tutorial that teaches me the game mechanics, so that I can learn how to play effectively.

#### Acceptance Criteria

1. WHEN a user launches practice mode for the first time THEN the Practice_Mode SHALL offer to start an interactive tutorial
2. WHEN a user accepts the tutorial THEN the Practice_Mode SHALL guide the user through movement controls with on-screen prompts
3. WHEN a user completes movement training THEN the Practice_Mode SHALL guide the user through combat mechanics including aiming and shooting
4. WHEN a user completes combat training THEN the Practice_Mode SHALL guide the user through quiz answering mechanics
5. WHEN a user completes all tutorial sections THEN the Practice_Mode SHALL mark the tutorial as completed and store this flag in user preferences
6. WHEN a user declines or skips the tutorial THEN the Practice_Mode SHALL proceed directly to the practice setup screen

### Requirement 7: Practice Mode Rewards

**User Story:** As a player, I want to earn rewards from practice mode, so that I feel my practice time is valuable.

#### Acceptance Criteria

1. WHEN an authenticated user completes a practice session THEN the Practice_Mode SHALL award XP equal to 25% of the equivalent multiplayer XP
2. WHEN a user achieves a new Personal_Best THEN the Practice_Mode SHALL award a bonus of 50 XP
3. WHEN a user completes the tutorial THEN the Practice_Mode SHALL award 100 XP as a one-time bonus
4. WHEN a user completes five practice sessions in a single day THEN the Practice_Mode SHALL award a daily practice bonus of 75 XP
5. WHEN a guest user earns rewards THEN the Practice_Mode SHALL display earned rewards with a prompt to sign up to claim them
