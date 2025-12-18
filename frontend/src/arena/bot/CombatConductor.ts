/**
 * CombatConductor - Main bot orchestrator
 * 
 * Coordinates all subsystems to produce coherent bot behavior.
 * Manages state machine, pattern selection, and output generation.
 */

import { Vector3 } from 'three';
import type {
  AggressionModifiers,
  BotInput,
  BotOutput,
  BotPersonalityConfig,
  BotState,
  CombatBotEvents,
  CombatEvent,
  DifficultyPreset,
  EngagementPhrase,
  TacticalPattern,
} from './types';
import { AggressionCurve } from './AggressionCurve';
import { MercySystem } from './MercySystem';
import { TacticsLibrary } from './TacticsLibrary';
import { CombatFlowAnalyzer } from './CombatFlowAnalyzer';
import { SignatureMoveTracker } from './SignatureMoveTracker';
import { EngagementComposer } from './EngagementComposer';
import { AimController } from './AimController';
import { SpatialAwareness } from './SpatialAwareness';

/**
 * Pattern execution state
 */
interface PatternExecution {
  pattern: TacticalPattern;
  startTime: number;
  progress: number; // 0-1
}

/**
 * Event listener type
 */
type EventListener<K extends keyof CombatBotEvents> = CombatBotEvents[K];

export class CombatConductor {
  // Subsystems
  private aggressionCurve: AggressionCurve;
  private mercySystem: MercySystem;
  private tacticsLibrary: TacticsLibrary;
  private flowAnalyzer: CombatFlowAnalyzer;
  private signatureTracker: SignatureMoveTracker;
  private engagementComposer: EngagementComposer;
  private aimController: AimController;
  private spatialAwareness: SpatialAwareness;

  // State
  private currentState: BotState = 'PATROL';
  private previousState: BotState = 'PATROL';
  private currentPhrase: EngagementPhrase | null = null;
  private phrasePatternIndex: number = 0;
  private currentExecution: PatternExecution | null = null;
  private lastUpdateTime: number = 0;
  private matchStartTime: number = 0;

  // Config
  private personality: BotPersonalityConfig;
  private difficulty: DifficultyPreset;

  // Events
  private eventListeners: Partial<Record<keyof CombatBotEvents, Function[]>> = {};

  constructor(personality: BotPersonalityConfig, difficulty: DifficultyPreset) {
    this.personality = personality;
    this.difficulty = difficulty;

    // Initialize subsystems
    this.aggressionCurve = new AggressionCurve(personality);
    this.mercySystem = new MercySystem(difficulty, personality);
    this.tacticsLibrary = new TacticsLibrary();
    this.flowAnalyzer = new CombatFlowAnalyzer();
    this.signatureTracker = new SignatureMoveTracker(personality, difficulty, this.tacticsLibrary);
    this.engagementComposer = new EngagementComposer(this.tacticsLibrary, this.flowAnalyzer);
    this.aimController = new AimController(personality, difficulty);
    this.spatialAwareness = new SpatialAwareness();

    this.matchStartTime = Date.now();
    this.lastUpdateTime = Date.now();
  }

