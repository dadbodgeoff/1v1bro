/**
 * Telemetry Module
 * Exports for telemetry recording, replay playback, and rendering
 */

export { TelemetryRecorder } from './TelemetryRecorder'
export { ReplayPlayer } from './ReplayPlayer'
export type { PlaybackState, ReplayPlayerCallbacks } from './ReplayPlayer'
export { ReplayRenderer } from './ReplayRenderer'
export type { ReplayRenderOptions } from './ReplayRenderer'

// Re-export all types
export type {
  TelemetryFrame,
  PlayerSnapshot,
  ProjectileSnapshot,
  NetworkStats,
  TelemetryCombatEvent,
  TelemetryCombatEventType,
  TelemetryCombatEventData,
  TelemetryFireEventData,
  TelemetryHitEventData,
  TelemetryDamageEventData,
  TelemetryDeathEventData,
  TelemetryRespawnEventData,
  DeathReplay,
  TelemetryConfig,
} from './types'

export { DEFAULT_TELEMETRY_CONFIG } from './types'
