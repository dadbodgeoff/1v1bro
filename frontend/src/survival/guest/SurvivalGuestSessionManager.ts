/**
 * SurvivalGuestSessionManager - Tracks guest survival runner progress
 * 
 * Manages session statistics, best runs, and preview XP for unauthenticated
 * survival mode players. Data persists across page reloads and can be
 * transferred to an account on signup.
 * 
 * @module survival/guest/SurvivalGuestSessionManager
 */

const SESSION_VERSION = 1
const STORAGE_KEY = 'survival_guest_session'

/**
 * Statistics tracked during a guest survival session
 */
export interface SurvivalGuestStats {
  sessionId: string
  startedAt: number
  lastPlayedAt: number
  totalRuns: number
  bestDistance: number
  bestScore: number
  bestCombo: number
  totalDistance: number
  totalScore: number
  previewXpEarned: number
  milestonesAchieved: string[]
  // Trivia stats
  totalQuestionsAnswered: number
  totalQuestionsCorrect: number
  bestTriviaStreak: number
}

/**
 * Run result data for recording
 */
export interface SurvivalRunResult {
  distance: number
  score: number
  maxCombo: number
  durationMs: number
  livesLost: number
  // Trivia stats for this run
  questionsAnswered: number
  questionsCorrect: number
  triviaStreak: number
  triviaScore: number
}

/**
 * Persisted session data structure
 */
