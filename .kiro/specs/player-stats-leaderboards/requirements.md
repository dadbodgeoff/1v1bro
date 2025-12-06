# Player Stats & Leaderboards - Requirements Document

## Introduction

This document defines the requirements for a comprehensive player statistics tracking and leaderboard system. The system will track granular player performance metrics across trivia gameplay and PvP combat, aggregate them into meaningful statistics, and expose ranked leaderboards for competitive engagement.

The implementation follows enterprise patterns established in the codebase:
- **Repository Pattern**: Data access through dedicated repository classes
- **Service Pattern**: Business logic in service layer
- **Schema Pattern**: Pydantic models for validation and serialization
- **Migration Pattern**: Versioned SQL migrations for schema changes

## Glossary

- **Lifetime Stats**: Cumulative statistics across all games played by a user
- **Combat Stats**: Statistics related to PvP shooting mechanics (kills, accuracy, damage)
- **Trivia Stats**: Statistics related to question answering (correct answers, answer time)
- **Leaderboard**: Ranked list of players sorted by a specific metric
- **Win Streak**: Consecutive games won without a loss
- **K/D Ratio**: Kill-to-death ratio (total_kills / total_deaths)
- **Accuracy**: Percentage of shots that hit targets (shots_hit / shots_fired * 100)
- **Answer Rate**: Percentage of questions answered correctly

---

## Current State Analysis

| Component | Current Implementation | Limitation |
|-----------|----------------------|------------|
| User Stats | games_played, games_won, total_score | No combat stats, no answer time tracking |
| Leaderboard | Single leaderboard by total_score | No category-based leaderboards |
| Combat Tracking | None persisted | Combat events not saved to database |
| Answer Tracking | Per-game only (answers_data JSONB) | Not aggregated to user profile |
| Win Streaks | Not tracked | No streak mechanics |

---

## Requirements

### Requirement 1: Extended Player Statistics Schema

**User Story:** As a player, I want my detailed performance tracked over time, so that I can see my improvement and compare with others.

#### Acceptance Criteria

1. THE Stats_System SHALL track the following trivia statistics per user:
   - `total_questions_answered` (INTEGER, default 0)
   - `total_correct_answers` (INTEGER, default 0)
   - `total_answer_time_ms` (BIGINT, default 0) - sum of time for correct answers only
   - `fastest_answer_ms` (INTEGER, nullable) - fastest correct answer ever

2. THE Stats_System SHALL track the following combat statistics per user:
   - `total_kills` (INTEGER, default 0)
   - `total_deaths` (INTEGER, default 0)
   - `total_damage_dealt` (INTEGER, default 0)
   - `total_damage_taken` (INTEGER, default 0)
   - `shots_fired` (INTEGER, default 0)
   - `shots_hit` (INTEGER, default 0)

3. THE Stats_System SHALL track the following streak statistics per user:
   - `current_win_streak` (INTEGER, default 0)
   - `best_win_streak` (INTEGER, default 0)

4. THE Stats_System SHALL track the following collection statistics per user:
   - `total_powerups_collected` (INTEGER, default 0)

5. ALL new statistics columns SHALL have DEFAULT values to handle existing users without migration issues

6. THE Stats_System SHALL compute derived statistics on read:
   - `win_rate` = games_won / games_played (0 if no games)
   - `accuracy_pct` = shots_hit / shots_fired * 100 (0 if no shots)
   - `kd_ratio` = total_kills / total_deaths (total_kills if 0 deaths)
   - `avg_answer_time_ms` = total_answer_time_ms / total_correct_answers (0 if no correct)
   - `answer_rate` = total_correct_answers / total_questions_answered * 100

---

### Requirement 2: Statistics Update Service

**User Story:** As a developer, I want a centralized service for updating player stats, so that all stat changes are consistent and atomic.

#### Acceptance Criteria

1. THE Stats_Service SHALL provide atomic increment operations for all integer statistics
2. THE Stats_Service SHALL update win streak on game completion:
   - IF player won THEN increment current_win_streak AND update best_win_streak if current > best
   - IF player lost THEN reset current_win_streak to 0
3. THE Stats_Service SHALL update fastest_answer_ms only if new time is faster than existing
4. THE Stats_Service SHALL batch multiple stat updates into a single database transaction
5. THE Stats_Service SHALL emit events for significant stat changes (new personal best, streak milestone)
6. THE Stats_Service SHALL validate all stat deltas are non-negative (no negative increments)

---

### Requirement 3: Game Result Statistics Aggregation

**User Story:** As a player, I want my game performance automatically added to my lifetime stats, so I don't have to do anything manually.

#### Acceptance Criteria

1. WHEN a game ends THEN the Stats_Service SHALL aggregate the following from game data:
   - Questions answered (from answers_data)
   - Correct answers count
   - Total answer time for correct answers
   - Fastest answer time in the game

2. WHEN a game ends THEN the Stats_Service SHALL aggregate combat stats:
   - Kills (from combat events)
   - Deaths (from combat events)
   - Damage dealt (from combat events)
   - Damage taken (from combat events)
   - Shots fired (from combat events)
   - Shots hit (from combat events)

3. THE Stats_Service SHALL store per-game combat summary in games table:
   - `player1_combat_stats` (JSONB)
   - `player2_combat_stats` (JSONB)

4. THE aggregation SHALL be idempotent - processing the same game twice SHALL NOT double-count stats

---

### Requirement 4: Leaderboard Categories

**User Story:** As a player, I want multiple leaderboards for different skills, so that I can compete in areas where I excel.

