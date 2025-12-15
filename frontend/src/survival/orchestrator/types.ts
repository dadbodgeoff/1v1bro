/**
 * Obstacle Orchestrator Type Definitions
 * Types for the procedural obstacle generation system
 */

import type { ObstacleType, Lane } from '../types/survival'

/**
 * Difficulty tiers - affects pattern selection and spacing
 */
export type DifficultyTier = 'rookie' | 'intermediate' | 'advanced' | 'expert' | 'master'

/**
 * Pacing phases - controls the rhythm of gameplay
 */
export type PacingPhase = 'warmup' | 'building' | 'intense' | 'breather' | 'climax'

/**
 * Single obstacle placement within a pattern
 */
export interface ObstaclePlacement {
  type: ObstacleType
  lane: Lane
  offsetZ: number  // Relative Z offset from pattern start
}

/**
 * A pattern is a pre-designed sequence of obstacles
 */
export interface ObstaclePattern {
  id: string
  name: string
  description: string
  
  // Pattern content
  placements: ObstaclePlacement[]
  
  // Pattern metadata
  length: number              // Total Z length of pattern
  minDifficulty: DifficultyTier
  maxDifficulty: DifficultyTier | null  // null = no upper limit
  
  // Constraints
  requiredActions: PatternAction[]  // What player must do
  allowedAfter: string[]            // Pattern IDs that can precede this
  forbiddenAfter: string[]          // Pattern IDs that cannot precede this
  
  // Weighting
  baseWeight: number          // Base selection probability
  cooldownPatterns: number    // Min patterns before this can repeat
}

/**
 * Actions required to clear a pattern
 */
export type PatternAction = 'jump' | 'slide' | 'laneLeft' | 'laneRight' | 'laneChange'

/**
 * Spawn request from orchestrator to manager
 */
export interface SpawnRequest {
  type: ObstacleType
  lane: Lane
  z: number
  patternId: string
  sequenceIndex: number
}

/**
 * Current orchestrator state
 */
export interface OrchestratorState {
  currentTier: DifficultyTier
  currentPhase: PacingPhase
  distanceTraveled: number
  patternsSpawned: number
  lastPatternId: string | null
  recentPatterns: string[]      // For cooldown tracking
  phaseStartDistance: number
  nextSpawnZ: number
}

/**
 * Difficulty configuration per tier
 */
export interface DifficultyConfig {
  tier: DifficultyTier
  minDistance: number           // Distance to reach this tier
  baseGapMultiplier: number     // Multiplier for spacing (higher = easier)
  patternComplexityMax: number  // Max obstacles per pattern
  reactionTimeMs: number        // Expected player reaction time
  intensePhaseDuration: number  // How long intense phases last
  breatherFrequency: number     // Patterns between breathers
}

/**
 * Pacing phase configuration
 */
export interface PacingConfig {
  phase: PacingPhase
  durationPatterns: number      // How many patterns this phase lasts
  gapMultiplier: number         // Additional spacing multiplier
  patternWeightModifiers: Record<string, number>  // Boost/reduce pattern weights
}

/**
 * Orchestrator configuration
 */
export interface OrchestratorConfig {
  // Seeding
  seed?: number                 // For reproducible runs
  
  // Base timing
  baseReactionTimeMs: number    // Human reaction time baseline
  minSafeGapUnits: number       // Absolute minimum gap
  
  // Difficulty progression
  difficultyConfigs: DifficultyConfig[]
  
  // Pacing
  pacingConfigs: PacingConfig[]
  
  // Fairness
  maxConsecutiveJumps: number
  maxConsecutiveSlides: number
  guaranteedSafePath: boolean   // Always leave one lane clear
}
