/**
 * ObstacleOrchestrator - Main coordinator for procedural obstacle generation
 * Now powered by SymphonyConductor for musical, flowing obstacle placement
 * Combines difficulty, pacing, pattern selection, and spacing for engaging gameplay
 */

import type {
  OrchestratorState,
  OrchestratorConfig,
  SpawnRequest,
  DifficultyTier,
  PacingPhase,
} from './types'
import type { ObstaclePattern } from './types'
import { PatternLibrary } from './PatternLibrary'
import { DifficultyManager, DEFAULT_DIFFICULTY_CONFIGS } from './DifficultyManager'
import { PacingController } from './PacingController'
import { PatternSelector } from './PatternSelector'
import { SpacingCalculator } from './SpacingCalculator'
import { SeededRandom } from './SeededRandom'
import { SymphonyConductor, type SymphonyState } from './SymphonyConductor'

/**
 * Default orchestrator configuration
 */
const DEFAULT_CONFIG: OrchestratorConfig = {
  baseReactionTimeMs: 400,
  minSafeGapUnits: 8,
  difficultyConfigs: DEFAULT_DIFFICULTY_CONFIGS,
  pacingConfigs: [], // Uses defaults in PacingController
  maxConsecutiveJumps: 3,
  maxConsecutiveSlides: 2,
  guaranteedSafePath: true,
}

/**
 * Events emitted by orchestrator
 */
export interface OrchestratorEvents {
  onDifficultyChange?: (tier: DifficultyTier) => void
  onPhaseChange?: (phase: PacingPhase) => void
  onPatternSpawned?: (pattern: ObstaclePattern) => void
  onPhraseStart?: (structure: string) => void
  onMotifStart?: (name: string) => void
  onBreatherStart?: () => void
  onTensionPeak?: (tension: number) => void
}

export class ObstacleOrchestrator {
  // Sub-systems
  private library: PatternLibrary
  private difficultyManager: DifficultyManager
  private pacingController: PacingController
  private patternSelector: PatternSelector
  private spacingCalculator: SpacingCalculator
  private random: SeededRandom

  // Symphony conductor - the brain for musical obstacle placement
  private symphony: SymphonyConductor
  private useSymphony: boolean = true // Toggle for A/B testing

  // State
  private state: OrchestratorState
  private config: OrchestratorConfig
  private events: OrchestratorEvents

  // Spawn queue
  private pendingSpawns: SpawnRequest[] = []

  constructor(config: Partial<OrchestratorConfig> = {}, events: OrchestratorEvents = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.events = events

    // Initialize sub-systems
    this.library = new PatternLibrary()
    this.difficultyManager = new DifficultyManager(this.config.difficultyConfigs)
    this.pacingController = new PacingController(this.difficultyManager)
    this.patternSelector = new PatternSelector(
      this.library,
      this.difficultyManager,
      this.pacingController
    )
    this.spacingCalculator = new SpacingCalculator(
      this.difficultyManager,
      this.config.baseReactionTimeMs
    )
    this.random = new SeededRandom(this.config.seed)

    // Initialize Symphony Conductor
    this.symphony = new SymphonyConductor(
      this.library,
      this.difficultyManager,
      this.pacingController,
      this.spacingCalculator,
      {
        onPhraseStart: phrase => this.events.onPhraseStart?.(phrase.structure),
        onMotifStart: name => this.events.onMotifStart?.(name),
        onBreatherStart: () => this.events.onBreatherStart?.(),
        onTensionPeak: tension => this.events.onTensionPeak?.(tension),
      }
    )

    // Initialize state
    this.state = this.createInitialState()

    // Wire up event callbacks
    this.setupEventHandlers()
  }

  private createInitialState(): OrchestratorState {
    return {
      currentTier: 'rookie',
      currentPhase: 'warmup',
      distanceTraveled: 0,
      patternsSpawned: 0,
      lastPatternId: null,
      recentPatterns: [],
      phaseStartDistance: 0,
      nextSpawnZ: -50,  // Start spawning ahead of player
    }
  }

  private setupEventHandlers(): void {
    this.difficultyManager.onTierChange((_from, to) => {
      this.state.currentTier = to
      this.events.onDifficultyChange?.(to)
    })

    this.pacingController.onPhaseChange((_from, to) => {
      this.state.currentPhase = to
      this.state.phaseStartDistance = this.state.distanceTraveled
      this.events.onPhaseChange?.(to)
    })
  }

  /**
   * Main update - call each frame with current game state
   * Returns spawn requests for obstacles that should be created
   */
  update(playerZ: number, currentSpeed: number): SpawnRequest[] {
    // Update distance
    this.state.distanceTraveled = Math.abs(playerZ)

    // Update difficulty based on distance
    this.difficultyManager.update(this.state)

    // Use Symphony Conductor for musical obstacle placement
    if (this.useSymphony) {
      return this.symphony.conduct(playerZ, currentSpeed, this.state.distanceTraveled)
    }

    // Legacy mode: Original pattern-by-pattern spawning
    const spawnThreshold = playerZ - 80 // Spawn 80 units ahead

    while (this.state.nextSpawnZ > spawnThreshold) {
      const spawns = this.spawnNextPattern(currentSpeed)
      if (spawns.length === 0) break // No more patterns available

      this.pendingSpawns.push(...spawns)
    }

    // Return and clear pending spawns
    const result = [...this.pendingSpawns]
    this.pendingSpawns = []
    return result
  }

