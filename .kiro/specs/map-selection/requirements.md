# Requirements Document

## Introduction

This feature adds map selection to the matchmaking and lobby flow, allowing players to choose which arena map they want to play on. Currently, the game defaults to Nexus Arena with no way to select Vortex Arena. The system will add map selection UI to the category selection screen and pass the selected map through matchmaking to the game engine.

## Glossary

- **Map_System**: The frontend system responsible for loading, validating, and rendering map configurations
- **Map_Config**: A TypeScript object defining all map properties (tiles, barriers, hazards, spawns, etc.)
- **Nexus_Arena**: The default space-themed arena map with three-lane horizontal layout
- **Vortex_Arena**: The volcanic-themed arena map with radial/orbital layout
- **Category_Selection**: The UI screen where players choose trivia category before matchmaking
- **Lobby_Service**: Backend service managing lobby creation and state
- **Game_Engine**: Frontend engine that renders the arena and handles gameplay

## Requirements

### Requirement 1: Map Selection UI

**User Story:** As a player, I want to select which arena map to play on, so that I can experience different gameplay environments.

#### Acceptance Criteria

1. WHEN a player opens the matchmaking screen THEN the Map_System SHALL display map selection options alongside category selection
2. WHEN displaying map options THEN the Map_System SHALL show a thumbnail preview and name for each available map
3. WHEN no map is selected THEN the Map_System SHALL default to Nexus_Arena
4. WHEN a player selects a map THEN the Map_System SHALL visually indicate the selected map with a highlight or border
5. WHEN a player clicks "Find Match" THEN the Map_System SHALL include the selected map in the matchmaking request

### Requirement 2: Map Data Flow Through Matchmaking

**User Story:** As a developer, I want map selection to flow through the matchmaking system, so that matched players play on the same map.

#### Acceptance Criteria

1. WHEN a player joins the matchmaking queue THEN the Matchmaking_Service SHALL store the selected map slug alongside the category
2. WHEN matching two players THEN the Matchmaking_Service SHALL only match players who selected the same map
3. WHEN creating a lobby from a match THEN the Lobby_Service SHALL store the map slug in the lobby record
4. WHEN the lobby is retrieved THEN the Lobby_Service SHALL include the map slug in the response

### Requirement 3: Lobby Map Display

**User Story:** As a player in a lobby, I want to see which map we're playing on, so that I know what to expect.

#### Acceptance Criteria

1. WHEN a player enters a lobby THEN the Lobby_UI SHALL display the selected map name
2. WHEN displaying the lobby THEN the Lobby_UI SHALL show a map thumbnail or preview
3. WHEN the game_start event is sent THEN the event payload SHALL include the map slug

### Requirement 4: Game Engine Map Loading

**User Story:** As a developer, I want the game engine to load the correct map, so that players play on their selected arena.

#### Acceptance Criteria

1. WHEN the game starts THEN the Game_Engine SHALL receive the map slug from the game_start event
2. WHEN loading a map THEN the Game_Engine SHALL use the map slug to select the correct MapConfig
3. IF the map slug is "nexus-arena" THEN the Game_Engine SHALL load NEXUS_ARENA configuration
4. IF the map slug is "vortex-arena" THEN the Game_Engine SHALL load VORTEX_ARENA configuration
5. IF the map slug is invalid or missing THEN the Game_Engine SHALL default to NEXUS_ARENA

### Requirement 5: Database Schema

**User Story:** As a developer, I want map selection stored in the database, so that the selection persists through the matchmaking flow.

#### Acceptance Criteria

1. THE lobbies table SHALL have a map_slug column of type VARCHAR(50)
2. WHEN a lobby is created THEN the Lobby_Service SHALL store the map_slug value
3. THE map_slug column SHALL default to "nexus-arena" for backwards compatibility

### Requirement 6: WebSocket Events

**User Story:** As a developer, I want map information in WebSocket events, so that clients can load the correct map.

#### Acceptance Criteria

1. WHEN building a lobby_state event THEN the event payload SHALL include a map_slug field
2. WHEN building a game_start event THEN the event payload SHALL include a map_slug field
3. WHEN building a match_found event THEN the event payload SHALL include a map_slug field

