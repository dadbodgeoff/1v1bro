/**
 * Lag Compensation Tests
 *
 * Property-based and unit tests for snapshot history and rewind.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  LagCompensation,
  DEFAULT_LAG_COMPENSATION_CONFIG,
  LagCompensationConfig,
  WorldSnapshot,
} from './LagCompensation';
import { Vector3 } from '../math/Vector3';
import { Capsule } from '../physics/Capsule';
import { isOk, isErr } from '../core/Result';

describe('LagCompensation', () => {
  const createSnapshot = (tick: number, timestamp: number, playerPositions: [number, Vector3][]): WorldSnapshot => ({
    tickNumber: tick,
    timestamp,
    playerPositions: new Map(playerPositions),
    playerCapsules: new Map(playerPositions.map(([id, pos]) => [id, new Capsule(pos)])),
  });

  describe('Snapshot Recording', () => {
    it('records snapshots', () => {
      const lagComp = new LagCompensation();
      const snapshot = createSnapshot(1, 100, [[1, Vector3.ZERO]]);

      lagComp.recordSnapshot(snapshot);

      expect(lagComp.getSnapshotCount()).toBe(1);
    });

    it('keeps snapshots sorted by tick number', () => {
      const lagComp = new LagCompensation();

      lagComp.recordSnapshot(createSnapshot(3, 300, []));
      lagComp.recordSnapshot(createSnapshot(1, 100, []));
      lagComp.recordSnapshot(createSnapshot(2, 200, []));

      const result1 = lagComp.getSnapshotAtTick(1);
      const result2 = lagComp.getSnapshotAtTick(2);
      const result3 = lagComp.getSnapshotAtTick(3);

      expect(isOk(result1) && result1.value.tickNumber).toBe(1);
      expect(isOk(result2) && result2.value.tickNumber).toBe(2);
      expect(isOk(result3) && result3.value.tickNumber).toBe(3);
    });
  });

  describe('Snapshot Retrieval', () => {
    // Property 20: Snapshot History Retrieval - recorded snapshots are retrievable
    it('Property 20: recorded snapshots are retrievable by tick', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 1, maxLength: 20 }),
          (tickNumbers) => {
            const lagComp = new LagCompensation();
            const uniqueTicks = [...new Set(tickNumbers)];

            for (const tick of uniqueTicks) {
              lagComp.recordSnapshot(createSnapshot(tick, tick * 16, []));
            }

            for (const tick of uniqueTicks) {
              const result = lagComp.getSnapshotAtTick(tick);
              expect(isOk(result)).toBe(true);
              if (isOk(result)) {
                expect(result.value.tickNumber).toBe(tick);
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('returns error for non-existent tick', () => {
      const lagComp = new LagCompensation();
      lagComp.recordSnapshot(createSnapshot(1, 100, []));

      const result = lagComp.getSnapshotAtTick(999);
      expect(isErr(result)).toBe(true);
    });

    it('returns error when no snapshots available', () => {
      const lagComp = new LagCompensation();

      const result = lagComp.getSnapshotAtTime(100);
      expect(isErr(result)).toBe(true);
    });

    it('finds closest snapshot to target time', () => {
      const lagComp = new LagCompensation();

      lagComp.recordSnapshot(createSnapshot(1, 100, []));
      lagComp.recordSnapshot(createSnapshot(2, 200, []));
      lagComp.recordSnapshot(createSnapshot(3, 300, []));

      // Target time 150 should return snapshot at 100 or 200 (closest)
      const result = lagComp.getSnapshotAtTime(150);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect([100, 200]).toContain(result.value.timestamp);
      }
    });
  });

  describe('Rewind Capping', () => {
    // Property 21: Rewind Time Capping - rewind capped at maxRewindMs
    it('Property 21: rewind is capped at maxRewindMs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 500 }),
          fc.integer({ min: 0, max: 2000 }),
          (maxRewind, requestedRewind) => {
            const config: LagCompensationConfig = {
              ...DEFAULT_LAG_COMPENSATION_CONFIG,
              maxRewindMs: maxRewind,
            };
            const lagComp = new LagCompensation(config);

            // Create snapshots spanning 1 second
            for (let i = 0; i <= 60; i++) {
              lagComp.recordSnapshot(createSnapshot(i, i * 16, []));
            }

            const currentTime = 60 * 16; // 960ms
            const targetTime = currentTime - requestedRewind;

            const result = lagComp.getSnapshotAtTime(targetTime);
            expect(isOk(result)).toBe(true);

            if (isOk(result)) {
              const actualRewind = currentTime - result.value.timestamp;
              // Actual rewind should not exceed maxRewind (with some tolerance for discrete snapshots)
              expect(actualRewind).toBeLessThanOrEqual(maxRewind + 20);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });


  describe('Interpolation', () => {
    it('interpolates player positions between snapshots', () => {
      const lagComp = new LagCompensation();

      lagComp.recordSnapshot(createSnapshot(1, 100, [[1, new Vector3(0, 0, 0)]]));
      lagComp.recordSnapshot(createSnapshot(2, 200, [[1, new Vector3(10, 0, 0)]]));

      // Get capsules at time 150 (midpoint)
      const result = lagComp.getPlayerCapsulesAtTime(150);
      expect(isOk(result)).toBe(true);

      if (isOk(result)) {
        const capsule = result.value.get(1);
        expect(capsule).toBeDefined();
        // Position should be interpolated to approximately (5, 0, 0)
        expect(capsule!.position.x).toBeCloseTo(5, 1);
      }
    });

    it('handles player not present in after snapshot', () => {
      const lagComp = new LagCompensation();

      lagComp.recordSnapshot(createSnapshot(1, 100, [[1, new Vector3(0, 0, 0)]]));
      lagComp.recordSnapshot(createSnapshot(2, 200, [])); // Player 1 not present

      const result = lagComp.getPlayerCapsulesAtTime(150);
      expect(isOk(result)).toBe(true);

      if (isOk(result)) {
        const capsule = result.value.get(1);
        expect(capsule).toBeDefined();
        // Should use the before position
        expect(capsule!.position.x).toBeCloseTo(0, 1);
      }
    });
  });

  describe('Pruning', () => {
    it('removes old snapshots', () => {
      const config: LagCompensationConfig = {
        ...DEFAULT_LAG_COMPENSATION_CONFIG,
        historyDurationMs: 500,
      };
      const lagComp = new LagCompensation(config);

      lagComp.recordSnapshot(createSnapshot(1, 100, []));
      lagComp.recordSnapshot(createSnapshot(2, 199, []));
      lagComp.recordSnapshot(createSnapshot(3, 700, []));

      lagComp.pruneOldSnapshots(700);

      // Snapshots at 100 and 199 should be pruned (700 - 500 = 200 cutoff, >= 200 kept)
      expect(lagComp.getSnapshotCount()).toBe(1);
    });

    it('keeps snapshots within history duration', () => {
      const config: LagCompensationConfig = {
        ...DEFAULT_LAG_COMPENSATION_CONFIG,
        historyDurationMs: 1000,
      };
      const lagComp = new LagCompensation(config);

      lagComp.recordSnapshot(createSnapshot(1, 500, []));
      lagComp.recordSnapshot(createSnapshot(2, 600, []));
      lagComp.recordSnapshot(createSnapshot(3, 700, []));

      lagComp.pruneOldSnapshots(1000);

      // All snapshots should be kept (cutoff is 0)
      expect(lagComp.getSnapshotCount()).toBe(3);
    });
  });

  describe('Clear', () => {
    it('removes all snapshots', () => {
      const lagComp = new LagCompensation();

      lagComp.recordSnapshot(createSnapshot(1, 100, []));
      lagComp.recordSnapshot(createSnapshot(2, 200, []));

      lagComp.clear();

      expect(lagComp.getSnapshotCount()).toBe(0);
    });
  });
});