  /**
   * Main update - called every game tick
   */
  conduct(input: BotInput, deltaMs: number): BotOutput {
    const now = Date.now();
    const matchTimeMs = now - this.matchStartTime;

    // Initialize spatial awareness with input data
    this.spatialAwareness.setCoverPositions(input.coverPositions);

    // 1. Calculate current aggression
    const aggressionMods: AggressionModifiers = {
      scoreDiff: input.botScore - input.playerScore,
      healthRatio: input.botHealth / input.botMaxHealth,
      timeRatio: 1 - (input.timeRemaining / input.matchDuration),
      recentDamageDealt: this.mercySystem.getRecentDamageDealt(),
      recentDamageTaken: this.mercySystem.getRecentDamageTaken(),
    };
    const aggressionState = this.aggressionCurve.getState(matchTimeMs, aggressionMods);

    // 2. Check mercy system
    this.mercySystem.update(now);
    const mercyMultiplier = this.mercySystem.getAggressionMultiplier();
    const effectiveAggression = aggressionState.current * mercyMultiplier;

    // 3. Update state machine
    this.updateState(input, effectiveAggression);

    // 4. Check for cover
    const hasCover = this.spatialAwareness.isInCover(input.botPosition, input.playerPosition);

    // 5. Select/continue tactical pattern
    const pattern = this.selectPattern(input, effectiveAggression, matchTimeMs, hasCover);

    // 6. Execute pattern to get movement
    const movement = this.executePattern(pattern, input, deltaMs, now);

    // 7. Update aim
    const aimState = this.aimController.update(
      deltaMs,
      input.playerPosition,
      input.playerVelocity,
      this.currentState
    );

    // 8. Decide shooting
    const shouldShoot = this.shouldShoot(input, aimState.isOnTarget, pattern);

    // 9. Build output
    const output: BotOutput = {
      moveDirection: movement.direction,
      moveSpeed: movement.speed,
      aimTarget: aimState.currentAim,
      shouldShoot,
      shouldReload: input.botAmmo === 0,
      shouldCrouch: this.shouldCrouch(pattern, this.currentState),
      currentState: this.currentState,
    };

    this.lastUpdateTime = now;
    return output;
  }

  /**
   * Update state machine
   */
  private updateState(input: BotInput, aggression: number): void {
    const healthRatio = input.botHealth / input.botMaxHealth;
    const timeSinceLastSeen = Date.now() - input.lastSeenTime;

    this.previousState = this.currentState;

    // State transitions
    switch (this.currentState) {
      case 'PATROL':
        if (input.playerVisible) {
          this.currentState = 'ENGAGE';
        }
        break;

      case 'ENGAGE':
        if (!input.playerVisible && timeSinceLastSeen > 3000) {
          this.currentState = 'PATROL';
        } else if (healthRatio < 0.3 && aggression < 0.5) {
          this.currentState = 'RETREAT';
        }
        break;

      case 'RETREAT':
        if (healthRatio > 0.5 || aggression > 0.7) {
          this.currentState = 'REPOSITION';
        } else if (!input.playerVisible && timeSinceLastSeen > 2000) {
          this.currentState = 'PATROL';
        }
        break;

      case 'REPOSITION':
        if (input.playerVisible && healthRatio > 0.4) {
          this.currentState = 'ENGAGE';
        } else if (!input.playerVisible && timeSinceLastSeen > 3000) {
          this.currentState = 'PATROL';
        }
        break;

      case 'EXECUTING_SIGNATURE':
        // Signature tracker controls exit from this state
        if (!this.signatureTracker.isExecuting()) {
          this.currentState = input.playerVisible ? 'ENGAGE' : 'PATROL';
        }
        break;
    }

    // Emit state change event
    if (this.currentState !== this.previousState) {
      this.emit('onStateChange', this.previousState, this.currentState);
    }
  }

