/**
 * TacticalEvaluator - Scores and selects tactical plays based on context
 * 
 * This is the "brain" that decides which macro-goal to pursue.
 * It considers: position, aggression, health, mercy state, and path exposure.
 */

import { Vector3 } from 'three';
import {
  TACTICAL_PLAYS,
  getStartZone,
  worldToGrid,
} from './TacticalPlays';
import type {
  TacticalPlay,
  TacticalWaypoint,
} from './TacticalPlays';

// ============================================================================
// Types
// ============================================================================

export interface EvaluatorContext {
  botPosition: Vector3;
  playerPosition: Vector3;
  botHealth: number;
  botMaxHealth: number;
  aggression: number;
  mercyActive: boolean;
  playerVisible: boolean;
  timeSinceLastSeen: number;
}

export interface PlayScore {
  play: TacticalPlay;
  score: number;
  reasons: string[];
}

export interface ActivePlay {
  play: TacticalPlay;
  currentWaypointIndex: number;
  startTime: number;
  waypointStartTime: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Maximum distance to consider a play's start zone reachable */
const MAX_START_DISTANCE = 12;

/** How exposed is "too exposed" */
const EXPOSURE_THRESHOLD = 0.6;

// ============================================================================
// TacticalEvaluator
// ============================================================================

export class TacticalEvaluator {
  private activePlay: ActivePlay | null = null;
  private lastEvaluationTime: number = 0;
  private evaluationCooldown: number = 2000; // Re-evaluate every 2s max

  /**
   * Evaluate and select the best tactical play
   */
  evaluate(context: EvaluatorContext): TacticalPlay | null {
    const now = Date.now();
    
    // Don't re-evaluate too frequently unless play is complete
    if (this.activePlay && now - this.lastEvaluationTime < this.evaluationCooldown) {
      // Check if current play is still valid
      if (this.isPlayStillValid(context)) {
        return this.activePlay.play;
      }
    }

    this.lastEvaluationTime = now;

    const scores = this.scoreAllPlays(context);
    
    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    // Return best play if score is positive
    if (scores.length > 0 && scores[0].score > 0) {
      const bestPlay = scores[0].play;
      
      // Start new play if different from current
      if (!this.activePlay || this.activePlay.play.id !== bestPlay.id) {
        this.activePlay = {
          play: bestPlay,
          currentWaypointIndex: 0,
          startTime: now,
          waypointStartTime: now,
        };
      }
      
      return bestPlay;
    }

    return null;
  }

  /**
   * Score all available plays
   */
  private scoreAllPlays(context: EvaluatorContext): PlayScore[] {
    const botGrid = worldToGrid(context.botPosition.x, context.botPosition.z);
    const currentZone = getStartZone(botGrid.gridX, botGrid.gridZ);
    const healthRatio = context.botHealth / context.botMaxHealth;

    const scores: PlayScore[] = [];

    for (const play of TACTICAL_PLAYS) {
      const reasons: string[] = [];
      let score = 0;

      // 1. Check if play is disabled by mercy
      if (play.disabledByMercy && context.mercyActive) {
        reasons.push('Disabled by mercy');
        scores.push({ play, score: -1000, reasons });
        continue;
      }

      // 2. Check aggression range
      if (context.aggression < play.minAggression) {
        reasons.push(`Aggression too low (${context.aggression.toFixed(2)} < ${play.minAggression})`);
        score -= 100;
      } else if (context.aggression > play.maxAggression) {
        reasons.push(`Aggression too high (${context.aggression.toFixed(2)} > ${play.maxAggression})`);
        score -= 100;
      } else {
        // Aggression matches - bonus based on how well it fits
        const aggressionFit = 1 - Math.abs(
          context.aggression - (play.minAggression + play.maxAggression) / 2
        );
        score += aggressionFit * 30;
        reasons.push(`Aggression fit: +${(aggressionFit * 30).toFixed(0)}`);
      }

      // 3. Check start zone proximity
      const canStartFromHere = play.startZones.includes(currentZone) || 
                               play.startZones.includes('ANY');
      
      if (canStartFromHere) {
        score += 40;
        reasons.push(`In start zone (${currentZone}): +40`);
      } else {
        // Calculate distance to nearest valid start zone
        const distToStart = this.getDistanceToStartZone(context.botPosition, play);
        if (distToStart > MAX_START_DISTANCE) {
          reasons.push(`Too far from start zone: ${distToStart.toFixed(1)}`);
          score -= 50;
        } else {
          score -= distToStart * 3;
          reasons.push(`Distance to start: -${(distToStart * 3).toFixed(0)}`);
        }
      }

      // 4. Health-based scoring
      if (healthRatio < 0.3) {
        if (play.type === 'RETREAT') {
          score += 100;
          reasons.push('Low health + retreat play: +100');
        } else if (play.type === 'AGGRESSIVE') {
          score -= 80;
          reasons.push('Low health + aggressive play: -80');
        }
      } else if (healthRatio > 0.7) {
        if (play.type === 'AGGRESSIVE') {
          score += 30;
          reasons.push('High health + aggressive play: +30');
        }
      }

      // 5. Path exposure check
      const exposure = this.calculatePathExposure(play, context.playerPosition);
      if (exposure > EXPOSURE_THRESHOLD) {
        score -= exposure * 40;
        reasons.push(`Path exposed: -${(exposure * 40).toFixed(0)}`);
      }

      // 6. Priority boost
      if (play.priorityBoost) {
        // Apply boost based on context
        let boostMultiplier = 1;
        if (play.type === 'RETREAT' && healthRatio < 0.3) {
          boostMultiplier = 2;
        }
        if (play.type === 'DEFENSIVE' && context.mercyActive) {
          boostMultiplier = 1.5;
        }
        score += play.priorityBoost * boostMultiplier;
        reasons.push(`Priority boost: +${(play.priorityBoost * boostMultiplier).toFixed(0)}`);
      }

      // 7. Mercy mode bonuses
      if (context.mercyActive) {
        if (play.type === 'DEFENSIVE') {
          score += 50;
          reasons.push('Mercy active + defensive: +50');
        } else if (play.type === 'RETREAT') {
          score += 30;
          reasons.push('Mercy active + retreat: +30');
        }
      }

      scores.push({ play, score, reasons });
    }

    return scores;
  }

