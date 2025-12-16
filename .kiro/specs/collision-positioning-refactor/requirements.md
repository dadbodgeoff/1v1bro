# Requirements Document

## Introduction

This specification defines the refactoring of the survival game's collision, physics, and positioning systems into a cleaner, more maintainable architecture. The current system has grown organically with scattered Y positioning logic, duplicated collision box definitions, and fragile initialization order dependencies. This refactor consolidates these concerns into a single source of truth while preserving all existing AAA features and mobile optimizations.

## Glossary

- **TrackSurfaceHeight**: The Y coordinate of the track's walking surface where the player's feet should be placed
- **CollisionBox**: An axis-aligned bounding box (AABB) used for collision detection, defined by min/max X, Y, Z coordinates
- **Coyote Time**: A grace period after leaving a platform edge during which the player can still jump
- **Jump Buffering**: Queuing a jump input before landing so it executes immediately upon touching ground
- **Swept Collision**: Collision detection that checks intermediate positions to prevent tunneling at high speeds
- **Near-Miss Detection**: System that detects when a player narrowly avoids an obstacle for scoring/feedback
- **WorldConfig**: A proposed singleton that holds all world-space constants (track dimensions, lane width, surface height)
- **PlayerDimensions**: The collision box dimensions of the player character (width, height, depth)

## Requirements

### Requirement 1

**User Story:** As a developer, I want a single source of truth for track surface height, so that all systems reference the same value without manual synchronization.

#### Acceptance Criteria

1. WHEN the track is initialized THEN the WorldConfig SHALL calculate and store the track surface height from the track model's bounding box
2. WHEN any system needs track surface height THEN the system SHALL retrieve it from WorldConfig instead of receiving it as a parameter
3. WHEN the WorldConfig is queried before track initialization THEN the WorldConfig SHALL return a safe default value and log a warning
4. WHEN track surface height is set THEN the WorldConfig SHALL notify all subscribed systems of the change

### Requirement 2

**User Story:** As a developer, I want collision box definitions in a single location, so that obstacle collision behavior is consistent and maintainable.

#### Acceptance Criteria

1. WHEN an obstacle is created THEN the ObstacleManager SHALL be the sole owner of collision box definitions
2. WHEN CollisionSystem needs obstacle collision boxes THEN the CollisionSystem SHALL retrieve them via the Collidable interface's getCollisionBox() method
3. WHEN a collision box definition is modified THEN the modification SHALL occur in exactly one file (ObstacleManager)
4. WHEN collision boxes are created THEN the Y coordinates SHALL be calculated relative to WorldConfig.trackSurfaceHeight

### Requirement 3

**User Story:** As a developer, I want player dimensions defined in a single location, so that collision detection and visual representation stay synchronized.

#### Acceptance Criteria

1. WHEN the player character is loaded THEN the PlayerManager SHALL calculate dimensions from the model's bounding box
2. WHEN CollisionSystem needs player dimensions THEN the CollisionSystem SHALL retrieve them from WorldConfig or PlayerManager
3. WHEN player dimensions are set THEN the dimensions SHALL be stored in exactly one authoritative location
4. WHEN player collision boxes are created THEN the CollisionSystem SHALL use the authoritative player dimensions

### Requirement 4

**User Story:** As a developer, I want the player's initial Y position set automatically, so that manual setInitialY() calls are not required.

#### Acceptance Criteria

1. WHEN the player is initialized THEN the PlayerController SHALL automatically position at WorldConfig.trackSurfaceHeight
2. WHEN the track loads after player initialization THEN the PlayerController SHALL update its Y position to match the track surface
3. WHEN the game resets THEN the PlayerController SHALL reset Y position using WorldConfig.trackSurfaceHeight
4. WHEN PlayerController.reset() is called THEN the player SHALL be correctly positioned without additional method calls

### Requirement 5

**User Story:** As a developer, I want to reduce the number of systems that receive trackSurfaceHeight as a parameter, so that the initialization code is simpler.

#### Acceptance Criteria

1. WHEN PhysicsController needs track surface height THEN the PhysicsController SHALL retrieve it from WorldConfig
2. WHEN ObstacleManager needs track surface height THEN the ObstacleManager SHALL retrieve it from WorldConfig
3. WHEN PlayerManager needs track surface height THEN the PlayerManager SHALL retrieve it from WorldConfig
4. WHEN InitializationManager coordinates setup THEN the InitializationManager SHALL set WorldConfig.trackSurfaceHeight once after track loads

### Requirement 6

**User Story:** As a developer, I want all AAA physics features preserved, so that game feel remains unchanged after refactoring.

#### Acceptance Criteria

1. WHEN the player jumps near a platform edge THEN the PhysicsController SHALL apply coyote time allowing jump within the configured grace period
2. WHEN the player presses jump before landing THEN the PhysicsController SHALL buffer the input and execute jump upon landing
3. WHEN the player releases jump early THEN the PhysicsController SHALL apply increased gravity for variable jump height
4. WHEN the player is falling THEN the PhysicsController SHALL apply gravity scaling for snappier descent
5. WHEN the player is airborne THEN the PhysicsController SHALL allow air control input to influence horizontal position

### Requirement 7

**User Story:** As a developer, I want all collision features preserved, so that obstacle interactions work identically after refactoring.

#### Acceptance Criteria

1. WHEN the player narrowly avoids an obstacle THEN the CollisionSystem SHALL detect and report the near-miss with distance
2. WHEN the player takes damage THEN the CollisionSystem SHALL trigger invincibility frames for the configured duration
3. WHEN the player moves at high speed THEN the CollisionSystem SHALL use swept collision to prevent tunneling
4. WHEN the player lands from a jump THEN the PlayerController SHALL trigger landing squash/stretch animation

### Requirement 8

**User Story:** As a developer, I want mobile optimizations preserved, so that touch device gameplay remains responsive.

#### Acceptance Criteria

1. WHEN running on a mobile device THEN the CollisionSystem SHALL use device-specific hitbox tolerance from mobile config
2. WHEN running on a mobile device THEN the PhysicsController SHALL use device-specific coyote time from mobile config
3. WHEN lane switching on mobile THEN the PlayerController SHALL apply the mobile lane speed multiplier
4. WHEN the game initializes THEN all systems SHALL retrieve mobile-specific values from getMobileConfig()

### Requirement 9

**User Story:** As a developer, I want obstacle types to behave correctly, so that slide-under, jump-over, and dodge mechanics work properly.

#### Acceptance Criteria

1. WHEN the player encounters a highBarrier THEN the player SHALL pass through only while sliding (collision box above slide height)
2. WHEN the player encounters a lowBarrier THEN the player SHALL pass through only while jumping (feet above obstacle top)
3. WHEN the player encounters spikes THEN the player SHALL pass through only when in a different lane (X position outside collision box)
4. WHEN the player encounters a knowledgeGate THEN the CollisionSystem SHALL trigger the gate callback without damage
5. WHEN the player encounters a laneBarrier THEN the player SHALL pass through only when in a different lane

### Requirement 10

**User Story:** As a developer, I want a cleaner initialization flow, so that system dependencies are explicit and order-independent where possible.

#### Acceptance Criteria

1. WHEN WorldConfig is created THEN the WorldConfig SHALL be available as a singleton before other systems initialize
2. WHEN systems initialize THEN each system SHALL declare its dependencies explicitly through constructor parameters or WorldConfig access
3. WHEN the track loads THEN the InitializationManager SHALL update WorldConfig before initializing dependent systems
4. WHEN initialization completes THEN all systems SHALL have consistent world configuration values
