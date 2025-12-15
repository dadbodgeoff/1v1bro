/**
 * AchievementSystem - Tracks and awards achievements during gameplay
 * 
 * Features:
 * - Distance achievements (500m, 1000m, 2000m, 5000m)
 * - Combo achievements (10x, 25x, 50x, 100x)
 * - Speed achievements (reach max speed)
 * - Perfect run achievements (no hits)
 * - Session and persistent tracking
 */

export type AchievementCategory = 'distance' | 'combo' | 'speed' | 'survival' | 'special'

export interface Achievement {
  id: string
  name: string
  description: string
  category: AchievementCategory
  icon: string
  threshold: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}

export interface UnlockedAchievement {
  achievement: Achievement
  unlockedAt: number
  value: number  // The value that triggered unlock
}

export type AchievementCallback = (unlocked: UnlockedAchievement) => void

// Achievement definitions
const ACHIEVEMENTS: Achievement[] = [
  // Distance achievements
  { id: 'dist_500', name: 'Getting Started', description: 'Run 500 meters', category: 'distance', icon: '🏃', threshold: 500, rarity: 'common' },
  { id: 'dist_1000', name: 'Kilometer Club', description: 'Run 1,000 meters', category: 'distance', icon: '🎯', threshold: 1000, rarity: 'common' },
  { id: 'dist_2000', name: 'Marathon Runner', description: 'Run 2,000 meters', category: 'distance', icon: '🏅', threshold: 2000, rarity: 'uncommon' },
  { id: 'dist_5000', name: 'Ultra Runner', description: 'Run 5,000 meters', category: 'distance', icon: '🏆', threshold: 5000, rarity: 'rare' },
  { id: 'dist_10000', name: 'Legendary Distance', description: 'Run 10,000 meters', category: 'distance', icon: '👑', threshold: 10000, rarity: 'epic' },
  
  // Combo achievements
  { id: 'combo_10', name: 'Combo Starter', description: 'Reach 10x combo', category: 'combo', icon: '⚡', threshold: 10, rarity: 'common' },
  { id: 'combo_25', name: 'Combo Master', description: 'Reach 25x combo', category: 'combo', icon: '🔥', threshold: 25, rarity: 'uncommon' },
  { id: 'combo_50', name: 'Combo Legend', description: 'Reach 50x combo', category: 'combo', icon: '💥', threshold: 50, rarity: 'rare' },
  { id: 'combo_100', name: 'Untouchable', description: 'Reach 100x combo', category: 'combo', icon: '✨', threshold: 100, rarity: 'epic' },
  
  // Speed achievements
  { id: 'speed_40', name: 'Speed Demon', description: 'Reach 40 u/s', category: 'speed', icon: '💨', threshold: 40, rarity: 'uncommon' },
  { id: 'speed_50', name: 'Maximum Velocity', description: 'Reach max speed', category: 'speed', icon: '🚀', threshold: 50, rarity: 'rare' },
  
  // Survival achievements
  { id: 'no_hit_500', name: 'Flawless Start', description: 'Reach 500m without getting hit', category: 'survival', icon: '🛡️', threshold: 500, rarity: 'uncommon' },
  { id: 'no_hit_1000', name: 'Perfect Run', description: 'Reach 1,000m without getting hit', category: 'survival', icon: '💎', threshold: 1000, rarity: 'rare' },
  
  // Special achievements
  { id: 'close_calls_10', name: 'Risk Taker', description: 'Get 10 close calls in one run', category: 'special', icon: '😰', threshold: 10, rarity: 'uncommon' },
  { id: 'perfect_dodges_5', name: 'Precision', description: 'Get 5 perfect dodges in one run', category: 'special', icon: '🎯', threshold: 5, rarity: 'uncommon' },
]

export class AchievementSystem {
  private unlockedThisSession: Map<string, UnlockedAchievement> = new Map()
  private callbacks: Set<AchievementCallback> = new Set()
  private pendingNotifications: UnlockedAchievement[] = []
  
  // Tracking stats for this run
  private runStats = {
    distance: 0,
    maxCombo: 0,
    maxSpeed: 0,
    hitsTaken: 0,
    closeCalls: 0,
    perfectDodges: 0,
  }

  constructor() {}

