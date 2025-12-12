# Requirements Document: Achievement System

## Introduction

This specification defines a comprehensive achievement system for the 1v1bro gaming platform that tracks player milestones, rewards completion with 3 coins per achievement, and provides real-time notifications. The system builds upon the existing achievements database schema (migration 013) and integrates with the notification service, coin balance system, and enterprise frontend patterns.

The achievement system is designed to:
- Track player progress across multiple categories (games, wins, streaks, kills, accuracy, social)
- Award 3 coins automatically upon achievement unlock
- Notify users in real-time via WebSocket and toast notifications
- Display achievements in an enterprise-grade, mobile-optimized UI
- Support progressive achievement tiers (common → legendary)

## Glossary

- **Achievement_System**: The backend service responsible for tracking, awarding, and managing player achievements
- **Achievement**: A milestone or accomplishment that players can unlock by meeting specific criteria
- **Achievement_Category**: A grouping of related achievements (games, wins, streaks, kills, accuracy, social)
- **Achievement_Rarity**: The tier of an achievement indicating difficulty (common, uncommon, rare, epic, legendary)
- **Criteria_Type**: The metric used to determine achievement unlock (games_played, games_won, win_streak, total_kills, accuracy, friends_count)
- **Criteria_Value**: The threshold value required to unlock an achievement
- **User_Achievement**: A record linking a user to an earned achievement with timestamp
- **Achievement_Reward**: The 3-coin reward granted upon achievement unlock
- **Achievement_Notification**: A real-time notification sent when an achievement is unlocked
- **Achievement_Panel**: The frontend UI component displaying achievement progress and unlocked achievements
- **Progress_Indicator**: A visual element showing progress toward the next achievement in a category

## Requirements

### Requirement 1: Achievement Tracking and Unlock

**User Story:** As a player, I want my gameplay statistics to be tracked toward achievements, so that I can unlock achievements automatically when I meet the criteria.

#### Acceptance Criteria

1. WHEN a match ends THEN the Achievement_System SHALL check all relevant achievement criteria against the player's updated statistics
2. WHEN a player's statistic meets or exceeds an achievement's criteria_value THEN the Achievement_System SHALL create a user_achievement record with the current timestamp
3. WHEN an achievement is unlocked THEN the Achievement_System SHALL prevent duplicate awards by checking existing user_achievements
4. WHEN checking achievements THEN the Achievement_System SHALL evaluate criteria_types: games_played, games_won, win_streak, total_kills, accuracy, and friends_count
5. WHEN a player has multiple achievements to unlock simultaneously THEN the Achievement_System SHALL process all unlocks in a single transaction

### Requirement 2: Achievement Coin Rewards

**User Story:** As a player, I want to receive 3 coins when I unlock an achievement, so that I am rewarded for my accomplishments.

#### Acceptance Criteria

1. WHEN an achievement is unlocked THEN the Achievement_System SHALL credit exactly 3 coins to the player's balance
2. WHEN crediting achievement coins THEN the Achievement_System SHALL record a coin transaction with source type "achievement"
3. WHEN crediting achievement coins THEN the Achievement_System SHALL include the achievement_id in the transaction metadata
4. WHEN multiple achievements unlock simultaneously THEN the Achievement_System SHALL credit 3 coins per achievement (total = 3 × achievement_count)
5. IF the coin credit fails THEN the Achievement_System SHALL still record the achievement unlock and log the coin credit failure for retry

### Requirement 3: Achievement Notifications

**User Story:** As a player, I want to be notified immediately when I unlock an achievement, so that I can celebrate my accomplishment.

#### Acceptance Criteria

1. WHEN an achievement is unlocked THEN the Achievement_System SHALL send a real-time WebSocket notification to the player
2. WHEN an achievement is unlocked THEN the Achievement_System SHALL create a persistent notification record with type "reward"
3. WHEN displaying an achievement notification THEN the Achievement_System SHALL include the achievement name, description, rarity, and coin reward amount
4. WHEN an achievement notification is displayed THEN the Achievement_Panel SHALL show a celebratory animation appropriate to the achievement rarity
5. WHEN the player is offline during achievement unlock THEN the Achievement_System SHALL queue the notification for delivery upon reconnection

### Requirement 4: Achievement Display Panel

**User Story:** As a player, I want to view all achievements and my progress toward them, so that I can track my goals and see what I've accomplished.

#### Acceptance Criteria

1. WHEN the Achievement_Panel loads THEN the Achievement_System SHALL display all achievements grouped by category
2. WHEN displaying achievements THEN the Achievement_Panel SHALL show locked achievements with progress indicators and unlocked achievements with earned timestamps
3. WHEN displaying an achievement THEN the Achievement_Panel SHALL show the name, description, icon, rarity badge, and coin reward (3 coins)
4. WHEN filtering achievements THEN the Achievement_Panel SHALL support filtering by category and by unlock status (all, locked, unlocked)
5. WHEN displaying progress THEN the Achievement_Panel SHALL show a progress bar with current value and target value for the next locked achievement in each category

### Requirement 5: Achievement Categories and Definitions

**User Story:** As a player, I want achievements organized into meaningful categories, so that I can focus on specific types of accomplishments.

#### Acceptance Criteria

