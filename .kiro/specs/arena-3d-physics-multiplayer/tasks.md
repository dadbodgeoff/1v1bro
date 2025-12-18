# Implementation Plan

## Layer 0: Core Primitives

- [x] 1. Implement Result type and utilities
  - [x] 1.1 Create Result<T, E> type with Ok/Err constructors
    - Implement Ok, Err, isOk, isErr, unwrap, unwrapOr, map, flatMap
    - _Requirements: 25.2_
  - [x] 1.2 Write property tests for Result type
    - **Property: map(Ok(x), f) === Ok(f(x))**
    - **Property: flatMap composition is associative**
    - **Validates: Requirements 25.2**
  - [x] 1.3 Write unit tests for Result edge cases
    - Test unwrap on Err throws
    - Test unwrapOr returns default on Err
    - _Requirements: 25.2_

- [x] 2. Implement EventBus system
  - [x] 2.1 Create IEventBus interface and EventBus class
    - Implement emit, on, off, clear methods
    - Use Map<string, Set<Handler>> for storage
    - _Requirements: 17.1, 17.2_
  - [x] 2.2 Write property tests for EventBus
    - **Property: Handlers receive all emitted events of subscribed type**
    - **Property: off() prevents future event delivery**
    - **Validates: Requirements 17.4**
  - [x] 2.3 Write unit tests for EventBus
    - Test multiple handlers for same event type
    - Test unsubscribe cleanup
    - _Requirements: 17.4_

- [x] 3. Define all GameEvent types
  - [x] 3.1 Create GameEvents.ts with all event interfaces
    - System events, Match events, Player events, Combat events, Network events, Input events, Anti-cheat events
    - _Requirements: 17.4_

- [x] 4. Checkpoint - Ensure all Layer 0 tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Layer 1: Math and Physics Primitives

- [x] 5. Implement Vector3 math library
  - [x] 5.1 Create Vector3 class with all operations
    - add, subtract, scale, dot, cross, magnitude, normalize, lerp, equals, distanceTo
    - Static constants: ZERO, UP, DOWN, FORWARD
    - _Requirements: 2.1, 2.4_
  - [x] 5.2 Write property tests for Vector3
    - **Property 1: Physics Determinism - identical inputs produce identical outputs**
    - **Property: normalize().magnitude() === 1 for non-zero vectors**
    - **Property: a.dot(b) === b.dot(a) (commutativity)**
    - **Validates: Requirements 2.1**
  - [x] 5.3 Write unit tests for Vector3 edge cases
    - Test normalize of zero vector
    - Test lerp at t=0, t=1, t=0.5
    - _Requirements: 2.1_

- [x] 6. Implement AABB collision primitive
  - [x] 6.1 Create AABB class
    - fromCenterSize factory, center(), size(), containsPoint(), intersectsAABB(), expand()
    - _Requirements: 3.1, 3.2_
  - [x] 6.2 Write property tests for AABB
    - **Property 8: Collision Normal Validity - normals have magnitude 1.0**
    - **Property: AABB contains its own center point**
    - **Property: intersectsAABB is symmetric**
    - **Validates: Requirements 3.3**

- [x] 7. Implement Capsule collider
  - [x] 7.1 Create Capsule class
    - top, bottom, center, eyePosition getters
    - toBoundingAABB(), withPosition()
    - _Requirements: 3.2_
  - [x] 7.2 Implement capsuleVsAABB collision detection
    - Return CollisionResult with penetration depth and normal
    - _Requirements: 3.2, 3.3_
  - [x] 7.3 Write property tests for Capsule collision
    - **Property 6: Collision Resolution Completeness - resolved capsule has no intersections**
    - **Property: Capsule at AABB center always collides**
    - **Validates: Requirements 3.4**

- [x] 8. Implement SpatialHashGrid
  - [x] 8.1 Create SpatialHashGrid class
    - insert(), remove(), query(), queryPoint(), clear()
    - Use configurable cell size (default 4m)
    - _Requirements: 3.1_
  - [x] 8.2 Write property tests for SpatialHashGrid
    - **Property 7: Spatial Hash Correctness - inserted AABBs are returned by intersecting queries**
    - **Property: query returns empty for non-intersecting bounds**
    - **Validates: Requirements 3.1, 3.2**

- [x] 9. Implement CollisionWorld
  - [x] 9.1 Create CollisionWorld class
    - loadManifest(), testCapsule(), resolveCollisions(), raycast(), clear()
    - _Requirements: 3.1, 3.2, 3.4, 4.1_
  - [x] 9.2 Write property tests for CollisionWorld
    - **Property 9: Map Manifest Loading - loaded colliders match manifest**
    - **Property: raycast returns null for rays that miss all geometry**
    - **Validates: Requirements 4.1**
  - [x] 9.3 Write unit tests for CollisionWorld
    - Test multi-iteration collision resolution
    - Test raycast against multiple AABBs
    - _Requirements: 3.4, 3.5_

