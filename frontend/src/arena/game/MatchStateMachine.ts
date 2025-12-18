/**
 * Match State Machine
 *
 * Layer 3: Game Logic - Manages match lifecycle and state transitions.
 * States: waiting → countdown → playing → ended → cleanup
 */

import type { IEventBus } from '../core/EventBus';
import type { MatchState } from '../core/GameEvents';

/**
 * Match configuration
 */
export interface MatchConfig {
  /** Duration of countdown before match starts (ms) */
  readonly countdownDurationMs: number;
  /** Duration to show results after match ends (ms) */
  readonly resultsDurationMs: number;
  /** Number of kills required to win */
  readonly killsToWin: number;
  /** Number of players required to start */
  readonly requiredPlayers: number;
}

/**
 * Default match configuration
 */
export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  countdownDurationMs: 3000,
  resultsDurationMs: 5000,
  killsToWin: 10,
  requiredPlayers: 2,
};

/**
 * Match state machine interface
 */
export interface IMatchStateMachine {
  /** Get current match state */
  getState(): MatchState;
  /** Get remaining countdown time in ms */
  getCountdownRemaining(): number;
  /** Get current scores for all players */
  getScores(): Map<number, number>;
  /** Get winner ID if match has ended */
  getWinnerId(): number | null;
  /** Get connected player IDs */
  getConnectedPlayers(): Set<number>;

  /** Handle player connection */
  playerConnected(playerId: number): void;
  /** Handle player disconnection */
  playerDisconnected(playerId: number): void;
  /** Record a kill */
  recordKill(killerId: number, victimId: number): void;
  /** Update state machine with current time */
  update(currentTime: number): void;
  /** Reset match to initial state */
  reset(): void;
}


/**
 * Match state machine implementation
 *
 * State transitions:
 * - waiting: Waiting for required players to connect
 * - countdown: All players connected, counting down to start
 * - playing: Match in progress
 * - ended: Match finished, showing results
 * - cleanup: Terminal state, match should be destroyed
 */
export class MatchStateMachine implements IMatchStateMachine {
  private state: MatchState = 'waiting';
  private connectedPlayers: Set<number> = new Set();
  private scores: Map<number, number> = new Map();
  private winnerId: number | null = null;
  private stateStartTime: number = 0;
  private currentTime: number = 0;
  private readonly config: MatchConfig;
  private readonly eventBus?: IEventBus;

  constructor(config: MatchConfig = DEFAULT_MATCH_CONFIG, eventBus?: IEventBus) {
    this.config = config;
    this.eventBus = eventBus;
  }

  getState(): MatchState {
    return this.state;
  }

  getCountdownRemaining(): number {
    if (this.state !== 'countdown') return 0;
    const elapsed = this.currentTime - this.stateStartTime;
    return Math.max(0, this.config.countdownDurationMs - elapsed);
  }

  getScores(): Map<number, number> {
    return new Map(this.scores);
  }

  getWinnerId(): number | null {
    return this.winnerId;
  }

  getConnectedPlayers(): Set<number> {
    return new Set(this.connectedPlayers);
  }

  playerConnected(playerId: number): void {
    this.connectedPlayers.add(playerId);
    if (!this.scores.has(playerId)) {
      this.scores.set(playerId, 0);
    }
    this.checkTransitions();
  }

  playerDisconnected(playerId: number): void {
    this.connectedPlayers.delete(playerId);

    if (this.state === 'playing' && this.connectedPlayers.size < this.config.requiredPlayers) {
      // Award victory to remaining player
      const remainingPlayer = this.connectedPlayers.values().next().value;
      if (remainingPlayer !== undefined) {
        this.winnerId = remainingPlayer;
        this.transitionTo('ended');
      } else {
        // No players left, go to cleanup
        this.transitionTo('cleanup');
      }
    } else if (this.state === 'countdown' && this.connectedPlayers.size < this.config.requiredPlayers) {
      // Not enough players, go back to waiting
      this.transitionTo('waiting');
    }
  }

  recordKill(killerId: number, _victimId: number): void {
    if (this.state !== 'playing') return;

    const currentScore = this.scores.get(killerId) ?? 0;
    const newScore = currentScore + 1;
    this.scores.set(killerId, newScore);

    if (newScore >= this.config.killsToWin) {
      this.winnerId = killerId;
      this.transitionTo('ended');
    }
  }

  update(currentTime: number): void {
    this.currentTime = currentTime;
    this.checkTransitions();
  }

  reset(): void {
    this.state = 'waiting';
    this.connectedPlayers.clear();
    this.scores.clear();
    this.winnerId = null;
    this.stateStartTime = 0;
    this.currentTime = 0;
  }

  private checkTransitions(): void {
    switch (this.state) {
      case 'waiting':
        if (this.connectedPlayers.size >= this.config.requiredPlayers) {
          this.transitionTo('countdown');
        }
        break;

      case 'countdown':
        if (this.connectedPlayers.size < this.config.requiredPlayers) {
          this.transitionTo('waiting');
        } else if (this.currentTime - this.stateStartTime >= this.config.countdownDurationMs) {
          this.transitionTo('playing');
        }
        break;

      case 'playing':
        // Transitions handled by recordKill and playerDisconnected
        break;

      case 'ended':
        if (this.currentTime - this.stateStartTime >= this.config.resultsDurationMs) {
          this.transitionTo('cleanup');
        }
        break;

      case 'cleanup':
        // Terminal state - match should be destroyed
        break;
    }
  }

  private transitionTo(newState: MatchState): void {
    const previousState = this.state;
    this.state = newState;
    this.stateStartTime = this.currentTime;

    this.eventBus?.emit({
      type: 'match_state_changed',
      timestamp: this.currentTime,
      previousState,
      newState,
    });

    if (newState === 'playing') {
      this.eventBus?.emit({
        type: 'match_start',
        timestamp: this.currentTime,
        tickNumber: 0,
      });
    }

    if (newState === 'ended') {
      this.eventBus?.emit({
        type: 'match_end',
        timestamp: this.currentTime,
        winnerId: this.winnerId ?? -1,
        finalScores: this.getScores(),
      });
    }
  }
}
