/**
 * BotPlayer - Integrates CombatConductor with arena game systems
 *
 * Wraps the bot AI and provides the interface needed by ArenaScene,
 * CombatSystem, and Physics3D.
 */

import { Vector3 as ThreeVector3 } from 'three';
import type {
  BotInput,
  BotOutput,
  BotPersonalityConfig,
  BotPersonalityType,
  BotState,
  CombatEvent,
  CoverPosition,
  DifficultyLevel,
  DifficultyPreset,
} from './types';
import { CombatConductor } from './CombatConductor';
import {
  getPersonality,
  getDifficultyPreset,
  getRandomPersonality,
} from './BotPersonality';
import { Vector3 } from '../math/Vector3';

/**
 * Bot player configuration
 */
export interface BotPlayerConfig {
  playerId: number;
  personality?: BotPersonalityType | 'random';
  difficulty?: DifficultyLevel;
  initialPosition?: Vector3;
}

/**
 * Bot player state for external systems
 */
export interface BotPlayerState {
  playerId: number;
  position: Vector3;
  velocity: Vector3;
  health: number;
  maxHealth: number;
  ammo: number;
  maxAmmo: number;
  score: number;
  isDead: boolean;
  currentState: BotState;
}

/**
 * Match context provided each tick
 */
export interface BotMatchContext {
  playerPosition: Vector3;
  playerVelocity: Vector3;
  playerHealth: number;
  playerVisible: boolean;
  playerScore: number;
  timeRemaining: number;
  matchDuration: number;
  coverPositions: CoverPosition[];
  mapBounds: { min: ThreeVector3; max: ThreeVector3 };
}

/**
 * Default bot configuration
 */
const DEFAULT_BOT_CONFIG = {
  maxHealth: 100,
  maxAmmo: 30,
  moveSpeed: 5.0,
  capsuleRadius: 0.4,
  capsuleHeight: 1.8,
};

export class BotPlayer {
  public readonly playerId: number;
  private conductor: CombatConductor;
  private personality: BotPersonalityConfig;
  private difficulty: DifficultyPreset;

  // State
  private position: Vector3;
  private velocity: Vector3 = Vector3.ZERO;
  private health: number;
  private maxHealth: number;
  private ammo: number;
  private maxAmmo: number;
  private score: number = 0;
  private isDead: boolean = false;
  private respawnTime: number | null = null;

  // Tracking
  private lastSeenPosition: Vector3 | null = null;
  private lastSeenTime: number = 0;
  private lastOutput: BotOutput | null = null;

  constructor(config: BotPlayerConfig) {
    this.playerId = config.playerId;

    // Resolve personality
    if (config.personality === 'random' || !config.personality) {
      this.personality = getRandomPersonality();
    } else {
      this.personality = getPersonality(config.personality);
    }

    // Resolve difficulty
    this.difficulty = getDifficultyPreset(config.difficulty ?? 'medium');

    // Create conductor
    this.conductor = new CombatConductor(this.personality, this.difficulty);

    // Initialize state
    this.position = config.initialPosition ?? new Vector3(0, 1, 0);
    this.health = DEFAULT_BOT_CONFIG.maxHealth;
    this.maxHealth = DEFAULT_BOT_CONFIG.maxHealth;
    this.ammo = DEFAULT_BOT_CONFIG.maxAmmo;
    this.maxAmmo = DEFAULT_BOT_CONFIG.maxAmmo;
  }

  /**
   * Update bot each tick
   */
  update(deltaMs: number, context: BotMatchContext): BotOutput {
    if (this.isDead) {
      return this.getDeadOutput();
    }

    // Update visibility tracking
    if (context.playerVisible) {
      this.lastSeenPosition = context.playerPosition;
      this.lastSeenTime = Date.now();
    }

    // Build bot input
    const input = this.buildInput(context);

    // Run conductor
    const output = this.conductor.conduct(input, deltaMs);
    this.lastOutput = output;

    // Apply movement
    this.applyMovement(output, deltaMs);

    // Handle shooting
    if (output.shouldShoot && this.ammo > 0) {
      this.ammo--;
    }

    // Handle reload
    if (output.shouldReload) {
      this.ammo = this.maxAmmo;
    }

    return output;
  }

  /**
   * Build BotInput from match context
   */
  private buildInput(context: BotMatchContext): BotInput {
    return {
      botPosition: this.positionToThree(this.position),
      botHealth: this.health,
      botMaxHealth: this.maxHealth,
      botAmmo: this.ammo,
      botMaxAmmo: this.maxAmmo,
      playerPosition: this.positionToThree(context.playerPosition),
      playerVelocity: this.positionToThree(context.playerVelocity),
      playerHealth: context.playerHealth,
      playerVisible: context.playerVisible,
      lastSeenPosition: this.lastSeenPosition
        ? this.positionToThree(this.lastSeenPosition)
        : null,
      lastSeenTime: this.lastSeenTime,
      botScore: this.score,
      playerScore: context.playerScore,
      timeRemaining: context.timeRemaining,
      matchDuration: context.matchDuration,
      coverPositions: context.coverPositions,
      mapBounds: {
        min: context.mapBounds.min,
        max: context.mapBounds.max,
      },
    };
  }

