# Requirements Document

## Introduction

This specification defines a production-grade, server-authoritative 3D physics and multiplayer netcode system for a competitive 1v1 Arena Shooter. The architecture follows industry-standard patterns used by AAA studios (Valve Source Engine, Unreal Networking, Overwatch GDC talks) with strict separation of concerns, deterministic simulation, and zero-tolerance for race conditions.

The system is designed for:
- **Modularity**: Each subsystem is independently testable and replaceable
- **Scalability**: Architecture supports future expansion to N-player matches
- **Enterprise Quality**: No placeholders, no TODOs, complete error handling, TypeScript strict mode
- **Studio Readiness**: Code quality suitable for professional game development teams

## Glossary

- **Server Authority**: The server is the single source of truth for all game state; clients render predictions and reconcile with authoritative state
- **Tick**: A discrete simulation step; server runs at fixed 60Hz (16.67ms per tick)
- **Tick Number**: Monotonically increasing uint32 identifying each simulation frame
- **Client Prediction**: Client-side physics simulation using identical deterministic logic as server
- **Reconciliation**: Process of correcting client state when server authority diverges from prediction
- **Interpolation**: Rendering remote entities between two known authoritative snapshots
- **Extrapolation**: Predicting entity position beyond last known snapshot (max 100ms)
- **Lag Compensation**: Server rewinding world state to validate hits at client's perceived time
- **RTT**: Round-Trip Time - measured latency between client and server
- **Jitter**: Variance in packet arrival times
- **Snapshot**: Complete serialized game state at a specific tick
- **Delta Snapshot**: Compressed state containing only changes since last acknowledged snapshot
- **Input Buffer**: Client-side queue of inputs awaiting server acknowledgment
- **Replay Buffer**: Server-side history of world states for lag compensation
- **Collision Mesh**: Simplified geometry for physics (separate from render geometry)
- **AABB**: Axis-Aligned Bounding Box - fast collision primitive
- **Player Capsule**: Collision shape (radius=0.4m, height=1.8m, eye height=1.6m)
- **Hitscan**: Instantaneous raycast weapon (no projectile travel time)
- **Coyote Time**: Grace period (100ms) allowing jump after leaving ground
- **State Machine**: Finite automaton governing match phases and player states
- **Event Bus**: Decoupled pub/sub system for cross-system communication
- **Result Type**: Discriminated union for explicit error handling (Ok/Err pattern)

## Requirements

### Requirement 1: Deterministic Tick System

**User Story:** As a game developer, I want a deterministic fixed-timestep simulation, so that client prediction exactly matches server physics and reconciliation is minimal.

#### Acceptance Criteria

1. WHEN the server game loop executes THEN the TickScheduler SHALL maintain exactly 60 ticks per second with fixed 16.67ms delta time
2. WHEN tick processing exceeds 16.67ms THEN the TickScheduler SHALL skip render frames while maintaining physics consistency and log a performance warning
3. WHEN processing a tick THEN the TickProcessor SHALL execute subsystems in deterministic order: Input → Physics → Collision → Combat → State Broadcast
4. WHEN multiple inputs arrive for the same tick THEN the TickProcessor SHALL process them in sequence_number order to ensure determinism
5. WHEN the tick number reaches MAX_UINT32 THEN the TickScheduler SHALL wrap to zero and handle comparison correctly using modular arithmetic

### Requirement 2: Server-Side 3D Physics

**User Story:** As a game developer, I want physics calculations to run identically on server and client, so that prediction matches authority and cheating is prevented.

#### Acceptance Criteria

1. WHEN the Physics3D system processes a tick THEN the system SHALL apply forces in order: gravity → player input → friction → collision response
2. WHEN a player is airborne THEN the Physics3D system SHALL apply gravity acceleration of -20 units/sec² until grounded flag is set
3. WHEN a player requests jump while grounded OR within coyote_time window THEN the Physics3D system SHALL apply upward velocity of 8 units/sec and clear grounded flag
4. WHEN computing movement THEN the Physics3D system SHALL use the same floating-point operations on client and server to ensure determinism
5. WHEN a player's velocity exceeds terminal velocity (50 units/sec) THEN the Physics3D system SHALL clamp velocity magnitude

