/**
 * PracticeRewards - XP calculation and daily bonus logic for practice mode
 *
 * **Feature: single-player-enhancement**
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
 */

// XP rates and bonuses
const PRACTICE_XP_RATE = 0.25 // 25% of multiplayer XP (Requirements 7.1)
const PERSONAL_BEST_BONUS = 50 // XP bonus for new personal best (Requirements 7.2)
const TUTORIAL_COMPLETION_BONUS = 100 // One-time XP for tutorial (Requirements 7.3)
const DAILY_PRACTICE_BONUS = 75 // XP for 5 sessions in a day (Requirements 7.4)
const DAILY_SESSIONS_THRESHOLD = 5 // Sessions needed for daily bonus

// Multiplayer XP calculation (base rate)
// In multiplayer, XP is roughly score / 10
const MULTIPLAYER_XP_RATE = 0.1

/**
 * Calculate practice XP from a session score
 * Returns 25% of equivalent multiplayer XP (floor division)
 * **Property 12: Practice XP calculation**
 * **Validates: Requirements 7.1**
 */
export function calculatePracticeXP(score: number): number {
  // Multiplayer XP would be score * 0.1
  // Practice XP is 25% of that
  const multiplayerXP = Math.floor(score * MULTIPLAYER_XP_RATE)
  return Math.floor(multiplayerXP * PRACTICE_XP_RATE)
}

/**
 * Get personal best bonus XP
 * **Validates: Requirements 7.2**
 */
export function getPersonalBestBonus(): number {
  return PERSONAL_BEST_BONUS
}

/**
 * Get tutorial completion bonus XP
 * **Validates: Requirements 7.3**
 */
export function getTutorialCompletionBonus(): number {
  return TUTORIAL_COMPLETION_BONUS
}

/**
 * Check if daily bonus should be awarded
 * **Property 13: Daily bonus threshold**
 * **Validates: Requirements 7.4**
 */
export function shouldAwardDailyBonus(
  sessionCount: number,
  alreadyClaimed: boolean
): boolean {
  return sessionCount >= DAILY_SESSIONS_THRESHOLD && !alreadyClaimed
}

/**
 * Get daily practice bonus XP
 * **Validates: Requirements 7.4**
 */
export function getDailyPracticeBonus(): number {
  return DAILY_PRACTICE_BONUS
}

/**
 * Get sessions remaining until daily bonus
 */
export function getSessionsUntilDailyBonus(currentCount: number): number {
  return Math.max(0, DAILY_SESSIONS_THRESHOLD - currentCount)
}

/**
 * Reward breakdown for display
 */
export interface RewardBreakdown {
  baseXP: number
  personalBestBonus: number
  dailyBonus: number
  tutorialBonus: number
  totalXP: number
}

/**
 * Calculate total rewards for a practice session
 */
export function calculateSessionRewards(
  score: number,
  isPersonalBest: boolean,
  sessionCount: number,
  dailyBonusClaimed: boolean,
  tutorialJustCompleted: boolean
): RewardBreakdown {
  const baseXP = calculatePracticeXP(score)
  const personalBestBonus = isPersonalBest ? PERSONAL_BEST_BONUS : 0
  const dailyBonus = shouldAwardDailyBonus(sessionCount, dailyBonusClaimed)
    ? DAILY_PRACTICE_BONUS
    : 0
  const tutorialBonus = tutorialJustCompleted ? TUTORIAL_COMPLETION_BONUS : 0

  return {
    baseXP,
    personalBestBonus,
    dailyBonus,
    tutorialBonus,
    totalXP: baseXP + personalBestBonus + dailyBonus + tutorialBonus,
  }
}

/**
 * Format XP for display
 */
export function formatXP(xp: number): string {
  return `${xp.toLocaleString()} XP`
}

/**
 * Get reward message for display
 */
export function getRewardMessage(breakdown: RewardBreakdown): string[] {
  const messages: string[] = []

  if (breakdown.baseXP > 0) {
    messages.push(`+${breakdown.baseXP} XP (Practice)`)
  }

  if (breakdown.personalBestBonus > 0) {
    messages.push(`+${breakdown.personalBestBonus} XP (New Personal Best!)`)
  }

  if (breakdown.dailyBonus > 0) {
    messages.push(`+${breakdown.dailyBonus} XP (Daily Practice Bonus!)`)
  }

  if (breakdown.tutorialBonus > 0) {
    messages.push(`+${breakdown.tutorialBonus} XP (Tutorial Complete!)`)
  }

  return messages
}
