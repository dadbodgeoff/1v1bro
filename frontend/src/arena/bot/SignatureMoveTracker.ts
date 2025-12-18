/**
 * SignatureMoveTracker - Manages bot signature moves (special combos)
 * 
 * Tracks cooldowns, checks trigger conditions, and manages execution
 * state for signature moves.
 */

import type {
  BotInput,
  BotPersonalityConfig,
  CombatEvent,
  DifficultyPreset,
  SignatureMove,
  TacticalPattern,
} from './types';
import { TacticsLibrary } from './TacticsLibrary';

/**
 * Execution state for signature moves
 */
type SignatureState = 'idle' | 'executing' | 'cooldown';

/**
 * Signature move definitions
 */
const SIGNATURE_MOVES: SignatureMove[] = [
  // Rusher signatures
  {
    id: 'double-push',
    name: 'Double Push',
    patterns: ['push-direct', 'strafe-random', 'push-angled'],
    cooldown: 15000,
    triggerAggression: [0.6, 1.0],
    triggerHealthRatio: [0.4, 1.0],
    triggerScoreDiff: [-2, 5],
    personalities: ['rusher'],
  },
  {
    id: 'bait-and-rush',
    name: 'Bait and Rush',
    patterns: ['retreat-back', 'peek-quick', 'push-direct'],
    cooldown: 12000,
    triggerAggression: [0.5, 0.9],
    triggerHealthRatio: [0.5, 1.0],
    triggerScoreDiff: [-1, 3],
    personalities: ['rusher'],
  },
  {
    id: 'corner-slide',
    name: 'Corner Slide',
    patterns: ['strafe-left', 'push-angled', 'strafe-right'],
    cooldown: 10000,
    triggerAggression: [0.55, 0.95],
    triggerHealthRatio: [0.35, 1.0],
    triggerScoreDiff: [-3, 5],
    personalities: ['rusher'],
  },

  // Sentinel signatures
  {
    id: 'angle-hold',
    name: 'Angle Hold',
    patterns: ['hold-angle', 'peek-slow', 'hold-crouch'],
    cooldown: 8000,
    triggerAggression: [0.2, 0.5],
    triggerHealthRatio: [0.3, 1.0],
    triggerScoreDiff: [0, 5],
    personalities: ['sentinel'],
  },
  {
    id: 'bait-peek',
    name: 'Bait Peek',
    patterns: ['peek-quick', 'hold-crouch', 'peek-double'],
    cooldown: 10000,
    triggerAggression: [0.25, 0.6],
    triggerHealthRatio: [0.25, 1.0],
    triggerScoreDiff: [-1, 4],
    personalities: ['sentinel'],
  },
  {
    id: 'punish-push',
    name: 'Punish Push',
    patterns: ['hold-angle', 'strafe-left', 'push-angled'],
    cooldown: 14000,
    triggerAggression: [0.4, 0.7],
    triggerHealthRatio: [0.5, 1.0],
    triggerScoreDiff: [1, 5],
    personalities: ['sentinel'],
  },

  // Duelist signatures
  {
    id: 'mirror-play',
    name: 'Mirror Play',
    patterns: ['strafe-random', 'peek-double', 'strafe-random'],
    cooldown: 12000,
    triggerAggression: [0.4, 0.7],
    triggerHealthRatio: [0.4, 1.0],
    triggerScoreDiff: [-2, 2],
    personalities: ['duelist'],
  },
  {
    id: 'counter-push',
    name: 'Counter Push',
    patterns: ['retreat-diagonal', 'strafe-left', 'push-direct'],
    cooldown: 11000,
    triggerAggression: [0.45, 0.8],
    triggerHealthRatio: [0.35, 1.0],
    triggerScoreDiff: [-3, 3],
    personalities: ['duelist'],
  },
  {
    id: 'read-and-punish',
    name: 'Read and Punish',
    patterns: ['hold-angle', 'peek-quick', 'push-angled'],
    cooldown: 13000,
    triggerAggression: [0.35, 0.75],
    triggerHealthRatio: [0.4, 1.0],
    triggerScoreDiff: [-1, 4],
    personalities: ['duelist'],
  },
];

/**
 * Index signatures by ID
 */
const SIGNATURE_BY_ID = new Map<string, SignatureMove>(
  SIGNATURE_MOVES.map(s => [s.id, s])
);

export class SignatureMoveTracker {
  private tacticsLibrary: TacticsLibrary;
  private availableSignatures: SignatureMove[];
  private cooldowns: Map<string, number> = new Map();
  private currentSignature: SignatureMove | null = null;
  private currentPatternIndex: number = 0;
  private _signatureStartTime: number = 0;
  private state: SignatureState = 'idle';
  private enabled: boolean;

