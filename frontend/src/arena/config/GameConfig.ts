/**
 * GameConfig - Complete game configuration combining all subsystem configs
 * 
 * Single source of truth for all arena game settings.
 * 
 * @module config/GameConfig
 */

import type { PhysicsConfig } from '../physics/Physics3D';
import { DEFAULT_PHYSICS_CONFIG } from '../physics/Physics3D';
import type { MatchConfig } from '../game/MatchStateMachine';
import { DEFAULT_MATCH_CONFIG } from '../game/MatchStateMachine';
import type { CombatConfig } from '../game/CombatSystem';
import { DEFAULT_COMBAT_CONFIG } from '../game/CombatSystem';
import type { AudioConfig } from '../presentation/AudioSystem';
import { DEFAULT_AUDIO_CONFIG } from '../presentation/AudioSystem';
import type { HUDConfig } from '../presentation/HUDRenderer';
import { DEFAULT_HUD_CONFIG } from '../presentation/HUDRenderer';
import type { DebugConfig } from '../debug/DebugOverlay';
import { DEFAULT_DEBUG_CONFIG } from '../debug/DebugOverlay';
import type { DiagnosticsConfig } from '../debug/DiagnosticsRecorder';
import { DEFAULT_DIAGNOSTICS_CONFIG } from '../debug/DiagnosticsRecorder';

// ============================================================================
// Network Configuration
// ============================================================================

export interface NetworkConfig {
  readonly serverUrl: string;
  readonly keepaliveIntervalMs: number;
  readonly reconnectDelayMs: number;
  readonly maxReconnectDelayMs: number;
  readonly connectionTimeoutMs: number;
  readonly maxPendingInputs: number;
  readonly inputRedundancy: number;
}

export const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  serverUrl: 'ws://localhost:8080',
  keepaliveIntervalMs: 5000,
  reconnectDelayMs: 1000,
  maxReconnectDelayMs: 30000,
  connectionTimeoutMs: 10000,
  maxPendingInputs: 32,
  inputRedundancy: 3
};

// ============================================================================
// Clock Sync Configuration
// ============================================================================

export interface ClockSyncConfig {
  readonly sampleCount: number;
  readonly resyncThresholdMs: number;
  readonly smoothingDurationMs: number;
}

export const DEFAULT_CLOCK_SYNC_CONFIG: ClockSyncConfig = {
  sampleCount: 5,
  resyncThresholdMs: 50,
  smoothingDurationMs: 500
};

// ============================================================================
// Tick Configuration
// ============================================================================

export interface TickConfig {
  readonly tickRate: number;
  readonly tickDurationMs: number;
  readonly maxCatchupTicks: number;
}

export const DEFAULT_TICK_CONFIG: TickConfig = {
  tickRate: 60,
  tickDurationMs: 16.67,
  maxCatchupTicks: 5
};

// ============================================================================
// Interpolation Configuration
// ============================================================================

export interface InterpolationConfig {
  readonly bufferSize: number;
  readonly baseDelayMs: number;
  readonly maxExtrapolationMs: number;
  readonly blendDurationMs: number;
}

export const DEFAULT_INTERPOLATION_CONFIG: InterpolationConfig = {
  bufferSize: 32,
  baseDelayMs: 100,
  maxExtrapolationMs: 100,
  blendDurationMs: 50
};

// ============================================================================
// Prediction Configuration
// ============================================================================

export interface PredictionConfig {
  readonly reconciliationThreshold: number;
  readonly maxPendingInputs: number;
  readonly desyncThreshold: number;
  readonly desyncTimeoutMs: number;
}

export const DEFAULT_PREDICTION_CONFIG: PredictionConfig = {
  reconciliationThreshold: 0.1,
  maxPendingInputs: 64,
  desyncThreshold: 1.0,
  desyncTimeoutMs: 500
};

// ============================================================================
// Anti-Cheat Configuration
// ============================================================================

export interface AntiCheatConfig {
  readonly maxSpeedMultiplier: number;
  readonly coyoteTimeMs: number;
  readonly maxTimestampDeviationMs: number;
  readonly violationThreshold: number;
  readonly violationWindowMs: number;
}

export const DEFAULT_ANTI_CHEAT_CONFIG: AntiCheatConfig = {
  maxSpeedMultiplier: 1.5,
  coyoteTimeMs: 100,
  maxTimestampDeviationMs: 500,
  violationThreshold: 10,
  violationWindowMs: 60000
};

// ============================================================================
// Lag Compensation Configuration
// ============================================================================

export interface LagCompensationConfig {
  readonly maxRewindMs: number;
  readonly snapshotHistoryMs: number;
}