1. THE Achievement_System SHALL support the following categories: games, wins, streaks, combat, accuracy, and social
2. WHEN defining achievements THEN the Achievement_System SHALL assign a rarity based on difficulty: common (easy), uncommon (moderate), rare (challenging), epic (difficult), legendary (exceptional)
3. THE Achievement_System SHALL include progressive achievement tiers within each category (e.g., 1 win → 10 wins → 50 wins → 100 wins → 500 wins)
4. WHEN a new achievement category is added THEN the Achievement_System SHALL support dynamic category registration without code changes
5. THE Achievement_System SHALL include at least 30 total achievements across all categories at launch

### Requirement 6: Mobile-Optimized Achievement UI

**User Story:** As a mobile player, I want the achievement interface to be touch-friendly and responsive, so that I can easily browse and track achievements on my device.

#### Acceptance Criteria

1. WHEN displaying the Achievement_Panel on mobile THEN the Achievement_System SHALL use a single-column layout with horizontally scrollable category tabs
2. WHEN displaying achievement cards on mobile THEN the Achievement_Panel SHALL ensure touch targets are at least 44×44 pixels
3. WHEN displaying achievement details on mobile THEN the Achievement_Panel SHALL use a bottom sheet modal with drag-to-dismiss
4. WHEN displaying progress bars on mobile THEN the Achievement_Panel SHALL use percentage-based widths with responsive height
5. WHEN the Achievement_Panel loads on mobile THEN the Achievement_System SHALL use staggered entry animations respecting prefers-reduced-motion

### Requirement 7: Achievement API Endpoints

**User Story:** As a frontend developer, I want well-defined API endpoints for achievements, so that I can integrate the achievement system into the UI.

#### Acceptance Criteria

1. THE Achievement_System SHALL provide GET /api/v1/achievements to list all achievement definitions with category and rarity
2. THE Achievement_System SHALL provide GET /api/v1/achievements/me to list the current user's earned achievements with timestamps
3. THE Achievement_System SHALL provide GET /api/v1/achievements/progress to return progress toward all locked achievements
4. THE Achievement_System SHALL provide POST /api/v1/achievements/check to manually trigger achievement evaluation for the current user
5. WHEN returning achievement data THEN the Achievement_System SHALL include pagination support with limit and offset parameters

### Requirement 8: Achievement Progress Persistence

**User Story:** As a player, I want my achievement progress to persist across sessions, so that I don't lose progress toward achievements.

#### Acceptance Criteria

1. WHEN tracking achievement progress THEN the Achievement_System SHALL derive progress from user_profiles statistics (games_played, games_won, etc.)
2. WHEN displaying progress THEN the Achievement_System SHALL calculate current progress by comparing user statistics to achievement criteria_value
3. THE Achievement_System SHALL NOT store separate progress counters but SHALL compute progress from authoritative stat sources
4. WHEN user statistics are updated THEN the Achievement_System SHALL reflect updated progress immediately without caching delays
5. WHEN a user's statistics decrease (e.g., data correction) THEN the Achievement_System SHALL NOT revoke already-earned achievements

### Requirement 9: Achievement Toast Notifications

**User Story:** As a player, I want achievement unlock notifications to appear as toast messages during gameplay, so that I'm informed without interrupting my game.

#### Acceptance Criteria

1. WHEN an achievement is unlocked during gameplay THEN the Achievement_Panel SHALL display a toast notification in the corner of the screen
2. WHEN displaying an achievement toast THEN the Achievement_Panel SHALL show the achievement icon, name, rarity glow effect, and "+3 coins" indicator
3. WHEN displaying an achievement toast THEN the Achievement_Panel SHALL auto-dismiss after 5 seconds with a fade-out animation
4. WHEN multiple achievements unlock simultaneously THEN the Achievement_Panel SHALL queue toasts with 1-second delays between each
5. WHEN the player clicks an achievement toast THEN the Achievement_Panel SHALL navigate to the achievements page with the unlocked achievement highlighted

### Requirement 10: Achievement Statistics Integration

**User Story:** As a player, I want my profile to show achievement statistics, so that others can see my accomplishments.

#### Acceptance Criteria

1. WHEN displaying a player profile THEN the Achievement_System SHALL show total achievements earned and total possible
2. WHEN displaying a player profile THEN the Achievement_System SHALL show achievement breakdown by rarity (e.g., "5 legendary, 12 epic, 20 rare")
3. WHEN displaying a player profile THEN the Achievement_System SHALL show the 3 most recent achievements earned
4. WHEN displaying achievement statistics THEN the Achievement_System SHALL calculate completion percentage (earned / total × 100)
5. WHEN comparing players THEN the Achievement_System SHALL support sorting by achievement count and completion percentage

### Requirement 11: Achievement Data Serialization

**User Story:** As a developer, I want achievement data to be consistently serialized, so that frontend and backend data structures align.

#### Acceptance Criteria

1. WHEN serializing achievement data THEN the Achievement_System SHALL use consistent field names across API responses
2. WHEN serializing achievement progress THEN the Achievement_System SHALL include current_value, target_value, and percentage fields
3. WHEN serializing user achievements THEN the Achievement_System SHALL include the full achievement definition with the earned_at timestamp
4. WHEN serializing achievement lists THEN the Achievement_System SHALL support both flat and grouped-by-category response formats
5. WHEN parsing achievement data THEN the Achievement_Panel SHALL validate response structure using TypeScript interfaces

