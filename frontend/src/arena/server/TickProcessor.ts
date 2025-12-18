/**
 * Tick Processor
 *
 * Layer 5: Server Orchestration - Processes game state each tick.
 * Integrates all game systems: Physics, Collision, Combat, Match, Spawn, AntiCheat, LagCompensation.
 */

import type { IEventBus } from '../core/EventBus';
import { isOk } from '../core/Result';
import { Vector3 } from '../math/Vector3';
import { Capsule } from '../physics/Capsule';
import type { IPhysics3D, PlayerPhysicsState, MovementInput } from '../physics/Physics3D';
import type { ICombatSystem, FireCommand } from '../game/CombatSystem';
import type { IMatchStateMachine } from '../game/MatchStateMachine';
import type { ISpawnSystem } from '../game/SpawnSystem';
import type { IAntiCheat, InputValidationData } from '../game/AntiCheat';
import type { ILagCompensation, WorldSnapshot } from '../game/LagCompensation';
import type { InputPacket, StateSnapshot, PlayerState } from '../network/Serializer';

/**
 * Server-side player state
 */
export interface PlayerServerState {
  playerId: number;
  physics: PlayerPhysicsState;
  pitch: number;
  yaw: number;
  health: number;
  lastProcessedSequence: number;
}

/**
 * Tick processor interface
 */
export interface ITickProcessor {
  /** Add a new player to the game */
  addPlayer(playerId: number, spawnPosition: Vector3): void;
  /** Remove a player from the game */
  removePlayer(playerId: number): void;
  /** Queue an input packet for processing */
  queueInput(playerId: number, input: InputPacket): void;
  /** Process a single tick, returns state snapshot */
  processTick(tickNumber: number, deltaTime: number, currentTime: number): StateSnapshot;
  /** Get player state by ID */
  getPlayerState(playerId: number): PlayerServerState | undefined;
  /** Get all player IDs */
  getPlayerIds(): number[];
}

/**
 * Maximum inputs to queue per player
 */
const MAX_INPUT_QUEUE_SIZE = 32;

/**
 * Look sensitivity for mouse input
 */
const LOOK_SENSITIVITY = 0.002;

/**
 * Button flags for input
 */
const BUTTON_JUMP = 0x01;
const BUTTON_FIRE = 0x02;

/**
 * Tick processor implementation
 *
 * Processes inputs in sequence order, applies physics, handles combat,
 * and manages match state transitions.
 */
export class TickProcessor implements ITickProcessor {
  private players: Map<number, PlayerServerState> = new Map();
  private inputQueues: Map<number, InputPacket[]> = new Map();
  private readonly physics: IPhysics3D;
  private readonly combatSystem: ICombatSystem;
  private readonly matchStateMachine: IMatchStateMachine;
  private readonly spawnSystem: ISpawnSystem;
  private readonly antiCheat: IAntiCheat;
  private readonly lagCompensation: ILagCompensation;

  constructor(
    physics: IPhysics3D,
    combatSystem: ICombatSystem,
    matchStateMachine: IMatchStateMachine,
    spawnSystem: ISpawnSystem,
    antiCheat: IAntiCheat,
    lagCompensation: ILagCompensation,
    _eventBus: IEventBus
  ) {
    this.physics = physics;
    this.combatSystem = combatSystem;
    this.matchStateMachine = matchStateMachine;
    this.spawnSystem = spawnSystem;
    this.antiCheat = antiCheat;
    this.lagCompensation = lagCompensation;
  }

  addPlayer(playerId: number, spawnPosition: Vector3): void {
    this.players.set(playerId, {
      playerId,
      physics: {
        position: spawnPosition,
        velocity: Vector3.ZERO,
        isGrounded: true,
        lastGroundedTime: 0,
        landingPenaltyEndTime: 0,
      },
      pitch: 0,
      yaw: 0,
      health: 100,
      lastProcessedSequence: 0,
    });
    this.inputQueues.set(playerId, []);
    this.combatSystem.initializePlayer(playerId);
    this.matchStateMachine.playerConnected(playerId);
  }

  removePlayer(playerId: number): void {
    this.players.delete(playerId);
    this.inputQueues.delete(playerId);
    this.combatSystem.removePlayer(playerId);
    this.antiCheat.removePlayer(playerId);
    this.matchStateMachine.playerDisconnected(playerId);
  }

