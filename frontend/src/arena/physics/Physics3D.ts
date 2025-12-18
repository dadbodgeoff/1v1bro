/**
 * Physics3D - Deterministic 3D physics simulation
 * 
 * Handles player movement, gravity, jumping, and collision response.
 * Designed to produce identical results on client and server for prediction.
 */

import { Vector3 } from '../math/Vector3';
import { Capsule } from './Capsule';
import type { ICollisionWorld } from './CollisionWorld';
import type { IEventBus } from '../core/EventBus';
import type { LandImpactEvent, JumpEvent } from '../core/GameEvents';

export interface PhysicsConfig {
  readonly gravity: number;              // -20 units/sec²
  readonly maxSpeed: number;             // 7 m/s
  readonly acceleration: number;         // 70 m/s² (0 to max in 0.1s)
  readonly friction: number;             // 140 m/s² (max to 0 in 0.05s)
  readonly airControl: number;           // 0.3 (30% of ground accel)
  readonly jumpVelocity: number;         // 8 m/s
  readonly terminalVelocity: number;     // 50 m/s
  readonly coyoteTime: number;           // 0.1 seconds
  readonly landingPenaltyDuration: number; // 0.05 seconds
  readonly landingPenaltyFactor: number;   // 0.5
  readonly groundCheckDistance: number;    // 0.1 units
}

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  gravity: -20,
  maxSpeed: 7,
  acceleration: 70,
  friction: 140,
  airControl: 0.3,
  jumpVelocity: 8,
  terminalVelocity: 50,
  coyoteTime: 0.1,
  landingPenaltyDuration: 0.05,
  landingPenaltyFactor: 0.5,
  groundCheckDistance: 0.1
};

export interface PlayerPhysicsState {
  position: Vector3;
  velocity: Vector3;
  isGrounded: boolean;
  lastGroundedTime: number;
  landingPenaltyEndTime: number;
}

export interface MovementInput {
  readonly forward: number;   // -1 to 1
  readonly right: number;     // -1 to 1
  readonly jump: boolean;
  readonly yaw: number;       // radians
}

export interface IPhysics3D {
  step(
    state: PlayerPhysicsState,
    input: MovementInput,
    deltaTime: number,
    currentTime: number,
    playerId?: number
  ): PlayerPhysicsState;
}

export function createInitialPhysicsState(position: Vector3 = Vector3.ZERO): PlayerPhysicsState {
  return {
    position,
    velocity: Vector3.ZERO,
    isGrounded: false,
    lastGroundedTime: 0,
    landingPenaltyEndTime: 0
  };
}

export class Physics3D implements IPhysics3D {
  private readonly config: PhysicsConfig;
  private readonly collisionWorld: ICollisionWorld;
  private readonly eventBus: IEventBus;

  constructor(
    config: PhysicsConfig,
    collisionWorld: ICollisionWorld,
    eventBus: IEventBus
  ) {
    this.config = config;
    this.collisionWorld = collisionWorld;
    this.eventBus = eventBus;
  }

  /**
   * Advance physics simulation by one step
   * Order: gravity → input → friction → collision → ground check
   */
  step(
    state: PlayerPhysicsState,
    input: MovementInput,
    deltaTime: number,
    currentTime: number,
    playerId: number = 0
  ): PlayerPhysicsState {
    let { position, velocity, isGrounded, lastGroundedTime, landingPenaltyEndTime } = state;

    // 1. Apply gravity if airborne
    if (!isGrounded) {
      velocity = this.applyGravity(velocity, deltaTime);
    }

    // 2. Calculate movement direction in world space
    const moveDir = this.calculateMoveDirection(input);

    // 3. Apply acceleration/friction based on grounded state
    const accelFactor = isGrounded ? 1.0 : this.config.airControl;
    const speedFactor = currentTime < landingPenaltyEndTime ? this.config.landingPenaltyFactor : 1.0;
    
    velocity = this.applyMovement(velocity, moveDir, accelFactor, speedFactor, deltaTime, isGrounded);

    // 4. Handle jump
    if (input.jump && this.canJump(isGrounded, lastGroundedTime, currentTime)) {
      velocity = new Vector3(velocity.x, this.config.jumpVelocity, velocity.z);
      isGrounded = false;
      this.eventBus.emit<JumpEvent>({
        type: 'jump',
        timestamp: currentTime,
        playerId
      });
    }

    // 5. Clamp to terminal velocity
    velocity = this.clampVelocity(velocity);

    // 6. Move and resolve collisions
    const newPosition = position.add(velocity.scale(deltaTime));
    const capsule = new Capsule(newPosition);
    const resolved = this.collisionWorld.resolveCollisions(capsule, velocity);
    
    // Store velocity before collision resolution for landing check
    const velocityBeforeCollision = velocity;
    
    position = resolved.position;
    velocity = resolved.velocity;

    // 7. Ground check
    const wasGrounded = isGrounded;
    isGrounded = this.checkGrounded(position);

    // 8. Update grounded time and landing penalty
    if (isGrounded) {
      lastGroundedTime = currentTime;
      
      // Apply landing penalty if just landed from a fall
      // Use velocity before collision to detect significant falls
      if (!wasGrounded && velocityBeforeCollision.y < -2) {
        const fallSpeed = Math.abs(velocityBeforeCollision.y);
        const fallHeight = (fallSpeed * fallSpeed) / (2 * Math.abs(this.config.gravity));
        if (fallHeight > 1) {
          landingPenaltyEndTime = currentTime + this.config.landingPenaltyDuration;
          this.eventBus.emit<LandImpactEvent>({
            type: 'land_impact',
            timestamp: currentTime,
            playerId,
            fallHeight
          });
        }
      }
    }

    return {
      position,
      velocity,
      isGrounded,
      lastGroundedTime,
      landingPenaltyEndTime
    };
  }

