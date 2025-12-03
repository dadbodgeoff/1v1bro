// WebSocket message types (must match backend)

export type WSMessageType =
  // Server -> Client
  | 'lobby_state'
  | 'player_joined'
  | 'player_left'
  | 'player_ready'
  | 'game_start'
  | 'question'
  | 'round_result'
  | 'game_end'
  | 'error'
  | 'player_disconnected'
  | 'player_reconnected'
  | 'position_update'
  | 'powerup_spawn'
  | 'powerup_collected'
  | 'sos_used'
  | 'time_stolen'
  // Client -> Server
  | 'ready'
  | 'answer'
  | 'start_game'
  | 'powerup_use'

export interface WSMessage<T = unknown> {
  type: WSMessageType
  payload?: T
}

// Payload types
export interface PlayerJoinedPayload {
  players: Array<{
    id: string
    display_name: string | null
    is_host: boolean
    is_ready: boolean
  }>
  can_start: boolean
}

export interface LobbyStatePayload {
  lobby_id: string
  status: string
  players: Array<{
    id: string
    display_name: string | null
    is_host: boolean
    is_ready: boolean
  }>
  can_start: boolean
  host_id: string
}

export interface QuestionPayload {
  q_num: number
  text: string
  options: string[]
  start_time: number
}

export interface AnswerPayload {
  q_num: number
  answer: string
  time_ms: number
}

export interface RoundResultPayload {
  q_num: number
  correct_answer: string
  scores: Record<string, number>
  answers: Record<string, string | null>
  total_scores: Record<string, number>
}

export interface GameEndPayload {
  winner_id: string | null
  final_scores: Record<string, number>
  is_tie: boolean
}

export interface PositionUpdatePayload {
  player_id: string
  x: number
  y: number
}

export interface PowerUpSpawnPayload {
  id: string
  type: string
  x: number
  y: number
}

export interface PowerUpCollectedPayload {
  powerup_id: string
  player_id: string
  type: string
}

export interface ErrorPayload {
  code: string
  message: string
}
