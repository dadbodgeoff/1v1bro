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
- [ ] Create `frontend/src/arena/bot/TacticsLibrary.ts`
- [ ] Define STRAFE patterns (left, right, random)
- [ ] Define PEEK patterns (quick, slow, double)
- [ ] Define PUSH patterns (direct, angled)
- [ ] Define RETREAT patterns (back, diagonal)
- [ ] Define HOLD patterns (angle hold, crouch hold)
- [ ] Add pattern selection by state and aggression

### Task 2.2: Combat Flow Analyzer
- [ ] Create `frontend/src/arena/bot/CombatFlowAnalyzer.ts`
- [ ] Track player action history (10 second window)
- [ ] Detect player patterns (aggressive, passive, flanker)
- [ ] Calculate counter-play weights
- [ ] Track engagement outcomes

### Task 2.3: Signature Move Tracker
- [ ] Create `frontend/src/arena/bot/SignatureMoveTracker.ts`
- [ ] Define signature moves per personality
- [ ] Implement cooldown tracking
- [ ] Add trigger condition checking
- [ ] Add execution state machine

### Task 2.4: Engagement Composer
- [ ] Create `frontend/src/arena/bot/EngagementComposer.ts`
- [ ] Implement phrase composition logic
- [ ] Define phrase types (pressure, probe, punish, reset)
- [ ] Add smooth transitions between phrases
- [ ] Respect aggression and player state

## Phase 3: Aim and Spatial (~1.5 hours)

### Task 3.1: Aim Controller
- [ ] Create `frontend/src/arena/bot/AimController.ts`
- [ ] Implement reaction time delay
- [ ] Add aim smoothing (lerp to target)
- [ ] Add predictive aiming based on tracking skill
- [ ] Add accuracy variance and jitter
- [ ] Add state-based aim degradation (worse when retreating)

### Task 3.2: Spatial Awareness
- [ ] Create `frontend/src/arena/bot/SpatialAwareness.ts`
- [ ] Parse cover positions from CollisionManifest
- [ ] Implement line-of-sight checking
- [ ] Add position safety evaluation
- [ ] Add simple pathfinding to cover/positions

## Phase 4: Orchestrator (~2 hours)

### Task 4.1: Combat Conductor
- [ ] Create `frontend/src/arena/bot/CombatConductor.ts`
- [ ] Wire up all subsystems
- [ ] Implement state machine (PATROL → ENGAGE → RETREAT → REPOSITION)
- [ ] Implement pattern selection priority chain
- [ ] Implement pattern execution
- [ ] Add shooting decision logic
- [ ] Add event emission

### Task 4.2: Bot Personalities
- [ ] Create `frontend/src/arena/bot/BotPersonality.ts`
- [ ] Define Rusher personality config
- [ ] Define Sentinel personality config
- [ ] Define Duelist personality config
- [ ] Add difficulty presets (easy, medium, hard, adaptive)

### Task 4.3: Index and Exports
- [ ] Create `frontend/src/arena/bot/index.ts`
- [ ] Export public API

## Phase 5: Integration (~1.5 hours)

### Task 5.1: Arena Integration
- [ ] Add bot spawning to ArenaScene
- [ ] Wire bot movement through Physics3D
- [ ] Wire bot damage through CombatSystem
- [ ] Add bot to render loop

### Task 5.2: Quick Play Mode
- [ ] Create bot match mode in matchmaking
- [ ] Add difficulty selection UI
- [ ] Add personality selection (or random)
- [ ] Wire up match start/end with bot

### Task 5.3: Debug Tools
- [ ] Add bot state visualization (optional HUD)
- [ ] Add aggression curve graph (dev mode)
- [ ] Add pattern execution log

## Phase 6: Polish (~1 hour)

### Task 6.1: Tuning
- [ ] Playtest and tune aggression wave frequencies
- [ ] Tune aim reaction times per difficulty
- [ ] Tune mercy thresholds
- [ ] Tune signature trigger conditions

### Task 6.2: Testing
- [ ] Integration tests for CombatConductor
- [ ] Determinism tests (seeded random)
- [ ] Performance benchmark (< 1ms per tick)

---

## Estimated Total: ~10.5 hours

## Dependencies
- Requires: CollisionManifest (done), Physics3D (done), CombatSystem (done)
- Optional: Map-specific cover positions for better spatial awareness

## Notes
- Start with Phase 1-4 for a working bot
- Phase 5-6 for full integration and polish
- Can ship basic bot without signatures/phrases (just tactics library)
