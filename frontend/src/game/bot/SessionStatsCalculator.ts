/**
 * SessionStatsCalculator - Calculates and aggregates statistics during practice sessions
 *
 * **Feature: single-player-enhancement**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 */

// Complete session statistics
export interface SessionStats {
  // Quiz stats
  totalQuestions: number
  correctAnswers: number
  accuracy: number // percentage (0-100)
  averageAnswerTime: number // seconds
  longestStreak: number

  // Combat stats
  kills: number
  deaths: number
  kdRatio: number
  damageDealt: number

  // Session meta
  duration: number // seconds
  finalScore: number
  effectiveDifficulty: number // 0.0 - 1.0
  isPersonalBest: boolean
}

// Internal answer record
interface AnswerRecord {
  correct: boolean
  timeMs: number
}

/**
 * Calculate accuracy percentage from correct answers and total questions
 * Returns 0 if no questions answered
 * **Property 3: Accuracy calculation correctness**
 * **Validates: Requirements 3.1**
 */
export function calculateAccuracy(
  correctAnswers: number,
  totalQuestions: number
): number {
  if (totalQuestions === 0) return 0
  // Round to 2 decimal places
  return Math.round((correctAnswers / totalQuestions) * 10000) / 100
}

/**
 * Calculate average answer time from array of times
 * Returns 0 if no answers
 * **Property 4: Average answer time calculation**
 * **Validates: Requirements 3.2**
 */
export function calculateAverageTime(timesMs: number[]): number {
  if (timesMs.length === 0) return 0
  const sum = timesMs.reduce((acc, t) => acc + t, 0)
  // Convert to seconds and round to 2 decimal places
  return Math.round((sum / timesMs.length / 1000) * 100) / 100
}

/**
 * Calculate longest streak of consecutive correct answers
 * **Property 5: Streak calculation correctness**
 * **Validates: Requirements 3.3**
 */
export function calculateLongestStreak(results: boolean[]): number {
  if (results.length === 0) return 0

  let maxStreak = 0
  let currentStreak = 0

  for (const correct of results) {
    if (correct) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  }

  return maxStreak
}

/**
 * Calculate K/D ratio
 * Returns kills if deaths is 0 (avoids division by zero)
 * **Property 6: K/D ratio calculation**
 * **Validates: Requirements 3.4**
 */
export function calculateKDRatio(kills: number, deaths: number): number {
  const divisor = Math.max(deaths, 1)
  // Round to 2 decimal places
  return Math.round((kills / divisor) * 100) / 100
}

/**
 * SessionStatsCalculator class for tracking stats during a practice session
 */
export class SessionStatsCalculator {
  private answers: AnswerRecord[] = []
  private kills = 0
  private deaths = 0
  private damageDealt = 0
  private startTime: number
  private finalScore = 0
  private effectiveDifficulty = 0.5

  constructor() {
    this.startTime = Date.now()
  }

  /**
   * Record a quiz answer
   */
  recordAnswer(correct: boolean, timeMs: number): void {
    this.answers.push({ correct, timeMs })
  }

  /**
   * Record a kill
   */
  recordKill(): void {
    this.kills++
  }

  /**
   * Record a death
   */
  recordDeath(): void {
    this.deaths++
  }

  /**
   * Record damage dealt
   */
  recordDamage(amount: number): void {
    this.damageDealt += amount
  }

  /**
   * Set the final score
   */
  setFinalScore(score: number): void {
    this.finalScore = score
  }

  /**
   * Set the effective difficulty level
   */
  setEffectiveDifficulty(difficulty: number): void {
    this.effectiveDifficulty = difficulty
  }

  /**
   * Get current stats (for live display)
   */
  getCurrentStats(): Partial<SessionStats> {
    const correctAnswers = this.answers.filter((a) => a.correct).length
    const totalQuestions = this.answers.length
    const times = this.answers.map((a) => a.timeMs)
    const results = this.answers.map((a) => a.correct)

    return {
      totalQuestions,
      correctAnswers,
      accuracy: calculateAccuracy(correctAnswers, totalQuestions),
      averageAnswerTime: calculateAverageTime(times),
      longestStreak: calculateLongestStreak(results),
      kills: this.kills,
      deaths: this.deaths,
      kdRatio: calculateKDRatio(this.kills, this.deaths),
      damageDealt: this.damageDealt,
    }
  }

  /**
   * Calculate final stats at end of session
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
   */
  calculateFinalStats(isPersonalBest = false): SessionStats {
    const correctAnswers = this.answers.filter((a) => a.correct).length
    const totalQuestions = this.answers.length
    const times = this.answers.map((a) => a.timeMs)
    const results = this.answers.map((a) => a.correct)

    const endTime = Date.now()
    const durationMs = endTime - this.startTime
    const durationSeconds = Math.round(durationMs / 1000)

    return {
      totalQuestions,
      correctAnswers,
      accuracy: calculateAccuracy(correctAnswers, totalQuestions),
      averageAnswerTime: calculateAverageTime(times),
      longestStreak: calculateLongestStreak(results),
      kills: this.kills,
      deaths: this.deaths,
      kdRatio: calculateKDRatio(this.kills, this.deaths),
      damageDealt: this.damageDealt,
      duration: durationSeconds,
      finalScore: this.finalScore,
      effectiveDifficulty: this.effectiveDifficulty,
      isPersonalBest,
    }
  }

  /**
   * Reset the calculator for a new session
   */
  reset(): void {
    this.answers = []
    this.kills = 0
    this.deaths = 0
    this.damageDealt = 0
    this.startTime = Date.now()
    this.finalScore = 0
    this.effectiveDifficulty = 0.5
  }
}
