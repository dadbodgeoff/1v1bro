/**
 * arenaStore - Arena state management
 *
 * Zustand store for managing arena session state including mode,
 * match state, scores, and loading status.
 *
 * @module stores/arenaStore
 */

import { create } from 'zustand';
import type { BotPersonalityType, DifficultyLevel } from '@/arena/bot/types';
import type { MatchState, MatchResult } from '@/arena/bot/BotMatchManager';

/**
 * Arena game mode
 */
export type ArenaMode = 'practice' | 'pvp' | 'spectate';

/**
 * Arena state interface
 */
export interface ArenaState {
  // Mode
  mode: ArenaMode;
  mapId: string | null;

  // Match state (from MatchStateMachine)
  matchState: MatchState;
  countdownRemaining: number;
  timeRemaining: number;

  // Scores
  playerScore: number;
  opponentScore: number;

  // Match result
  matchResult: MatchResult | null;

  // Bot config (practice mode)
  botPersonality: BotPersonalityType;
  botDifficulty: DifficultyLevel;

  // Loading
  isLoading: boolean;
  loadProgress: number;
  loadError: string | null;

  // Actions
  setMode: (mode: ArenaMode) => void;
  setMapId: (mapId: string) => void;
  setMatchState: (state: MatchState) => void;
  setCountdownRemaining: (ms: number) => void;
  setTimeRemaining: (seconds: number) => void;
  setScores: (player: number, opponent: number) => void;
  setMatchResult: (result: MatchResult | null) => void;
  setBotConfig: (personality: BotPersonalityType, difficulty: DifficultyLevel) => void;
  setLoading: (loading: boolean, progress?: number, error?: string | null) => void;
  incrementPlayerScore: () => void;
  incrementOpponentScore: () => void;
  reset: () => void;
}

/**
 * Initial state values
 */
const initialState = {
  mode: 'practice' as ArenaMode,
  mapId: null as string | null,
  matchState: 'waiting' as MatchState,
  countdownRemaining: 0,
  timeRemaining: 180, // 3 minutes default
  playerScore: 0,
  opponentScore: 0,
  matchResult: null as MatchResult | null,
  botPersonality: 'duelist' as BotPersonalityType,
  botDifficulty: 'medium' as DifficultyLevel,
  isLoading: false,
  loadProgress: 0,
  loadError: null as string | null,
};

/**
 * Arena store for managing arena session state
 */
export const useArenaStore = create<ArenaState>((set) => ({
  ...initialState,

  setMode: (mode) => set({ mode }),

  setMapId: (mapId) => set({ mapId }),

  setMatchState: (matchState) => set({ matchState }),

  setCountdownRemaining: (countdownRemaining) => set({ countdownRemaining }),

  setTimeRemaining: (timeRemaining) => set({ timeRemaining }),

  setScores: (playerScore, opponentScore) => set({ playerScore, opponentScore }),

  setMatchResult: (matchResult) => set({ matchResult }),

  setBotConfig: (botPersonality, botDifficulty) =>
    set({ botPersonality, botDifficulty }),

  setLoading: (isLoading, loadProgress = 0, loadError = null) =>
    set({ isLoading, loadProgress, loadError }),

  incrementPlayerScore: () =>
    set((state) => ({ playerScore: state.playerScore + 1 })),

  incrementOpponentScore: () =>
    set((state) => ({ opponentScore: state.opponentScore + 1 })),

  reset: () => set(initialState),
}));

/**
 * Selector for checking if arena is in active gameplay
 */
export const selectIsPlaying = (state: ArenaState): boolean =>
  state.matchState === 'playing';

/**
 * Selector for checking if match has ended
 */
export const selectIsMatchEnded = (state: ArenaState): boolean =>
  state.matchState === 'ended';

/**
 * Selector for getting formatted time remaining
 */
export const selectFormattedTime = (state: ArenaState): string => {
  const minutes = Math.floor(state.timeRemaining / 60);
  const seconds = Math.floor(state.timeRemaining % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};
