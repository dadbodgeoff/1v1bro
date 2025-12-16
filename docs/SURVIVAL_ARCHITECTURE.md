# Survival Runner - Complete Architecture Map

## Overview

This document provides a 100% complete mapping of all files, systems, data flows, initialization order, and potential race conditions in the survival runner game.

---

## 📁 FILE INVENTORY (100% Complete)

### 1. ENTRY POINTS & HOOKS
```
frontend/src/survival/
├── index.ts                           # Main export barrel
├── hooks/
│   ├── index.ts                       # Hook exports
│   ├── useSurvivalGame.ts             # Main game hook - creates SurvivalEngine
│   ├── useSurvivalGameWithAnalytics.ts # Game hook with analytics integration
│   ├── useSurvivalAnalytics.ts        # Analytics tracking hook
│   ├── useSurvivalTrivia.ts           # Trivia integration hook
│   ├── useTriviaBillboards.ts         # Billboard spawning hook
│   ├── useTriviaGate.ts               # Trivia gate interaction hook
│   ├── useQuizRunner.ts               # Quiz panel runner
│   ├── useLeaderboard.ts              # Leaderboard data hook
│   ├── useMobileDetection.ts          # Mobile device detection
│   └── useMobileOptimization.ts       # Mobile performance optimization
```

### 2. ENGINE CORE (The Heart)
```
frontend/src/survival/engine/
├── SurvivalEngine.ts          # 🔴 MAIN FACADE - orchestrates everything
├── InitializationManager.ts   # 🔴 CRITICAL - asset loading & setup order
├── RunManager.ts              # Game run lifecycle (start/restart/gameover)
├── GameStateManager.ts        # Game state & phase management
├── GameLoop.ts                # Fixed timestep game loop (60Hz physics)
├── FixedUpdateLoop.ts         # Physics-rate updates
├── RenderUpdateLoop.ts        # Visual updates at display rate
│
├── PlayerController.ts        # 🔴 Player position, lanes, visual state
├── PlayerManager.ts           # Player setup, animation sync, respawn
├── PhysicsController.ts       # 🔴 Gravity, jumping, ground detection
│
├── TrackManager.ts            # 🔴 Track tiles, surface height calculation
├── ObstacleManager.ts         # 🔴 Obstacle spawning & positioning
├── CollectibleManager.ts      # Gem/collectible spawning
│
├── CollisionSystem.ts         # 🔴 AABB collision detection
├── CollisionHandler.ts        # Collision response & callbacks
├── CollisionDebugOverlay.ts   # Debug visualization
│
├── InputController.ts         # Keyboard/touch input handling
├── InputBuffer.ts             # Input buffering for responsiveness
├── TouchController.ts         # Touch-specific input
│
├── CameraController.ts        # Camera follow, shake, effects
├── AnimationController.ts     # Character animation state machine
├── PerformanceMonitor.ts      # FPS/performance tracking
├── GhostManager.ts            # Ghost replay management
├── LifeEnforcer.ts            # Life/death state enforcement
└── ObstacleOrchestrator.ts    # (Legacy - see orchestrator/)
```

### 3. ORCHESTRATOR (Procedural Generation)
```
frontend/src/survival/orchestrator/
├── index.ts                   # Exports
├── types.ts                   # Type definitions
├── ObstacleOrchestrator.ts    # 🔴 MAIN - coordinates all spawning
├── SymphonyConductor.ts       # High-level difficulty/pacing
├── DifficultyManager.ts       # Difficulty tier management
├── PacingController.ts        # Pacing phases (buildup/climax/rest)
├── TensionCurve.ts            # Tension/intensity tracking
├── DynamicBreather.ts         # Adaptive difficulty based on performance
├── FlowAnalyzer.ts            # Player flow state analysis
├── PatternLibrary.ts          # Obstacle pattern definitions
├── PatternSelector.ts         # Pattern selection logic
├── PhraseComposer.ts          # Pattern phrase composition
├── SpacingCalculator.ts       # Obstacle spacing calculations
├── MotifTracker.ts            # Pattern motif tracking
├── SeededRandom.ts            # Deterministic random for replays
└── CollectibleOrchestrator.ts # Collectible spawning logic
```

