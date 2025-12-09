import { create } from 'zustand'
import type { RecapPayload } from '@/types/recap'

// Minimal game state for Phase 4 (no position, no power-ups yet)
interface Question {
  qNum: number
  text: string
  options: string[]
  startTime: number
}

interface RoundResult {
  correctAnswer: string
  localScore: number
  opponentScore: number
  localAnswer: string | null
  opponentAnswer: string | null
}

interface FinalResult {
  winnerId: string | null
  isTie: boolean
  localScore: number
  opponentScore: number
}

type GameStatus = 'idle' | 'waiting' | 'countdown' | 'playing' | 'round_result' | 'finished'

interface GameState {
  // Session
  lobbyId: string | null
  status: GameStatus

  // Players
  localPlayerId: string | null
  localPlayerName: string | null
  localScore: number
  opponentId: string | null
  opponentName: string | null
  opponentScore: number

  // Question state
  currentQuestion: Question | null
  questionNumber: number
  totalQuestions: number
  selectedAnswer: string | null
  answerSubmitted: boolean

  // Results
  roundResult: RoundResult | null
  finalResult: FinalResult | null
  
  // Recap (MATCH AUTO-END RECAP)
  recap: RecapPayload | null

  // Actions
  setLobbyId: (id: string) => void
  setStatus: (status: GameStatus) => void
  setTotalQuestions: (total: number) => void
  setLocalPlayer: (id: string, name: string | null) => void
  setOpponent: (id: string | null, name: string | null) => void
  setQuestion: (question: Question) => void
  selectAnswer: (answer: string) => void
  submitAnswer: () => void
  updateScores: (localScore: number, opponentScore: number) => void
  setRoundResult: (result: RoundResult) => void
  setFinalResult: (result: FinalResult) => void
  setRecap: (recap: RecapPayload | null) => void
  reset: () => void
}

const initialState = {
  lobbyId: null,
  status: 'idle' as GameStatus,
  localPlayerId: null,
  localPlayerName: null,
  localScore: 0,
  opponentId: null,
  opponentName: null,
  opponentScore: 0,
  currentQuestion: null,
  questionNumber: 0,
  totalQuestions: 10,
  selectedAnswer: null,
  answerSubmitted: false,
  roundResult: null,
  finalResult: null,
  recap: null,
}

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setLobbyId: (lobbyId) => set({ lobbyId }),

  setStatus: (status) => set({ status }),

  setTotalQuestions: (totalQuestions) => set({ totalQuestions }),

  setLocalPlayer: (localPlayerId, localPlayerName) =>
    set({ localPlayerId, localPlayerName }),

  setOpponent: (opponentId, opponentName) =>
    set({ opponentId, opponentName }),

  setQuestion: (question) =>
    set({
      currentQuestion: question,
      questionNumber: question.qNum,
      selectedAnswer: null,
      answerSubmitted: false,
      roundResult: null,
      status: 'playing',
    }),

  selectAnswer: (selectedAnswer) => set({ selectedAnswer }),

  submitAnswer: () => set({ answerSubmitted: true }),

  updateScores: (localScore, opponentScore) =>
    set({ localScore, opponentScore }),

  setRoundResult: (roundResult) =>
    set({ roundResult, status: 'round_result' }),

  setFinalResult: (finalResult) =>
    set({ finalResult, status: 'finished' }),

  setRecap: (recap) => set({ recap }),

  reset: () => set(initialState),
}))