- [x] 10. Checkpoint - Ensure all Layer 1 tests pass
  - Ensure all tests pass, ask the user if questions arise.



## Layer 1 (continued): Physics3D System

- [x] 11. Implement Physics3D system
  - [x] 11.1 Create PhysicsConfig and DEFAULT_PHYSICS_CONFIG
    - gravity, maxSpeed, acceleration, friction, airControl, jumpVelocity, terminalVelocity, coyoteTime, landingPenalty
    - _Requirements: 2.2, 2.3, 15.1, 15.2, 15.3_
  - [x] 11.2 Create PlayerPhysicsState and MovementInput interfaces
    - position, velocity, isGrounded, lastGroundedTime, landingPenaltyEndTime
    - _Requirements: 2.1_
  - [x] 11.3 Implement Physics3D.step() method
    - Apply gravity, movement, jump, clamp velocity, resolve collisions, ground check
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 11.4 Write property tests for Physics3D
    - **Property 1: Physics Determinism - identical inputs produce identical outputs**
    - **Property 2: Gravity Application - airborne velocity.y decreases by gravity*dt**
    - **Property 3: Jump Mechanics - grounded + jump = jumpVelocity**
    - **Property 4: Movement Acceleration - velocity approaches maxSpeed**
    - **Property 5: Air Control Reduction - airborne accel is 30% of ground**
    - **Validates: Requirements 1.3, 2.1, 2.2, 2.3, 15.1, 15.2, 15.3**
  - [x] 11.5 Write unit tests for Physics3D edge cases
    - Test coyote time jump
    - Test landing penalty application
    - Test terminal velocity clamping
    - _Requirements: 2.3, 15.4_

- [x] 12. Checkpoint - Ensure all Physics tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Layer 2: Networking

- [x] 13. Implement Binary Serializer
  - [x] 13.1 Create MessageType enum and packet interfaces
    - InputPacket, PlayerState, StateSnapshot
    - _Requirements: 8.2, 22.1, 22.2_
  - [x] 13.2 Implement serializeInput/deserializeInput
    - 24-byte binary format with all fields
    - _Requirements: 5.2, 22.2_
  - [x] 13.3 Implement serializeSnapshot/deserializeSnapshot
    - Variable-length format with player count
    - _Requirements: 22.1, 22.3_
  - [x] 13.4 Write property tests for Serializer
    - **Property 10: Input Packet Round-Trip - serialize then deserialize preserves data**
    - **Property 11: State Snapshot Round-Trip - serialize then deserialize preserves data**
    - **Property 12: Invalid Data Rejection - malformed buffers return Err**
    - **Validates: Requirements 5.2, 22.1, 22.4**
  - [x] 13.5 Write unit tests for Serializer
    - Test boundary values for all fields
    - Test empty player list snapshot
    - _Requirements: 22.4_

- [x] 14. Implement ClockSync system
  - [x] 14.1 Create ClockSync class
    - recordSample(), isCalibrated(), getOffset(), getRTT(), serverTimeToLocal(), localTimeToServer(), checkDrift()
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [x] 14.2 Write property tests for ClockSync
    - **Property 18: Clock Offset Calculation - uses median of samples**
    - **Property 19: Time Conversion Consistency - round-trip conversion preserves time**
    - **Validates: Requirements 9.1, 9.2**
  - [x] 14.3 Write unit tests for ClockSync
    - Test outlier rejection
    - Test drift detection threshold
    - _Requirements: 9.3_

- [x] 15. Implement NetworkTransport
  - [x] 15.1 Create WebSocketTransport class
    - connect(), disconnect(), send(), onMessage(), isConnected(), getConnectionState()
    - _Requirements: 8.1, 8.5_
  - [x] 15.2 Implement reconnection with exponential backoff
    - 1s, 2s, 4s... up to 30s max
    - _Requirements: 23.3, 23.4_
  - [x] 15.3 Implement keepalive mechanism
    - Send keepalive every 5 seconds
    - _Requirements: 8.5_
  - [x] 15.4 Write unit tests for NetworkTransport
    - Test connection state transitions
    - Test reconnection backoff timing
    - _Requirements: 8.5, 23.3_

- [x] 16. Checkpoint - Ensure all Layer 2 tests pass
  - All 237 tests pass (Layer 0: 45, Layer 1: 134, Layer 2: 58)

