# Arena Combat Bot - Design Document

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      CombatConductor                            │
│  (Orchestrates all subsystems, outputs final bot decisions)     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Aggression   │  │ CombatFlow   │  │ SignatureMove        │  │
│  │ Curve        │  │ Analyzer     │  │ Tracker              │  │
│  │              │  │              │  │                      │  │
│  │ • Wave math  │  │ • Player     │  │ • Cooldowns          │  │
│  │ • Score mod  │  │   patterns   │  │ • Trigger conditions │  │
│  │ • Health mod │  │ • Counter-   │  │ • Execution state    │  │
│  │              │  │   play       │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Engagement   │  │ Mercy        │  │ Tactics              │  │
│  │ Composer     │  │ System       │  │ Library              │  │
│  │              │  │              │  │                      │  │
│  │ • Phrase     │  │ • Domination │  │ • STRAFE patterns    │  │
│  │   sequences  │  │   tracking   │  │ • PEEK patterns      │  │
│  │ • Transitions│  │ • Backoff    │  │ • PUSH/RETREAT       │  │
│  │              │  │   logic      │  │ • Map-specific       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ Aim          │  │ Spatial      │                            │
│  │ Controller   │  │ Awareness    │                            │
│  │              │  │              │                            │
│  │ • Smoothing  │  │ • Cover map  │                            │
│  │ • Reaction   │  │ • LOS checks │                            │
│  │ • Accuracy   │  │ • Pathfinding│                            │
│  └──────────────┘  └──────────────┘                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   BotOutput     │
                    │                 │
                    │ • moveVector    │
                    │ • aimTarget     │
                    │ • action        │
                    │ • state         │
                    └─────────────────┘
```

## File Structure

```
frontend/src/arena/bot/
├── CombatConductor.ts       # Main orchestrator
├── AggressionCurve.ts       # Wave-based aggression
├── CombatFlowAnalyzer.ts    # Player pattern detection
├── SignatureMoveTracker.ts  # Bot signature attacks
├── EngagementComposer.ts    # Tactical phrase composition
├── MercySystem.ts           # Dynamic difficulty adjustment
├── TacticsLibrary.ts        # Atomic tactical patterns
├── AimController.ts         # Human-like aiming
├── SpatialAwareness.ts      # Cover/LOS/pathfinding
├── BotPersonality.ts        # Personality configurations
├── types.ts                 # Shared interfaces
└── index.ts                 # Public exports
```

## Core Interfaces

### types.ts
```typescript
/**
 * Bot state machine states
 */
export type BotState = 'PATROL' | 'ENGAGE' | 'RETREAT' | 'REPOSITION' | 'EXECUTING_SIGNATURE';

/**
 * Input provided to bot each tick
 */
export interface BotInput {
  // Bot's current state
  botPosition: Vector3;
  botHealth: number;
  botMaxHealth: number;
  botAmmo: number;
  botMaxAmmo: number;
  
  // Player state (what bot can "see")
  playerPosition: Vector3;
  playerVelocity: Vector3;
  playerHealth: number;
  playerVisible: boolean;
  lastSeenPosition: Vector3 | null;
  lastSeenTime: number;
  
  // Match state
  botScore: number;
  playerScore: number;
  timeRemaining: number;
  matchDuration: number;
  
  // Environment
  coverPositions: CoverPosition[];
  mapBounds: AABB;
}

/**
 * Output from bot each tick
 */
export interface BotOutput {
  moveDirection: Vector3;      // Normalized movement vector
  moveSpeed: number;           // 0-1, multiplier on max speed
  aimTarget: Vector3;          // World position to aim at
  shouldShoot: boolean;
  shouldReload: boolean;
  shouldCrouch: boolean;
  currentState: BotState;
}

/**
 * Cover position with metadata
 */
export interface CoverPosition {
  position: Vector3;
  normal: Vector3;             // Direction cover faces
  height: 'full' | 'half';     // Full cover vs crouch cover
  quality: number;             // 0-1, how good is this cover
}

/**
 * Tactical pattern definition
 */
export interface TacticalPattern {
  id: string;
  type: 'STRAFE' | 'PEEK' | 'PUSH' | 'RETREAT' | 'HOLD' | 'FLANK';
  duration: number;            // Base duration in ms
  
