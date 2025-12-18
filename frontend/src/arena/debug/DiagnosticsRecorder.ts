/**
 * DiagnosticsRecorder - Records game state for replay analysis
 * 
 * Records inputs, state snapshots, and reconciliation events
 * for debugging network and prediction issues.
 * 
 * @module debug/DiagnosticsRecorder
 */

import type { InputPacket, StateSnapshot } from '../network/Serializer';
import { Vector3 } from '../math/Vector3';

// ============================================================================
// Configuration
// ============================================================================

export interface DiagnosticsConfig {
  readonly maxRecordingDurationMs: number;
  readonly recordInputs: boolean;
  readonly recordSnapshots: boolean;
  readonly recordReconciliations: boolean;
}

export const DEFAULT_DIAGNOSTICS_CONFIG: DiagnosticsConfig = {
  maxRecordingDurationMs: 60000, // 1 minute
  recordInputs: true,
  recordSnapshots: true,
  recordReconciliations: true
};

// ============================================================================
// Record Types
// ============================================================================

export interface ReconciliationRecord {
  timestamp: number;
  tickNumber: number;
  predictionError: number;
  serverPosition: [number, number, number];
  predictedPosition: [number, number, number];
}

export interface DiagnosticsExport {
  startTime: number;
  endTime: number;
  durationMs: number;
  inputs: InputPacket[];
  snapshots: SerializableSnapshot[];
  reconciliations: ReconciliationRecord[];
  metadata: DiagnosticsMetadata;
}

export interface DiagnosticsMetadata {
  version: string;
  recordedAt: string;
  inputCount: number;
  snapshotCount: number;
  reconciliationCount: number;
  averageRTT?: number;
  maxPredictionError?: number;
}

// Serializable version of StateSnapshot (Map converted to array)
export interface SerializableSnapshot {
  tickNumber: number;
  serverTimestamp: number;
  players: Array<{
    entityId: number;
    position: [number, number, number];
    pitch: number;
    yaw: number;
    velocity: [number, number, number];
    health: number;
    stateFlags: number;
  }>;
  matchState: number;
  scores: Array<[number, number]>;
}

// ============================================================================
// Interface
// ============================================================================

export interface IDiagnosticsRecorder {
  startRecording(): void;
  stopRecording(): void;
  isRecording(): boolean;
  recordInput(input: InputPacket): void;
  recordSnapshot(snapshot: StateSnapshot): void;
  recordReconciliation(record: ReconciliationRecord): void;
  exportToJSON(): string;
  clear(): void;
  getRecordCount(): { inputs: number; snapshots: number; reconciliations: number };
}

// ============================================================================
// Implementation
// ============================================================================

export class DiagnosticsRecorder implements IDiagnosticsRecorder {
  private recording: boolean = false;
  private startTime: number = 0;
  private inputs: InputPacket[] = [];
  private snapshots: StateSnapshot[] = [];
  private reconciliations: ReconciliationRecord[] = [];
  private readonly config: DiagnosticsConfig;

  constructor(config: DiagnosticsConfig = DEFAULT_DIAGNOSTICS_CONFIG) {
    this.config = config;
  }

  startRecording(): void {
    this.clear();
    this.recording = true;
    this.startTime = Date.now();
  }

  stopRecording(): void {
    this.recording = false;
  }

  isRecording(): boolean {
    return this.recording;
  }

  recordInput(input: InputPacket): void {
    if (!this.recording || !this.config.recordInputs) return;
    this.inputs.push({ ...input });
    this.pruneOldRecords();
  }

  recordSnapshot(snapshot: StateSnapshot): void {
    if (!this.recording || !this.config.recordSnapshots) return;
    
    // Deep copy the snapshot
    this.snapshots.push({
      tickNumber: snapshot.tickNumber,
      serverTimestamp: snapshot.serverTimestamp,
      players: snapshot.players.map(p => ({
        entityId: p.entityId,
        position: p.position.clone(),
        pitch: p.pitch,
        yaw: p.yaw,
        velocity: p.velocity.clone(),
        health: p.health,
        stateFlags: p.stateFlags
      })),
      matchState: snapshot.matchState,
      scores: new Map(snapshot.scores)
    });
    
    this.pruneOldRecords();
  }

