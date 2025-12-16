# Implementation Plan

- [x] 1. Create WorldConfig singleton
  - [x] 1.1 Create WorldConfig class with track surface height and player dimensions
    - Create `frontend/src/survival/config/WorldConfig.ts`
    - Implement singleton pattern with `getInstance()`
    - Add `trackSurfaceHeight` with default value (1.3) and initialization flag
    - Add `playerDimensions` with defaults and initialization flag
    - Add `getTrackSurfaceHeight()` that logs warning if not initialized
    - Add `getPlayerDimensions()` getter
    - Add `setTrackSurfaceHeight()` and `setPlayerDimensions()` setters
    - Add `isInitialized()` and `reset()` methods
    - _Requirements: 1.1, 1.3, 3.3_

  - [x] 1.2 Write property test for WorldConfig default value
    - **Property 2: Default value before initialization**
    - **Validates: Requirements 1.3**

- [x] 2. Migrate TrackManager to set WorldConfig
  - [x] 2.1 Update TrackManager to set WorldConfig after calculating surface height
    - Import WorldConfig in TrackManager.ts
    - In `initialize()`, after calculating `trackSurfaceHeight`, call `WorldConfig.getInstance().setTrackSurfaceHeight()`
    - Keep existing `getTrackSurfaceHeight()` method for backward compatibility (delegates to WorldConfig)
    - _Requirements: 1.1, 5.4_

  - [x] 2.2 Write property test for track surface height storage
    - **Property 1: Track surface height storage**
    - **Validates: Requirements 1.1**

- [x] 3. Migrate PhysicsController to read from WorldConfig
  - [x] 3.1 Update PhysicsController to read trackSurfaceHeight from WorldConfig
    - Import WorldConfig in PhysicsController.ts
    - Remove `private trackSurfaceHeight: number` field
    - Remove `setTrackSurfaceHeight()` method
    - Update `checkGround()` to read from `WorldConfig.getInstance().getTrackSurfaceHeight()`
    - _Requirements: 5.1_

  - [x] 3.2 Write property tests for AAA physics features
    - **Property 6: Coyote time jump allowance**
    - **Property 7: Jump buffer execution**
    - **Property 8: Variable jump height gravity**
    - **Property 9: Falling gravity scale**
    - **Property 10: Air control influence**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [x] 4. Migrate ObstacleManager to read from WorldConfig
  - [x] 4.1 Update ObstacleManager to read trackSurfaceHeight from WorldConfig
    - Import WorldConfig in ObstacleManager.ts
    - Remove `private trackSurfaceHeight: number` field
    - Remove `setTrackSurfaceHeight()` method
    - Update `createCollisionBox()` to read from `WorldConfig.getInstance().getTrackSurfaceHeight()`
    - Update `spawnClonedObstacle()` to read from WorldConfig
    - _Requirements: 2.4, 5.2_

  - [x] 4.2 Write property test for collision box Y offset
    - **Property 3: Collision box Y offset**
    - **Validates: Requirements 2.4**

- [x] 5. Checkpoint - Verify track surface height migration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Migrate PlayerController to read from WorldConfig
  - [x] 6.1 Update PlayerController to read trackSurfaceHeight from WorldConfig
    - Import WorldConfig in PlayerController.ts
    - Remove `private trackSurfaceHeight: number` field
    - Remove `setInitialY()` method
    - Update `initialize()` to set Y from `WorldConfig.getInstance().getTrackSurfaceHeight()`
    - Handle case where WorldConfig not yet initialized by using default value (1.3) - PlayerController.initialize() may be called before TrackManager sets WorldConfig
    - Update `reset()` to set Y from WorldConfig (by reset time, WorldConfig will be initialized)
    - _Requirements: 4.1, 4.3, 4.4, 5.3_

  - [x] 6.2 Write property test for player Y positioning
    - **Property 5: Player Y positioning consistency**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 7. Migrate PlayerManager to set player dimensions on WorldConfig
  - [x] 7.1 Update PlayerManager to set player dimensions on WorldConfig
    - Import WorldConfig in PlayerManager.ts
    - In `setupAnimatedCharacter()`, after calculating dimensions, call `WorldConfig.getInstance().setPlayerDimensions()`
    - Remove `setInitialY()` method (PlayerController handles this internally now)
    - _Requirements: 3.1, 3.3_

  - [x] 7.2 Write property test for player collision box dimensions
    - **Property 4: Player collision box dimensions**
    - **Validates: Requirements 3.4**

- [x] 8. Update CollisionSystem to read player dimensions from WorldConfig
  - [x] 8.1 Update CollisionSystem to read player dimensions from WorldConfig
    - Import WorldConfig in CollisionSystem.ts
    - Remove `private playerWidth/playerHeight/playerDepth` fields
    - Remove `setPlayerDimensions()` method
    - Update `createPlayerBox()` to read from `WorldConfig.getInstance().getPlayerDimensions()`
    - _Requirements: 3.2, 3.4_

- [x] 9. Remove duplicate createObstacleBox() from CollisionSystem
  - [x] 9.1 Remove createObstacleBox() method from CollisionSystem
    - First verify `createObstacleBox()` is unused - search for callers in codebase
    - If unused: delete the `createObstacleBox()` method from CollisionSystem.ts
    - If used: update callers to use `obstacle.getCollisionBox()` instead, then delete
    - Verify all collision checks use `obstacle.getCollisionBox()` (Collidable interface)
    - Note: This may be a no-op if already unused - verify before making changes
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 9.2 Write property tests for obstacle type collision rules
    - **Property 16: Obstacle type collision rules**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

- [x] 10. Checkpoint - Verify collision system migration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Simplify InitializationManager
  - [x] 11.1 Update InitializationManager to use WorldConfig
    - Remove `physicsController.setTrackSurfaceHeight()` call
    - Remove `obstacleManager.setTrackSurfaceHeight()` call
    - Remove `playerManager.setInitialY()` call
    - Keep only `WorldConfig.getInstance().setTrackSurfaceHeight()` after track loads (TrackManager does this)
    - Verify initialization order: TrackManager.initialize() → WorldConfig set → other systems read
    - _Requirements: 5.4, 10.3, 10.4_

- [x] 12. Verify AAA features preserved
  - [x] 12.1 Write property tests for collision features
    - **Property 11: Near-miss detection accuracy**
    - **Property 12: Invincibility duration**
    - **Property 13: Swept collision detection**
    - **Property 14: Landing squash trigger**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

  - [ ] 12.2 Write property test for mobile config application
    - **Property 15: Mobile config application**
    - **Validates: Requirements 8.1, 8.2, 8.3**

- [x] 13. Final Checkpoint - Verify all tests pass
  - All 177 tests related to collision-positioning-refactor pass.

- [ ] 14. Smoke test for original bug fix
  - [ ] 14.1 Manual playtest verification
    - Start a new game and immediately run into a lowBarrier WITHOUT jumping first
    - Verify collision is detected correctly on the first obstacle encounter
    - This validates the original bug (player Y position incorrect until first jump/land cycle) is fixed
    - Test on both desktop and mobile if possible
    - _Requirements: 4.1, 9.2_
