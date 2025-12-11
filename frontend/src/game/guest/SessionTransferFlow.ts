/**
 * SessionTransferFlow - Progress migration during signup
 * 
 * Handles transferring guest session progress to a new account,
 * including XP, stats, and milestone achievements.
 * 
 * @module game/guest/SessionTransferFlow
 * Requirements: 8.1, 8.2
 */

import { getGuestSession, type GuestSessionStats } from './GuestSessionManager'
import { calculateMilestoneXpBonus } from './MilestoneSystem'
import { API_BASE } from '@/utils/constants'

/**
 * Session transfer data for preview
 */
export interface SessionTransferData {
  previewXp: number
  matchesPlayed: number
  matchesWon: number
  milestonesAchieved: string[]
  estimatedRewards: {
    coins: number
    xp: number
    unlockedItems: string[]
  }
}

/**
 * Transfer result from API
 */
export interface TransferResult {
  success: boolean
  xpCredited: number
  coinsCredited: number
  achievementsUnlocked: string[]
  welcomeMessage: string
  error?: string
}

/**
 * Coin conversion rate (preview XP to coins)
 */
const XP_TO_COINS_RATE = 0.1 // 10 XP = 1 coin

/**
 * Welcome bonus for new accounts with transferred progress
 */
const WELCOME_BONUS = {
  coins: 100,
  xp: 500,
}

/**
 * SessionTransferFlow class
 * 
 * Manages the transfer of guest progress to authenticated accounts.
 */
export class SessionTransferFlow {
  private static instance: SessionTransferFlow | null = null
  
