/**
 * SymphonyConductor - The maestro that orchestrates all components
 * Combines TensionCurve, FlowAnalyzer, MotifTracker, PhraseComposer,
 * DynamicBreather, and existing systems into a beautiful symphony
 * 
 * This is the brain that makes obstacle placement feel composed,
 * not random. It thinks ahead, remembers the past, and adapts to the player.
 */

import type { ObstaclePattern, SpawnRequest, DifficultyTier, PacingPhase } from './types'
import type { PatternLibrary } from './PatternLibrary'
import type { DifficultyManager } from './DifficultyManager'
import type { PacingController } from './PacingController'
import type { SpacingCalculator } from './SpacingCalculator'

import { TensionCurve, type TensionState } from './TensionCurve'
import { FlowAnalyzer, type FlowMetrics } from './FlowAnalyzer'
import { MotifTracker } from './MotifTracker'
import { PhraseComposer, type Phrase } from './PhraseComposer'
import { DynamicBreather, type BreatherRecommendation } from './DynamicBreather'

/**
 * Symphony state - the current musical context
 */
export interface SymphonyState {
  // Current phrase being played
  currentPhrase: Phrase | null
  phraseProgress: number
  
  // Tension and flow
  tension: TensionState
  flowMetrics: FlowMetrics | null
  
  // Motif tracking
  inMotif: boolean
  currentMotifName: string | null
  
  // Breather state
  breatherRecommendation: BreatherRecommendation
  isInBreather: boolean
  breatherPatternsRemaining: number
  
  // Stats
  phrasesComposed: number
  motifsPlayed: number
  breathersGiven: number
}

/**
 * Events emitted by the conductor
 */
export interface SymphonyEvents {
  onPhraseStart?: (phrase: Phrase) => void
  onPhraseEnd?: (phrase: Phrase) => void
  onMotifStart?: (motifName: string) => void
  onMotifEnd?: (motifName: string) => void
  onBreatherStart?: () => void
  onBreatherEnd?: () => void
  onTensionPeak?: (tension: number) => void
  onTensionValley?: (tension: number) => void
}

export class SymphonyConductor {
  // Core systems (from existing orchestrator)
  private library: PatternLibrary
  private difficultyManager: DifficultyManager
  private pacingController: PacingController
  private spacingCalculator: SpacingCalculator

  // Symphony components
  private tensionCurve: TensionCurve
  private flowAnalyzer: FlowAnalyzer
  private motifTracker: MotifTracker
  private phraseComposer: PhraseComposer
  private dynamicBreather: DynamicBreather

  // State
  private currentPhrase: Phrase | null = null
  private phrasePatternIndex: number = 0
  private isInBreather: boolean = false
  private breatherPatternsRemaining: number = 0
  private recentPatterns: string[] = []
  private lastSpawnZ: number = -50

  // Stats
  private phrasesComposed: number = 0
  private motifsPlayed: number = 0
  private breathersGiven: number = 0

  // Events
  private events: SymphonyEvents

  constructor(
    library: PatternLibrary,
    difficultyManager: DifficultyManager,
    pacingController: PacingController,
    spacingCalculator: SpacingCalculator,
    events: SymphonyEvents = {}
  ) {
    this.library = library
    this.difficultyManager = difficultyManager
    this.pacingController = pacingController
    this.spacingCalculator = spacingCalculator
    this.events = events

    // Initialize symphony components
    this.tensionCurve = new TensionCurve()
    this.flowAnalyzer = new FlowAnalyzer()
    this.motifTracker = new MotifTracker()
    this.phraseComposer = new PhraseComposer(library, this.flowAnalyzer, this.tensionCurve)
    this.dynamicBreather = new DynamicBreather(this.tensionCurve)
  }

