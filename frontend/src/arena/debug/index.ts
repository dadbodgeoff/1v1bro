/**
 * Arena Debug Module
 * 
 * Debug visualization and diagnostics recording.
 * 
 * @module debug
 */

export {
  DebugOverlay,
  DEFAULT_DEBUG_CONFIG,
  DEFAULT_NETWORK_STATS,
  colorWithAlpha,
  getThresholdColor,
  type IDebugOverlay,
  type DebugConfig,
  type NetworkStats,
  type DebugDrawCommand
} from './DebugOverlay';

export {
  DiagnosticsRecorder,
  DEFAULT_DIAGNOSTICS_CONFIG,
  createReconciliationRecord,
  parseDiagnosticsExport,
  type IDiagnosticsRecorder,
  type DiagnosticsConfig,
  type ReconciliationRecord,
  type DiagnosticsExport,
  type DiagnosticsMetadata,
  type SerializableSnapshot
} from './DiagnosticsRecorder';

export {
  ArenaMemoryMonitor,
  type MemoryBudget,
  type MemoryStats
} from './MemoryMonitor';
