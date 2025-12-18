# Requirements Document

## Introduction

This specification defines a Map Registry system for the arena game that enables support for multiple maps. Currently, the arena codebase has 12+ hardcoded Supabase asset URLs scattered across geometry builders, a single global `ARENA_CONFIG` used everywhere, and collision/spawn manifests directly imported in orchestrators. This tightly-coupled architecture makes adding new maps extremely difficult.

The Map Registry system will centralize all map-specific configuration (dimensions, assets, collision, spawns, lighting, props) into discrete `MapDefinition` objects, provide a `MapRegistry` for map discovery and selection, and a `MapLoader` that takes a map ID and loads all required resources. Geometry builders will receive configuration as parameters rather than importing globals.

## Glossary

- **MapDefinition**: A complete data structure containing all configuration, assets, collision geometry, spawn points, lighting, and prop placements for a single arena map
- **MapRegistry**: A singleton service that holds all registered map definitions and provides lookup by map ID
- **MapLoader**: A service that takes a map ID, retrieves the MapDefinition from the registry, and orchestrates loading all assets and building the scene
- **ArenaConfig**: The dimensions, colors, and structural parameters for a map (width, depth, wall height, track configuration, etc.)
- **CollisionManifest**: A collection of AABB (Axis-Aligned Bounding Box) definitions that define solid collision geometry for physics
- **SpawnManifest**: A collection of spawn point positions and arena center for player spawning
- **LightingConfig**: Configuration for all light sources including ambient, directional, point lights with positions, colors, and intensities
- **AssetManifest**: URLs and metadata for all 3D models and textures required by a map
- **PropPlacement**: Position, rotation, and scale data for placing decorative objects in the scene, referencing asset keys from the AssetManifest
- **GeometryBuilder**: A function or class that creates Three.js geometry/meshes, now accepting configuration as a parameter
- **TrackConfig**: Sub-configuration for track dimensions including width, depth, rail spacing, sleeper dimensions, etc.
- **ColorConfig**: Sub-configuration for all map colors including floor, wall, ceiling, fog, track bed, rails, safety lines, etc.

## Requirements

### Requirement 1

**User Story:** As a game developer, I want to define all map-specific data in a single MapDefinition interface, so that I can create new maps by implementing one cohesive data structure.

#### Acceptance Criteria

1. THE MapDefinition interface SHALL include an id field of type string that uniquely identifies the map
2. THE MapDefinition interface SHALL include a name field of type string for display purposes
3. THE MapDefinition interface SHALL include an arenaConfig field containing all dimensional parameters, track configuration, and color configuration
4. THE MapDefinition interface SHALL include an assets field containing all texture and model URLs organized by category
5. THE MapDefinition interface SHALL include a collisionManifest field containing all AABB collision definitions
6. THE MapDefinition interface SHALL include a spawnManifest field containing spawn points and arena center
7. THE MapDefinition interface SHALL include a lightingConfig field containing ambient, hemisphere, directional, and point light definitions with positions
8. THE MapDefinition interface SHALL include a props field containing placement data (position, rotation, scale) for all decorative objects referencing asset keys

### Requirement 2

**User Story:** As a game developer, I want a MapRegistry that stores and retrieves map definitions, so that I can easily add new maps and select between them at runtime.

#### Acceptance Criteria

1. WHEN a map definition is registered THEN the MapRegistry SHALL store the definition indexed by its id
2. WHEN a map is requested by id THEN the MapRegistry SHALL return the corresponding MapDefinition or undefined if not found
3. WHEN all maps are requested THEN the MapRegistry SHALL return an array of all registered MapDefinition objects
4. WHEN a duplicate map id is registered THEN the MapRegistry SHALL throw an error indicating the conflict
5. THE MapRegistry SHALL provide a method to check if a map id exists without retrieving the full definition

### Requirement 3

**User Story:** As a game developer, I want a MapLoader that loads all assets for a given map, so that I can switch between maps without modifying loader code.

#### Acceptance Criteria

1. WHEN the MapLoader loads a map by id THEN the MapLoader SHALL retrieve the MapDefinition from the MapRegistry
2. WHEN the MapLoader loads a map THEN the MapLoader SHALL load all textures defined in the assets.textures field
3. WHEN the MapLoader loads a map THEN the MapLoader SHALL load all 3D models defined in the assets.models field
4. WHEN the MapLoader completes loading THEN the MapLoader SHALL return a LoadedMap object containing all loaded resources
5. IF a map id does not exist in the registry THEN the MapLoader SHALL return an error result
6. IF any asset fails to load THEN the MapLoader SHALL report the failure while continuing to load remaining assets
7. THE MapLoader SHALL provide loading progress callbacks for UI feedback

### Requirement 4

**User Story:** As a game developer, I want geometry builders to accept configuration as parameters, so that they can build geometry for any map without importing global constants.

