/**
 * Bot module exports for single-player practice mode
 *
 * **Feature: single-player-enhancement**
 */

// Configuration
export {
  type DifficultyLevel,
  type PracticeType,
  type DifficultyConfig,
  type PracticeTypeConfig,
  getDifficultyConfig,
  getPracticeTypeConfig,
  applyAdaptiveAdjustment,
  isValidDifficultyLevel,
  isValidPracticeType,
  getAllDifficultyLevels,
  getAllPracticeTypes,
  DEFAULT_DIFFICULTY,
  DEFAULT_PRACTICE_TYPE,
} from './BotConfigManager'

// Statistics
export {
  type SessionStats,
  SessionStatsCalculator,
  calculateAccuracy,
  calculateAverageTime,
  calculateLongestStreak,
  calculateKDRatio,
} from './SessionStatsCalculator'

// Adaptive Difficulty
export {
  AdaptiveDifficultyManager,
  calculateAdjustment,
  clampAccuracy,
} from './AdaptiveDifficultyManager'

// Tutorial
export {
  type TutorialStep,
  type TutorialStepContent,
  TutorialManager,
  TUTORIAL_CONTENT,
  isTutorialCompleted,
  markTutorialCompleted,
  resetTutorialCompletion,
} from './TutorialManager'

// Rewards
export {
  type RewardBreakdown,
  calculatePracticeXP,
  getPersonalBestBonus,
  getTutorialCompletionBonus,
  getDailyPracticeBonus,
  shouldAwardDailyBonus,
  getSessionsUntilDailyBonus,
  calculateSessionRewards,
  formatXP,
  getRewardMessage,
} from './PracticeRewards'
