# Arena Dashboard Integration - Requirements Document

## Introduction

This document defines the requirements for integrating the Arena (3D FPS combat mode) into the main dashboard, allowing players to queue for arena matches through the standard matchmaking flow. The arena is currently accessible only through a standalone test page (`ArenaPlayTest.tsx`) with ~1,480 lines of inline code that needs refactoring to use the enterprise-grade modular systems that have already been built.

The goal is to prepare the arena for dashboard integration by:
1. Refactoring the monolithic test page to use existing modular systems
2. Creating a proper arena entry point from the dashboard
3. Integrating with the existing matchmaking queue system
4. Supporting both bot practice mode and PvP queue

## Current State Analysis

### What's Already Built (Enterprise Systems) ✅

#### Core Infrastructure
| System | File | Status | Description |
|--------|------|--------|-------------|
| EventBus | `core/EventBus.ts` | ✅ Built | Pub/sub event system |
| Result Type | `core/Result.ts` | ✅ Built | Rust-style error handling |
| GameEvents | `core/GameEvents.ts` | ✅ Built | Event type definitions |
| GameConfig | `config/GameConfig.ts` | ✅ Built | Unified config for all subsystems |

#### Physics & Collision
| System | File | Status | Description |
|--------|------|--------|-------------|
| Physics3D | `physics/Physics3D.ts` | ✅ Built | Player movement, gravity, jumping |
| CollisionWorld | `physics/CollisionWorld.ts` | ✅ Built | AABB collision detection |
| SpatialHashGrid | `physics/SpatialHashGrid.ts` | ✅ Built | Spatial partitioning |
| Capsule | `physics/Capsule.ts` | ✅ Built | Capsule collision shape |
| Vector3 | `math/Vector3.ts` | ✅ Built | 3D vector math |

#### Networking (PvP Ready)
| System | File | Status | Description |
|--------|------|--------|-------------|
| NetworkTransport | `network/NetworkTransport.ts` | ✅ Built | WebSocket with reconnection |
| Serializer | `network/Serializer.ts` | ✅ Built | Binary packet encoding |
| ClockSync | `network/ClockSync.ts` | ✅ Built | Server time synchronization |
| PredictionSystem | `client/PredictionSystem.ts` | ✅ Built | Client-side prediction |
| InterpolationBuffer | `client/InterpolationBuffer.ts` | ✅ Built | Remote entity interpolation |

#### Orchestrators
| System | File | Status | Description |
|--------|------|--------|-------------|
| ClientOrchestrator | `orchestrator/ClientOrchestrator.ts` | ✅ Built | Client game loop & init |
| ServerOrchestrator | `orchestrator/ServerOrchestrator.ts` | ✅ Built | Server game loop |
| TickScheduler | `server/TickScheduler.ts` | ✅ Built | Fixed timestep loop |
| TickProcessor | `server/TickProcessor.ts` | ✅ Built | Server tick processing |

#### Game Logic
| System | File | Status | Description |
|--------|------|--------|-------------|
| CombatSystem | `game/CombatSystem.ts` | ✅ Built | Shooting, damage, health |
| SpawnSystem | `game/SpawnSystem.ts` | ✅ Built | Spawn point selection |
| MatchStateMachine | `game/MatchStateMachine.ts` | ✅ Built | Match state transitions |
| LagCompensation | `game/LagCompensation.ts` | ✅ Built | Server-side hit rewind |
| AntiCheat | `game/AntiCheat.ts` | ✅ Built | Speed/fire rate validation |
| CharacterHitbox | `game/CharacterHitbox.ts` | ✅ Built | Hitbox configuration |

#### Bot AI System
| System | File | Status | Description |
|--------|------|--------|-------------|
| BotPlayer | `bot/BotPlayer.ts` | ✅ Built | Bot wrapper class |
| CombatConductor | `bot/CombatConductor.ts` | ✅ Built | AI decision orchestrator |
| BotPersonality | `bot/BotPersonality.ts` | ✅ Built | Personality configs |
| BotMatchManager | `bot/BotMatchManager.ts` | ✅ Built | Bot match lifecycle |
| TacticalNavigator | `bot/TacticalNavigator.ts` | ✅ Built | Lane/angle execution |
| AimController | `bot/AimController.ts` | ✅ Built | Aim smoothing |
| MercySystem | `bot/MercySystem.ts` | ✅ Built | Prevent stomping |
| AggressionCurve | `bot/AggressionCurve.ts` | ✅ Built | Dynamic aggression |
| SpatialAwareness | `bot/SpatialAwareness.ts` | ✅ Built | Cover/LOS detection |

