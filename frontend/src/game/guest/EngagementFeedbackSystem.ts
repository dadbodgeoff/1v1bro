/**
 * EngagementFeedbackSystem - Enhanced visual/audio feedback for guest players
 * 
 * Triggers celebratory effects for correct answers, kills, and milestones
 * to make guest play feel rewarding and encourage continued engagement.
 * 
 * @module game/guest/EngagementFeedbackSystem
 * Requirements: 2.1, 2.2, 2.3
 */

import { calculatePreviewXp, type MatchResult } from './GuestSessionManager'
import { type GuestMilestone } from './MilestoneSystem'

/**
 * Configuration for feedback effects
 */
export interface FeedbackConfig {
  correctAnswerParticles: boolean
  killConfirmationEffect: boolean
  streakAnnouncements: boolean
  previewXpPopups: boolean
}

/**
 * XP popup data for display
 */
export interface XpPopup {
  id: string
  amount: number
  reason: string
  timestamp: number
}

/**
 * Milestone unlock data for display
 */
export interface MilestoneUnlock {
  milestone: GuestMilestone
  timestamp: number
}

/**
 * Match summary data for display
 */
export interface MatchSummaryData {
  result: MatchResult
  previewXp: number
  isWin: boolean
  newMilestones: GuestMilestone[]
}

/**
 * Feedback event types
 */
export type FeedbackEvent =
  | { type: 'correct_answer'; timeMs: number; streak: number }
  | { type: 'kill_confirmed'; killStreak: number }
  | { type: 'xp_preview'; amount: number; reason: string }
  | { type: 'milestone_unlocked'; milestone: GuestMilestone }
  | { type: 'match_summary'; data: MatchSummaryData }

/**
 * Listener callback type
 */
export type FeedbackListener = (event: FeedbackEvent) => void

/**
 * Default feedback configuration
 */
const DEFAULT_CONFIG: FeedbackConfig = {
  correctAnswerParticles: true,
  killConfirmationEffect: true,
  streakAnnouncements: true,
  previewXpPopups: true,
}

/**
 * XP amounts for different actions (preview only, not real XP)
 */
export const XP_AMOUNTS = {
  correctAnswer: 50,
  fastAnswer: 25, // Bonus for answering in < 3 seconds
  kill: 30,
  killStreak3: 50,
  killStreak5: 100,
  win: 200,
  perfectRound: 75, // All questions correct
} as const

/**
 * EngagementFeedbackSystem class
 * 
 * Manages feedback events and notifies listeners for UI updates.
 */
export class EngagementFeedbackSystem {
  private static instance: EngagementFeedbackSystem | null = null
  
  private config: FeedbackConfig
  private listeners: Set<FeedbackListener> = new Set()
  private xpPopupQueue: XpPopup[] = []
  private popupIdCounter: number = 0
  private currentStreak: number = 0
  private currentKillStreak: number = 0

  private constructor(config: Partial<FeedbackConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Get singleton instance
   */
  static getInstance(): EngagementFeedbackSystem {
    if (!EngagementFeedbackSystem.instance) {
      EngagementFeedbackSystem.instance = new EngagementFeedbackSystem()
    }
    return EngagementFeedbackSystem.instance
  }

  /**
   * Reset singleton (for testing)
   */
  static resetInstance(): void {
    EngagementFeedbackSystem.instance = null
  }

  /**
   * Update configuration
   */
  configure(config: Partial<FeedbackConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): FeedbackConfig {
    return { ...this.config }
  }

  /**
   * Subscribe to feedback events
   */
  subscribe(listener: FeedbackListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: FeedbackEvent): void {
    this.listeners.forEach(listener => listener(event))
  }

  /**
   * Trigger correct answer celebration
   * Simplified: Only show popup for significant streaks to reduce visual noise
   */
  onCorrectAnswer(timeMs: number, streak: number): void {
    this.currentStreak = streak
    
    if (this.config.correctAnswerParticles) {
      this.emit({ type: 'correct_answer', timeMs, streak })
    }

    // Only show XP popups for streaks (3+) to reduce visual clutter
    // Individual correct answers are tracked silently
    if (this.config.previewXpPopups && this.config.streakAnnouncements && streak >= 3) {
      const streakBonus = XP_AMOUNTS.correctAnswer + Math.min(streak * 10, 100)
      this.showXpPreview(streakBonus, `${streak}x Streak!`)
    }
  }

  /**
   * Trigger kill confirmation effect
   * Simplified: Only show popup for kill streaks to reduce visual noise
   */
  onKillConfirmed(killStreak: number): void {
    this.currentKillStreak = killStreak
    
    if (this.config.killConfirmationEffect) {
      this.emit({ type: 'kill_confirmed', killStreak })
    }

    // Only show XP popups for kill streaks (3+) to reduce visual clutter
    if (this.config.previewXpPopups && killStreak >= 3) {
      if (killStreak === 3) {
        this.showXpPreview(XP_AMOUNTS.kill * 3 + XP_AMOUNTS.killStreak3, 'Triple Kill!')
      } else if (killStreak >= 5) {
        this.showXpPreview(XP_AMOUNTS.kill * killStreak + XP_AMOUNTS.killStreak5, 'Rampage!')
      }
    }
  }

  /**
   * Show XP preview popup
   */
  showXpPreview(amount: number, reason: string): void {
    if (!this.config.previewXpPopups) return

    const popup: XpPopup = {
      id: `xp-${this.popupIdCounter++}`,
      amount,
      reason,
      timestamp: Date.now(),
    }

    this.xpPopupQueue.push(popup)
    this.emit({ type: 'xp_preview', amount, reason })

    // Clean up old popups (keep last 5)
    if (this.xpPopupQueue.length > 5) {
      this.xpPopupQueue.shift()
    }
  }

  /**
   * Show milestone achievement
   */
  showMilestoneUnlocked(milestone: GuestMilestone): void {
    this.emit({ type: 'milestone_unlocked', milestone })
    
    // Also show XP bonus popup
    if (this.config.previewXpPopups && milestone.xpBonus > 0) {
      this.showXpPreview(milestone.xpBonus, milestone.name)
    }
  }

  /**
   * Show match completion summary
   */
  showMatchSummary(result: MatchResult, newMilestones: GuestMilestone[] = []): void {
    const previewXp = calculatePreviewXp(result)
    const isWin = result.won

    const data: MatchSummaryData = {
      result,
      previewXp,
      isWin,
      newMilestones,
    }

    this.emit({ type: 'match_summary', data })
  }

  /**
   * Get current XP popup queue
   */
  getXpPopupQueue(): XpPopup[] {
    return [...this.xpPopupQueue]
  }

  /**
   * Clear XP popup queue
   */
  clearXpPopupQueue(): void {
    this.xpPopupQueue = []
  }

  /**
   * Get current answer streak
   */
  getCurrentStreak(): number {
    return this.currentStreak
  }

  /**
   * Get current kill streak
   */
  getCurrentKillStreak(): number {
    return this.currentKillStreak
  }

  /**
   * Reset streaks (call at match start)
   */
  resetStreaks(): void {
    this.currentStreak = 0
    this.currentKillStreak = 0
  }

  /**
   * Calculate total preview XP from popup queue
   */
  getTotalPreviewXp(): number {
    return this.xpPopupQueue.reduce((sum, popup) => sum + popup.amount, 0)
  }
}

// Export singleton getter
export const getEngagementFeedbackSystem = () => EngagementFeedbackSystem.getInstance()
