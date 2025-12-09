# Implementation Plan

- [x] 1. Database migration for map_slug
  - [x] 1.1 Create migration file to add map_slug column to lobbies table
    - Add VARCHAR(50) column with default 'nexus-arena'
    - Add index for map_slug queries
    - _Requirements: 5.1, 5.3_

- [x] 2. Backend model and repository updates
  - [x] 2.1 Update MatchTicket model to include map_slug field
    - Add map_slug field with default "nexus-arena"
    - Update to_dict and from_dict methods
    - _Requirements: 2.1_
  - [x] 2.2 Write property test for MatchTicket map_slug storage
    - **Property 3: Match ticket stores map**
    - **Validates: Requirements 2.1**
  - [x] 2.3 Update lobby_repo.py to store and retrieve map_slug
    - Update create_lobby to accept and store map_slug
    - Ensure get_by_code and get_active_by_code return map_slug
    - _Requirements: 2.3, 2.4, 5.2_
  - [x] 2.4 Write property test for lobby map_slug round-trip
    - **Property 5: Lobby stores and returns map**
    - **Validates: Requirements 2.3, 2.4, 5.2**

- [x] 3. Matchmaking service updates
  - [x] 3.1 Update join_queue to accept map_slug parameter
    - Pass map_slug to MatchTicket creation
    - _Requirements: 2.1_
  - [x] 3.2 Update queue_manager.find_match to only match same-map players
    - Filter candidates by map_slug before matching
    - _Requirements: 2.2_
  - [x] 3.3 Write property test for same-map matching
    - **Property 4: Same-map matching only**
    - **Validates: Requirements 2.2**
  - [x] 3.4 Update _create_match to pass map_slug to lobby creation
    - Extract map_slug from matched ticket
    - Pass to lobby_service.create_lobby
    - _Requirements: 2.3_

- [x] 4. Checkpoint - Backend tests passing
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. WebSocket event updates
  - [x] 5.1 Update build_lobby_state to include map_slug parameter
    - Add map_slug parameter with default "nexus-arena"
    - Include in payload
    - _Requirements: 6.1_
  - [x] 5.2 Update build_game_start to include map_slug parameter
    - Add map_slug parameter with default "nexus-arena"
    - Include in payload
    - _Requirements: 6.2_
  - [x] 5.3 Update MatchFoundEvent to include map_slug
    - Add map_slug field to dataclass
    - Update to_dict method
    - _Requirements: 6.3_
  - [x] 5.4 Write property test for WebSocket events including map_slug
    - **Property 6: WebSocket events include map**
    - **Validates: Requirements 3.3, 6.1, 6.2, 6.3**

- [x] 6. Lobby handler updates
  - [x] 6.1 Update handle_start_game to pass map_slug to game_start event
    - Read map_slug from lobby
    - Pass to build_game_start
    - _Requirements: 3.3_
  - [x] 6.2 Update handle_connect to include map_slug in lobby_state
    - Pass map_slug to build_lobby_state
    - _Requirements: 6.1_

- [x] 7. WebSocket message handler for queue_join
  - [x] 7.1 Update queue_join handler to extract map_slug from payload
    - Parse map_slug from message payload
    - Default to "nexus-arena" if missing
    - Pass to matchmaking_service.join_queue
    - _Requirements: 1.5, 2.1_

- [x] 8. Checkpoint - Backend integration complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Frontend map loading utility
  - [x] 9.1 Create map-loader.ts with getMapConfig function
    - Create MAP_REGISTRY mapping slugs to configs
    - Implement getMapConfig with fallback to NEXUS_ARENA
    - Export getAvailableMaps helper
    - _Requirements: 4.2, 4.5_
  - [x] 9.2 Write property test for map slug to config mapping
    - **Property 7: Map slug to config mapping**
    - **Validates: Requirements 4.2**
  - [x] 9.3 Write property test for invalid map defaults
    - **Property 8: Invalid map defaults to Nexus**
    - **Validates: Requirements 4.5**

- [x] 10. Frontend MapSelector component
  - [x] 10.1 Create MapSelector component
    - Display available maps with thumbnails and names
    - Handle selection with visual feedback
    - Follow CategorySelector pattern
    - _Requirements: 1.1, 1.2, 1.4_
  - [x] 10.2 Write unit test for MapSelector rendering
    - **Property 1: Map selection renders all available maps**
    - **Validates: Requirements 1.2**

- [x] 11. Frontend matchmaking integration
  - [x] 11.1 Update QuickActionsWidget to include MapSelector
    - Add selectedMap state with default "nexus-arena"
    - Render MapSelector alongside CategorySelector
    - _Requirements: 1.1, 1.3_
  - [x] 11.2 Update useMatchmaking hook to accept map_slug
    - Add map_slug parameter to joinQueue function
    - Include in queue_join WebSocket message
    - _Requirements: 1.5_
  - [x] 11.3 Write property test for matchmaking request includes map
    - **Property 2: Matchmaking request includes map**
    - **Validates: Requirements 1.5**

- [x] 12. Frontend game engine integration
  - [x] 12.1 Update useArenaGame to extract map_slug from game_start
    - Parse map_slug from game_start payload
    - Store in state for GameArena
    - _Requirements: 4.1_
  - [x] 12.2 Update GameArena to load map from slug
    - Use getMapConfig to convert slug to MapConfig
    - Pass mapConfig to GameEngine
    - _Requirements: 4.2, 4.3, 4.4_

- [x] 13. Frontend lobby display
  - [x] 13.1 Update Lobby page to display selected map
    - Show map name and thumbnail
    - Read from lobby_state event
    - _Requirements: 3.1, 3.2_

- [x] 14. Final Checkpoint - Full integration
  - Ensure all tests pass, ask the user if questions arise.