  queueInput(playerId: number, input: InputPacket): void {
    const queue = this.inputQueues.get(playerId);
    if (!queue) return;

    // Insert sorted by sequence number (Property 31: Input Sequence Ordering)
    const insertIndex = queue.findIndex((i) => i.sequenceNumber > input.sequenceNumber);
    if (insertIndex === -1) {
      queue.push(input);
    } else {
      queue.splice(insertIndex, 0, input);
    }

    // Limit queue size to prevent memory issues
    while (queue.length > MAX_INPUT_QUEUE_SIZE) {
      queue.shift();
    }
  }

  processTick(tickNumber: number, deltaTime: number, currentTime: number): StateSnapshot {
    // Update match state
    this.matchStateMachine.update(currentTime);

    // Only process inputs during PLAYING state
    if (this.matchStateMachine.getState() === 'playing') {
      // Process inputs for each player
      this.players.forEach((playerState, playerId) => {
        this.processPlayerInputs(playerId, playerState, deltaTime, currentTime);
      });

      // Process combat (respawns)
      const readyToRespawn = this.combatSystem.update(currentTime);
      for (const playerId of readyToRespawn) {
        this.respawnPlayer(playerId, currentTime);
      }
    }

    // Record snapshot for lag compensation
    const worldSnapshot = this.createWorldSnapshot(tickNumber, currentTime);
    this.lagCompensation.recordSnapshot(worldSnapshot);
    this.lagCompensation.pruneOldSnapshots(currentTime);

    // Create and return state snapshot
    return this.createSnapshot(tickNumber, currentTime);
  }

  getPlayerState(playerId: number): PlayerServerState | undefined {
    const state = this.players.get(playerId);
    if (!state) return undefined;
    // Return a copy to prevent external mutation
    return { ...state, physics: { ...state.physics } };
  }

  getPlayerIds(): number[] {
    return Array.from(this.players.keys());
  }

  /**
   * Process all queued inputs for a player
   */
  private processPlayerInputs(
    playerId: number,
    playerState: PlayerServerState,
    deltaTime: number,
    currentTime: number
  ): void {
    const queue = this.inputQueues.get(playerId);
    if (!queue || queue.length === 0) return;

    // Process all queued inputs in sequence order
    while (queue.length > 0 && queue[0].sequenceNumber <= playerState.lastProcessedSequence + 1) {
      const input = queue.shift()!;

      // Skip already processed inputs
      if (input.sequenceNumber <= playerState.lastProcessedSequence) {
        continue;
      }

      // Store previous position for anti-cheat validation
      const previousPosition = playerState.physics.position;

      // Apply look input
      playerState.yaw += input.lookDeltaX * LOOK_SENSITIVITY;
      playerState.pitch = Math.max(
        -Math.PI / 2 * 0.98,
        Math.min(Math.PI / 2 * 0.98, playerState.pitch + input.lookDeltaY * LOOK_SENSITIVITY)
      );

      // Normalize yaw to [-π, π]
      while (playerState.yaw > Math.PI) playerState.yaw -= 2 * Math.PI;
      while (playerState.yaw < -Math.PI) playerState.yaw += 2 * Math.PI;

      // Apply movement
      const movementInput: MovementInput = {
        forward: input.movementY,
        right: input.movementX,
        jump: (input.buttons & BUTTON_JUMP) !== 0,
        yaw: playerState.yaw,
      };

      const newPhysics = this.physics.step(
        playerState.physics,
        movementInput,
        deltaTime,
        currentTime,
        playerId
      );

      // Validate with anti-cheat
      const validationData: InputValidationData = {
        buttons: input.buttons,
        clientTimestamp: input.clientTimestamp,
      };

      const validation = this.antiCheat.validateInput(
        playerId,
        validationData,
        previousPosition,
        newPhysics.position,
        playerState.physics.isGrounded,
        currentTime,
        deltaTime
      );

      if (isOk(validation)) {
        playerState.physics = newPhysics;
      }
      // If validation fails, keep old position (server authority)

      // Process fire command
      if ((input.buttons & BUTTON_FIRE) !== 0) {
        this.processFireCommand(playerId, playerState, input.clientTimestamp, currentTime);
      }

      playerState.lastProcessedSequence = input.sequenceNumber;
    }
  }