  constructor(
    personality?: BotPersonalityConfig,
    difficulty?: DifficultyPreset,
    tacticsLibrary?: TacticsLibrary
  ) {
    this.tacticsLibrary = tacticsLibrary ?? new TacticsLibrary();
    this.enabled = difficulty?.useSignatures ?? true;

    // Filter signatures available to this personality
    if (personality) {
      this.availableSignatures = SIGNATURE_MOVES.filter(s =>
        personality.signatures.includes(s.id) ||
        s.personalities.includes(personality.type)
      );
    } else {
      this.availableSignatures = [...SIGNATURE_MOVES];
    }
  }

  /**
   * Check if any signature should trigger
   */
  checkTrigger(input: BotInput, aggression: number): SignatureMove | null {
    if (!this.enabled || this.state !== 'idle') {
      return null;
    }

    const now = Date.now();
    const healthRatio = input.botHealth / input.botMaxHealth;
    const scoreDiff = input.botScore - input.playerScore;

    for (const signature of this.availableSignatures) {
      // Check cooldown
      const lastUsed = this.cooldowns.get(signature.id) ?? 0;
      if (now - lastUsed < signature.cooldown) {
        continue;
      }

      // Check trigger conditions
      if (
        aggression >= signature.triggerAggression[0] &&
        aggression <= signature.triggerAggression[1] &&
        healthRatio >= signature.triggerHealthRatio[0] &&
        healthRatio <= signature.triggerHealthRatio[1] &&
        scoreDiff >= signature.triggerScoreDiff[0] &&
        scoreDiff <= signature.triggerScoreDiff[1]
      ) {
        // Random chance to trigger (don't always use signature when conditions met)
        if (Math.random() < 0.3) {
          return signature;
        }
      }
    }

    return null;
  }

  /**
   * Start executing a signature move
   */
  startSignature(signature: SignatureMove): void {
    this.currentSignature = signature;
    this.currentPatternIndex = 0;
    this._signatureStartTime = Date.now();
    this.state = 'executing';
  }

  /**
   * Check if currently executing a signature
   */
  isExecuting(): boolean {
    return this.state === 'executing' && this.currentSignature !== null;
  }

  /**
   * Get current pattern in signature sequence
   */
  getCurrentPattern(): TacticalPattern | null {
    if (!this.currentSignature || this.state !== 'executing') {
      return null;
    }

    const patternId = this.currentSignature.patterns[this.currentPatternIndex];
    return this.tacticsLibrary.getPattern(patternId) ?? null;
  }

  /**
   * Advance to next pattern in signature
   * Returns true if signature is complete
   */
  advancePattern(): boolean {
    if (!this.currentSignature) {
      return true;
    }

    this.currentPatternIndex++;

    if (this.currentPatternIndex >= this.currentSignature.patterns.length) {
      this.completeSignature(true);
      return true;
    }

    return false;
  }

  /**
   * Complete the current signature
   */
  completeSignature(_success: boolean): void {
    if (this.currentSignature) {
      this.cooldowns.set(this.currentSignature.id, Date.now());
    }

    this.currentSignature = null;
    this.currentPatternIndex = 0;
    this.state = 'idle';
  }

  /**
   * Cancel current signature (e.g., if interrupted)
   */
  cancelSignature(): void {
    // Partial cooldown on cancel
    if (this.currentSignature) {
      this.cooldowns.set(
        this.currentSignature.id,
        Date.now() - this.currentSignature.cooldown * 0.5
      );
    }

    this.currentSignature = null;
    this.currentPatternIndex = 0;
    this.state = 'idle';
  }

  /**
   * Record combat result during signature
   */
  recordResult(event: CombatEvent): void {
    // Could track signature effectiveness here
    // For now, just note if we got hit during signature
    if (this.isExecuting() && event.type === 'player_killed_bot') {
      this.cancelSignature();
    }
  }

  /**
   * Get current signature being executed
   */
  getCurrentSignature(): SignatureMove | null {
    return this.currentSignature;
  }

  /**
   * Get signature by ID
   */
  getSignature(id: string): SignatureMove | undefined {
    return SIGNATURE_BY_ID.get(id);
  }

  /**
   * Get all available signatures for this bot
   */
  getAvailableSignatures(): SignatureMove[] {
    return [...this.availableSignatures];
  }

  /**
   * Check if a specific signature is on cooldown
   */
  isOnCooldown(signatureId: string): boolean {
    const signature = SIGNATURE_BY_ID.get(signatureId);
    if (!signature) return false;

    const lastUsed = this.cooldowns.get(signatureId) ?? 0;
    return Date.now() - lastUsed < signature.cooldown;
  }

  /**
   * Get remaining cooldown for a signature (ms)
   */
  getCooldownRemaining(signatureId: string): number {
    const signature = SIGNATURE_BY_ID.get(signatureId);
    if (!signature) return 0;

    const lastUsed = this.cooldowns.get(signatureId) ?? 0;
    const elapsed = Date.now() - lastUsed;
    return Math.max(0, signature.cooldown - elapsed);
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.cooldowns.clear();
    this.currentSignature = null;
    this.currentPatternIndex = 0;
    this.state = 'idle';
  }
}
