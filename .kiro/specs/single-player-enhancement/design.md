# Design Document: Single Player Enhancement

## Overview

This design document outlines the architecture and implementation approach for enhancing the single-player practice mode in 1v1Bro. The enhancements include difficulty level selection, multiple practice types, comprehensive statistics tracking, personal best persistence, adaptive difficulty, first-time tutorial, and practice rewards.

The implementation builds on the existing `BotGame.tsx` component and introduces new modules for configuration management, statistics calculation, and tutorial flow.

## Architecture

```mermaid
graph TB
    subgraph Frontend
        BotGame[BotGame.tsx]
        PracticeSetup[PracticeSetupScreen]
        PracticeResults[PracticeResultsScreen]
        Tutorial[TutorialOverlay]
        
        BotConfig[BotConfigManager]
        StatsCalc[SessionStatsCalculator]
        AdaptiveDiff[AdaptiveDifficultyManager]
        PBStore[PersonalBestStore]
    end
    
    subgraph Backend
        PracticeAPI[/api/v1/practice]
        StatsDB[(practice_stats)]
        PBDB[(personal_bests)]
    end
    
    BotGame --> BotConfig
    BotGame --> StatsCalc
    BotGame --> AdaptiveDiff
    BotGame --> PBStore
    
    PracticeSetup --> BotGame
    BotGame --> PracticeResults
    Tutorial --> BotGame
    
    PBStore -->|authenticated| PracticeAPI
    PBStore -->|guest| localStorage
    PracticeAPI --> StatsDB
    PracticeAPI --> PBDB
```

## Components and Interfaces

### BotConfigManager

Manages bot behavior parameters based on difficulty level and practice type.

```typescript
interface DifficultyConfig {
  quizAccuracy: number      // 0.0 - 1.0
  shootCooldown: number     // milliseconds
  movementSpeed: number     // units per second
  aggroRange: number        // pixels
  retreatHealth: number     // percentage
}

interface BotConfigManager {
  getDifficultyConfig(level: DifficultyLevel): DifficultyConfig
  getPracticeTypeConfig(type: PracticeType): PracticeTypeConfig
  applyAdaptiveAdjustment(base: DifficultyConfig, adjustment: number): DifficultyConfig
}

type DifficultyLevel = 'easy' | 'medium' | 'hard'
type PracticeType = 'quiz_only' | 'combat_only' | 'full_game'
```

### SessionStatsCalculator

Calculates and aggregates statistics during and after a practice session.

```typescript
interface SessionStats {
  // Quiz stats
  totalQuestions: number
  correctAnswers: number
  accuracy: number           // percentage
  averageAnswerTime: number  // seconds
  longestStreak: number
  
  // Combat stats
  kills: number
  deaths: number
  kdRatio: number
  damageDealt: number
  
  // Session meta
  duration: number           // seconds
  finalScore: number
  effectiveDifficulty: number // 0.0 - 1.0
  isPersonalBest: boolean
}

interface SessionStatsCalculator {
  recordAnswer(correct: boolean, timeMs: number): void
  recordKill(): void
  recordDeath(): void
  recordDamage(amount: number): void
  calculateFinalStats(): SessionStats
}
```

### AdaptiveDifficultyManager

Tracks player performance and adjusts bot difficulty dynamically.

```typescript
interface AdaptiveDifficultyManager {
  recordRoundResult(playerScore: number, botScore: number): void
  getCurrentAdjustment(): number  // -0.2 to +0.2
  getEffectiveDifficulty(base: DifficultyConfig): DifficultyConfig
  reset(): void
}
```

### PersonalBestStore

Handles persistence of personal best records for both guests and authenticated users.

```typescript
interface PersonalBestRecord {
  category: string
  difficulty: DifficultyLevel
  practiceType: PracticeType
  score: number
  accuracy: number
  achievedAt: string  // ISO timestamp
}

interface PersonalBestStore {
  get(category: string, difficulty: DifficultyLevel, type: PracticeType): PersonalBestRecord | null
  set(record: PersonalBestRecord): Promise<void>
  isNewPersonalBest(category: string, difficulty: DifficultyLevel, type: PracticeType, score: number): boolean
}
```

### TutorialManager

Controls the first-time tutorial flow.

```typescript
type TutorialStep = 'movement' | 'combat' | 'quiz' | 'complete'

interface TutorialManager {
  shouldShowTutorial(): boolean
  getCurrentStep(): TutorialStep
  advanceStep(): void
  skipTutorial(): void
  completeTutorial(): void
}
```

## Data Models

### Database Schema (Backend)

```sql
-- Personal best records for authenticated users
CREATE TABLE practice_personal_bests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  practice_type VARCHAR(20) NOT NULL CHECK (practice_type IN ('quiz_only', 'combat_only', 'full_game')),
  score INTEGER NOT NULL,
  accuracy DECIMAL(5,2),
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, category, difficulty, practice_type)
);

-- Practice session history for analytics
CREATE TABLE practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category VARCHAR(50) NOT NULL,
  difficulty VARCHAR(10) NOT NULL,
  practice_type VARCHAR(20) NOT NULL,
  final_score INTEGER NOT NULL,
  bot_score INTEGER NOT NULL,
  accuracy DECIMAL(5,2),
  average_answer_time DECIMAL(6,2),
  longest_streak INTEGER,
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  damage_dealt INTEGER DEFAULT 0,
  duration_seconds INTEGER NOT NULL,
  effective_difficulty DECIMAL(3,2),
  is_personal_best BOOLEAN DEFAULT FALSE,
  xp_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tutorial completion tracking
CREATE TABLE user_tutorial_status (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_tutorial_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ
);

-- Daily practice tracking for bonus
CREATE TABLE practice_daily_counts (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_count INTEGER DEFAULT 0,
  daily_bonus_claimed BOOLEAN DEFAULT FALSE,
  
  PRIMARY KEY (user_id, date)
);

CREATE INDEX idx_practice_pb_user ON practice_personal_bests(user_id);
CREATE INDEX idx_practice_sessions_user ON practice_sessions(user_id);
CREATE INDEX idx_practice_daily_user_date ON practice_daily_counts(user_id, date);
```

