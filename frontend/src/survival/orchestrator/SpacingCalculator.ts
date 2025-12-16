/**
 * SpacingCalculator - Calculates safe distances between obstacles
 * Ensures players always have enough time to react based on speed and difficulty
 */

import type { DifficultyTier, ObstaclePattern, PacingPhase } from './types'
import type { DifficultyManager } from './DifficultyManager'
import { getMobileConfig } from '../config/mobile'

/**
 * Spacing calculation parameters
 */
export interface SpacingParams {
  currentSpeed: number          // Current game speed (units/sec)
  difficultyTier: DifficultyTier
  pacingPhase: PacingPhase
  previousPattern: ObstaclePattern | null
  nextPattern: ObstaclePattern
}

/**
 * Base spacing constants
 */
const BASE_REACTION_DISTANCE = 15    // Minimum distance at base speed
const SPEED_FACTOR = 0.8             // How much speed affects spacing
const MIN_ABSOLUTE_GAP = 8           // Never go below this
const MAX_GAP = 50                   // Cap for breather phases

/**
 * Phase-specific multipliers
 */
const PHASE_MULTIPLIERS: Record<PacingPhase, number> = {
  warmup: 1.5,
  building: 1.2,
  intense: 0.9,
  breather: 2.0,
  climax: 0.85,
}

/**
 * Pattern transition bonuses - extra space after complex patterns
 */
const COMPLEXITY_RECOVERY: Record<number, number> = {
  1: 0,      // Single obstacle - no extra
  2: 2,      // Two obstacles - small buffer
  3: 4,      // Three obstacles
  4: 6,      // Four obstacles
  5: 8,      // Five+ obstacles
}

/**
 * Jump recovery distance - extra space needed between consecutive jumps
 * 
 * Physics calculation:
 * - Jump duration: ~0.59s (apex + fall)
 * - At 20 units/sec, player travels ~12 units during jump
 * - Need minimal landing buffer to touch ground and re-jump
 * 
 * Keep it tight but fair - just enough to land and jump again
 */
const JUMP_RECOVERY_DISTANCE = 3  // Small extra distance for jump-to-jump transitions
const DOUBLE_JUMP_LANDING_BUFFER = 2  // Minimal buffer - skilled players can chain jumps

export class SpacingCalculator {
  private difficultyManager: DifficultyManager
  private baseReactionTimeMs: number

  constructor(difficultyManager: DifficultyManager, baseReactionTimeMs: number = 400) {
    this.difficultyManager = difficultyManager
    this.baseReactionTimeMs = baseReactionTimeMs
  }

  /**
   * Calculate the gap between two patterns
   */
  calculateGap(params: SpacingParams): number {
    const { currentSpeed, pacingPhase, previousPattern, nextPattern } = params

    // Base distance from reaction time
    const reactionTimeMs = this.difficultyManager.getReactionTimeMs()
    const reactionDistance = (currentSpeed * reactionTimeMs) / 1000

    // Speed-scaled base
    const speedScaledBase = BASE_REACTION_DISTANCE + (currentSpeed * SPEED_FACTOR)

    // Difficulty multiplier
    const difficultyMultiplier = this.difficultyManager.getGapMultiplier()

    // Phase multiplier
    const phaseMultiplier = PHASE_MULTIPLIERS[pacingPhase]

    // Mobile/device multiplier - gives touch devices slightly more space
    const mobileConfig = getMobileConfig()
    const deviceGapMultiplier = mobileConfig.balance.obstacleGapMultiplier

    // Recovery bonus from previous pattern complexity
    const recoveryBonus = previousPattern 
      ? this.getRecoveryBonus(previousPattern)
      : 0

    // Action transition bonus - extra time if switching action types
    const transitionBonus = previousPattern
      ? this.getTransitionBonus(previousPattern, nextPattern)
      : 0

    // Calculate final gap
    let gap = Math.max(reactionDistance, speedScaledBase)
    gap *= difficultyMultiplier
    gap *= phaseMultiplier
    gap *= deviceGapMultiplier  // Apply device-specific gap adjustment
    gap += recoveryBonus
    gap += transitionBonus

    // Clamp to bounds
    return Math.max(MIN_ABSOLUTE_GAP, Math.min(MAX_GAP, gap))
  }