#### Map System
| System | File | Status | Description |
|--------|------|--------|-------------|
| MapRegistry | `maps/MapRegistry.ts` | ✅ Built | Dynamic map registration |
| MapLoader | `maps/MapLoader.ts` | ✅ Built | Async asset loading |
| MapDefinition | `maps/types.ts` | ✅ Built | Complete map config type |

#### Client Systems
| System | File | Status | Description |
|--------|------|--------|-------------|
| InputManager | `client/InputManager.ts` | ✅ Built | WASD + mouse input |
| CameraController | `client/CameraController.ts` | ✅ Built | First-person camera |

#### Presentation
| System | File | Status | Description |
|--------|------|--------|-------------|
| HUDRenderer | `presentation/HUDRenderer.ts` | ✅ Built | Health, ammo, crosshair |
| AudioSystem | `presentation/AudioSystem.ts` | ✅ Built | 3D spatial audio |
| ArenaRenderer | `rendering/ArenaRenderer.ts` | ✅ Built | Three.js renderer |
| PostProcessing | `rendering/PostProcessing.ts` | ✅ Built | Bloom, color grading |
| PerformanceOptimizer | `rendering/PerformanceOptimizer.ts` | ✅ Built | AnimationLOD, DrawCallMonitor |

#### Debug
| System | File | Status | Description |
|--------|------|--------|-------------|
| DebugOverlay | `debug/DebugOverlay.ts` | ✅ Built | Collision visualization |
| DiagnosticsRecorder | `debug/DiagnosticsRecorder.ts` | ✅ Built | Performance recording |
| BotDebugOverlay | `bot/BotDebugOverlay.ts` | ✅ Built | Bot debug UI |

### What's Hardcoded in ArenaPlayTest.tsx (Needs Extraction)

| Section | Lines | Should Use |
|---------|-------|------------|
| Bot visual/physics/combat | ~350 | `BotController` (new) + `BotMatchManager` |
| Bot movement interpolation | ~100 | Extract to `BotVisualController` |
| Debug HUD | ~150 | Extract to `ArenaDebugHUD` component |
| Game loop | ~200 | `ClientOrchestrator` (already built!) |
| Performance tracking | ~50 | `DiagnosticsRecorder` (already built!) |
| UI overlays | ~200 | Extract to `ArenaOverlays` component |

### Hardcoded Values to Extract

```typescript
// Bot movement interpolation (currently inline)
const BOT_POSITION_LERP = 6
const BOT_ROTATION_LERP = 5
const BOT_ACCELERATION = 8
const BOT_DECELERATION = 12
const BOT_MAX_SPEED = 5.0

// Bot combat (currently inline)
const BOT_FIRE_RATE = 3 // shots/second
const BOT_FIRE_INTERVAL = 1000 / BOT_FIRE_RATE
const BOT_BASE_ACCURACY = 0.25

// Map ID (should come from selection)
const DEFAULT_MAP_ID = 'abandoned_terminal'

// Player IDs (should come from matchmaking)
const LOCAL_PLAYER_ID = 1
const BOT_PLAYER_ID = 999
```

---

## Requirements

### Requirement 1: Use ClientOrchestrator Instead of Inline Game Loop

**User Story:** As a developer, I want the arena to use the existing ClientOrchestrator, so that we don't duplicate enterprise patterns.

#### Acceptance Criteria

1. WHEN initializing the arena THEN the system SHALL use `ClientOrchestrator.initialize()` instead of inline system creation
2. WHEN running the game loop THEN the system SHALL use `ClientOrchestrator.startGameLoop()` instead of inline `requestAnimationFrame`
3. WHEN the orchestrator initializes THEN it SHALL create all systems in correct order:
   - EventBus → CollisionWorld → SpawnSystem → Physics3D → InputManager → CameraController → PredictionSystem → InterpolationBuffer → HUDRenderer → AudioSystem → DebugOverlay → DiagnosticsRecorder
4. WHEN accessing systems THEN the code SHALL use `orchestrator.getSystems()` instead of local variables
5. WHEN disposing THEN the system SHALL use `ClientOrchestrator.dispose()` for proper cleanup

### Requirement 2: Use BotMatchManager Instead of Inline Bot Logic

**User Story:** As a developer, I want the arena to use the existing BotMatchManager, so that bot match lifecycle is properly managed.

#### Acceptance Criteria

1. WHEN starting a bot match THEN the system SHALL use `BotMatchManager.startMatch()` instead of inline `initBot()`
2. WHEN updating the bot THEN the system SHALL use `BotMatchManager.update()` instead of inline bot update logic
3. WHEN the player hits the bot THEN the system SHALL use `BotMatchManager.onPlayerHitBot()` instead of inline damage logic
4. WHEN the match ends THEN the system SHALL use `BotMatchManager.getMatchResult()` for results
5. WHEN disposing THEN the system SHALL use `BotMatchManager.dispose()` for cleanup

