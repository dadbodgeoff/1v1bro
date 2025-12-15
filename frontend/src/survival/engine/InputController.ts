/**
 * InputController - Enterprise-grade input handling for Survival Mode
 * Supports keyboard, touch, and gamepad with unified interface
 * 
 * Features:
 * - Keyboard input with key hold detection
 * - Advanced touch controls via TouchController
 * - Gamepad support (future)
 * - Input mode auto-detection
 * - Configurable key bindings
 */

import type { InputAction } from '../types/survival'
import { KEY_BINDINGS } from '../config/constants'
import { TouchController } from './TouchController'
import { getDeviceCapabilities } from '../config/device'
import { getMobileConfig } from '../config/mobile'

type InputCallback = (action: InputAction) => void
type InputMode = 'keyboard' | 'touch' | 'gamepad'

export class InputController {
  private callbacks: Set<InputCallback> = new Set()
  private activeKeys: Set<string> = new Set()
  private enabled: boolean = true
  
  // Touch controller for mobile
  private touchController: TouchController | null = null
  private touchUnsubscribe: (() => void) | null = null
  
  // Input mode tracking
  private currentMode: InputMode = 'keyboard'
  private lastInputTime: number = 0
  
  // Gamepad state (future)
  private gamepadIndex: number | null = null
  private gamepadPollInterval: number | null = null

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
    
    // Initialize touch controller if touch is supported
    const caps = getDeviceCapabilities()
    if (caps.touchSupported) {
      this.touchController = new TouchController()
      this.currentMode = caps.isMobile ? 'touch' : 'keyboard'
    }
  }

  /**
   * Start listening for input events
   */
  attach(container?: HTMLElement): void {
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    
    // Touch events via TouchController
    if (this.touchController) {
      this.touchController.attach(container)
      this.touchUnsubscribe = this.touchController.onInput((action) => {
        this.currentMode = 'touch'
        this.lastInputTime = performance.now()
        this.emit(action)
      })
    }
    
    // Gamepad connection events
    window.addEventListener('gamepadconnected', this.handleGamepadConnected)
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected)
  }

  /**
   * Stop listening for input events
   */
  detach(): void {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    window.removeEventListener('gamepadconnected', this.handleGamepadConnected)
    window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected)
    
    if (this.touchController) {
      this.touchController.detach()
    }
    
    if (this.touchUnsubscribe) {
      this.touchUnsubscribe()
      this.touchUnsubscribe = null
    }
    
    if (this.gamepadPollInterval) {
      clearInterval(this.gamepadPollInterval)
      this.gamepadPollInterval = null
    }
    
    this.activeKeys.clear()
  }

  /**
   * Register a callback for input actions
   */
  onInput(callback: InputCallback): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  /**
   * Enable/disable input processing
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.activeKeys.clear()
    }
    
    if (this.touchController) {
      this.touchController.setEnabled(enabled)
    }
  }

  /**
   * Check if a key is currently held
   */
  isKeyHeld(action: InputAction): boolean {
    const keys = KEY_BINDINGS[action as keyof typeof KEY_BINDINGS]
    if (!keys) return false
    return keys.some(key => this.activeKeys.has(key))
  }

  /**
   * AAA Feature: Get air control direction based on held keys
   * Returns -1 for left, 1 for right, 0 for neutral
   */
  getAirControlDirection(): number {
    const leftHeld = this.isKeyHeld('moveLeft')
    const rightHeld = this.isKeyHeld('moveRight')
    
    if (leftHeld && !rightHeld) return -1
    if (rightHeld && !leftHeld) return 1
    return 0
  }

  /**
   * Get current input mode
   */
  getInputMode(): InputMode {
    return this.currentMode
  }

  /**
   * Check if touch input is available
   */
  hasTouchSupport(): boolean {
    return this.touchController !== null
  }

  /**
   * Get touch controller for direct access
   */
  getTouchController(): TouchController | null {
    return this.touchController
  }

  /**
   * Update touch configuration
   */
  updateTouchConfig(): void {
    if (this.touchController) {
      const mobileConfig = getMobileConfig()
      this.touchController.updateConfig(mobileConfig.touch)
    }
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.enabled) return
    
    // Prevent default for game keys
    const action = this.getActionForKey(e.code)
    if (action) {
      e.preventDefault()
      
      // Only fire once per key press (not on repeat)
      if (!this.activeKeys.has(e.code)) {
        this.activeKeys.add(e.code)
        this.currentMode = 'keyboard'
        this.lastInputTime = performance.now()
        this.emit(action)
      }
    }
  }

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.activeKeys.delete(e.code)
  }

  private handleGamepadConnected = (e: GamepadEvent): void => {
    console.log('[InputController] Gamepad connected:', e.gamepad.id)
    this.gamepadIndex = e.gamepad.index
    this.startGamepadPolling()
  }

  private handleGamepadDisconnected = (e: GamepadEvent): void => {
    console.log('[InputController] Gamepad disconnected:', e.gamepad.id)
    if (this.gamepadIndex === e.gamepad.index) {
      this.gamepadIndex = null
      this.stopGamepadPolling()
    }
  }

  private startGamepadPolling(): void {
    if (this.gamepadPollInterval) return
    
    // Track button states for edge detection
    const buttonStates: boolean[] = []
    
    this.gamepadPollInterval = window.setInterval(() => {
      if (this.gamepadIndex === null || !this.enabled) return
      
      const gamepads = navigator.getGamepads()
      const gamepad = gamepads[this.gamepadIndex]
      if (!gamepad) return
      
      // Map gamepad buttons to actions
      const buttonMappings: [number, InputAction][] = [
        [0, 'jump'],      // A button
        [1, 'slide'],     // B button
        [12, 'jump'],     // D-pad up
        [13, 'slide'],    // D-pad down
        [14, 'moveLeft'], // D-pad left
        [15, 'moveRight'], // D-pad right
        [9, 'pause'],     // Start button
      ]
      
      for (const [buttonIndex, action] of buttonMappings) {
        const pressed = gamepad.buttons[buttonIndex]?.pressed || false
        const wasPressed = buttonStates[buttonIndex] || false
        
        // Edge detection - only fire on press, not hold
        if (pressed && !wasPressed) {
          this.currentMode = 'gamepad'
          this.lastInputTime = performance.now()
          this.emit(action)
        }
        
        buttonStates[buttonIndex] = pressed
      }
      
      // Analog stick for lane movement
      const leftStickX = gamepad.axes[0] || 0
      if (Math.abs(leftStickX) > 0.5) {
        // Debounce analog input
        const now = performance.now()
        if (now - this.lastInputTime > 200) {
          this.currentMode = 'gamepad'
          this.lastInputTime = now
          this.emit(leftStickX < 0 ? 'moveLeft' : 'moveRight')
        }
      }
    }, 16) as unknown as number // ~60Hz polling
  }

  private stopGamepadPolling(): void {
    if (this.gamepadPollInterval) {
      clearInterval(this.gamepadPollInterval)
      this.gamepadPollInterval = null
    }
  }

  private getActionForKey(code: string): InputAction | null {
    for (const [action, keys] of Object.entries(KEY_BINDINGS)) {
      if ((keys as readonly string[]).includes(code)) {
        return action as InputAction
      }
    }
    return null
  }

  private emit(action: InputAction): void {
    this.callbacks.forEach(cb => cb(action))
  }
}
