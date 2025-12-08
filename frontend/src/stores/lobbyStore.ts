import { create } from 'zustand'
import type { Player } from '@/types/api'

interface PlayerSkin {
  skin_id?: string
  sprite_sheet_url?: string
  sprite_meta_url?: string
}

interface LobbyState {
  lobbyId: string | null
  code: string | null
  players: Player[]
  canStart: boolean
  isHost: boolean
  status: 'idle' | 'waiting' | 'in_progress'
  // Trivia category for this lobby
  category: string
  // Player assignment from game_start
  player1Id: string | null
  player2Id: string | null
  // Player skins from game_start
  playerSkins: Record<string, PlayerSkin | null>

  // Actions
  setLobby: (lobbyId: string, code: string, players: Player[], canStart: boolean) => void
  setPlayers: (players: Player[]) => void
  setCanStart: (canStart: boolean) => void
  setIsHost: (isHost: boolean) => void
  setStatus: (status: LobbyState['status']) => void
  setCategory: (category: string) => void
  setPlayerAssignment: (player1Id: string, player2Id: string) => void
  setPlayerSkins: (skins: Record<string, PlayerSkin | null>) => void
  reset: () => void
}

const initialState = {
  lobbyId: null,
  code: null,
  players: [],
  canStart: false,
  isHost: false,
  status: 'idle' as const,
  category: 'fortnite',
  player1Id: null,
  player2Id: null,
  playerSkins: {} as Record<string, PlayerSkin | null>,
}

export const useLobbyStore = create<LobbyState>((set) => ({
  ...initialState,

  setLobby: (lobbyId, code, players, canStart) =>
    set({ lobbyId, code, players, canStart, status: 'waiting' }),

  setPlayers: (players) => set({ players }),

  setCanStart: (canStart) => set({ canStart }),

  setIsHost: (isHost) => set({ isHost }),

  setStatus: (status) => set({ status }),

  setCategory: (category) => set({ category }),

  setPlayerAssignment: (player1Id, player2Id) => set({ player1Id, player2Id }),

  setPlayerSkins: (skins) => set({ playerSkins: skins }),

  reset: () => set(initialState),
}))
