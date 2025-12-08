# Requirements Document

## Introduction

This document specifies the requirements for a comprehensive dashboard redesign for 1v1 Bro. The current dashboard (Home.tsx) provides basic lobby/matchmaking functionality but lacks navigation to the many new features added through the user-services-microservices spec, including Profile management, Battle Pass progression, Cosmetics/Shop, and enhanced ELO-based leaderboards. The redesign will create a modern, game-launcher style dashboard that serves as the central hub for all player activities.

## Glossary

- **Dashboard**: The main authenticated user interface shown after login at /dashboard
- **Player Card**: A compact display showing user avatar, display name, rank badge, and level
- **Battle Pass Widget**: A summary component showing current season progress and XP
- **Quick Actions**: Primary gameplay buttons (Find Match, Create Lobby, etc.)
- **Navigation Sidebar**: Left-side menu for accessing all features
- **Rank Badge**: Visual indicator of player's ELO tier (Bronze through Grandmaster)
- **XP Progress Bar**: Visual representation of progress toward next level/tier

## Requirements

### Requirement 1

**User Story:** As a player, I want to see my profile summary on the dashboard, so that I can quickly view my avatar, rank, and level without navigating away.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the Dashboard SHALL display the user's avatar image in the header area
2. WHEN the dashboard loads THEN the Dashboard SHALL display the user's display name next to the avatar
3. WHEN the dashboard loads THEN the Dashboard SHALL display the user's current rank badge with tier icon
4. WHEN the dashboard loads THEN the Dashboard SHALL display the user's current level and XP progress bar
5. WHEN a user clicks on their profile summary THEN the Dashboard SHALL navigate to the profile page

### Requirement 2

**User Story:** As a player, I want quick access to all game modes and features, so that I can easily navigate to any part of the application.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the Dashboard SHALL display a navigation sidebar with links to all major features
2. WHEN a user clicks a navigation item THEN the Dashboard SHALL navigate to the corresponding page
3. THE Dashboard SHALL include navigation links for: Play, Profile, Battle Pass, Shop, Inventory, Leaderboards, Friends, and Settings
4. WHEN viewing on mobile THEN the Dashboard SHALL collapse the sidebar into a hamburger menu

### Requirement 3

**User Story:** As a player, I want prominent play options on the dashboard, so that I can quickly start a match.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the Dashboard SHALL display a prominent "Find Match" button as the primary action
2. WHEN the dashboard loads THEN the Dashboard SHALL display "Create Lobby" and "Join Lobby" as secondary actions
3. WHEN a user clicks "Find Match" THEN the Dashboard SHALL initiate matchmaking queue
4. WHEN a user is in queue THEN the Dashboard SHALL display queue status with time and position
5. WHEN a match is found THEN the Dashboard SHALL display the match found modal

### Requirement 4

**User Story:** As a player, I want to see my Battle Pass progress on the dashboard, so that I can track my seasonal progression.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the Dashboard SHALL display a Battle Pass widget showing current tier
2. WHEN the dashboard loads THEN the Dashboard SHALL display XP progress toward next tier
3. WHEN the dashboard loads THEN the Dashboard SHALL display number of claimable rewards if any
4. WHEN a user clicks the Battle Pass widget THEN the Dashboard SHALL navigate to the Battle Pass page
5. IF the user has unclaimed rewards THEN the Dashboard SHALL display a notification badge on the widget

### Requirement 5

**User Story:** As a player, I want to see my recent match history on the dashboard, so that I can review my performance.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the Dashboard SHALL display the last 3-5 recent matches
2. WHEN displaying a match THEN the Dashboard SHALL show opponent name, result (win/loss), and ELO change
3. WHEN a user clicks on a match THEN the Dashboard SHALL navigate to match details or replay
4. IF the user has no match history THEN the Dashboard SHALL display a prompt to play their first match

### Requirement 6

**User Story:** As a player, I want to see my friends' online status on the dashboard, so that I can quickly invite them to play.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the Dashboard SHALL display a friends widget showing online friends
2. WHEN displaying online friends THEN the Dashboard SHALL show avatar, name, and current activity
3. WHEN a user clicks on an online friend THEN the Dashboard SHALL show options to invite or message
4. WHEN a user clicks "View All Friends" THEN the Dashboard SHALL open the friends panel

### Requirement 7

**User Story:** As a player, I want the dashboard to have a modern, game-launcher aesthetic, so that the experience feels polished and engaging.

#### Acceptance Criteria

1. THE Dashboard SHALL use a dark theme consistent with the existing design system
2. THE Dashboard SHALL use smooth animations for transitions and interactions
3. THE Dashboard SHALL organize content into clear visual sections with appropriate spacing
4. THE Dashboard SHALL be fully responsive across desktop, tablet, and mobile viewports
5. THE Dashboard SHALL load within 2 seconds on standard connections

### Requirement 8

**User Story:** As a player, I want dedicated pages for Profile, Battle Pass, Shop, and Inventory, so that I can access all features.

#### Acceptance Criteria

1. WHEN a user navigates to /profile THEN the System SHALL display the profile page with ProfileCard and ProfileEditor
2. WHEN a user navigates to /battlepass THEN the System SHALL display the Battle Pass page with BattlePassTrack and XPProgress
3. WHEN a user navigates to /shop THEN the System SHALL display the shop page with ShopGrid
4. WHEN a user navigates to /inventory THEN the System SHALL display the inventory page with InventoryGrid and LoadoutDisplay
5. THE System SHALL add all new routes to App.tsx with proper authentication guards

### Requirement 9

**User Story:** As a player, I want a settings page to manage my account, so that I can update preferences and privacy settings.

#### Acceptance Criteria

1. WHEN a user navigates to /settings THEN the System SHALL display account settings options
2. THE Settings page SHALL include privacy settings toggles
3. THE Settings page SHALL include notification preferences
4. THE Settings page SHALL include a sign out button
5. THE Settings page SHALL include 2FA management options

### Requirement 10

**User Story:** As a developer, I want all dashboard data to flow correctly between frontend and backend, so that users see accurate and consistent information.

#### Acceptance Criteria

1. WHEN the frontend fetches profile data THEN the System SHALL use the correct endpoint path `/api/v1/profiles/me`
2. WHEN the frontend fetches battle pass progress THEN the System SHALL use the correct endpoint path `/api/v1/battlepass/me`
3. WHEN the frontend displays rank tier THEN the System SHALL normalize case differences between frontend and backend tier names
4. WHEN the frontend uploads avatar/banner THEN the System SHALL use `storage_path` field from the signed URL response
5. WHEN the frontend displays match history THEN the System SHALL show opponent name, avatar, and ELO change from enhanced endpoint
6. WHEN the frontend displays claimable rewards count THEN the System SHALL use the length of the `claimable_rewards` array from backend