  /**
   * Select tactical pattern
   */
  private selectPattern(
    input: BotInput,
    aggression: number,
    matchTimeMs: number,
    hasCover: boolean
  ): TacticalPattern {
    const healthRatio = input.botHealth / input.botMaxHealth;

    // Priority 1: Continue current signature move
    if (this.signatureTracker.isExecuting()) {
      const sigPattern = this.signatureTracker.getCurrentPattern();
      if (sigPattern) {
        return sigPattern;
      }
    }

    // Priority 2: Check for signature trigger
    if (this.difficulty.useSignatures && this.currentState === 'ENGAGE') {
      const signature = this.signatureTracker.checkTrigger(input, aggression);
      if (signature) {
        this.signatureTracker.startSignature(signature);
        this.currentState = 'EXECUTING_SIGNATURE';
        this.emit('onSignatureStart', signature);
        const sigPattern = this.signatureTracker.getCurrentPattern();
        if (sigPattern) {
          return sigPattern;
        }
      }
    }

    // Priority 3: Continue current phrase
    if (this.currentPhrase && this.phrasePatternIndex < this.currentPhrase.patterns.length) {
      // Check if current pattern is done
      if (this.currentExecution) {
        const elapsed = Date.now() - this.currentExecution.startTime;
        if (elapsed >= this.currentExecution.pattern.duration) {
          this.phrasePatternIndex++;
          this.currentExecution = null;

          // Check if phrase is complete
          if (this.phrasePatternIndex >= this.currentPhrase.patterns.length) {
            this.emit('onPhraseComplete', this.currentPhrase);
            this.currentPhrase = null;
            this.phrasePatternIndex = 0;
          }
        }
      }

      // Return current phrase pattern if still active
      if (this.currentPhrase && this.phrasePatternIndex < this.currentPhrase.patterns.length) {
        return this.currentPhrase.patterns[this.phrasePatternIndex];
      }
    }

    // Priority 4: Compose new phrase
    const phrase = this.engagementComposer.compose(
      this.currentState,
      aggression,
      input,
      hasCover
    );

    if (phrase) {
      this.currentPhrase = phrase;
      this.phrasePatternIndex = 0;
      this.emit('onPhraseStart', phrase);
      return phrase.patterns[0];
    }

    // Fallback: Single pattern from library
    return this.tacticsLibrary.selectPattern(
      this.currentState,
      aggression,
      healthRatio,
      hasCover,
      this.personality.tacticWeights
    );
  }

  /**
   * Execute pattern to get movement
   */
  private executePattern(
    pattern: TacticalPattern,
    input: BotInput,
    deltaMs: number,
    now: number
  ): { direction: Vector3; speed: number } {
    // Start new execution if needed
    if (!this.currentExecution || this.currentExecution.pattern.id !== pattern.id) {
      this.currentExecution = {
        pattern,
        startTime: now,
        progress: 0,
      };
    }

    // Update progress
    const elapsed = now - this.currentExecution.startTime;
    this.currentExecution.progress = Math.min(1, elapsed / pattern.duration);

    // Calculate movement based on pattern type
    const direction = new Vector3();
    let speed = 0.8;

    const toPlayer = new Vector3()
      .subVectors(input.playerPosition, input.botPosition)
      .normalize();

    const rightOfPlayer = new Vector3(-toPlayer.z, 0, toPlayer.x);

    switch (pattern.type) {
      case 'STRAFE':
        // Move perpendicular to player
        if (pattern.id.includes('left')) {
          direction.copy(rightOfPlayer).negate();
        } else if (pattern.id.includes('right')) {
          direction.copy(rightOfPlayer);
        } else {
          // Random strafe - alternate
          const phase = Math.sin(elapsed * 0.005);
          direction.copy(rightOfPlayer).multiplyScalar(phase);
        }
        speed = 0.9;
        break;

      case 'PEEK':
        // Quick exposure from cover
        if (this.currentExecution.progress < 0.3) {
          direction.copy(toPlayer).multiplyScalar(0.5);
        } else if (this.currentExecution.progress > 0.7) {
          direction.copy(toPlayer).negate().multiplyScalar(0.5);
        }
        speed = 0.7;
        break;

      case 'PUSH':
        // Move toward player
        direction.copy(toPlayer);
        if (pattern.id.includes('angled')) {
          direction.add(rightOfPlayer.multiplyScalar(0.3));
          direction.normalize();
        }
        speed = 1.0;
        break;

      case 'RETREAT':
        // Move away from player
        direction.copy(toPlayer).negate();
        if (pattern.id.includes('diagonal')) {
          direction.add(rightOfPlayer.multiplyScalar(0.4));
          direction.normalize();
        }
        speed = 0.85;
        break;

      case 'HOLD':
        // Stay in place
        direction.set(0, 0, 0);
        speed = 0;
        break;

      case 'FLANK':
        // Move to side
        const flankTarget = this.spatialAwareness.findFlankPosition(
          input.botPosition,
          input.playerPosition,
          pattern.id.includes('left')
        );
        direction.subVectors(flankTarget, input.botPosition).normalize();
        speed = 0.9;
        break;
    }

    // Apply movement path modifiers
    if (pattern.movementPath === 'zigzag') {
      const zigzag = Math.sin(elapsed * 0.01) * 0.3;
      direction.add(rightOfPlayer.clone().multiplyScalar(zigzag));
      direction.normalize();
    } else if (pattern.movementPath === 'arc') {
      const arc = Math.sin(this.currentExecution.progress * Math.PI) * 0.2;
      direction.add(rightOfPlayer.clone().multiplyScalar(arc));
      direction.normalize();
    }

    return { direction, speed };
  }

