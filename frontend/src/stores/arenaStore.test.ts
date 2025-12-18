/**
 * arenaStore Tests
 *
 * Property-based and unit tests for arena state management.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { useArenaStore, selectIsPlaying, selectIsMatchEnded, selectFormattedTime } from './arenaStore';
import type { ArenaMode, ArenaState } from './arenaStore';
import type { MatchState } from '@/arena/bot/BotMatchManager';
import type { BotPersonalityType, DifficultyLevel } from '@/arena/bot/types';

describe('arenaStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useArenaStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useArenaStore.getState();

      expect(state.mode).toBe('practice');
      expect(state.mapId).toBeNull();
      expect(state.matchState).toBe('waiting');
      expect(state.playerScore).toBe(0);
      expect(state.opponentScore).toBe(0);
      expect(state.isLoading).toBe(false);
      expect(state.loadError).toBeNull();
    });
  });

  describe('setMode', () => {
    it('should update mode', () => {
      const modes: ArenaMode[] = ['practice', 'pvp', 'spectate'];

      modes.forEach((mode) => {
        useArenaStore.getState().setMode(mode);
        expect(useArenaStore.getState().mode).toBe(mode);
      });
    });
  });

  describe('setMapId', () => {
    it('should update mapId', () => {
      useArenaStore.getState().setMapId('abandoned_terminal');
      expect(useArenaStore.getState().mapId).toBe('abandoned_terminal');
    });
  });

  describe('setMatchState', () => {
    it('should update match state', () => {
      const states: MatchState[] = ['waiting', 'countdown', 'playing', 'ended'];

      states.forEach((matchState) => {
        useArenaStore.getState().setMatchState(matchState);
        expect(useArenaStore.getState().matchState).toBe(matchState);
      });
    });
  });

  describe('setScores', () => {
    it('should update both scores', () => {
      useArenaStore.getState().setScores(5, 3);

      const state = useArenaStore.getState();
      expect(state.playerScore).toBe(5);
      expect(state.opponentScore).toBe(3);
    });
  });

  describe('incrementPlayerScore', () => {
    it('should increment player score by 1', () => {
      useArenaStore.getState().setScores(5, 3);
      useArenaStore.getState().incrementPlayerScore();

      expect(useArenaStore.getState().playerScore).toBe(6);
      expect(useArenaStore.getState().opponentScore).toBe(3);
    });
  });

  describe('incrementOpponentScore', () => {
    it('should increment opponent score by 1', () => {
      useArenaStore.getState().setScores(5, 3);
      useArenaStore.getState().incrementOpponentScore();

      expect(useArenaStore.getState().playerScore).toBe(5);
      expect(useArenaStore.getState().opponentScore).toBe(4);
    });
  });

  describe('setBotConfig', () => {
    it('should update bot personality and difficulty', () => {
      useArenaStore.getState().setBotConfig('rusher', 'hard');

      const state = useArenaStore.getState();
      expect(state.botPersonality).toBe('rusher');
      expect(state.botDifficulty).toBe('hard');
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      useArenaStore.getState().setLoading(true, 50);

      const state = useArenaStore.getState();
      expect(state.isLoading).toBe(true);
      expect(state.loadProgress).toBe(50);
      expect(state.loadError).toBeNull();
    });

    it('should update loading error', () => {
      useArenaStore.getState().setLoading(false, 0, 'Failed to load map');

      const state = useArenaStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.loadError).toBe('Failed to load map');
    });
  });

  describe('setMatchResult', () => {
    it('should update match result', () => {
      const result = {
        winner: 'player' as const,
        playerScore: 10,
        botScore: 5,
        duration: 120,
      };

      useArenaStore.getState().setMatchResult(result);
      expect(useArenaStore.getState().matchResult).toEqual(result);
    });

    it('should clear match result with null', () => {
      useArenaStore.getState().setMatchResult({
        winner: 'player',
        playerScore: 10,
        botScore: 5,
        duration: 120,
      });
      useArenaStore.getState().setMatchResult(null);

      expect(useArenaStore.getState().matchResult).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      // Modify state
      useArenaStore.getState().setMode('pvp');
      useArenaStore.getState().setMapId('test_map');
      useArenaStore.getState().setMatchState('playing');
      useArenaStore.getState().setScores(10, 5);
      useArenaStore.getState().setBotConfig('rusher', 'hard');
      useArenaStore.getState().setLoading(true, 75);

      // Reset
      useArenaStore.getState().reset();

      // Verify initial state
      const state = useArenaStore.getState();
      expect(state.mode).toBe('practice');
      expect(state.mapId).toBeNull();
      expect(state.matchState).toBe('waiting');
      expect(state.playerScore).toBe(0);
      expect(state.opponentScore).toBe(0);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('Property 6: Arena store tracks all required state', () => {
    it('should maintain valid state for any sequence of operations', () => {
      fc.assert(
        fc.property(
          // Generate random arena session configuration
          fc.record({
            mode: fc.constantFrom<ArenaMode>('practice', 'pvp', 'spectate'),
            mapId: fc.string({ minLength: 1, maxLength: 50 }),
            matchState: fc.constantFrom<MatchState>('waiting', 'countdown', 'playing', 'ended'),
            playerScore: fc.integer({ min: 0, max: 100 }),
            opponentScore: fc.integer({ min: 0, max: 100 }),
            timeRemaining: fc.integer({ min: 0, max: 600 }),
            botPersonality: fc.constantFrom<BotPersonalityType>('rusher', 'sentinel', 'duelist'),
            botDifficulty: fc.constantFrom<DifficultyLevel>('easy', 'medium', 'hard', 'adaptive'),
          }),
          (config) => {
            // Reset store
            useArenaStore.getState().reset();

            // Apply configuration
            useArenaStore.getState().setMode(config.mode);
            useArenaStore.getState().setMapId(config.mapId);
            useArenaStore.getState().setMatchState(config.matchState);
            useArenaStore.getState().setScores(config.playerScore, config.opponentScore);
            useArenaStore.getState().setTimeRemaining(config.timeRemaining);
            useArenaStore.getState().setBotConfig(config.botPersonality, config.botDifficulty);

            // Verify all state is tracked correctly
            const state = useArenaStore.getState();

            expect(state.mode).toBe(config.mode);
            expect(state.mapId).toBe(config.mapId);
            expect(state.matchState).toBe(config.matchState);
            expect(state.playerScore).toBe(config.playerScore);
            expect(state.opponentScore).toBe(config.opponentScore);
            expect(state.timeRemaining).toBe(config.timeRemaining);
            expect(state.botPersonality).toBe(config.botPersonality);
            expect(state.botDifficulty).toBe(config.botDifficulty);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('selectors', () => {
    describe('selectIsPlaying', () => {
      it('should return true when matchState is playing', () => {
        useArenaStore.getState().setMatchState('playing');
        expect(selectIsPlaying(useArenaStore.getState())).toBe(true);
      });

      it('should return false for other states', () => {
        const nonPlayingStates: MatchState[] = ['waiting', 'countdown', 'ended'];

        nonPlayingStates.forEach((state) => {
          useArenaStore.getState().setMatchState(state);
          expect(selectIsPlaying(useArenaStore.getState())).toBe(false);
        });
      });
    });

    describe('selectIsMatchEnded', () => {
      it('should return true when matchState is ended', () => {
        useArenaStore.getState().setMatchState('ended');
        expect(selectIsMatchEnded(useArenaStore.getState())).toBe(true);
      });

      it('should return false for other states', () => {
        const nonEndedStates: MatchState[] = ['waiting', 'countdown', 'playing'];

        nonEndedStates.forEach((state) => {
          useArenaStore.getState().setMatchState(state);
          expect(selectIsMatchEnded(useArenaStore.getState())).toBe(false);
        });
      });
    });

    describe('selectFormattedTime', () => {
      it('should format time correctly', () => {
        const testCases = [
          { seconds: 180, expected: '3:00' },
          { seconds: 65, expected: '1:05' },
          { seconds: 0, expected: '0:00' },
          { seconds: 599, expected: '9:59' },
        ];

        testCases.forEach(({ seconds, expected }) => {
          useArenaStore.getState().setTimeRemaining(seconds);
          expect(selectFormattedTime(useArenaStore.getState())).toBe(expected);
        });
      });
    });
  });
});
