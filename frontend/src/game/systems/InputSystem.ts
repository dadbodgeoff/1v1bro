/**
 * Input handling system
 * Supports keyboard (WASD/arrows) and touch controls
 */

import type { Vector2 } from '../types'

type InputCallback = (velocity: Vector2) => void

export class InputSystem {
  private keys: Set<string> = new Set()
  private touchVelocity: Vector2 = { x: 0, y: 0 }
  private callback: InputCallback | null = null
  private isTouchDevice: boolean

  constructor() {
    this.isTouchDevice = 'ontouchstart' in window
    this.setupKeyboard()
  }

  /**
   * Set callback for input changes
   */
  onInput(callback: InputCallback): void {
    this.callback = callback
  }

  /**
   * Get current movement vector (normalized)
   */
  getVelocity(): Vector2 {
    if (this.isTouchDevice && (this.touchVelocity.x !== 0 || this.touchVelocity.y !== 0)) {
      return this.touchVelocity
    }
    return this.getKeyboardVelocity()
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase()
    if (this.isMovementKey(key)) {
      console.log('[InputSystem] Movement key down:', key, 'keys now:', Array.from(this.keys))
      e.preventDefault()
      this.keys.add(key)
      this.emitVelocity()
    }
  }

  private handleKeyUp = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase()
    if (this.isMovementKey(key)) {
      this.keys.delete(key)
      this.emitVelocity()
    }
  }

  private isMovementKey(key: string): boolean {
    return ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)
  }

  private getKeyboardVelocity(): Vector2 {
    let x = 0
    let y = 0

    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1

    // Normalize diagonal movement
    if (x !== 0 && y !== 0) {
      const factor = 0.707 // 1/sqrt(2)
      x *= factor
      y *= factor
    }

    return { x, y }
  }

  private emitVelocity(): void {
    this.callback?.(this.getVelocity())
  }

  /**
   * Set touch velocity (called from touch controls component)
   */
  setTouchVelocity(velocity: Vector2): void {
    this.touchVelocity = velocity
    this.emitVelocity()
  }
}