export const DEFAULT_LAG_COMPENSATION_CONFIG: LagCompensationConfig = {
  maxRewindMs: 250,
  snapshotHistoryMs: 1000
};

// ============================================================================
// Camera Configuration
// ============================================================================

export interface CameraConfig {
  readonly sensitivity: number;
  readonly minPitch: number;
  readonly maxPitch: number;
  readonly viewBobAmplitude: number;
  readonly viewBobFrequency: number;
}

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  sensitivity: 0.002,
  minPitch: -89 * (Math.PI / 180),
  maxPitch: 89 * (Math.PI / 180),
  viewBobAmplitude: 0.02,
  viewBobFrequency: 10
};

// ============================================================================
// Complete Game Configuration
// ============================================================================

export interface GameConfig {
  readonly physics: PhysicsConfig;
  readonly match: MatchConfig;
  readonly combat: CombatConfig;
  readonly network: NetworkConfig;
  readonly clockSync: ClockSyncConfig;
  readonly tick: TickConfig;
  readonly interpolation: InterpolationConfig;
  readonly prediction: PredictionConfig;
  readonly antiCheat: AntiCheatConfig;
  readonly lagCompensation: LagCompensationConfig;
  readonly camera: CameraConfig;
  readonly audio: AudioConfig;
  readonly hud: HUDConfig;
  readonly debug: DebugConfig;
  readonly diagnostics: DiagnosticsConfig;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  physics: DEFAULT_PHYSICS_CONFIG,
  match: DEFAULT_MATCH_CONFIG,
  combat: DEFAULT_COMBAT_CONFIG,
  network: DEFAULT_NETWORK_CONFIG,
  clockSync: DEFAULT_CLOCK_SYNC_CONFIG,
  tick: DEFAULT_TICK_CONFIG,
  interpolation: DEFAULT_INTERPOLATION_CONFIG,
  prediction: DEFAULT_PREDICTION_CONFIG,
  antiCheat: DEFAULT_ANTI_CHEAT_CONFIG,
  lagCompensation: DEFAULT_LAG_COMPENSATION_CONFIG,
  camera: DEFAULT_CAMERA_CONFIG,
  audio: DEFAULT_AUDIO_CONFIG,
  hud: DEFAULT_HUD_CONFIG,
  debug: DEFAULT_DEBUG_CONFIG,
  diagnostics: DEFAULT_DIAGNOSTICS_CONFIG
};

// ============================================================================
// Config Utilities
// ============================================================================

/**
 * Create a game config with overrides
 */
export function createGameConfig(overrides: Partial<GameConfig> = {}): GameConfig {
  return {
    ...DEFAULT_GAME_CONFIG,
    ...overrides
  };
}

/**
 * Create a development config with debug enabled
 */
export function createDevConfig(): GameConfig {
  return createGameConfig({
    debug: {
      ...DEFAULT_DEBUG_CONFIG,
      enabled: true,
      showColliders: true,
      showCapsules: true,
      showRaycasts: true,
      showSpawnPoints: true,
      showNetworkStats: true
    },
    diagnostics: {
      ...DEFAULT_DIAGNOSTICS_CONFIG,
      recordInputs: true,
      recordSnapshots: true,
      recordReconciliations: true
    }
  });
}

/**
 * Create a production config with debug disabled
 */
export function createProdConfig(): GameConfig {
  return createGameConfig({
    debug: {
      ...DEFAULT_DEBUG_CONFIG,
      enabled: false
    },
    diagnostics: {
      ...DEFAULT_DIAGNOSTICS_CONFIG,
      recordInputs: false,
      recordSnapshots: false,
      recordReconciliations: false
    }
  });
}

/**
 * Validate a game config
 */
export function validateGameConfig(config: GameConfig): string[] {
  const errors: string[] = [];
  
  // Validate physics
  if (config.physics.gravity >= 0) {
    errors.push('Physics gravity should be negative');
  }
  if (config.physics.maxSpeed <= 0) {
    errors.push('Physics maxSpeed must be positive');
  }
  
  // Validate match
  if (config.match.killsToWin <= 0) {
    errors.push('Match killsToWin must be positive');
  }
  if (config.match.requiredPlayers < 2) {
    errors.push('Match requiredPlayers must be at least 2');
  }
  
  // Validate tick
  if (config.tick.tickRate <= 0) {
    errors.push('Tick rate must be positive');
  }
  
  // Validate network
  if (config.network.maxPendingInputs <= 0) {
    errors.push('Network maxPendingInputs must be positive');
  }
  
  return errors;
}