  /**
   * Spawn the next pattern
   */
  private spawnNextPattern(currentSpeed: number): SpawnRequest[] {
    // Select pattern
    const pattern = this.patternSelector.selectPattern({
      state: this.state,
      currentSpeed,
    })

    if (!pattern) {
      console.warn('[Orchestrator] No pattern selected')
      return []
    }

    // Calculate gap from previous pattern
    const previousPattern = this.state.lastPatternId
      ? this.library.getPattern(this.state.lastPatternId)
      : null

    const gap = this.spacingCalculator.calculateGap({
      currentSpeed,
      difficultyTier: this.state.currentTier,
      pacingPhase: this.state.currentPhase,
      previousPattern: previousPattern || null,
      nextPattern: pattern,
    })

    // Update spawn position
    this.state.nextSpawnZ -= gap

    // Create spawn requests for each obstacle in pattern
    const spawns: SpawnRequest[] = pattern.placements.map((placement, index) => ({
      type: placement.type,
      lane: placement.lane,
      z: this.state.nextSpawnZ - placement.offsetZ,
      patternId: pattern.id,
      sequenceIndex: index,
    }))

    // Move spawn position past pattern length
    this.state.nextSpawnZ -= pattern.length

    // Update state
    this.state.lastPatternId = pattern.id
    this.state.patternsSpawned++
    this.updateRecentPatterns(pattern.id)

    // Notify pacing controller
    this.pacingController.onPatternSpawned()

    // Emit event
    this.events.onPatternSpawned?.(pattern)

    return spawns
  }

  /**
   * Track recent patterns for cooldown/variety
   */
  private updateRecentPatterns(patternId: string): void {
    this.state.recentPatterns.push(patternId)
    
    // Keep last 15 patterns
    while (this.state.recentPatterns.length > 15) {
      this.state.recentPatterns.shift()
    }
  }

  /**
   * Get current orchestrator state (for UI/debug)
   */
  getState(): Readonly<OrchestratorState> {
    return { ...this.state }
  }

  /**
   * Get current difficulty tier
   */
  getCurrentTier(): DifficultyTier {
    return this.state.currentTier
  }

  /**
   * Get current pacing phase
   */
  getCurrentPhase(): PacingPhase {
    return this.state.currentPhase
  }

  /**
   * Get patterns spawned count
   */
  getPatternsSpawned(): number {
    return this.state.patternsSpawned
  }

  /**
   * Force a specific difficulty (for testing)
   */
  setDifficulty(tier: DifficultyTier): void {
    this.difficultyManager.setTier(tier)
  }

  /**
   * Force a specific pacing phase (for testing)
   */
  setPhase(phase: PacingPhase): void {
    this.pacingController.forcePhase(phase)
  }

  /**
   * Set seed for reproducible runs
   */
  setSeed(seed: number): void {
    this.random = new SeededRandom(seed)
  }

  /**
   * Get random number (0-1) using seeded generator
   */
  getRandom(): number {
    return this.random.next()
  }

  /**
   * Reset for new game
   */
  reset(): void {
    this.state = this.createInitialState()
    this.difficultyManager.reset()
    this.pacingController.reset()
    this.patternSelector.reset()
    this.symphony.reset()
    this.pendingSpawns = []

    // Reset random if seeded
    if (this.config.seed !== undefined) {
      this.random = new SeededRandom(this.config.seed)
    }
  }

  /**
   * Record player hit (for dynamic breather system)
   * AAA Feature: Feeds into DynamicBreather for adaptive difficulty
   */
  recordPlayerHit(): void {
    if (this.useSymphony) {
      this.symphony.recordPlayerHit()
    }
  }

  /**
   * AAA Feature: Record near miss for DynamicBreather integration
   * @param distance How close the near-miss was
   * @param obstacleType Type of obstacle that was nearly hit
   */
  recordNearMiss(_distance: number, _obstacleType: string): void {
    if (this.useSymphony) {
      this.symphony.recordNearMiss()
    }
  }

  /**
   * AAA Feature: Record collision for DynamicBreather integration
   * @param obstacleType Type of obstacle that was hit
   */
  recordCollision(_obstacleType: string): void {
    this.recordPlayerHit()
  }

  /**
   * Get symphony state (for UI/debug)
   */
  getSymphonyState(): SymphonyState | null {
    if (!this.useSymphony) return null
    return this.symphony.getState(this.state.distanceTraveled)
  }

  /**
   * Toggle symphony mode (for A/B testing)
   */
  setSymphonyMode(enabled: boolean): void {
    this.useSymphony = enabled
  }

  /**
   * Get debug info
   */
  getDebugInfo(): object {
    const baseInfo = {
      state: this.state,
      tier: this.difficultyManager.getCurrentTier(),
      tierConfig: this.difficultyManager.getCurrentConfig(),
      phase: this.pacingController.getCurrentPhase(),
      phaseProgress: this.pacingController.getPhaseProgress(),
      isIntense: this.pacingController.isIntensePhase(),
      symphonyMode: this.useSymphony,
    }

    if (this.useSymphony) {
      return {
        ...baseInfo,
        symphony: this.symphony.getDebugInfo(this.state.distanceTraveled),
      }
    }

    return baseInfo
  }
}
