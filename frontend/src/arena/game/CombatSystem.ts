/**
 * Combat System
 *
 * Layer 3: Game Logic - Handles weapon firing, damage, and player death/respawn.
 */

import { Vector3 } from '../math/Vector3';
import { Capsule } from '../physics/Capsule';
import type { ICollisionWorld } from '../physics/CollisionWorld';
import type { IEventBus } from '../core/EventBus';
import type { Result } from '../core/Result';
import { Ok, Err } from '../core/Result';

/**
 * Combat configuration
 */
export interface CombatConfig {
  /** Damage per hit */
  readonly weaponDamage: number;
  /** Maximum weapon range */
  readonly weaponRange: number;
  /** Minimum time between shots (ms) */
  readonly fireRateCooldownMs: number;
  /** Time before respawn (ms) */
  readonly respawnTimeMs: number;
  /** Duration of invulnerability after respawn (ms) */
  readonly invulnerabilityDurationMs: number;
  /** Maximum player health */
  readonly maxHealth: number;
}

/**
 * Default combat configuration
 */
export const DEFAULT_COMBAT_CONFIG: CombatConfig = {
  weaponDamage: 8,
  weaponRange: 100,
  fireRateCooldownMs: 200,
  respawnTimeMs: 3000,
  invulnerabilityDurationMs: 2000,
  maxHealth: 100,
};

/**
 * Player combat state
 */
export interface PlayerCombatState {
  health: number;
  lastFireTime: number;
  deathTime: number | null;
  respawnTime: number | null;
  invulnerableUntil: number;
  isDead: boolean;
}

/**
 * Fire command from player
 */
export interface FireCommand {
  readonly playerId: number;
  readonly origin: Vector3;
  readonly direction: Vector3;
  readonly clientTimestamp: number;
}

/**
 * Result of a successful hit
 */
export interface HitResult {
  readonly targetId: number;
  readonly hitPosition: Vector3;
  readonly damage: number;
}

/**
 * Combat system interface
 */
export interface ICombatSystem {
  /** Initialize a new player */
  initializePlayer(playerId: number): void;
  /** Remove a player */
  removePlayer(playerId: number): void;
  /** Get player combat state */
  getPlayerState(playerId: number): PlayerCombatState | undefined;

  /** Process a fire command */
  processFire(
    command: FireCommand,
    playerCapsules: Map<number, Capsule>,
    currentTime: number
  ): Result<HitResult | null, string>;

  /** Apply damage to a player */
  applyDamage(
    victimId: number,
    attackerId: number,
    damage: number,
    hitPosition: Vector3,
    currentTime: number
  ): void;

  /** Update system, returns list of players ready to respawn */
  update(currentTime: number): number[];

  /** Respawn a player */
  respawnPlayer(playerId: number, currentTime: number): void;
}


/**
 * Combat system implementation
 */
export class CombatSystem implements ICombatSystem {
  private playerStates: Map<number, PlayerCombatState> = new Map();
  private readonly config: CombatConfig;
  private readonly collisionWorld?: ICollisionWorld;
  private readonly eventBus?: IEventBus;

  constructor(
    config: CombatConfig = DEFAULT_COMBAT_CONFIG,
    collisionWorld?: ICollisionWorld,
    eventBus?: IEventBus
  ) {
    this.config = config;
    this.collisionWorld = collisionWorld;
    this.eventBus = eventBus;
  }

  initializePlayer(playerId: number): void {
    this.playerStates.set(playerId, {
      health: this.config.maxHealth,
      lastFireTime: -Infinity, // Allow immediate first shot
      deathTime: null,
      respawnTime: null,
      invulnerableUntil: 0,
      isDead: false,
    });
  }

  removePlayer(playerId: number): void {
    this.playerStates.delete(playerId);
  }

  getPlayerState(playerId: number): PlayerCombatState | undefined {
    const state = this.playerStates.get(playerId);
    if (!state) return undefined;
    // Return a copy to prevent external mutation
    return { ...state };
  }