  /**
   * Get recovery bonus based on pattern complexity
   */
  private getRecoveryBonus(pattern: ObstaclePattern): number {
    const obstacleCount = pattern.placements.length
    const key = Math.min(obstacleCount, 5)
    return COMPLEXITY_RECOVERY[key] || 0
  }

  /**
   * Get bonus for transitioning between different action types
   */
  private getTransitionBonus(prev: ObstaclePattern, next: ObstaclePattern): number {
    const prevActions = new Set(prev.requiredActions)
    const nextActions = new Set(next.requiredActions)

    // Check for action type switches that need extra time
    const prevHasVertical = prevActions.has('jump') || prevActions.has('slide')
    const nextHasVertical = nextActions.has('jump') || nextActions.has('slide')
    const prevHasLateral = prevActions.has('laneLeft') || prevActions.has('laneRight') || prevActions.has('laneChange')
    const nextHasLateral = nextActions.has('laneLeft') || nextActions.has('laneRight') || nextActions.has('laneChange')

    // CRITICAL: Jump-to-jump transition needs extra space for landing and re-jumping
    // Player must: complete first jump, land, have ground time, initiate second jump
    if (prevActions.has('jump') && nextActions.has('jump')) {
      return JUMP_RECOVERY_DISTANCE + DOUBLE_JUMP_LANDING_BUFFER
    }

    // Jump to slide or slide to jump is tricky
    if ((prevActions.has('jump') && nextActions.has('slide')) ||
        (prevActions.has('slide') && nextActions.has('jump'))) {
      return 4
    }

    // Switching from vertical to lateral or vice versa needs extra time
    if ((prevHasVertical && nextHasLateral) || (prevHasLateral && nextHasVertical)) {
      return 3
    }

    return 0
  }

  /**
   * Calculate minimum safe distance for a pattern at given speed
   * Used to validate patterns are clearable
   */
  calculateMinimumSafeDistance(pattern: ObstaclePattern, speed: number): number {
    const reactionTimeMs = this.difficultyManager.getReactionTimeMs()
    const reactionDistance = (speed * reactionTimeMs) / 1000
    
    // Pattern length plus reaction distance
    return pattern.length + reactionDistance + MIN_ABSOLUTE_GAP
  }

  /**
   * Check if a gap is safe for given conditions
   */
  isGapSafe(gap: number, speed: number): boolean {
    const minReactionDistance = (speed * this.baseReactionTimeMs) / 1000
    return gap >= Math.max(MIN_ABSOLUTE_GAP, minReactionDistance)
  }

  /**
   * Get recommended gap for warmup phase (very generous)
   */
  getWarmupGap(speed: number): number {
    return this.calculateGap({
      currentSpeed: speed,
      difficultyTier: 'rookie',
      pacingPhase: 'warmup',
      previousPattern: null,
      nextPattern: { length: 5 } as ObstaclePattern,
    })
  }

  /**
   * Get recommended gap for breather phase
   */
  getBreatherGap(speed: number): number {
    return Math.min(MAX_GAP, BASE_REACTION_DISTANCE * 2.5 + speed * 0.5)
  }

  /**
   * Calculate minimum safe distance for consecutive jump obstacles
   * Ensures player has time to land and jump again
   * 
   * @param speed Current game speed (units/sec)
   * @returns Minimum distance between consecutive jump obstacles
   */
  getMinJumpToJumpDistance(speed: number): number {
    // Jump physics constants (from PhysicsController)
    const jumpForce = 18
    const gravity = 50
    const gravityFallingScale = 1.6
    
    // Calculate jump duration
    const timeToApex = jumpForce / gravity  // ~0.36s
    const timeFalling = timeToApex / gravityFallingScale  // ~0.23s (faster fall)
    const totalJumpTime = timeToApex + timeFalling  // ~0.59s
    
    // Distance traveled during jump at current speed
    const jumpTravelDistance = speed * totalJumpTime
    
    // Landing buffer - minimal time to touch ground and re-jump
    // Keep it tight - skilled players should be able to chain jumps quickly
    const landingBufferTime = 0.1  // 100ms - just enough to register ground
    const landingBufferDistance = speed * landingBufferTime
    
    // Total minimum distance - tight but fair
    const minDistance = jumpTravelDistance + landingBufferDistance + DOUBLE_JUMP_LANDING_BUFFER
    
    return Math.max(MIN_ABSOLUTE_GAP, minDistance)
  }
}