### 4. CONFIG (Settings & Constants)
```
frontend/src/survival/config/
├── index.ts                   # Exports
├── constants.ts               # 🔴 getSurvivalConfig() - all game constants
├── WorldConfig.ts             # 🔴 SINGLETON - runtime geometry values
├── mobile.ts                  # Mobile-specific config overrides
├── device.ts                  # Device detection utilities
├── quality.ts                 # Quality level settings
└── *.test.ts                  # Tests
```

### 5. CORE SYSTEMS
```
frontend/src/survival/core/
├── index.ts                   # Exports
├── GameEventBus.ts            # 🔴 Centralized event system
├── EventWiring.ts             # 🔴 Event subscriptions & cross-system callbacks
├── LoadingOrchestrator.ts     # Loading state machine
├── LoadingManager.ts          # Asset loading coordination
├── LifecycleManager.ts        # Visibility/focus/context handling
├── ResourceManager.ts         # Resource cleanup
├── ViewportManager.ts         # Viewport/resize handling
└── *.test.ts                  # Tests
```

### 6. RENDERER
```
frontend/src/survival/renderer/
├── SurvivalRenderer.ts        # 🔴 THREE.js scene, camera, lights
├── AssetLoader.ts             # 🔴 GLB model loading
├── GhostRenderer.ts           # Ghost player rendering
└── *.test.ts                  # Tests
```

### 7. EFFECTS
```
frontend/src/survival/effects/
├── index.ts                   # Exports
├── ParticleSystem.ts          # Particle effects (collect, respawn, etc)
├── FeedbackSystem.ts          # Audio/visual feedback
├── TransitionSystem.ts        # 🔴 Countdown, death, respawn transitions
├── ScreenShakeSystem.ts       # Camera shake effects
├── ComboEscalationSystem.ts   # Combo visual escalation
├── ImpactFlashOverlay.ts      # Impact flash effects
└── *.test.ts                  # Tests
```

### 8. GAME SYSTEMS
```
frontend/src/survival/systems/
├── index.ts                   # Exports
├── ComboSystem.ts             # Combo tracking & multipliers
├── MilestoneSystem.ts         # Distance milestones
├── AchievementSystem.ts       # Achievement tracking
├── InputRecorder.ts           # Input recording for ghosts
├── GhostReplay.ts             # Ghost playback
├── DeathManager.ts            # Death handling
├── TriviaBillboardSubsystem.ts # Trivia billboard integration
└── *.test.ts                  # Tests
```

### 9. SPACE/BACKGROUND
```
frontend/src/survival/space/
├── index.ts                   # Exports
├── types.ts                   # Type definitions
├── SpaceBackground.ts         # 🔴 Main background manager
├── NebulaBackground.ts        # Nebula shader background
├── StarField.ts               # Star particles
├── ShootingStars.ts           # Shooting star effects
├── SpaceParticles.ts          # Space dust particles
├── CelestialManager.ts        # Planets, asteroids, etc
└── CityScape.ts               # 🔴 City skyline below track
```

### 10. WORLD (Trivia)
```
frontend/src/survival/world/
├── index.ts                   # Exports
├── TriviaBillboard.ts         # Single billboard entity
├── TriviaBillboardManager.ts  # Billboard spawning/management
└── TriviaQuestionProvider.ts  # Question data provider
```

### 11. AUDIO
```
frontend/src/survival/audio/
├── index.ts                   # Exports
├── SynthSoundManager.ts       # Web Audio synthesizer
├── SoundEventRegistry.ts      # Sound event definitions
└── useSurvivalAudio.ts        # Audio hook
```

