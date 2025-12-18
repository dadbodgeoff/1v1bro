/**
 * Binary Serializer Tests
 *
 * Property-based and unit tests for network packet serialization.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  BinarySerializer,
  InputPacket,
  StateSnapshot,
  PlayerState,
  MessageType,
  ButtonFlags,
  StateFlags,
} from './Serializer';
import { Vector3 } from '../math/Vector3';
import { isOk, isErr } from '../core/Result';

describe('BinarySerializer', () => {
  const serializer = new BinarySerializer();

  describe('InputPacket Serialization', () => {
    // Property 10: Input Packet Round-Trip - serialize then deserialize preserves data
    it('Property 10: serialize then deserialize preserves input data', () => {
      fc.assert(
        fc.property(
          fc.record({
            sequenceNumber: fc.nat(0xffffffff),
            tickNumber: fc.nat(0xffffffff),
            movementX: fc.float({ min: -1, max: 1, noNaN: true }),
            movementY: fc.float({ min: -1, max: 1, noNaN: true }),
            lookDeltaX: fc.integer({ min: -32768, max: 32767 }),
            lookDeltaY: fc.integer({ min: -32768, max: 32767 }),
            buttons: fc.nat(255),
            clientTimestamp: fc.double({ min: 0, max: 1e12, noNaN: true }),
          }),
          (input: InputPacket) => {
            const buffer = serializer.serializeInput(input);
            const result = serializer.deserializeInput(buffer);

            expect(isOk(result)).toBe(true);
            if (!isOk(result)) return;

            const deserialized = result.value;

            // Sequence and tick numbers should be exact
            expect(deserialized.sequenceNumber).toBe(input.sequenceNumber);
            expect(deserialized.tickNumber).toBe(input.tickNumber);

            // Movement values are quantized to int8, so allow small error
            expect(deserialized.movementX).toBeCloseTo(input.movementX, 1);
            expect(deserialized.movementY).toBeCloseTo(input.movementY, 1);

            // Look deltas should be exact (int16)
            expect(deserialized.lookDeltaX).toBe(input.lookDeltaX);
            expect(deserialized.lookDeltaY).toBe(input.lookDeltaY);

            // Buttons should be exact
            expect(deserialized.buttons).toBe(input.buttons);

            // Timestamp should be exact (float64)
            expect(deserialized.clientTimestamp).toBe(input.clientTimestamp);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('serializes input packet to correct size', () => {
      const input: InputPacket = {
        sequenceNumber: 1,
        tickNumber: 100,
        movementX: 0.5,
        movementY: -0.5,
        lookDeltaX: 100,
        lookDeltaY: -50,
        buttons: ButtonFlags.JUMP | ButtonFlags.FIRE,
        clientTimestamp: Date.now(),
      };

      const buffer = serializer.serializeInput(input);
      expect(buffer.byteLength).toBe(24);
    });

    it('correctly encodes message type', () => {
      const input: InputPacket = {
        sequenceNumber: 0,
        tickNumber: 0,
        movementX: 0,
        movementY: 0,
        lookDeltaX: 0,
        lookDeltaY: 0,
        buttons: 0,
        clientTimestamp: 0,
      };

      const buffer = serializer.serializeInput(input);
      const view = new DataView(buffer);
      expect(view.getUint8(0)).toBe(MessageType.INPUT);
    });


    it('clamps movement values to valid range', () => {
      const input: InputPacket = {
        sequenceNumber: 1,
        tickNumber: 1,
        movementX: 2.0, // Out of range
        movementY: -2.0, // Out of range
        lookDeltaX: 0,
        lookDeltaY: 0,
        buttons: 0,
        clientTimestamp: 0,
      };

      const buffer = serializer.serializeInput(input);
      const result = serializer.deserializeInput(buffer);

      expect(isOk(result)).toBe(true);
      if (!isOk(result)) return;

      // Should be clamped to [-1, 1]
      expect(result.value.movementX).toBeCloseTo(1.0, 1);
      expect(result.value.movementY).toBeCloseTo(-1.0, 1);
    });

    it('preserves button flags correctly', () => {
      const testCases = [
        ButtonFlags.JUMP,
        ButtonFlags.FIRE,
        ButtonFlags.RELOAD,
        ButtonFlags.CROUCH,
        ButtonFlags.JUMP | ButtonFlags.FIRE,
        ButtonFlags.JUMP | ButtonFlags.FIRE | ButtonFlags.RELOAD | ButtonFlags.CROUCH,
        0,
        255,
      ];

      for (const buttons of testCases) {
        const input: InputPacket = {
          sequenceNumber: 1,
          tickNumber: 1,
          movementX: 0,
          movementY: 0,
          lookDeltaX: 0,
          lookDeltaY: 0,
          buttons,
          clientTimestamp: 0,
        };

        const buffer = serializer.serializeInput(input);
        const result = serializer.deserializeInput(buffer);

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value.buttons).toBe(buttons);
        }
      }
    });

    // Property 12: Invalid Data Rejection - malformed buffers return Err
    it('Property 12: rejects buffer that is too small', () => {
      const smallBuffer = new ArrayBuffer(10);
      const result = serializer.deserializeInput(smallBuffer);
      expect(isErr(result)).toBe(true);
    });

    it('rejects buffer with wrong message type', () => {
      const buffer = new ArrayBuffer(24);
      const view = new DataView(buffer);
      view.setUint8(0, MessageType.STATE_SNAPSHOT); // Wrong type

      const result = serializer.deserializeInput(buffer);
      expect(isErr(result)).toBe(true);
    });

    it('handles boundary values for sequence and tick numbers', () => {
      const input: InputPacket = {
        sequenceNumber: 0xffffffff, // Max uint32
        tickNumber: 0xffffffff,
        movementX: 0,
        movementY: 0,
        lookDeltaX: 0,
        lookDeltaY: 0,
        buttons: 0,
        clientTimestamp: 0,
      };

      const buffer = serializer.serializeInput(input);
      const result = serializer.deserializeInput(buffer);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.sequenceNumber).toBe(0xffffffff);
        expect(result.value.tickNumber).toBe(0xffffffff);
      }
    });

    it('handles boundary values for look deltas', () => {
      const testCases = [
        { lookDeltaX: -32768, lookDeltaY: -32768 },
        { lookDeltaX: 32767, lookDeltaY: 32767 },
        { lookDeltaX: 0, lookDeltaY: 0 },
      ];

      for (const { lookDeltaX, lookDeltaY } of testCases) {
        const input: InputPacket = {
          sequenceNumber: 1,
          tickNumber: 1,
          movementX: 0,
          movementY: 0,
          lookDeltaX,
          lookDeltaY,
          buttons: 0,
          clientTimestamp: 0,
        };

        const buffer = serializer.serializeInput(input);
        const result = serializer.deserializeInput(buffer);

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value.lookDeltaX).toBe(lookDeltaX);
          expect(result.value.lookDeltaY).toBe(lookDeltaY);
        }
      }
    });
  });


  describe('StateSnapshot Serialization', () => {
    // Property 11: State Snapshot Round-Trip - serialize then deserialize preserves data
    it('Property 11: serialize then deserialize preserves snapshot data', () => {
      const playerArb = fc.record({
        entityId: fc.nat(65535),
        position: fc.record({
          x: fc.float({ min: Math.fround(-1000), max: Math.fround(1000), noNaN: true }),
          y: fc.float({ min: Math.fround(-1000), max: Math.fround(1000), noNaN: true }),
          z: fc.float({ min: Math.fround(-1000), max: Math.fround(1000), noNaN: true }),
        }),
        pitch: fc.float({ min: Math.fround(-Math.PI), max: Math.fround(Math.PI), noNaN: true }),
        yaw: fc.float({ min: Math.fround(-Math.PI), max: Math.fround(Math.PI), noNaN: true }),
        velocity: fc.record({
          x: fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
          y: fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
          z: fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
        }),
        health: fc.nat(255),
        stateFlags: fc.nat(255),
      });

      const snapshotArb = fc.record({
        tickNumber: fc.nat(0xffffffff),
        serverTimestamp: fc.double({ min: 0, max: 1e12, noNaN: true }),
        players: fc.array(playerArb, { minLength: 0, maxLength: 10 }),
        matchState: fc.nat(255),
        scores: fc.array(fc.tuple(fc.nat(65535), fc.nat(0xffffffff)), { minLength: 0, maxLength: 10 }),
      });

      fc.assert(
        fc.property(snapshotArb, (rawSnapshot) => {
          const snapshot: StateSnapshot = {
            tickNumber: rawSnapshot.tickNumber,
            serverTimestamp: rawSnapshot.serverTimestamp,
            players: rawSnapshot.players.map((p) => ({
              entityId: p.entityId,
              position: new Vector3(p.position.x, p.position.y, p.position.z),
              pitch: p.pitch,
              yaw: p.yaw,
              velocity: new Vector3(p.velocity.x, p.velocity.y, p.velocity.z),
              health: p.health,
              stateFlags: p.stateFlags,
            })),
            matchState: rawSnapshot.matchState,
            scores: new Map(rawSnapshot.scores),
          };

          const buffer = serializer.serializeSnapshot(snapshot);
          const result = serializer.deserializeSnapshot(buffer);

          expect(isOk(result)).toBe(true);
          if (!isOk(result)) return;

          const deserialized = result.value;

          expect(deserialized.tickNumber).toBe(snapshot.tickNumber);
          expect(deserialized.serverTimestamp).toBe(snapshot.serverTimestamp);
          expect(deserialized.matchState).toBe(snapshot.matchState);
          expect(deserialized.players.length).toBe(snapshot.players.length);

          for (let i = 0; i < snapshot.players.length; i++) {
            const orig = snapshot.players[i];
            const deser = deserialized.players[i];

            expect(deser.entityId).toBe(orig.entityId);
            expect(deser.health).toBe(orig.health);
            expect(deser.stateFlags).toBe(orig.stateFlags);

            // Float32 precision for positions and velocities
            expect(deser.position.x).toBeCloseTo(orig.position.x, 4);
            expect(deser.position.y).toBeCloseTo(orig.position.y, 4);
            expect(deser.position.z).toBeCloseTo(orig.position.z, 4);
            expect(deser.velocity.x).toBeCloseTo(orig.velocity.x, 4);
            expect(deser.velocity.y).toBeCloseTo(orig.velocity.y, 4);
            expect(deser.velocity.z).toBeCloseTo(orig.velocity.z, 4);
            expect(deser.pitch).toBeCloseTo(orig.pitch, 4);
            expect(deser.yaw).toBeCloseTo(orig.yaw, 4);
          }

          // Check scores
          expect(deserialized.scores.size).toBe(snapshot.scores.size);
          snapshot.scores.forEach((score, playerId) => {
            expect(deserialized.scores.get(playerId)).toBe(score);
          });
        }),
        { numRuns: 50 }
      );
    });

    it('serializes empty player list correctly', () => {
      const snapshot: StateSnapshot = {
        tickNumber: 100,
        serverTimestamp: Date.now(),
        players: [],
        matchState: 0,
        scores: new Map(),
      };

      const buffer = serializer.serializeSnapshot(snapshot);
      const result = serializer.deserializeSnapshot(buffer);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.players.length).toBe(0);
        expect(result.value.scores.size).toBe(0);
      }
    });

    it('correctly encodes message type for snapshot', () => {
      const snapshot: StateSnapshot = {
        tickNumber: 0,
        serverTimestamp: 0,
        players: [],
        matchState: 0,
        scores: new Map(),
      };

      const buffer = serializer.serializeSnapshot(snapshot);
      const view = new DataView(buffer);
      expect(view.getUint8(0)).toBe(MessageType.STATE_SNAPSHOT);
    });


    it('preserves player state flags correctly', () => {
      const testFlags = [
        StateFlags.GROUNDED,
        StateFlags.INVULNERABLE,
        StateFlags.DEAD,
        StateFlags.RESPAWNING,
        StateFlags.GROUNDED | StateFlags.INVULNERABLE,
        0,
        255,
      ];

      for (const flags of testFlags) {
        const snapshot: StateSnapshot = {
          tickNumber: 1,
          serverTimestamp: 1000,
          players: [
            {
              entityId: 1,
              position: Vector3.ZERO,
              pitch: 0,
              yaw: 0,
              velocity: Vector3.ZERO,
              health: 100,
              stateFlags: flags,
            },
          ],
          matchState: 0,
          scores: new Map(),
        };

        const buffer = serializer.serializeSnapshot(snapshot);
        const result = serializer.deserializeSnapshot(buffer);

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value.players[0].stateFlags).toBe(flags);
        }
      }
    });

    it('rejects snapshot buffer that is too small', () => {
      const smallBuffer = new ArrayBuffer(10);
      const result = serializer.deserializeSnapshot(smallBuffer);
      expect(isErr(result)).toBe(true);
    });

    it('rejects snapshot with wrong message type', () => {
      const buffer = new ArrayBuffer(20);
      const view = new DataView(buffer);
      view.setUint8(0, MessageType.INPUT); // Wrong type

      const result = serializer.deserializeSnapshot(buffer);
      expect(isErr(result)).toBe(true);
    });

    it('rejects snapshot with insufficient data for declared player count', () => {
      // Create a buffer that claims to have 5 players but doesn't have enough data
      const buffer = new ArrayBuffer(20);
      const view = new DataView(buffer);
      view.setUint8(0, MessageType.STATE_SNAPSHOT);
      view.setUint32(1, 100, true); // tickNumber
      view.setFloat64(5, 1000, true); // serverTimestamp
      view.setUint8(13, 0); // matchState
      view.setUint8(14, 5); // playerCount = 5, but buffer is too small

      const result = serializer.deserializeSnapshot(buffer);
      expect(isErr(result)).toBe(true);
    });

    it('handles multiple players with scores', () => {
      const snapshot: StateSnapshot = {
        tickNumber: 500,
        serverTimestamp: 123456789,
        players: [
          {
            entityId: 1,
            position: new Vector3(10, 5, 20),
            pitch: 0.5,
            yaw: 1.2,
            velocity: new Vector3(1, 0, 2),
            health: 100,
            stateFlags: StateFlags.GROUNDED,
          },
          {
            entityId: 2,
            position: new Vector3(-10, 5, -20),
            pitch: -0.3,
            yaw: 2.5,
            velocity: new Vector3(-1, 0, -2),
            health: 75,
            stateFlags: StateFlags.GROUNDED | StateFlags.INVULNERABLE,
          },
        ],
        matchState: 2, // playing
        scores: new Map([
          [1, 5],
          [2, 3],
        ]),
      };

      const buffer = serializer.serializeSnapshot(snapshot);
      const result = serializer.deserializeSnapshot(buffer);

      expect(isOk(result)).toBe(true);
      if (!isOk(result)) return;

      const deser = result.value;
      expect(deser.players.length).toBe(2);
      expect(deser.scores.get(1)).toBe(5);
      expect(deser.scores.get(2)).toBe(3);
      expect(deser.matchState).toBe(2);
    });

    it('handles max player count (255)', () => {
      const players: PlayerState[] = [];
      for (let i = 0; i < 255; i++) {
        players.push({
          entityId: i,
          position: Vector3.ZERO,
          pitch: 0,
          yaw: 0,
          velocity: Vector3.ZERO,
          health: 100,
          stateFlags: 0,
        });
      }

      const snapshot: StateSnapshot = {
        tickNumber: 1,
        serverTimestamp: 1000,
        players,
        matchState: 0,
        scores: new Map(),
      };

      const buffer = serializer.serializeSnapshot(snapshot);
      const result = serializer.deserializeSnapshot(buffer);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.players.length).toBe(255);
      }
    });
  });
});
