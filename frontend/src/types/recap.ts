/**
 * Recap Types - TypeScript interfaces for post-match recap system.
 * 
 * Requirements: 7.4 - Deserialize recap data from JSON for match history display.
 */

export interface XPBreakdown {
  total: number
  base_xp: number
  kill_bonus: number
  streak_bonus: number
  duration_bonus: number
}

export interface TierProgress {
  previous_tier: number
  new_tier: number
  tier_advanced: boolean
  current_xp: number
  xp_to_next_tier: number
  new_claimable_rewards: number[]
}

export interface QuestionStats {
  correct_count: number
  total_questions: number
  accuracy_percent: number
  avg_answer_time_ms: number
  fastest_answer_ms: number
  is_perfect?: boolean
}

export interface CombatStats {
  kills: number
  deaths: number
  kd_ratio: number
  max_streak: number
  shots_fired: number
  shots_hit: number
  shot_accuracy: number
}

export interface OpponentData {
  id: string
  display_name: string
  avatar_url: string | null
  final_score: number
  accuracy_percent: number
  kd_ratio: number
}

export interface RecapPayload {
  winner_id: string | null
  is_tie: boolean
  won_by_time: boolean
  xp_breakdown: XPBreakdown
  tier_progress: TierProgress
  question_stats: QuestionStats
  combat_stats: CombatStats
  opponent: OpponentData
}