  /**
   * Register achievement callback
   */
  onAchievement(callback: AchievementCallback): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  /**
   * Update distance - checks distance achievements
   */
  updateDistance(distance: number): void {
    this.runStats.distance = distance
    
    // Check distance achievements
    ACHIEVEMENTS
      .filter(a => a.category === 'distance')
      .forEach(achievement => {
        if (distance >= achievement.threshold) {
          this.tryUnlock(achievement, distance)
        }
      })
    
    // Check no-hit achievements
    if (this.runStats.hitsTaken === 0) {
      ACHIEVEMENTS
        .filter(a => a.category === 'survival')
        .forEach(achievement => {
          if (distance >= achievement.threshold) {
            this.tryUnlock(achievement, distance)
          }
        })
    }
  }

  /**
   * Update combo - checks combo achievements
   */
  updateCombo(combo: number): void {
    if (combo > this.runStats.maxCombo) {
      this.runStats.maxCombo = combo
    }
    
    ACHIEVEMENTS
      .filter(a => a.category === 'combo')
      .forEach(achievement => {
        if (combo >= achievement.threshold) {
          this.tryUnlock(achievement, combo)
        }
      })
  }

  /**
   * Update speed - checks speed achievements
   */
  updateSpeed(speed: number): void {
    if (speed > this.runStats.maxSpeed) {
      this.runStats.maxSpeed = speed
    }
    
    ACHIEVEMENTS
      .filter(a => a.category === 'speed')
      .forEach(achievement => {
        if (speed >= achievement.threshold) {
          this.tryUnlock(achievement, speed)
        }
      })
  }

  /**
   * Record a hit taken
   */
  recordHit(): void {
    this.runStats.hitsTaken++
  }

  /**
   * Record a close call
   */
  recordCloseCall(): void {
    this.runStats.closeCalls++
    
    const achievement = ACHIEVEMENTS.find(a => a.id === 'close_calls_10')
    if (achievement && this.runStats.closeCalls >= achievement.threshold) {
      this.tryUnlock(achievement, this.runStats.closeCalls)
    }
  }

  /**
   * Record a perfect dodge
   */
  recordPerfectDodge(): void {
    this.runStats.perfectDodges++
    
    const achievement = ACHIEVEMENTS.find(a => a.id === 'perfect_dodges_5')
    if (achievement && this.runStats.perfectDodges >= achievement.threshold) {
      this.tryUnlock(achievement, this.runStats.perfectDodges)
    }
  }

  /**
   * Try to unlock an achievement
   */
  private tryUnlock(achievement: Achievement, value: number): void {
    if (this.unlockedThisSession.has(achievement.id)) return
    
    const unlocked: UnlockedAchievement = {
      achievement,
      unlockedAt: performance.now(),
      value,
    }
    
    this.unlockedThisSession.set(achievement.id, unlocked)
    this.pendingNotifications.push(unlocked)
    
    // Notify callbacks
    this.callbacks.forEach(cb => cb(unlocked))
  }

  /**
   * Get next pending notification (for display queue)
   */
  popNotification(): UnlockedAchievement | null {
    return this.pendingNotifications.shift() ?? null
  }

  /**
   * Check if there are pending notifications
   */
  hasPendingNotifications(): boolean {
    return this.pendingNotifications.length > 0
  }

  /**
   * Get all achievements unlocked this session
   */
  getSessionUnlocks(): UnlockedAchievement[] {
    return Array.from(this.unlockedThisSession.values())
  }

  /**
   * Get all achievement definitions
   */
  static getAllAchievements(): Achievement[] {
    return [...ACHIEVEMENTS]
  }

  /**
   * Get achievements by category
   */
  static getByCategory(category: AchievementCategory): Achievement[] {
    return ACHIEVEMENTS.filter(a => a.category === category)
  }

  /**
   * Get run stats
   */
  getRunStats() {
    return { ...this.runStats }
  }

  /**
   * Reset for new run
   */
  reset(): void {
    this.unlockedThisSession.clear()
    this.pendingNotifications = []
    this.runStats = {
      distance: 0,
      maxCombo: 0,
      maxSpeed: 0,
      hitsTaken: 0,
      closeCalls: 0,
      perfectDodges: 0,
    }
  }

  /**
   * Dispose
   */
  dispose(): void {
    this.callbacks.clear()
    this.reset()
  }
}
