/**
 * MercySystem - Prevents steamrolling by backing off when dominating
 * 
 * Tracks domination metrics and activates "mercy mode" to give the player
 * a chance to recover, creating more engaging matches.
 */

import type {
  BotPersonalityConfig,
  CombatEvent,
  DifficultyPreset,
  DominationMetrics,
  MercyState,
} from './types';

/**
 * Configuration for mercy system behavior
 */
interface MercyConfig {
  enabled: boolean;
  threshold: number;           // Domination score to trigger mercy
  duration: number;            // How long mercy lasts (ms)
  aggressionReduction: number; // How much to reduce aggression (0-1)
  decayRate: number;           // How fast metrics decay per second
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: MercyConfig = {
  enabled: true,
  threshold: 0.7,
  duration: 4000,
  aggressionReduction: 0.4,
  decayRate: 0.1,
};

export class MercySystem {
  private config: MercyConfig;
  private metrics: DominationMetrics;
  private mercyActive: boolean = false;
  private mercyStartTime: number = 0;
  private lastUpdateTime: number = 0;

  constructor(difficulty?: DifficultyPreset, personality?: BotPersonalityConfig) {
    this.config = this.buildConfig(difficulty, personality);
    this.metrics = this.createEmptyMetrics();
    this.lastUpdateTime = Date.now();
  }

  /**
   * Build configuration from difficulty and personality
   */
  private buildConfig(
    difficulty?: DifficultyPreset,
    personality?: BotPersonalityConfig
  ): MercyConfig {
    const config = { ...DEFAULT_CONFIG };

    if (difficulty) {
      config.enabled = difficulty.mercyEnabled;
      config.threshold *= difficulty.mercyThresholdMultiplier;
    }

    if (personality) {
      config.threshold = personality.mercyThreshold * (difficulty?.mercyThresholdMultiplier ?? 1);
      config.duration = personality.mercyDuration;
    }

    return config;
  }

  /**
   * Create empty metrics object
   */
  private createEmptyMetrics(): DominationMetrics {
    return {
      recentDamageDealt: 0,
      recentDamageTaken: 0,
      killsWithoutDying: 0,
      consecutiveHits: 0,
      playerMissedShots: 0,
    };
  }

  /**
   * Record a combat event
   */
  recordCombatEvent(event: CombatEvent): void {
    switch (event.type) {
      case 'bot_hit_player':
        this.metrics.recentDamageDealt += event.damage ?? 0;
        this.metrics.consecutiveHits++;
        break;

      case 'player_hit_bot':
        this.metrics.recentDamageTaken += event.damage ?? 0;
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
   * Update mercy state - call each tick
   */
  update(currentTime: number = Date.now()): MercyState {
    // Decay metrics over time
    this.decayMetrics(currentTime);

    if (!this.config.enabled) {
      return {
        isActive: false,
        dominationScore: 0,
        mercyLevel: 0,
        remainingDuration: 0,
      };
    }

    const dominationScore = this.calculateDominationScore();

    // Check if mercy should activate
    if (!this.mercyActive && dominationScore > this.config.threshold) {
      this.mercyActive = true;
      this.mercyStartTime = currentTime;
    }

    // Check if mercy should deactivate
    if (this.mercyActive) {
      const elapsed = currentTime - this.mercyStartTime;
      if (elapsed > this.config.duration) {
        this.mercyActive = false;
        this.partialResetMetrics();
      }
    }

    const remainingDuration = this.mercyActive
      ? Math.max(0, this.config.duration - (currentTime - this.mercyStartTime))
      : 0;

    return {
      isActive: this.mercyActive,
      dominationScore,
      mercyLevel: this.mercyActive ? this.config.aggressionReduction : 0,
      remainingDuration,
    };
  }

  /**
   * Get aggression multiplier (< 1 when mercy active)
   */
  getAggressionMultiplier(): number {
    if (!this.mercyActive) return 1.0;
    return 1.0 - this.config.aggressionReduction;
  }

  /**
   * Get recent damage dealt (for aggression modifiers)
   */
  getRecentDamageDealt(): number {
    return this.metrics.recentDamageDealt;
  }

  /**
   * Get recent damage taken (for aggression modifiers)
   */
  getRecentDamageTaken(): number {
    return this.metrics.recentDamageTaken;
  }

  /**
   * Check if mercy is currently active
   */
  isMercyActive(): boolean {
    return this.mercyActive;
  }

  /**
   * Get current domination metrics (for debugging)
   */
  getMetrics(): Readonly<DominationMetrics> {
    return { ...this.metrics };
  }

  /**
   * Calculate domination score from metrics
   */
  private calculateDominationScore(): number {
    const totalDamage = this.metrics.recentDamageDealt + this.metrics.recentDamageTaken;
    
    // Damage ratio: what portion of damage was dealt by bot
    const damageRatio = totalDamage > 0
      ? this.metrics.recentDamageDealt / totalDamage
      : 0.5;

    // Hit streak factor (capped at 5 consecutive hits)
    const hitStreak = Math.min(1, this.metrics.consecutiveHits / 5);

    // Kill streak factor (capped at 3 kills)
    const killStreak = Math.min(1, this.metrics.killsWithoutDying / 3);

    // Weighted combination
    return (damageRatio * 0.4) + (hitStreak * 0.3) + (killStreak * 0.3);
  }

  /**
   * Decay metrics over time
   */
  private decayMetrics(currentTime: number): void {
    const elapsed = currentTime - this.lastUpdateTime;
    const decayFactor = Math.max(0, 1 - (elapsed / 1000) * this.config.decayRate);

    this.metrics.recentDamageDealt *= decayFactor;
    this.metrics.recentDamageTaken *= decayFactor;
    this.metrics.playerMissedShots = Math.floor(this.metrics.playerMissedShots * decayFactor);

    this.lastUpdateTime = currentTime;
  }

  /**
   * Partial reset after mercy ends
   */
  private partialResetMetrics(): void {
    this.metrics.recentDamageDealt *= 0.5;
    this.metrics.recentDamageTaken *= 0.5;
    this.metrics.consecutiveHits = 0;
    this.metrics.playerMissedShots = 0;
  }

  /**
   * Full reset (on bot death)
   */
  private resetMetrics(): void {
    this.metrics = this.createEmptyMetrics();
    this.mercyActive = false;
  }

  /**
   * Force reset (for testing or respawn)
   */
  reset(): void {
    this.resetMetrics();
    this.lastUpdateTime = Date.now();
  }
}
