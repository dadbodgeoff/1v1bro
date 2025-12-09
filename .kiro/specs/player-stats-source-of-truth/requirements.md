# Requirements Document

## Introduction

This document establishes the definitive source of truth architecture for all player statistics in 1v1Bro. The goal is to ensure that match recap stats, profile stats, leaderboards, and all other stat displays pull from a single, consistent data source.

## Glossary

- **user_profiles**: The primary database table storing all aggregated player statistics and current ELO rating
- **games**: Database table storing individual match records with full game data (questions, answers, combat stats)
- **match_results**: Database table storing ELO change history as an audit trail
- **StatsRepository**: Repository class for updating player stats in user_profiles
- **UnifiedStatsRepository**: Repository class for reading/writing stats and ELO in user_profiles
- **LeaderboardService**: Service that calculates ELO changes and updates ratings
- **GamePersistenceService**: Service that saves game records and updates player stats

## Requirements

### Requirement 1: Single Source of Truth

**User Story:** As a developer, I want all player statistics to come from a single database table, so that stats are always consistent across all features.

#### Acceptance Criteria

1. THE user_profiles table SHALL store all aggregated player statistics including games_played, games_won, total_score, kills, deaths, accuracy, and answer stats
2. THE user_profiles table SHALL store current ELO rating (current_elo), peak ELO (peak_elo), and current tier (current_tier)
3. WHEN any feature displays player stats THEN the system SHALL query user_profiles as the source
4. THE games table SHALL store individual match records for historical reference only
5. THE match_results table SHALL store ELO change history as an audit trail only

### Requirement 2: Match End Stats Update Flow

**User Story:** As a player, I want my stats to update immediately after a match ends, so that my profile and leaderboard position reflect my latest performance.

#### Acceptance Criteria

1. WHEN a game ends THEN the GameService SHALL call persistence.update_player_stats() to increment stats in user_profiles
2. WHEN a game ends THEN the GameService SHALL call leaderboard_service.update_ratings() to update ELO in user_profiles
3. WHEN ELO is updated THEN the LeaderboardService SHALL create a record in match_results for audit purposes
4. WHEN stats are updated THEN the system SHALL use the increment_player_stats stored procedure for atomic updates
5. IF any stats update fails THEN the system SHALL log the error but not fail the entire game end flow

### Requirement 3: Profile Stats Display

**User Story:** As a player, I want to see my accurate stats on my profile page, so that I can track my progress.

#### Acceptance Criteria

1. WHEN the /api/v1/stats/me endpoint is called THEN the StatsService SHALL query user_profiles for all stats
2. WHEN stats are displayed THEN the system SHALL compute derived fields (win_rate, kd_ratio, accuracy) from raw values
3. THE Profile page SHALL display stats from the /api/v1/stats/me endpoint

### Requirement 4: Leaderboard Stats Display

**User Story:** As a player, I want leaderboards to show accurate rankings, so that I can compare my performance to others.

#### Acceptance Criteria

1. WHEN the ELO leaderboard is queried THEN the LeaderboardService SHALL read from user_profiles
2. WHEN category leaderboards are queried THEN the LeaderboardRepository SHALL read from user_profiles
3. THE games_played count on leaderboards SHALL come from user_profiles.games_played
4. THE win_rate on leaderboards SHALL be computed from user_profiles.games_won / user_profiles.games_played

### Requirement 5: Match History Display

**User Story:** As a player, I want to see my match history with accurate ELO changes, so that I can track my ranking progress.

#### Acceptance Criteria

1. WHEN match history is requested THEN the system SHALL query the games table for match records
2. WHEN ELO change is needed for a match THEN the system SHALL join with match_results to get elo_delta
3. THE /api/v1/games/history endpoint SHALL return matches with ELO changes from match_results

### Requirement 6: Data Consistency

**User Story:** As a system administrator, I want data to be consistent across all tables, so that there are no discrepancies.

#### Acceptance Criteria

1. THE count of records in games for a player SHALL equal user_profiles.games_played for that player
2. THE sum of wins in games for a player SHALL equal user_profiles.games_won for that player
3. WHEN a new match is recorded THEN both games and user_profiles SHALL be updated in the same flow