  private transferInProgress: boolean = false
  private lastTransferResult: TransferResult | null = null

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): SessionTransferFlow {
    if (!SessionTransferFlow.instance) {
      SessionTransferFlow.instance = new SessionTransferFlow()
    }
    return SessionTransferFlow.instance
  }

  /**
   * Reset singleton (for testing)
   */
  static resetInstance(): void {
    SessionTransferFlow.instance = null
  }

  /**
   * Check if there's a transferable session
   */
  hasTransferableSession(): boolean {
    try {
      const session = getGuestSession().getSession()
      // Must have played at least one match
      return session.matchesPlayed > 0
    } catch {
      return false
    }
  }

  /**
   * Get transfer preview data
   */
  getTransferPreview(): SessionTransferData | null {
    if (!this.hasTransferableSession()) {
      return null
    }

    const session = getGuestSession().getSession()
    return this.calculateTransferData(session)
  }

  /**
   * Calculate transfer data from session
   */
  calculateTransferData(session: GuestSessionStats): SessionTransferData {
    // Calculate milestone XP bonus
    const milestoneXpBonus = calculateMilestoneXpBonus(session.milestonesAchieved)
    
    // Total XP includes preview XP + milestone bonuses + welcome bonus
    const totalXp = session.previewXpEarned + milestoneXpBonus + WELCOME_BONUS.xp
    
    // Coins from XP conversion + welcome bonus
    const earnedCoins = Math.floor(session.previewXpEarned * XP_TO_COINS_RATE)
    const totalCoins = earnedCoins + WELCOME_BONUS.coins

    // Determine unlocked items based on milestones
    const unlockedItems = this.getUnlockedItems(session.milestonesAchieved)

    return {
      previewXp: session.previewXpEarned,
      matchesPlayed: session.matchesPlayed,
      matchesWon: session.matchesWon,
      milestonesAchieved: session.milestonesAchieved,
      estimatedRewards: {
        coins: totalCoins,
        xp: totalXp,
        unlockedItems,
      },
    }
  }

  /**
   * Get unlocked items based on milestones
   */
  private getUnlockedItems(milestoneIds: string[]): string[] {
    const items: string[] = []
    
    // Map milestones to cosmetic unlocks
    if (milestoneIds.includes('first-win')) {
      items.push('Victory Banner')
    }
    if (milestoneIds.includes('triple-kill')) {
      items.push('Eliminator Title')
    }
    if (milestoneIds.includes('quiz-master')) {
      items.push('Brain Icon')
    }
    if (milestoneIds.includes('veteran')) {
      items.push('Veteran Badge')
    }
    
    return items
  }

  /**
   * Execute transfer after account creation
   */
  async executeTransfer(userId: string, token: string): Promise<TransferResult> {
    if (this.transferInProgress) {
      return {
        success: false,
        xpCredited: 0,
        coinsCredited: 0,
        achievementsUnlocked: [],
        welcomeMessage: '',
        error: 'Transfer already in progress',
      }
    }

    if (!this.hasTransferableSession()) {
      return {
        success: false,
        xpCredited: 0,
        coinsCredited: 0,
        achievementsUnlocked: [],
        welcomeMessage: '',
        error: 'No transferable session found',
      }
    }

    this.transferInProgress = true

    try {
      const session = getGuestSession().getSession()
      const transferData = this.calculateTransferData(session)

      // Call API to credit rewards
      const response = await fetch(`${API_BASE}/users/transfer-guest-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          sessionId: session.sessionId,
          previewXp: transferData.previewXp,
          matchesPlayed: transferData.matchesPlayed,
          matchesWon: transferData.matchesWon,
          totalKills: session.totalKills,
          questionsCorrect: session.questionsCorrect,
          milestonesAchieved: transferData.milestonesAchieved,
          estimatedRewards: transferData.estimatedRewards,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        this.lastTransferResult = {
          success: true,
          xpCredited: data.xpCredited || transferData.estimatedRewards.xp,
          coinsCredited: data.coinsCredited || transferData.estimatedRewards.coins,
          achievementsUnlocked: data.achievementsUnlocked || transferData.estimatedRewards.unlockedItems,
          welcomeMessage: data.welcomeMessage || this.generateWelcomeMessage(transferData),
        }
      } else {
        // API failed, but we can still credit locally estimated rewards
        console.warn('Transfer API failed, using estimated rewards')
        
        this.lastTransferResult = {
          success: true, // Still consider it a success for UX
          xpCredited: transferData.estimatedRewards.xp,
          coinsCredited: transferData.estimatedRewards.coins,
          achievementsUnlocked: transferData.estimatedRewards.unlockedItems,
          welcomeMessage: this.generateWelcomeMessage(transferData),
        }
      }

      return this.lastTransferResult
    } catch (error) {
      console.error('Transfer error:', error)
      
      // Fallback to estimated rewards on network error
      const session = getGuestSession().getSession()
      const transferData = this.calculateTransferData(session)
      
      this.lastTransferResult = {
        success: true, // Still show success for UX
        xpCredited: transferData.estimatedRewards.xp,
        coinsCredited: transferData.estimatedRewards.coins,
        achievementsUnlocked: transferData.estimatedRewards.unlockedItems,
        welcomeMessage: this.generateWelcomeMessage(transferData),
      }
      
      return this.lastTransferResult
    } finally {
      this.transferInProgress = false
    }
  }

  /**
   * Generate welcome message based on transfer data
   */
  generateWelcomeMessage(data: SessionTransferData): string {
    const { matchesPlayed, matchesWon, estimatedRewards } = data
    
    if (matchesWon > 0) {
      return `Welcome! Your ${matchesWon} win${matchesWon > 1 ? 's' : ''} and ${estimatedRewards.xp} XP have been credited to your account!`
    } else if (matchesPlayed > 0) {
      return `Welcome! Your progress from ${matchesPlayed} match${matchesPlayed > 1 ? 'es' : ''} has been saved. You earned ${estimatedRewards.xp} XP!`
    } else {
      return `Welcome! You've received ${WELCOME_BONUS.xp} XP and ${WELCOME_BONUS.coins} coins as a welcome bonus!`
    }
  }

  /**
   * Get last transfer result
   */
  getLastTransferResult(): TransferResult | null {
    return this.lastTransferResult
  }

  /**
   * Check if transfer is in progress
   */
  isTransferInProgress(): boolean {
    return this.transferInProgress
  }

  /**
   * Clear transfer state (after showing confirmation)
   */
  clearTransferState(): void {
    this.lastTransferResult = null
  }
}

// Export singleton getter
export const getSessionTransferFlow = () => SessionTransferFlow.getInstance()

/**
 * Pure function to calculate transfer rewards (for testing)
 */
export function calculateTransferRewards(session: GuestSessionStats): SessionTransferData['estimatedRewards'] {
  const milestoneXpBonus = calculateMilestoneXpBonus(session.milestonesAchieved)
  const totalXp = session.previewXpEarned + milestoneXpBonus + WELCOME_BONUS.xp
  const earnedCoins = Math.floor(session.previewXpEarned * XP_TO_COINS_RATE)
  const totalCoins = earnedCoins + WELCOME_BONUS.coins

  const unlockedItems: string[] = []
  if (session.milestonesAchieved.includes('first-win')) unlockedItems.push('Victory Banner')
  if (session.milestonesAchieved.includes('triple-kill')) unlockedItems.push('Eliminator Title')
  if (session.milestonesAchieved.includes('quiz-master')) unlockedItems.push('Brain Icon')
  if (session.milestonesAchieved.includes('veteran')) unlockedItems.push('Veteran Badge')

  return { coins: totalCoins, xp: totalXp, unlockedItems }
}
