/**
 * MilestoneSystem - Tracks distance milestones and triggers celebrations
 * 
 * Features:
 * - Configurable milestone intervals (500m, 1000m)
 * - Visual celebration triggers
 * - Sound/haptic feedback integration
 * - Milestone history tracking
 */

export interface MilestoneConfig {
  interval: number          // Distance between milestones (default: 500)
  majorInterval: number     // Major milestone interval (default: 1000)
  celebrationDuration: number  // How long celebration lasts (ms)
}

export interface MilestoneEvent {
  distance: number
  isMajor: boolean
  timestamp: number
}

export type MilestoneCallback = (event: MilestoneEvent) => void

const DEFAULT_CONFIG: MilestoneConfig = {
  interval: 500,
  majorInterval: 1000,
  celebrationDuration: 2000,
}

export class MilestoneSystem {
  private config: MilestoneConfig
  private lastMilestone: number = 0
  private milestoneHistory: MilestoneEvent[] = []
  private callbacks: Set<MilestoneCallback> = new Set()
  private currentCelebration: MilestoneEvent | null = null
  private celebrationEndTime: number = 0

  constructor(config: Partial<MilestoneConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Register milestone callback
   */
  onMilestone(callback: MilestoneCallback): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  /**
   * Update with current distance - call every frame
   */
  update(distance: number): MilestoneEvent | null {
    const { interval, majorInterval, celebrationDuration } = this.config
    
    // Check if we've passed a milestone
    const currentMilestoneLevel = Math.floor(distance / interval) * interval
    
    if (currentMilestoneLevel > this.lastMilestone && currentMilestoneLevel > 0) {
      const isMajor = currentMilestoneLevel % majorInterval === 0
      
      const event: MilestoneEvent = {
        distance: currentMilestoneLevel,
        isMajor,
        timestamp: performance.now(),
      }
      
      this.lastMilestone = currentMilestoneLevel
      this.milestoneHistory.push(event)
      this.currentCelebration = event
      this.celebrationEndTime = performance.now() + celebrationDuration
      
      // Notify callbacks
      this.callbacks.forEach(cb => cb(event))
      
      return event
    }
    
    // Clear celebration if expired
    if (this.currentCelebration && performance.now() > this.celebrationEndTime) {
      this.currentCelebration = null
    }
    
    return null
  }

  /**
   * Get current active celebration (if any)
   */
  getCurrentCelebration(): MilestoneEvent | null {
    if (this.currentCelebration && performance.now() <= this.celebrationEndTime) {
      return this.currentCelebration
    }
    return null
  }

  /**
   * Get celebration progress (0-1, for animations)
   */
  getCelebrationProgress(): number {
    if (!this.currentCelebration) return 0
    
    const elapsed = performance.now() - this.currentCelebration.timestamp
    const progress = elapsed / this.config.celebrationDuration
    return Math.max(0, Math.min(1, progress))
  }

  /**
   * Get time remaining for celebration (ms)
   */
  getCelebrationTimeRemaining(): number {
    if (!this.currentCelebration) return 0
    return Math.max(0, this.celebrationEndTime - performance.now())
  }

  /**
   * Get milestone history
   */
  getHistory(): MilestoneEvent[] {
    return [...this.milestoneHistory]
  }

  /**
   * Get last milestone reached
   */
  getLastMilestone(): number {
    return this.lastMilestone
  }

  /**
   * Get next milestone distance
   */
  getNextMilestone(): number {
    return this.lastMilestone + this.config.interval
  }

  /**
   * Get progress to next milestone (0-1)
   */
  getProgressToNext(currentDistance: number): number {
    const nextMilestone = this.getNextMilestone()
    const prevMilestone = this.lastMilestone
    const range = nextMilestone - prevMilestone
    const progress = (currentDistance - prevMilestone) / range
    return Math.max(0, Math.min(1, progress))
  }

  /**
   * Check if distance is a major milestone
   */
  isMajorMilestone(distance: number): boolean {
    return distance % this.config.majorInterval === 0
  }

  /**
   * Reset system
   */
  reset(): void {
    this.lastMilestone = 0
    this.milestoneHistory = []
    this.currentCelebration = null
    this.celebrationEndTime = 0
  }

  /**
   * Dispose
   */
  dispose(): void {
    this.callbacks.clear()
    this.reset()
  }
}