### Requirement 3: Extract Bot Visual Controller

**User Story:** As a developer, I want bot visual interpolation extracted to a reusable class, so that it can be used by both practice mode and PvP spectating.

#### Acceptance Criteria

1. WHEN creating a bot visual THEN the system SHALL use `BotVisualController` class
2. THE `BotVisualController` SHALL handle:
   - Position lerping with configurable `BOT_POSITION_LERP`
   - Rotation lerping with configurable `BOT_ROTATION_LERP`
   - Acceleration-based movement with `BOT_ACCELERATION` and `BOT_DECELERATION`
   - Max speed capping with `BOT_MAX_SPEED`
   - Animation mixer updates with LOD
3. WHEN the bot spawns/respawns THEN the visual position SHALL reset instantly (no lerp teleport)
4. THE configuration SHALL be injectable via constructor, not hardcoded

### Requirement 4: Extract Arena Debug HUD Component

**User Story:** As a developer, I want the debug HUD extracted to a React component, so that it can be toggled independently.

#### Acceptance Criteria

1. WHEN rendering debug info THEN the system SHALL use `<ArenaDebugHUD />` component
2. THE component SHALL display:
   - FPS and frame time breakdown (physics, bot, render)
   - Memory usage and GC warnings
   - Player position, velocity, grounded state
   - Combat stats (health, ammo, score)
   - Bot tactical intent ("thought bubble")
3. THE component SHALL accept `debugInfo` prop with all metrics
4. THE component SHALL be toggleable via F3 key

### Requirement 5: Use MatchStateMachine for Match Flow

**User Story:** As a developer, I want the arena to use the existing MatchStateMachine, so that match state transitions are consistent.

#### Acceptance Criteria

1. WHEN managing match state THEN the system SHALL use `MatchStateMachine` instead of inline state
2. THE state machine SHALL handle transitions: `waiting → countdown → playing → ended → cleanup`
3. WHEN both players are ready THEN a 3-second countdown SHALL display
4. WHEN the countdown ends THEN the state SHALL transition to `playing`
5. WHEN a player reaches score limit OR time expires THEN the state SHALL transition to `ended`

### Requirement 6: Dynamic Map Selection (No Hardcoding)

**User Story:** As a player, I want to select any registered map, so that I'm not locked to a single arena.

#### Acceptance Criteria

1. WHEN entering practice mode THEN the player SHALL see a map selection from `MapRegistry.getAll()`
2. WHEN entering PvP queue THEN the map SHALL be selected from registry (random or voted)
3. THE system SHALL NOT hardcode `DEFAULT_MAP_ID = 'abandoned_terminal'`
4. WHEN loading a map THEN the system SHALL use `MapLoader.load(mapId)` with the selected ID
5. WHEN a new map is registered THEN it SHALL automatically appear in selection UI

### Requirement 7: Use GameConfig for All Settings

**User Story:** As a developer, I want all arena settings to come from GameConfig, so that configuration is centralized.

#### Acceptance Criteria

1. WHEN initializing systems THEN the code SHALL use `DEFAULT_GAME_CONFIG` or `createGameConfig()`
2. THE config SHALL include all subsystem configs:
   - `physics`, `match`, `combat`, `network`, `clockSync`, `tick`
   - `interpolation`, `prediction`, `antiCheat`, `lagCompensation`
   - `camera`, `audio`, `hud`, `debug`, `diagnostics`
3. WHEN in development THEN the system SHALL use `createDevConfig()` with debug enabled
4. WHEN in production THEN the system SHALL use `createProdConfig()` with debug disabled

### Requirement 8: Arena Entry from Dashboard

**User Story:** As a player, I want to access the arena from the main dashboard, so that I can play arena matches without navigating to a separate test page.

#### Acceptance Criteria

1. WHEN on the dashboard THEN the player SHALL see an "Arena" mode option
2. WHEN clicking "Arena" THEN the player SHALL see options for "Practice (vs Bot)" and "Find Match (PvP)"
3. WHEN selecting "Practice" THEN the player SHALL be able to choose:
   - Map (from MapRegistry.getAll())
   - Bot personality and difficulty
4. WHEN selecting "Practice" THEN the player SHALL enter the selected map immediately with the selected bot
5. WHEN selecting "Find Match" THEN the player SHALL enter the matchmaking queue for arena mode
6. WHEN a match is found THEN both players SHALL be loaded into the same arena instance

### Requirement 9: Arena State Store

**User Story:** As a developer, I want proper state management, so that the arena integrates cleanly with the dashboard.

#### Acceptance Criteria

