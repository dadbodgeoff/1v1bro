/**
 * InputManager - Client-side input capture and processing
 *
 * Layer 4: Client Systems - Captures keyboard and mouse input, manages pointer lock,
 * and packages inputs for network transmission.
 *
 * @example
 * const inputManager = new InputManager(config, eventBus);
 * inputManager.initialize(canvas);
 * const packet = inputManager.captureFrame(seq, tick, timestamp);
 */

import type { IEventBus } from '../core/EventBus';
import type { PointerLockedEvent, PointerReleasedEvent } from '../core/GameEvents';
import type { InputPacket } from '../network/Serializer';

/**
 * Configuration for input handling
 */
export interface InputConfig {
  /** Mouse sensitivity multiplier (default: 0.002) */
  readonly mouseSensitivity: number;
  /** Maximum look delta value for clamping (default: 32767) */
  readonly maxLookDelta: number;
}

export const DEFAULT_INPUT_CONFIG: InputConfig = {
  mouseSensitivity: 0.002,
  maxLookDelta: 32767,
};

/**
 * Raw input state from keyboard and mouse
 */
export interface RawInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  fire: boolean;
  mouseDeltaX: number;
  mouseDeltaY: number;
}

/**
 * Interface for input management
 */
export interface IInputManager {
  /** Initialize input handlers on a canvas element */
  initialize(canvas: HTMLCanvasElement): void;
  /** Clean up all event listeners */
  dispose(): void;
  /** Capture current frame input and return as InputPacket */
  captureFrame(sequenceNumber: number, tickNumber: number, timestamp: number): InputPacket;
  /** Check if pointer is currently locked */
  isPointerLocked(): boolean;
  /** Request pointer lock on the canvas */
  requestPointerLock(): void;
  /** Release pointer lock */
  releasePointerLock(): void;
}

/**
 * InputManager implementation
 *
 * Handles:
 * - WASD movement keys
 * - Space for jump
 * - Mouse movement for look
 * - Left click for fire
 * - Escape to release pointer lock
 * - Pointer lock management
 */
export class InputManager implements IInputManager {
  private canvas: HTMLCanvasElement | null = null;
  private pointerLocked = false;
  private currentInput: RawInput = this.createEmptyInput();
  private accumulatedMouseX = 0;
  private accumulatedMouseY = 0;
  private readonly config: InputConfig;
  private readonly eventBus: IEventBus;

  constructor(config: InputConfig, eventBus: IEventBus) {
    this.config = config;
    this.eventBus = eventBus;
  }