### 12. COMPONENTS (React UI)
```
frontend/src/survival/components/
├── index.ts                   # Exports
├── SurvivalHUD.tsx            # Main HUD (score, lives, combo)
├── TriviaOverlay.tsx          # Trivia question overlay
├── TriviaModal.tsx            # Trivia modal
├── QuizPanel.tsx              # Quiz panel
├── TouchControlsOverlay.tsx   # Mobile touch controls
├── TransitionOverlay.tsx      # Transition animations
├── MilestoneCelebration.tsx   # Milestone popups
├── LeaderboardWidget.tsx      # Leaderboard display
├── SurvivalRankWidget.tsx     # Rank display
├── CategorySelector.tsx       # Category selection
├── SymphonyDebugOverlay.tsx   # Debug overlay
├── EnterpriseLoadingScreen.tsx # Loading screen
├── EnterpriseOverlays.tsx     # Enterprise overlays
├── SurvivalLoadingScreen.tsx  # Loading screen
├── SurvivalErrorBoundary.tsx  # Error boundary
├── HUDAnimations.ts           # HUD animation utilities
├── useAnimatedValue.ts        # Animation hook
└── overlays/
    ├── index.ts
    ├── GameOverOverlay.tsx
    ├── PauseOverlay.tsx
    ├── PerformanceOverlay.tsx
    └── ReadyOverlay.tsx
```

### 13. TYPES
```
frontend/src/survival/types/
└── survival.ts                # All TypeScript type definitions
```

### 14. SERVICES
```
frontend/src/survival/services/
├── LeaderboardService.ts      # Leaderboard API
└── SurvivalApiService.ts      # Game API service
```

### 15. GUEST
```
frontend/src/survival/guest/
├── index.ts
└── SurvivalGuestSessionManager.ts # Guest session handling
```

### 16. DEBUG
```
frontend/src/survival/debug/
└── MemoryMonitor.ts           # Memory usage monitoring
```

---

## 🔄 INITIALIZATION FLOW (Critical Order)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INITIALIZATION SEQUENCE                          │
└─────────────────────────────────────────────────────────────────────┘

1. useSurvivalGame() hook called
   │
   ▼
2. SurvivalEngine constructor
   │
   ├─► getSurvivalConfig() - Load static config
   ├─► WorldConfig.getInstance() - Get singleton
   ├─► WorldConfig.setSpeedConfig() - Set speed values
   │
   ├─► Create SurvivalRenderer (THREE.js scene)
   ├─► Create AssetLoader
   ├─► Create TrackManager (scene ref)
   ├─► Create ObstacleManager (scene ref)
   ├─► Create CollectibleManager (scene ref)
   ├─► Create InputController
   ├─► Create PhysicsController
   ├─► Create CollisionSystem
   │
   ├─► Create InputBuffer
   ├─► Create CameraController
   ├─► Create PlayerController
   ├─► Create PerformanceMonitor
   │
   ├─► Create ParticleSystem
   ├─► Create FeedbackSystem
   ├─► Create TransitionSystem
   │
   ├─► Create ComboSystem
   ├─► Create InputRecorder
   ├─► Create GhostReplay/GhostRenderer
   ├─► Create MilestoneSystem
   ├─► Create AchievementSystem
   │
   ├─► Create GhostManager
   ├─► Create GameEventBus
   ├─► wireCollisionSystem() - Connect collision to events
   │
   ├─► Create LifecycleManager
   ├─► Create GameLoop
   │
   ├─► initializeModularSystems()
   │   ├─► Create LifeEnforcer
   │   ├─► Create CollisionHandler
   │   └─► wireEvents() - Connect all event handlers
   │
   ├─► Create LoadingOrchestrator
   └─► Create InitializationManager
   │
   ▼
3. SurvivalEngine.initialize() called
   │
   ▼
