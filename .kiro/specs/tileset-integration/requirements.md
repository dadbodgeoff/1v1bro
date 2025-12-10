# Requirements Document

## Introduction

This document specifies the requirements for integrating external tileset assets (from Supabase Storage) into the game engine's rendering pipeline. The current implementation has the infrastructure in place (TilesetLoader, TileRenderer, IndustrialArenaMap) but lacks proper integration with the GameEngine and RenderPipeline. The goal is to enable the game to render maps using the tileset sprite sheets stored in Supabase (floor-tiles.jpg, wall-tiles.jpg, cover-tiles.jpg, hazard-tiles.jpg, prop-tiles.jpg, arena-border.jpg) instead of procedurally generated graphics.

## Glossary

- **Tileset**: A sprite sheet image containing multiple tiles arranged in a grid
- **TilesetLoader**: Singleton class that loads tileset images from Supabase Storage and extracts individual tiles
- **TileRenderer**: Class that renders tile-based terrain using loaded tilesets
- **IndustrialArenaRenderer**: Standalone renderer for industrial-themed maps using the new tileset format
- **ArenaMap**: Data structure defining a map with floor, obstacle, hazard, and prop layers
- **MapConfig**: Standard map configuration format used by the game engine
- **RenderPipeline**: Orchestrates all rendering in correct layer order
- **BackdropSystem**: Manages background layers (parallax, particles, lighting)

## Requirements

### Requirement 1

**User Story:** As a developer, I want the tileset loading to be properly integrated into the asset loading pipeline, so that tilesets are loaded before the game starts rendering.

#### Acceptance Criteria

1. WHEN the GameEngine initializes with an industrial theme map THEN the TilesetLoader SHALL preload all required tilesets (floor-tiles, wall-tiles, cover-tiles, hazard-tiles, prop-tiles, arena-border)
2. WHEN tileset loading fails THEN the GameEngine SHALL fall back to procedural rendering and log the error
3. WHEN tilesets are loaded successfully THEN the GameEngine SHALL set a flag indicating tileset rendering is available
4. WHEN the assets loaded callback fires THEN all required tilesets SHALL be fully loaded and ready for rendering

### Requirement 2

**User Story:** As a developer, I want the RenderPipeline to properly render tileset-based maps, so that the industrial theme displays correctly with all tile layers.

#### Acceptance Criteria

1. WHEN rendering an industrial theme map THEN the RenderPipeline SHALL render tiles in the correct layer order: floor → props → obstacles → hazards → border
2. WHEN the industrial renderer is not ready THEN the RenderPipeline SHALL fall back to the standard ArenaManager rendering
3. WHEN rendering tiles THEN the TileRenderer SHALL use the correct tile indices from the tileset configurations
4. WHEN rendering the arena border THEN the TileRenderer SHALL use 9-slice rendering for the chain-link fence tileset

### Requirement 3

**User Story:** As a developer, I want the MapConfig format to support tileset-based rendering, so that maps can specify which tilesets to use and how tiles are arranged.

#### Acceptance Criteria

1. WHEN a MapConfig specifies theme as 'industrial' THEN the GameEngine SHALL initialize the IndustrialArenaRenderer
2. WHEN converting an ArenaMap to MapConfig THEN the converter SHALL preserve all tile layer information (floor, obstacle, hazard, prop)
3. WHEN loading a map THEN the MapLoader SHALL validate that required tilesets are available
4. WHEN a map uses custom tilesets THEN the MapConfig SHALL include a tilesets array listing required tileset IDs

### Requirement 4

**User Story:** As a developer, I want collision detection to work correctly with tileset-based maps, so that players cannot walk through obstacles.

#### Acceptance Criteria

1. WHEN a tile is marked as solid in the ArenaMap THEN the collision system SHALL prevent player movement through that tile
2. WHEN checking collisions THEN the system SHALL use the tile grid coordinates converted from world positions
3. WHEN an obstacle tile is destroyed THEN the collision system SHALL update to allow movement through that position
4. WHEN the player position is outside the map bounds THEN the collision system SHALL treat it as non-walkable

### Requirement 5

**User Story:** As a developer, I want hazard tiles to deal damage correctly, so that players take damage when standing on hazard zones.

#### Acceptance Criteria

1. WHEN a player stands on a tile marked as damaging THEN the hazard system SHALL apply damage per second based on the tile's damage value
2. WHEN the damage value is not specified THEN the hazard system SHALL use a default damage value of 10
3. WHEN a player leaves a hazard tile THEN the hazard system SHALL stop applying damage immediately
4. WHEN multiple hazard tiles overlap THEN the hazard system SHALL apply damage from the highest damage value only

### Requirement 6

**User Story:** As a developer, I want the tileset system to support background removal, so that AI-generated tileset images with checkered backgrounds render correctly.

#### Acceptance Criteria

1. WHEN loading a tileset image THEN the TilesetLoader SHALL remove checkered/transparent backgrounds by default
2. WHEN a tileset config specifies removeBackground as false THEN the TilesetLoader SHALL preserve the original image
3. WHEN extracting tiles THEN the TilesetLoader SHALL auto-detect tile dimensions from the image size and grid configuration
4. WHEN the background removal fails THEN the TilesetLoader SHALL use the original image and log a warning

### Requirement 7

**User Story:** As a developer, I want to easily add new tilesets to the system, so that I can expand the visual variety of maps.

#### Acceptance Criteria

1. WHEN adding a new tileset THEN the developer SHALL only need to add a config entry to TILESET_CONFIGS and upload the image to Supabase
2. WHEN a tileset config specifies tileWidth and tileHeight as 0 THEN the TilesetLoader SHALL auto-calculate dimensions from the image
3. WHEN creating tile index constants THEN the developer SHALL define named constants for each tile position in the grid
4. WHEN a tileset URL is invalid THEN the TilesetLoader SHALL throw a descriptive error with the attempted URL

### Requirement 8

**User Story:** As a player, I want the industrial map to be selectable in practice mode, so that I can play on the new themed arena.

#### Acceptance Criteria

1. WHEN the industrial map tilesets are loaded successfully THEN the map SHALL appear in the practice mode map selection
2. WHEN selecting the industrial map THEN the game SHALL use the IndustrialArenaRenderer for rendering
3. WHEN the industrial map fails to load THEN the selection UI SHALL show the map as unavailable with an error message
4. WHEN playing on the industrial map THEN all gameplay mechanics (combat, movement, hazards) SHALL function identically to other maps