#### Acceptance Criteria

1. THE Leaderboard_System SHALL support the following leaderboard categories:
   - `wins` - Sorted by games_won DESC
   - `win_rate` - Sorted by (games_won/games_played) DESC, minimum 10 games
   - `total_score` - Sorted by total_score DESC
   - `kills` - Sorted by total_kills DESC
   - `kd_ratio` - Sorted by (total_kills/total_deaths) DESC, minimum 10 deaths
   - `accuracy` - Sorted by (shots_hit/shots_fired) DESC, minimum 100 shots
   - `fastest_thinker` - Sorted by avg_answer_time_ms ASC, minimum 50 correct answers
   - `answer_rate` - Sorted by (correct/total) DESC, minimum 100 questions
   - `win_streak` - Sorted by best_win_streak DESC

2. EACH leaderboard SHALL return:
   - `rank` (1-indexed position)
   - `user_id`
   - `display_name`
   - `avatar_url`
   - `stat_value` (the metric being ranked)
   - `secondary_stat` (contextual, e.g., games_played for win_rate)

3. THE Leaderboard_System SHALL support pagination with `limit` (default 10, max 100) and `offset`

4. THE Leaderboard_System SHALL support fetching a specific user's rank in any category

5. LEADERBOARDS with minimum requirements SHALL exclude users who don't meet the threshold

---

### Requirement 5: Player Profile Statistics API

**User Story:** As a player, I want to view my complete statistics profile, so that I can track my progress.

#### Acceptance Criteria

1. THE Profile_API SHALL return all raw statistics for a user
2. THE Profile_API SHALL return all computed/derived statistics
3. THE Profile_API SHALL return the user's rank in each leaderboard category
4. THE Profile_API SHALL return recent game history with per-game stats
5. THE Profile_API SHALL support viewing other players' public profiles (limited stats)
6. THE Profile_API SHALL indicate which stats are "personal bests" (fastest answer, best streak)

---

### Requirement 6: Real-time Combat Event Tracking

**User Story:** As a developer, I want combat events tracked during gameplay, so that stats can be aggregated at game end.

#### Acceptance Criteria

1. THE Combat_Tracker SHALL track per-player per-game:
   - Kill events (killer_id, victim_id, timestamp, weapon)
   - Death events (player_id, killer_id, timestamp)
   - Damage events (dealer_id, receiver_id, amount, source)
   - Shot events (player_id, hit: boolean, timestamp)

2. THE Combat_Tracker SHALL store events in-memory during game session
3. THE Combat_Tracker SHALL persist combat summary to games table on game end
4. THE Combat_Tracker SHALL handle player disconnection gracefully (preserve stats)

---

### Requirement 7: Database Migration

**User Story:** As a developer, I want a safe migration path, so that existing users retain their data.

#### Acceptance Criteria

1. THE Migration SHALL add new columns with DEFAULT values (no NOT NULL without default)
2. THE Migration SHALL NOT modify existing column types or constraints
3. THE Migration SHALL add appropriate indexes for leaderboard queries
4. THE Migration SHALL be reversible (provide DOWN migration)
5. THE Migration SHALL complete within 30 seconds on tables with 100k+ rows

---

## Data Model

### Extended user_profiles Table

```sql
-- New columns to add to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
  -- Trivia stats
  total_questions_answered INTEGER DEFAULT 0,
  total_correct_answers INTEGER DEFAULT 0,
  total_answer_time_ms BIGINT DEFAULT 0,
  fastest_answer_ms INTEGER,
  
  -- Combat stats
  total_kills INTEGER DEFAULT 0,
  total_deaths INTEGER DEFAULT 0,
  total_damage_dealt INTEGER DEFAULT 0,
  total_damage_taken INTEGER DEFAULT 0,
  shots_fired INTEGER DEFAULT 0,
  shots_hit INTEGER DEFAULT 0,
  
  -- Streak stats
  current_win_streak INTEGER DEFAULT 0,
  best_win_streak INTEGER DEFAULT 0,
  
  -- Collection stats
  total_powerups_collected INTEGER DEFAULT 0;
```

### Extended games Table

```sql
-- New columns to add to games
ALTER TABLE games ADD COLUMN IF NOT EXISTS
  player1_combat_stats JSONB DEFAULT '{}',
  player2_combat_stats JSONB DEFAULT '{}';
```

### Combat Stats JSONB Schema

```json
{
  "kills": 5,
  "deaths": 3,
  "damage_dealt": 450,
  "damage_taken": 280,
  "shots_fired": 42,
  "shots_hit": 28,
  "powerups_collected": 2
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/stats/me` | Get current user's full stats |
| GET | `/api/v1/stats/{user_id}` | Get another user's public stats |
| GET | `/api/v1/leaderboards/{category}` | Get leaderboard by category |
| GET | `/api/v1/leaderboards/{category}/rank/{user_id}` | Get user's rank in category |
| GET | `/api/v1/stats/me/history` | Get current user's game history with stats |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Query Performance | <100ms for leaderboard queries | Database query timing |
| Data Accuracy | 100% stat consistency | Audit comparison |
| Migration Safety | Zero data loss | Pre/post row counts |
| API Response Time | <200ms p95 | API metrics |

---

## Out of Scope

- Seasonal/time-limited leaderboards (future phase)
- Achievements/badges system (future phase)
- Stat decay over time (future phase)
- Anti-cheat stat validation (future phase)
- Leaderboard caching layer (future phase)