4. InitializationManager.initialize()
   │
   ├─► loadingOrchestrator.start()
   ├─► lifecycleManager.initialize()
   │
   ├─► assetLoader.loadAll() ─────────────────────┐
   │                                               │
   │   ┌───────────────────────────────────────────┘
   │   │ PARALLEL ASSET LOADING:
   │   │ - Track model (longTile.glb)
   │   │ - Character models (run/jump/down.glb)
   │   │ - Obstacle models (highBarrier/lowBarrier/etc)
   │   └───────────────────────────────────────────┐
   │                                               │
   ├─► trackManager.initialize(assets.track)  ◄───┘
   │   │
   │   └─► 🔴 WorldConfig.setTrackSurfaceHeight(box.max.y)
   │       (THIS IS WHERE TRACK HEIGHT IS SET!)
   │
   ├─► obstacleManager.initialize(assets)
   │   (Reads WorldConfig.trackSurfaceHeight + OFFSET)
   │
   ├─► loadCollectiblesAsync() (non-blocking)
   │
   ├─► physicsController.initialize(scene)
   │
   ├─► PlayerManager created via callback
   │   ├─► playerManager.setupPlayer(assets)
   │   │   └─► playerController.initialize()
   │   │       └─► 🔴 Reads WorldConfig.trackSurfaceHeight
   │   │           (May get DEFAULT 1.3 if track not ready!)
   │   │
   │   └─► playerManager.setupAnimatedCharacter(assets)
   │       └─► WorldConfig.setPlayerDimensions()
   │
   ├─► physicsController.setTrackMeshes()
   │
   ├─► 🔴 playerManager.syncAnimationPosition()
   │   └─► Updates player Y from WorldConfig
   │       (FIXES any race condition from earlier)
   │
   ├─► cameraController.initialize()
   │
   ├─► renderer.addTrackLights()
   │
   ├─► FixedUpdateLoop created
   ├─► RenderUpdateLoop created
   ├─► RunManager created
   │
   ├─► Audio initialization (async)
   │
   ├─► Secondary loading (async, non-blocking):
   │   ├─► loadCelestialsAsync()
   │   └─► loadCityAsync()
   │       └─► renderer.registerCityModel()
   │           └─► CityScape.registerModel()
   │
   ├─► Ghost renderer setup
   │
   └─► Warmup (shader compilation)
   │
   ▼
5. stateManager.setPhase('ready')
   │
   ▼
6. gameLoop.start()
```

---

## 🎯 Y-POSITION DATA FLOW (The Problem Area)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Y-POSITION SOURCES OF TRUTH                      │
└─────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │   Track GLB Model   │
                    │   (longTile.glb)    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   TrackManager      │
                    │   .initialize()     │
                    │                     │
                    │   box.max.y = ?     │
                    │   (e.g., 1.3)       │
                    └──────────┬──────────┘
                               │
                               ▼
              ┌────────────────────────────────┐
              │        WorldConfig             │
              │        (SINGLETON)             │
              │                                │
              │  trackSurfaceHeight = 1.3      │
              │  (DEFAULT before track loads)  │
              └────────────────┬───────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ PlayerController │ │ PhysicsController│ │ ObstacleManager  │
│                  │ │                  │ │                  │
│ position.y =     │ │ groundHeight =   │ │ baseY =          │
│ trackSurfaceHt   │ │ trackSurfaceHt   │ │ trackSurfaceHt   │
│                  │ │ + EPSILON        │ │ + OFFSET (2.05!) │
│                  │ │ - footOffset     │ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
           │                   │                   │
           │                   │                   │
           ▼                   ▼                   ▼
    ┌─────────────────────────────────────────────────────┐
    │                    MISMATCH!                        │
    │                                                     │
    │  Player Y:    ~1.3 (trackSurfaceHeight)            │
    │  Obstacle Y:  ~3.35 (trackSurfaceHeight + 2.05)    │
    │                                                     │
    │  Obstacles are 2.05 units ABOVE player!            │
    └─────────────────────────────────────────────────────┘
```

---

## 🔴 RACE CONDITIONS IDENTIFIED

### Race Condition 1: Track vs Player Initialization
```
PROBLEM:
  PlayerController.initialize() may be called BEFORE
  TrackManager.initialize() sets WorldConfig.trackSurfaceHeight

CURRENT MITIGATION:
  PlayerManager.syncAnimationPosition() is called AFTER track init
  to update player Y position

RISK:
  If syncAnimationPosition() fails or is skipped, player uses default Y (1.3)
```

### Race Condition 2: Obstacle Offset Mismatch
```
PROBLEM:
  ObstacleManager uses TRACK_GEOMETRY_OFFSET = 2.05
  This offset is added to WorldConfig.trackSurfaceHeight
  
  Player does NOT use this offset
  
RESULT:
  Obstacles spawn 2.05 units HIGHER than player
  
FIX APPLIED:
  Changed TRACK_GEOMETRY_OFFSET from 2.05 to 0
```

