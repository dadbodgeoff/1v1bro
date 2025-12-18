/**
 * BotVisualController - Handles smooth bot visual interpolation
 *
 * Extracted from ArenaPlayTest.tsx to provide reusable bot visual movement
 * with human-like acceleration/deceleration and smooth rotation.
 *
 * @module bot/BotVisualController
 */

import * as THREE from 'three';
import type { Vector3 } from '../math/Vector3';
import { AnimationLOD } from '../rendering/PerformanceOptimizer';

/**
 * Configuration for bot visual interpolation
 */
export interface BotVisualConfig {
  /** Position smoothing factor (lower = smoother/more human) */
  positionLerp: number;
  /** Rotation smoothing factor (lower = smoother turns) */
  rotationLerp: number;
  /** Acceleration rate (units/sec²) */
  acceleration: number;
  /** Deceleration rate (units/sec²) */
  deceleration: number;
  /** Maximum visual speed cap */
  maxSpeed: number;
}

/**
 * Default configuration values - tuned for human-like movement
 */
export const DEFAULT_BOT_VISUAL_CONFIG: BotVisualConfig = {
  positionLerp: 6,
  rotationLerp: 5,
  acceleration: 8,
  deceleration: 12,
  maxSpeed: 5.0,
};

/**
 * BotVisualController manages smooth visual interpolation for bot entities.
 * 
 * Features:
 * - Position lerping with acceleration/deceleration for human-like motion
 * - Rotation smoothing with angle wrapping for natural turns
 * - Animation mixer updates with LOD for performance
 * - Instant reset for spawn/respawn (no lerp teleport)
 */
export class BotVisualController {
  private mesh: THREE.Object3D | null = null;
  private visualPos: THREE.Vector3;
  private visualVel: THREE.Vector3;
  private visualRotY: number = 0;
  private config: BotVisualConfig;
  private animationMixer: THREE.AnimationMixer | null = null;
  private animationLOD: AnimationLOD;
  private isInitialized: boolean = false;

  constructor(config: BotVisualConfig = DEFAULT_BOT_VISUAL_CONFIG) {
    this.config = { ...config };
    this.visualPos = new THREE.Vector3(0, 0, 0);
    this.visualVel = new THREE.Vector3(0, 0, 0);
    this.animationLOD = new AnimationLOD();
  }

  /**
   * Initialize with a mesh and optional animation mixer
   */
  initialize(
    mesh: THREE.Object3D,
    initialPosition: Vector3,
    animationMixer?: THREE.AnimationMixer
  ): void {
    this.mesh = mesh;
    this.animationMixer = animationMixer ?? null;
    this.visualPos.set(initialPosition.x, initialPosition.y, initialPosition.z);
    this.visualVel.set(0, 0, 0);
    this.visualRotY = 0;
    this.isInitialized = true;

    // Apply initial position to mesh
    if (this.mesh) {
      this.mesh.position.copy(this.visualPos);
    }
  }

