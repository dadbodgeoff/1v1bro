/**
 * InputManager Unit Tests
 *
 * Tests for client-side input capture and processing.
 * _Requirements: 5.1, 14.5_
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InputManager, DEFAULT_INPUT_CONFIG, InputConfig } from './InputManager';
import { EventBus, IEventBus } from '../core/EventBus';
import { PointerLockedEvent, PointerReleasedEvent } from '../core/GameEvents';

// Mock document.exitPointerLock globally
const mockExitPointerLock = vi.fn();
Object.defineProperty(document, 'exitPointerLock', {
  value: mockExitPointerLock,
  configurable: true,
  writable: true,
});

// Mock canvas element
function createMockCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.requestPointerLock = vi.fn();
  return canvas;
}

// Helper to create keyboard event
function createKeyboardEvent(type: 'keydown' | 'keyup', code: string): KeyboardEvent {
  return new KeyboardEvent(type, { code, bubbles: true });
}

// Helper to create mouse event
function createMouseEvent(
  type: 'mousemove' | 'mousedown' | 'mouseup',
  options: { movementX?: number; movementY?: number; button?: number } = {}
): MouseEvent {
  return new MouseEvent(type, {
    movementX: options.movementX ?? 0,
    movementY: options.movementY ?? 0,
    button: options.button ?? 0,
    bubbles: true,
  });
}

describe('InputManager', () => {
  let inputManager: InputManager;
  let eventBus: IEventBus;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    eventBus = new EventBus();
    inputManager = new InputManager(DEFAULT_INPUT_CONFIG, eventBus);
    canvas = createMockCanvas();
    mockExitPointerLock.mockClear();
    // Reset pointerLockElement to null
    Object.defineProperty(document, 'pointerLockElement', {
      value: null,
      configurable: true,
    });
  });

  afterEach(() => {
    inputManager.dispose();
  });

  describe('initialization', () => {
    it('initializes without errors', () => {
      expect(() => inputManager.initialize(canvas)).not.toThrow();
    });

    it('pointer is not locked initially', () => {
      inputManager.initialize(canvas);
      expect(inputManager.isPointerLocked()).toBe(false);
    });
  });

  describe('dispose', () => {
    it('disposes without errors', () => {
      inputManager.initialize(canvas);
      expect(() => inputManager.dispose()).not.toThrow();
    });

    it('can dispose without initializing', () => {
      expect(() => inputManager.dispose()).not.toThrow();
    });
  });

  describe('captureFrame', () => {
    it('returns InputPacket with correct structure', () => {
      inputManager.initialize(canvas);
      const packet = inputManager.captureFrame(1, 100, 1000.5);

      expect(packet).toHaveProperty('sequenceNumber', 1);
      expect(packet).toHaveProperty('tickNumber', 100);
      expect(packet).toHaveProperty('movementX');
      expect(packet).toHaveProperty('movementY');
      expect(packet).toHaveProperty('lookDeltaX');
      expect(packet).toHaveProperty('lookDeltaY');
      expect(packet).toHaveProperty('buttons');
      expect(packet).toHaveProperty('clientTimestamp', 1000.5);
    });

    it('returns zero movement when no keys pressed', () => {
      inputManager.initialize(canvas);
      const packet = inputManager.captureFrame(1, 100, 1000);

      expect(packet.movementX).toBe(0);
      expect(packet.movementY).toBe(0);
    });

    it('returns zero look delta when no mouse movement', () => {
      inputManager.initialize(canvas);
      const packet = inputManager.captureFrame(1, 100, 1000);

      expect(packet.lookDeltaX).toBe(0);
      expect(packet.lookDeltaY).toBe(0);
    });

    it('returns zero buttons when no buttons pressed', () => {
      inputManager.initialize(canvas);
      const packet = inputManager.captureFrame(1, 100, 1000);

      expect(packet.buttons).toBe(0);
    });
  });

  describe('input normalization for diagonal movement', () => {
    it('normalizes diagonal movement to unit length', () => {
      inputManager.initialize(canvas);

      // Simulate pointer lock
      Object.defineProperty(document, 'pointerLockElement', {
        value: canvas,
        configurable: true,
      });
      document.dispatchEvent(new Event('pointerlockchange'));

      // Press W and D for diagonal movement
      document.dispatchEvent(createKeyboardEvent('keydown', 'KeyW'));
      document.dispatchEvent(createKeyboardEvent('keydown', 'KeyD'));

      const packet = inputManager.captureFrame(1, 100, 1000);

      // Diagonal movement should be normalized
      const magnitude = Math.sqrt(
        packet.movementX * packet.movementX + packet.movementY * packet.movementY
      );
      expect(magnitude).toBeCloseTo(1, 5);
    });

    it('forward movement is +1 on Y axis', () => {
      inputManager.initialize(canvas);

      // Simulate pointer lock
      Object.defineProperty(document, 'pointerLockElement', {
        value: canvas,
        configurable: true,
      });
      document.dispatchEvent(new Event('pointerlockchange'));

      document.dispatchEvent(createKeyboardEvent('keydown', 'KeyW'));
      const packet = inputManager.captureFrame(1, 100, 1000);

      expect(packet.movementX).toBe(0);
      expect(packet.movementY).toBe(1);
    });

    it('backward movement is -1 on Y axis', () => {
      inputManager.initialize(canvas);

      Object.defineProperty(document, 'pointerLockElement', {
        value: canvas,
        configurable: true,
      });
      document.dispatchEvent(new Event('pointerlockchange'));

      document.dispatchEvent(createKeyboardEvent('keydown', 'KeyS'));
      const packet = inputManager.captureFrame(1, 100, 1000);

      expect(packet.movementX).toBe(0);
      expect(packet.movementY).toBe(-1);
    });

    it('right movement is +1 on X axis', () => {
      inputManager.initialize(canvas);

      Object.defineProperty(document, 'pointerLockElement', {
        value: canvas,
        configurable: true,
      });
      document.dispatchEvent(new Event('pointerlockchange'));

      document.dispatchEvent(createKeyboardEvent('keydown', 'KeyD'));
      const packet = inputManager.captureFrame(1, 100, 1000);

      expect(packet.movementX).toBe(1);
      expect(packet.movementY).toBe(0);
    });

    it('left movement is -1 on X axis', () => {
      inputManager.initialize(canvas);

      Object.defineProperty(document, 'pointerLockElement', {
        value: canvas,
        configurable: true,
      });
      document.dispatchEvent(new Event('pointerlockchange'));

      document.dispatchEvent(createKeyboardEvent('keydown', 'KeyA'));
      const packet = inputManager.captureFrame(1, 100, 1000);

      expect(packet.movementX).toBe(-1);
      expect(packet.movementY).toBe(0);
    });

    it('opposite keys cancel out', () => {
      inputManager.initialize(canvas);

      Object.defineProperty(document, 'pointerLockElement', {
        value: canvas,
        configurable: true,
      });
      document.dispatchEvent(new Event('pointerlockchange'));

      // Press both W and S
      document.dispatchEvent(createKeyboardEvent('keydown', 'KeyW'));
      document.dispatchEvent(createKeyboardEvent('keydown', 'KeyS'));
      const packet = inputManager.captureFrame(1, 100, 1000);

      expect(packet.movementY).toBe(0);
    });
  });

  describe('pointer lock state management', () => {
    it('requestPointerLock calls canvas.requestPointerLock', () => {
      inputManager.initialize(canvas);
      inputManager.requestPointerLock();

      expect(canvas.requestPointerLock).toHaveBeenCalled();
    });

    it('emits pointer_locked event when pointer is locked', () => {
      inputManager.initialize(canvas);
      const handler = vi.fn();
      eventBus.on<PointerLockedEvent>('pointer_locked', handler);

      // Simulate pointer lock
      Object.defineProperty(document, 'pointerLockElement', {
        value: canvas,
        configurable: true,
      });
      document.dispatchEvent(new Event('pointerlockchange'));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(inputManager.isPointerLocked()).toBe(true);
    });

    it('emits pointer_released event when pointer is unlocked', () => {
      inputManager.initialize(canvas);
      const handler = vi.fn();
      eventBus.on<PointerReleasedEvent>('pointer_released', handler);

      // First lock
      Object.defineProperty(document, 'pointerLockElement', {
        value: canvas,
        configurable: true,
      });
      document.dispatchEvent(new Event('pointerlockchange'));

      // Then unlock
      Object.defineProperty(document, 'pointerLockElement', {
        value: null,
        configurable: true,
      });
      document.dispatchEvent(new Event('pointerlockchange'));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(inputManager.isPointerLocked()).toBe(false);
    });

    it('resets input state when pointer is released', () => {
      inputManager.initialize(canvas);

      // Lock and press keys
      Object.defineProperty(document, 'pointerLockElement', {
        value: canvas,
        configurable: true,
      });
      document.dispatchEvent(new Event('pointerlockchange'));
      document.dispatchEvent(createKeyboardEvent('keydown', 'KeyW'));

      // Verify key is pressed
      let packet = inputManager.captureFrame(1, 100, 1000);
      expect(packet.movementY).toBe(1);

      // Unlock
      Object.defineProperty(document, 'pointerLockElement', {
        value: null,
        configurable: true,
      });
      document.dispatchEvent(new Event('pointerlockchange'));

      // Input should be reset
      packet = inputManager.captureFrame(2, 101, 1016);
      expect(packet.movementY).toBe(0);
    });
  });

  describe('keyboard input', () => {
    it('ignores keyboard input when pointer is not locked', () => {
      inputManager.initialize(canvas);

      // Press W without pointer lock
      document.dispatchEvent(createKeyboardEvent('keydown', 'KeyW'));
      const packet = inputManager.captureFrame(1, 100, 1000);

      expect(packet.movementY).toBe(0);
    });

    it('processes keyboard input when pointer is locked', () => {
      inputManager.initialize(canvas);

      Object.defineProperty(document, 'pointerLockElement', {
        value: canvas,
        configurable: true,
      });
      document.dispatchEvent(new Event('pointerlockchange'));

      document.dispatchEvent(createKeyboardEvent('keydown', 'KeyW'));
      const packet = inputManager.captureFrame(1, 100, 1000);

      expect(packet.movementY).toBe(1);
    });

    it('keyup releases key state', () => {
      inputManager.initialize(canvas);

      Object.defineProperty(document, 'pointerLockElement', {
        value: canvas,
        configurable: true,
      });
      document.dispatchEvent(new Event('pointerlockchange'));

      document.dispatchEvent(createKeyboardEvent('keydown', 'KeyW'));
      document.dispatchEvent(createKeyboardEvent('keyup', 'KeyW'));
      const packet = inputManager.captureFrame(1, 100, 1000);

      expect(packet.movementY).toBe(0);
    });

    it('Space sets jump button flag', () => {
      inputManager.initialize(canvas);

      Object.defineProperty(document, 'pointerLockElement', {
        value: canvas,
        configurable: true,
      });
      document.dispatchEvent(new Event('pointerlockchange'));

      document.dispatchEvent(createKeyboardEvent('keydown', 'Space'));
      const packet = inputManager.captureFrame(1, 100, 1000);

      expect(packet.buttons & 0x01).toBe(0x01);
    });
  });

  describe('mouse input', () => {
    it('accumulates mouse movement', () => {
      inputManager.initialize(canvas);

      Object.defineProperty(document, 'pointerLockElement', {
        value: canvas,
        configurable: true,
      });
      document.dispatchEvent(new Event('pointerlockchange'));

      document.dispatchEvent(createMouseEvent('mousemove', { movementX: 10, movementY: 5 }));
      document.dispatchEvent(createMouseEvent('mousemove', { movementX: 20, movementY: 15 }));

      const packet = inputManager.captureFrame(1, 100, 1000);

      expect(packet.lookDeltaX).toBe(30);
      expect(packet.lookDeltaY).toBe(20);
    });

    it('resets accumulated mouse movement after capture', () => {
      inputManager.initialize(canvas);

      Object.defineProperty(document, 'pointerLockElement', {
        value: canvas,
        configurable: true,
      });
      document.dispatchEvent(new Event('pointerlockchange'));

      document.dispatchEvent(createMouseEvent('mousemove', { movementX: 10, movementY: 5 }));
      inputManager.captureFrame(1, 100, 1000);

      const packet = inputManager.captureFrame(2, 101, 1016);
      expect(packet.lookDeltaX).toBe(0);
      expect(packet.lookDeltaY).toBe(0);
    });

    it('clamps look delta to maxLookDelta', () => {
      const config: InputConfig = {
        mouseSensitivity: 0.002,
        maxLookDelta: 100,
      };
      inputManager = new InputManager(config, eventBus);
      inputManager.initialize(canvas);

      Object.defineProperty(document, 'pointerLockElement', {
        value: canvas,
        configurable: true,
      });
      document.dispatchEvent(new Event('pointerlockchange'));

      document.dispatchEvent(createMouseEvent('mousemove', { movementX: 500, movementY: -500 }));
      const packet = inputManager.captureFrame(1, 100, 1000);

      expect(packet.lookDeltaX).toBe(100);
      expect(packet.lookDeltaY).toBe(-100);
    });

    it('ignores mouse movement when pointer is not locked', () => {
      inputManager.initialize(canvas);

      document.dispatchEvent(createMouseEvent('mousemove', { movementX: 100, movementY: 100 }));
      const packet = inputManager.captureFrame(1, 100, 1000);

      expect(packet.lookDeltaX).toBe(0);
      expect(packet.lookDeltaY).toBe(0);
    });

    it('left click sets fire button flag', () => {
      inputManager.initialize(canvas);

      Object.defineProperty(document, 'pointerLockElement', {
        value: canvas,
        configurable: true,
      });
      document.dispatchEvent(new Event('pointerlockchange'));

      document.dispatchEvent(createMouseEvent('mousedown', { button: 0 }));
      const packet = inputManager.captureFrame(1, 100, 1000);

      expect(packet.buttons & 0x02).toBe(0x02);
    });

    it('left click release clears fire button flag', () => {
      inputManager.initialize(canvas);

      Object.defineProperty(document, 'pointerLockElement', {
        value: canvas,
        configurable: true,
      });
      document.dispatchEvent(new Event('pointerlockchange'));

      document.dispatchEvent(createMouseEvent('mousedown', { button: 0 }));
      document.dispatchEvent(createMouseEvent('mouseup', { button: 0 }));
      const packet = inputManager.captureFrame(1, 100, 1000);

      expect(packet.buttons & 0x02).toBe(0);
    });
  });

  describe('escape key', () => {
    it('Escape key releases pointer lock', () => {
      inputManager.initialize(canvas);

      // Mock exitPointerLock
      const exitPointerLock = vi.fn();
      Object.defineProperty(document, 'exitPointerLock', {
        value: exitPointerLock,
        configurable: true,
      });

      Object.defineProperty(document, 'pointerLockElement', {
        value: canvas,
        configurable: true,
      });
      document.dispatchEvent(new Event('pointerlockchange'));

      document.dispatchEvent(createKeyboardEvent('keydown', 'Escape'));

      expect(exitPointerLock).toHaveBeenCalled();
    });
  });
});