  // Requirements
  minAggression: number;       // 0-1
  maxAggression: number;       // 0-1
  requiresCover: boolean;
  minHealth: number;           // 0-1 ratio
  
  // Behavior
  movementPath: 'linear' | 'arc' | 'zigzag' | 'none';
  aimBehavior: 'track' | 'predictive' | 'sweep' | 'hold';
  shootBehavior: 'continuous' | 'burst' | 'tap' | 'none';
  
  // Risk/reward
  riskLevel: number;           // 0-1
  exposureTime: number;        // How long bot is exposed
}

/**
 * Signature move (motif equivalent)
 */
export interface SignatureMove {
  id: string;
  name: string;
  patterns: string[];          // Sequence of pattern IDs
  cooldown: number;            // ms between uses
  
  // Trigger conditions
  triggerAggression: [number, number];  // [min, max] range
  triggerHealthRatio: [number, number];
  triggerScoreDiff: [number, number];   // Bot score - player score
  
  // Personality association
  personalities: BotPersonalityType[];
}

/**
 * Engagement phrase (composed sequence)
 */
export interface EngagementPhrase {
  id: string;
  type: 'pressure' | 'probe' | 'punish' | 'reset';
  patterns: TacticalPattern[];
  totalDuration: number;
}

/**
 * Bot personality types
 */
export type BotPersonalityType = 'rusher' | 'sentinel' | 'duelist';

/**
 * Personality configuration
 */
export interface BotPersonalityConfig {
  type: BotPersonalityType;
  displayName: string;
  
  // Aggression curve modifiers
  baseAggression: number;
  aggressionVolatility: number;  // How much it swings
  
  // Tactic weights (multipliers)
  tacticWeights: Record<TacticalPattern['type'], number>;
  
  // Aim characteristics
  reactionTimeMs: number;
  accuracyBase: number;
  trackingSkill: number;
  
  // Signature moves available
  signatures: string[];
  
  // Mercy system
  mercyThreshold: number;
  mercyDuration: number;
}

/**
 * Difficulty preset
 */
export interface DifficultyPreset {
  name: 'easy' | 'medium' | 'hard' | 'adaptive';
  
  // Aggression
  aggressionMultiplier: number;
  
  // Aim
  reactionTimeMultiplier: number;
  accuracyMultiplier: number;
  
  // Mercy
  mercyEnabled: boolean;
  mercyThresholdMultiplier: number;
  
  // Patterns
  useSignatures: boolean;
  patternComplexity: number;  // 0-1, filters available patterns
}
```

## Component Designs

### AggressionCurve.ts
```typescript
/**
 * Wave-based aggression system
 * Adapted from TensionCurve for combat context
 */

export interface AggressionState {
  current: number;              // 0-1
  trend: 'rising' | 'falling' | 'peak' | 'valley';
  inPushPhase: boolean;         // High aggression period
  inRetreatPhase: boolean;      // Low aggression period
}

export interface AggressionModifiers {
  scoreDiff: number;            // Bot score - player score
  healthRatio: number;          // Bot health / max
  timeRatio: number;            // Time elapsed / total
  recentDamageDealt: number;
  recentDamageTaken: number;
}

export class AggressionCurve {
  private config: AggressionConfig;
  private history: number[] = [];
  
  constructor(personality: BotPersonalityConfig) {
    this.config = this.buildConfig(personality);
  }
  
  /**
   * Calculate aggression at current match time
   */
  calculate(matchTimeMs: number, modifiers: AggressionModifiers): number {
    // Base wave (primary cycle ~30s)
    const primaryWave = Math.sin(matchTimeMs * 0.0002) * 0.25;
    
    // Secondary wave (micro variations ~10s)
    const secondaryWave = Math.sin(matchTimeMs * 0.0006 + 1.5) * 0.12;
    
    // Base from personality
    let aggression = this.config.baseAggression + primaryWave + secondaryWave;
    
    // Score modifier: winning = more aggressive, losing = more cautious
    const scoreModifier = Math.tanh(modifiers.scoreDiff * 0.1) * 0.15;
    aggression += scoreModifier;
    
    // Health modifier: low health = less aggressive
    const healthModifier = (modifiers.healthRatio - 0.5) * 0.2;
    aggression += healthModifier;
    
    // Time pressure: end of match = more aggressive if losing
    if (modifiers.timeRatio > 0.7 && modifiers.scoreDiff < 0) {
      aggression += (modifiers.timeRatio - 0.7) * 0.5;
    }
    
    // Clamp and return
    return Math.max(0.1, Math.min(0.95, aggression));
  }
  
