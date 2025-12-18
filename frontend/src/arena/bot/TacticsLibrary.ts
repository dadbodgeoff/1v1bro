/**
 * TacticsLibrary - Collection of atomic tactical patterns for combat bots
 * 
 * Defines movement/aim/shoot behaviors that can be composed into
 * engagement phrases and signature moves.
 */

import type {
  BotState,
  TacticalPattern,
  TacticalPatternType,
} from './types';

/**
 * All available tactical patterns
 */
const PATTERNS: TacticalPattern[] = [
  // ============================================================================
  // STRAFE Patterns - Lateral movement while engaging
  // ============================================================================
  {
    id: 'strafe-left',
    type: 'STRAFE',
    duration: 800,
    minAggression: 0.3,
    maxAggression: 0.8,
    requiresCover: false,
    minHealth: 0.2,
    movementPath: 'linear',
    aimBehavior: 'track',
    shootBehavior: 'continuous',
    riskLevel: 0.4,
    exposureTime: 800,
  },
  {
    id: 'strafe-right',
    type: 'STRAFE',
    duration: 800,
    minAggression: 0.3,
    maxAggression: 0.8,
    requiresCover: false,
    minHealth: 0.2,
    movementPath: 'linear',
    aimBehavior: 'track',
    shootBehavior: 'continuous',
    riskLevel: 0.4,
    exposureTime: 800,
  },
  {
    id: 'strafe-random',
    type: 'STRAFE',
    duration: 1200,
    minAggression: 0.4,
    maxAggression: 0.9,
    requiresCover: false,
    minHealth: 0.3,
    movementPath: 'zigzag',
    aimBehavior: 'track',
    shootBehavior: 'burst',
    riskLevel: 0.5,
    exposureTime: 1200,
  },

  // ============================================================================
  // PEEK Patterns - Quick exposure from cover
  // ============================================================================
  {
    id: 'peek-quick',
    type: 'PEEK',
    duration: 400,
    minAggression: 0.2,
    maxAggression: 0.6,
    requiresCover: true,
    minHealth: 0.1,
    movementPath: 'linear',
    aimBehavior: 'predictive',
    shootBehavior: 'tap',
    riskLevel: 0.2,
    exposureTime: 200,
  },
  {
    id: 'peek-slow',
    type: 'PEEK',
    duration: 800,
    minAggression: 0.3,
    maxAggression: 0.7,
    requiresCover: true,
    minHealth: 0.2,
    movementPath: 'linear',
    aimBehavior: 'track',
    shootBehavior: 'burst',
    riskLevel: 0.3,
    exposureTime: 500,
  },
  {
    id: 'peek-double',
    type: 'PEEK',
    duration: 1000,
    minAggression: 0.4,
    maxAggression: 0.8,
    requiresCover: true,
    minHealth: 0.3,
    movementPath: 'zigzag',
    aimBehavior: 'predictive',
    shootBehavior: 'burst',
    riskLevel: 0.4,
    exposureTime: 600,
  },

  // ============================================================================
  // PUSH Patterns - Aggressive forward movement
  // ============================================================================
  {
    id: 'push-direct',
    type: 'PUSH',
    duration: 1500,
    minAggression: 0.6,
    maxAggression: 1.0,
    requiresCover: false,
    minHealth: 0.4,
    movementPath: 'linear',
    aimBehavior: 'track',
    shootBehavior: 'continuous',
    riskLevel: 0.7,
    exposureTime: 1500,
  },
  {
    id: 'push-angled',
    type: 'PUSH',
    duration: 1800,
    minAggression: 0.5,
    maxAggression: 0.9,
    requiresCover: false,
    minHealth: 0.35,
    movementPath: 'arc',
    aimBehavior: 'predictive',
    shootBehavior: 'burst',
    riskLevel: 0.6,
    exposureTime: 1400,
  },

  // ============================================================================
  // RETREAT Patterns - Defensive backward movement
  // ============================================================================
  {
    id: 'retreat-back',
    type: 'RETREAT',
    duration: 1000,
    minAggression: 0.0,
    maxAggression: 0.4,
    requiresCover: false,
    minHealth: 0.0,
    movementPath: 'linear',
    aimBehavior: 'track',
    shootBehavior: 'tap',
    riskLevel: 0.3,
    exposureTime: 1000,
  },
  {
    id: 'retreat-diagonal',
    type: 'RETREAT',
    duration: 1200,
    minAggression: 0.1,
    maxAggression: 0.5,
    requiresCover: false,
    minHealth: 0.1,
    movementPath: 'arc',
    aimBehavior: 'track',
    shootBehavior: 'burst',
    riskLevel: 0.35,
    exposureTime: 1000,
  },

  // ============================================================================
  // HOLD Patterns - Stationary defensive positions
  // ============================================================================
  {
    id: 'hold-angle',
    type: 'HOLD',
    duration: 2000,
    minAggression: 0.2,
    maxAggression: 0.5,
    requiresCover: true,
    minHealth: 0.2,
    movementPath: 'none',
    aimBehavior: 'hold',
    shootBehavior: 'tap',
    riskLevel: 0.2,
    exposureTime: 500,
  },
  {
    id: 'hold-crouch',
    type: 'HOLD',
    duration: 1500,
    minAggression: 0.1,
    maxAggression: 0.4,
    requiresCover: true,
    minHealth: 0.1,
    movementPath: 'none',
    aimBehavior: 'hold',
    shootBehavior: 'tap',
    riskLevel: 0.15,
    exposureTime: 300,
  },

  // ============================================================================
  // FLANK Patterns - Repositioning to attack from side
  // ============================================================================
  {
    id: 'flank-left',
    type: 'FLANK',
    duration: 2000,
    minAggression: 0.4,
    maxAggression: 0.8,
    requiresCover: false,
    minHealth: 0.3,
    movementPath: 'arc',
    aimBehavior: 'sweep',
    shootBehavior: 'none',
    riskLevel: 0.5,
    exposureTime: 1000,
  },
  {
    id: 'flank-right',
    type: 'FLANK',
    duration: 2000,
    minAggression: 0.4,
    maxAggression: 0.8,
    requiresCover: false,
    minHealth: 0.3,
    movementPath: 'arc',
    aimBehavior: 'sweep',
    shootBehavior: 'none',
    riskLevel: 0.5,
    exposureTime: 1000,
  },
];

