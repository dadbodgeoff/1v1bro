/**
 * CombatFlowAnalyzer - Tracks player behavior patterns for counter-play
 * 
 * Analyzes player actions over a rolling window to detect playstyle
 * and suggest appropriate counter-tactics.
 */

import type { CombatEvent, TacticalPatternType } from './types';

/**
 * Player playstyle classification
 */
export type PlayerPlaystyle = 'aggressive' | 'passive' | 'flanker' | 'balanced';

/**
 * Tracked player action
 */
interface PlayerAction {
  type: 'push' | 'retreat' | 'strafe' | 'hold' | 'flank' | 'shot' | 'miss';
  timestamp: number;
  position?: { x: number; z: number };
}

/**
 * Engagement outcome record
 */
interface EngagementOutcome {
  botPattern: string;
  playerResponse: PlayerPlaystyle;
  botWon: boolean;
  timestamp: number;
}

/**
 * Analysis result
 */
export interface FlowAnalysis {
  playstyle: PlayerPlaystyle;
  confidence: number;
  counterWeights: Record<TacticalPatternType, number>;
  recentTrend: 'more_aggressive' | 'more_passive' | 'stable';
}

/**
 * Time window for tracking (10 seconds)
 */
const WINDOW_MS = 10000;

/**
 * Minimum actions needed for confident analysis
 */
const MIN_ACTIONS_FOR_CONFIDENCE = 5;

export class CombatFlowAnalyzer {
  private actions: PlayerAction[] = [];
  private outcomes: EngagementOutcome[] = [];
  private lastAnalysis: FlowAnalysis | null = null;

  /**
   * Record a player action
   */
  recordAction(
    type: PlayerAction['type'],
    position?: { x: number; z: number }
  ): void {
    this.actions.push({
      type,
      timestamp: Date.now(),
      position,
    });
    this.pruneOldData();
  }

  /**
   * Record a combat event (converts to action)
   */
  recordEvent(event: CombatEvent): void {
    switch (event.type) {
      case 'player_hit_bot':
        this.recordAction('shot');
        break;
      case 'player_missed':
        this.recordAction('miss');
        break;
    }
  }

  /**
   * Record engagement outcome for learning
   */
  recordOutcome(botPattern: string, playerResponse: PlayerPlaystyle, botWon: boolean): void {
    this.outcomes.push({
      botPattern,
      playerResponse,
      botWon,
      timestamp: Date.now(),
    });
    
    // Keep last 20 outcomes
    if (this.outcomes.length > 20) {
      this.outcomes.shift();
    }
  }

  /**
   * Analyze current player behavior
   */
  analyze(): FlowAnalysis {
    this.pruneOldData();

    const recentActions = this.actions;
    
    if (recentActions.length < MIN_ACTIONS_FOR_CONFIDENCE) {
      return this.getDefaultAnalysis();
    }

    // Count action types
    const counts = {
      push: 0,
      retreat: 0,
      strafe: 0,
      hold: 0,
      flank: 0,
      shot: 0,
      miss: 0,
    };

    for (const action of recentActions) {
      counts[action.type]++;
    }

    // Classify playstyle
    const playstyle = this.classifyPlaystyle(counts);
    const confidence = Math.min(1, recentActions.length / 10);
    const counterWeights = this.calculateCounterWeights(playstyle, counts);
    const recentTrend = this.detectTrend();

    this.lastAnalysis = {
      playstyle,
      confidence,
      counterWeights,
      recentTrend,
    };

    return this.lastAnalysis;
  }

  /**
   * Get counter-play weights for pattern selection
   */
  getCounterWeights(): Record<TacticalPatternType, number> {
    const analysis = this.lastAnalysis ?? this.analyze();
    return analysis.counterWeights;
  }

  /**
   * Get detected player playstyle
   */
  getPlaystyle(): PlayerPlaystyle {
    const analysis = this.lastAnalysis ?? this.analyze();
    return analysis.playstyle;
  }

  /**
   * Classify player playstyle from action counts
   */
  private classifyPlaystyle(counts: Record<string, number>): PlayerPlaystyle {
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total === 0) return 'balanced';

    const aggressiveScore = (counts.push + counts.shot) / total;
    const passiveScore = (counts.retreat + counts.hold + counts.miss) / total;
    const flankScore = (counts.flank + counts.strafe) / total;

