/**
 * AimController - Human-like aiming with reaction time and accuracy variance
 * 
 * Simulates realistic aim behavior including reaction delays, smoothing,
 * prediction, and state-based degradation.
 */

import { Vector3 } from 'three';
import type {
  AimState,
  BotPersonalityConfig,
  BotState,
  DifficultyPreset,
} from './types';

/**
 * Configuration for aim behavior
 */
interface AimConfig {
  reactionTimeMs: number;      // Delay before reacting to new position
  baseAccuracy: number;        // 0-1, base accuracy
  trackingSkill: number;       // 0-1, prediction ability
  smoothingFactor: number;     // How fast aim moves toward target
  jitterAmount: number;        // Random aim wobble
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AimConfig = {
  reactionTimeMs: 200,
  baseAccuracy: 0.7,
  trackingSkill: 0.5,
  smoothingFactor: 0.15,
  jitterAmount: 0.02,
};

export class AimController {
  private config: AimConfig;
  private currentAim: Vector3 = new Vector3();
  private targetAim: Vector3 = new Vector3();
  private lastPlayerPosition: Vector3 = new Vector3();
  private reactionTimer: number = 0;
  private initialized: boolean = false;

  constructor(personality?: BotPersonalityConfig, difficulty?: DifficultyPreset) {
    this.config = this.buildConfig(personality, difficulty);
  }

  /**
   * Build configuration from personality and difficulty
   */
  private buildConfig(
    personality?: BotPersonalityConfig,
    difficulty?: DifficultyPreset
  ): AimConfig {
    const config = { ...DEFAULT_CONFIG };

    if (personality) {
      config.reactionTimeMs = personality.reactionTimeMs;
      config.baseAccuracy = personality.accuracyBase;
      config.trackingSkill = personality.trackingSkill;
    }

    if (difficulty) {
      config.reactionTimeMs *= difficulty.reactionTimeMultiplier;
      config.baseAccuracy *= difficulty.accuracyMultiplier;
    }

    // Clamp values
    config.baseAccuracy = Math.min(1, Math.max(0, config.baseAccuracy));
    config.trackingSkill = Math.min(1, Math.max(0, config.trackingSkill));

    return config;
  }

  /**
   * Update aim each tick
   */
  update(
    deltaMs: number,
    playerPosition: Vector3,
    playerVelocity: Vector3,
    botState: BotState
  ): AimState {
    // Initialize on first update
    if (!this.initialized) {
      this.currentAim.copy(playerPosition);
      this.targetAim.copy(playerPosition);
      this.lastPlayerPosition.copy(playerPosition);
      this.initialized = true;
    }

    // Check if player moved significantly (triggers reaction delay)
    const playerMoved = this.lastPlayerPosition.distanceTo(playerPosition) > 0.5;
    if (playerMoved) {
      this.reactionTimer = this.config.reactionTimeMs;
      this.lastPlayerPosition.copy(playerPosition);
    }

    // Tick down reaction timer
    this.reactionTimer = Math.max(0, this.reactionTimer - deltaMs);

    // Calculate target aim position (only after reaction time)
    if (this.reactionTimer <= 0) {
      // Predictive aiming based on tracking skill
      const predictionTime = 0.1 * this.config.trackingSkill;
      this.targetAim.copy(playerPosition);
      
      // Add prediction
      const prediction = playerVelocity.clone().multiplyScalar(predictionTime);
      this.targetAim.add(prediction);

      // Add accuracy error
      const errorMagnitude = (1 - this.config.baseAccuracy) * 0.5;
      this.targetAim.x += (Math.random() - 0.5) * errorMagnitude;
      this.targetAim.y += (Math.random() - 0.5) * errorMagnitude * 0.5; // Less vertical error
      this.targetAim.z += (Math.random() - 0.5) * errorMagnitude;
    }

    // Calculate smoothing factor based on state
    let smoothing = this.config.smoothingFactor;

    // State-based aim degradation
    switch (botState) {
      case 'RETREAT':
        smoothing *= 0.7; // Worse aim when retreating
        break;
      case 'REPOSITION':
        smoothing *= 0.8; // Slightly worse when moving
        break;
      case 'EXECUTING_SIGNATURE':
        smoothing *= 1.1; // Slightly better during signature (focused)
        break;
    }

    // Smooth aim movement (not instant snap)
    this.currentAim.lerp(this.targetAim, smoothing);

    // Add micro-jitter for realism
    const jitter = this.config.jitterAmount;
    this.currentAim.x += (Math.random() - 0.5) * jitter;
    this.currentAim.y += (Math.random() - 0.5) * jitter;
    this.currentAim.z += (Math.random() - 0.5) * jitter;

    // Calculate if on target
    const distanceToTarget = this.currentAim.distanceTo(playerPosition);
    const isOnTarget = distanceToTarget < 0.3;

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

    // Add flick error based on accuracy
    const flickError = 0.1 * (1 - this.config.baseAccuracy);
    this.currentAim.x += (Math.random() - 0.5) * flickError;
    this.currentAim.y += (Math.random() - 0.5) * flickError * 0.5;
    this.currentAim.z += (Math.random() - 0.5) * flickError;

    // Reset reaction timer (just flicked, need time to adjust)
    this.reactionTimer = this.config.reactionTimeMs * 0.5;
  }

  /**
   * Force aim to a specific position (for testing/debugging)
   */
  setAim(position: Vector3): void {
    this.currentAim.copy(position);
    this.targetAim.copy(position);
  }

  /**
   * Get current aim position
   */
  getCurrentAim(): Vector3 {
    return this.currentAim.clone();
  }

  /**
   * Check if currently reacting (in reaction delay)
   */
  isReacting(): boolean {
    return this.reactionTimer > 0;
  }

  /**
   * Get accuracy at current moment (affected by state)
   */
  getEffectiveAccuracy(botState: BotState): number {
    let accuracy = this.config.baseAccuracy;

    switch (botState) {
      case 'RETREAT':
        accuracy *= 0.7;
        break;
      case 'REPOSITION':
        accuracy *= 0.85;
        break;
      case 'ENGAGE':
        accuracy *= 1.0;
        break;
      case 'EXECUTING_SIGNATURE':
        accuracy *= 1.05;
        break;
    }

    return Math.min(1, accuracy);
  }

  /**
   * Reset aim state
   */
  reset(): void {
    this.currentAim.set(0, 0, 0);
    this.targetAim.set(0, 0, 0);
    this.lastPlayerPosition.set(0, 0, 0);
    this.reactionTimer = 0;
    this.initialized = false;
  }

  /**
   * Get config (for debugging)
   */
  getConfig(): Readonly<AimConfig> {
    return { ...this.config };
  }
}
