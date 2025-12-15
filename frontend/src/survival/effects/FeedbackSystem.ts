/**
 * FeedbackSystem - Sound design hooks and haptic feedback
 * Provides callbacks for audio integration and controller vibration
 */

// Sound event types
export type SoundEvent =
  | 'jump'
  | 'land'
  | 'land-heavy'
  | 'slide-start'
  | 'slide-end'
  | 'near-miss'
  | 'perfect-dodge'
  | 'collision'
  | 'lane-change'
  | 'speed-wind'
  | 'boost'
  | 'game-over'
  | 'countdown'
  | 'milestone'
  | 'combo-milestone'
  | 'collect'
  | 'quiz-popup'
  | 'quiz-correct'
  | 'quiz-wrong'
  | 'quiz-tick'
  | 'quiz-tick-urgent'
  // Arcade landing sounds
  | 'arcade-power-on'
  | 'arcade-boot-blip'
  | 'arcade-boot-line'
  | 'arcade-ready'
  | 'arcade-hover'
  | 'arcade-click'

// Visual indicator types for combo feedback
export type VisualIndicatorType = 'close' | 'perfect' | 'combo-milestone'

// Visual indicator data
export interface VisualIndicatorData {
  type: VisualIndicatorType
  text: string
  position: { x: number; z: number }
  color?: number  // Hex color
  duration?: number  // ms
}

// Visual indicator callback
export type VisualIndicatorCallback = (data: VisualIndicatorData) => void

// Haptic pattern types
export type HapticPattern =
  | 'light'      // Quick light tap
  | 'medium'     // Standard feedback
  | 'heavy'      // Strong impact
  | 'double'     // Two quick taps
  | 'rumble'     // Continuous rumble
  | 'success'    // Positive feedback pattern
  | 'warning'    // Alert pattern

// Sound event data
export interface SoundEventData {
  event: SoundEvent
  intensity?: number    // 0-1 for volume/pitch variation
  position?: { x: number; z: number }  // For spatial audio
  pitch?: number        // Pitch multiplier
}

// Haptic event data
export interface HapticEventData {
  pattern: HapticPattern
  intensity?: number    // 0-1
  duration?: number     // ms
}

// Callback types
export type SoundCallback = (data: SoundEventData) => void
export type HapticCallback = (data: HapticEventData) => void

/**
 * FeedbackSystem - Centralized feedback management
 */
export class FeedbackSystem {
  private soundCallbacks: Set<SoundCallback> = new Set()
  private hapticCallbacks: Set<HapticCallback> = new Set()
  private visualCallbacks: Set<VisualIndicatorCallback> = new Set()
  
  // Throttling to prevent spam
  private lastSoundTime: Map<SoundEvent, number> = new Map()
  private readonly SOUND_COOLDOWNS: Partial<Record<SoundEvent, number>> = {
    'near-miss': 200,      // 200ms between near-miss sounds
    'lane-change': 100,    // 100ms between lane change sounds
    'speed-wind': 500,     // Wind sound updates every 500ms
  }
  
  // Haptic support detection
  private hapticSupported: boolean = false
  private gamepad: Gamepad | null = null

  constructor() {
    this.detectHapticSupport()
  }

  /**
   * Detect haptic/vibration support
   */
  private detectHapticSupport(): void {
    // Check for Gamepad API with vibration
    if ('getGamepads' in navigator) {
      window.addEventListener('gamepadconnected', (e) => {
        const gp = (e as GamepadEvent).gamepad
        if (gp.vibrationActuator) {
          this.hapticSupported = true
          this.gamepad = gp
        }
      })
    }
    
    // Check for Vibration API (mobile)
    if ('vibrate' in navigator) {
      this.hapticSupported = true
    }
  }

  /**
   * Register sound callback
   */
  onSound(callback: SoundCallback): () => void {
    this.soundCallbacks.add(callback)
    return () => this.soundCallbacks.delete(callback)
  }

