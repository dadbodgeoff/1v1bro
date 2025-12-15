/**
 * HapticEngine - UI-wide haptic feedback system
 * 
 * Extends patterns from FeedbackSystem for cross-application haptic feedback.
 * Provides tactile feedback for UI interactions across all pages.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */

// ============================================
// Types
// ============================================

/**
 * UI Haptic patterns for different interaction types
 */
export type UIHapticPattern = 
  | 'light'      // Toggle, secondary button, navigation (15-20ms)
  | 'medium'     // Primary button tap (40ms)
  | 'success'    // Purchase confirmed, achievement unlocked (30-gap-60ms double pulse)
  | 'warning'    // Error, invalid action (50-30-50ms triple pulse)
  | 'tick'       // Section boundary scroll (5ms)

/**
 * UI Action types that map to haptic patterns
 */
export type UIAction =
  | 'button-primary'
  | 'button-secondary'
  | 'toggle'
  | 'success'
  | 'error'
  | 'navigation'
  | 'purchase'
  | 'unlock'
  | 'scroll-boundary'
  | 'long-press'
  | 'drag'
  | 'drag-complete'

/**
 * Haptic trigger options
 */
export interface HapticTriggerOptions {
  intensity?: number  // 0-1, default 1
}

// ============================================
// Action to Pattern Mapping
// ============================================

/**
 * Maps UI actions to haptic patterns
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.7
 */
export const ACTION_TO_PATTERN: Record<UIAction, UIHapticPattern> = {
  'button-primary': 'medium',      // Req 3.1: Primary action button
  'button-secondary': 'light',     // Req 3.4: Secondary action button
  'toggle': 'light',               // Req 3.3: Toggle switch
  'success': 'success',            // Req 3.2: Successful action
  'error': 'warning',              // Req 3.2: Error/invalid action
  'navigation': 'light',           // Req 3.7: Page navigation
  'purchase': 'success',           // Req 3.2: Purchase confirmed
  'unlock': 'success',             // Req 3.2: Achievement unlocked
  'scroll-boundary': 'tick',       // Section boundary scroll
  'long-press': 'medium',          // Long press feedback
  'drag': 'light',                 // Drag feedback
  'drag-complete': 'success',      // Drag complete
}

/**
 * Pattern durations in milliseconds
 */
const PATTERN_DURATIONS: Record<UIHapticPattern, number> = {
  'light': 15,
  'medium': 40,
  'success': 90,   // 30 + gap + 60
  'warning': 130,  // 50 + 30 + 50
  'tick': 5,
}

// ============================================
// HapticEngine Class
// ============================================

export class HapticEngine {
  private _isSupported: boolean = false
  private _isEnabled: boolean = true
  private gamepad: Gamepad | null = null
  private lastTriggerTime: number = 0
  private readonly COALESCE_THRESHOLD = 50  // ms - Req 3.14: Coalesce triggers within 50ms

  constructor(enabled: boolean = true) {
    this._isEnabled = enabled
    this.detectSupport()
  }

  // ============================================
  // Public Properties
  // ============================================

  /**
   * Whether haptic feedback is supported on this device
   */
  get isSupported(): boolean {
    return this._isSupported
  }

  /**
   * Whether haptic feedback is enabled in settings
   */
  get isEnabled(): boolean {
    return this._isEnabled
  }

  /**
   * Update enabled state from settings
   */
  setEnabled(enabled: boolean): void {
    this._isEnabled = enabled
  }

  // ============================================
  // Public Methods
  // ============================================

  /**
   * Trigger haptic feedback for a UI action
   * Requirements: 3.1-3.7
   */
  triggerAction(action: UIAction, options: HapticTriggerOptions = {}): void {
    const pattern = ACTION_TO_PATTERN[action]
    this.trigger(pattern, options)
  }

  /**
   * Trigger haptic feedback with a specific pattern
   * Requirements: 3.5, 3.6
   */
  trigger(pattern: UIHapticPattern, options: HapticTriggerOptions = {}): void {
    // Req 3.5: Check if disabled
    if (!this._isEnabled) {
      return
    }

    // Req 3.6: Graceful degradation if not supported
    if (!this._isSupported) {
      return
    }

    // Req 3.14: Coalesce triggers within 50ms
    const now = performance.now()
    if (now - this.lastTriggerTime < this.COALESCE_THRESHOLD) {
      return
    }
    this.lastTriggerTime = now

    const intensity = options.intensity ?? 1

    // Try native haptics
    this.triggerNative(pattern, intensity)
  }

