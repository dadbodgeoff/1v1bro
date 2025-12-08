/**
 * Match History types for game history display.
 * Matches backend GameHistoryItem schema from app/schemas/game.py
 * Requirements: 5.1, 5.2
 */

/**
 * Recent match from game history.
 * Enhanced with opponent details and ELO change.
 */
export interface RecentMatch {
  id: string;
  opponent_id: string;
  opponent_name: string | null;
  opponent_avatar_url: string | null;
  my_score: number;
  opponent_score: number;
  won: boolean;
  is_tie: boolean;
  elo_change: number;
  created_at: string;
}

/**
 * Match history API response.
 */
export interface MatchHistoryResponse {
  data: RecentMatch[];
  success: boolean;
  error?: string;
  error_code?: string;
}

/**
 * Get result display text for a match.
 */
export function getMatchResultText(match: RecentMatch): string {
  if (match.is_tie) return 'Tie';
  return match.won ? 'Victory' : 'Defeat';
}

/**
 * Get result color class for a match.
 */
export function getMatchResultColor(match: RecentMatch): string {
  if (match.is_tie) return 'text-yellow-400';
  return match.won ? 'text-green-400' : 'text-red-400';
}

/**
 * Get ELO change display with sign.
 */
export function getEloChangeDisplay(eloChange: number): string {
  if (eloChange === 0) return '±0';
  return eloChange > 0 ? `+${eloChange}` : `${eloChange}`;
}

/**
 * Get ELO change color class.
 */
export function getEloChangeColor(eloChange: number): string {
  if (eloChange === 0) return 'text-neutral-400';
  return eloChange > 0 ? 'text-green-400' : 'text-red-400';
}