  /**
   * Main update - conducts the symphony
   * Returns spawn requests for the next section
   */
  conduct(
    playerZ: number,
    currentSpeed: number,
    distance: number
  ): SpawnRequest[] {
    const spawns: SpawnRequest[] = []
    const spawnThreshold = playerZ - 100 // Spawn 100 units ahead

    // Update tension state
    const tensionState = this.tensionCurve.getState(distance)
    this.checkTensionEvents(tensionState, distance)

    // Check for breather need
    const breatherRec = this.dynamicBreather.shouldTriggerBreather(distance)
    if (breatherRec.shouldBreather && !this.isInBreather) {
      this.startBreather(breatherRec, distance)
    }

    // Generate patterns until we've spawned enough ahead
    let iterations = 0
    while (this.lastSpawnZ > spawnThreshold && iterations < 20) {
      iterations++
      const pattern = this.selectNextPattern(distance, currentSpeed)
      if (!pattern) {
        break
      }

      // Track if pattern has jump obstacles (used for gap calculation)
      const hasJumpObstacle = pattern.placements.some(p => p.type === 'lowBarrier' || p.type === 'spikes')
      void hasJumpObstacle

      // Calculate gap
      const gap = this.calculateGap(pattern, currentSpeed, distance)
      this.lastSpawnZ -= gap

      // Create spawn requests
      const patternSpawns = this.createSpawnRequests(pattern, this.lastSpawnZ)
      spawns.push(...patternSpawns)

      // Move past pattern
      this.lastSpawnZ -= pattern.length

      // Record pattern
      this.recordPattern(pattern)
    }

    return spawns
  }

  /**
   * Select the next pattern using symphony logic
   */
  private selectNextPattern(distance: number, _currentSpeed: number): ObstaclePattern | null {
    const currentTier = this.difficultyManager.getCurrentTier()
    const currentPhase = this.pacingController.getCurrentPhase()
    const tension = this.tensionCurve.calculate(distance)

    // Priority 1: Breather patterns
    if (this.isInBreather) {
      return this.selectBreatherPattern(currentTier)
    }

    // Priority 2: Continue current motif
    if (this.motifTracker.isInMotif()) {
      const motifPatternId = this.motifTracker.getNextMotifPattern()
      if (motifPatternId) {
        const pattern = this.library.getPattern(motifPatternId)
        if (pattern) return pattern
      }
    }

    // Priority 3: Continue current phrase
    if (this.currentPhrase && this.phrasePatternIndex < this.currentPhrase.patterns.length) {
      const pattern = this.currentPhrase.patterns[this.phrasePatternIndex]
      this.phrasePatternIndex++

      // Check if phrase complete
      if (this.phrasePatternIndex >= this.currentPhrase.patterns.length) {
        this.endPhrase()
      }

      return pattern
    }

    // Priority 4: Start a motif (if conditions are right)
    if (this.motifTracker.shouldStartMotif(distance, currentTier, tension)) {
      const motif = this.motifTracker.selectMotif(distance, currentTier)
      if (motif) {
        this.motifTracker.startMotif(motif, distance)
        this.motifsPlayed++
        this.events.onMotifStart?.(motif.name)

        const patternId = this.motifTracker.getNextMotifPattern()
        if (patternId) {
          const pattern = this.library.getPattern(patternId)
          if (pattern) return pattern
        }
      }
    }

    // Priority 5: Compose a new phrase
    const phrase = this.phraseComposer.compose(
      distance,
      currentTier,
      currentPhase,
      this.recentPatterns
    )

    if (phrase && phrase.patterns.length > 0) {
      this.startPhrase(phrase)
      const pattern = this.currentPhrase!.patterns[this.phrasePatternIndex]
      this.phrasePatternIndex++
      return pattern
    }

    // Fallback: Single pattern selection
    return this.selectSinglePattern(currentTier, currentPhase)
  }

  /**
   * Select a breather pattern (easy, simple)
   */
  private selectBreatherPattern(_currentTier: DifficultyTier): ObstaclePattern | null {
    const easyPatterns = ['single-jump-gate', 'single-spikes', 'center-block', 'single-dodge-left', 'single-dodge-right']
    
    // Filter to patterns not recently used
    const available = easyPatterns.filter(id => !this.recentPatterns.slice(-2).includes(id))
    
    if (available.length === 0) {
      // Use any easy pattern
      const id = easyPatterns[Math.floor(Math.random() * easyPatterns.length)]
      return this.library.getPattern(id) || null
    }

    // Pick one that flows well
    let bestPattern: ObstaclePattern | null = null
    let bestFlow = -1

    for (const id of available) {
      const pattern = this.library.getPattern(id)
      if (!pattern) continue

      const flowWeight = this.flowAnalyzer.getFlowWeight(pattern)
      if (flowWeight > bestFlow) {
        bestFlow = flowWeight
        bestPattern = pattern
      }
    }

    // Decrement breather counter
    this.breatherPatternsRemaining--
    if (this.breatherPatternsRemaining <= 0) {
      this.endBreather()
    }

    return bestPattern
  }