## Layer 3: Game Logic

- [x] 17. Implement MatchStateMachine
  - [x] 17.1 Create MatchConfig and MatchStateMachine class
    - States: waiting, countdown, playing, ended, cleanup
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  - [x] 17.2 Implement state transitions and event emission
    - playerConnected(), playerDisconnected(), recordKill(), update()
    - _Requirements: 13.1, 13.2, 13.3, 13.5_
  - [x] 17.3 Write property tests for MatchStateMachine
    - **Property 26: State Transition Validity - only valid transitions occur**
    - **Property 27: Win Condition Detection - killsToWin triggers ended state**
    - **Validates: Requirements 13.1, 13.2, 13.3**
  - [x] 17.4 Write unit tests for MatchStateMachine
    - Test countdown timing
    - Test disconnect during playing
    - _Requirements: 13.4, 13.5_

- [x] 18. Implement SpawnSystem
  - [x] 18.1 Create SpawnSystem class
    - loadManifest(), selectSpawnPoint(), getSpawnPoints()
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  - [x] 18.2 Write property tests for SpawnSystem
    - **Property 25: Spawn Point Selection Optimality - selected point maximizes distance from enemies**
    - **Validates: Requirements 12.2**
  - [x] 18.3 Write unit tests for SpawnSystem
    - Test blocked spawn point handling
    - Test look direction toward center
    - _Requirements: 12.3, 12.5_

- [x] 19. Implement CombatSystem
  - [x] 19.1 Create CombatConfig and CombatSystem class
    - initializePlayer(), removePlayer(), getPlayerState(), processFire(), applyDamage(), update(), respawnPlayer()
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  - [x] 19.2 Implement hitscan raycast against player capsules
    - Use simplified sphere intersection for capsule
    - _Requirements: 11.1, 11.2_
  - [x] 19.3 Write property tests for CombatSystem
    - **Property 22: Damage Application - health = max(0, health - damage)**
    - **Property 23: Death Trigger - health 0 sets isDead true**
    - **Property 24: Fire Rate Enforcement - rapid fire is rejected**
    - **Validates: Requirements 11.2, 11.3, 18.3**
  - [x] 19.4 Write unit tests for CombatSystem
    - Test invulnerability period
    - Test respawn timer
    - _Requirements: 11.4_

- [x] 20. Checkpoint - Ensure all Layer 3 tests pass
  - All 317 tests pass (Layer 0: 45, Layer 1: 134, Layer 2: 58, Layer 3 Part 1: 80)



## Layer 3 (continued): Lag Compensation and Anti-Cheat

- [x] 21. Implement LagCompensation system
  - [x] 21.1 Create LagCompensation class
    - recordSnapshot(), getSnapshotAtTime(), getSnapshotAtTick(), getPlayerCapsulesAtTime(), pruneOldSnapshots()
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - [x] 21.2 Implement interpolation between snapshots for rewound positions
    - _Requirements: 10.3_
  - [x] 21.3 Write property tests for LagCompensation
    - **Property 20: Snapshot History Retrieval - recorded snapshots are retrievable**
    - **Property 21: Rewind Time Capping - rewind capped at maxRewindMs**
    - **Validates: Requirements 10.1, 10.2, 10.5**
  - [x] 21.4 Write unit tests for LagCompensation
    - Test snapshot pruning
    - Test interpolation between snapshots
    - _Requirements: 10.2, 10.3_

- [x] 22. Implement AntiCheat system
  - [x] 22.1 Create AntiCheat class
    - validateInput(), getViolationCount(), clearViolations(), removePlayer()
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_
  - [x] 22.2 Implement violation tracking with time window
    - Track violations per player, prune old violations
    - _Requirements: 18.4_
  - [x] 22.3 Write property tests for AntiCheat
    - **Property 28: Speed Validation - excessive speed returns Err**
    - **Property 29: Violation Accumulation - 10 violations triggers kick**
    - **Validates: Requirements 18.1, 18.4**
  - [x] 22.4 Write unit tests for AntiCheat
    - Test timestamp validation
    - Test violation window expiry
    - _Requirements: 18.4, 18.5_

- [x] 23. Checkpoint - Ensure all Layer 3 tests pass
  - All 317 tests pass (Layer 0: 45, Layer 1: 134, Layer 2: 58, Layer 3: 80)

## Layer 4: Client Systems

