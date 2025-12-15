/**
 * MotifTracker - Remembers and recalls successful challenges
 * Creates "signature moments" that recur with variations
 * Builds anticipation: "Oh no, here comes that weave section again"
 */

import type { DifficultyTier } from './types'

/**
 * A motif is a memorable pattern sequence that can be recalled
 */
export interface Motif {
  id: string
  name: string
  patterns: string[]           // Pattern IDs in sequence
  firstSeenDistance: number
  timesPlayed: number
  lastPlayedDistance: number
  playerSuccessRate: number    // 0-1, how often player clears it
  intensity: number            // 0-1, how challenging
  minTier: DifficultyTier
}

/**
 * Motif variation - same motif but harder/different
 */
export interface MotifVariation {
  baseMotifId: string
  variationType: 'harder' | 'faster' | 'extended' | 'mirrored'
  patterns: string[]
  intensityMultiplier: number
}

/**
 * Pre-defined signature motifs
 */
const SIGNATURE_MOTIFS: Omit<Motif, 'firstSeenDistance' | 'timesPlayed' | 'lastPlayedDistance' | 'playerSuccessRate'>[] = [
  {
    id: 'the-gauntlet-intro',
    name: 'Gauntlet Introduction',
    patterns: ['center-block', 'jump-then-dodge', 'lane-weave-simple'],
    intensity: 0.5,
    minTier: 'intermediate',
  },
  {
    id: 'weave-master',
    name: 'Weave Master',
    patterns: ['lane-weave-simple', 'triple-weave', 'single-jump-gate'],
    intensity: 0.7,
    minTier: 'advanced',
  },
  {
    id: 'vertical-assault',
    name: 'Vertical Assault',
    patterns: ['single-jump-gate', 'double-jump', 'spikes-dodge'],
    intensity: 0.6,
    minTier: 'intermediate',
  },
  {
    id: 'corridor-challenge',
    name: 'Corridor Challenge',
    patterns: ['double-side', 'corridor-spikes', 'center-block'],
    intensity: 0.75,
    minTier: 'advanced',
  },
  {
    id: 'the-dance',
    name: 'The Dance',
    patterns: ['single-dodge-left', 'single-jump-gate', 'single-dodge-right', 'single-spikes'],
    intensity: 0.4,
    minTier: 'rookie',
  },
  {
    id: 'expert-gauntlet',
    name: 'Expert Gauntlet',
    patterns: ['rapid-weave', 'spike-gauntlet', 'single-spikes'],
    intensity: 0.9,
    minTier: 'expert',
  },
]

/**
 * Motif variations for callbacks
 */
const MOTIF_VARIATIONS: MotifVariation[] = [
  {
    baseMotifId: 'the-gauntlet-intro',
    variationType: 'harder',
    patterns: ['center-block', 'corridor-spikes', 'triple-weave'],
    intensityMultiplier: 1.3,
  },
  {
    baseMotifId: 'weave-master',
    variationType: 'extended',
    patterns: ['lane-weave-simple', 'triple-weave', 'rapid-weave', 'single-jump-gate'],
    intensityMultiplier: 1.4,
  },
  {
    baseMotifId: 'the-dance',
    variationType: 'faster',
    patterns: ['single-dodge-left', 'jump-then-dodge', 'single-dodge-right', 'spikes-dodge'],
    intensityMultiplier: 1.5,
  },
]

export class MotifTracker {
  private motifs: Map<string, Motif> = new Map()
  private variations: Map<string, MotifVariation[]> = new Map()
  
  // Tracking
  private currentMotif: Motif | null = null
  private motifProgress: number = 0
  private playedMotifs: string[] = []
  private motifCooldowns: Map<string, number> = new Map()
  
  // Config
  private minMotifCooldown: number = 300  // Min distance before replaying motif
  private callbackChance: number = 0.3    // Chance to play variation instead of new

  constructor() {
    this.initializeMotifs()
  }

  /**
   * Initialize signature motifs
   */
  private initializeMotifs(): void {
    SIGNATURE_MOTIFS.forEach(motifDef => {
      const motif: Motif = {
        ...motifDef,
        firstSeenDistance: -1,
        timesPlayed: 0,
        lastPlayedDistance: -1000,
        playerSuccessRate: 1.0,
      }
      this.motifs.set(motif.id, motif)
    })

    // Index variations by base motif
    MOTIF_VARIATIONS.forEach(variation => {
      const existing = this.variations.get(variation.baseMotifId) || []
      existing.push(variation)
      this.variations.set(variation.baseMotifId, existing)
    })
  }

  /**
   * Check if we should start a motif at current distance
   */
  shouldStartMotif(distance: number, currentTier: DifficultyTier, tension: number): boolean {
    // Don't start if already in a motif
    if (this.currentMotif) return false

    // Higher tension = more likely to start motif
    const baseChance = 0.15 + (tension * 0.2)
    
    // Check if any motifs are available
    const available = this.getAvailableMotifs(distance, currentTier)
    if (available.length === 0) return false

    return Math.random() < baseChance
  }

  /**
   * Get motifs available at current state
   */
  getAvailableMotifs(distance: number, currentTier: DifficultyTier): Motif[] {
    const tierOrder = ['rookie', 'intermediate', 'advanced', 'expert', 'master']
    const currentTierIndex = tierOrder.indexOf(currentTier)

    return Array.from(this.motifs.values()).filter(motif => {
      // Check tier requirement
      const motifTierIndex = tierOrder.indexOf(motif.minTier)
      if (motifTierIndex > currentTierIndex) return false

      // Check cooldown
      const cooldown = this.motifCooldowns.get(motif.id) || 0
      if (distance < cooldown) return false

      return true
    })
  }

