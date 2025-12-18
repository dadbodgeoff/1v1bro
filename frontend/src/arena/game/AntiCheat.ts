/**
 * Anti-Cheat System
 *
 * Layer 3: Game Logic - Validates player inputs and tracks violations.
 * Detects speed hacks, invalid jumps, and fire rate exploits.
 */

import { Vector3 } from '../math/Vector3';
import type { IEventBus } from '../core/EventBus';
import type { ViolationType } from '../core/GameEvents';
import type { Result } from '../core/Result';
import { Ok, Err } from '../core/Result';
import type { PhysicsConfig } from '../physics/Physics3D';
import { DEFAULT_PHYSICS_CONFIG } from '../physics/Physics3D';

/**
 * Anti-cheat configuration
 */
export interface AntiCheatConfig {
  /** Maximum violations before kick */
  readonly maxViolations: number;
  /** Time window for violation tracking (ms) */
  readonly violationWindowMs: number;
  /** Speed tolerance factor (1.5 = 50% over max allowed) */
  readonly speedToleranceFactor: number;
  /** Timestamp tolerance (ms) */
  readonly timestampToleranceMs: number;
}

/**
 * Default anti-cheat configuration
 */
export const DEFAULT_ANTI_CHEAT_CONFIG: AntiCheatConfig = {
  maxViolations: 10,
  violationWindowMs: 60000,
  speedToleranceFactor: 1.5,
  timestampToleranceMs: 500,
};

/**
 * Violation record
 */
interface ViolationRecord {
  type: ViolationType;
  timestamp: number;
  details: string;
}

/**
 * Input data for validation
 */
export interface InputValidationData {
  readonly buttons: number;
  readonly clientTimestamp: number;
}

/**
 * Anti-cheat interface
 */
export interface IAntiCheat {
  /** Validate player input */
  validateInput(
    playerId: number,
    input: InputValidationData,
    previousPosition: Vector3,
    newPosition: Vector3,
    wasGrounded: boolean,
    serverTime: number,
    deltaTime: number
  ): Result<void, ViolationType>;

  /** Get violation count for player */
  getViolationCount(playerId: number): number;
  /** Clear violations for player */
  clearViolations(playerId: number): void;
  /** Remove player from tracking */
  removePlayer(playerId: number): void;
  /** Check if player should be kicked */
  shouldKick(playerId: number): boolean;
}


/**
 * Anti-cheat implementation
 */
export class AntiCheat implements IAntiCheat {
  private violations: Map<number, ViolationRecord[]> = new Map();
  private readonly config: AntiCheatConfig;
  private readonly physicsConfig: PhysicsConfig;
  private readonly eventBus?: IEventBus;

  constructor(
    config: AntiCheatConfig = DEFAULT_ANTI_CHEAT_CONFIG,
    physicsConfig: PhysicsConfig = DEFAULT_PHYSICS_CONFIG,
    eventBus?: IEventBus
  ) {
    this.config = config;
    this.physicsConfig = physicsConfig;
    this.eventBus = eventBus;
  }

  validateInput(
    playerId: number,
    input: InputValidationData,
    previousPosition: Vector3,
    newPosition: Vector3,
    _wasGrounded: boolean,
    serverTime: number,
    deltaTime: number
  ): Result<void, ViolationType> {
    // Validate timestamp
    const timestampDiff = Math.abs(input.clientTimestamp - serverTime);
    if (timestampDiff > this.config.timestampToleranceMs) {
      return this.recordViolation(playerId, 'timestamp_mismatch', `Timestamp diff: ${timestampDiff}ms`);
    }

    // Validate movement speed
    const distance = newPosition.distanceTo(previousPosition);
    const maxAllowedDistance = this.physicsConfig.maxSpeed * deltaTime * this.config.speedToleranceFactor;

    if (distance > maxAllowedDistance && deltaTime > 0) {
      return this.recordViolation(
        playerId,
        'speed_hack',
        `Distance: ${distance.toFixed(2)}, Max: ${maxAllowedDistance.toFixed(2)}`
      );
    }

    return Ok(undefined);
  }

  private recordViolation(playerId: number, type: ViolationType, details: string): Result<void, ViolationType> {
    const now = Date.now();

    if (!this.violations.has(playerId)) {
      this.violations.set(playerId, []);
    }

    const playerViolations = this.violations.get(playerId)!;

    // Prune old violations
    const cutoff = now - this.config.violationWindowMs;
    const recentViolations = playerViolations.filter((v) => v.timestamp >= cutoff);

    // Add new violation
    recentViolations.push({ type, timestamp: now, details });
    this.violations.set(playerId, recentViolations);

    this.eventBus?.emit({
      type: 'violation_detected',
      timestamp: now,
      playerId,
      violationType: type,
      details,
    });

    // Check if player should be kicked
    if (recentViolations.length >= this.config.maxViolations) {
      this.eventBus?.emit({
        type: 'player_kicked',
        timestamp: now,
        playerId,
        reason: `Exceeded violation limit: ${type}`,
        violationCount: recentViolations.length,
      });
    }

    return Err(type);
  }

  getViolationCount(playerId: number): number {
    const violations = this.violations.get(playerId);
    if (!violations) return 0;

    const cutoff = Date.now() - this.config.violationWindowMs;
    return violations.filter((v) => v.timestamp >= cutoff).length;
  }

  clearViolations(playerId: number): void {
    this.violations.delete(playerId);
  }

  removePlayer(playerId: number): void {
    this.violations.delete(playerId);
  }

  shouldKick(playerId: number): boolean {
    return this.getViolationCount(playerId) >= this.config.maxViolations;
  }
}
