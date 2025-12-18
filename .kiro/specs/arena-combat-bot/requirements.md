# Arena Combat Bot - Requirements

## Overview
An AI combat bot system for 1v1 arena matches using the Symphony Conductor pattern from the survival runner. The bot creates engaging, adaptive opponents that feel human-like through orchestrated behavior patterns, tension-based aggression, and dynamic mercy systems.

## Core Concept: Symphony → Combat Translation

| Survival Symphony | Combat Bot Equivalent |
|-------------------|----------------------|
| TensionCurve | AggressionCurve - controls attack frequency/risk-taking |
| FlowAnalyzer | CombatFlowAnalyzer - tracks engagement patterns |
| MotifTracker | SignatureMoveTracker - bot's recognizable attack combos |
| PhraseComposer | EngagementComposer - sequences of tactical decisions |
| DynamicBreather | MercySystem - backs off when dominating |
| PatternLibrary | TacticsLibrary - strafe, peek, push, retreat patterns |

## Requirements

### REQ-1: Combat Conductor (Core Orchestrator)
- **REQ-1.1**: CombatConductor class orchestrates all bot subsystems
- **REQ-1.2**: Updates at game tick rate (60Hz) with player state input
- **REQ-1.3**: Outputs movement vector, aim target, and action (shoot/reload/ability)
- **REQ-1.4**: Maintains internal state machine: PATROL → ENGAGE → RETREAT → REPOSITION
- **REQ-1.5**: Emits events for state transitions (for analytics/debugging)

### REQ-2: Aggression Curve (Tension → Aggression)
- **REQ-2.1**: Wave-based aggression (0.0-1.0) that ebbs and flows during match
- **REQ-2.2**: Base aggression influenced by: score differential, health ratio, time remaining
- **REQ-2.3**: Primary wave: ~30 second cycles for major push/retreat phases
- **REQ-2.4**: Secondary wave: ~10 second micro-variations
- **REQ-2.5**: Aggression affects: peek duration, push distance, shot timing, cover usage

### REQ-3: Combat Flow Analyzer
- **REQ-3.1**: Track player's recent actions (last 10 seconds)
- **REQ-3.2**: Detect player patterns: aggressive pusher, passive camper, flanker
- **REQ-3.3**: Calculate "flow weight" for tactical decisions based on counter-play
- **REQ-3.4**: Track engagement outcomes (won/lost/traded) for adaptation

### REQ-4: Signature Move Tracker (Motifs)
- **REQ-4.1**: Define 3-5 signature attack patterns per bot personality
- **REQ-4.2**: Signature moves have cooldowns and trigger conditions
- **REQ-4.3**: Examples: "Double-peek" (peek, duck, peek), "Bait-and-switch" (fake retreat, turn)
- **REQ-4.4**: Signatures make bot feel like a character, not random AI

### REQ-5: Engagement Composer (Phrases)
- **REQ-5.1**: Compose tactical sequences (2-5 actions) instead of single decisions
- **REQ-5.2**: Phrase types: "Pressure phrase" (push, shoot, push), "Probe phrase" (peek, observe, decide)
- **REQ-5.3**: Phrases respect current aggression level and player state
- **REQ-5.4**: Smooth transitions between phrases (no jarring behavior changes)

### REQ-6: Mercy System (Dynamic Breather)
- **REQ-6.1**: Track "domination score" based on recent damage dealt vs taken
- **REQ-6.2**: When dominating (score > threshold), reduce aggression temporarily
- **REQ-6.3**: Give player "breathing room" to recover and re-engage
- **REQ-6.4**: Prevents frustrating steamrolls while maintaining challenge
- **REQ-6.5**: Configurable mercy threshold per difficulty level

### REQ-7: Tactics Library
- **REQ-7.1**: Define atomic tactical patterns with metadata
- **REQ-7.2**: Pattern types: STRAFE, PEEK, PUSH, RETREAT, HOLD, FLANK
- **REQ-7.3**: Each pattern has: duration, movement path, aim behavior, risk level
- **REQ-7.4**: Patterns tagged by: aggression_required, cover_required, health_threshold
- **REQ-7.5**: Support map-specific patterns (peek spots, flank routes)

### REQ-8: Aim System
- **REQ-8.1**: Human-like aim with configurable accuracy (not instant snap)
- **REQ-8.2**: Aim smoothing with reaction time delay (150-300ms based on difficulty)
- **REQ-8.3**: Tracking error that increases with target movement speed
- **REQ-8.4**: Occasional "flicks" and "whiffs" for realism
- **REQ-8.5**: Aim affected by bot's current state (worse when retreating/damaged)

### REQ-9: Spatial Awareness
- **REQ-9.1**: Know cover positions from CollisionManifest
- **REQ-9.2**: Calculate line-of-sight to player
- **REQ-9.3**: Evaluate position safety (exposed angles, escape routes)
- **REQ-9.4**: Pathfind to tactical positions (cover, high ground, flanks)

### REQ-10: Difficulty Scaling
- **REQ-10.1**: Easy: Low aggression, slow aim, generous mercy, predictable patterns
- **REQ-10.2**: Medium: Balanced aggression, moderate aim, standard mercy
- **REQ-10.3**: Hard: High aggression, fast aim, minimal mercy, uses signatures
- **REQ-10.4**: Adaptive: Adjusts difficulty based on player performance mid-match

### REQ-11: Bot Personalities
- **REQ-11.1**: "Rusher" - High base aggression, close-range preference, fast signatures
- **REQ-11.2**: "Sentinel" - Low aggression, holds angles, punishes mistakes
- **REQ-11.3**: "Duelist" - Balanced, reads player, counter-plays
- **REQ-11.4**: Personality affects: aggression curve params, tactics weights, signatures

## Non-Functional Requirements

### NFR-1: Performance
- Bot decision-making must complete in < 1ms per tick
- No allocations in hot path (object pooling)
- Support multiple bots simultaneously (future team modes)

### NFR-2: Determinism
- Given same inputs and seed, bot produces identical outputs
- Enables replay validation and debugging

### NFR-3: Extensibility
- Easy to add new tactics, signatures, and personalities
- Map-specific behavior hooks

## Success Criteria
- Bot feels "human-like" in playtests (not robotic or unfair)
- Players can learn bot patterns and counter-play
- Difficulty levels feel distinct and appropriate
- No exploitable AI loops or stuck states