  /**
   * Update visual position toward target with human-like motion
   * 
   * @param targetPosition - Logical bot position to lerp toward
   * @param targetRotation - Target Y rotation (radians), or null to use movement direction
   * @param deltaTime - Time since last frame in seconds
   * @param moveDirection - Optional movement direction for rotation fallback
   */
  update(
    targetPosition: Vector3,
    targetRotation: number | null,
    deltaTime: number,
    moveDirection?: { x: number; z: number }
  ): void {
    if (!this.isInitialized || !this.mesh) return;

    const { positionLerp, acceleration, deceleration, maxSpeed, rotationLerp } = this.config;

    // Target position (with Y offset for visual height)
    const targetX = targetPosition.x;
    const targetY = targetPosition.y;
    const targetZ = targetPosition.z;

    // Calculate direction to target
    const toTargetX = targetX - this.visualPos.x;
    const toTargetZ = targetZ - this.visualPos.z;
    const distToTarget = Math.sqrt(toTargetX * toTargetX + toTargetZ * toTargetZ);

    if (distToTarget > 0.01) {
      // Normalize direction
      const dirX = toTargetX / distToTarget;
      const dirZ = toTargetZ / distToTarget;

      // Accelerate toward target
      const accel = acceleration * deltaTime;
      this.visualVel.x += dirX * accel;
      this.visualVel.z += dirZ * accel;

      // Clamp to max speed
      const currentSpeed = Math.sqrt(this.visualVel.x ** 2 + this.visualVel.z ** 2);
      if (currentSpeed > maxSpeed) {
        const scale = maxSpeed / currentSpeed;
        this.visualVel.x *= scale;
        this.visualVel.z *= scale;
      }

      // Apply velocity
      this.visualPos.x += this.visualVel.x * deltaTime;
      this.visualPos.z += this.visualVel.z * deltaTime;

      // Smooth lerp for final approach (prevents overshooting)
      const lerpFactor = 1 - Math.exp(-positionLerp * deltaTime);
      this.visualPos.x += (targetX - this.visualPos.x) * lerpFactor * 0.3;
      this.visualPos.z += (targetZ - this.visualPos.z) * lerpFactor * 0.3;
    } else {
      // Close enough - decelerate
      const decel = deceleration * deltaTime;
      const speed = Math.sqrt(this.visualVel.x ** 2 + this.visualVel.z ** 2);
      if (speed > decel) {
        const scale = (speed - decel) / speed;
        this.visualVel.x *= scale;
        this.visualVel.z *= scale;
      } else {
        this.visualVel.x = 0;
        this.visualVel.z = 0;
      }
    }

    // Y position just lerps (no physics needed for vertical)
    const yLerp = 1 - Math.exp(-positionLerp * deltaTime);
    this.visualPos.y += (targetY - this.visualPos.y) * yLerp;

    // Apply smoothed position to mesh
    this.mesh.position.copy(this.visualPos);

    // Calculate target rotation
    let targetRotY = this.visualRotY;
    if (targetRotation !== null) {
      targetRotY = targetRotation;
    } else if (moveDirection && (Math.abs(moveDirection.x) > 0.01 || Math.abs(moveDirection.z) > 0.01)) {
      targetRotY = Math.atan2(moveDirection.x, moveDirection.z);
    }

    // Smooth rotation interpolation (handle angle wrapping)
    let rotDiff = targetRotY - this.visualRotY;
    // Wrap to [-PI, PI] for shortest rotation path
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
    this.visualRotY += rotDiff * (1 - Math.exp(-rotationLerp * deltaTime));
    this.mesh.rotation.y = this.visualRotY;
  }

  /**
   * Reset visual position instantly (for spawn/respawn - no lerp teleport)
   */
  resetPosition(position: Vector3): void {
    this.visualPos.set(position.x, position.y, position.z);
    this.visualVel.set(0, 0, 0);

    if (this.mesh) {
      this.mesh.position.copy(this.visualPos);
    }
  }

  /**
   * Update animation mixer with LOD based on distance to camera
   */
  updateAnimation(deltaTime: number, distanceToCamera: number): void {
    if (!this.animationMixer) return;

    // Animation LOD: reduce update frequency for distant bots
    if (this.animationLOD.shouldUpdate(distanceToCamera)) {
      const timeMultiplier = this.animationLOD.getTimeMultiplier(distanceToCamera);
      this.animationMixer.update(deltaTime * timeMultiplier);
    }
  }

  /**
   * Set visibility (for death/respawn)
   */
  setVisible(visible: boolean): void {
    if (this.mesh) {
      this.mesh.visible = visible;
    }
  }

  /**
   * Get current visual position
   */
  getVisualPosition(): THREE.Vector3 {
    return this.visualPos.clone();
  }

  /**
   * Get current visual rotation (Y axis)
   */
  getVisualRotation(): number {
    return this.visualRotY;
  }

  /**
   * Get current visual velocity
   */
  getVisualVelocity(): THREE.Vector3 {
    return this.visualVel.clone();
  }

  /**
   * Set animation mixer (for late binding after model load)
   */
  setAnimationMixer(mixer: THREE.AnimationMixer): void {
    this.animationMixer = mixer;
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<BotVisualConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get the mesh object (for accessing userData like animation mixer)
   */
  getMesh(): THREE.Object3D | null {
    return this.mesh;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.mesh = null;
    this.animationMixer = null;
    this.isInitialized = false;
  }
}
