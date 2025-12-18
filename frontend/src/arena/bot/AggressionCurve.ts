/**
 * AggressionCurve - Wave-based aggression system for combat bots
 * 
 * Creates natural ebb and flow in bot behavior through sinusoidal waves,
 * modified by match state (score, health, time).
 */

import type {
  AggressionModifiers,
  AggressionState,
  AggressionTrend,
  BotPersonalityConfig,
} from './types';

/**
 * Configuration for aggression curve behavior
 */
interface AggressionConfig {
  baseAggression: number;
  volatility: number;
  primaryWaveFrequency: number;   // ~30s cycle
  secondaryWaveFrequency: number; // ~10s micro variations
  primaryWaveAmplitude: number;
  secondaryWaveAmplitude: number;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: AggressionConfig = {
  baseAggression: 0.5,
  volatility: 0.2,
  primaryWaveFrequency: 0.0002,    // ~31s full cycle
  secondaryWaveFrequency: 0.0006,  // ~10s full cycle
  primaryWaveAmplitude: 0.25,
  secondaryWaveAmplitude: 0.12,
};

/**
 * History window size for trend detection
 */
const HISTORY_SIZE = 10;

/**
 * Threshold for detecting peaks/valleys
 */
const TREND_THRESHOLD = 0.02;

export class AggressionCurve {
  private config: AggressionConfig;
  private history: number[] = [];

  constructor(personality?: BotPersonalityConfig) {
    this.config = this.buildConfig(personality);
  }

  /**
   * Build configuration from personality
   */
  private buildConfig(personality?: BotPersonalityConfig): AggressionConfig {
    if (!personality) {
      return { ...DEFAULT_CONFIG };
    }

    return {
      ...DEFAULT_CONFIG,
      baseAggression: personality.baseAggression,
      volatility: personality.aggressionVolatility,
      primaryWaveAmplitude: DEFAULT_CONFIG.primaryWaveAmplitude * personality.aggressionVolatility,
      secondaryWaveAmplitude: DEFAULT_CONFIG.secondaryWaveAmplitude * personality.aggressionVolatility,
    };
  }

  /**
   * Calculate raw aggression at current match time (before modifiers)
   */
  calculateBase(matchTimeMs: number): number {
    // Primary wave (~30s cycle)
    const primaryWave = Math.sin(matchTimeMs * this.config.primaryWaveFrequency) 
      * this.config.primaryWaveAmplitude;

    // Secondary wave (~10s micro variations) with phase offset
    const secondaryWave = Math.sin(matchTimeMs * this.config.secondaryWaveFrequency + 1.5) 
      * this.config.secondaryWaveAmplitude;

    return this.config.baseAggression + primaryWave + secondaryWave;
  }

  /**
   * Calculate aggression with all modifiers applied
   */
  calculate(matchTimeMs: number, modifiers: AggressionModifiers): number {
    let aggression = this.calculateBase(matchTimeMs);

    // Score modifier: winning = more aggressive, losing = more cautious
    // tanh provides smooth clamping between -1 and 1
    const scoreModifier = Math.tanh(modifiers.scoreDiff * 0.1) * 0.15;
    aggression += scoreModifier;

    // Health modifier: low health = less aggressive
    const healthModifier = (modifiers.healthRatio - 0.5) * 0.2;
    aggression += healthModifier;

    // Time pressure: end of match = more aggressive if losing
    if (modifiers.timeRatio > 0.7 && modifiers.scoreDiff < 0) {
      aggression += (modifiers.timeRatio - 0.7) * 0.5;
    }

    // Recent combat modifier: taking damage = less aggressive, dealing = more
    const combatModifier = (modifiers.recentDamageDealt - modifiers.recentDamageTaken) * 0.001;
    aggression += Math.tanh(combatModifier) * 0.1;

    // Clamp to valid range (never fully passive or fully aggressive)
    return Math.max(0.1, Math.min(0.95, aggression));
  }

  /**
   * Get full aggression state including trend detection
   */
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

  /**
   * Update history buffer for trend detection
   */
  private updateHistory(value: number): void {
    this.history.push(value);
    if (this.history.length > HISTORY_SIZE) {
      this.history.shift();
    }
  }

  /**
   * Detect current trend from history
   */
  private detectTrend(): AggressionTrend {
    if (this.history.length < 3) {
      return 'rising';
    }

    const recent = this.history.slice(-3);
    const oldest = recent[0];
    const middle = recent[1];
    const newest = recent[2];

    const delta1 = middle - oldest;
    const delta2 = newest - middle;

    // Peak: was rising, now falling
    if (delta1 > TREND_THRESHOLD && delta2 < -TREND_THRESHOLD) {
      return 'peak';
    }

    // Valley: was falling, now rising
    if (delta1 < -TREND_THRESHOLD && delta2 > TREND_THRESHOLD) {
      return 'valley';
    }

    // Rising: consistent upward movement
    if (delta2 > TREND_THRESHOLD) {
      return 'rising';
    }

    // Falling: consistent downward movement
    if (delta2 < -TREND_THRESHOLD) {
      return 'falling';
    }

    // Default to previous trend or rising
    return this.history.length > 3 ? this.detectPreviousTrend() : 'rising';
  }

  /**
   * Look at longer history to determine trend when recent is flat
   */
  private detectPreviousTrend(): AggressionTrend {
    if (this.history.length < 5) {
      return 'rising';
    }

    const first = this.history[0];
    const last = this.history[this.history.length - 1];
    
    return last > first ? 'rising' : 'falling';
  }

  /**
   * Reset history (e.g., on respawn)
   */
  reset(): void {
    this.history = [];
  }

  /**
   * Get current config (for debugging)
   */
  getConfig(): Readonly<AggressionConfig> {
    return { ...this.config };
  }
}