/**
 * Pattern index by ID for fast lookup
 */
const PATTERN_BY_ID = new Map<string, TacticalPattern>(
  PATTERNS.map(p => [p.id, p])
);

/**
 * Pattern index by type
 */
const PATTERNS_BY_TYPE = new Map<TacticalPatternType, TacticalPattern[]>();
for (const pattern of PATTERNS) {
  const list = PATTERNS_BY_TYPE.get(pattern.type) ?? [];
  list.push(pattern);
  PATTERNS_BY_TYPE.set(pattern.type, list);
}

/**
 * State to pattern type mapping (what patterns make sense in each state)
 */
const STATE_PATTERN_TYPES: Record<BotState, TacticalPatternType[]> = {
  PATROL: ['STRAFE', 'HOLD'],
  ENGAGE: ['STRAFE', 'PEEK', 'PUSH', 'HOLD'],
  RETREAT: ['RETREAT', 'PEEK'],
  REPOSITION: ['FLANK', 'STRAFE', 'RETREAT'],
  EXECUTING_SIGNATURE: [], // Signature controls patterns
};

export class TacticsLibrary {
  private lastPatternId: string | null = null;

  /**
   * Get a pattern by ID
   */
  getPattern(id: string): TacticalPattern | undefined {
    return PATTERN_BY_ID.get(id);
  }

  /**
   * Get all patterns of a specific type
   */
  getPatternsByType(type: TacticalPatternType): TacticalPattern[] {
    return PATTERNS_BY_TYPE.get(type) ?? [];
  }

  /**
   * Get all available patterns
   */
  getAllPatterns(): TacticalPattern[] {
    return [...PATTERNS];
  }

  /**
   * Select a pattern based on current state and aggression
   */
  selectPattern(
    state: BotState,
    aggression: number,
    healthRatio: number = 1.0,
    hasCover: boolean = false,
    weights?: Partial<Record<TacticalPatternType, number>>
  ): TacticalPattern {
    const allowedTypes = STATE_PATTERN_TYPES[state];
    
    // Filter patterns that match current conditions
    const candidates = PATTERNS.filter(p => {
      // Must be allowed type for state
      if (!allowedTypes.includes(p.type)) return false;
      
      // Must match aggression range
      if (aggression < p.minAggression || aggression > p.maxAggression) return false;
      
      // Must have enough health
      if (healthRatio < p.minHealth) return false;
      
      // Must have cover if required
      if (p.requiresCover && !hasCover) return false;
      
      return true;
    });

    if (candidates.length === 0) {
      // Fallback: return a basic strafe
      return PATTERN_BY_ID.get('strafe-left')!;
    }

    // Score candidates
    const scored = candidates.map(p => {
      let score = 1.0;
      
      // Apply personality weights
      if (weights && weights[p.type] !== undefined) {
        score *= weights[p.type]!;
      }
      
      // Prefer patterns that match aggression level
      const aggressionMid = (p.minAggression + p.maxAggression) / 2;
      const aggressionFit = 1 - Math.abs(aggression - aggressionMid);
      score *= (0.5 + aggressionFit * 0.5);
      
      // Avoid repeating same pattern
      if (p.id === this.lastPatternId) {
        score *= 0.3;
      }
      
      // Add some randomness
      score *= (0.8 + Math.random() * 0.4);
      
      return { pattern: p, score };
    });

    // Sort by score and pick best
    scored.sort((a, b) => b.score - a.score);
    const selected = scored[0].pattern;
    
    this.lastPatternId = selected.id;
    return selected;
  }

  /**
   * Get patterns suitable for a specific aggression level
   */
  getPatternsForAggression(aggression: number): TacticalPattern[] {
    return PATTERNS.filter(p => 
      aggression >= p.minAggression && aggression <= p.maxAggression
    );
  }

  /**
   * Reset pattern history
   */
  reset(): void {
    this.lastPatternId = null;
  }
}
