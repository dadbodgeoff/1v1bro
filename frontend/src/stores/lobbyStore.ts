import { create } from 'zustand'
import type { Player } from '@/types/api'

interface LobbyState {
  lobbyId: string | null
  code: string | null
  players: Player[]
  canStart: boolean
  isHost: boolean
  status: 'idle' | 'waiting' | 'in_progress'

  // Actions
  setLobby: (lobbyId: string, code: string, players: Player[], canStart: boolean) => void
  setPlayers: (players: Player[]) => void
  setCanStart: (canStart: boolean) => void
  setIsHost: (isHost: boolean) => void
  setStatus: (status: LobbyState['status']) => void
  reset: () => void
}

const initialState = {
  lobbyId: null,
  code: null,
  players: [],
  canStart: false,
  isHost: false,
  status: 'idle' as const,
}

export const useLobbyStore = create<LobbyState>((set) => ({
  ...initialState,

  setLobby: (lobbyId, code, players, canStart) =>
    set({ lobbyId, code, players, canStart, status: 'waiting' }),

  setPlayers: (players) => set({ players }),

  setCanStart: (canStart) => set({ canStart }),

  setIsHost: (isHost) => set({ isHost }),

  setStatus: (status) => set({ status }),

  reset: () => set(initialState),
}))