### Requirement 3: Collision Detection and Response

**User Story:** As a player, I want solid collision with the environment, so that I cannot pass through walls, floors, or obstacles.

#### Acceptance Criteria

1. WHEN the CollisionWorld initializes THEN the system SHALL build a spatial hash grid (cell size 4m) indexing all static AABBs for O(1) broad-phase queries
2. WHEN checking player collision THEN the CollisionWorld SHALL perform capsule-vs-AABB narrow-phase tests against all AABBs in occupied grid cells
3. WHEN a collision is detected THEN the CollisionWorld SHALL return a CollisionResult containing penetration depth, surface normal, and collider ID
4. WHEN resolving collision THEN the Physics3D system SHALL apply minimum translation vector to separate player from geometry and project velocity onto slide plane
5. WHEN multiple collisions occur in one tick THEN the CollisionWorld SHALL resolve iteratively (max 4 iterations) to handle corners and prevent tunneling

### Requirement 4: Arena Collision Mesh Definition

**User Story:** As a level designer, I want precise collision boundaries for the Abandoned Terminal map, so that gameplay space is clearly defined.

#### Acceptance Criteria

1. WHEN loading the Abandoned Terminal map THEN the CollisionWorld SHALL create AABBs from a collision manifest JSON file specifying all static geometry
2. WHEN defining floor collision THEN the CollisionWorld SHALL create a ground plane AABB at Y=0 spanning X=[-18, 18] and Z=[-20, 20] (36m × 40m)
3. WHEN defining perimeter walls THEN the CollisionWorld SHALL create four wall AABBs: North (Z=20), South (Z=-20), East (X=18), West (X=-18) with 2m thickness
4. WHEN defining train collision THEN the CollisionWorld SHALL create compound AABBs matching train geometry from the asset manifest
5. WHEN defining platform collision THEN the CollisionWorld SHALL create step-able surfaces at Y=0.5m for elevated areas

### Requirement 5: Client Input Capture and Transmission

**User Story:** As a player, I want my inputs to be captured accurately and transmitted reliably, so that my actions are reflected in the game.

#### Acceptance Criteria

1. WHEN the InputManager captures a frame THEN the system SHALL sample keyboard state (WASD, Space, Shift), mouse delta, and mouse buttons into an InputSnapshot
2. WHEN creating an input packet THEN the InputManager SHALL include: sequence_number (uint32), tick_number (uint32), movement_vector (vec2), look_delta (vec2), button_flags (uint8), client_timestamp (float64)
3. WHEN sending inputs THEN the NetworkClient SHALL batch up to 3 unacknowledged inputs per packet for redundancy against packet loss
4. WHEN an input is acknowledged by server THEN the InputManager SHALL remove it from the pending buffer and update last_acknowledged_sequence
5. WHEN the input buffer exceeds 32 unacknowledged inputs THEN the InputManager SHALL drop oldest inputs and emit a buffer_overflow warning event

### Requirement 6: Client-Side Prediction

**User Story:** As a player, I want responsive controls without waiting for server round-trip, so that the game feels immediate.

#### Acceptance Criteria

1. WHEN the client sends input THEN the PredictionSystem SHALL immediately apply the input using identical physics code as the server
2. WHEN the client receives authoritative state THEN the PredictionSystem SHALL compare predicted position to server position at the same tick number
3. IF prediction error exceeds 0.1 units THEN the PredictionSystem SHALL initiate reconciliation by snapping to server state and replaying all unacknowledged inputs
4. WHEN reconciling THEN the PredictionSystem SHALL replay inputs in sequence_number order on top of the corrected authoritative state
5. WHEN the server rejects an input (anti-cheat) THEN the PredictionSystem SHALL remove that input from replay buffer and apply correction

