/**
 * Arena Combat Bot - Type Definitions
 * Core interfaces for the bot AI system
 */

import { Vector3 } from 'three';

// ============================================================================
// Bot State Machine
// ============================================================================

/**
 * Bot state machine states
 */
export type BotState = 'PATROL' | 'ENGAGE' | 'RETREAT' | 'REPOSITION' | 'EXECUTING_SIGNATURE';

// ============================================================================
// Input/Output
// ============================================================================

/**
 * Axis-aligned bounding box for map bounds
 */
export interface AABB {
  min: Vector3;
  max: Vector3;
}

/**
 * Input provided to bot each tick
 */
export interface BotInput {
  // Bot's current state
  botPosition: Vector3;
  botHealth: number;
  botMaxHealth: number;
  botAmmo: number;
  botMaxAmmo: number;

  // Player state (what bot can "see")
  playerPosition: Vector3;
  playerVelocity: Vector3;
  playerHealth: number;
  playerVisible: boolean;
  lastSeenPosition: Vector3 | null;
  lastSeenTime: number;

  // Match state
  botScore: number;
  playerScore: number;
  timeRemaining: number;
  matchDuration: number;

  // Environment
  coverPositions: CoverPosition[];
  mapBounds: AABB;
}

/**
 * Output from bot each tick
 */
export interface BotOutput {
  moveDirection: Vector3;      // Normalized movement vector
  moveSpeed: number;           // 0-1, multiplier on max speed
  aimTarget: Vector3;          // World position to aim at
  shouldShoot: boolean;
  shouldReload: boolean;
  shouldCrouch: boolean;
  currentState: BotState;
}

// ============================================================================
// Spatial/Cover
// ============================================================================

/**
 * Cover height classification
 */
export type CoverHeight = 'full' | 'half';

/**
 * Cover position with metadata
 */
export interface CoverPosition {
  position: Vector3;
  normal: Vector3;             // Direction cover faces
  height: CoverHeight;         // Full cover vs crouch cover
  quality: number;             // 0-1, how good is this cover
}

// ============================================================================
// Tactical Patterns
// ============================================================================

/**
 * Types of tactical patterns
 */
export type TacticalPatternType = 'STRAFE' | 'PEEK' | 'PUSH' | 'RETREAT' | 'HOLD' | 'FLANK';

/**
 * Movement path styles
 */
export type MovementPath = 'linear' | 'arc' | 'zigzag' | 'none';

/**
 * Aim behavior during pattern execution
 */
export type AimBehavior = 'track' | 'predictive' | 'sweep' | 'hold';

/**
 * Shooting behavior during pattern execution
 */
export type ShootBehavior = 'continuous' | 'burst' | 'tap' | 'none';

/**
 * Tactical pattern definition
 */
export interface TacticalPattern {
  id: string;
  type: TacticalPatternType;
  duration: number;            // Base duration in ms

  // Requirements
  minAggression: number;       // 0-1
  maxAggression: number;       // 0-1
  requiresCover: boolean;
  minHealth: number;           // 0-1 ratio

  // Behavior
  movementPath: MovementPath;
  aimBehavior: AimBehavior;
  shootBehavior: ShootBehavior;

  // Risk/reward
  riskLevel: number;           // 0-1
  exposureTime: number;        // How long bot is exposed in ms
}

// ============================================================================
// Signature Moves
// ============================================================================

/**
 * Signature move (motif equivalent) - special combo attacks
 */
export interface SignatureMove {
  id: string;
  name: string;
  patterns: string[];          // Sequence of pattern IDs
  cooldown: number;            // ms between uses

  // Trigger conditions
  triggerAggression: [number, number];  // [min, max] range
  triggerHealthRatio: [number, number];
  triggerScoreDiff: [number, number];   // Bot score - player score

  // Personality association
  personalities: BotPersonalityType[];
}

// ============================================================================
// Engagement Phrases
// ============================================================================

/**
 * Types of engagement phrases
 */
export type EngagementPhraseType = 'pressure' | 'probe' | 'punish' | 'reset';

/**
 * Engagement phrase (composed sequence of patterns)
 */