  /**
   * Select a motif to play (may be variation of previous)
   */
  selectMotif(distance: number, currentTier: DifficultyTier): Motif | null {
    const available = this.getAvailableMotifs(distance, currentTier)
    if (available.length === 0) return null

    // Check for callback opportunity
    if (this.playedMotifs.length > 0 && Math.random() < this.callbackChance) {
      const callback = this.selectCallback(distance, currentTier)
      if (callback) return callback
    }

    // Weight by how long since played and success rate
    const weighted = available.map(motif => {
      let weight = 1.0

      // Boost motifs not played recently
      const distanceSince = distance - motif.lastPlayedDistance
      weight *= Math.min(2, 1 + distanceSince / 500)

      // Slight boost for motifs player succeeds at (fun factor)
      weight *= 0.8 + (motif.playerSuccessRate * 0.4)

      return { motif, weight }
    })

    // Weighted random selection
    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0)
    let random = Math.random() * totalWeight

    for (const { motif, weight } of weighted) {
      random -= weight
      if (random <= 0) return motif
    }

    return weighted[0]?.motif || null
  }

  /**
   * Select a callback (variation of previously played motif)
   */
  private selectCallback(distance: number, _currentTier: DifficultyTier): Motif | null {
    // Find motifs we've played that have variations
    const candidates: { motif: Motif; variation: MotifVariation }[] = []

    for (const motifId of this.playedMotifs) {
      const motif = this.motifs.get(motifId)
      const variations = this.variations.get(motifId)

      if (!motif || !variations) continue

      // Check cooldown
      const cooldown = this.motifCooldowns.get(motifId) || 0
      if (distance < cooldown) continue

      // Add each variation as candidate
      variations.forEach(variation => {
        candidates.push({ motif, variation })
      })
    }

    if (candidates.length === 0) return null

    // Pick random variation
    const selected = candidates[Math.floor(Math.random() * candidates.length)]
    
    // Create modified motif from variation
    const variantMotif: Motif = {
      ...selected.motif,
      id: `${selected.motif.id}-${selected.variation.variationType}`,
      name: `${selected.motif.name} (${selected.variation.variationType})`,
      patterns: selected.variation.patterns,
      intensity: selected.motif.intensity * selected.variation.intensityMultiplier,
    }

    return variantMotif
  }

  /**
   * Start playing a motif
   */
  startMotif(motif: Motif, distance: number): void {
    this.currentMotif = motif
    this.motifProgress = 0

    // Update tracking
    if (motif.firstSeenDistance < 0) {
      motif.firstSeenDistance = distance
    }
    motif.timesPlayed++
    motif.lastPlayedDistance = distance

    // Add to played list (for callbacks)
    if (!this.playedMotifs.includes(motif.id)) {
      this.playedMotifs.push(motif.id)
    }
  }

  /**
   * Get next pattern in current motif
   */
  getNextMotifPattern(): string | null {
    if (!this.currentMotif) return null
    if (this.motifProgress >= this.currentMotif.patterns.length) return null

    const patternId = this.currentMotif.patterns[this.motifProgress]
    this.motifProgress++

    // Check if motif complete
    if (this.motifProgress >= this.currentMotif.patterns.length) {
      this.completeMotif()
    }

    return patternId
  }

  /**
   * Complete current motif
   */
  private completeMotif(): void {
    if (!this.currentMotif) return

    // Set cooldown
    const cooldownDistance = this.minMotifCooldown + (this.currentMotif.intensity * 200)
    this.motifCooldowns.set(
      this.currentMotif.id,
      this.currentMotif.lastPlayedDistance + cooldownDistance
    )

    this.currentMotif = null
    this.motifProgress = 0
  }

  /**
   * Record player success/failure for motif
   */
  recordMotifResult(success: boolean): void {
    if (!this.currentMotif) return

    // Update success rate with exponential moving average
    const alpha = 0.3
    this.currentMotif.playerSuccessRate = 
      alpha * (success ? 1 : 0) + (1 - alpha) * this.currentMotif.playerSuccessRate
  }

  /**
   * Check if currently in a motif
   */
  isInMotif(): boolean {
    return this.currentMotif !== null
  }

  /**
   * Get current motif info
   */
  getCurrentMotif(): Motif | null {
    return this.currentMotif
  }

  /**
   * Get motif progress (0-1)
   */
  getMotifProgress(): number {
    if (!this.currentMotif) return 0
    return this.motifProgress / this.currentMotif.patterns.length
  }

  /**
   * Cancel current motif (e.g., player died)
   */
  cancelMotif(): void {
    this.currentMotif = null
    this.motifProgress = 0
  }

  /**
   * Get debug info
   */
  getDebugInfo(): object {
    return {
      currentMotif: this.currentMotif?.name || null,
      progress: this.motifProgress,
      playedMotifs: this.playedMotifs,
      totalMotifs: this.motifs.size,
    }
  }

  /**
   * Reset state
   */
  reset(): void {
    this.currentMotif = null
    this.motifProgress = 0
    this.playedMotifs = []
    this.motifCooldowns.clear()

    // Reset motif stats
    this.motifs.forEach(motif => {
      motif.timesPlayed = 0
      motif.lastPlayedDistance = -1000
      motif.firstSeenDistance = -1
      motif.playerSuccessRate = 1.0
    })
  }
}