- [x] 24. Implement InputManager
  - [x] 24.1 Create InputManager class
    - initialize(), dispose(), captureFrame(), isPointerLocked(), requestPointerLock(), releasePointerLock()
    - _Requirements: 5.1, 8.1, 8.2, 14.1, 14.2, 14.3, 14.5_
  - [x] 24.2 Implement keyboard and mouse event handlers
    - WASD, Space, mouse delta, pointer lock
    - _Requirements: 5.1, 14.2_
  - [x] 24.3 Write unit tests for InputManager
    - Test input normalization for diagonal movement
    - Test pointer lock state management
    - _Requirements: 5.1, 14.5_

- [x] 25. Implement CameraController
  - [x] 25.1 Create CameraController class
    - applyLookDelta(), updateViewBob(), getState(), getForwardVector(), getRightVector(), getViewMatrix(), reset()
    - _Requirements: 14.3, 14.4, 15.5_
  - [x] 25.2 Write property tests for CameraController
    - **Property 30: Pitch Clamping - pitch stays within ±89 degrees**
    - **Validates: Requirements 14.4**
  - [x] 25.3 Write unit tests for CameraController
    - Test view bob amplitude
    - Test yaw normalization
    - _Requirements: 15.5_

- [x] 26. Implement PredictionSystem
  - [x] 26.1 Create PredictionSystem class
    - applyInput(), acknowledgeInput(), reconcile(), getCurrentState(), getPredictedPosition()
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 26.2 Implement input replay with yaw tracking
    - Store yaw per pending input for correct replay
    - _Requirements: 6.4_
  - [x] 26.3 Write property tests for PredictionSystem
    - **Property 13: Client-Server Physics Equivalence - same inputs produce same outputs**
    - **Property 14: Reconciliation Threshold - error > 0.1 triggers reconciliation**
    - **Property 15: Input Replay Correctness - replay produces correct state**
    - **Validates: Requirements 6.1, 6.3, 6.4**
  - [x] 26.4 Write unit tests for PredictionSystem
    - Test input acknowledgment cleanup
    - Test buffer overflow handling
    - _Requirements: 5.5, 6.5_

- [x] 27. Implement InterpolationBuffer
  - [x] 27.1 Create InterpolationBuffer class
    - addSnapshot(), getInterpolatedEntities(), setInterpolationDelay(), clear()
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [x] 27.2 Implement extrapolation with velocity
    - Extrapolate up to 100ms, then freeze
    - _Requirements: 7.3, 7.4_
  - [x] 27.3 Write property tests for InterpolationBuffer
    - **Property 16: Interpolation Bounds - result is between two snapshots**
    - **Property 17: Extrapolation Limit - stale after 100ms**
    - **Validates: Requirements 7.2, 7.3**
  - [x] 27.4 Write unit tests for InterpolationBuffer
    - Test angle interpolation wrapping
    - Test snapshot buffer size limit
    - _Requirements: 7.1, 7.5_

- [x] 28. Checkpoint - Ensure all Layer 4 tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Layer 5: Server Orchestration

- [x] 29. Implement TickScheduler
  - [x] 29.1 Create TickScheduler class
    - start(), stop(), getCurrentTick(), getTickDuration(), onTick(), isRunning(), manualTick()
    - _Requirements: 1.1, 1.2, 1.5_
  - [x] 29.2 Implement catch-up logic for slow ticks
    - Cap catch-up to prevent spiral of death
    - _Requirements: 1.2_
  - [x] 29.3 Write unit tests for TickScheduler
    - Test tick number wrapping at MAX_UINT32
    - Test handler error isolation
    - _Requirements: 1.5_

- [x] 30. Implement TickProcessor
  - [x] 30.1 Create TickProcessor class
    - addPlayer(), removePlayer(), queueInput(), processTick(), getPlayerState(), getPlayerIds()
    - _Requirements: 1.3, 1.4, 2.1_
  - [x] 30.2 Implement input queue with sequence ordering
    - Process inputs in sequence_number order
    - _Requirements: 1.4_
  - [x] 30.3 Integrate all game systems
    - Physics, Collision, Combat, Match, Spawn, AntiCheat, LagCompensation
    - _Requirements: 1.3_
  - [x] 30.4 Write property tests for TickProcessor
    - **Property 31: Input Sequence Ordering - inputs processed in sequence order**
    - **Validates: Requirements 1.4**
  - [x] 30.5 Write unit tests for TickProcessor
    - Test player add/remove
    - Test fire command processing with lag compensation
    - _Requirements: 1.3, 10.3_

- [x] 31. Checkpoint - Ensure all Layer 5 tests pass
  - All 462 arena tests pass (Layer 0: 45, Layer 1: 134, Layer 2: 58, Layer 3: 80, Layer 4: 95, Layer 5: 50)



## Layer 6: Presentation and Debug