  recordReconciliation(record: ReconciliationRecord): void {
    if (!this.recording || !this.config.recordReconciliations) return;
    this.reconciliations.push({ ...record });
    this.pruneOldRecords();
  }

  exportToJSON(): string {
    const endTime = Date.now();
    
    // Convert snapshots to serializable format
    const serializableSnapshots: SerializableSnapshot[] = this.snapshots.map(s => ({
      tickNumber: s.tickNumber,
      serverTimestamp: s.serverTimestamp,
      players: s.players.map(p => ({
        entityId: p.entityId,
        position: [p.position.x, p.position.y, p.position.z] as [number, number, number],
        pitch: p.pitch,
        yaw: p.yaw,
        velocity: [p.velocity.x, p.velocity.y, p.velocity.z] as [number, number, number],
        health: p.health,
        stateFlags: p.stateFlags
      })),
      matchState: s.matchState,
      scores: Array.from(s.scores.entries())
    }));

    // Calculate metadata
    const maxPredictionError = this.reconciliations.length > 0
      ? Math.max(...this.reconciliations.map(r => r.predictionError))
      : undefined;

    const data: DiagnosticsExport = {
      startTime: this.startTime,
      endTime,
      durationMs: endTime - this.startTime,
      inputs: this.inputs,
      snapshots: serializableSnapshots,
      reconciliations: this.reconciliations,
      metadata: {
        version: '1.0.0',
        recordedAt: new Date().toISOString(),
        inputCount: this.inputs.length,
        snapshotCount: this.snapshots.length,
        reconciliationCount: this.reconciliations.length,
        maxPredictionError
      }
    };

    return JSON.stringify(data, null, 2);
  }

  clear(): void {
    this.inputs = [];
    this.snapshots = [];
    this.reconciliations = [];
    this.startTime = 0;
  }

  getRecordCount(): { inputs: number; snapshots: number; reconciliations: number } {
    return {
      inputs: this.inputs.length,
      snapshots: this.snapshots.length,
      reconciliations: this.reconciliations.length
    };
  }

  getStartTime(): number {
    return this.startTime;
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private pruneOldRecords(): void {
    const cutoff = Date.now() - this.config.maxRecordingDurationMs;
    
    // Prune inputs
    this.inputs = this.inputs.filter(i => i.clientTimestamp >= cutoff);
    
    // Prune snapshots
    this.snapshots = this.snapshots.filter(s => s.serverTimestamp >= cutoff);
    
    // Prune reconciliations
    this.reconciliations = this.reconciliations.filter(r => r.timestamp >= cutoff);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a reconciliation record from prediction data
 */
export function createReconciliationRecord(
  tickNumber: number,
  predictionError: number,
  serverPosition: Vector3,
  predictedPosition: Vector3
): ReconciliationRecord {
  return {
    timestamp: Date.now(),
    tickNumber,
    predictionError,
    serverPosition: [serverPosition.x, serverPosition.y, serverPosition.z],
    predictedPosition: [predictedPosition.x, predictedPosition.y, predictedPosition.z]
  };
}

/**
 * Parse exported diagnostics JSON
 */
export function parseDiagnosticsExport(json: string): DiagnosticsExport | null {
  try {
    const data = JSON.parse(json) as DiagnosticsExport;
    
    // Validate required fields
    if (
      typeof data.startTime !== 'number' ||
      typeof data.endTime !== 'number' ||
      !Array.isArray(data.inputs) ||
      !Array.isArray(data.snapshots) ||
      !Array.isArray(data.reconciliations)
    ) {
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}