  /**
   * Register haptic callback
   */
  onHaptic(callback: HapticCallback): () => void {
    this.hapticCallbacks.add(callback)
    return () => this.hapticCallbacks.delete(callback)
  }

  /**
   * Register visual indicator callback
   * Requirements: 3.1, 3.2, 3.4, 3.5
   */
  onVisualIndicator(callback: VisualIndicatorCallback): () => void {
    this.visualCallbacks.add(callback)
    return () => this.visualCallbacks.delete(callback)
  }

  /**
   * Emit visual indicator
   * Requirements: 3.5 - Position indicators in screen space
   */
  emitVisualIndicator(data: VisualIndicatorData): void {
    this.visualCallbacks.forEach(cb => cb(data))
  }

  /**
   * Emit sound event
   */
  emitSound(event: SoundEvent, options: Partial<SoundEventData> = {}): void {
    // Check cooldown
    const cooldown = this.SOUND_COOLDOWNS[event]
    if (cooldown) {
      const lastTime = this.lastSoundTime.get(event) || 0
      if (performance.now() - lastTime < cooldown) return
      this.lastSoundTime.set(event, performance.now())
    }
    
    const data: SoundEventData = {
      event,
      intensity: options.intensity ?? 1,
      position: options.position,
      pitch: options.pitch ?? 1,
    }
    
    this.soundCallbacks.forEach(cb => cb(data))
  }

  /**
   * Emit haptic feedback
   */
  emitHaptic(pattern: HapticPattern, intensity: number = 1): void {
    const data: HapticEventData = {
      pattern,
      intensity,
      duration: this.getPatternDuration(pattern),
    }
    
    // Notify callbacks
    this.hapticCallbacks.forEach(cb => cb(data))
    
    // Try native haptics
    this.triggerNativeHaptic(pattern, intensity)
  }

  /**
   * Get duration for haptic pattern
   */
  private getPatternDuration(pattern: HapticPattern): number {
    switch (pattern) {
      case 'light': return 20
      case 'medium': return 40
      case 'heavy': return 80
      case 'double': return 60
      case 'rumble': return 200
      case 'success': return 100
      case 'warning': return 150
      default: return 50
    }
  }

  /**
   * Trigger native haptic feedback
   */
  private triggerNativeHaptic(pattern: HapticPattern, intensity: number): void {
    if (!this.hapticSupported) return
    
    // Try Gamepad vibration
    if (this.gamepad?.vibrationActuator) {
      const duration = this.getPatternDuration(pattern)
      const strongMag = intensity * (pattern === 'heavy' ? 1 : 0.5)
      const weakMag = intensity * (pattern === 'light' ? 0.3 : 0.7)
      
      this.gamepad.vibrationActuator.playEffect('dual-rumble', {
        duration,
        strongMagnitude: strongMag,
        weakMagnitude: weakMag,
      }).catch(() => {})
    }
    
    // Try Vibration API (mobile)
    if ('vibrate' in navigator) {
      const duration = this.getPatternDuration(pattern)
      switch (pattern) {
        case 'double':
          navigator.vibrate([20, 30, 20])
          break
        case 'success':
          navigator.vibrate([30, 50, 60])
          break
        case 'warning':
          navigator.vibrate([50, 30, 50, 30, 50])
          break
        default:
          navigator.vibrate(duration * intensity)
      }
    }
  }

  // === Convenience methods for common events ===

  /**
   * Player jumped
   */
  onJump(): void {
    this.emitSound('jump', { intensity: 0.8 })
    this.emitHaptic('light', 0.5)
  }

  /**
   * Player landed
   */
  onLand(velocity: number): void {
    const isHeavy = velocity > 15
    this.emitSound(isHeavy ? 'land-heavy' : 'land', { 
      intensity: Math.min(1, velocity / 20),
      pitch: isHeavy ? 0.8 : 1,
    })
    this.emitHaptic(isHeavy ? 'medium' : 'light', Math.min(1, velocity / 20))
  }