  getState(matchTimeMs: number, modifiers: AggressionModifiers): AggressionState {
    const current = this.calculate(matchTimeMs, modifiers);
    this.updateHistory(current);
    
    return {
      current,
      trend: this.detectTrend(),
      inPushPhase: current > 0.65,
      inRetreatPhase: current < 0.35,
    };
  }
}
```

### MercySystem.ts
```typescript
/**
 * Prevents steamrolling by backing off when dominating
 * Adapted from DynamicBreather
 */

export interface DominationMetrics {
  recentDamageDealt: number;
  recentDamageTaken: number;
  killsWithoutDying: number;
  consecutiveHits: number;
  playerMissedShots: number;
}

export interface MercyState {
  isActive: boolean;
  dominationScore: number;      // 0-1, how much bot is dominating
  mercyLevel: number;           // 0-1, how much to back off
  remainingDuration: number;    // ms until mercy ends
}

export class MercySystem {
  private metrics: DominationMetrics;
  private mercyActive: boolean = false;
  private mercyStartTime: number = 0;
  private config: MercyConfig;
  
  constructor(difficulty: DifficultyPreset, personality: BotPersonalityConfig) {
    this.config = {
      enabled: difficulty.mercyEnabled,
      threshold: personality.mercyThreshold * difficulty.mercyThresholdMultiplier,
      duration: personality.mercyDuration,
      aggressionReduction: 0.4,
    };
  }
  
  /**
   * Update with recent combat results
   */
  recordCombatEvent(event: CombatEvent): void {
    switch (event.type) {
      case 'bot_hit_player':
        this.metrics.recentDamageDealt += event.damage;
        this.metrics.consecutiveHits++;
        break;
      case 'player_hit_bot':
        this.metrics.recentDamageTaken += event.damage;
        this.metrics.consecutiveHits = 0;
        break;
      case 'player_missed':
        this.metrics.playerMissedShots++;
        break;
      case 'bot_killed_player':
        this.metrics.killsWithoutDying++;
        break;
      case 'player_killed_bot':
        this.metrics.killsWithoutDying = 0;
        this.resetMetrics();
        break;
    }
  }
  
  /**
   * Check if mercy should activate
   */
  shouldActivateMercy(): MercyState {
    if (!this.config.enabled) {
      return { isActive: false, dominationScore: 0, mercyLevel: 0, remainingDuration: 0 };
    }
    
    const dominationScore = this.calculateDominationScore();
    
    if (!this.mercyActive && dominationScore > this.config.threshold) {
      this.mercyActive = true;
      this.mercyStartTime = Date.now();
    }
    
    if (this.mercyActive) {
      const elapsed = Date.now() - this.mercyStartTime;
      if (elapsed > this.config.duration) {
        this.mercyActive = false;
        this.decayMetrics();
      }
    }
    
    return {
      isActive: this.mercyActive,
      dominationScore,
      mercyLevel: this.mercyActive ? this.config.aggressionReduction : 0,
      remainingDuration: this.mercyActive 
        ? Math.max(0, this.config.duration - (Date.now() - this.mercyStartTime))
        : 0,
    };
  }
  
  /**
   * Get aggression multiplier (< 1 when mercy active)
   */
  getAggressionMultiplier(): number {
    if (!this.mercyActive) return 1.0;
    return 1.0 - this.config.aggressionReduction;
  }
  
  private calculateDominationScore(): number {
    const damageRatio = this.metrics.recentDamageDealt / 
      Math.max(1, this.metrics.recentDamageDealt + this.metrics.recentDamageTaken);
    
    const hitStreak = Math.min(1, this.metrics.consecutiveHits / 5);
    const killStreak = Math.min(1, this.metrics.killsWithoutDying / 3);
    
    return (damageRatio * 0.4) + (hitStreak * 0.3) + (killStreak * 0.3);
  }
}
```

### AimController.ts
```typescript
/**
 * Human-like aiming with reaction time and accuracy variance
 */