- [x] 32. Implement HUDRenderer
  - [x] 32.1 Create HUDRenderer class
    - initialize(), dispose(), update(), showDamageIndicator(), showHitMarker(), addKillFeedEntry()
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_
  - [x] 32.2 Implement damage direction indicator
    - Calculate relative angle from attacker position
    - _Requirements: 20.2_
  - [x] 32.3 Write unit tests for HUDRenderer
    - Test damage indicator angle calculation
    - Test kill feed entry expiration
    - _Requirements: 20.2, 20.5_

- [x] 33. Implement AudioSystem
  - [x] 33.1 Create AudioSystem class
    - initialize(), dispose(), setListenerPosition(), playSound(), playUISound(), updateFootsteps()
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_
  - [x] 33.2 Implement 3D spatial audio with Web Audio API
    - Panner nodes for positional sounds
    - _Requirements: 21.1, 21.2_
  - [x] 33.3 Write unit tests for AudioSystem
    - Test footstep interval timing
    - Test event subscription cleanup
    - _Requirements: 21.3_

- [x] 34. Implement DebugOverlay
  - [x] 34.1 Create DebugOverlay class
    - setEnabled(), updateStats(), drawAABB(), drawCapsule(), drawRay(), drawPoint(), clear()
    - _Requirements: 24.1, 24.2_
  - [x] 34.2 Write unit tests for DebugOverlay
    - Test draw command filtering by config
    - _Requirements: 24.1_

- [x] 35. Implement DiagnosticsRecorder
  - [x] 35.1 Create DiagnosticsRecorder class
    - startRecording(), stopRecording(), isRecording(), recordInput(), recordSnapshot(), recordReconciliation(), exportToJSON(), clear()
    - _Requirements: 24.3, 24.4_
  - [x] 35.2 Write unit tests for DiagnosticsRecorder
    - Test JSON export format
    - Test old record pruning
    - _Requirements: 24.4_

- [x] 36. Checkpoint - Ensure all Layer 6 tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Layer 7: Integration

- [x] 37. Create Error types module
  - [x] 37.1 Define all error types
    - PhysicsError, NetworkError, ValidationError, GameError, SerializationError
    - _Requirements: 25.2_

- [x] 38. Create GameConfig module
  - [x] 38.1 Define complete GameConfig interface and defaults
    - Combine all subsystem configs
    - _Requirements: 25.1_

- [x] 39. Create map collision manifest
  - [x] 39.1 Define Abandoned Terminal collision manifest JSON
    - Floor, walls, train, platforms, subway entrances
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [x] 39.2 Define spawn points manifest
    - Minimum 4 spawn points with positions
    - _Requirements: 12.1_

- [x] 40. Create Client orchestrator
  - [x] 40.1 Implement client initialization sequence
    - Config → EventBus → AssetLoader → Scene → Renderer → AudioSystem → InputManager → NetworkClient → PredictionSystem → InterpolationBuffer
    - _Requirements: 17.2_
  - [x] 40.2 Implement client game loop
    - Input capture → Prediction → Network send → Receive → Interpolation → Render
    - _Requirements: 6.1, 7.2_
  - [x] 40.3 Write integration tests for client flow
    - Test full prediction-reconciliation cycle
    - _Requirements: 6.1, 6.3, 6.4_

- [x] 41. Create Server orchestrator
  - [x] 41.1 Implement server initialization sequence
    - Config → EventBus → CollisionWorld → Physics3D → SpawnSystem → CombatSystem → PlayerStates → TickScheduler
    - _Requirements: 17.1_
  - [x] 41.2 Implement server tick loop
    - Process inputs → Physics → Combat → Broadcast
    - _Requirements: 1.3_
  - [x] 41.3 Write integration tests for server flow
    - Test full tick cycle with multiple players
    - _Requirements: 1.3, 1.4_

- [x] 42. Checkpoint - Ensure all integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Final Integration Tests

- [x] 43. Write end-to-end integration tests
  - [x] 43.1 Test full match lifecycle
    - waiting → countdown → playing → ended
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  - [x] 43.2 Test lag compensation hit detection
    - Fire with 100ms latency, verify hit at historical position
    - _Requirements: 10.1, 10.3_
  - [x] 43.3 Test reconnection flow
    - Disconnect, reconnect, full state sync
    - _Requirements: 10.5, 23.3, 23.4_
  - [x] 43.4 Test anti-cheat kick flow
    - Accumulate violations, verify kick
    - _Requirements: 18.4_

- [x] 44. Final Checkpoint - Ensure all tests pass
  - All 669 arena tests pass across 29 test files.