  /**
   * Player started sliding
   */
  onSlideStart(): void {
    this.emitSound('slide-start', { intensity: 0.7 })
    this.emitHaptic('light', 0.3)
  }

  /**
   * Player stopped sliding
   */
  onSlideEnd(): void {
    this.emitSound('slide-end', { intensity: 0.5 })
  }

  /**
   * Near miss occurred
   * Requirements: 3.1 - Display "Close!" indicator
   */
  onNearMiss(distance: number, position?: { x: number; z: number }): void {
    // Closer = more intense
    const intensity = 1 - Math.min(1, distance / 0.8)
    this.emitSound('near-miss', { intensity, pitch: 1 + intensity * 0.3 })
    this.emitHaptic('light', intensity * 0.7)
    
    // Visual indicator - "Close!" (reduced duration for less intrusion)
    if (position) {
      this.emitVisualIndicator({
        type: 'close',
        text: 'Close!',
        position,
        color: 0xffff00,  // Yellow
        duration: 500,  // Reduced from 800ms
      })
    }
  }

  /**
   * Perfect dodge occurred
   * Requirements: 3.2 - Display "Perfect!" indicator with particle effects
   */
  onPerfectDodge(position: { x: number; z: number }): void {
    this.emitSound('perfect-dodge', { intensity: 1, pitch: 1.2 })
    this.emitHaptic('success', 0.9)
    
    // Visual indicator - "Perfect!" (reduced duration)
    this.emitVisualIndicator({
      type: 'perfect',
      text: 'Perfect!',
      position,
      color: 0x00ff00,  // Green
      duration: 600,  // Reduced from 1000ms
    })
  }

  /**
   * Collision occurred
   */
  onCollision(): void {
    this.emitSound('collision', { intensity: 1 })
    this.emitHaptic('heavy', 1)
  }

  /**
   * Lane change
   */
  onLaneChange(direction: number): void {
    this.emitSound('lane-change', { 
      intensity: 0.5,
      pitch: direction > 0 ? 1.1 : 0.9,
    })
    this.emitHaptic('light', 0.3)
  }

  /**
   * Update speed-based wind sound
   */
  updateSpeedWind(speed: number): void {
    if (speed > 25) {
      const intensity = Math.min(1, (speed - 25) / 35)
      this.emitSound('speed-wind', { intensity })
    }
  }

  /**
   * Boost activated
   */
  onBoost(): void {
    this.emitSound('boost', { intensity: 1 })
    this.emitHaptic('success', 0.8)
  }

  /**
   * Game over
   */
  onGameOver(): void {
    this.emitSound('game-over', { intensity: 1 })
    this.emitHaptic('warning', 1)
  }

  /**
   * Milestone reached (distance, score, etc.)
   */
  onMilestone(): void {
    this.emitSound('milestone', { intensity: 0.8 })
    this.emitHaptic('success', 0.6)
  }

  /**
   * Combo milestone reached
   * Requirements: 3.4 - Display combo milestone notification
   */
  onComboMilestone(combo: number, position?: { x: number; z: number }): void {
    this.emitSound('combo-milestone', { intensity: 1, pitch: 1 + combo * 0.01 })
    this.emitHaptic('success', 0.8)
    
    // Visual indicator - "5x Combo!", "10x Combo!", etc. (reduced duration)
    if (position) {
      this.emitVisualIndicator({
        type: 'combo-milestone',
        text: `${combo}x Combo!`,
        position,
        color: 0xff00ff,  // Magenta
        duration: 800,  // Reduced from 1500ms
      })
    }
  }

  /**
   * Dispose
   */
  dispose(): void {
    this.soundCallbacks.clear()
    this.hapticCallbacks.clear()
    this.visualCallbacks.clear()
  }
}