  /**
   * Select a single pattern (fallback)
   */
  private selectSinglePattern(
    currentTier: DifficultyTier,
    _currentPhase: PacingPhase
  ): ObstaclePattern | null {
    const candidates = this.library.getPatternsForDifficulty(currentTier)
    
    if (candidates.length === 0) {
      return null
    }
    
    // Filter by cooldown
    const available = candidates.filter(p => 
      !this.recentPatterns.slice(-p.cooldownPatterns).includes(p.id)
    )

    if (available.length === 0) {
      return candidates[Math.floor(Math.random() * candidates.length)] || null
    }

    // Weight by flow
    const weighted = available.map(pattern => ({
      pattern,
      weight: pattern.baseWeight * this.flowAnalyzer.getFlowWeight(pattern),
    }))

    // Weighted random
    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0)
    let random = Math.random() * totalWeight

    for (const { pattern, weight } of weighted) {
      random -= weight
      if (random <= 0) return pattern
    }

    return weighted[0]?.pattern || null
  }

  /**
   * Calculate gap with symphony modifiers
   */
  private calculateGap(
    pattern: ObstaclePattern,
    currentSpeed: number,
    distance: number
  ): number {
    const currentTier = this.difficultyManager.getCurrentTier()
    const currentPhase = this.pacingController.getCurrentPhase()
    const lastPattern = this.getLastPattern()

    // Base gap from spacing calculator
    let gap = this.spacingCalculator.calculateGap({
      currentSpeed,
      difficultyTier: currentTier,
      pacingPhase: currentPhase,
      previousPattern: lastPattern,
      nextPattern: pattern,
    })

    // CRITICAL: Enforce minimum jump-to-jump distance for consecutive jumps
    // This ensures player can land and re-jump between obstacles
    if (lastPattern && this.isJumpPattern(lastPattern) && this.isJumpPattern(pattern)) {
      const minJumpGap = this.spacingCalculator.getMinJumpToJumpDistance(currentSpeed)
      gap = Math.max(gap, minJumpGap)
    }

    // Apply tension modifier (higher tension = tighter gaps)
    const tension = this.tensionCurve.calculate(distance)
    const tensionMod = 1.2 - (tension * 0.3) // Range: 0.9 to 1.2
    gap *= tensionMod

    // Apply breather modifier
    if (this.isInBreather) {
      gap *= 1.5
    }

    // Apply dynamic breather adjustment (player struggling = more space)
    gap *= this.dynamicBreather.getGapMultiplier()

    return gap
  }

  /**
   * Check if a pattern requires jumping
   */
  private isJumpPattern(pattern: ObstaclePattern): boolean {
    return pattern.requiredActions.includes('jump')
  }

  /**
   * Create spawn requests for a pattern
   */
  private createSpawnRequests(pattern: ObstaclePattern, baseZ: number): SpawnRequest[] {
    return pattern.placements.map((placement, index) => ({
      type: placement.type,
      lane: placement.lane,
      z: baseZ - placement.offsetZ,
      patternId: pattern.id,
      sequenceIndex: index,
    }))
  }

  /**
   * Record a pattern was spawned
   */
  private recordPattern(pattern: ObstaclePattern): void {
    this.recentPatterns.push(pattern.id)
    while (this.recentPatterns.length > 20) {
      this.recentPatterns.shift()
    }

    this.flowAnalyzer.recordPattern(pattern)
    this.pacingController.onPatternSpawned()

    // Record complexity for breather system
    this.dynamicBreather.recordPatternResult(
      false, // Will be updated when collision happens
      false,
      pattern.placements.length,
      Math.abs(this.lastSpawnZ)
    )
  }

  /**
   * Get the last spawned pattern
   */
  private getLastPattern(): ObstaclePattern | null {
    if (this.recentPatterns.length === 0) return null
    const lastId = this.recentPatterns[this.recentPatterns.length - 1]
    return this.library.getPattern(lastId) || null
  }

  /**
   * Start a new phrase
   */
  private startPhrase(phrase: Phrase): void {
    this.currentPhrase = phrase
    this.phrasePatternIndex = 0
    this.phrasesComposed++
    this.events.onPhraseStart?.(phrase)
  }

  /**
   * End current phrase
   */
  private endPhrase(): void {
    if (this.currentPhrase) {
      this.events.onPhraseEnd?.(this.currentPhrase)
    }
    this.currentPhrase = null
    this.phrasePatternIndex = 0
  }

  /**
   * Start a breather section
   */
  private startBreather(recommendation: BreatherRecommendation, distance: number): void {
    this.isInBreather = true
    this.breatherPatternsRemaining = recommendation.suggestedDuration
    this.breathersGiven++
    this.dynamicBreather.recordBreather(distance)
    
    // Cancel any current phrase/motif
    this.currentPhrase = null
    this.phrasePatternIndex = 0
    this.motifTracker.cancelMotif()

    this.events.onBreatherStart?.()
  }

  /**
   * End breather section
   */
  private endBreather(): void {
    this.isInBreather = false
    this.breatherPatternsRemaining = 0
    this.events.onBreatherEnd?.()
  }

  /**
   * Check for tension events
   */
  private checkTensionEvents(state: TensionState, _distance: number): void {
    if (state.trend === 'peak' && state.currentTension > 0.8) {
      this.events.onTensionPeak?.(state.currentTension)
    } else if (state.trend === 'valley' && state.currentTension < 0.3) {
      this.events.onTensionValley?.(state.currentTension)
    }
  }

  /**
   * Record player hit (for dynamic breather)
   */
  recordPlayerHit(): void {
    this.dynamicBreather.recordPatternResult(true, false, 0, 0)
    this.motifTracker.recordMotifResult(false)
  }

  /**
   * Record near miss (for dynamic breather)
   */
  recordNearMiss(): void {
    this.dynamicBreather.recordPatternResult(false, true, 0, 0)
  }

  /**
   * Get current symphony state
   */
  getState(distance: number): SymphonyState {
    const tension = this.tensionCurve.getState(distance)
    const lastPattern = this.getLastPattern()

    return {
      currentPhrase: this.currentPhrase,
      phraseProgress: this.currentPhrase 
        ? this.phrasePatternIndex / this.currentPhrase.patterns.length 
        : 0,
      tension,
      flowMetrics: lastPattern ? this.flowAnalyzer.analyzePatternFit(lastPattern) : null,
      inMotif: this.motifTracker.isInMotif(),
      currentMotifName: this.motifTracker.getCurrentMotif()?.name || null,
      breatherRecommendation: this.dynamicBreather.shouldTriggerBreather(distance),
      isInBreather: this.isInBreather,
      breatherPatternsRemaining: this.breatherPatternsRemaining,
      phrasesComposed: this.phrasesComposed,
      motifsPlayed: this.motifsPlayed,
      breathersGiven: this.breathersGiven,
    }
  }

  /**
   * Get debug info
   */
  getDebugInfo(distance: number): object {
    return {
      symphony: this.getState(distance),
      tension: this.tensionCurve.getState(distance),
      flow: this.flowAnalyzer.getFlowState(),
      motif: this.motifTracker.getDebugInfo(),
      breather: this.dynamicBreather.getDebugInfo(),
    }
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.currentPhrase = null
    this.phrasePatternIndex = 0
    this.isInBreather = false
    this.breatherPatternsRemaining = 0
    this.recentPatterns = []
    this.lastSpawnZ = -50
    this.phrasesComposed = 0
    this.motifsPlayed = 0
    this.breathersGiven = 0

    this.tensionCurve.reset()
    this.flowAnalyzer.reset()
    this.motifTracker.reset()
    this.phraseComposer.reset()
    this.dynamicBreather.reset()
  }
}
