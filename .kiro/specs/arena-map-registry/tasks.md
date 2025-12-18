# Implementation Plan

- [x] 1. Create core type definitions and MapRegistry
  - [x] 1.1 Create maps/types.ts with all interfaces
    - Define Position3, Vector3Config, TrackConfig, ColorConfig, ArenaConfig
    - Define TextureAssets, ModelAssets, AssetManifest
    - Define LightingConfig and all light sub-types
    - Define PropPlacement, PropInstance
    - Define MapDefinition interface
    - Re-export CollisionManifest and SpawnManifest from existing modules
    - Add DRACO_DECODER_PATH constant
    - _Requirements: 1.1-1.8, 9.1-9.5_

  - [x] 1.2 Create maps/MapRegistry.ts singleton
    - Implement register() method that stores by id
    - Implement get() method returning MapDefinition | undefined
    - Implement has() method returning boolean
    - Implement getAll() method returning MapDefinition[]
    - Implement getIds() method returning string[]
    - Throw DuplicateMapIdError on duplicate registration
    - _Requirements: 2.1-2.5_

  - [x] 1.3 Write property tests for MapRegistry
    - **Property 1: Registry Registration Round-Trip**
    - **Property 2: Registry Has Consistency**
    - **Property 3: Registry GetAll Completeness**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.5**

- [x] 2. Create MapLoader service
  - [x] 2.1 Create maps/MapLoader.ts
    - Implement load() method that retrieves from registry
    - Implement loadTextures() for parallel texture loading
    - Implement loadModels() for parallel model loading with Draco
    - Return Result<LoadedMap, MapLoadError>
    - Handle partial failures gracefully
    - Implement progress callbacks
    - _Requirements: 3.1-3.7_

  - [x] 2.2 Write unit tests for MapLoader
    - Test successful load flow
    - Test map not found error
    - Test partial asset failure handling
    - Test progress callback invocation
    - _Requirements: 3.1-3.7_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create AbandonedTerminalMap definition
  - [x] 4.1 Create maps/definitions/AbandonedTerminalMap.ts
    - Extract all values from current ARENA_CONFIG into arenaConfig
    - Collect all 12+ asset URLs into assets.textures and assets.models
    - Import existing ABANDONED_TERMINAL_COLLISION_MANIFEST
    - Import existing ABANDONED_TERMINAL_SPAWN_MANIFEST
    - Extract lighting positions from LightingBuilder into lightingConfig
    - Extract prop positions from PropBuilder, LuggageBuilder, CartBuilder, FareTerminalBuilder into props array
    - _Requirements: 8.1-8.5_

  - [x] 4.2 Create maps/definitions/index.ts
    - Export AbandonedTerminalMap
    - Register map with MapRegistry on import
    - _Requirements: 2.1_

  - [x] 4.3 Write unit tests for AbandonedTerminalMap migration
    - Verify arenaConfig values match original ARENA_CONFIG
    - Verify all asset URLs are present
    - Verify collision manifest matches original
    - Verify spawn manifest matches original
    - Verify lighting config has correct number of lights
    - **Validates: Requirements 8.1-8.5**

- [x] 5. Refactor geometry builders to accept config parameters
  - [x] 5.1 Update FloorBuilder.ts
    - Change createFloor signature to accept ArenaConfig parameter
    - Replace ARENA_CONFIG imports with parameter usage
    - Update createCeiling signature similarly
    - _Requirements: 4.1, 4.3_

  - [x] 5.2 Update WallBuilder.ts
    - Change createWalls signature to accept ArenaConfig parameter
    - Replace ARENA_CONFIG imports with parameter usage
    - _Requirements: 4.2_

  - [x] 5.3 Update TrackBuilder.ts
    - Change createTrackChannel signature to accept ArenaConfig parameter
    - Change createPlatformEdges signature to accept ArenaConfig parameter
    - Replace ARENA_CONFIG imports with parameter usage
    - _Requirements: 4.4_

  - [x] 5.4 Update LightingBuilder.ts
    - Change createAmbientLighting signature to accept LightingConfig parameter
    - Replace hardcoded light positions with config values
    - Replace hardcoded colors/intensities with config values
    - _Requirements: 4.5_

  - [x] 5.5 Write property test for geometry builder dimensions
    - **Property 4: Geometry Builder Dimension Consistency**
    - Generate random ArenaConfig values
    - Verify floor geometry bounds match config dimensions
    - **Validates: Requirements 4.1, 4.6**

  - [x] 5.6 Write property test for lighting builder
    - **Property 6: Lighting Config Point Light Count**
    - Generate random LightingConfig with varying pointLights array
    - Verify output Group contains correct number of lights
    - **Validates: Requirements 4.5**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Refactor model builders to use LoadedMap
  - [ ] 7.1 Update TrainBuilder.ts
    - Remove hardcoded TRAIN_URL
    - Accept pre-loaded model from LoadedMap
    - Use DRACO_DECODER_PATH from types.ts
    - _Requirements: 5.3, 5.4_

  - [ ] 7.2 Update CartBuilder.ts
    - Remove hardcoded CART_URL
    - Accept pre-loaded model from LoadedMap
    - Use DRACO_DECODER_PATH from types.ts
    - _Requirements: 5.3, 5.4_

  - [ ] 7.3 Update SubwayEntranceBuilder.ts
    - Remove hardcoded SUBWAY_GLB_URL
    - Accept pre-loaded model from LoadedMap
    - _Requirements: 5.3, 5.4_

  - [ ] 7.4 Update FareTerminalBuilder.ts
    - Remove hardcoded TERMINAL_URL
    - Accept pre-loaded model from LoadedMap
    - Accept positions from props config
    - Use DRACO_DECODER_PATH from types.ts
    - _Requirements: 5.3, 5.4_

  - [ ] 7.5 Update PropBuilder.ts
    - Remove hardcoded ASSETS URLs
    - Accept pre-loaded models from LoadedMap
    - Accept positions from props config
    - Use DRACO_DECODER_PATH from types.ts
    - _Requirements: 5.3, 5.4_

  - [ ] 7.6 Update LuggageBuilder.ts
    - Remove hardcoded LUGGAGE_URL
    - Accept pre-loaded model from LoadedMap
    - Accept positions from props config
    - Use DRACO_DECODER_PATH from types.ts
    - _Requirements: 5.3, 5.4_

