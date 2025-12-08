# Requirements Document

## Introduction

This feature consolidates player statistics and leaderboard data into a single source of truth. Currently, stats are split between `user_profiles` (gameplay stats) and `player_ratings` (ELO data), causing data inconsistencies and maintenance overhead. This refactor merges ELO fields into `user_profiles`, updates all leaderboard queries to use this unified source, and ensures proper cache invalidation when stats change.

## Glossary

- **User_Profiles**: The primary database table storing user profile data and all gameplay statistics
- **Player_Ratings**: The legacy table storing ELO ratings (to be deprecated)
- **ELO**: A rating system for calculating relative skill levels of players
- **Leaderboard**: A ranked list of players sorted by a specific statistic
- **Stats_Service**: The backend service responsible for updating player statistics
- **Leaderboard_Service**: The backend service responsible for querying leaderboards
- **Cache_Invalidation**: The process of marking cached data as stale when underlying data changes

## Requirements

### Requirement 1

**User Story:** As a developer, I want all player statistics stored in a single table, so that I can avoid data inconsistencies between multiple sources.

#### Acceptance Criteria

1. WHEN the migration runs THEN the System SHALL add `current_elo`, `peak_elo`, and `current_tier` columns to the `user_profiles` table
2. WHEN the migration runs THEN the System SHALL copy existing ELO data from `player_ratings` to `user_profiles` for all users
3. WHEN a new user is created THEN the System SHALL initialize ELO fields with default values (current_elo=1200, peak_elo=1200, current_tier='Gold')
4. WHEN the migration completes THEN the System SHALL verify row counts match between source and destination

---

### Requirement 2

**User Story:** As a player, I want my ELO rating updated after each match, so that my competitive ranking reflects my recent performance.

#### Acceptance Criteria

1. WHEN a match ends THEN the System SHALL calculate ELO changes using the standard formula: new_elo = old_elo + K * (score - expected_score)
2. WHEN updating ELO THEN the System SHALL use K-factor of 32 for ratings below 2000, 24 for 2000-2400, and 16 for ratings above 2400
3. WHEN the new ELO exceeds peak_elo THEN the System SHALL update peak_elo to the new value
4. WHEN updating ELO THEN the System SHALL clamp values between 100 and 3000
5. WHEN updating ELO THEN the System SHALL recalculate current_tier based on the new rating

---

### Requirement 3

**User Story:** As a player, I want all my stats updated atomically after a match, so that leaderboards always show consistent data.

#### Acceptance Criteria

1. WHEN a match ends THEN the System SHALL update gameplay stats and ELO in a single database transaction
2. WHEN updating stats THEN the System SHALL use the existing `increment_player_stats` stored procedure extended with ELO parameters
3. IF the transaction fails THEN the System SHALL rollback all changes and log the error
4. WHEN stats are updated THEN the System SHALL invalidate relevant leaderboard caches

---

### Requirement 4

**User Story:** As a player, I want to see accurate games_played counts on the ELO leaderboard, so that I can assess player experience levels.

#### Acceptance Criteria

1. WHEN querying the ELO leaderboard THEN the System SHALL return games_played from `user_profiles`
2. WHEN displaying ELO leaderboard entries THEN the System SHALL include display_name, avatar_url, current_elo, current_tier, games_played, and win_rate
3. WHEN calculating win_rate for display THEN the System SHALL compute it as (games_won / games_played * 100) from `user_profiles`

---

### Requirement 5

**User Story:** As a player, I want all leaderboards to query from the same data source, so that my stats are consistent across different views.

#### Acceptance Criteria

1. WHEN querying any leaderboard category THEN the System SHALL read from `user_profiles` table only
2. WHEN the ELO leaderboard is queried THEN the System SHALL use the new `current_elo` column in `user_profiles`
3. WHEN regional leaderboards are queried THEN the System SHALL filter by the `country` column in `user_profiles`

---

### Requirement 6

**User Story:** As a developer, I want leaderboard caches invalidated when stats change, so that players see up-to-date rankings.

#### Acceptance Criteria

1. WHEN any stat is updated THEN the System SHALL invalidate the global leaderboard cache
2. WHEN ELO is updated THEN the System SHALL invalidate the ELO leaderboard cache
3. WHEN a user's country changes THEN the System SHALL invalidate regional leaderboard caches for both old and new countries
4. WHEN cache is invalidated THEN the System SHALL use cache key patterns to clear related entries

---

### Requirement 7

**User Story:** As a developer, I want the legacy `player_ratings` table deprecated, so that future development uses only the unified schema.

#### Acceptance Criteria

1. WHEN the migration completes THEN the System SHALL rename `player_ratings` to `player_ratings_deprecated`
2. WHEN the deprecated table exists THEN the System SHALL add a comment indicating deprecation date and removal timeline
3. WHEN all services are updated THEN the System SHALL remove references to `player_ratings` from the codebase

---

### Requirement 8

**User Story:** As a player, I want my profile to show all my stats including ELO, so that I can see my complete competitive history.

#### Acceptance Criteria

1. WHEN fetching a profile THEN the System SHALL return ELO fields (current_elo, peak_elo, current_tier) alongside existing stats
2. WHEN displaying profile stats THEN the Frontend SHALL show ELO rating with tier badge
3. WHEN the profile API is called THEN the System SHALL return a single response containing all stats without additional API calls

---

### Requirement 9

**User Story:** As a developer, I want TypeScript types to match the unified backend schema, so that frontend code is type-safe.

#### Acceptance Criteria

1. WHEN the backend schema changes THEN the Frontend SHALL update TypeScript interfaces to include ELO fields in Profile type
2. WHEN displaying tier badges THEN the Frontend SHALL normalize backend tier names (PascalCase) to frontend format (lowercase)
3. WHEN the leaderboard API response changes THEN the Frontend SHALL update LeaderboardEntry types to reflect new fields

---

### Requirement 10

**User Story:** As a developer, I want property-based tests to verify stats consistency, so that I can catch data integrity issues early.

#### Acceptance Criteria

1. WHEN testing stats updates THEN the Test Suite SHALL verify that games_played equals games_won plus games_lost
2. WHEN testing ELO updates THEN the Test Suite SHALL verify that current_elo is always between 100 and 3000
3. WHEN testing tier assignment THEN the Test Suite SHALL verify that current_tier matches the ELO range
4. WHEN testing leaderboard queries THEN the Test Suite SHALL verify that entries are sorted correctly by the category metric