  /**
   * Apply movement from output
   */
  private applyMovement(output: BotOutput, deltaMs: number): void {
    const speed = DEFAULT_BOT_CONFIG.moveSpeed * output.moveSpeed;
    const deltaSeconds = deltaMs / 1000;

    // Calculate velocity from direction
    this.velocity = new Vector3(
      output.moveDirection.x * speed,
      0,
      output.moveDirection.z * speed
    );

    // Update position
    this.position = this.position.add(this.velocity.scale(deltaSeconds));
  }

  /**
   * Get output when dead
   */
  private getDeadOutput(): BotOutput {
    return {
      moveDirection: new ThreeVector3(0, 0, 0),
      moveSpeed: 0,
      aimTarget: new ThreeVector3(0, 0, 0),
      shouldShoot: false,
      shouldReload: false,
      shouldCrouch: false,
      currentState: 'PATROL',
    };
  }

  /**
   * Record a combat event
   */
  recordCombatEvent(event: CombatEvent): void {
    this.conductor.recordEvent(event);
  }

  /**
   * Apply damage to bot
   */
  applyDamage(damage: number, _attackerId: number): void {
    if (this.isDead) return;

    this.health = Math.max(0, this.health - damage);

    this.recordCombatEvent({
      type: 'player_hit_bot',
      timestamp: Date.now(),
      damage,
    });

    if (this.health <= 0) {
      this.die();
    }
  }

  /**
   * Bot dies
   */
  private die(): void {
    this.isDead = true;
    this.respawnTime = Date.now() + 3000; // 3 second respawn

    this.recordCombatEvent({
      type: 'player_killed_bot',
      timestamp: Date.now(),
    });
  }

  /**
   * Check if bot should respawn
   */
  checkRespawn(currentTime: number): boolean {
    if (this.isDead && this.respawnTime && currentTime >= this.respawnTime) {
      return true;
    }
    return false;
  }

  /**
   * Respawn bot at position
   */
  respawn(position: Vector3): void {
    this.position = position;
    this.velocity = Vector3.ZERO;
    this.health = this.maxHealth;
    this.ammo = this.maxAmmo;
    this.isDead = false;
    this.respawnTime = null;
    this.conductor.reset();
  }

  /**
   * Bot scored a kill
   */
  addKill(): void {
    this.score++;
    this.recordCombatEvent({
      type: 'bot_killed_player',
      timestamp: Date.now(),
    });
  }

  /**
   * Bot hit player
   */
  recordHit(damage: number): void {
    this.recordCombatEvent({
      type: 'bot_hit_player',
      timestamp: Date.now(),
      damage,
    });
  }

  /**
   * Bot missed
   */
  recordMiss(): void {
    this.recordCombatEvent({
      type: 'bot_missed',
      timestamp: Date.now(),
    });
  }

  // ============================================================================
  // Getters
  // ============================================================================

  getState(): BotPlayerState {
    return {
      playerId: this.playerId,
      position: this.position,
      velocity: this.velocity,
      health: this.health,
      maxHealth: this.maxHealth,
      ammo: this.ammo,
      maxAmmo: this.maxAmmo,
      score: this.score,
      isDead: this.isDead,
      currentState: this.conductor.getState(),
    };
  }

  getPosition(): Vector3 {
    return this.position;
  }

  getVelocity(): Vector3 {
    return this.velocity;
  }

  getHealth(): number {
    return this.health;
  }

  getScore(): number {
    return this.score;
  }

  getPersonality(): BotPersonalityConfig {
    return this.personality;
  }

  getDifficulty(): DifficultyPreset {
    return this.difficulty;
  }

  getLastOutput(): BotOutput | null {
    return this.lastOutput;
  }

  getAimTarget(): ThreeVector3 | null {
    return this.lastOutput?.aimTarget ?? null;
  }

  shouldShoot(): boolean {
    return this.lastOutput?.shouldShoot ?? false;
  }

  /**
   * Get tactical debug summary from the navigator
   * Used for debug overlay "thought bubble"
   */
  getTacticalDebugSummary(): {
    status: string;
    laneName: string | null;
    laneType: string | null;
    waypointProgress: string;
    angleName: string | null;
    mercyActive: boolean;
    isPausing: boolean;
  } {
    return this.conductor.getTacticalNavigator().getDebugSummary();
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private positionToThree(pos: Vector3): ThreeVector3 {
    return new ThreeVector3(pos.x, pos.y, pos.z);
  }

  /**
   * Create capsule for collision detection
   */
  createCapsule(): { start: Vector3; end: Vector3; radius: number } {
    const halfHeight = DEFAULT_BOT_CONFIG.capsuleHeight / 2;
    return {
      start: new Vector3(
        this.position.x,
        this.position.y - halfHeight + DEFAULT_BOT_CONFIG.capsuleRadius,
        this.position.z
      ),
      end: new Vector3(
        this.position.x,
        this.position.y + halfHeight - DEFAULT_BOT_CONFIG.capsuleRadius,
        this.position.z
      ),
      radius: DEFAULT_BOT_CONFIG.capsuleRadius,
    };
  }

  /**
   * Set position directly (for physics integration)
   */
  setPosition(position: Vector3): void {
    this.position = position;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    // Nothing to dispose currently
  }
}
