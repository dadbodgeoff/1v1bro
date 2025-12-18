/**
 * Match State Machine Tests
 *
 * Property-based and unit tests for match lifecycle management.
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { MatchStateMachine, DEFAULT_MATCH_CONFIG, MatchConfig } from './MatchStateMachine';
import { EventBus } from '../core/EventBus';
import { MatchState } from '../core/GameEvents';

describe('MatchStateMachine', () => {
  describe('Initial State', () => {
    it('starts in waiting state', () => {
      const machine = new MatchStateMachine();
      expect(machine.getState()).toBe('waiting');
    });

    it('has no connected players initially', () => {
      const machine = new MatchStateMachine();
      expect(machine.getConnectedPlayers().size).toBe(0);
    });

    it('has no winner initially', () => {
      const machine = new MatchStateMachine();
      expect(machine.getWinnerId()).toBeNull();
    });

    it('has empty scores initially', () => {
      const machine = new MatchStateMachine();
      expect(machine.getScores().size).toBe(0);
    });
  });

  describe('State Transitions', () => {
    // Property 26: State Transition Validity - only valid transitions occur
    it('Property 26: only valid state transitions occur', () => {
      const validTransitions: Record<MatchState, MatchState[]> = {
        waiting: ['countdown'],
        countdown: ['waiting', 'playing'],
        playing: ['ended'],
        ended: ['cleanup'],
        cleanup: [],
      };

      fc.assert(
        fc.property(
          fc.array(
            fc.oneof(
              fc.constant('connect' as const),
              fc.constant('disconnect' as const),
              fc.constant('kill' as const),
              fc.constant('update' as const)
            ),
            { minLength: 1, maxLength: 50 }
          ),
          (actions) => {
            const machine = new MatchStateMachine({
              ...DEFAULT_MATCH_CONFIG,
              countdownDurationMs: 100,
              resultsDurationMs: 100,
            });

            let time = 0;
            let previousState = machine.getState();
            let playerIdCounter = 1;

            for (const action of actions) {
              switch (action) {
                case 'connect':
                  machine.playerConnected(playerIdCounter++);
                  break;
                case 'disconnect':
                  if (machine.getConnectedPlayers().size > 0) {
                    const playerId = machine.getConnectedPlayers().values().next().value;
                    machine.playerDisconnected(playerId);
                  }
                  break;
                case 'kill':
                  if (machine.getConnectedPlayers().size >= 2) {
                    const players = Array.from(machine.getConnectedPlayers());
                    machine.recordKill(players[0], players[1]);
                  }
                  break;
                case 'update':
                  time += 150;
                  machine.update(time);
                  break;
              }

              const currentState = machine.getState();
              if (currentState !== previousState) {
                // Verify transition is valid
                expect(validTransitions[previousState]).toContain(currentState);
                previousState = currentState;
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('transitions from waiting to countdown when enough players connect', () => {
      const machine = new MatchStateMachine();

      machine.playerConnected(1);
      expect(machine.getState()).toBe('waiting');

      machine.playerConnected(2);
      expect(machine.getState()).toBe('countdown');
    });

    it('transitions from countdown to waiting if player disconnects', () => {
      const machine = new MatchStateMachine();

      machine.playerConnected(1);
      machine.playerConnected(2);
      expect(machine.getState()).toBe('countdown');

      machine.playerDisconnected(1);
      expect(machine.getState()).toBe('waiting');
    });

    it('transitions from countdown to playing after countdown duration', () => {
      const config: MatchConfig = { ...DEFAULT_MATCH_CONFIG, countdownDurationMs: 1000 };
      const machine = new MatchStateMachine(config);

      machine.playerConnected(1);
      machine.playerConnected(2);
      expect(machine.getState()).toBe('countdown');

      machine.update(500);
      expect(machine.getState()).toBe('countdown');

      machine.update(1000);
      expect(machine.getState()).toBe('playing');
    });

    it('transitions from playing to ended when player reaches kill limit', () => {
      const config: MatchConfig = { ...DEFAULT_MATCH_CONFIG, countdownDurationMs: 0, killsToWin: 3 };
      const machine = new MatchStateMachine(config);

      machine.playerConnected(1);
      machine.playerConnected(2);
      machine.update(0);
      expect(machine.getState()).toBe('playing');

      machine.recordKill(1, 2);
      machine.recordKill(1, 2);
      expect(machine.getState()).toBe('playing');

      machine.recordKill(1, 2);
      expect(machine.getState()).toBe('ended');
      expect(machine.getWinnerId()).toBe(1);
    });

    it('transitions from ended to cleanup after results duration', () => {
      const config: MatchConfig = {
        ...DEFAULT_MATCH_CONFIG,
        countdownDurationMs: 0,
        resultsDurationMs: 1000,
        killsToWin: 1,
      };
      const machine = new MatchStateMachine(config);

      machine.playerConnected(1);
      machine.playerConnected(2);
      machine.update(0);
      machine.recordKill(1, 2);
      expect(machine.getState()).toBe('ended');

      machine.update(500);
      expect(machine.getState()).toBe('ended');

      machine.update(1000);
      expect(machine.getState()).toBe('cleanup');
    });
  });


  describe('Win Conditions', () => {
    // Property 27: Win Condition Detection - killsToWin triggers ended state
    it('Property 27: reaching killsToWin triggers ended state', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 20 }), (killsToWin) => {
          const config: MatchConfig = {
            ...DEFAULT_MATCH_CONFIG,
            countdownDurationMs: 0,
            killsToWin,
          };
          const machine = new MatchStateMachine(config);

          machine.playerConnected(1);
          machine.playerConnected(2);
          machine.update(0);

          // Record kills up to limit - 1
          for (let i = 0; i < killsToWin - 1; i++) {
            machine.recordKill(1, 2);
            expect(machine.getState()).toBe('playing');
          }

          // Final kill should trigger ended
          machine.recordKill(1, 2);
          expect(machine.getState()).toBe('ended');
          expect(machine.getWinnerId()).toBe(1);
          expect(machine.getScores().get(1)).toBe(killsToWin);
        }),
        { numRuns: 20 }
      );
    });

    it('awards victory to remaining player on disconnect during playing', () => {
      const config: MatchConfig = { ...DEFAULT_MATCH_CONFIG, countdownDurationMs: 0 };
      const machine = new MatchStateMachine(config);

      machine.playerConnected(1);
      machine.playerConnected(2);
      machine.update(0);
      expect(machine.getState()).toBe('playing');

      machine.playerDisconnected(2);
      expect(machine.getState()).toBe('ended');
      expect(machine.getWinnerId()).toBe(1);
    });
  });

  describe('Countdown', () => {
    it('returns correct countdown remaining', () => {
      const config: MatchConfig = { ...DEFAULT_MATCH_CONFIG, countdownDurationMs: 3000 };
      const machine = new MatchStateMachine(config);

      machine.playerConnected(1);
      machine.playerConnected(2);
      expect(machine.getCountdownRemaining()).toBe(3000);

      machine.update(1000);
      expect(machine.getCountdownRemaining()).toBe(2000);

      machine.update(2500);
      expect(machine.getCountdownRemaining()).toBe(500);

      machine.update(3000);
      expect(machine.getCountdownRemaining()).toBe(0);
    });

    it('returns 0 countdown when not in countdown state', () => {
      const machine = new MatchStateMachine();
      expect(machine.getCountdownRemaining()).toBe(0);

      machine.playerConnected(1);
      expect(machine.getCountdownRemaining()).toBe(0);
    });
  });

  describe('Scores', () => {
    it('initializes player score to 0 on connect', () => {
      const machine = new MatchStateMachine();

      machine.playerConnected(1);
      expect(machine.getScores().get(1)).toBe(0);
    });

    it('increments score on kill', () => {
      const config: MatchConfig = { ...DEFAULT_MATCH_CONFIG, countdownDurationMs: 0, killsToWin: 10 };
      const machine = new MatchStateMachine(config);

      machine.playerConnected(1);
      machine.playerConnected(2);
      machine.update(0);

      machine.recordKill(1, 2);
      expect(machine.getScores().get(1)).toBe(1);
      expect(machine.getScores().get(2)).toBe(0);

      machine.recordKill(2, 1);
      expect(machine.getScores().get(1)).toBe(1);
      expect(machine.getScores().get(2)).toBe(1);
    });

    it('does not record kills when not in playing state', () => {
      const machine = new MatchStateMachine();

      machine.playerConnected(1);
      machine.playerConnected(2);
      // Still in countdown

      machine.recordKill(1, 2);
      expect(machine.getScores().get(1)).toBe(0);
    });
  });

  describe('Event Emission', () => {
    it('emits match_state_changed on state transition', () => {
      const eventBus = new EventBus();
      const handler = vi.fn();
      eventBus.on('match_state_changed', handler);

      const machine = new MatchStateMachine(DEFAULT_MATCH_CONFIG, eventBus);

      machine.playerConnected(1);
      machine.playerConnected(2);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'match_state_changed',
          previousState: 'waiting',
          newState: 'countdown',
        })
      );
    });

    it('emits match_start when transitioning to playing', () => {
      const eventBus = new EventBus();
      const handler = vi.fn();
      eventBus.on('match_start', handler);

      const config: MatchConfig = { ...DEFAULT_MATCH_CONFIG, countdownDurationMs: 0 };
      const machine = new MatchStateMachine(config, eventBus);

      machine.playerConnected(1);
      machine.playerConnected(2);
      machine.update(0);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'match_start',
          tickNumber: 0,
        })
      );
    });

    it('emits match_end when transitioning to ended', () => {
      const eventBus = new EventBus();
      const handler = vi.fn();
      eventBus.on('match_end', handler);

      const config: MatchConfig = { ...DEFAULT_MATCH_CONFIG, countdownDurationMs: 0, killsToWin: 1 };
      const machine = new MatchStateMachine(config, eventBus);

      machine.playerConnected(1);
      machine.playerConnected(2);
      machine.update(0);
      machine.recordKill(1, 2);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'match_end',
          winnerId: 1,
        })
      );
    });
  });

  describe('Reset', () => {
    it('resets all state', () => {
      const config: MatchConfig = { ...DEFAULT_MATCH_CONFIG, countdownDurationMs: 0, killsToWin: 1 };
      const machine = new MatchStateMachine(config);

      machine.playerConnected(1);
      machine.playerConnected(2);
      machine.update(0);
      machine.recordKill(1, 2);
      expect(machine.getState()).toBe('ended');

      machine.reset();

      expect(machine.getState()).toBe('waiting');
      expect(machine.getConnectedPlayers().size).toBe(0);
      expect(machine.getScores().size).toBe(0);
      expect(machine.getWinnerId()).toBeNull();
    });
  });
});
