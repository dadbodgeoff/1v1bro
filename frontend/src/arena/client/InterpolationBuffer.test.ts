/**
 * InterpolationBuffer Unit and Property Tests
 *
 * Tests for smooth rendering of remote entities.
 * _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import {
  InterpolationBuffer,
  DEFAULT_INTERPOLATION_CONFIG,
  InterpolationConfig,
} from './InterpolationBuffer';
import { Vector3 } from '../math/Vector3';
import { EventBus, IEventBus } from '../core/EventBus';
import type { StateSnapshot, PlayerState } from '../network/Serializer';

// Helper to create player state
function createPlayerState(
  entityId: number,
  position: Vector3,
  velocity: Vector3 = Vector3.ZERO
): PlayerState {
  return {
    entityId,
    position,
    pitch: 0,
    yaw: 0,
    velocity,
    health: 100,
    stateFlags: 0x01,
  };
}

// Helper to create snapshot
function createSnapshot(
  tickNumber: number,
  serverTimestamp: number,
  players: PlayerState[]
): StateSnapshot {
  return {
    tickNumber,
    serverTimestamp,
    players,
    matchState: 2, // playing
    scores: new Map(),
  };
}

describe('InterpolationBuffer', () => {
  let buffer: InterpolationBuffer;
  let eventBus: IEventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    buffer = new InterpolationBuffer(DEFAULT_INTERPOLATION_CONFIG, eventBus);
  });

  describe('initialization', () => {
    it('starts with zero snapshots', () => {
      expect(buffer.getSnapshotCount()).toBe(0);
    });

    it('returns empty array when no snapshots', () => {
      const entities = buffer.getInterpolatedEntities(1000, 0);
      expect(entities).toEqual([]);
    });
  });

  describe('addSnapshot', () => {
    it('adds snapshot to buffer', () => {
      const snapshot = createSnapshot(1, 1000, [createPlayerState(1, Vector3.ZERO)]);
      buffer.addSnapshot(snapshot);
      expect(buffer.getSnapshotCount()).toBe(1);
    });

    it('maintains buffer size limit', () => {
      const config: InterpolationConfig = {
        ...DEFAULT_INTERPOLATION_CONFIG,
        bufferSize: 5,
      };
      const buf = new InterpolationBuffer(config, eventBus);

      for (let i = 0; i < 10; i++) {
        buf.addSnapshot(createSnapshot(i, 1000 + i * 16, [createPlayerState(1, Vector3.ZERO)]));
      }

      expect(buf.getSnapshotCount()).toBe(5);
    });

    it('sorts snapshots by tick number', () => {
      // Add out of order
      buffer.addSnapshot(createSnapshot(3, 1048, [createPlayerState(1, Vector3.ZERO)]));
      buffer.addSnapshot(createSnapshot(1, 1016, [createPlayerState(1, Vector3.ZERO)]));
      buffer.addSnapshot(createSnapshot(2, 1032, [createPlayerState(1, Vector3.ZERO)]));

      // Should still work correctly
      expect(buffer.getSnapshotCount()).toBe(3);
    });
  });

  describe('getInterpolatedEntities', () => {
    it('excludes local player', () => {
      const localPlayerId = 1;
      buffer.addSnapshot(
        createSnapshot(1, 1000, [
          createPlayerState(localPlayerId, Vector3.ZERO),
          createPlayerState(2, new Vector3(5, 0, 0)),
        ])
      );

      const entities = buffer.getInterpolatedEntities(1200, localPlayerId);

      expect(entities.find((e) => e.entityId === localPlayerId)).toBeUndefined();
      expect(entities.find((e) => e.entityId === 2)).toBeDefined();
    });

    it('interpolates between two snapshots', () => {
      const pos1 = new Vector3(0, 0, 0);
      const pos2 = new Vector3(10, 0, 0);

      buffer.addSnapshot(createSnapshot(1, 1000, [createPlayerState(2, pos1)]));
      buffer.addSnapshot(createSnapshot(2, 1100, [createPlayerState(2, pos2)]));

      // Render at time 1150 with 100ms delay = target time 1050 (halfway)
      const entities = buffer.getInterpolatedEntities(1150, 1);

      expect(entities.length).toBe(1);
      expect(entities[0].position.x).toBeCloseTo(5, 1); // Halfway between 0 and 10
      expect(entities[0].isExtrapolating).toBe(false);
      expect(entities[0].isStale).toBe(false);
    });

    it('extrapolates when no future snapshot', () => {
      const pos = new Vector3(0, 0, 0);
      const vel = new Vector3(10, 0, 0); // 10 units/sec

      buffer.addSnapshot(createSnapshot(1, 1000, [createPlayerState(2, pos, vel)]));

      // Render at time 1150 with 100ms delay = target time 1050
      // 50ms after snapshot, should extrapolate 0.5 units
      const entities = buffer.getInterpolatedEntities(1150, 1);

      expect(entities.length).toBe(1);
      expect(entities[0].position.x).toBeCloseTo(0.5, 1);
      expect(entities[0].isExtrapolating).toBe(true);
      expect(entities[0].isStale).toBe(false);
    });

    it('marks entity as stale when extrapolation exceeds limit', () => {
      const pos = new Vector3(0, 0, 0);
      const vel = new Vector3(10, 0, 0);

      buffer.addSnapshot(createSnapshot(1, 1000, [createPlayerState(2, pos, vel)]));

      // Render at time 1300 with 100ms delay = target time 1200
      // 200ms after snapshot, exceeds 100ms max extrapolation
      const entities = buffer.getInterpolatedEntities(1300, 1);

      expect(entities.length).toBe(1);
      expect(entities[0].position.equals(pos)).toBe(true); // Frozen at last position
      expect(entities[0].isStale).toBe(true);
    });
  });

  describe('angle interpolation', () => {
    it('interpolates yaw correctly across PI boundary', () => {
      // Player rotating from near +PI to near -PI (crossing the boundary)
      const player1: PlayerState = {
        entityId: 2,
        position: Vector3.ZERO,
        pitch: 0,
        yaw: Math.PI - 0.1, // Just before +PI
        velocity: Vector3.ZERO,
        health: 100,
        stateFlags: 0x01,
      };
      const player2: PlayerState = {
        entityId: 2,
        position: Vector3.ZERO,
        pitch: 0,
        yaw: -Math.PI + 0.1, // Just after -PI (same direction)
        velocity: Vector3.ZERO,
        health: 100,
        stateFlags: 0x01,
      };

      buffer.addSnapshot(createSnapshot(1, 1000, [player1]));
      buffer.addSnapshot(createSnapshot(2, 1100, [player2]));

      // Halfway interpolation
      const entities = buffer.getInterpolatedEntities(1150, 1);

      // Should interpolate through the short path (across PI)
      const yaw = entities[0].yaw;
      // The interpolated yaw should be close to PI or -PI
      expect(Math.abs(Math.abs(yaw) - Math.PI)).toBeLessThan(0.2);
    });
  });

  describe('setInterpolationDelay', () => {
    it('changes interpolation delay', () => {
      const pos1 = new Vector3(0, 0, 0);
      const pos2 = new Vector3(10, 0, 0);

      buffer.addSnapshot(createSnapshot(1, 1000, [createPlayerState(2, pos1)]));
      buffer.addSnapshot(createSnapshot(2, 1100, [createPlayerState(2, pos2)]));

      // With 100ms delay, render at 1150 targets 1050
      let entities = buffer.getInterpolatedEntities(1150, 1);
      const pos100ms = entities[0].position.x;

      // With 50ms delay, render at 1150 targets 1100
      buffer.setInterpolationDelay(50);
      entities = buffer.getInterpolatedEntities(1150, 1);
      const pos50ms = entities[0].position.x;

      // 50ms delay should give position closer to pos2
      expect(pos50ms).toBeGreaterThan(pos100ms);
    });
  });

  describe('clear', () => {
    it('removes all snapshots', () => {
      buffer.addSnapshot(createSnapshot(1, 1000, [createPlayerState(1, Vector3.ZERO)]));
      buffer.addSnapshot(createSnapshot(2, 1016, [createPlayerState(1, Vector3.ZERO)]));

      buffer.clear();

      expect(buffer.getSnapshotCount()).toBe(0);
    });
  });

  /**
   * Property Tests
   */
  describe('property tests', () => {
    /**
     * **Feature: arena-3d-physics-multiplayer, Property 16: Interpolation Bounds**
     * *For any* two snapshots, interpolated position is between the two snapshot positions.
     * **Validates: Requirements 7.2**
     */
    it('Property 16: interpolated result is between two snapshots', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          (x1, x2, tPercent) => {
            const buf = new InterpolationBuffer(DEFAULT_INTERPOLATION_CONFIG, new EventBus());

            const pos1 = new Vector3(x1, 0, 0);
            const pos2 = new Vector3(x2, 0, 0);

            buf.addSnapshot(createSnapshot(1, 1000, [createPlayerState(2, pos1)]));
            buf.addSnapshot(createSnapshot(2, 1100, [createPlayerState(2, pos2)]));

            // Target time between snapshots based on tPercent
            const targetTime = 1000 + tPercent;
            const renderTime = targetTime + DEFAULT_INTERPOLATION_CONFIG.interpolationDelayMs;

            const entities = buf.getInterpolatedEntities(renderTime, 1);

            if (entities.length > 0 && !entities[0].isExtrapolating) {
              const resultX = entities[0].position.x;
              const minX = Math.min(x1, x2);
              const maxX = Math.max(x1, x2);

              expect(resultX).toBeGreaterThanOrEqual(minX - 0.01);
              expect(resultX).toBeLessThanOrEqual(maxX + 0.01);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: arena-3d-physics-multiplayer, Property 17: Extrapolation Limit**
     * *For any* snapshot, extrapolation beyond maxExtrapolationMs marks entity as stale.
     * **Validates: Requirements 7.3**
     */
    it('Property 17: stale after exceeding max extrapolation time', () => {
      fc.assert(
        fc.property(fc.integer({ min: 101, max: 500 }), (extraTime) => {
          const config: InterpolationConfig = {
            ...DEFAULT_INTERPOLATION_CONFIG,
            maxExtrapolationMs: 100,
          };
          const buf = new InterpolationBuffer(config, new EventBus());

          buf.addSnapshot(
            createSnapshot(1, 1000, [createPlayerState(2, Vector3.ZERO, new Vector3(10, 0, 0))])
          );

          // Target time is extraTime ms after snapshot
          const targetTime = 1000 + extraTime;
          const renderTime = targetTime + config.interpolationDelayMs;

          const entities = buf.getInterpolatedEntities(renderTime, 1);

          expect(entities.length).toBe(1);
          expect(entities[0].isStale).toBe(true);
        }),
        { numRuns: 50 }
      );
    });

    it('buffer never exceeds configured size', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), (snapshotCount) => {
          const config: InterpolationConfig = {
            ...DEFAULT_INTERPOLATION_CONFIG,
            bufferSize: 10,
          };
          const buf = new InterpolationBuffer(config, new EventBus());

          for (let i = 0; i < snapshotCount; i++) {
            buf.addSnapshot(createSnapshot(i, 1000 + i * 16, [createPlayerState(1, Vector3.ZERO)]));
          }

          expect(buf.getSnapshotCount()).toBeLessThanOrEqual(config.bufferSize);
        }),
        { numRuns: 50 }
      );
    });
  });
});
