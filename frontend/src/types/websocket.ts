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
  | 'pong' // Latency measurement response
  | 'state_update' // Authoritative state from tick system
  // Client -> Server
  | 'ready'
  | 'answer'
  | 'start_game'
  | 'powerup_use'
  | 'position_update'
  | 'combat_kill'
  | 'combat_damage'
  | 'combat_shot'
  | 'ping' // Latency measurement request
  | 'request_resync' // Request game state resync

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

export interface GameStartPayload {
  total_questions: number
  players: Array<{
    id: string
    display_name: string | null
    is_host: boolean
    is_ready: boolean
  }>
  player1_id: string
  player2_id: string
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

/**
 * Authoritative state update from server tick system.
 * Sent at 10Hz (every 6 ticks of 60Hz loop).
 */
export interface StateUpdatePayload {
  tick: number
  timestamp: number
  players: Record<
    string,
    {
      x: number
      y: number
      vx: number
      vy: number
      seq: number // Last acknowledged input sequence
    }
  >
  combat?: CombatStatePayload
  arena?: ArenaStatePayload
  buffs?: Record<string, Array<{ type: string; value: number; remaining: number; source: string }>>
}

/**
 * Combat state from server.
 */
export interface CombatStatePayload {
  projectiles: Array<{
    id: string
    owner_id: string
    x: number
    y: number
    vx: number
    vy: number
  }>
  players: Record<
    string,
    {
      health: number
      max_health: number
      is_dead: boolean
      invulnerable: boolean
    }
  >
}

/**
 * Combat fire event from server.
 */
export interface CombatFirePayload {
  projectile_id: string
  owner_id: string
  x: number
  y: number
  vx: number
  vy: number
}

/**
 * Combat hit event from server.
 */
export interface CombatHitPayload {
  target_id: string
  shooter_id: string
  damage: number
  health_remaining: number
}

/**
 * Combat death event from server.
 */
export interface CombatDeathPayload {
  victim_id: string
  killer_id: string
}

/**
 * Combat respawn event from server.
 */
export interface CombatRespawnPayload {
  player_id: string
  x: number
  y: number
  invulnerable_until: number
}

// ============================================================================
// Arena System Payloads
// ============================================================================

/**
 * Arena state from server (hazards, traps).
 */
export interface ArenaStatePayload {
  hazards: Array<{
    id: string
    type: 'damage' | 'slow' | 'emp'
    bounds: { x: number; y: number; width: number; height: number }
    intensity: number
    active: boolean
  }>
  traps: Array<{
    id: string
    type: 'pressure' | 'timed' | 'projectile'
    x: number
    y: number
    radius: number
    state: 'armed' | 'warning' | 'triggered' | 'cooldown'
    effect: 'damage' | 'stun' | 'knockback'
  }>
}

/**
 * Hazard spawn event from server.
 */
export interface HazardSpawnPayload {
  id: string
  type: 'damage' | 'slow' | 'emp'
  bounds: { x: number; y: number; width: number; height: number }
  intensity: number
}

/**
 * Hazard despawn event from server.
 */
export interface HazardDespawnPayload {
  id: string
}

/**
 * Hazard enter event from server.
 */
export interface HazardEnterPayload {
  hazard_id: string
  player_id: string
  type: 'damage' | 'slow' | 'emp'
}

/**
 * Hazard exit event from server.
 */
export interface HazardExitPayload {
  hazard_id: string
  player_id: string
}

/**
 * Hazard damage event from server.
 */
export interface HazardDamagePayload {
  player_id: string
  hazard_id: string
  damage: number
}

/**
 * Trap spawn event from server.
 */
export interface TrapSpawnPayload {
  id: string
  type: 'pressure' | 'timed' | 'projectile'
  x: number
  y: number
  radius: number
  effect: 'damage' | 'stun' | 'knockback'
  effectValue: number
}

/**
 * Trap despawn event from server.
 */
export interface TrapDespawnPayload {
  id: string
}

/**
 * Trap warning event from server.
 */
export interface TrapWarningPayload {
  id: string
}

/**
 * Trap triggered event from server.
 */
export interface TrapTriggeredPayload {
  id: string
  effect: 'damage' | 'stun' | 'knockback'
  value: number
  affected_players: string[]
  x: number
  y: number
  knockbacks?: Record<string, { dx: number; dy: number }>
}

/**
 * Trap armed event from server.
 */
export interface TrapArmedPayload {
  id: string
}

/**
 * Teleport event from server.
 */
export interface TeleportPayload {
  player_id: string
  from_x: number
  from_y: number
  to_x: number
  to_y: number
}

/**
 * Jump pad event from server.
 */
export interface JumpPadPayload {
  player_id: string
  vx: number
  vy: number
}