1. WHEN entering the arena THEN the `arenaStore` SHALL track:
   - `mode`: 'practice' | 'pvp' | 'spectate'
   - `matchState`: from MatchStateMachine
   - `mapId`: selected map ID
   - `playerScore`: number
   - `opponentScore`: number
   - `timeRemaining`: number (for PvP)
2. WHEN the match state changes THEN the store SHALL emit events for UI updates
3. WHEN leaving the arena THEN all arena resources SHALL be properly disposed
4. WHEN returning to dashboard THEN the arena scene SHALL be fully unloaded from memory

---

## File Structure (After Refactoring)

```
frontend/src/
├── arena/
│   ├── orchestrator/
│   │   ├── ClientOrchestrator.ts      # ✅ EXISTS - Use this!
│   │   └── ServerOrchestrator.ts      # ✅ EXISTS - For PvP
│   │
│   ├── bot/
│   │   ├── BotPlayer.ts               # ✅ EXISTS
│   │   ├── BotMatchManager.ts         # ✅ EXISTS - Use this!
│   │   ├── BotVisualController.ts     # NEW: Extract from ArenaPlayTest
│   │   └── ... (existing files)
│   │
│   ├── game/
│   │   ├── MatchStateMachine.ts       # ✅ EXISTS - Use this!
│   │   ├── CombatSystem.ts            # ✅ EXISTS
│   │   ├── LagCompensation.ts         # ✅ EXISTS
│   │   ├── AntiCheat.ts               # ✅ EXISTS
│   │   └── ...
│   │
│   ├── config/
│   │   └── GameConfig.ts              # ✅ EXISTS - Use this!
│   │
│   └── ui/
│       ├── ArenaDebugHUD.tsx          # NEW: Extract from ArenaPlayTest
│       ├── ArenaOverlays.tsx          # NEW: Loading/instructions/results
│       ├── ArenaCountdown.tsx         # NEW: Match countdown
│       └── ArenaResults.tsx           # NEW: End-of-match results
│
├── pages/
│   ├── ArenaPlayTest.tsx              # REFACTORED: ~300 lines (uses orchestrators)
│   └── Arena.tsx                      # NEW: Dashboard-integrated arena page
│
├── components/dashboard/
│   └── ArenaCard.tsx                  # NEW: Arena mode card for dashboard
│
└── stores/
    └── arenaStore.ts                  # NEW: Arena state management
```

---

## Integration with Existing Systems

### Systems to USE (Already Built)
- `ClientOrchestrator` - Replace inline game loop
- `BotMatchManager` - Replace inline bot lifecycle
- `MatchStateMachine` - Replace inline match state
- `GameConfig` - Replace scattered config values
- `DiagnosticsRecorder` - Replace inline performance tracking
- `MapRegistry` + `MapLoader` - Already using, keep dynamic

### Systems Ready for PvP (Phase 2)
- `NetworkTransport` - WebSocket communication
- `Serializer` - Binary packet encoding
- `ClockSync` - Server time synchronization
- `PredictionSystem` - Client-side prediction
- `InterpolationBuffer` - Remote entity interpolation
- `LagCompensation` - Server-side hit rewind
- `AntiCheat` - Cheat detection
- `TickScheduler` - Server tick loop

---

## Phase 1 Deliverables (This Spec)

1. ✅ Refactor ArenaPlayTest.tsx to use `ClientOrchestrator`
2. ✅ Refactor ArenaPlayTest.tsx to use `BotMatchManager`
3. ✅ Extract `BotVisualController` class
4. ✅ Extract `ArenaDebugHUD` component
5. ✅ Extract `ArenaOverlays` component
6. ✅ Create `arenaStore` for state management
7. ✅ Create `Arena.tsx` dashboard page
8. ✅ Create `ArenaCard` dashboard component
9. ✅ Use `MatchStateMachine` for match flow
10. ✅ Use `GameConfig` for all settings
11. ✅ Dynamic map selection (no hardcoding)

## Phase 2 (Future - Not This Spec)

- PvP queue integration with `NetworkTransport`
- Network synchronization with `PredictionSystem` + `InterpolationBuffer`
- Server authority with `LagCompensation`
- Anti-cheat integration with `AntiCheat`
- Ranked arena mode

---

## Success Metrics

| Metric | Target |
|--------|--------|
| ArenaPlayTest.tsx lines | <300 |
| Systems reused vs duplicated | 100% reuse |
| Hardcoded values | 0 |
| Load time (practice mode) | <3 seconds |
| Memory after arena exit | Return to pre-arena baseline |
| Bot functionality | 100% parity with current |

---

*Document Version: 2.0*
*Created: December 18, 2024*
*Related Specs: arena-mechanics-audit, matchmaking-queue, arena-map-registry*