#### Acceptance Criteria

1. WHEN createFloor is called THEN the function SHALL accept an ArenaConfig parameter instead of importing ARENA_CONFIG
2. WHEN createWalls is called THEN the function SHALL accept an ArenaConfig parameter instead of importing ARENA_CONFIG
3. WHEN createCeiling is called THEN the function SHALL accept an ArenaConfig parameter instead of importing ARENA_CONFIG
4. WHEN createTrackChannel is called THEN the function SHALL accept an ArenaConfig parameter instead of importing ARENA_CONFIG
5. WHEN createAmbientLighting is called THEN the function SHALL accept a LightingConfig parameter instead of using hardcoded positions
6. WHEN any geometry builder is called with a valid config THEN the builder SHALL produce geometry matching the config dimensions

### Requirement 5

**User Story:** As a game developer, I want asset URLs centralized in the MapDefinition, so that I can change assets for a map in one place.

#### Acceptance Criteria

1. THE assets.textures field SHALL contain URLs for floor, wall, ceiling, track, and tunnel textures
2. THE assets.models field SHALL contain URLs for train, subway entrances, carts, terminals, benches, luggage, and wall decorations
3. WHEN a geometry builder needs a texture URL THEN the builder SHALL receive the URL from the LoadedMap rather than hardcoding it
4. WHEN a geometry builder needs a model URL THEN the builder SHALL receive the URL from the LoadedMap rather than hardcoding it
5. THE MapDefinition SHALL support optional assets where a map may not use all asset types

### Requirement 6

**User Story:** As a game developer, I want ArenaScene to accept a LoadedMap, so that it can render any map without hardcoded references.

#### Acceptance Criteria

1. WHEN ArenaScene is constructed THEN the constructor SHALL accept a LoadedMap parameter
2. WHEN ArenaScene builds the arena THEN ArenaScene SHALL use the LoadedMap's config for all dimensional calculations
3. WHEN ArenaScene loads models THEN ArenaScene SHALL use pre-loaded models from LoadedMap instead of loading by URL
4. WHEN ArenaScene applies materials THEN ArenaScene SHALL use pre-loaded textures from LoadedMap
5. WHEN ArenaScene is disposed THEN ArenaScene SHALL properly dispose all resources from the LoadedMap

### Requirement 7

**User Story:** As a game developer, I want collision and spawn manifests to be part of the MapDefinition, so that physics and spawning work correctly for any map.

#### Acceptance Criteria

1. WHEN the CollisionWorld is initialized THEN the CollisionWorld SHALL receive the collisionManifest from the LoadedMap
2. WHEN the SpawnSystem is initialized THEN the SpawnSystem SHALL receive the spawnManifest from the LoadedMap
3. WHEN a player spawns THEN the SpawnSystem SHALL use spawn points from the current map's spawnManifest
4. WHEN collision detection runs THEN the CollisionWorld SHALL use colliders from the current map's collisionManifest

### Requirement 8

**User Story:** As a game developer, I want to migrate the existing Abandoned Terminal map to the new MapDefinition format, so that it serves as a reference implementation.

#### Acceptance Criteria

1. THE AbandonedTerminalMap definition SHALL contain all current ARENA_CONFIG values in its arenaConfig field
2. THE AbandonedTerminalMap definition SHALL contain all 12+ current asset URLs in its assets field
3. THE AbandonedTerminalMap definition SHALL contain the current ABANDONED_TERMINAL_COLLISION_MANIFEST in its collisionManifest field
4. THE AbandonedTerminalMap definition SHALL contain the current ABANDONED_TERMINAL_SPAWN_MANIFEST in its spawnManifest field
5. THE AbandonedTerminalMap definition SHALL contain all current lighting positions and configurations in its lightingConfig field
6. WHEN the game loads with AbandonedTerminalMap THEN the visual and gameplay result SHALL be identical to the current hardcoded implementation

### Requirement 9

**User Story:** As a game developer, I want TypeScript types that enforce map definition completeness, so that I cannot accidentally create incomplete map definitions.

#### Acceptance Criteria

1. THE MapDefinition type SHALL require all mandatory fields (id, name, arenaConfig, collisionManifest, spawnManifest)
2. THE ArenaConfig type SHALL require all dimensional fields (width, depth, wallHeight, ceilingHeight) and include tracks and colors sub-objects
3. THE LightingConfig type SHALL include ambient, hemisphere, keyLight, fillLight configurations and a pointLights array with type, color, intensity, position, distance, and decay for each light
4. THE PropPlacement type SHALL include assetKey referencing assets.models and a positions array with x, y, z, rotationY, and scale for each instance
5. THE AssetManifest type SHALL use optional fields for assets that not all maps require
6. WHEN a MapDefinition is created missing required fields THEN TypeScript SHALL report a compile-time error
7. THE types SHALL be exported from a central types file for use across the codebase