### Requirement 7: State Interpolation for Remote Entities

**User Story:** As a player, I want other players to move smoothly, so that the game looks polished despite network latency.

#### Acceptance Criteria

1. WHEN receiving state snapshots THEN the InterpolationBuffer SHALL store snapshots in a ring buffer (capacity 32) keyed by tick number
2. WHEN rendering remote players THEN the Renderer SHALL interpolate between two snapshots at (current_time - interpolation_delay) where interpolation_delay = RTT + jitter_buffer
3. WHEN a snapshot is missing THEN the InterpolationBuffer SHALL extrapolate using last known velocity for up to 100ms
4. WHEN extrapolation exceeds 100ms THEN the Renderer SHALL freeze the entity at last known position and display a desync indicator
5. WHEN a snapshot arrives after extrapolation THEN the InterpolationBuffer SHALL blend smoothly to new state over 50ms

### Requirement 8: Network Transport Layer

**User Story:** As a developer, I want a reliable and efficient network protocol, so that game state is synchronized with minimal bandwidth and latency.

#### Acceptance Criteria

1. WHEN establishing connection THEN the NetworkTransport SHALL use WebSocket with binary frames for reliable ordered delivery
2. WHEN serializing messages THEN the NetworkTransport SHALL use a binary protocol with message type header (uint8), length (uint16), and payload
3. WHEN sending state updates THEN the server SHALL use delta compression, encoding only changed fields since last acknowledged snapshot
4. WHEN bandwidth exceeds 64 KB/s per client THEN the NetworkTransport SHALL prioritize nearby entities and reduce update frequency for distant entities
5. WHEN a connection is idle for 5 seconds THEN the NetworkTransport SHALL send keepalive packets to detect stale connections

### Requirement 9: Clock Synchronization

**User Story:** As a developer, I want client and server clocks synchronized, so that timestamps are meaningful for lag compensation.

#### Acceptance Criteria

1. WHEN a client connects THEN the ClockSync system SHALL perform NTP-style synchronization using 5 ping-pong samples
2. WHEN calculating clock offset THEN the ClockSync system SHALL use median of samples to reject outliers
3. WHEN clock drift exceeds 50ms THEN the ClockSync system SHALL re-synchronize and log a drift warning
4. WHEN converting timestamps THEN the ClockSync system SHALL provide server_time_to_local and local_time_to_server conversion functions
5. WHEN RTT changes significantly (>20ms delta) THEN the ClockSync system SHALL adjust interpolation delay smoothly over 500ms

### Requirement 10: Lag Compensation for Hit Detection

**User Story:** As a player, I want my shots to register based on what I saw on screen, so that high-latency players can compete fairly.

#### Acceptance Criteria

1. WHEN the server receives a fire command THEN the LagCompensation system SHALL rewind world state to the client's perceived tick (current_tick - RTT/tick_duration)
2. WHEN rewinding THEN the LagCompensation system SHALL restore player positions from the ReplayBuffer (stores last 1 second of snapshots)
3. WHEN performing hit detection THEN the server SHALL raycast against rewound player capsules, not current positions
4. WHEN a hit is detected THEN the server SHALL validate that the shooter had line-of-sight at the rewound tick
5. WHEN rewind exceeds 250ms THEN the LagCompensation system SHALL cap rewind and favor the defender to prevent extreme peeker's advantage

### Requirement 11: Combat System

**User Story:** As a player, I want to shoot opponents and see damage feedback, so that I can compete in the arena.

#### Acceptance Criteria

1. WHEN a player fires THEN the server SHALL perform hitscan raycast from eye position (capsule center + 1.2m) along look direction
2. WHEN hitscan intersects opponent capsule THEN the server SHALL apply 25 damage and broadcast hit event with hit_position and damage_dealt
3. WHEN player health reaches zero THEN the server SHALL trigger death sequence: set player state to DEAD, broadcast kill event, start 3-second respawn timer
4. WHEN respawn timer expires THEN the server SHALL teleport player to spawn point, restore 100 health, grant 2-second invulnerability, set state to ALIVE
5. WHEN a kill occurs THEN the server SHALL increment killer's score and check win condition (first to 10 kills)

