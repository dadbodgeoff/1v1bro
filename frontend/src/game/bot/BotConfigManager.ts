/**
 * BotConfigManager - Manages bot behavior parameters based on difficulty level and practice type
 * 
 * **Feature: single-player-enhancement**
 * **Validates: Requirements 1.2, 1.3, 1.4, 2.2, 2.3, 2.4**
 */

// Difficulty levels for practice mode
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

// Practice types for different game modes
export type PracticeType = 'quiz_only' | 'combat_only' | 'full_game'

// Bot behavior configuration
export interface DifficultyConfig {
  quizAccuracy: number      // 0.0 - 1.0 (probability of correct answer)
  shootCooldown: number     // milliseconds between shots
  movementSpeed: number     // units per second
  aggroRange: number        // pixels - distance to start chasing
  retreatHealth: number     // percentage - health to start evading
  minAnswerTime: number     // minimum ms to answer quiz
  maxAnswerTime: number     // maximum ms to answer quiz
}

// Practice type configuration
export interface PracticeTypeConfig {
  combatEnabled: boolean
  quizEnabled: boolean
  respawnEnabled: boolean   // For combat_only mode
}

// Predefined difficulty configurations per requirements
const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    quizAccuracy: 0.40,       // 40% - Requirements 1.2
    shootCooldown: 1200,      // 1200ms - Requirements 1.2
    movementSpeed: 80,        // 80 units/second - Requirements 1.2
    aggroRange: 300,
    retreatHealth: 40,
    minAnswerTime: 4000,
    maxAnswerTime: 10000,
  },
  medium: {
    quizAccuracy: 0.55,       // 55% - Requirements 1.3
    shootCooldown: 800,       // 800ms - Requirements 1.3
    movementSpeed: 120,       // 120 units/second - Requirements 1.3
    aggroRange: 400,
    retreatHealth: 30,
    minAnswerTime: 2500,
    maxAnswerTime: 8000,
  },
  hard: {
    quizAccuracy: 0.75,       // 75% - Requirements 1.4
    shootCooldown: 500,       // 500ms - Requirements 1.4
    movementSpeed: 160,       // 160 units/second - Requirements 1.4
    aggroRange: 500,
    retreatHealth: 20,
    minAnswerTime: 1500,
    maxAnswerTime: 5000,
  },
}

// Practice type configurations per requirements
const PRACTICE_TYPE_CONFIGS: Record<PracticeType, PracticeTypeConfig> = {
  quiz_only: {
    combatEnabled: false,     // Requirements 2.2 - disable combat
    quizEnabled: true,        // Requirements 2.2 - rapid-fire trivia
    respawnEnabled: false,
  },
  combat_only: {
    combatEnabled: true,      // Requirements 2.3 - enable combat
    quizEnabled: false,       // Requirements 2.3 - disable quiz
    respawnEnabled: true,     // Requirements 2.3 - respawning
  },
  full_game: {
    combatEnabled: true,      // Requirements 2.4 - both enabled
    quizEnabled: true,        // Requirements 2.4 - both enabled
    respawnEnabled: true,
  },
}

// Default values per requirements
export const DEFAULT_DIFFICULTY: DifficultyLevel = 'medium'  // Requirements 1.5
export const DEFAULT_PRACTICE_TYPE: PracticeType = 'full_game'  // Requirements 2.5

/**
 * Get the difficulty configuration for a given level
 * Returns exact predefined values per requirements 1.2, 1.3, 1.4
 */
export function getDifficultyConfig(level: DifficultyLevel): DifficultyConfig {
  return { ...DIFFICULTY_CONFIGS[level] }
}

/**
 * Get the practice type configuration
 * Returns correct enable/disable settings per requirements 2.2, 2.3, 2.4
 */
export function getPracticeTypeConfig(type: PracticeType): PracticeTypeConfig {
  return { ...PRACTICE_TYPE_CONFIGS[type] }
}

/**
 * Apply adaptive difficulty adjustment to a base config
 * Adjustment is a value from -0.2 to +0.2 that modifies quiz accuracy
 * Bounds: 30% minimum, 85% maximum (per requirements 5.1, 5.2)
 */
export function applyAdaptiveAdjustment(
  base: DifficultyConfig,
  adjustment: number
): DifficultyConfig {
  const MIN_ACCURACY = 0.30
  const MAX_ACCURACY = 0.85
  
  // Handle NaN or invalid adjustments
  const safeAdjustment = Number.isFinite(adjustment) ? adjustment : 0
  
  // Round to avoid floating point precision issues
  const rawAccuracy = base.quizAccuracy + safeAdjustment
  const adjustedAccuracy = Math.round(
    Math.max(MIN_ACCURACY, Math.min(MAX_ACCURACY, rawAccuracy)) * 100
  ) / 100
  
  return {
    ...base,
    quizAccuracy: adjustedAccuracy,
  }
}

/**
 * Validate that a difficulty level is valid
 */
export function isValidDifficultyLevel(level: string): level is DifficultyLevel {
  return level === 'easy' || level === 'medium' || level === 'hard'
}

/**
 * Validate that a practice type is valid
 */
export function isValidPracticeType(type: string): type is PracticeType {
  return type === 'quiz_only' || type === 'combat_only' || type === 'full_game'
}

/**
 * Get all available difficulty levels
 */
export function getAllDifficultyLevels(): DifficultyLevel[] {
  return ['easy', 'medium', 'hard']
}

/**
 * Get all available practice types
 */
export function getAllPracticeTypes(): PracticeType[] {
  return ['quiz_only', 'combat_only', 'full_game']
}
