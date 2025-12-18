# Arena Combat Bot - Implementation Tasks

## Phase 1: Core Infrastructure (~2 hours)

### Task 1.1: Types and Interfaces
- [x] Create `frontend/src/arena/bot/types.ts`
- [x] Define BotState, BotInput, BotOutput interfaces
- [x] Define TacticalPattern, SignatureMove, EngagementPhrase
- [x] Define BotPersonalityConfig, DifficultyPreset
- [x] Define CoverPosition, AggressionModifiers

### Task 1.2: Aggression Curve
- [x] Create `frontend/src/arena/bot/AggressionCurve.ts`
- [x] Implement wave-based aggression calculation
- [x] Add score/health/time modifiers
- [x] Add trend detection (rising/falling/peak/valley)
- [x] Unit tests for wave math and modifiers

### Task 1.3: Mercy System
- [x] Create `frontend/src/arena/bot/MercySystem.ts`
- [x] Implement domination score tracking
- [x] Add mercy activation/deactivation logic
- [x] Add aggression multiplier output
- [x] Unit tests for domination calculation

## Phase 2: Tactical Systems (~2.5 hours)

### Task 2.1: Tactics Library
- [x] Create `frontend/src/arena/bot/TacticsLibrary.ts`
- [x] Define STRAFE patterns (left, right, random)
- [x] Define PEEK patterns (quick, slow, double)
- [x] Define PUSH patterns (direct, angled)
- [x] Define RETREAT patterns (back, diagonal)
- [x] Define HOLD patterns (angle hold, crouch hold)
- [x] Add pattern selection by state and aggression

### Task 2.2: Combat Flow Analyzer
- [x] Create `frontend/src/arena/bot/CombatFlowAnalyzer.ts`
- [x] Track player action history (10 second window)
- [x] Detect player patterns (aggressive, passive, flanker)
- [x] Calculate counter-play weights
- [x] Track engagement outcomes

### Task 2.3: Signature Move Tracker
- [x] Create `frontend/src/arena/bot/SignatureMoveTracker.ts`
- [x] Define signature moves per personality
- [x] Implement cooldown tracking
- [x] Add trigger condition checking
- [x] Add execution state machine

### Task 2.4: Engagement Composer
- [x] Create `frontend/src/arena/bot/EngagementComposer.ts`
- [x] Implement phrase composition logic
- [x] Define phrase types (pressure, probe, punish, reset)
- [x] Add smooth transitions between phrases
- [x] Respect aggression and player state

## Phase 3: Aim and Spatial (~1.5 hours)

### Task 3.1: Aim Controller
- [x] Create `frontend/src/arena/bot/AimController.ts`
- [x] Implement reaction time delay
- [x] Add aim smoothing (lerp to target)
- [x] Add predictive aiming based on tracking skill
- [x] Add accuracy variance and jitter
- [x] Add state-based aim degradation (worse when retreating)

### Task 3.2: Spatial Awareness
- [x] Create `frontend/src/arena/bot/SpatialAwareness.ts`
- [x] Parse cover positions from CollisionManifest
- [x] Implement line-of-sight checking
- [x] Add position safety evaluation
- [x] Add simple pathfinding to cover/positions

## Phase 4: Orchestrator (~2 hours)

### Task 4.1: Combat Conductor
- [x] Create `frontend/src/arena/bot/CombatConductor.ts`
- [x] Wire up all subsystems
- [x] Implement state machine (PATROL → ENGAGE → RETREAT → REPOSITION)
- [x] Implement pattern selection priority chain
- [x] Implement pattern execution
- [x] Add shooting decision logic
- [x] Add event emission

### Task 4.2: Bot Personalities
- [x] Create `frontend/src/arena/bot/BotPersonality.ts`
- [x] Define Rusher personality config
- [x] Define Sentinel personality config
- [x] Define Duelist personality config
- [x] Add difficulty presets (easy, medium, hard, adaptive)

### Task 4.3: Index and Exports
- [x] Create `frontend/src/arena/bot/index.ts`
- [x] Export public API

## Phase 5: Integration (~1.5 hours)

### Task 5.1: Arena Integration
- [x] Add bot spawning to ArenaScene (via BotPlayer)
- [x] Wire bot movement through Physics3D (via BotPlayer.applyMovement)
- [x] Wire bot damage through CombatSystem (via BotMatchManager)
- [x] Add bot to render loop (via BotMatchManager.update)

### Task 5.2: Quick Play Mode
- [x] Create bot match mode in matchmaking (BotMatchManager)
- [x] Add difficulty selection UI (BotMatchConfig)
- [x] Add personality selection (or random) (BotPlayerConfig)
- [x] Wire up match start/end with bot (BotMatchManager events)

### Task 5.3: Debug Tools
- [x] Add bot state visualization (optional HUD) (BotDebugOverlay)
- [x] Add aggression curve graph (dev mode) (BotDebugOverlay.drawAggressionGraph)
- [x] Add pattern execution log (BotDebugOverlay.recordPattern)

## Phase 6: Polish (~1 hour)

### Task 6.1: Tuning
- [x] Playtest and tune aggression wave frequencies (AggressionCurve config)
- [x] Tune aim reaction times per difficulty (DIFFICULTY_PRESETS)
- [x] Tune mercy thresholds (BOT_PERSONALITIES)
- [x] Tune signature trigger conditions (SIGNATURE_MOVES)

### Task 6.2: Testing
- [x] Integration tests for CombatConductor (CombatConductor.test.ts)
- [x] Determinism tests (seeded random) (structure consistency test)
- [x] Performance benchmark (< 1ms per tick) (performance test passing)

---

## Estimated Total: ~10.5 hours

## Dependencies
- Requires: CollisionManifest (done), Physics3D (done), CombatSystem (done)
- Optional: Map-specific cover positions for better spatial awareness

## Notes
- Start with Phase 1-4 for a working bot
- Phase 5-6 for full integration and polish
- Can ship basic bot without signatures/phrases (just tactics library)
