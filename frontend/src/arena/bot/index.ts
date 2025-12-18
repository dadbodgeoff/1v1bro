/**
 * Arena Combat Bot - Public API
 * 
 * Exports the main bot system components for use in the arena.
 */

// Main orchestrator
export { CombatConductor } from './CombatConductor';

// Subsystems (for advanced usage/testing)
export { AggressionCurve } from './AggressionCurve';
export { MercySystem } from './MercySystem';
export { TacticsLibrary } from './TacticsLibrary';
export { CombatFlowAnalyzer } from './CombatFlowAnalyzer';
export type { FlowAnalysis, PlayerPlaystyle } from './CombatFlowAnalyzer';
export { SignatureMoveTracker } from './SignatureMoveTracker';
export { EngagementComposer } from './EngagementComposer';
export { AimController } from './AimController';
export { SpatialAwareness } from './SpatialAwareness';
export type { SafetyEvaluation, PathResult } from './SpatialAwareness';

// Personality and difficulty
export {
  BOT_PERSONALITIES,
  DIFFICULTY_PRESETS,
  getPersonality,
  getDifficultyPreset,
  getRandomPersonality,
  getAllPersonalityTypes,
  getAllDifficultyLevels,
  getPersonalityDisplayInfo,
  getDifficultyDisplayInfo,
} from './BotPersonality';

// Types
export type {
  // Core types
  BotState,
  BotInput,
  BotOutput,
  AABB,
  
  // Spatial
  CoverPosition,
  CoverHeight,
  
  // Tactical
  TacticalPattern,
  TacticalPatternType,
  MovementPath,
  AimBehavior,
  ShootBehavior,
  
  // Signatures
  SignatureMove,
  
  // Phrases
  EngagementPhrase,
  EngagementPhraseType,
  
  // Personality
  BotPersonalityType,
  BotPersonalityConfig,
  
  // Difficulty
  DifficultyLevel,
  DifficultyPreset,
  
  // Aggression
  AggressionState,
  AggressionTrend,
  AggressionModifiers,
  
  // Mercy
  DominationMetrics,
  MercyState,
  
  // Combat
  CombatEvent,
  CombatEventType,
  
  // Aim
  AimState,
  
  // Events
  CombatBotEvents,
} from './types';