### Race Condition 3: City Model Red Tint
```
PROBLEM:
  CityScape clones materials, but emissive may be baked into GLB
  Damage effect sets emissive to red
  If damage effect is active when model loads, clones get red tint
  
CURRENT MITIGATION:
  - optimizeModelMaterials() resets emissive on source
  - deepCloneWithMaterials() now resets emissive on each clone
  - forceRestoreColors() called on registerModel()
  
RISK:
  GLB model itself may have red emissive baked in from export
```

### Race Condition 4: Async Secondary Loading
```
PROBLEM:
  City and celestials load asynchronously AFTER game is ready
  If player starts before city loads, city may appear suddenly
  
CURRENT MITIGATION:
  LoadingOrchestrator tracks secondary loading separately
  Game can start before secondary assets are ready
  
RISK:
  Visual pop-in when assets load mid-game
```

---

## 📊 COLLISION SYSTEM FLOW

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COLLISION DETECTION FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

Every Fixed Update (60Hz):
│
├─► FixedUpdateLoop.update()
│   │
│   ├─► playerController.fixedUpdate()
│   │   └─► Update lane position, run cycle
│   │
│   ├─► physicsController.update()
│   │   ├─► checkGround() - raycast for ground
│   │   ├─► Apply gravity
│   │   ├─► Handle jumping
│   │   └─► Return newY, isGrounded, etc
│   │
│   ├─► playerController.setY(newY)
│   │
│   ├─► obstacleManager.update()
│   │   ├─► orchestrator.update() - get spawn requests
│   │   ├─► spawnFromRequest() - create obstacles
│   │   └─► removePassedObstacles()
│   │
│   └─► collisionHandler.update()
│       │
│       ├─► collisionSystem.checkCollisions()
│       │   │
│       │   ├─► Get player collision box
│       │   │   └─► Uses WorldConfig.playerDimensions
│       │   │
│       │   ├─► Get obstacles in range
│       │   │   └─► obstacleManager.getObstaclesInRange()
│       │   │
│       │   └─► For each obstacle:
│       │       ├─► Get obstacle collision box
│       │       │   └─► Uses WorldConfig.trackSurfaceHeight + OFFSET
│       │       │
│       │       ├─► AABB intersection test
│       │       │
│       │       └─► If collision:
│       │           ├─► Check obstacle type
│       │           ├─► Check player state (jumping/sliding)
│       │           └─► Return collision result
│       │
│       └─► If collision detected:
│           ├─► eventBus.emit('player:collision')
│           ├─► callbacks.onLifeLost()
│           └─► collisionSystem.triggerInvincibility()
```

---

## 🎵 ORCHESTRATOR FLOW (Obstacle Spawning)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    OBSTACLE ORCHESTRATOR FLOW                       │
└─────────────────────────────────────────────────────────────────────┘

ObstacleOrchestrator.update(playerZ, currentSpeed)
│
├─► SymphonyConductor.update()
│   ├─► DifficultyManager.update() - tier progression
│   ├─► PacingController.update() - phase transitions
│   └─► TensionCurve.update() - tension tracking
│
├─► DynamicBreather.update()
│   └─► Adjust difficulty based on player performance
│
├─► FlowAnalyzer.update()
│   └─► Analyze player flow state
│
├─► SpacingCalculator.getNextSpawnZ()
│   └─► Calculate when to spawn next obstacle
│
├─► PatternSelector.selectPattern()
│   ├─► Get current difficulty tier
│   ├─► Get current pacing phase
│   └─► Select appropriate pattern from PatternLibrary
│
├─► PhraseComposer.compose()
│   └─► Compose pattern into spawn requests
│
└─► Return SpawnRequest[]
    │
    ▼
ObstacleManager.spawnFromRequest()
│
├─► Get template for obstacle type
├─► Clone mesh
├─► Calculate Y position:
│   │
│   │  baseY = WorldConfig.trackSurfaceHeight + TRACK_GEOMETRY_OFFSET
│   │  yOffset = type-specific offset
│   │  mesh.position.y = baseY + yOffset
│   │
├─► Add to scene
└─► Create collision box (same Y calculation)
```

