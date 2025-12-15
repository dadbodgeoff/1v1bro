/**
 * Obstacle Orchestrator Module
 * Enterprise-grade procedural obstacle generation system
 * Now with Symphony Conductor for musical, flowing obstacle placement
 */

// Main orchestrator
export { ObstacleOrchestrator } from './ObstacleOrchestrator'
export type { OrchestratorEvents } from './ObstacleOrchestrator'

// Symphony components - the brain for musical obstacle placement
export { SymphonyConductor } from './SymphonyConductor'
export type { SymphonyState, SymphonyEvents } from './SymphonyConductor'
export { TensionCurve } from './TensionCurve'
export type { TensionState, TensionConfig } from './TensionCurve'
export { FlowAnalyzer } from './FlowAnalyzer'
export type { FlowMetrics } from './FlowAnalyzer'
export { MotifTracker } from './MotifTracker'
export type { Motif, MotifVariation } from './MotifTracker'
export { PhraseComposer } from './PhraseComposer'
export type { Phrase, PhraseStructure } from './PhraseComposer'
export { DynamicBreather } from './DynamicBreather'
export type { PerformanceMetrics, BreatherRecommendation } from './DynamicBreather'

// Core sub-systems
export { PatternLibrary, PATTERN_LIBRARY } from './PatternLibrary'
export { DifficultyManager, DEFAULT_DIFFICULTY_CONFIGS } from './DifficultyManager'
export { PacingController, DEFAULT_PACING_CONFIGS } from './PacingController'
export { PatternSelector } from './PatternSelector'
export { SpacingCalculator } from './SpacingCalculator'
export { SeededRandom } from './SeededRandom'

// Types
export type {
  DifficultyTier,
  PacingPhase,
  ObstaclePlacement,
  ObstaclePattern,
  PatternAction,
  SpawnRequest,
  OrchestratorState,
  OrchestratorConfig,
  DifficultyConfig,
  PacingConfig,
} from './types'