  /**
   * Decide if bot should shoot
   */
  private shouldShoot(
    input: BotInput,
    isOnTarget: boolean,
    pattern: TacticalPattern
  ): boolean {
    // Can't shoot without ammo
    if (input.botAmmo <= 0) return false;

    // Can't shoot what we can't see
    if (!input.playerVisible) return false;

    // Pattern controls shooting
    if (pattern.shootBehavior === 'none') return false;

    // Must be on target for tap/burst
    if (pattern.shootBehavior === 'tap' || pattern.shootBehavior === 'burst') {
      if (!isOnTarget) return false;
    }

    // Continuous shooting when visible and roughly aimed
    if (pattern.shootBehavior === 'continuous') {
      return true;
    }

    // Burst: shoot in bursts
    if (pattern.shootBehavior === 'burst') {
      const burstPhase = (Date.now() % 500) < 200;
      return burstPhase;
    }

    // Tap: single shots
    if (pattern.shootBehavior === 'tap') {
      const tapPhase = (Date.now() % 800) < 100;
      return tapPhase;
    }

    return isOnTarget;
  }

  /**
   * Decide if bot should crouch
   */
  private shouldCrouch(pattern: TacticalPattern, state: BotState): boolean {
    if (pattern.type === 'PEEK' && pattern.id.includes('crouch')) return true;
    if (pattern.type === 'HOLD') return true;
    if (state === 'RETREAT') return false; // Don't crouch while retreating
    return false;
  }

  /**
   * Record combat event
   */
  recordEvent(event: CombatEvent): void {
    this.mercySystem.recordCombatEvent(event);
    this.flowAnalyzer.recordEvent(event);
    this.signatureTracker.recordResult(event);

    // Check for mercy activation
    const mercyState = this.mercySystem.update();
    if (mercyState.isActive && !this.mercySystem.isMercyActive()) {
      this.emit('onMercyActivate', mercyState.dominationScore);
    }
  }

  /**
   * Add event listener
   */
  on<K extends keyof CombatBotEvents>(event: K, listener: EventListener<K>): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event]!.push(listener as Function);
  }

  /**
   * Remove event listener
   */
  off<K extends keyof CombatBotEvents>(event: K, listener: EventListener<K>): void {
    const listeners = this.eventListeners[event];
    if (listeners) {
      const index = listeners.indexOf(listener as Function);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emit<K extends keyof CombatBotEvents>(
    event: K,
    ...args: Parameters<CombatBotEvents[K]>
  ): void {
    const listeners = this.eventListeners[event];
    if (listeners) {
      for (const listener of listeners) {
        listener(...args);
      }
    }
  }

  /**
   * Get current state
   */
  getState(): BotState {
    return this.currentState;
  }

  /**
   * Get personality
   */
  getPersonality(): BotPersonalityConfig {
    return this.personality;
  }

  /**
   * Get difficulty
   */
  getDifficulty(): DifficultyPreset {
    return this.difficulty;
  }

  /**
   * Reset bot state (e.g., on respawn)
   */
  reset(): void {
    this.currentState = 'PATROL';
    this.previousState = 'PATROL';
    this.currentPhrase = null;
    this.phrasePatternIndex = 0;
    this.currentExecution = null;

    this.aggressionCurve.reset();
    this.mercySystem.reset();
    this.tacticsLibrary.reset();
    this.flowAnalyzer.reset();
    this.signatureTracker.reset();
    this.engagementComposer.reset();
    this.aimController.reset();
    this.spatialAwareness.reset();
  }
}