export interface AimState {
  currentAim: Vector3;          // Where bot is currently aiming
  targetAim: Vector3;           // Where bot wants to aim
  isOnTarget: boolean;          // Within accuracy threshold
  reactionRemaining: number;    // ms until bot reacts to new position
}

export class AimController {
  private currentAim: Vector3 = new Vector3();
  private targetAim: Vector3 = new Vector3();
  private lastPlayerPosition: Vector3 = new Vector3();
  private reactionTimer: number = 0;
  private config: AimConfig;
  
  constructor(personality: BotPersonalityConfig, difficulty: DifficultyPreset) {
    this.config = {
      reactionTimeMs: personality.reactionTimeMs * difficulty.reactionTimeMultiplier,
      baseAccuracy: personality.accuracyBase * difficulty.accuracyMultiplier,
      trackingSkill: personality.trackingSkill,
      smoothingFactor: 0.15,     // How fast aim moves toward target
      jitterAmount: 0.02,        // Random aim wobble
    };
  }
  
  /**
   * Update aim each tick
   */
  update(deltaMs: number, playerPosition: Vector3, playerVelocity: Vector3, botState: BotState): AimState {
    // Check if player moved significantly (triggers reaction delay)
    const playerMoved = this.lastPlayerPosition.distanceTo(playerPosition) > 0.5;
    if (playerMoved) {
      this.reactionTimer = this.config.reactionTimeMs;
      this.lastPlayerPosition.copy(playerPosition);
    }
    
    // Tick down reaction timer
    this.reactionTimer = Math.max(0, this.reactionTimer - deltaMs);
    
    // Calculate target aim position
    if (this.reactionTimer <= 0) {
      // Predictive aiming based on tracking skill
      const predictionTime = 0.1 * this.config.trackingSkill;
      this.targetAim.copy(playerPosition)
        .add(playerVelocity.clone().multiplyScalar(predictionTime));
      
      // Add accuracy error
      const errorMagnitude = (1 - this.config.baseAccuracy) * 0.5;
      this.targetAim.x += (Math.random() - 0.5) * errorMagnitude;
      this.targetAim.y += (Math.random() - 0.5) * errorMagnitude * 0.5;
      this.targetAim.z += (Math.random() - 0.5) * errorMagnitude;
    }
    
    // Smooth aim movement (not instant snap)
    let smoothing = this.config.smoothingFactor;
    
    // Worse aim when retreating or damaged
    if (botState === 'RETREAT') smoothing *= 0.7;
    
    this.currentAim.lerp(this.targetAim, smoothing);
    
    // Add micro-jitter for realism
    this.currentAim.x += (Math.random() - 0.5) * this.config.jitterAmount;
    this.currentAim.y += (Math.random() - 0.5) * this.config.jitterAmount;
    
    const isOnTarget = this.currentAim.distanceTo(playerPosition) < 0.3;
    
    return {
      currentAim: this.currentAim.clone(),
      targetAim: this.targetAim.clone(),
      isOnTarget,
      reactionRemaining: this.reactionTimer,
    };
  }
  
  /**
   * Simulate a "flick" shot (quick snap to target)
   */
  flick(target: Vector3): void {
    this.currentAim.copy(target);
    // Add flick error
    const flickError = 0.1;
    this.currentAim.x += (Math.random() - 0.5) * flickError;
    this.currentAim.y += (Math.random() - 0.5) * flickError;
  }
}
```

### CombatConductor.ts (Main Orchestrator)
```typescript
/**
 * Main bot orchestrator - conducts all subsystems
 * Equivalent to SymphonyConductor for survival runner
 */

export class CombatConductor {
  // Subsystems
  private aggressionCurve: AggressionCurve;
  private flowAnalyzer: CombatFlowAnalyzer;
  private signatureTracker: SignatureMoveTracker;
  private engagementComposer: EngagementComposer;
  private mercySystem: MercySystem;
  private tacticsLibrary: TacticsLibrary;
  private aimController: AimController;
  private spatialAwareness: SpatialAwareness;
  