### Requirement 12: Player Spawn System

**User Story:** As a player, I want fair spawn locations, so that neither player has a positional advantage after death.

#### Acceptance Criteria

1. WHEN the match initializes THEN the SpawnSystem SHALL load spawn points from map manifest (minimum 4 spawn points per map)
2. WHEN selecting spawn point THEN the SpawnSystem SHALL choose the point with maximum distance from all opponents
3. WHEN spawning THEN the SpawnSystem SHALL verify spawn point is not blocked by another player (minimum 3m clearance)
4. IF all spawn points are contested THEN the SpawnSystem SHALL select the point with longest time since last use
5. WHEN a player spawns THEN the SpawnSystem SHALL set initial look direction toward arena center

### Requirement 13: Match Lifecycle State Machine

**User Story:** As a player, I want clear match phases, so that I know when the game starts, ends, and what the current state is.

#### Acceptance Criteria

1. WHEN both players connect THEN the MatchStateMachine SHALL transition from WAITING to COUNTDOWN and start 3-second countdown timer
2. WHEN countdown reaches zero THEN the MatchStateMachine SHALL transition to PLAYING, enable input processing, and broadcast match_start event
3. WHEN a player reaches 10 kills THEN the MatchStateMachine SHALL transition to ENDED, disable input, and broadcast match_end event with winner_id
4. WHEN in ENDED state THEN the MatchStateMachine SHALL display results for 5 seconds then transition to CLEANUP
5. WHEN a player disconnects during PLAYING THEN the MatchStateMachine SHALL award victory to remaining player and transition to ENDED

### Requirement 14: First-Person Camera Control

**User Story:** As a player, I want smooth mouse-look controls, so that I can aim precisely.

#### Acceptance Criteria

1. WHEN the player clicks the game canvas THEN the InputManager SHALL request pointer lock and emit pointer_locked event on success
2. WHEN pointer is locked THEN the InputManager SHALL capture raw mouse delta each frame with no acceleration curve
3. WHEN processing look input THEN the CameraController SHALL apply sensitivity multiplier (configurable, default 0.002) to mouse delta
4. WHEN pitch exceeds ±89 degrees THEN the CameraController SHALL clamp to prevent gimbal lock and camera flip
5. WHEN the player presses Escape THEN the InputManager SHALL release pointer lock, emit pointer_released event, and pause input capture

### Requirement 15: AAA Movement Feel

**User Story:** As a player, I want movement to feel responsive and polished, so that the game is enjoyable to play.

#### Acceptance Criteria

1. WHEN a player starts moving THEN the Physics3D system SHALL apply acceleration (0 to 7 m/s over 100ms) using exponential ease-out curve
2. WHEN a player releases movement keys THEN the Physics3D system SHALL apply friction deceleration (7 m/s to 0 over 50ms)
3. WHEN a player is airborne THEN the Physics3D system SHALL allow 30% of ground acceleration for air strafing
4. WHEN a player lands from height > 1m THEN the Physics3D system SHALL apply 50ms movement penalty (50% speed) and trigger land_impact event
5. WHEN a player is moving on ground THEN the CameraController SHALL apply procedural view bob (amplitude 0.02m, frequency synced to speed)

### Requirement 16: Input Buffering and Jitter Compensation

**User Story:** As a player on variable network conditions, I want consistent input timing, so that my actions feel reliable.

#### Acceptance Criteria

1. WHEN capturing inputs THEN the InputBuffer SHALL timestamp each input at capture time using high-resolution performance timer
2. WHEN network jitter is detected (>10ms variance) THEN the InputBuffer SHALL apply smoothing by holding inputs for jitter_buffer duration
3. WHEN the jitter buffer is empty THEN the PredictionSystem SHALL repeat last input state for up to 50ms before assuming no input
4. WHEN buffer overflows (>64 inputs) THEN the InputBuffer SHALL drop oldest inputs and emit buffer_overflow event
5. WHEN RTT changes THEN the InputBuffer SHALL adjust jitter_buffer size dynamically (jitter_buffer = RTT * 0.1, clamped to [10ms, 50ms])

