// API Response types

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  error_code?: string
  details?: unknown
}

// Auth types
export interface User {
  id: string
  email: string | null
  display_name: string | null
  games_played: number
  games_won: number
  total_score?: number
  avatar_url?: string | null
}

export interface AuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  display_name?: string
}

// Lobby types
export interface PlayerCard {
  id: string
  name: string
  type: string
  rarity: string
  image_url: string
}

export interface Player {
  id: string
  display_name: string | null
  is_host: boolean
  is_ready: boolean
  playercard?: PlayerCard | null  // Optional equipped playercard for lobby display
}

export interface Lobby {
  id: string
  code: string
  host_id: string
  opponent_id: string | null
  status: 'waiting' | 'in_progress' | 'completed' | 'abandoned'
  game_mode: string
  players: Player[]
  can_start: boolean
  created_at: string
}

// Game types
export interface GameHistory {
  id: string
  lobby_id: string
  winner_id: string | null
  player1_id: string
  player1_score: number
  player2_id: string
  player2_score: number
  completed_at: string
}
