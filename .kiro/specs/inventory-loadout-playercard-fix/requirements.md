# Requirements Document

## Introduction

This specification addresses a bug where equipped player cards are not consistently displayed in the Inventory page's "Current Loadout" section and the Lobby's head-to-head display. The issue occurs because certain WebSocket events (like `player_ready`) broadcast player data without enriching it with playercard information, causing the frontend to lose playercard state.

The fix ensures that:
1. All lobby-related WebSocket events include playercard data for players
2. The Inventory page's LoadoutPanel correctly displays the equipped playercard slot
3. The Lobby's HeadToHeadDisplay shows equipped playercards for both players

## Glossary

- **Loadout_System**: The system managing equipped cosmetics stored in the `loadouts` database table
- **Playercard**: A cosmetic type (`playercard`) that displays as a full-art banner in the lobby
- **LoadoutPanel**: The frontend component at `frontend/src/components/inventory/enterprise/LoadoutPanel.tsx` displaying equipped items
- **HeadToHeadDisplay**: The frontend component at `frontend/src/components/lobby/HeadToHeadDisplay.tsx` showing player cards in VS layout
- **Lobby_Handler**: The backend WebSocket handler at `backend/app/websocket/handlers/lobby.py` managing lobby events
- **Player_Enrichment**: The process of adding playercard data to player objects before broadcasting

## Requirements

### Requirement 1: Consistent Playercard Data in WebSocket Events

**User Story:** As a player, I want my equipped playercard to appear in the lobby at all times, so that other players can see my customization regardless of when I joined or readied up.

#### Acceptance Criteria

1.1. WHEN the `handle_ready` method broadcasts player data THEN the Lobby_Handler SHALL enrich all players with their equipped playercard data before broadcasting

1.2. WHEN the `handle_connect` method broadcasts player data THEN the Lobby_Handler SHALL enrich all players with their equipped playercard data (already implemented, verify working)

1.3. WHEN the `handle_disconnect` method broadcasts player data THEN the Lobby_Handler SHALL enrich remaining players with their equipped playercard data

1.4. WHEN any lobby event includes player data THEN each player object SHALL include a `playercard` field containing the equipped playercard cosmetic or null if none equipped

### Requirement 2: LoadoutPanel Playercard Display

**User Story:** As a player, I want to see my equipped playercard in the Inventory's Current Loadout section, so that I can verify what playercard I have equipped before joining a match.

#### Acceptance Criteria

2.1. WHEN the LoadoutPanel renders THEN the system SHALL display a playercard slot alongside the other 6 cosmetic slots (skin, emote, banner, nameplate, effect, trail)

2.2. WHEN a playercard is equipped THEN the LoadoutPanel SHALL display the playercard image with appropriate rarity border styling

2.3. WHEN no playercard is equipped THEN the LoadoutPanel SHALL display an empty slot with the playercard icon (🎴) and "Empty" label

2.4. WHEN a user clicks the playercard slot THEN the system SHALL filter the inventory to show only playercard-type items

### Requirement 3: Lobby Playercard Persistence

**User Story:** As a player, I want my playercard to remain visible in the lobby even after I ready up, so that my customization is consistently displayed.

#### Acceptance Criteria

3.1. WHEN a player readies up THEN the HeadToHeadDisplay SHALL continue showing their equipped playercard

3.2. WHEN a new player joins the lobby THEN the HeadToHeadDisplay SHALL show both players' equipped playercards

3.3. WHEN the lobby state is refreshed THEN the system SHALL preserve playercard data for all players

