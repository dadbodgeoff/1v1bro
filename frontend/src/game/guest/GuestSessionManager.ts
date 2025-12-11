/**
 * GuestSessionManager - Tracks guest player progress in localStorage
 * 
 * Manages session statistics, milestones, and preview XP for unauthenticated
 * players. Data persists across page reloads but is cleared on explicit reset
 * or after successful account creation with transfer.
 * 
 * @module game/guest/GuestSessionManager
 * Requirements: 4.1, 4.4
 */

// Session data version for migration support
const SESSION_VERSION = 1
const STORAGE_KEY = 'guest_session'

/**
 * Statistics tracked during a guest session
 */
export interface GuestSessionStats {
  sessionId: string
  startedAt: number
  lastPlayedAt: number
  matchesPlayed: number
  matchesWon: number
  totalKills: number
  totalDeaths: number
  questionsAnswered: number
  questionsCorrect: number
  previewXpEarned: number
  milestonesAchieved: string[]
  categoriesPlayed: string[]
}

/**
 * Match result data for recording
 */
export interface MatchResult {
  won: boolean
  playerScore: number
  botScore: number
  kills: number
  deaths: number
  questionsAnswered: number
  questionsCorrect: number
  matchDurationMs: number
  category: string
}

/**
 * Persisted session data structure
 */
