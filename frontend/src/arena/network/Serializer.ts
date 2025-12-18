/**
 * Binary Serializer for Arena Multiplayer
 *
 * Layer 2: Networking - Binary serialization protocol for network packets.
 * Provides efficient binary encoding/decoding for input packets and state snapshots.
 */

import { Vector3 } from '../math/Vector3';
import type { Result } from '../core/Result';
import { Ok, Err } from '../core/Result';

/**
 * Message type identifiers for network packets
 */
export const MessageType = {
  INPUT: 0x01,
  STATE_SNAPSHOT: 0x02,
  STATE_DELTA: 0x03,
  CLOCK_SYNC_REQUEST: 0x04,
  CLOCK_SYNC_RESPONSE: 0x05,
  INPUT_ACK: 0x06,
  FULL_STATE_REQUEST: 0x07,
  PLAYER_EVENT: 0x08,
  MATCH_EVENT: 0x09,
  KEEPALIVE: 0x0a,
} as const;

/**
 * Input packet sent from client to server
 * Binary format: 23 bytes total
 */
export interface InputPacket {
  readonly sequenceNumber: number;
  readonly tickNumber: number;
  readonly movementX: number; // -1 to 1
  readonly movementY: number; // -1 to 1
  readonly lookDeltaX: number; // -32768 to 32767
  readonly lookDeltaY: number; // -32768 to 32767
  readonly buttons: number; // bitfield
  readonly clientTimestamp: number;
}

/**
 * Button bitfield constants
 */
export const ButtonFlags = {
  JUMP: 0x01,
  FIRE: 0x02,
  RELOAD: 0x04,
  CROUCH: 0x08,
} as const;

/**
 * Individual player state within a snapshot
 */
export interface PlayerState {
  readonly entityId: number;
  readonly position: Vector3;
  readonly pitch: number;
  readonly yaw: number;
  readonly velocity: Vector3;
  readonly health: number;
  readonly stateFlags: number; // grounded, invulnerable, etc.
}


/**
 * Player state flags bitfield
 */
export const StateFlags = {
  GROUNDED: 0x01,
  INVULNERABLE: 0x02,
  DEAD: 0x04,
  RESPAWNING: 0x08,
} as const;

/**
 * Complete game state snapshot sent from server to clients
 */
export interface StateSnapshot {
  readonly tickNumber: number;
  readonly serverTimestamp: number;
  readonly players: PlayerState[];
  readonly matchState: number;
  readonly scores: Map<number, number>;
}

/**
 * Serializer interface for network packets
 */
export interface ISerializer {
  serializeInput(input: InputPacket): ArrayBuffer;
  deserializeInput(buffer: ArrayBuffer): Result<InputPacket, string>;
  serializeSnapshot(snapshot: StateSnapshot): ArrayBuffer;
  deserializeSnapshot(buffer: ArrayBuffer): Result<StateSnapshot, string>;
}

/**
 * Binary serializer implementation
 *
 * Input packet format (23 bytes):
 * - type: 1 byte
 * - sequenceNumber: 4 bytes (uint32)
 * - tickNumber: 4 bytes (uint32)
 * - movementX: 1 byte (int8, scaled by 127)
 * - movementY: 1 byte (int8, scaled by 127)
 * - lookDeltaX: 2 bytes (int16)
 * - lookDeltaY: 2 bytes (int16)
 * - buttons: 1 byte (uint8)
 * - clientTimestamp: 8 bytes (float64)
 *
 * Snapshot format (variable length):
 * - type: 1 byte
 * - tickNumber: 4 bytes (uint32)
 * - serverTimestamp: 8 bytes (float64)
 * - matchState: 1 byte (uint8)
 * - playerCount: 1 byte (uint8)
 * - players: 36 bytes each
 * - scoreCount: 1 byte (uint8)
 * - scores: 6 bytes each (playerId: uint16, score: uint32)
 */
export class BinarySerializer implements ISerializer {
  /**
   * Serialize an input packet to binary format
   */
  serializeInput(input: InputPacket): ArrayBuffer {
    const buffer = new ArrayBuffer(24);
    const view = new DataView(buffer);
    let offset = 0;

    view.setUint8(offset++, MessageType.INPUT);
    view.setUint32(offset, input.sequenceNumber, true);
    offset += 4;
    view.setUint32(offset, input.tickNumber, true);
    offset += 4;
    view.setInt8(offset++, Math.round(clamp(input.movementX, -1, 1) * 127));
    view.setInt8(offset++, Math.round(clamp(input.movementY, -1, 1) * 127));
    view.setInt16(offset, clamp(Math.round(input.lookDeltaX), -32768, 32767), true);
    offset += 2;
    view.setInt16(offset, clamp(Math.round(input.lookDeltaY), -32768, 32767), true);
    offset += 2;
    view.setUint8(offset++, input.buttons & 0xff);
    view.setFloat64(offset, input.clientTimestamp, true);

    return buffer;
  }

