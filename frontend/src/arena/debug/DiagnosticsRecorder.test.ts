/**
 * DiagnosticsRecorder Unit Tests
 * 
 * Tests for JSON export format and old record pruning.
 * 
 * @module debug/DiagnosticsRecorder.test
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  DiagnosticsRecorder,
  DEFAULT_DIAGNOSTICS_CONFIG,
  createReconciliationRecord,
  parseDiagnosticsExport,
  type ReconciliationRecord,
  type DiagnosticsExport
} from './DiagnosticsRecorder';
import { InputPacket, StateSnapshot } from '../network/Serializer';
import { Vector3 } from '../math/Vector3';

describe('DiagnosticsRecorder', () => {
  let recorder: DiagnosticsRecorder;

  beforeEach(() => {
    recorder = new DiagnosticsRecorder();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('recording state', () => {
    it('should not be recording by default', () => {
      expect(recorder.isRecording()).toBe(false);
    });

    it('should start recording', () => {
      recorder.startRecording();
      expect(recorder.isRecording()).toBe(true);
    });

    it('should stop recording', () => {
      recorder.startRecording();
      recorder.stopRecording();
      expect(recorder.isRecording()).toBe(false);
    });

    it('should set start time when recording starts', () => {
      const now = Date.now();
      vi.setSystemTime(now);
      
      recorder.startRecording();
      
      expect(recorder.getStartTime()).toBe(now);
    });

    it('should clear records when starting new recording', () => {
      const now = Date.now();
      vi.setSystemTime(now);
      
      recorder.startRecording();
      
      const input = createMockInput(1, now);
      recorder.recordInput(input);
      
      expect(recorder.getRecordCount().inputs).toBe(1);
      
      recorder.startRecording();
      
      expect(recorder.getRecordCount().inputs).toBe(0);
    });
  });

  describe('recording inputs', () => {
    it('should not record inputs when not recording', () => {
      const input = createMockInput(1, Date.now());
      recorder.recordInput(input);
      
      expect(recorder.getRecordCount().inputs).toBe(0);
    });

    it('should record inputs when recording', () => {
      recorder.startRecording();
      
      const input = createMockInput(1, Date.now());
      recorder.recordInput(input);
      
      expect(recorder.getRecordCount().inputs).toBe(1);
    });

    it('should record multiple inputs', () => {
      recorder.startRecording();
      
      recorder.recordInput(createMockInput(1, Date.now()));
      recorder.recordInput(createMockInput(2, Date.now()));
      recorder.recordInput(createMockInput(3, Date.now()));
      
      expect(recorder.getRecordCount().inputs).toBe(3);
    });

    it('should not record inputs when config disables it', () => {
      const customRecorder = new DiagnosticsRecorder({
        ...DEFAULT_DIAGNOSTICS_CONFIG,
        recordInputs: false
      });
      
      customRecorder.startRecording();
      customRecorder.recordInput(createMockInput(1, Date.now()));
      
      expect(customRecorder.getRecordCount().inputs).toBe(0);
    });
  });

  describe('recording snapshots', () => {
    it('should not record snapshots when not recording', () => {
      const snapshot = createMockSnapshot(1, Date.now());
      recorder.recordSnapshot(snapshot);
      
      expect(recorder.getRecordCount().snapshots).toBe(0);
    });

    it('should record snapshots when recording', () => {
      recorder.startRecording();
      
      const snapshot = createMockSnapshot(1, Date.now());
      recorder.recordSnapshot(snapshot);
      
      expect(recorder.getRecordCount().snapshots).toBe(1);
    });

    it('should not record snapshots when config disables it', () => {
      const customRecorder = new DiagnosticsRecorder({
        ...DEFAULT_DIAGNOSTICS_CONFIG,
        recordSnapshots: false
      });
      
      customRecorder.startRecording();
      customRecorder.recordSnapshot(createMockSnapshot(1, Date.now()));
      
      expect(customRecorder.getRecordCount().snapshots).toBe(0);
    });
  });

  describe('recording reconciliations', () => {
    it('should not record reconciliations when not recording', () => {
      const record = createMockReconciliation(1, 0.5);
      recorder.recordReconciliation(record);
      
      expect(recorder.getRecordCount().reconciliations).toBe(0);
    });

    it('should record reconciliations when recording', () => {
      recorder.startRecording();
      
      const record = createMockReconciliation(1, 0.5);
      recorder.recordReconciliation(record);
      
      expect(recorder.getRecordCount().reconciliations).toBe(1);
    });

    it('should not record reconciliations when config disables it', () => {
      const customRecorder = new DiagnosticsRecorder({
        ...DEFAULT_DIAGNOSTICS_CONFIG,
        recordReconciliations: false
      });
      
      customRecorder.startRecording();
      customRecorder.recordReconciliation(createMockReconciliation(1, 0.5));
      
      expect(customRecorder.getRecordCount().reconciliations).toBe(0);
    });
  });

  describe('old record pruning', () => {
    it('should prune inputs older than max duration', () => {
      const shortDurationRecorder = new DiagnosticsRecorder({
        ...DEFAULT_DIAGNOSTICS_CONFIG,
        maxRecordingDurationMs: 1000 // 1 second
      });
      
      const now = Date.now();
      vi.setSystemTime(now);
      
      shortDurationRecorder.startRecording();
      
      // Record input at current time
      shortDurationRecorder.recordInput(createMockInput(1, now));
      
      expect(shortDurationRecorder.getRecordCount().inputs).toBe(1);
      
      // Advance time past max duration
      vi.setSystemTime(now + 2000);
      
      // Record another input to trigger pruning
      shortDurationRecorder.recordInput(createMockInput(2, now + 2000));
      
      // Old input should be pruned
      expect(shortDurationRecorder.getRecordCount().inputs).toBe(1);
    });

    it('should prune snapshots older than max duration', () => {
      const shortDurationRecorder = new DiagnosticsRecorder({
        ...DEFAULT_DIAGNOSTICS_CONFIG,
        maxRecordingDurationMs: 1000
      });
      
      const now = Date.now();
      vi.setSystemTime(now);
      
      shortDurationRecorder.startRecording();
      shortDurationRecorder.recordSnapshot(createMockSnapshot(1, now));
      
      vi.setSystemTime(now + 2000);
      shortDurationRecorder.recordSnapshot(createMockSnapshot(2, now + 2000));
      
      expect(shortDurationRecorder.getRecordCount().snapshots).toBe(1);
    });

    it('should prune reconciliations older than max duration', () => {
      const shortDurationRecorder = new DiagnosticsRecorder({
        ...DEFAULT_DIAGNOSTICS_CONFIG,
        maxRecordingDurationMs: 1000
      });
      
      const now = Date.now();
      vi.setSystemTime(now);
      
      shortDurationRecorder.startRecording();
      shortDurationRecorder.recordReconciliation({
        timestamp: now,
        tickNumber: 1,
        predictionError: 0.5,
        serverPosition: [0, 0, 0],
        predictedPosition: [0.5, 0, 0]
      });
      
      vi.setSystemTime(now + 2000);
      shortDurationRecorder.recordReconciliation({
        timestamp: now + 2000,
        tickNumber: 2,
        predictionError: 0.3,
        serverPosition: [1, 0, 0],
        predictedPosition: [1.3, 0, 0]
      });
      
      expect(shortDurationRecorder.getRecordCount().reconciliations).toBe(1);
    });

    it('should keep records within max duration', () => {
      const shortDurationRecorder = new DiagnosticsRecorder({
        ...DEFAULT_DIAGNOSTICS_CONFIG,
        maxRecordingDurationMs: 5000
      });
      
      const now = Date.now();
      vi.setSystemTime(now);
      
      shortDurationRecorder.startRecording();
      shortDurationRecorder.recordInput(createMockInput(1, now));
      
      // Advance time but stay within max duration
      vi.setSystemTime(now + 3000);
      shortDurationRecorder.recordInput(createMockInput(2, now + 3000));
      
      // Both inputs should still be present
      expect(shortDurationRecorder.getRecordCount().inputs).toBe(2);
    });
  });

  describe('JSON export format', () => {
    it('should export valid JSON', () => {
      recorder.startRecording();
      
      const json = recorder.exportToJSON();
      
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should include start and end times', () => {
      const now = Date.now();
      vi.setSystemTime(now);
      
      recorder.startRecording();
      
      vi.setSystemTime(now + 5000);
      
      const json = recorder.exportToJSON();
      const data = JSON.parse(json) as DiagnosticsExport;
      
      expect(data.startTime).toBe(now);
      expect(data.endTime).toBe(now + 5000);
      expect(data.durationMs).toBe(5000);
    });

    it('should include inputs in export', () => {
      const now = Date.now();
      vi.setSystemTime(now);
      
      recorder.startRecording();
      recorder.recordInput(createMockInput(1, now));
      recorder.recordInput(createMockInput(2, now + 100));
      
      const json = recorder.exportToJSON();
      const data = JSON.parse(json) as DiagnosticsExport;
      
      expect(data.inputs).toHaveLength(2);
      expect(data.inputs[0].sequenceNumber).toBe(1);
      expect(data.inputs[1].sequenceNumber).toBe(2);
    });

    it('should include snapshots in export with serialized format', () => {
      const now = Date.now();
      vi.setSystemTime(now);
      
      recorder.startRecording();
      recorder.recordSnapshot(createMockSnapshot(100, now));
      
      const json = recorder.exportToJSON();
      const data = JSON.parse(json) as DiagnosticsExport;
      
      expect(data.snapshots).toHaveLength(1);
      expect(data.snapshots[0].tickNumber).toBe(100);
      expect(Array.isArray(data.snapshots[0].players[0].position)).toBe(true);
      expect(Array.isArray(data.snapshots[0].scores)).toBe(true);
    });

    it('should include reconciliations in export', () => {
      const now = Date.now();
      vi.setSystemTime(now);
      
      recorder.startRecording();
      recorder.recordReconciliation({
        timestamp: now,
        tickNumber: 50,
        predictionError: 0.15,
        serverPosition: [1, 2, 3],
        predictedPosition: [1.1, 2, 3]
      });
      
      const json = recorder.exportToJSON();
      const data = JSON.parse(json) as DiagnosticsExport;
      
      expect(data.reconciliations).toHaveLength(1);
      expect(data.reconciliations[0].tickNumber).toBe(50);
      expect(data.reconciliations[0].predictionError).toBe(0.15);
    });

    it('should include metadata in export', () => {
      recorder.startRecording();
      recorder.recordInput(createMockInput(1, Date.now()));
      recorder.recordSnapshot(createMockSnapshot(1, Date.now()));
      recorder.recordReconciliation(createMockReconciliation(1, 0.5));
      
      const json = recorder.exportToJSON();
      const data = JSON.parse(json) as DiagnosticsExport;
      
      expect(data.metadata.version).toBe('1.0.0');
      expect(data.metadata.inputCount).toBe(1);
      expect(data.metadata.snapshotCount).toBe(1);
      expect(data.metadata.reconciliationCount).toBe(1);
      expect(data.metadata.recordedAt).toBeDefined();
    });

    it('should calculate max prediction error in metadata', () => {
      recorder.startRecording();
      recorder.recordReconciliation(createMockReconciliation(1, 0.1));
      recorder.recordReconciliation(createMockReconciliation(2, 0.5));
      recorder.recordReconciliation(createMockReconciliation(3, 0.3));
      
      const json = recorder.exportToJSON();
      const data = JSON.parse(json) as DiagnosticsExport;
      
      expect(data.metadata.maxPredictionError).toBe(0.5);
    });
  });

  describe('clear', () => {
    it('should clear all records', () => {
      recorder.startRecording();
      recorder.recordInput(createMockInput(1, Date.now()));
      recorder.recordSnapshot(createMockSnapshot(1, Date.now()));
      recorder.recordReconciliation(createMockReconciliation(1, 0.5));
      
      recorder.clear();
      
      const counts = recorder.getRecordCount();
      expect(counts.inputs).toBe(0);
      expect(counts.snapshots).toBe(0);
      expect(counts.reconciliations).toBe(0);
    });

    it('should reset start time', () => {
      recorder.startRecording();
      expect(recorder.getStartTime()).toBeGreaterThan(0);
      
      recorder.clear();
      
      expect(recorder.getStartTime()).toBe(0);
    });
  });
});

describe('utility functions', () => {
  describe('createReconciliationRecord', () => {
    it('should create record with correct data', () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);
      
      const record = createReconciliationRecord(
        100,
        0.25,
        new Vector3(1, 2, 3),
        new Vector3(1.2, 2, 3)
      );
      
      expect(record.timestamp).toBe(now);
      expect(record.tickNumber).toBe(100);
      expect(record.predictionError).toBe(0.25);
      expect(record.serverPosition).toEqual([1, 2, 3]);
      expect(record.predictedPosition).toEqual([1.2, 2, 3]);
      
      vi.useRealTimers();
    });
  });

  describe('parseDiagnosticsExport', () => {
    it('should parse valid export JSON', () => {
      const validExport: DiagnosticsExport = {
        startTime: 1000,
        endTime: 2000,
        durationMs: 1000,
        inputs: [],
        snapshots: [],
        reconciliations: [],
        metadata: {
          version: '1.0.0',
          recordedAt: new Date().toISOString(),
          inputCount: 0,
          snapshotCount: 0,
          reconciliationCount: 0
        }
      };
      
      const result = parseDiagnosticsExport(JSON.stringify(validExport));
      
      expect(result).not.toBeNull();
      expect(result?.startTime).toBe(1000);
    });

    it('should return null for invalid JSON', () => {
      expect(parseDiagnosticsExport('not valid json')).toBeNull();
    });

    it('should return null for missing required fields', () => {
      expect(parseDiagnosticsExport('{}')).toBeNull();
      expect(parseDiagnosticsExport('{"startTime": 1000}')).toBeNull();
    });
  });
});

// ============================================================================
// Test Helpers
// ============================================================================

function createMockInput(sequenceNumber: number, timestamp: number): InputPacket {
  return {
    sequenceNumber,
    tickNumber: sequenceNumber,
    movementX: 0,
    movementY: 1,
    lookDeltaX: 0,
    lookDeltaY: 0,
    buttons: 0,
    clientTimestamp: timestamp
  };
}

function createMockSnapshot(tickNumber: number, timestamp: number): StateSnapshot {
  return {
    tickNumber,
    serverTimestamp: timestamp,
    players: [{
      entityId: 1,
      position: new Vector3(0, 0, 0),
      pitch: 0,
      yaw: 0,
      velocity: new Vector3(0, 0, 0),
      health: 100,
      stateFlags: 0
    }],
    matchState: 2, // playing
    scores: new Map([[1, 0]])
  };
}

function createMockReconciliation(tickNumber: number, error: number): ReconciliationRecord {
  return {
    timestamp: Date.now(),
    tickNumber,
    predictionError: error,
    serverPosition: [0, 0, 0],
    predictedPosition: [error, 0, 0]
  };
}
