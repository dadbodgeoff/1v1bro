/**
 * CameraController - First-person camera control with view bob
 *
 * Layer 4: Client Systems - Handles mouse look, pitch clamping, and procedural view bob.
 * Provides view matrix calculation for rendering.
 *
 * @example
 * const camera = new CameraController(config);
 * camera.applyLookDelta(mouseX, mouseY);
 * const viewMatrix = camera.getViewMatrix(playerPosition);
 */

import { Vector3 } from '../math/Vector3';

/**
 * Configuration for camera behavior
 */
export interface CameraConfig {
  /** Mouse sensitivity multiplier (default: 0.002) */
  readonly sensitivity: number;
  /** Maximum pitch angle in radians (default: 89 degrees) */
  readonly pitchLimit: number;
  /** View bob amplitude in units (default: 0.02) */
  readonly viewBobAmplitude: number;
  /** View bob frequency in Hz (default: 10) */
  readonly viewBobFrequency: number;
}

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  sensitivity: 0.002,
  pitchLimit: (89 * Math.PI) / 180, // 89 degrees in radians
  viewBobAmplitude: 0.02,
  viewBobFrequency: 10,
};

/**
 * Current camera state
 */
export interface CameraState {
  /** Vertical look angle in radians */
  pitch: number;
  /** Horizontal look angle in radians */
  yaw: number;
  /** Current view bob vertical offset */
  viewBobOffset: number;
}

/**
 * Interface for camera control
 */
export interface ICameraController {
  /** Apply mouse look delta to camera rotation */
  applyLookDelta(deltaX: number, deltaY: number): void;
  /** Update view bob based on movement state */
  updateViewBob(isMoving: boolean, speed: number, deltaTime: number): void;
  /** Get current camera state */
  getState(): CameraState;
  /** Get forward direction vector */
  getForwardVector(): Vector3;
  /** Get right direction vector */
  getRightVector(): Vector3;
  /** Calculate view matrix for rendering */
  getViewMatrix(position: Vector3): Float32Array;
  /** Reset camera to default orientation */
  reset(): void;
}

/**
 * CameraController implementation
 *
 * Features:
 * - Pitch clamping to ±89 degrees to prevent gimbal lock
 * - Yaw normalization to [-PI, PI]
 * - Procedural view bob synced to movement speed
 * - View matrix calculation for rendering
 *
 * _Requirements: 14.3, 14.4, 15.5_
 */
export class CameraController implements ICameraController {
  private pitch = 0;
  private yaw = 0;
  private viewBobPhase = 0;
  private viewBobOffset = 0;
  private readonly config: CameraConfig;

  constructor(config: CameraConfig) {
    this.config = config;
  }

  /**
   * Apply mouse look delta to camera rotation
   *
   * Pitch is clamped to ±pitchLimit to prevent camera flip.
   * Yaw is normalized to [-PI, PI] range.
   *
   * _Requirements: 14.3, 14.4_
   */
  applyLookDelta(deltaX: number, deltaY: number): void {
    this.yaw -= deltaX * this.config.sensitivity;
    this.pitch -= deltaY * this.config.sensitivity;

    // Clamp pitch to prevent camera flip (gimbal lock)
    this.pitch = Math.max(-this.config.pitchLimit, Math.min(this.config.pitchLimit, this.pitch));

    // Normalize yaw to [-PI, PI]
    while (this.yaw > Math.PI) this.yaw -= 2 * Math.PI;
    while (this.yaw < -Math.PI) this.yaw += 2 * Math.PI;
  }

  /**
   * Update view bob based on movement state
   *
   * When moving, applies sinusoidal vertical offset synced to speed.
   * When stopped, smoothly returns to center.
   *
   * _Requirements: 15.5_
   */
  updateViewBob(isMoving: boolean, speed: number, deltaTime: number): void {
    if (isMoving && speed > 0.1) {
      // Advance phase based on speed (normalized to max speed of 7 m/s)
      const frequency = this.config.viewBobFrequency * (speed / 7);
      this.viewBobPhase += frequency * deltaTime * 2 * Math.PI;
      this.viewBobOffset = Math.sin(this.viewBobPhase) * this.config.viewBobAmplitude;
    } else {
      // Smoothly return to center
      this.viewBobOffset *= 0.9;
      if (Math.abs(this.viewBobOffset) < 0.001) {
        this.viewBobOffset = 0;
        this.viewBobPhase = 0;
      }
    }
  }

  /**
   * Get current camera state
   */
  getState(): CameraState {
    return {
      pitch: this.pitch,
      yaw: this.yaw,
      viewBobOffset: this.viewBobOffset,
    };
  }

  /**
   * Get forward direction vector based on current pitch and yaw
   */
  getForwardVector(): Vector3 {
    return new Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    ).normalize();
  }

  /**
   * Get right direction vector based on current yaw
   */
  getRightVector(): Vector3 {
    return new Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();
  }

  /**
   * Calculate view matrix for rendering
   *
   * Eye position is at player position + eye height (1.6m) + view bob offset.
   */
  getViewMatrix(position: Vector3): Float32Array {
    const eye = new Vector3(position.x, position.y + 1.6 + this.viewBobOffset, position.z);
    const forward = this.getForwardVector();
    const target = eye.add(forward);
    const up = Vector3.UP;

    return this.lookAt(eye, target, up);
  }

  /**
   * Reset camera to default orientation
   */
  reset(): void {
    this.pitch = 0;
    this.yaw = 0;
    this.viewBobPhase = 0;
    this.viewBobOffset = 0;
  }

  /**
   * Calculate look-at view matrix
   */
  private lookAt(eye: Vector3, target: Vector3, up: Vector3): Float32Array {
    const zAxis = eye.subtract(target).normalize();
    const xAxis = up.cross(zAxis).normalize();
    const yAxis = zAxis.cross(xAxis);

    return new Float32Array([
      xAxis.x,
      yAxis.x,
      zAxis.x,
      0,
      xAxis.y,
      yAxis.y,
      zAxis.y,
      0,
      xAxis.z,
      yAxis.z,
      zAxis.z,
      0,
      -xAxis.dot(eye),
      -yAxis.dot(eye),
      -zAxis.dot(eye),
      1,
    ]);
  }
}