  // State
  private currentState: BotState = 'PATROL';
  private currentPhrase: EngagementPhrase | null = null;
  private phraseProgress: number = 0;
  private currentPattern: TacticalPattern | null = null;
  private patternStartTime: number = 0;
  
  // Config
  private personality: BotPersonalityConfig;
  private difficulty: DifficultyPreset;
  
  constructor(personality: BotPersonalityConfig, difficulty: DifficultyPreset) {
    this.personality = personality;
    this.difficulty = difficulty;
    
    // Initialize subsystems
    this.aggressionCurve = new AggressionCurve(personality);
    this.flowAnalyzer = new CombatFlowAnalyzer();
    this.signatureTracker = new SignatureMoveTracker(personality, difficulty);
    this.engagementComposer = new EngagementComposer(this.tacticsLibrary, this.flowAnalyzer);
    this.mercySystem = new MercySystem(difficulty, personality);
    this.tacticsLibrary = new TacticsLibrary();
    this.aimController = new AimController(personality, difficulty);
    this.spatialAwareness = new SpatialAwareness();
  }
  
  /**
   * Main update - called every game tick
   */
  conduct(input: BotInput, deltaMs: number): BotOutput {
    const matchTimeMs = (input.matchDuration - input.timeRemaining) * 1000;
    
    // 1. Calculate current aggression
    const aggressionMods: AggressionModifiers = {
      scoreDiff: input.botScore - input.playerScore,
      healthRatio: input.botHealth / input.botMaxHealth,
      timeRatio: 1 - (input.timeRemaining / input.matchDuration),
      recentDamageDealt: this.mercySystem.getRecentDamageDealt(),
      recentDamageTaken: this.mercySystem.getRecentDamageTaken(),
    };
    const aggression = this.aggressionCurve.getState(matchTimeMs, aggressionMods);
    
    // 2. Check mercy system
    const mercy = this.mercySystem.shouldActivateMercy();
    const effectiveAggression = aggression.current * this.mercySystem.getAggressionMultiplier();
    
    // 3. Update state machine
    this.updateState(input, effectiveAggression);
    
    // 4. Select/continue tactical pattern
    const pattern = this.selectPattern(input, effectiveAggression, matchTimeMs);
    
    // 5. Execute pattern to get movement
    const movement = this.executePattern(pattern, input, deltaMs);
    
    // 6. Update aim
    const aim = this.aimController.update(
      deltaMs, 
      input.playerPosition, 
      input.playerVelocity,
      this.currentState
    );
    
    // 7. Decide shooting
    const shouldShoot = this.shouldShoot(input, aim, pattern);
    
    return {
      moveDirection: movement.direction,
      moveSpeed: movement.speed,
      aimTarget: aim.currentAim,
      shouldShoot,
      shouldReload: input.botAmmo === 0,
      shouldCrouch: pattern?.type === 'PEEK' || this.currentState === 'RETREAT',
      currentState: this.currentState,
    };
  }
  
  private updateState(input: BotInput, aggression: number): void {
    const healthRatio = input.botHealth / input.botMaxHealth;
    
    // State transitions
    switch (this.currentState) {
      case 'PATROL':
        if (input.playerVisible) {
          this.currentState = 'ENGAGE';
        }
        break;
        
      case 'ENGAGE':
        if (!input.playerVisible && Date.now() - input.lastSeenTime > 3000) {
          this.currentState = 'PATROL';
        } else if (healthRatio < 0.3 && aggression < 0.5) {
          this.currentState = 'RETREAT';
        }
        break;
        
      case 'RETREAT':
        if (healthRatio > 0.5 || aggression > 0.7) {
          this.currentState = 'REPOSITION';
        }
        break;
        
      case 'REPOSITION':
        if (input.playerVisible) {
          this.currentState = 'ENGAGE';
        }
        break;
    }
  }
  