---

## 🔧 FILES THAT NEED OFFSET SYNCHRONIZATION

These files all reference track surface height or geometry offsets:

1. **WorldConfig.ts** - Source of truth (DEFAULT = 1.3)
2. **TrackManager.ts** - Sets WorldConfig.trackSurfaceHeight from model
3. **PlayerController.ts** - Reads WorldConfig.trackSurfaceHeight
4. **PlayerManager.ts** - Syncs player Y from WorldConfig
5. **PhysicsController.ts** - Uses trackSurfaceHeight + EPSILON - footOffset
6. **ObstacleManager.ts** - Uses trackSurfaceHeight + TRACK_GEOMETRY_OFFSET (was 2.05, now 0)
7. **CollisionHandler.ts** - Uses trackSurfaceHeight + TRACK_GEOMETRY_OFFSET (still 2.05!)
8. **CollisionDebugOverlay.ts** - Uses trackSurfaceHeight + TRACK_GEOMETRY_OFFSET (still 2.05!)
9. **CollisionSystem.ts** - Reads WorldConfig.playerDimensions

---

## ⚠️ REMAINING ISSUES TO FIX

1. **CollisionHandler.ts** - Still has `TRACK_GEOMETRY_OFFSET = 2.05`
2. **CollisionDebugOverlay.ts** - Still has `TRACK_GEOMETRY_OFFSET = 2.05`
3. **CityScape.ts** - May need GLB model re-export without red emissive

---

## 📋 RECOMMENDED FIX ORDER

1. Set all TRACK_GEOMETRY_OFFSET to 0 (or remove entirely)
2. Verify WorldConfig.trackSurfaceHeight is set before any system reads it
3. Add initialization order assertions/guards
4. Re-export city GLB without emissive if needed
5. Add debug logging to verify Y positions match at runtime



---

## ✅ FIXES APPLIED

| File | Change | Status |
|------|--------|--------|
| ObstacleManager.ts | TRACK_GEOMETRY_OFFSET: 2.05 → 0 | ✅ Fixed |
| CollisionHandler.ts | TRACK_GEOMETRY_OFFSET: 2.05 → 0 | ✅ Fixed |
| CollisionDebugOverlay.ts | TRACK_GEOMETRY_OFFSET: 2.05 → 0 | ✅ Fixed |
| CityScape.ts | Reset emissive on cloned materials | ✅ Fixed |

---

## 🔌 EVENT BUS FLOW

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GAME EVENT BUS ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────────┘

GameEventBus (core/GameEventBus.ts)
│
├─► Events emitted by systems:
│   │
│   ├─► 'player:collision' - CollisionHandler
│   │   └─► Payload: { obstacleType, position }
│   │
│   ├─► 'player:lifeLost' - SurvivalEngine
│   │   └─► Payload: { livesRemaining }
│   │
│   ├─► 'player:jump' - PhysicsController
│   │   └─► Payload: { height }
│   │
│   ├─► 'obstacle:cleared' - CollisionSystem
│   │   └─► Payload: { obstacleType, distance }
│   │
│   ├─► 'collectible:collected' - CollectibleManager
│   │   └─► Payload: { type, points }
│   │
│   ├─► 'combo:updated' - ComboSystem
│   │   └─► Payload: { combo, multiplier }
│   │
│   ├─► 'milestone:reached' - MilestoneSystem
│   │   └─► Payload: { distance, isMajor }
│   │
│   ├─► 'game:countdown' - TransitionSystem
│   │   └─► Payload: { value }
│   │
│   └─► 'game:started' / 'game:paused' / 'game:over'
│
└─► EventWiring.ts subscribes handlers:
    │
    ├─► 'player:collision' →
    │   ├─► feedbackSystem.emitSound('collision')
    │   ├─► cameraController.addShakeTrauma()
    │   └─► comboSystem.reset()
    │
    ├─► 'player:lifeLost' →
    │   ├─► transitionSystem.triggerDeath()
    │   └─► collisionSystem.triggerInvincibility()
    │
    ├─► 'obstacle:cleared' →
    │   ├─► comboSystem.increment()
    │   ├─► stateManager.addScore()
    │   └─► feedbackSystem.emitSound('clear')
    │
    ├─► 'collectible:collected' →
    │   ├─► particleSystem.emitCollectBurst()
    │   └─► feedbackSystem.emitSound('collect')
    │
    ├─► 'milestone:reached' →
    │   ├─► feedbackSystem.emitSound('milestone')
    │   └─► achievementSystem.checkMilestone()
    │
    └─► 'game:countdown' →
        └─► feedbackSystem.emitSound('countdown')
