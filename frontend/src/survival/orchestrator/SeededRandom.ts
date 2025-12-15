/**
 * SeededRandom - Deterministic random number generator
 * Enables reproducible runs for leaderboards and daily challenges
 */

/**
 * Mulberry32 PRNG - Fast, good distribution, 32-bit state
 */
export class SeededRandom {
  private state: number

  constructor(seed?: number) {
    this.state = seed ?? Date.now()
  }

  /**
   * Get next random number [0, 1)
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /**
   * Get random integer in range [min, max] inclusive
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  /**
   * Get random float in range [min, max)
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min
  }

  /**
   * Get random boolean with given probability of true
   */
  nextBool(probability: number = 0.5): boolean {
    return this.next() < probability
  }

  /**
   * Pick random element from array
   */
  pick<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined
    return array[this.nextInt(0, array.length - 1)]
  }

  /**
   * Shuffle array in place (Fisher-Yates)
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i)
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  /**
   * Weighted random selection
   */
  weightedPick<T>(items: T[], weights: number[]): T | undefined {
    if (items.length === 0 || items.length !== weights.length) return undefined

    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    if (totalWeight <= 0) return undefined

    let random = this.next() * totalWeight

    for (let i = 0; i < items.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        return items[i]
      }
    }

    return items[items.length - 1]
  }

  /**
   * Get current seed state (for saving/restoring)
   */
  getState(): number {
    return this.state
  }

  /**
   * Set seed state (for restoring)
   */
  setState(state: number): void {
    this.state = state
  }

  /**
   * Create a new generator with same seed
   */
  clone(): SeededRandom {
    const clone = new SeededRandom()
    clone.state = this.state
    return clone
  }

  /**
   * Generate a seed from string (for daily challenges)
   */
  static seedFromString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash  // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Generate seed for daily challenge
   */
  static dailySeed(date: Date = new Date()): number {
    const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    return SeededRandom.seedFromString(dateStr)
  }
}