  /**
   * Initialize input handlers on a canvas element
   * Sets up keyboard, mouse, and pointer lock event listeners
   */
  initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;

    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);

    canvas.addEventListener('click', this.handleCanvasClick);
  }

  /**
   * Clean up all event listeners and release pointer lock
   */
  dispose(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);

    if (this.canvas) {
      this.canvas.removeEventListener('click', this.handleCanvasClick);
    }

    this.releasePointerLock();
    this.canvas = null;
  }

  /**
   * Capture current frame input and return as InputPacket
   *
   * Normalizes diagonal movement, clamps look delta, and resets accumulated mouse movement.
   * _Requirements: 5.1, 8.1, 8.2, 14.1, 14.2, 14.3, 14.5_
   */
  captureFrame(sequenceNumber: number, tickNumber: number, timestamp: number): InputPacket {
    // Calculate movement vector from key states
    let movementX = 0;
    let movementY = 0;

    if (this.currentInput.forward) movementY += 1;
    if (this.currentInput.backward) movementY -= 1;
    if (this.currentInput.right) movementX += 1;
    if (this.currentInput.left) movementX -= 1;

    // Normalize diagonal movement to prevent faster diagonal speed
    if (movementX !== 0 && movementY !== 0) {
      const mag = Math.sqrt(movementX * movementX + movementY * movementY);
      movementX /= mag;
      movementY /= mag;
    }

    // Build button flags bitfield
    let buttons = 0;
    if (this.currentInput.jump) buttons |= 0x01;
    if (this.currentInput.fire) buttons |= 0x02;

    // Capture and clamp accumulated mouse delta
    const lookDeltaX = Math.max(
      -this.config.maxLookDelta,
      Math.min(this.config.maxLookDelta, this.accumulatedMouseX)
    );
    const lookDeltaY = Math.max(
      -this.config.maxLookDelta,
      Math.min(this.config.maxLookDelta, this.accumulatedMouseY)
    );

    // Reset accumulated mouse movement for next frame
    this.accumulatedMouseX = 0;
    this.accumulatedMouseY = 0;

    return {
      sequenceNumber,
      tickNumber,
      movementX,
      movementY,
      lookDeltaX,
      lookDeltaY,
      buttons,
      clientTimestamp: timestamp,
    };
  }

  /**
   * Check if pointer is currently locked to the canvas
   */
  isPointerLocked(): boolean {
    return this.pointerLocked;
  }

  /**
   * Request pointer lock on the canvas
   * _Requirements: 14.1_
   */
  requestPointerLock(): void {
    this.canvas?.requestPointerLock();
  }

  /**
   * Release pointer lock
   * _Requirements: 14.5_
   */
  releasePointerLock(): void {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  /**
   * Handle keydown events - update key state when pressed
   * Only processes input when pointer is locked
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.pointerLocked) return;
    this.updateKeyState(event.code, true);
  };

  /**
   * Handle keyup events - update key state when released
   * Always processes to ensure keys are released even if pointer unlocks
   */
  private handleKeyUp = (event: KeyboardEvent): void => {
    this.updateKeyState(event.code, false);
  };

  /**
   * Update key state based on key code
   * _Requirements: 5.1, 14.2_
   */
  private updateKeyState(code: string, pressed: boolean): void {
    switch (code) {
      case 'KeyW':
        this.currentInput.forward = pressed;
        break;
      case 'KeyS':
        this.currentInput.backward = pressed;
        break;
      case 'KeyA':
        this.currentInput.left = pressed;
        break;
      case 'KeyD':
        this.currentInput.right = pressed;
        break;
      case 'Space':
        this.currentInput.jump = pressed;
        break;
      case 'Escape':
        if (pressed) this.releasePointerLock();
        break;
    }
  }

  /**
   * Handle mouse movement - accumulate delta for frame capture
   * Only processes when pointer is locked
   * _Requirements: 14.2_
   */
  private handleMouseMove = (event: MouseEvent): void => {
    if (!this.pointerLocked) return;
    this.accumulatedMouseX += event.movementX;
    this.accumulatedMouseY += event.movementY;
  };

  /**
   * Handle mouse button down - set fire state
   */
  private handleMouseDown = (event: MouseEvent): void => {
    if (!this.pointerLocked) return;
    if (event.button === 0) this.currentInput.fire = true;
  };

  /**
   * Handle mouse button up - clear fire state
   */
  private handleMouseUp = (event: MouseEvent): void => {
    if (event.button === 0) this.currentInput.fire = false;
  };

  /**
   * Handle pointer lock state changes
   * Emits events and resets input state when unlocked
   * _Requirements: 14.1, 14.5_
   */
  private handlePointerLockChange = (): void => {
    this.pointerLocked = document.pointerLockElement === this.canvas;

    if (this.pointerLocked) {
      this.eventBus.emit<PointerLockedEvent>({
        type: 'pointer_locked',
        timestamp: Date.now(),
      });
    } else {
      this.eventBus.emit<PointerReleasedEvent>({
        type: 'pointer_released',
        timestamp: Date.now(),
      });
      // Reset all input state when pointer is released
      this.currentInput = this.createEmptyInput();
    }
  };

  /**
   * Handle canvas click - request pointer lock
   */
  private handleCanvasClick = (): void => {
    this.requestPointerLock();
  };

  /**
   * Create empty input state with all keys/buttons released
   */
  private createEmptyInput(): RawInput {
    return {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      fire: false,
      mouseDeltaX: 0,
      mouseDeltaY: 0,
    };
  }
}
