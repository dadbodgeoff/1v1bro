/**
 * Arena Combat Bot - Public API
 * 
 * Exports the main bot system components for use in the arena.
 */

// Main orchestrator
export { CombatConductor } from './CombatConductor';

// Integration classes
export { BotPlayer } from './BotPlayer';
export type { BotPlayerConfig, BotPlayerState, BotMatchContext } from './BotPlayer';
export { BotMatchManager } from './BotMatchManager';
export type { BotMatchConfig, MatchState, MatchResult } from './BotMatchManager';
export { BotDebugOverlay } from './BotDebugOverlay';
export type { BotDebugConfig, TacticalIntent } from './BotDebugOverlay';

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

// Navigation
export {
  createAbandonedTerminalNavGraph,
  findPath,
  findNearestWaypoint,
  getRandomWaypoint,
  getWaypointsInArea,
} from './NavigationGraph';
export type { NavWaypoint, NavGraph } from './NavigationGraph';

// Tactical Navigation (Map-aware lanes and angles)
export { TacticalNavigator } from './TacticalNavigator';
export type { NavigatorState, NavigatorOutput, TacticalDebugLog } from './TacticalNavigator';
export {
  MAP_TACTICS,
  gridToWorld,
  worldToGrid,
  selectPushingLane,
  selectRetreatLane,
  findNearestSmartAngle,
  getAnglesForCoverage,
  isAtChokepoint,
  getNearestChokepoint,
  calculateFlankPosition,
  getMapSide,
  isNearSpawn,
  isOnTrack,
  calculatePathCost,
  laneUsesTrack,
} from './MapTactics';
export type {
  TacticalWaypoint,
  TacticalLane,
  SmartAngle,
  MapTacticsData,
  LaneSelectionContext,
} from './MapTactics';

// Tactical Plays (macro-goal definitions)
export {
  TACTICAL_PLAYS,
  getStartZone,
  worldToGrid as tacticalWorldToGrid,
} from './TacticalPlays';
export type {
  TacticalPlay,
  TacticalWaypoint as TacticalPlayWaypoint,
  PlayType,
  StartZone,
} from './TacticalPlays';

// Tactical Evaluator (play scoring and selection)
export { TacticalEvaluator } from './TacticalEvaluator';
export type {
  EvaluatorContext,
  PlayScore,
  ActivePlay,
} from './TacticalEvaluator';

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