    if (aggressiveScore > 0.5) return 'aggressive';
    if (passiveScore > 0.5) return 'passive';
    if (flankScore > 0.4) return 'flanker';
    return 'balanced';
  }

  /**
   * Calculate counter-play weights based on playstyle
   */
  private calculateCounterWeights(
    playstyle: PlayerPlaystyle,
    counts: Record<string, number>
  ): Record<TacticalPatternType, number> {
    // Base weights
    const weights: Record<TacticalPatternType, number> = {
      STRAFE: 1.0,
      PEEK: 1.0,
      PUSH: 1.0,
      RETREAT: 1.0,
      HOLD: 1.0,
      FLANK: 1.0,
    };

    // Adjust based on playstyle
    switch (playstyle) {
      case 'aggressive':
        // Counter aggression with defensive play and punishes
        weights.RETREAT = 1.3;
        weights.HOLD = 1.4;
        weights.PEEK = 1.2;
        weights.PUSH = 0.6; // Don't trade into aggression
        break;

      case 'passive':
        // Punish passive play with pressure
        weights.PUSH = 1.4;
        weights.STRAFE = 1.2;
        weights.HOLD = 0.7; // Don't let them set up
        weights.RETREAT = 0.6;
        break;

      case 'flanker':
        // Counter flanks with awareness and repositioning
        weights.FLANK = 1.3; // Counter-flank
        weights.STRAFE = 1.2;
        weights.HOLD = 0.8; // Don't be stationary
        break;

      case 'balanced':
        // Stay flexible
        break;
    }

    // Adjust based on hit/miss ratio
    const shotTotal = counts.shot + counts.miss;
    if (shotTotal > 0) {
      const accuracy = counts.shot / shotTotal;
      if (accuracy > 0.6) {
        // Player is accurate - be more evasive
        weights.STRAFE *= 1.2;
        weights.HOLD *= 0.8;
      } else if (accuracy < 0.3) {
        // Player is missing - be more aggressive
        weights.PUSH *= 1.2;
        weights.HOLD *= 1.1;
      }
    }

    // Learn from outcomes
    this.applyOutcomeLearning(weights);

    return weights;
  }

  /**
   * Apply learning from past engagement outcomes
   */
  private applyOutcomeLearning(weights: Record<TacticalPatternType, number>): void {
    // Group outcomes by pattern type
    const patternResults = new Map<string, { wins: number; total: number }>();

    for (const outcome of this.outcomes) {
      const existing = patternResults.get(outcome.botPattern) ?? { wins: 0, total: 0 };
      existing.total++;
      if (outcome.botWon) existing.wins++;
      patternResults.set(outcome.botPattern, existing);
    }

    // Boost patterns that have been working
    for (const [pattern, results] of patternResults) {
      if (results.total >= 3) {
        const winRate = results.wins / results.total;
        // Map pattern ID to type (simplified - assumes pattern ID starts with type)
        const type = this.patternIdToType(pattern);
        if (type && weights[type] !== undefined) {
          // Boost winning patterns, reduce losing ones
          weights[type] *= 0.8 + winRate * 0.4;
        }
      }
    }
  }

  /**
   * Map pattern ID to type (simplified)
   */
  private patternIdToType(patternId: string): TacticalPatternType | null {
    const prefix = patternId.split('-')[0].toUpperCase();
    const types: TacticalPatternType[] = ['STRAFE', 'PEEK', 'PUSH', 'RETREAT', 'HOLD', 'FLANK'];
    return types.find(t => t === prefix) ?? null;
  }

  /**
   * Detect recent trend in player behavior
   */
  private detectTrend(): 'more_aggressive' | 'more_passive' | 'stable' {
    if (this.actions.length < 6) return 'stable';

    const midpoint = Math.floor(this.actions.length / 2);
    const firstHalf = this.actions.slice(0, midpoint);
    const secondHalf = this.actions.slice(midpoint);

    const firstAggression = this.calculateAggressionScore(firstHalf);
    const secondAggression = this.calculateAggressionScore(secondHalf);

    const delta = secondAggression - firstAggression;
    
    if (delta > 0.15) return 'more_aggressive';
    if (delta < -0.15) return 'more_passive';
    return 'stable';
  }

  /**
   * Calculate aggression score for a set of actions
   */
  private calculateAggressionScore(actions: PlayerAction[]): number {
    if (actions.length === 0) return 0.5;

    let aggressive = 0;
    let passive = 0;

    for (const action of actions) {
      if (action.type === 'push' || action.type === 'shot') aggressive++;
      if (action.type === 'retreat' || action.type === 'hold') passive++;
    }

    const total = aggressive + passive;
    if (total === 0) return 0.5;

    return aggressive / total;
  }

  /**
   * Get default analysis when not enough data
   */
  private getDefaultAnalysis(): FlowAnalysis {
    return {
      playstyle: 'balanced',
      confidence: 0,
      counterWeights: {
        STRAFE: 1.0,
        PEEK: 1.0,
        PUSH: 1.0,
        RETREAT: 1.0,
        HOLD: 1.0,
        FLANK: 1.0,
      },
      recentTrend: 'stable',
    };
  }

  /**
   * Remove old data outside the window
   */
  private pruneOldData(): void {
    const cutoff = Date.now() - WINDOW_MS;
    this.actions = this.actions.filter(a => a.timestamp > cutoff);
  }

  /**
   * Reset all tracking
   */
  reset(): void {
    this.actions = [];
    this.outcomes = [];
    this.lastAnalysis = null;
  }
}