```

---

## 🎮 GAME LOOP TIMING

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GAME LOOP ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────┘

GameLoop.ts - Fixed timestep with interpolation
│
├─► FIXED_TIMESTEP = 1/60 (16.67ms)
│
├─► Each frame:
│   │
│   ├─► Accumulate delta time
│   │
│   ├─► While (accumulator >= FIXED_TIMESTEP):
│   │   │
│   │   └─► fixedUpdate(FIXED_TIMESTEP)
│   │       │
│   │       ├─► PlayerController.storePreviousState()
│   │       ├─► PlayerController.fixedUpdate()
│   │       ├─► PhysicsController.update()
│   │       ├─► PlayerController.setY()
│   │       ├─► TrackManager.update()
│   │       ├─► ObstacleManager.update()
│   │       ├─► CollectibleManager.update()
│   │       ├─► CollisionHandler.update()
│   │       └─► Update game time
│   │
│   └─► renderUpdate(delta, interpolation)
│       │
│       ├─► interpolation = accumulator / FIXED_TIMESTEP
│       │
│       ├─► PlayerController.update(interpolation)
│       │   └─► Interpolate position for smooth visuals
│       │
│       ├─► PlayerManager.updateAnimation()
│       ├─► CameraController.update()
│       ├─► ParticleSystem.update()
│       ├─► GhostRenderer.update()
│       └─► Renderer.render()
```

---

## 📱 MOBILE-SPECIFIC CONSIDERATIONS

```
Mobile Config (config/mobile.ts):
│
├─► Reduced obstacle count
├─► Larger touch targets
├─► Longer coyote time (more forgiving)
├─► Faster lane switch speed
├─► Lower texture resolution
└─► Fewer city instances

Device Detection (config/device.ts):
│
├─► isMobile - touch device detection
├─► isSafari - Safari-specific fixes
├─► isLowEnd - performance tier
└─► maxTextureSize - GPU capability
```

---

## 🧪 TEST FILES

```
Tests that validate the architecture:
│
├─► WorldConfig.test.ts - Singleton behavior, defaults
├─► PlayerController.test.ts - Y position from WorldConfig
├─► PhysicsController.test.ts - Ground detection
├─► ObstacleManager.test.ts - Collision box Y offset
├─► CollisionSystem.test.ts - AABB collision
├─► CollisionDebug.test.ts - Debug overlay
├─► GameEventBus.test.ts - Event emission/subscription
├─► EventWiring.test.ts - Cross-system wiring
├─► ComboSystem.test.ts - Combo mechanics
├─► GhostReplay.test.ts - Ghost recording/playback
└─► InitializationManager.test.ts - Init sequence
```

---

## 🔍 DEBUG TOOLS

1. **CollisionDebugOverlay** - Visual collision boxes
2. **SymphonyDebugOverlay** - Orchestrator state
3. **PerformanceOverlay** - FPS, memory
4. **MemoryMonitor** - Memory tracking
5. **Console logs** - `[TrackManager]`, `[ObstacleManager]`, etc.

---

## 📝 NEXT STEPS

1. **Rebuild and test** - Verify offset fixes work
2. **Add runtime assertions** - Ensure WorldConfig is initialized before reads
3. **Add debug logging** - Log actual Y values at spawn time
4. **Test on mobile** - Verify city colors and positioning
5. **Consider removing TRACK_GEOMETRY_OFFSET entirely** - It's now always 0