export interface EngagementPhrase {
  id: string;
  type: EngagementPhraseType;
  patterns: TacticalPattern[];
  totalDuration: number;
}

// ============================================================================
// Personality System
// ============================================================================

/**
 * Bot personality types
 */
export type BotPersonalityType = 'rusher' | 'sentinel' | 'duelist';

/**
 * Personality configuration
 */
export interface BotPersonalityConfig {
  type: BotPersonalityType;
  displayName: string;

  // Aggression curve modifiers
  baseAggression: number;
  aggressionVolatility: number;  // How much it swings

  // Tactic weights (multipliers)
  tacticWeights: Record<TacticalPatternType, number>;

  // Aim characteristics
  reactionTimeMs: number;
  accuracyBase: number;
  trackingSkill: number;

  // Signature moves available
  signatures: string[];

  // Mercy system
  mercyThreshold: number;
  mercyDuration: number;
}

// ============================================================================
// Difficulty System
// ============================================================================

/**
 * Difficulty level names
 */
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'adaptive';

/**
 * Difficulty preset configuration
 */
export interface DifficultyPreset {
  name: DifficultyLevel;

  // Aggression
  aggressionMultiplier: number;

  // Aim
  reactionTimeMultiplier: number;
  accuracyMultiplier: number;

  // Mercy
  mercyEnabled: boolean;
  mercyThresholdMultiplier: number;

  // Patterns
  useSignatures: boolean;
  patternComplexity: number;  // 0-1, filters available patterns
}

// ============================================================================
// Aggression System
// ============================================================================

/**
 * Aggression trend direction
 */
export type AggressionTrend = 'rising' | 'falling' | 'peak' | 'valley';

/**
 * Current aggression state
 */
export interface AggressionState {
  current: number;              // 0-1
  trend: AggressionTrend;
  inPushPhase: boolean;         // High aggression period
  inRetreatPhase: boolean;      // Low aggression period
}

/**
 * Modifiers that affect aggression calculation
 */
export interface AggressionModifiers {
  scoreDiff: number;            // Bot score - player score
  healthRatio: number;          // Bot health / max
  timeRatio: number;            // Time elapsed / total
  recentDamageDealt: number;
  recentDamageTaken: number;
}

// ============================================================================
// Mercy System
// ============================================================================

/**
 * Metrics for tracking domination
 */
export interface DominationMetrics {
  recentDamageDealt: number;
  recentDamageTaken: number;
  killsWithoutDying: number;
  consecutiveHits: number;
  playerMissedShots: number;
}

/**
 * Current mercy system state
 */
export interface MercyState {
  isActive: boolean;
  dominationScore: number;      // 0-1, how much bot is dominating
  mercyLevel: number;           // 0-1, how much to back off
  remainingDuration: number;    // ms until mercy ends
}

// ============================================================================
// Combat Events
// ============================================================================

/**
 * Types of combat events
 */
export type CombatEventType =
  | 'bot_hit_player'
  | 'player_hit_bot'
  | 'player_missed'
  | 'bot_missed'
  | 'bot_killed_player'
  | 'player_killed_bot';

/**
 * Combat event for tracking
 */
export interface CombatEvent {
  type: CombatEventType;
  timestamp: number;
  damage?: number;
  position?: Vector3;
}

// ============================================================================
// Aim System
// ============================================================================

/**
 * Current aim controller state
 */
export interface AimState {
  currentAim: Vector3;          // Where bot is currently aiming
  targetAim: Vector3;           // Where bot wants to aim
  isOnTarget: boolean;          // Within accuracy threshold
  reactionRemaining: number;    // ms until bot reacts to new position
}

// ============================================================================
// Bot Events (for external listeners)
// ============================================================================

/**
 * Events emitted by the combat bot system
 */
export interface CombatBotEvents {
  onStateChange: (from: BotState, to: BotState) => void;
  onSignatureStart: (signature: SignatureMove) => void;
  onSignatureComplete: (signature: SignatureMove, success: boolean) => void;
  onMercyActivate: (dominationScore: number) => void;
  onMercyDeactivate: () => void;
  onPhraseStart: (phrase: EngagementPhrase) => void;
  onPhraseComplete: (phrase: EngagementPhrase) => void;
}