  /**
   * Check if current play is still valid
   */
  private isPlayStillValid(context: EvaluatorContext): boolean {
    if (!this.activePlay) return false;

    const play = this.activePlay.play;

    // Check if play is now disabled by mercy
    if (play.disabledByMercy && context.mercyActive) {
      return false;
    }

    // Check if aggression has changed dramatically
    if (context.aggression < play.minAggression - 0.2 ||
        context.aggression > play.maxAggression + 0.2) {
      return false;
    }

    // Check if health dropped critically during aggressive play
    const healthRatio = context.botHealth / context.botMaxHealth;
    if (healthRatio < 0.25 && play.type === 'AGGRESSIVE') {
      return false;
    }

    // Check if play is complete
    if (this.activePlay.currentWaypointIndex >= play.waypoints.length) {
      return false;
    }

    return true;
  }

  /**
   * Get distance to nearest valid start zone for a play
   */
  private getDistanceToStartZone(botPos: Vector3, play: TacticalPlay): number {
    if (play.startZones.includes('ANY')) return 0;

    // Get first waypoint as approximate start position
    const firstWp = play.waypoints[0];
    const dx = botPos.x - firstWp.worldX;
    const dz = botPos.z - firstWp.worldZ;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /**
   * Calculate how exposed a path is to the player
   */
  private calculatePathExposure(play: TacticalPlay, playerPos: Vector3): number {
    let totalExposure = 0;
    let exposedWaypoints = 0;

    for (const wp of play.waypoints) {
      // Simple line-of-sight approximation
      const dx = wp.worldX - playerPos.x;
      const dz = wp.worldZ - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Closer = more exposed
      if (dist < 15) {
        exposedWaypoints++;
        totalExposure += (15 - dist) / 15;
      }
    }

    return exposedWaypoints > 0 ? totalExposure / play.waypoints.length : 0;
  }

  /**
   * Get current waypoint to navigate to
   */
  getCurrentWaypoint(): TacticalWaypoint | null {
    if (!this.activePlay) return null;
    
    const { play, currentWaypointIndex } = this.activePlay;
    if (currentWaypointIndex >= play.waypoints.length) return null;
    
    return play.waypoints[currentWaypointIndex];
  }

  /**
   * Advance to next waypoint
   */
  advanceWaypoint(): void {
    if (!this.activePlay) return;
    
    this.activePlay.currentWaypointIndex++;
    this.activePlay.waypointStartTime = Date.now();
  }

  /**
   * Get time spent at current waypoint
   */
  getWaypointElapsedMs(): number {
    if (!this.activePlay) return 0;
    return Date.now() - this.activePlay.waypointStartTime;
  }

  /**
   * Check if current waypoint pause is complete
   */
  isWaypointPauseComplete(): boolean {
    const wp = this.getCurrentWaypoint();
    if (!wp || !wp.pauseMs) return true;
    return this.getWaypointElapsedMs() >= wp.pauseMs;
  }

  /**
   * Get active play info
   */
  getActivePlay(): ActivePlay | null {
    return this.activePlay;
  }

  /**
   * Get current play type
   */
  getCurrentPlayType(): string | null {
    return this.activePlay?.play.type ?? null;
  }

  /**
   * Force re-evaluation on next call
   */
  forceReevaluation(): void {
    this.lastEvaluationTime = 0;
  }

  /**
   * Clear active play
   */
  clearPlay(): void {
    this.activePlay = null;
  }

  /**
   * Reset state
   */
  reset(): void {
    this.activePlay = null;
    this.lastEvaluationTime = 0;
  }

  /**
   * Get debug info for all play scores
   */
  getDebugScores(context: EvaluatorContext): PlayScore[] {
    return this.scoreAllPlays(context);
  }
}
