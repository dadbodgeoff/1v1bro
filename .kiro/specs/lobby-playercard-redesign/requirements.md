# Requirements Document

## Introduction

This feature redesigns the Lobby page to display player cards in a fighting-game style head-to-head layout. Players will see their equipped playercard cosmetic displayed prominently alongside their opponent's card. This is an additive cosmetic enhancement that preserves all existing lobby functionality (joining, leaving, ready state, game start).

## Glossary

- **Playercard**: A full-art cosmetic item of type `playercard` that displays as a vertical card banner in the lobby
- **Lobby**: The waiting room where two players gather before starting a match
- **Loadout**: The collection of currently equipped cosmetics for a user
- **Head-to-Head Layout**: A visual arrangement where two player cards face each other, similar to fighting game character select screens
- **Player**: A user who has joined a lobby, represented by the existing `Player` type

## Requirements

### Requirement 1

**User Story:** As a player, I want to see my equipped playercard displayed in the lobby, so that I can show off my cosmetic collection to my opponent.

#### Acceptance Criteria

1. WHEN a player joins a lobby THEN the Lobby Page SHALL display the player's equipped playercard image if one is equipped
2. WHEN a player has no equipped playercard THEN the Lobby Page SHALL display a default placeholder card design
3. WHEN the playercard is displayed THEN the Lobby Page SHALL show the player's display name below or on the card
4. WHEN the playercard is displayed THEN the Lobby Page SHALL preserve all existing player status indicators (host badge, ready state)

### Requirement 2

**User Story:** As a player, I want to see my opponent's playercard in a head-to-head layout, so that the lobby feels like a competitive matchup screen.

#### Acceptance Criteria

1. WHEN two players are in the lobby THEN the Lobby Page SHALL display both playercards in a side-by-side head-to-head arrangement
2. WHEN only one player is in the lobby THEN the Lobby Page SHALL display a "waiting for opponent" placeholder on the opponent's side
3. WHEN displaying the head-to-head layout THEN the Lobby Page SHALL position the current user's card on the left and the opponent's card on the right
4. WHEN displaying the head-to-head layout THEN the Lobby Page SHALL include a "VS" indicator between the two cards

### Requirement 3

**User Story:** As a player, I want the lobby to fetch playercard data without breaking existing functionality, so that the lobby remains stable and responsive.

#### Acceptance Criteria

1. WHEN the lobby loads THEN the System SHALL fetch playercard data for all players in the lobby
2. WHEN playercard data fails to load THEN the Lobby Page SHALL gracefully fall back to the default placeholder without blocking lobby functionality
3. WHEN a new player joins the lobby THEN the System SHALL fetch and display their playercard data
4. WHEN fetching playercard data THEN the System SHALL NOT modify or interfere with existing lobby WebSocket events (player_joined, player_left, player_ready, game_start)

### Requirement 4

**User Story:** As a developer, I want the playercard display to be a reusable component, so that it can be used in other parts of the application.

#### Acceptance Criteria

1. WHEN implementing the playercard display THEN the System SHALL create a standalone `PlayerCardBanner` component
2. WHEN the `PlayerCardBanner` component receives a playercard cosmetic THEN the Component SHALL render the card image with the player's name
3. WHEN the `PlayerCardBanner` component receives no playercard THEN the Component SHALL render a styled default placeholder
4. WHEN the `PlayerCardBanner` component is used THEN the Component SHALL accept optional props for size variants (small, medium, large)

### Requirement 5

**User Story:** As a backend developer, I want to extend the Player data to include playercard information, so that the frontend can display it without additional API calls.

#### Acceptance Criteria

1. WHEN a player's data is sent via WebSocket THEN the Player payload SHALL include an optional `playercard` field containing the equipped playercard cosmetic data
2. WHEN a player has no equipped playercard THEN the `playercard` field SHALL be null
3. WHEN extending the Player type THEN the System SHALL maintain backward compatibility with existing Player fields (id, display_name, is_host, is_ready)
4. WHEN the loadout schema is updated THEN the System SHALL add `playercard_equipped` field to the Loadout schema