interface SurvivalGuestSessionData {
  version: number
  stats: SurvivalGuestStats
  promptsShown: string[]
  promptsDismissed: string[]
  lastRunData: SurvivalRunResult | null
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `survival_guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Create a fresh session with default values
 */
function createFreshSession(): SurvivalGuestStats {
  const now = Date.now()
  return {
    sessionId: generateSessionId(),
    startedAt: now,
    lastPlayedAt: now,
    totalRuns: 0,
    bestDistance: 0,
    bestScore: 0,
    bestCombo: 0,
    totalDistance: 0,
    totalScore: 0,
    previewXpEarned: 0,
    milestonesAchieved: [],
    totalQuestionsAnswered: 0,
    totalQuestionsCorrect: 0,
    bestTriviaStreak: 0,
  }
}

/**
 * Check if localStorage is available
 */
function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * SurvivalGuestSessionManager class
 */
export class SurvivalGuestSessionManager {
  private static instance: SurvivalGuestSessionManager | null = null
  private stats: SurvivalGuestStats
  private promptsShown: string[] = []
  private promptsDismissed: string[] = []
  private lastRunData: SurvivalRunResult | null = null
  private storageAvailable: boolean
  private listeners: Set<(stats: SurvivalGuestStats) => void> = new Set()

  private constructor() {
    this.storageAvailable = isStorageAvailable()
    this.stats = this.loadSession()
  }

  static getInstance(): SurvivalGuestSessionManager {
    if (!SurvivalGuestSessionManager.instance) {
      SurvivalGuestSessionManager.instance = new SurvivalGuestSessionManager()
    }
    return SurvivalGuestSessionManager.instance
  }

  static resetInstance(): void {
    SurvivalGuestSessionManager.instance = null
  }

  private loadSession(): SurvivalGuestStats {
    if (!this.storageAvailable) {
      console.warn('[SurvivalGuestSession] localStorage unavailable')
      return createFreshSession()
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        return createFreshSession()
      }

      const data: SurvivalGuestSessionData = JSON.parse(stored)
      
      if (data.version !== SESSION_VERSION) {
        return createFreshSession()
      }

      if (!data.stats || !data.stats.sessionId) {
        return createFreshSession()
      }

      this.promptsShown = data.promptsShown || []
      this.promptsDismissed = data.promptsDismissed || []
      this.lastRunData = data.lastRunData || null
      
      return data.stats
    } catch (err) {
      console.error('[SurvivalGuestSession] Failed to load:', err)
      return createFreshSession()
    }
  }

  private saveSession(): void {
    if (!this.storageAvailable) return

    try {
      const data: SurvivalGuestSessionData = {
        version: SESSION_VERSION,
        stats: this.stats,
        promptsShown: this.promptsShown,
        promptsDismissed: this.promptsDismissed,
        lastRunData: this.lastRunData,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (err) {
      console.error('[SurvivalGuestSession] Failed to save:', err)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.stats))
  }

  getSession(): SurvivalGuestStats {
    return { ...this.stats }
  }

  getLastRunData(): SurvivalRunResult | null {
    return this.lastRunData ? { ...this.lastRunData } : null
  }

  isStorageAvailable(): boolean {
    return this.storageAvailable
  }

  /**
   * Record a survival run result
   */
  recordRunResult(result: SurvivalRunResult): { isNewPB: boolean; previewXp: number } {
    const isNewPB = result.distance > this.stats.bestDistance
    
    this.stats.totalRuns += 1
    this.stats.totalDistance += result.distance
    this.stats.totalScore += result.score
    this.stats.lastPlayedAt = Date.now()
    
    // Update bests
    if (result.distance > this.stats.bestDistance) {
      this.stats.bestDistance = result.distance
    }
    if (result.score > this.stats.bestScore) {
      this.stats.bestScore = result.score
    }
    if (result.maxCombo > this.stats.bestCombo) {
      this.stats.bestCombo = result.maxCombo
    }

    // Update trivia stats
    this.stats.totalQuestionsAnswered += result.questionsAnswered
    this.stats.totalQuestionsCorrect += result.questionsCorrect
    if (result.triviaStreak > this.stats.bestTriviaStreak) {
      this.stats.bestTriviaStreak = result.triviaStreak
    }

    // Calculate and add preview XP
    const previewXp = calculateSurvivalPreviewXp(result, isNewPB)
    this.stats.previewXpEarned += previewXp

    // Store last run for potential save
    this.lastRunData = result

    this.saveSession()
    this.notifyListeners()

    return { isNewPB, previewXp }
  }

  addMilestone(milestoneId: string): void {
    if (!this.stats.milestonesAchieved.includes(milestoneId)) {
      this.stats.milestonesAchieved.push(milestoneId)
      this.saveSession()
      this.notifyListeners()
    }
  }

  hasMilestone(milestoneId: string): boolean {
    return this.stats.milestonesAchieved.includes(milestoneId)
  }

  recordPromptShown(promptId: string): void {
    if (!this.promptsShown.includes(promptId)) {
      this.promptsShown.push(promptId)
      this.saveSession()
    }
  }

  recordPromptDismissed(promptId: string): void {
    if (!this.promptsDismissed.includes(promptId)) {
      this.promptsDismissed.push(promptId)
      this.saveSession()
    }
  }

  wasPromptShown(promptId: string): boolean {
    return this.promptsShown.includes(promptId)
  }

  wasPromptDismissed(promptId: string): boolean {
    return this.promptsDismissed.includes(promptId)
  }

  subscribe(listener: (stats: SurvivalGuestStats) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  clearSession(): void {
    this.stats = createFreshSession()
    this.promptsShown = []
    this.promptsDismissed = []
    this.lastRunData = null
    
    if (this.storageAvailable) {
      localStorage.removeItem(STORAGE_KEY)
    }
    
    this.notifyListeners()
  }

  getTransferData(): {
    previewXp: number
    totalRuns: number
    bestDistance: number
    bestScore: number
    bestCombo: number
    milestonesAchieved: string[]
  } {
    return {
      previewXp: this.stats.previewXpEarned,
      totalRuns: this.stats.totalRuns,
      bestDistance: this.stats.bestDistance,
      bestScore: this.stats.bestScore,
      bestCombo: this.stats.bestCombo,
      milestonesAchieved: [...this.stats.milestonesAchieved],
    }
  }

  hasTransferableSession(): boolean {
    return this.stats.totalRuns > 0 || this.stats.previewXpEarned > 0
  }
}

/**
 * Calculate preview XP for a survival run
 */
export function calculateSurvivalPreviewXp(result: SurvivalRunResult, isNewPB: boolean): number {
  let xp = 25 // Base XP for completing a run

  // Distance bonus (1 XP per 10m)
  xp += Math.floor(result.distance / 10)

  // Score bonus (1 XP per 100 points)
  xp += Math.floor(result.score / 100)

  // Combo bonus (5 XP per max combo level)
  xp += result.maxCombo * 5

  // New personal best bonus
  if (isNewPB) {
    xp += 50
  }

  // Survival bonus (less lives lost = more XP)
  xp += Math.max(0, (3 - result.livesLost) * 15)

  // Trivia bonus (10 XP per correct answer)
  xp += result.questionsCorrect * 10

  // Trivia streak bonus (bonus for maintaining streaks)
  if (result.triviaStreak >= 5) {
    xp += 25
  } else if (result.triviaStreak >= 3) {
    xp += 10
  }

  return xp
}

export const getSurvivalGuestSession = () => SurvivalGuestSessionManager.getInstance()