interface GuestSessionData {
  version: number
  stats: GuestSessionStats
  promptsShown: string[]
  promptsDismissed: string[]
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Create a fresh session with default values
 */
function createFreshSession(): GuestSessionStats {
  const now = Date.now()
  return {
    sessionId: generateSessionId(),
    startedAt: now,
    lastPlayedAt: now,
    matchesPlayed: 0,
    matchesWon: 0,
    totalKills: 0,
    totalDeaths: 0,
    questionsAnswered: 0,
    questionsCorrect: 0,
    previewXpEarned: 0,
    milestonesAchieved: [],
    categoriesPlayed: [],
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
 * GuestSessionManager class
 * 
 * Singleton pattern for consistent session access across the app.
 */
export class GuestSessionManager {
  private static instance: GuestSessionManager | null = null
  private stats: GuestSessionStats
  private promptsShown: string[] = []
  private promptsDismissed: string[] = []
  private storageAvailable: boolean
  private listeners: Set<(stats: GuestSessionStats) => void> = new Set()

  private constructor() {
    this.storageAvailable = isStorageAvailable()
    this.stats = this.loadSession()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): GuestSessionManager {
    if (!GuestSessionManager.instance) {
      GuestSessionManager.instance = new GuestSessionManager()
    }
    return GuestSessionManager.instance
  }

  /**
   * Reset singleton (for testing)
   */
  static resetInstance(): void {
    GuestSessionManager.instance = null
  }

  /**
   * Load session from localStorage or create fresh
   */
  private loadSession(): GuestSessionStats {
    if (!this.storageAvailable) {
      console.warn('[GuestSession] localStorage unavailable, using in-memory session')
      return createFreshSession()
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        return createFreshSession()
      }

      const data: GuestSessionData = JSON.parse(stored)
      
      // Version check for future migrations
      if (data.version !== SESSION_VERSION) {
        console.warn('[GuestSession] Session version mismatch, creating fresh session')
        return createFreshSession()
      }

      // Validate required fields
      if (!data.stats || !data.stats.sessionId) {
        console.warn('[GuestSession] Invalid session data, creating fresh session')
        return createFreshSession()
      }

      this.promptsShown = data.promptsShown || []
      this.promptsDismissed = data.promptsDismissed || []
      
      return data.stats
    } catch (err) {
      console.error('[GuestSession] Failed to load session:', err)
      return createFreshSession()
    }
  }

  /**
   * Save session to localStorage
   */
  private saveSession(): void {
    if (!this.storageAvailable) return

    try {
      const data: GuestSessionData = {
        version: SESSION_VERSION,
        stats: this.stats,
        promptsShown: this.promptsShown,
        promptsDismissed: this.promptsDismissed,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (err) {
      console.error('[GuestSession] Failed to save session:', err)
    }
  }

  /**
   * Notify listeners of stats change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.stats))
  }

  /**
   * Get current session stats
   */
  getSession(): GuestSessionStats {
    return { ...this.stats }
  }

  /**
   * Check if storage is available
   */
  isStorageAvailable(): boolean {
    return this.storageAvailable
  }

  /**
   * Record a match result and update stats
   */
  recordMatchResult(result: MatchResult): void {
    this.stats.matchesPlayed += 1
    if (result.won) {
      this.stats.matchesWon += 1
    }
    this.stats.totalKills += result.kills
    this.stats.totalDeaths += result.deaths
    this.stats.questionsAnswered += result.questionsAnswered
    this.stats.questionsCorrect += result.questionsCorrect
    this.stats.lastPlayedAt = Date.now()

    // Track categories played
    if (!this.stats.categoriesPlayed.includes(result.category)) {
      this.stats.categoriesPlayed.push(result.category)
    }

    // Calculate and add preview XP
    const matchXp = calculatePreviewXp(result)
    this.stats.previewXpEarned += matchXp

    this.saveSession()
    this.notifyListeners()
  }

  /**
   * Add a milestone achievement
   */
  addMilestone(milestoneId: string): void {
    if (!this.stats.milestonesAchieved.includes(milestoneId)) {
      this.stats.milestonesAchieved.push(milestoneId)
      this.saveSession()
      this.notifyListeners()
    }
  }

  /**
   * Check if a milestone has been achieved
   */
  hasMilestone(milestoneId: string): boolean {
    return this.stats.milestonesAchieved.includes(milestoneId)
  }

  /**
   * Record that a prompt was shown
   */
  recordPromptShown(promptId: string): void {
    if (!this.promptsShown.includes(promptId)) {
      this.promptsShown.push(promptId)
      this.saveSession()
    }
  }

  /**
   * Record that a prompt was dismissed
   */
  recordPromptDismissed(promptId: string): void {
    if (!this.promptsDismissed.includes(promptId)) {
      this.promptsDismissed.push(promptId)
      this.saveSession()
    }
  }

  /**
   * Check if a prompt was shown
   */
  wasPromptShown(promptId: string): boolean {
    return this.promptsShown.includes(promptId)
  }

  /**
   * Check if a prompt was dismissed
   */
  wasPromptDismissed(promptId: string): boolean {
    return this.promptsDismissed.includes(promptId)
  }

  /**
   * Subscribe to stats changes
   */
  subscribe(listener: (stats: GuestSessionStats) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Clear session data
   */
  clearSession(): void {
    this.stats = createFreshSession()
    this.promptsShown = []
    this.promptsDismissed = []
    
    if (this.storageAvailable) {
      localStorage.removeItem(STORAGE_KEY)
    }
    
    this.notifyListeners()
  }

  /**
   * Get data for session transfer during signup
   */
  getTransferData(): {
    previewXp: number
    matchesPlayed: number
    matchesWon: number
    milestonesAchieved: string[]
  } {
    return {
      previewXp: this.stats.previewXpEarned,
      matchesPlayed: this.stats.matchesPlayed,
      matchesWon: this.stats.matchesWon,
      milestonesAchieved: [...this.stats.milestonesAchieved],
    }
  }

  /**
   * Check if there's a session worth transferring
   */
  hasTransferableSession(): boolean {
    return this.stats.matchesPlayed > 0 || this.stats.previewXpEarned > 0
  }
}

/**
 * Calculate preview XP for a match result
 * 
 * Pure function for consistent calculation across preview and transfer.
 * 
 * Formula:
 * - Base XP: 50 for playing
 * - Win bonus: 100
 * - Score bonus: playerScore / 10
 * - Kill bonus: 25 per kill
 * - Accuracy bonus: (questionsCorrect / questionsAnswered) * 50
 */
export function calculatePreviewXp(result: MatchResult): number {
  let xp = 50 // Base XP for playing

  // Win bonus
  if (result.won) {
    xp += 100
  }

  // Score bonus (capped at 200)
  xp += Math.min(200, Math.floor(result.playerScore / 10))

  // Kill bonus
  xp += result.kills * 25

  // Accuracy bonus
  if (result.questionsAnswered > 0) {
    const accuracy = result.questionsCorrect / result.questionsAnswered
    xp += Math.floor(accuracy * 50)
  }

  return xp
}

/**
 * Accumulate stats from multiple match results
 * 
 * Pure function for property testing.
 */
export function accumulateStats(
  initial: GuestSessionStats,
  results: MatchResult[]
): GuestSessionStats {
  const accumulated = { ...initial }
  
  for (const result of results) {
    accumulated.matchesPlayed += 1
    if (result.won) {
      accumulated.matchesWon += 1
    }
    accumulated.totalKills += result.kills
    accumulated.totalDeaths += result.deaths
    accumulated.questionsAnswered += result.questionsAnswered
    accumulated.questionsCorrect += result.questionsCorrect
    accumulated.previewXpEarned += calculatePreviewXp(result)
    
    if (!accumulated.categoriesPlayed.includes(result.category)) {
      accumulated.categoriesPlayed = [...accumulated.categoriesPlayed, result.category]
    }
  }
  
  return accumulated
}

// Export singleton getter for convenience
export const getGuestSession = () => GuestSessionManager.getInstance()
