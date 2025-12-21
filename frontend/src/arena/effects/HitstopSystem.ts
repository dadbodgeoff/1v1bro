/**
 * HitstopSystem - AAA-style impact freeze frames
 * 
 * Adds game feel by briefly freezing/slowing time on significant hits.
 * Used for:
 * - Player taking damage
 * - Landing a kill shot
 * - Headshots
 */

export interface HitstopConfig {
  // Frames to freeze on player hit (at 60fps)
  playerHitFrames: number
  // Frames to freeze on kill
  killFrames: number
  // Frames to freeze on headshot
  headshotFrames: number
  // Time scale during hitstop (0 = full freeze, 1 = normal)
  intensity: number
  // Whether hitstop is enabled
  enabled: boolean
}

const DEFAULT_CONFIG: HitstopConfig = {
  playerHitFrames: 2,
  killFrames: 4,
  headshotFrames: 5,
  intensity: 0.05,
  enabled: true,
}

export class HitstopSystem {
  private config: HitstopConfig
  private onTrigger: ((frames: number, intensity: number) => void) | null = null

  constructor(config: Partial<HitstopConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Set callback for when hitstop is triggered
   */
  setTriggerCallback(callback: (frames: number, intensity: number) => void): void {
    this.onTrigger = callback
  }

  /**
   * Enable/disable hitstop
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
  }

  /**
   * Trigger hitstop for player taking damage
   */
  onPlayerHit(): void {
    if (!this.config.enabled) return
    this.onTrigger?.(this.config.playerHitFrames, this.config.intensity)
  }

  /**
   * Trigger hitstop for landing a kill
   */
  onKill(): void {
    if (!this.config.enabled) return
    this.onTrigger?.(this.config.killFrames, this.config.intensity)
  }

  /**
   * Trigger hitstop for headshot
   */
  onHeadshot(): void {
    if (!this.config.enabled) return
    this.onTrigger?.(this.config.headshotFrames, this.config.intensity)
  }

  /**
   * Custom hitstop trigger
   */
  trigger(frames: number, intensity?: number): void {
    if (!this.config.enabled) return
    this.onTrigger?.(frames, intensity ?? this.config.intensity)
  }

  /**
   * Update config
   */
  setConfig(config: Partial<HitstopConfig>): void {
    this.config = { ...this.config, ...config }
  }
}