  processFire(
    command: FireCommand,
    playerCapsules: Map<number, Capsule>,
    currentTime: number
  ): Result<HitResult | null, string> {
    const shooterState = this.playerStates.get(command.playerId);
    if (!shooterState) {
      return Err('Player not found');
    }

    if (shooterState.isDead) {
      return Err('Cannot fire while dead');
    }

    // Check fire rate
    if (currentTime - shooterState.lastFireTime < this.config.fireRateCooldownMs) {
      return Err('Fire rate exceeded');
    }

    shooterState.lastFireTime = currentTime;

    // Emit fire event
    this.eventBus?.emit({
      type: 'weapon_fired',
      timestamp: currentTime,
      playerId: command.playerId,
      originX: command.origin.x,
      originY: command.origin.y,
      originZ: command.origin.z,
      directionX: command.direction.x,
      directionY: command.direction.y,
      directionZ: command.direction.z,
    });

    // Raycast against world geometry first
    const worldHit = this.collisionWorld?.raycast(
      command.origin,
      command.direction,
      this.config.weaponRange
    );

    // Check against player capsules
    let closestHit: HitResult | null = null;
    let closestDistance = worldHit?.distance ?? this.config.weaponRange;

    playerCapsules.forEach((capsule, targetId) => {
      if (targetId === command.playerId) return; // Can't shoot self

      const targetState = this.playerStates.get(targetId);
      if (!targetState || targetState.isDead) return;
      if (currentTime < targetState.invulnerableUntil) return; // Invulnerable

      const hit = this.raycastCapsule(command.origin, command.direction, capsule, closestDistance);
      if (hit && hit.distance < closestDistance) {
        closestDistance = hit.distance;
        closestHit = {
          targetId,
          hitPosition: hit.point,
          damage: this.config.weaponDamage,
        };
      }
    });

    if (closestHit !== null) {
      const hit = closestHit as HitResult;
      this.eventBus?.emit({
        type: 'hit_confirmed',
        timestamp: currentTime,
        shooterId: command.playerId,
        targetId: hit.targetId,
        hitPositionX: hit.hitPosition.x,
        hitPositionY: hit.hitPosition.y,
        hitPositionZ: hit.hitPosition.z,
        damage: hit.damage,
      });
    }

    return Ok(closestHit);
  }

  applyDamage(
    victimId: number,
    attackerId: number,
    damage: number,
    hitPosition: Vector3,
    currentTime: number
  ): void {
    const victimState = this.playerStates.get(victimId);
    if (!victimState || victimState.isDead) return;

    victimState.health = Math.max(0, victimState.health - damage);

    this.eventBus?.emit({
      type: 'player_damaged',
      timestamp: currentTime,
      victimId,
      attackerId,
      damage,
      hitPositionX: hitPosition.x,
      hitPositionY: hitPosition.y,
      hitPositionZ: hitPosition.z,
    });

    if (victimState.health <= 0) {
      victimState.isDead = true;
      victimState.deathTime = currentTime;
      victimState.respawnTime = currentTime + this.config.respawnTimeMs;

      this.eventBus?.emit({
        type: 'player_death',
        timestamp: currentTime,
        victimId,
        killerId: attackerId,
        positionX: hitPosition.x,
        positionY: hitPosition.y,
        positionZ: hitPosition.z,
      });
    }
  }

  update(currentTime: number): number[] {
    const readyToRespawn: number[] = [];

    this.playerStates.forEach((state, playerId) => {
      if (state.isDead && state.respawnTime && currentTime >= state.respawnTime) {
        readyToRespawn.push(playerId);
      }
    });

    return readyToRespawn;
  }

  respawnPlayer(playerId: number, currentTime: number): void {
    const state = this.playerStates.get(playerId);
    if (!state) return;

    state.health = this.config.maxHealth;
    state.isDead = false;
    state.deathTime = null;
    state.respawnTime = null;
    state.invulnerableUntil = currentTime + this.config.invulnerabilityDurationMs;
  }

  /**
   * Raycast against a capsule (simplified sphere intersection)
   */
  private raycastCapsule(
    origin: Vector3,
    direction: Vector3,
    capsule: Capsule,
    maxDistance: number
  ): { point: Vector3; distance: number } | null {
    // Simplified: treat capsule as sphere at center
    // Production would use proper capsule-ray intersection
    const center = capsule.center;
    const radius = capsule.radius + 0.2; // Slightly larger for hit detection

    const oc = origin.subtract(center);
    const dir = direction.normalize();
    const a = dir.dot(dir);
    const b = 2 * oc.dot(dir);
    const c = oc.dot(oc) - radius * radius;
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) return null;

    const t = (-b - Math.sqrt(discriminant)) / (2 * a);
    if (t < 0 || t > maxDistance) return null;

    return {
      point: origin.add(dir.scale(t)),
      distance: t,
    };
  }
}