  /**
   * Deserialize an input packet from binary format
   */
  deserializeInput(buffer: ArrayBuffer): Result<InputPacket, string> {
    if (buffer.byteLength < 24) {
      return Err(`Input packet too small: expected 24 bytes, got ${buffer.byteLength}`);
    }

    const view = new DataView(buffer);
    let offset = 0;

    const type = view.getUint8(offset++);
    if (type !== MessageType.INPUT) {
      return Err(`Expected INPUT message type (${MessageType.INPUT}), got ${type}`);
    }

    const sequenceNumber = view.getUint32(offset, true);
    offset += 4;
    const tickNumber = view.getUint32(offset, true);
    offset += 4;
    const movementX = view.getInt8(offset++) / 127;
    const movementY = view.getInt8(offset++) / 127;
    const lookDeltaX = view.getInt16(offset, true);
    offset += 2;
    const lookDeltaY = view.getInt16(offset, true);
    offset += 2;
    const buttons = view.getUint8(offset++);
    const clientTimestamp = view.getFloat64(offset, true);

    return Ok({
      sequenceNumber,
      tickNumber,
      movementX,
      movementY,
      lookDeltaX,
      lookDeltaY,
      buttons,
      clientTimestamp,
    });
  }


  /**
   * Serialize a state snapshot to binary format
   */
  serializeSnapshot(snapshot: StateSnapshot): ArrayBuffer {
    // Header: type(1) + tick(4) + timestamp(8) + matchState(1) + playerCount(1) = 15
    // Per player: entityId(2) + pos(12) + pitch(4) + yaw(4) + vel(12) + health(1) + flags(1) = 36
    // Scores: count(1) + (playerId(2) + score(4)) * count
    const playerCount = snapshot.players.length;
    const scoreCount = snapshot.scores.size;
    const size = 15 + playerCount * 36 + 1 + scoreCount * 6;

    const buffer = new ArrayBuffer(size);
    const view = new DataView(buffer);
    let offset = 0;

    // Header
    view.setUint8(offset++, MessageType.STATE_SNAPSHOT);
    view.setUint32(offset, snapshot.tickNumber, true);
    offset += 4;
    view.setFloat64(offset, snapshot.serverTimestamp, true);
    offset += 8;
    view.setUint8(offset++, snapshot.matchState);
    view.setUint8(offset++, playerCount);

    // Players
    for (const player of snapshot.players) {
      view.setUint16(offset, player.entityId, true);
      offset += 2;
      view.setFloat32(offset, player.position.x, true);
      offset += 4;
      view.setFloat32(offset, player.position.y, true);
      offset += 4;
      view.setFloat32(offset, player.position.z, true);
      offset += 4;
      view.setFloat32(offset, player.pitch, true);
      offset += 4;
      view.setFloat32(offset, player.yaw, true);
      offset += 4;
      view.setFloat32(offset, player.velocity.x, true);
      offset += 4;
      view.setFloat32(offset, player.velocity.y, true);
      offset += 4;
      view.setFloat32(offset, player.velocity.z, true);
      offset += 4;
      view.setUint8(offset++, player.health);
      view.setUint8(offset++, player.stateFlags);
    }

    // Scores
    view.setUint8(offset++, scoreCount);
    snapshot.scores.forEach((score, playerId) => {
      view.setUint16(offset, playerId, true);
      offset += 2;
      view.setUint32(offset, score, true);
      offset += 4;
    });

    return buffer;
  }

  /**
   * Deserialize a state snapshot from binary format
   */
  deserializeSnapshot(buffer: ArrayBuffer): Result<StateSnapshot, string> {
    if (buffer.byteLength < 15) {
      return Err(`Snapshot packet too small: expected at least 15 bytes, got ${buffer.byteLength}`);
    }

    const view = new DataView(buffer);
    let offset = 0;

    const type = view.getUint8(offset++);
    if (type !== MessageType.STATE_SNAPSHOT) {
      return Err(`Expected STATE_SNAPSHOT message type (${MessageType.STATE_SNAPSHOT}), got ${type}`);
    }

    const tickNumber = view.getUint32(offset, true);
    offset += 4;
    const serverTimestamp = view.getFloat64(offset, true);
    offset += 8;
    const matchState = view.getUint8(offset++);
    const playerCount = view.getUint8(offset++);

    // Validate buffer size for players
    const expectedMinSize = 15 + playerCount * 36 + 1;
    if (buffer.byteLength < expectedMinSize) {
      return Err(
        `Snapshot packet too small for ${playerCount} players: expected at least ${expectedMinSize} bytes, got ${buffer.byteLength}`
      );
    }

    const players: PlayerState[] = [];
    for (let i = 0; i < playerCount; i++) {
      const entityId = view.getUint16(offset, true);
      offset += 2;
      const px = view.getFloat32(offset, true);
      offset += 4;
      const py = view.getFloat32(offset, true);
      offset += 4;
      const pz = view.getFloat32(offset, true);
      offset += 4;
      const pitch = view.getFloat32(offset, true);
      offset += 4;
      const yaw = view.getFloat32(offset, true);
      offset += 4;
      const vx = view.getFloat32(offset, true);
      offset += 4;
      const vy = view.getFloat32(offset, true);
      offset += 4;
      const vz = view.getFloat32(offset, true);
      offset += 4;
      const health = view.getUint8(offset++);
      const stateFlags = view.getUint8(offset++);

      players.push({
        entityId,
        position: new Vector3(px, py, pz),
        pitch,
        yaw,
        velocity: new Vector3(vx, vy, vz),
        health,
        stateFlags,
      });
    }

    const scoreCount = view.getUint8(offset++);
    const scores = new Map<number, number>();
    for (let i = 0; i < scoreCount; i++) {
      const playerId = view.getUint16(offset, true);
      offset += 2;
      const score = view.getUint32(offset, true);
      offset += 4;
      scores.set(playerId, score);
    }

    return Ok({ tickNumber, serverTimestamp, players, matchState, scores });
  }
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
