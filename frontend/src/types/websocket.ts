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
  | 'emote_triggered' // Emote triggered by opponent
  // Progression events (UNIFIED PROGRESSION)
  | 'xp_awarded'
  | 'tier_advanced'
  | 'reward_claimed'
  // Arena state events (SERVER AUTHORITY)
  | 'arena_state'
  | 'arena_event'
  | 'barrier_damaged'
  | 'barrier_destroyed'
  | 'buff_applied'
  | 'buff_expired'
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
  | 'emote_trigger' // Trigger an emote

export interface WSMessage<T = unknown> {
  type: WSMessageType
  payload?: T
}

// Playercard data included in lobby events
export interface PlayerCardPayload {
  id: string
  name: string
  type: string
  rarity: string
  image_url: string
}

// Player data in lobby events (includes optional playercard)
export interface LobbyPlayer {
  id: string
  display_name: string | null
  is_host: boolean
  is_ready: boolean
  playercard?: PlayerCardPayload | null
}

// Payload types
export interface PlayerJoinedPayload {
  players: LobbyPlayer[]
  can_start: boolean
}

export interface LobbyStatePayload {
  lobby_id: string
  status: string
  players: LobbyPlayer[]
  can_start: boolean
  host_id: string
  category?: string
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

export interface PlayerSkinPayload {
  skin_id?: string
  sprite_sheet_url?: string
  sprite_meta_url?: string
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
  player_skins?: Record<string, PlayerSkinPayload | null>
}

/**
 * XP award result included in game_end payload.
 * Matches backend XPAwardResult schema.
 */
export interface XPAwardResultPayload {
  xp_awarded: number
  new_total_xp: number
  previous_tier: number
  new_tier: number
  tier_advanced: boolean
  tiers_gained: number
  new_claimable_rewards: number[]
  calculation?: {
    base_xp: number
    kill_bonus: number
    streak_bonus: number
    duration_bonus: number
  }
}

export interface GameEndPayload {
  winner_id: string | null
  final_scores: Record<string, number>
  is_tie: boolean
  total_times?: Record<string, number>
  won_by_time?: boolean
  // XP results for both players (UNIFIED PROGRESSION)
  winner_xp?: XPAwardResultPayload | null
  loser_xp?: XPAwardResultPayload | null
  // Player-specific XP (keyed by player_id)
  xp_results?: Record<string, XPAwardResultPayload>
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
 * Full arena state from server (hazards, traps, doors, platforms, barriers, powerups).
 * SERVER AUTHORITY: Complete arena state for client sync.
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
  doors: Array<{
    id: string
    state: 'open' | 'closed' | 'opening' | 'closing'
    progress: number
    is_blocking: boolean
  }>
  platforms: Array<{
    id: string
    x: number
    y: number
    current_waypoint: number
    progress: number
    velocity_x: number
    velocity_y: number
  }>
  barriers: Array<{
    id: string
    x: number
    y: number
    width: number
    height: number
    type: 'solid' | 'destructible' | 'half_wall' | 'one_way'
    health: number
    max_health: number
    is_active: boolean
    direction?: string
  }>
  powerups: Array<{
    id: string
    x: number
    y: number
    type: 'sos' | 'time_steal' | 'shield' | 'double_points'
    radius: number
    is_active: boolean
  }>
}

/**
 * Barrier damaged event from server.
 * SERVER AUTHORITY: Notify clients of barrier damage.
 */
export interface BarrierDamagedPayload {
  barrier_id: string
  damage: number
  health: number
  max_health: number
  source_player_id?: string
}

/**
 * Barrier destroyed event from server.
 * SERVER AUTHORITY: Notify clients of barrier destruction.
 */
export interface BarrierDestroyedPayload {
  barrier_id: string
  source_player_id?: string
}

/**
 * Buff applied event from server.
 * SERVER AUTHORITY: Notify clients of buff application.
 */
export interface BuffAppliedPayload {
  player_id: string
  buff_type: 'damage_boost' | 'speed_boost' | 'vulnerability' | 'shield' | 'invulnerable'
  value: number
  duration: number
  source: string
}

/**
 * Buff expired event from server.
 * SERVER AUTHORITY: Notify clients of buff expiration.
 */
export interface BuffExpiredPayload {
  player_id: string
  buff_type: 'damage_boost' | 'speed_boost' | 'vulnerability' | 'shield' | 'invulnerable'
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


// ============================================================================
// Emote System Payloads
// ============================================================================

/**
 * Emote trigger event from client.
 */
export interface EmoteTriggerPayload {
  emote_id: string
  timestamp: number
}

/**
 * Emote triggered event from server (broadcast to opponent).
 */
export interface EmoteTriggeredPayload {
  player_id: string
  emote_id: string
  timestamp: number
}


// ============================================================================
// Progression System Payloads (UNIFIED PROGRESSION)
// ============================================================================

/**
 * XP awarded event from server.
 * Sent after match XP is calculated and awarded.
 */
export interface XPAwardedPayload {
  xp_amount: number
  new_total_xp: number
  previous_tier: number
  new_tier: number
  tier_advanced: boolean
  calculation?: {
    base_xp: number
    kill_bonus: number
    streak_bonus: number
    duration_bonus: number
  }
}

/**
 * Tier advanced event from server.
 * Sent when player advances to a new tier.
 */
export interface TierAdvancedPayload {
  previous_tier: number
  new_tier: number
  tiers_gained: number
  new_claimable_rewards: number[]
}

/**
 * Reward claimed event from server.
 * Sent when player claims a tier reward.
 */
export interface RewardClaimedPayload {
  tier: number
  reward_type: string
  reward_value: string | number
  inventory_item_id?: string | null
}