### Requirement 17: Initialization Sequence

**User Story:** As a developer, I want deterministic initialization order, so that there are no race conditions or undefined states.

#### Acceptance Criteria

1. WHEN the server starts a match THEN the InitializationOrchestrator SHALL initialize systems in order: Config → EventBus → CollisionWorld → Physics3D → SpawnSystem → CombatSystem → PlayerStates → TickScheduler
2. WHEN the client joins THEN the InitializationOrchestrator SHALL initialize systems in order: Config → EventBus → AssetLoader → Scene → Renderer → AudioSystem → InputManager → NetworkClient → PredictionSystem → InterpolationBuffer
3. WHEN any initialization step fails THEN the InitializationOrchestrator SHALL halt, emit initialization_failed event with error details, and prevent game loop start
4. WHEN all systems report ready THEN the InitializationOrchestrator SHALL emit systems_ready event and allow game loop to begin
5. WHEN the game loop starts THEN the InitializationOrchestrator SHALL assert all systems are initialized and throw if any system is in uninitialized state

### Requirement 18: Anti-Cheat Validation

**User Story:** As a game operator, I want server-side validation of all player actions, so that cheaters cannot gain unfair advantages.

#### Acceptance Criteria

1. WHEN validating movement THEN the AntiCheat system SHALL reject inputs causing position change exceeding (max_speed × delta_time × 1.5) and increment violation counter
2. WHEN validating jump THEN the AntiCheat system SHALL reject jump if player was not grounded within coyote_time (100ms) window
3. WHEN validating fire rate THEN the AntiCheat system SHALL reject fire commands exceeding weapon's rate_of_fire limit
4. WHEN a player accumulates 10 violations within 60 seconds THEN the AntiCheat system SHALL kick player and emit player_kicked event with violation log
5. WHEN validating timestamps THEN the AntiCheat system SHALL reject inputs with timestamps deviating more than 500ms from expected server time

### Requirement 19: Network Optimization

**User Story:** As a player on varying network conditions, I want the game to remain playable, so that I can compete fairly.

#### Acceptance Criteria

1. WHEN sending state updates THEN the server SHALL prioritize entities by distance (nearby = 60Hz, mid = 30Hz, far = 15Hz)
2. WHEN packet loss exceeds 5% THEN the NetworkOptimizer SHALL increase redundancy by sending 2 extra input copies per packet
3. WHEN latency exceeds 150ms THEN the UI SHALL display network warning indicator with current RTT value
4. WHEN latency exceeds 300ms THEN the NetworkOptimizer SHALL increase interpolation delay and display "High Latency" warning
5. WHEN reconnecting after disconnect THEN the NetworkClient SHALL request full state snapshot before resuming prediction

### Requirement 20: HUD and Visual Feedback

**User Story:** As a player, I want clear visual feedback, so that I understand game state and combat results.

#### Acceptance Criteria

1. WHEN rendering HUD THEN the HUDRenderer SHALL display: health bar, ammo count, score, kill feed, crosshair, and network status
2. WHEN the local player takes damage THEN the HUDRenderer SHALL display damage direction indicator pointing toward attacker for 1 second
3. WHEN the local player lands a hit THEN the HUDRenderer SHALL display hit marker at crosshair for 200ms with audio confirmation
4. WHEN health drops below 25 THEN the HUDRenderer SHALL apply red vignette screen effect with intensity proportional to missing health
5. WHEN a kill occurs THEN the HUDRenderer SHALL add entry to kill feed showing killer_name, weapon_icon, and victim_name for 5 seconds

### Requirement 21: Spatial Audio System

**User Story:** As a player, I want 3D positional audio, so that I can locate opponents by sound.

#### Acceptance Criteria