  /**
   * Get the pattern for a given action
   */
  getPatternForAction(action: UIAction): UIHapticPattern {
    return ACTION_TO_PATTERN[action]
  }

  /**
   * Get duration for a pattern
   */
  getPatternDuration(pattern: UIHapticPattern): number {
    return PATTERN_DURATIONS[pattern]
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Detect haptic support
   * Requirements: 3.6
   */
  private detectSupport(): void {
    // Check for Vibration API (mobile)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      this._isSupported = true
    }

    // Check for Gamepad API with vibration
    if (typeof navigator !== 'undefined' && 'getGamepads' in navigator) {
      window.addEventListener('gamepadconnected', (e) => {
        const gp = (e as GamepadEvent).gamepad
        if (gp.vibrationActuator) {
          this._isSupported = true
          this.gamepad = gp
        }
      })

      window.addEventListener('gamepaddisconnected', () => {
        this.gamepad = null
      })
    }
  }

  /**
   * Trigger native haptic feedback
   * Requirements: 3.6, 3.13
   */
  private triggerNative(pattern: UIHapticPattern, intensity: number): void {
    // Try Gamepad vibration first (Req 3.13: dual-rumble)
    if (this.gamepad?.vibrationActuator) {
      this.triggerGamepad(pattern, intensity)
      return
    }

    // Fall back to Vibration API (mobile)
    if ('vibrate' in navigator) {
      this.triggerVibration(pattern, intensity)
    }
  }

  /**
   * Trigger gamepad vibration with dual-rumble
   * Requirements: 3.13
   */
  private triggerGamepad(pattern: UIHapticPattern, intensity: number): void {
    if (!this.gamepad?.vibrationActuator) return

    const duration = PATTERN_DURATIONS[pattern]
    let strongMag = 0
    let weakMag = 0

    switch (pattern) {
      case 'light':
      case 'tick':
        strongMag = 0
        weakMag = 0.3 * intensity
        break
      case 'medium':
        strongMag = 0.3 * intensity
        weakMag = 0.5 * intensity
        break
      case 'success':
        strongMag = 0.5 * intensity
        weakMag = 0.7 * intensity
        break
      case 'warning':
        strongMag = 0.7 * intensity
        weakMag = 0.5 * intensity
        break
    }

    this.gamepad.vibrationActuator.playEffect('dual-rumble', {
      duration,
      strongMagnitude: strongMag,
      weakMagnitude: weakMag,
    }).catch(() => {
      // Silently fail - Req 3.6
    })
  }

  /**
   * Trigger mobile vibration
   */
  private triggerVibration(pattern: UIHapticPattern, intensity: number): void {
    try {
      switch (pattern) {
        case 'light':
          navigator.vibrate(Math.round(15 * intensity))
          break
        case 'medium':
          navigator.vibrate(Math.round(40 * intensity))
          break
        case 'success':
          // Double pulse: 30ms - gap - 60ms (Req 3.2)
          navigator.vibrate([
            Math.round(30 * intensity),
            30,
            Math.round(60 * intensity)
          ])
          break
        case 'warning':
          // Triple pulse: 50-30-50ms (Req 3.2)
          navigator.vibrate([
            Math.round(50 * intensity),
            30,
            Math.round(30 * intensity),
            30,
            Math.round(50 * intensity)
          ])
          break
        case 'tick':
          navigator.vibrate(Math.round(5 * intensity))
          break
      }
    } catch {
      // Silently fail - Req 3.6
    }
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.gamepad = null
  }
}

// ============================================
// Singleton Instance
// ============================================

let hapticEngineInstance: HapticEngine | null = null

/**
 * Get or create the HapticEngine singleton
 */
export function getHapticEngine(enabled: boolean = true): HapticEngine {
  if (!hapticEngineInstance) {
    hapticEngineInstance = new HapticEngine(enabled)
  } else {
    hapticEngineInstance.setEnabled(enabled)
  }
  return hapticEngineInstance
}

/**
 * Reset the singleton (for testing)
 */
export function resetHapticEngine(): void {
  if (hapticEngineInstance) {
    hapticEngineInstance.dispose()
    hapticEngineInstance = null
  }
}