  private selectPattern(input: BotInput, aggression: number, matchTimeMs: number): TacticalPattern {
    // Priority 1: Continue current signature move
    if (this.signatureTracker.isExecuting()) {
      return this.signatureTracker.getCurrentPattern();
    }
    
    // Priority 2: Check for signature trigger
    if (this.difficulty.useSignatures) {
      const signature = this.signatureTracker.checkTrigger(input, aggression);
      if (signature) {
        this.signatureTracker.startSignature(signature);
        return this.signatureTracker.getCurrentPattern();
      }
    }
    
    // Priority 3: Continue current phrase
    if (this.currentPhrase && this.phraseProgress < this.currentPhrase.patterns.length) {
      return this.currentPhrase.patterns[this.phraseProgress];
    }
    
    // Priority 4: Compose new phrase
    const phrase = this.engagementComposer.compose(
      this.currentState,
      aggression,
      input
    );
    
    if (phrase) {
      this.currentPhrase = phrase;
      this.phraseProgress = 0;
      return phrase.patterns[0];
    }
    
    // Fallback: Single pattern
    return this.tacticsLibrary.selectPattern(this.currentState, aggression);
  }
  
  /**
   * Record combat event for subsystems
   */
  recordEvent(event: CombatEvent): void {
    this.mercySystem.recordCombatEvent(event);
    this.flowAnalyzer.recordEvent(event);
    this.signatureTracker.recordResult(event);
  }
}
```

## Bot Personality Presets

```typescript
// BotPersonality.ts

export const BOT_PERSONALITIES: Record<BotPersonalityType, BotPersonalityConfig> = {
  rusher: {
    type: 'rusher',
    displayName: 'Blitz',
    baseAggression: 0.7,
    aggressionVolatility: 0.3,
    tacticWeights: {
      STRAFE: 1.2,
      PEEK: 0.6,
      PUSH: 1.5,
      RETREAT: 0.5,
      HOLD: 0.3,
      FLANK: 1.3,
    },
    reactionTimeMs: 200,
    accuracyBase: 0.7,
    trackingSkill: 0.8,
    signatures: ['double-push', 'bait-and-rush', 'corner-slide'],
    mercyThreshold: 0.8,
    mercyDuration: 3000,
  },
  
  sentinel: {
    type: 'sentinel',
    displayName: 'Warden',
    baseAggression: 0.35,
    aggressionVolatility: 0.15,
    tacticWeights: {
      STRAFE: 0.8,
      PEEK: 1.4,
      PUSH: 0.4,
      RETREAT: 1.2,
      HOLD: 1.6,
      FLANK: 0.5,
    },
    reactionTimeMs: 180,
    accuracyBase: 0.85,
    trackingSkill: 0.6,
    signatures: ['angle-hold', 'bait-peek', 'punish-push'],
    mercyThreshold: 0.7,
    mercyDuration: 4000,
  },
  
  duelist: {
    type: 'duelist',
    displayName: 'Echo',
    baseAggression: 0.5,
    aggressionVolatility: 0.25,
    tacticWeights: {
      STRAFE: 1.0,
      PEEK: 1.0,
      PUSH: 1.0,
      RETREAT: 1.0,
      HOLD: 1.0,
      FLANK: 1.0,
    },
    reactionTimeMs: 220,
    accuracyBase: 0.75,
    trackingSkill: 0.75,
    signatures: ['mirror-play', 'counter-push', 'read-and-punish'],
    mercyThreshold: 0.75,
    mercyDuration: 3500,
  },
};
```

## Integration Points

### With Existing Arena Systems
- **Physics3D**: Bot movement goes through same physics as player
- **CollisionWorld**: Bot uses collision data for cover positions
- **CombatSystem**: Bot damage/hits processed same as player
- **SpawnManifest**: Bot spawns at designated spawn points

### Events Emitted
```typescript
interface CombatBotEvents {
  onStateChange: (from: BotState, to: BotState) => void;
  onSignatureStart: (signature: SignatureMove) => void;
  onSignatureComplete: (signature: SignatureMove, success: boolean) => void;
  onMercyActivate: (dominationScore: number) => void;
  onMercyDeactivate: () => void;
  onPhraseStart: (phrase: EngagementPhrase) => void;
  onPhraseComplete: (phrase: EngagementPhrase) => void;
}
```

## Testing Strategy
1. Unit tests for each subsystem (AggressionCurve, MercySystem, etc.)
2. Integration tests for CombatConductor decision-making
3. Determinism tests (same seed = same behavior)
4. Performance benchmarks (< 1ms per tick)
5. Playtest sessions for "feel" validation