1. WHEN playing a sound THEN the AudioSystem SHALL position the sound in 3D space using Web Audio API panner nodes
2. WHEN a player fires THEN the AudioSystem SHALL play gunshot sound at shooter position with distance attenuation (max range 50m)
3. WHEN a player moves THEN the AudioSystem SHALL play footstep sounds at 0.4-second intervals when grounded and moving
4. WHEN sound source is occluded by geometry THEN the AudioSystem SHALL apply low-pass filter to simulate wall muffling
5. WHEN the local player takes damage THEN the AudioSystem SHALL play impact sound with no spatialization (centered)

### Requirement 22: State Serialization Protocol

**User Story:** As a developer, I want efficient state serialization, so that network bandwidth is minimized.

#### Acceptance Criteria

1. WHEN serializing player state THEN the Serializer SHALL encode: entity_id (uint16), position (3×float32), rotation (2×float32), velocity (3×float32), health (uint8), state_flags (uint8) = 36 bytes
2. WHEN serializing input THEN the Serializer SHALL encode: message_type (uint8), sequence (uint32), tick (uint32), movement (2×int8), look_delta (2×int16), buttons (uint8), timestamp (float64) = 23 bytes
3. WHEN using delta compression THEN the Serializer SHALL encode bitmask of changed fields followed by only changed values
4. WHEN deserializing THEN the Serializer SHALL validate all fields are within expected ranges and return Result type with error on invalid data
5. WHEN schema version mismatches THEN the Serializer SHALL reject packet and request client reconnect with updated protocol

### Requirement 23: Error Recovery and Resilience

**User Story:** As a player, I want the game to handle errors gracefully, so that minor issues don't crash the match.

#### Acceptance Criteria

1. WHEN desync is detected (prediction error > 1.0 units for 500ms) THEN the RecoverySystem SHALL request full state resync from server
2. WHEN server tick processing throws exception THEN the RecoverySystem SHALL log error, skip affected player's input, and continue tick
3. WHEN client loses connection THEN the RecoverySystem SHALL attempt reconnect with exponential backoff (1s, 2s, 4s, max 30s)
4. WHEN reconnection succeeds THEN the RecoverySystem SHALL request full state snapshot and resume from authoritative state
5. WHEN unrecoverable error occurs THEN the RecoverySystem SHALL display error message to user and cleanly terminate match

### Requirement 24: Debug and Diagnostics

**User Story:** As a developer, I want comprehensive debugging tools, so that I can diagnose network and physics issues.

#### Acceptance Criteria

1. WHEN debug mode is enabled THEN the DebugOverlay SHALL display: FPS, tick rate, RTT, packet loss, prediction error, interpolation delay
2. WHEN debug mode is enabled THEN the DebugRenderer SHALL visualize: collision AABBs, player capsules, hitscan rays, spawn points
3. WHEN recording diagnostics THEN the DiagnosticsRecorder SHALL log: all inputs, all state snapshots, all reconciliation events with timestamps
4. WHEN exporting diagnostics THEN the DiagnosticsRecorder SHALL produce JSON file suitable for replay analysis
5. WHEN network simulation is enabled THEN the NetworkSimulator SHALL inject configurable latency, jitter, and packet loss for testing

### Requirement 25: Code Quality Standards

**User Story:** As a development team, I want enforced code quality standards, so that the codebase is maintainable and professional.

#### Acceptance Criteria

1. WHEN writing TypeScript THEN developers SHALL use strict mode with no implicit any, no unused variables, and explicit return types
2. WHEN handling errors THEN developers SHALL use Result<T, E> pattern with explicit error types, never throwing exceptions in game loop
3. WHEN a file exceeds 400 lines THEN developers SHALL refactor into smaller focused modules with single responsibility
4. WHEN writing public APIs THEN developers SHALL include JSDoc comments with parameter descriptions and example usage
5. WHEN committing code THEN the CI pipeline SHALL enforce: zero TypeScript errors, zero ESLint warnings, 80% test coverage minimum