  /**
   * Apply gravity acceleration to velocity
   */
  private applyGravity(velocity: Vector3, deltaTime: number): Vector3 {
    return new Vector3(
      velocity.x,
      velocity.y + this.config.gravity * deltaTime,
      velocity.z
    );
  }

  /**
   * Calculate world-space movement direction from input
   */
  private calculateMoveDirection(input: MovementInput): Vector3 {
    // Forward is negative Z in our coordinate system
    const forward = new Vector3(
      -Math.sin(input.yaw),
      0,
      -Math.cos(input.yaw)
    );
    const right = new Vector3(
      Math.cos(input.yaw),
      0,
      -Math.sin(input.yaw)
    );

    let dir = Vector3.ZERO;
    dir = dir.add(forward.scale(input.forward));
    dir = dir.add(right.scale(input.right));

    // Normalize diagonal movement
    const mag = dir.magnitude();
    if (mag > 1) {
      dir = dir.scale(1 / mag);
    }

    return dir;
  }

  /**
   * Apply movement acceleration and friction
   */
  private applyMovement(
    velocity: Vector3,
    moveDir: Vector3,
    accelFactor: number,
    speedFactor: number,
    deltaTime: number,
    isGrounded: boolean
  ): Vector3 {
    // Get horizontal velocity
    const horizontalVel = velocity.horizontal();
    const currentSpeed = horizontalVel.magnitude();
    const maxSpeed = this.config.maxSpeed * speedFactor;

    let newHorizontalVel: Vector3;

    if (moveDir.magnitudeSquared() > 0.001) {
      // Apply acceleration toward desired direction
      const accel = this.config.acceleration * accelFactor * deltaTime;
      const desiredVel = moveDir.scale(maxSpeed);
      const velDiff = desiredVel.subtract(horizontalVel);
      
      if (velDiff.magnitude() <= accel) {
        newHorizontalVel = desiredVel;
      } else {
        newHorizontalVel = horizontalVel.add(velDiff.normalize().scale(accel));
      }
    } else if (isGrounded) {
      // Apply friction when no input and grounded
      const friction = this.config.friction * deltaTime;
      if (currentSpeed <= friction) {
        newHorizontalVel = Vector3.ZERO;
      } else {
        newHorizontalVel = horizontalVel.scale(1 - friction / currentSpeed);
      }
    } else {
      // No friction in air
      newHorizontalVel = horizontalVel;
    }

    return new Vector3(newHorizontalVel.x, velocity.y, newHorizontalVel.z);
  }

  /**
   * Check if player can jump (grounded or within coyote time)
   */
  private canJump(isGrounded: boolean, lastGroundedTime: number, currentTime: number): boolean {
    if (isGrounded) return true;
    return (currentTime - lastGroundedTime) <= this.config.coyoteTime;
  }

  /**
   * Clamp velocity to terminal velocity
   */
  private clampVelocity(velocity: Vector3): Vector3 {
    const mag = velocity.magnitude();
    if (mag > this.config.terminalVelocity) {
      return velocity.scale(this.config.terminalVelocity / mag);
    }
    return velocity;
  }

  /**
   * Check if player is on ground using downward raycast
   */
  private checkGrounded(position: Vector3): boolean {
    const rayOrigin = new Vector3(position.x, position.y + 0.1, position.z);
    const rayDir = Vector3.DOWN;
    const result = this.collisionWorld.raycast(rayOrigin, rayDir, this.config.groundCheckDistance + 0.1);
    return result !== null;
  }
}