- [ ] 8. Refactor texture loaders to use LoadedMap
  - [ ] 8.1 Update FloorMaterialLoader.ts
    - Remove hardcoded FLOOR_ATLAS_URL
    - Accept pre-loaded texture from LoadedMap
    - _Requirements: 5.3_

  - [ ] 8.2 Update WallMaterialLoader.ts
    - Remove hardcoded WALL_TEXTURE_URL
    - Accept pre-loaded texture from LoadedMap
    - _Requirements: 5.3_

  - [ ] 8.3 Update CeilingMaterialLoader.ts
    - Remove hardcoded CEILING_TEXTURE_URL
    - Accept pre-loaded texture from LoadedMap
    - _Requirements: 5.3_

  - [ ] 8.4 Update TrackTextureLoader.ts
    - Remove hardcoded TRACK_TEXTURE_URL and TUNNEL_TEXTURE_URL
    - Accept pre-loaded textures from LoadedMap
    - _Requirements: 5.3_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Refactor ArenaScene to use LoadedMap
  - [ ] 10.1 Update ArenaScene constructor
    - Change constructor to accept LoadedMap parameter
    - Store loadedMap as instance property
    - Pass config to geometry builders
    - Pass lightingConfig to lighting builder
    - Use pre-loaded textures and models
    - _Requirements: 6.1-6.4_

  - [ ] 10.2 Update ArenaScene dispose method
    - Dispose all textures from LoadedMap
    - Dispose all models from LoadedMap
    - _Requirements: 6.5_

  - [ ] 10.3 Write unit tests for ArenaScene with LoadedMap
    - Test constructor accepts LoadedMap
    - Test scene uses config dimensions
    - Test dispose cleans up resources
    - _Requirements: 6.1-6.5_

- [ ] 11. Update game systems to use LoadedMap
  - [ ] 11.1 Update CollisionWorld initialization
    - Accept collisionManifest from LoadedMap
    - Remove direct import of ABANDONED_TERMINAL_COLLISION_MANIFEST
    - _Requirements: 7.1, 7.4_

  - [ ] 11.2 Update SpawnSystem initialization
    - Accept spawnManifest from LoadedMap
    - Remove direct import of ABANDONED_TERMINAL_SPAWN_MANIFEST
    - _Requirements: 7.2_

  - [ ] 11.3 Write property test for spawn point validity
    - **Property 5: Spawn Point Validity**
    - Generate random SpawnManifest
    - Verify spawn operations return positions from manifest
    - **Validates: Requirements 7.3**

- [ ] 12. Update orchestrators and entry points
  - [ ] 12.1 Update ClientOrchestrator
    - Use MapLoader to load map before initializing scene
    - Pass LoadedMap to ArenaScene, CollisionWorld, SpawnSystem
    - _Requirements: 3.1, 6.1, 7.1, 7.2_

  - [ ] 12.2 Update ArenaPlayTest.tsx
    - Add map selection UI (optional, can default to abandoned_terminal)
    - Use MapLoader to load selected map
    - Show loading progress
    - _Requirements: 3.7_

  - [ ] 12.3 Create maps/index.ts public API
    - Export MapRegistry, MapLoader, types
    - Export map definitions
    - _Requirements: 9.7_

- [ ] 13. Final verification and cleanup
  - [ ] 13.1 Verify visual equivalence
    - Load game with AbandonedTerminalMap
    - Verify rendering matches original hardcoded implementation
    - Verify collision works correctly
    - Verify spawning works correctly
    - _Requirements: 8.6_

  - [ ] 13.2 Remove deprecated code
    - Add deprecation comments to config/ArenaConfig.ts
    - Add deprecation comments to config/AbandonedTerminalManifest.ts
    - Update any remaining imports to use new map system
    - _Requirements: 8.6_

- [ ] 14. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