  /**
   * Process a fire command from a player
   */
  private processFireCommand(
    playerId: number,
    playerState: PlayerServerState,
    clientTimestamp: number,
    currentTime: number
  ): void {
    // Calculate eye position
    const eyePos = new Vector3(
      playerState.physics.position.x,
      playerState.physics.position.y + 1.6, // Eye height
      playerState.physics.position.z
    );

    // Calculate fire direction from pitch and yaw
    const direction = new Vector3(
      -Math.sin(playerState.yaw) * Math.cos(playerState.pitch),
      Math.sin(playerState.pitch),
      -Math.cos(playerState.yaw) * Math.cos(playerState.pitch)
    ).normalize();

    // Get player capsules at client's perceived time (lag compensation)
    const capsulesResult = this.lagCompensation.getPlayerCapsulesAtTime(clientTimestamp);
    const capsules = isOk(capsulesResult) ? capsulesResult.value : this.getCurrentCapsules();

    const fireCommand: FireCommand = {
      playerId,
      origin: eyePos,
      direction,
      clientTimestamp,
    };

    const hitResult = this.combatSystem.processFire(fireCommand, capsules, currentTime);

    if (isOk(hitResult) && hitResult.value) {
      const hit = hitResult.value;
      this.combatSystem.applyDamage(hit.targetId, playerId, hit.damage, hit.hitPosition, currentTime);

      // Check for kill
      const victimState = this.combatSystem.getPlayerState(hit.targetId);
      if (victimState && victimState.isDead) {
        this.matchStateMachine.recordKill(playerId, hit.targetId);
      }
    }
  }

  /**
   * Respawn a player at an optimal spawn point
   */
  private respawnPlayer(playerId: number, currentTime: number): void {
    const playerState = this.players.get(playerId);
    if (!playerState) return;

    // Get positions of other players for spawn selection
    const otherPositions = Array.from(this.players.values())
      .filter((p) => p.playerId !== playerId)
      .map((p) => p.physics.position);

    this.spawnSystem.setCurrentTime(currentTime);
    const spawnPoint = this.spawnSystem.selectSpawnPoint(playerId, otherPositions);

    // Reset player state
    playerState.physics.position = spawnPoint.position;
    playerState.physics.velocity = Vector3.ZERO;
    playerState.physics.isGrounded = true;
    playerState.yaw = Math.atan2(-spawnPoint.lookDirection.x, -spawnPoint.lookDirection.z);
    playerState.pitch = 0;

    this.combatSystem.respawnPlayer(playerId, currentTime);
  }

  /**
   * Get current capsules for all players
   */
  private getCurrentCapsules(): Map<number, Capsule> {
    const capsules = new Map<number, Capsule>();
    this.players.forEach((state, playerId) => {
      capsules.set(playerId, new Capsule(state.physics.position));
    });
    return capsules;
  }

  /**
   * Create a world snapshot for lag compensation
   */
  private createWorldSnapshot(tickNumber: number, timestamp: number): WorldSnapshot {
    const playerPositions = new Map<number, Vector3>();
    const playerCapsules = new Map<number, Capsule>();

    this.players.forEach((state, playerId) => {
      playerPositions.set(playerId, state.physics.position);
      playerCapsules.set(playerId, new Capsule(state.physics.position));
    });

    return { tickNumber, timestamp, playerPositions, playerCapsules };
  }

  /**
   * Create a state snapshot for network broadcast
   */
  private createSnapshot(tickNumber: number, timestamp: number): StateSnapshot {
    const players: PlayerState[] = [];

    this.players.forEach((state, playerId) => {
      const combatState = this.combatSystem.getPlayerState(playerId);
      let stateFlags = 0;
      if (state.physics.isGrounded) stateFlags |= 0x01;
      if (combatState?.isDead) stateFlags |= 0x02;
      if (combatState && timestamp < combatState.invulnerableUntil) stateFlags |= 0x04;

      players.push({
        entityId: playerId,
        position: state.physics.position,
        pitch: state.pitch,
        yaw: state.yaw,
        velocity: state.physics.velocity,
        health: combatState?.health ?? 100,
        stateFlags,
      });
    });

    // Get match state as number
    const matchStateMap: Record<string, number> = {
      waiting: 0,
      countdown: 1,
      playing: 2,
      ended: 3,
      cleanup: 4,
    };
    const matchState = matchStateMap[this.matchStateMachine.getState()] ?? 0;

    return {
      tickNumber,
      serverTimestamp: timestamp,
      players,
      matchState,
      scores: this.matchStateMachine.getScores(),
    };
  }
}