### LocalStorage Schema (Guest Users)

```typescript
interface GuestPracticeData {
  personalBests: Record<string, PersonalBestRecord>  // key: "category:difficulty:type"
  tutorialCompleted: boolean
  todaySessionCount: number
  lastSessionDate: string  // ISO date
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Difficulty configuration consistency
*For any* difficulty level selection, the returned bot configuration SHALL contain quiz accuracy, shoot cooldown, and movement speed values that exactly match the predefined constants for that level.
**Validates: Requirements 1.2, 1.3, 1.4**

### Property 2: Practice type configuration consistency
*For any* practice type selection, the returned configuration SHALL correctly enable/disable combat and quiz mechanics according to the type definition.
**Validates: Requirements 2.2, 2.3, 2.4**

### Property 3: Accuracy calculation correctness
*For any* sequence of quiz answers, the calculated accuracy percentage SHALL equal (correct answers / total questions) * 100, rounded to two decimal places.
**Validates: Requirements 3.1**

### Property 4: Average answer time calculation
*For any* sequence of answer times, the calculated average SHALL equal the sum of all times divided by the count of answers.
**Validates: Requirements 3.2**

### Property 5: Streak calculation correctness
*For any* sequence of boolean answer results, the longest streak SHALL equal the maximum count of consecutive true values in the sequence.
**Validates: Requirements 3.3**

### Property 6: K/D ratio calculation
*For any* kills and deaths count, the K/D ratio SHALL equal kills / max(deaths, 1) to avoid division by zero.
**Validates: Requirements 3.4**

### Property 7: Personal best update condition
*For any* new score and existing personal best, the personal best SHALL be updated if and only if the new score is strictly greater than the existing best.
**Validates: Requirements 4.1**

### Property 8: Guest data persistence round-trip
*For any* personal best record stored by a guest user, reading from localStorage SHALL return an equivalent record.
**Validates: Requirements 4.4**

### Property 9: Adaptive difficulty increase threshold
*For any* sequence of round results where the player wins 3 consecutive rounds by more than 500 points, the bot quiz accuracy SHALL increase by exactly 10 percentage points, capped at 85%.
**Validates: Requirements 5.1**

### Property 10: Adaptive difficulty decrease threshold
*For any* sequence of round results where the player loses 3 consecutive rounds by more than 500 points, the bot quiz accuracy SHALL decrease by exactly 10 percentage points, floored at 30%.
**Validates: Requirements 5.2**

### Property 11: Tutorial completion persistence
*For any* user who completes all tutorial sections, the tutorial completed flag SHALL be set to true and persist across sessions.
**Validates: Requirements 6.5**

### Property 12: Practice XP calculation
*For any* practice session score, the XP awarded SHALL equal 25% of the equivalent multiplayer XP value (floor division).
**Validates: Requirements 7.1**

### Property 13: Daily bonus threshold
*For any* user who completes exactly 5 practice sessions in a single day, the daily bonus of 75 XP SHALL be awarded exactly once.
**Validates: Requirements 7.4**

## Error Handling

### Network Failures
- Personal best sync failures for authenticated users SHALL be queued for retry
- Guest mode SHALL function fully offline using localStorage
- Failed XP awards SHALL be logged and retried on next session

### Invalid State
- Missing difficulty selection SHALL default to Medium
- Missing practice type SHALL default to Full Game
- Corrupted localStorage data SHALL be reset to defaults with user notification

### Edge Cases
- Zero questions answered: accuracy = 0%, average time = 0
- Zero deaths: K/D ratio = kills (not infinity)
- First practice session: no personal best comparison needed

## Testing Strategy

### Unit Testing
- Test difficulty config lookup for all three levels
- Test practice type config for all three types
- Test stats calculator with various input sequences
- Test adaptive difficulty state machine transitions
- Test personal best comparison logic

### Property-Based Testing
The implementation SHALL use fast-check for property-based testing in TypeScript.

Each property test SHALL:
- Run a minimum of 100 iterations
- Generate random but valid inputs within domain constraints
- Tag tests with the format: `**Feature: single-player-enhancement, Property {number}: {property_text}**`

Key property tests:
1. Difficulty config returns correct values for any valid level
2. Accuracy calculation is correct for any answer sequence
3. Streak calculation finds maximum consecutive trues
4. Personal best updates only when score is higher
5. Adaptive difficulty stays within bounds (30%-85%)
6. XP calculation is exactly 25% of multiplayer equivalent

### Integration Testing
- End-to-end practice session flow
- Personal best sync between frontend and backend
- Tutorial completion persistence
- Daily bonus tracking across sessions
