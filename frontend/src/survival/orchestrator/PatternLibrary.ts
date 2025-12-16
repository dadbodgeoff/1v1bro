/**
 * PatternLibrary - Defines all obstacle patterns as data
 * Patterns are pre-designed sequences that create intentional gameplay moments
 * 
 * Obstacle types and behaviors:
 * - laneBarrier: Blocks ONE lane (vertical), dodge left/right to avoid
 * - lowBarrier: Spans ALL lanes, MUST jump over (no dodging)
 * - spikes: Center lane hazard, can dodge left/right OR jump over
 * - knowledgeGate: Trivia trigger (not a damage obstacle)
 * 
 * NOTE: highBarrier removed - only using laneBarrier, lowBarrier, spikes, knowledgeGate
 */

import type { ObstaclePattern, ObstaclePlacement } from './types'
import type { Lane } from '../types/survival'

/**
 * Helper to create placements more concisely
 */
const placement = (
  type: 'laneBarrier' | 'lowBarrier' | 'knowledgeGate' | 'spikes',
  lane: Lane,
  offsetZ: number
): ObstaclePlacement => ({ type, lane, offsetZ })

/**
 * All available obstacle patterns
 * Organized by complexity/difficulty
 * 
 * Only using: laneBarrier (dodge), spikes (jump), knowledgeGate (trivia)
 */
export const PATTERN_LIBRARY: ObstaclePattern[] = [
  // ============================================
  // ROOKIE PATTERNS - Single obstacles, simple
  // ============================================
  {
    id: 'single-dodge-left',
    name: 'Dodge Left',
    description: 'Lane barrier on right, dodge left',
    placements: [placement('laneBarrier', 1, 0)],
    length: 5,
    minDifficulty: 'rookie',
    maxDifficulty: null,
    requiredActions: ['laneLeft', 'laneChange'],
    allowedAfter: [],
    forbiddenAfter: [],
    baseWeight: 1.0,
    cooldownPatterns: 1,
  },
  {
    id: 'single-dodge-right',
    name: 'Dodge Right',
    description: 'Lane barrier on left, dodge right',
    placements: [placement('laneBarrier', -1, 0)],
    length: 5,
    minDifficulty: 'rookie',
    maxDifficulty: null,
    requiredActions: ['laneRight', 'laneChange'],
    allowedAfter: [],
    forbiddenAfter: [],
    baseWeight: 1.0,
    cooldownPatterns: 1,
  },
  {
    id: 'center-block',
    name: 'Center Block',
    description: 'Lane barrier in center, pick a side',
    placements: [placement('laneBarrier', 0, 0)],
    length: 5,
    minDifficulty: 'rookie',
    maxDifficulty: null,
    requiredActions: ['laneChange'],
    allowedAfter: [],
    forbiddenAfter: [],
    baseWeight: 1.2,
    cooldownPatterns: 1,
  },
  {
    id: 'single-spikes',
    name: 'Single Spikes',
    description: 'Ground spikes in center lane - jump over',
    placements: [placement('spikes', 0, 0)],
    length: 5,
    minDifficulty: 'rookie',
    maxDifficulty: 'advanced',
    requiredActions: ['jump'],
    allowedAfter: [],
    forbiddenAfter: [],
    baseWeight: 0.9,
    cooldownPatterns: 2,
  },
  {
    id: 'spikes-left',
    name: 'Left Spikes',
    description: 'Ground spikes on left lane',
    placements: [placement('spikes', -1, 0)],
    length: 5,
    minDifficulty: 'rookie',
    maxDifficulty: null,
    requiredActions: ['jump', 'laneChange'],
    allowedAfter: [],
    forbiddenAfter: [],
    baseWeight: 0.8,
    cooldownPatterns: 2,
  },
  {
    id: 'spikes-right',
    name: 'Right Spikes',
    description: 'Ground spikes on right lane',
    placements: [placement('spikes', 1, 0)],
    length: 5,
    minDifficulty: 'rookie',
    maxDifficulty: null,
    requiredActions: ['jump', 'laneChange'],
    allowedAfter: [],
    forbiddenAfter: [],
    baseWeight: 0.8,
    cooldownPatterns: 2,
  },
  {
    id: 'single-jump-gate',
    name: 'Jump Gate',
    description: 'Neon gate spanning all lanes - MUST jump over',
    placements: [placement('lowBarrier', 0, 0)],
    length: 5,
    minDifficulty: 'rookie',
    maxDifficulty: null,
    requiredActions: ['jump'],
    allowedAfter: [],
    forbiddenAfter: [],
    baseWeight: 0.9,
    cooldownPatterns: 2,
  },

  // ============================================
  // INTERMEDIATE PATTERNS - Two obstacles, timing
  // ============================================
  {
    id: 'lane-weave-simple',
    name: 'Simple Weave',
    description: 'Two lane barriers requiring weave',
    placements: [
      placement('laneBarrier', -1, 0),
      placement('laneBarrier', 1, 10),
    ],
    length: 15,
    minDifficulty: 'intermediate',
    maxDifficulty: null,
    requiredActions: ['laneRight', 'laneLeft'],
    allowedAfter: [],
    forbiddenAfter: [],
    baseWeight: 0.9,
    cooldownPatterns: 2,
  },
  {
    id: 'double-side',
    name: 'Double Side Block',
    description: 'Both side lanes blocked, stay center',
    placements: [
      placement('laneBarrier', -1, 0),
      placement('laneBarrier', 1, 0),
    ],
    length: 5,
    minDifficulty: 'intermediate',
    maxDifficulty: null,
    requiredActions: [],
    allowedAfter: [],
    forbiddenAfter: ['center-block'],
    baseWeight: 0.7,
    cooldownPatterns: 3,
  },
  {
    id: 'left-center-block',
    name: 'Left & Center Block',
    description: 'Left and center lanes blocked, go right',
    placements: [
      placement('laneBarrier', -1, 0),
      placement('laneBarrier', 0, 0),
    ],
    length: 5,
    minDifficulty: 'intermediate',
    maxDifficulty: null,
    requiredActions: ['laneRight'],
    allowedAfter: [],
    forbiddenAfter: ['right-center-block'],
    baseWeight: 0.6,
    cooldownPatterns: 3,
  },
  {
    id: 'right-center-block',
    name: 'Right & Center Block',
    description: 'Right and center lanes blocked, go left',
    placements: [
      placement('laneBarrier', 1, 0),
      placement('laneBarrier', 0, 0),
    ],
    length: 5,
    minDifficulty: 'intermediate',
    maxDifficulty: null,
    requiredActions: ['laneLeft'],
    allowedAfter: [],
    forbiddenAfter: ['left-center-block'],
    baseWeight: 0.6,
    cooldownPatterns: 3,
  },
  {
    id: 'double-spikes',
    name: 'Double Spikes',
    description: 'Two spike patches in sequence',
    placements: [
      placement('spikes', -1, 0),
      placement('spikes', 1, 10),
    ],
    length: 15,
    minDifficulty: 'intermediate',
    maxDifficulty: null,
    requiredActions: ['jump', 'laneChange'],
    allowedAfter: [],
    forbiddenAfter: [],
    baseWeight: 0.6,
    cooldownPatterns: 3,
  },
  {
    id: 'spikes-dodge',
    name: 'Spikes then Dodge',
    description: 'Jump spikes then dodge lane barrier',
    placements: [
      placement('spikes', 0, 0),
      placement('laneBarrier', 0, 12),
    ],
    length: 17,
    minDifficulty: 'intermediate',
    maxDifficulty: 'expert',
    requiredActions: ['jump', 'laneChange'],
    allowedAfter: [],
    forbiddenAfter: ['spikes-dodge'],
    baseWeight: 0.7,
    cooldownPatterns: 3,
  },
  {
    id: 'double-jump',
    name: 'Double Jump',
    description: 'Two jump gates in sequence - must jump both',
    placements: [
      placement('lowBarrier', 0, 0),
      placement('lowBarrier', 0, 12),
    ],
    length: 17,
    minDifficulty: 'intermediate',
    maxDifficulty: null,
    requiredActions: ['jump'],
    allowedAfter: [],
    forbiddenAfter: [],
    baseWeight: 0.6,
    cooldownPatterns: 3,
  },
  {
    id: 'jump-then-dodge',
    name: 'Jump then Dodge',
    description: 'Jump gate (all lanes) then lane barrier',
    placements: [
      placement('lowBarrier', 0, 0),
      placement('laneBarrier', 0, 14),
    ],
    length: 19,
    minDifficulty: 'intermediate',
    maxDifficulty: null,
    requiredActions: ['jump', 'laneChange'],
    allowedAfter: [],
    forbiddenAfter: [],
    baseWeight: 0.7,
    cooldownPatterns: 3,
  },

  // ============================================
  // ADVANCED PATTERNS - Three+ obstacles, combos
  // ============================================
  {
    id: 'triple-weave',
    name: 'Triple Weave',
    description: 'Three lane barriers in sequence',
    placements: [
      placement('laneBarrier', 0, 0),
      placement('laneBarrier', -1, 8),
      placement('laneBarrier', 1, 16),
    ],
    length: 21,
    minDifficulty: 'advanced',
    maxDifficulty: null,
    requiredActions: ['laneChange'],
    allowedAfter: [],
    forbiddenAfter: ['triple-weave'],
    baseWeight: 0.6,
    cooldownPatterns: 4,
  },
  {
    id: 'spikes-weave',
    name: 'Spikes Weave',
    description: 'Jump spikes, then weave through barriers',
    placements: [
      placement('spikes', 0, 0),
      placement('laneBarrier', -1, 10),
      placement('laneBarrier', 1, 18),
    ],
    length: 23,
    minDifficulty: 'advanced',
    maxDifficulty: null,
    requiredActions: ['jump', 'laneChange'],
    allowedAfter: [],
    forbiddenAfter: [],
    baseWeight: 0.5,
    cooldownPatterns: 4,
  },
  {
    id: 'corridor-spikes',
    name: 'Corridor with Spikes',
    description: 'Sides blocked, spikes in center',
    placements: [
      placement('laneBarrier', -1, 0),
      placement('laneBarrier', 1, 0),
      placement('spikes', 0, 12),
    ],
    length: 17,
    minDifficulty: 'advanced',
    maxDifficulty: null,
    requiredActions: ['jump'],
    allowedAfter: [],
    forbiddenAfter: ['corridor-spikes'],
    baseWeight: 0.5,
    cooldownPatterns: 4,
  },

  // ============================================
  // EXPERT PATTERNS - Complex sequences
  // ============================================
  {
    id: 'rapid-weave',
    name: 'Rapid Weave',
    description: 'Fast lane changes required',
    placements: [
      placement('laneBarrier', 0, 0),
      placement('laneBarrier', 1, 6),
      placement('laneBarrier', -1, 12),
      placement('laneBarrier', 0, 18),
    ],
    length: 23,
    minDifficulty: 'expert',
    maxDifficulty: null,
    requiredActions: ['laneChange'],
    allowedAfter: [],
    forbiddenAfter: ['rapid-weave', 'triple-weave'],
    baseWeight: 0.4,
    cooldownPatterns: 5,
  },
  {
    id: 'spike-gauntlet',
    name: 'Spike Gauntlet',
    description: 'Multiple spikes with lane barriers',
    placements: [
      placement('spikes', 0, 0),
      placement('laneBarrier', -1, 8),
      placement('spikes', 1, 16),
      placement('laneBarrier', 0, 24),
    ],
    length: 29,
    minDifficulty: 'expert',
    maxDifficulty: null,
    requiredActions: ['jump', 'laneChange'],
    allowedAfter: [],
    forbiddenAfter: ['spike-gauntlet'],
    baseWeight: 0.3,
    cooldownPatterns: 6,
  },

  // ============================================
  // MASTER PATTERNS - Ultimate challenges
  // ============================================
  {
    id: 'death-corridor',
    name: 'Death Corridor',
    description: 'Narrow path with precise timing',
    placements: [
      placement('laneBarrier', -1, 0),
      placement('laneBarrier', 1, 0),
      placement('spikes', 0, 8),
      placement('laneBarrier', -1, 16),
      placement('laneBarrier', 1, 16),
      placement('spikes', 0, 24),
      placement('laneBarrier', -1, 32),
      placement('laneBarrier', 1, 32),
    ],
    length: 37,
    minDifficulty: 'master',
    maxDifficulty: null,
    requiredActions: ['jump'],
    allowedAfter: [],
    forbiddenAfter: ['death-corridor', 'spike-gauntlet'],
    baseWeight: 0.2,
    cooldownPatterns: 8,
  },

  // ============================================
  // KNOWLEDGE GATE PATTERNS
  // ============================================
  {
    id: 'knowledge-solo',
    name: 'Knowledge Gate',
    description: 'Single knowledge gate for trivia',
    placements: [placement('knowledgeGate', 0, 0)],
    length: 10,
    minDifficulty: 'rookie',
    maxDifficulty: null,
    requiredActions: [],
    allowedAfter: [],
    forbiddenAfter: ['knowledge-solo'],
    baseWeight: 0.15,
    cooldownPatterns: 10,
  },
]

/**
 * PatternLibrary class for querying patterns
 */
export class PatternLibrary {
  private patterns: Map<string, ObstaclePattern> = new Map()
  private patternsByDifficulty: Map<string, ObstaclePattern[]> = new Map()

  constructor() {
    this.indexPatterns()
  }

  private indexPatterns(): void {
    const difficulties = ['rookie', 'intermediate', 'advanced', 'expert', 'master']
    
    // Initialize difficulty buckets
    difficulties.forEach(d => this.patternsByDifficulty.set(d, []))

    // Index all patterns
    PATTERN_LIBRARY.forEach(pattern => {
      this.patterns.set(pattern.id, pattern)
      
      // Add to all applicable difficulty buckets
      const minIndex = difficulties.indexOf(pattern.minDifficulty)
      const maxIndex = pattern.maxDifficulty 
        ? difficulties.indexOf(pattern.maxDifficulty)
        : difficulties.length - 1

      for (let i = minIndex; i <= maxIndex; i++) {
        this.patternsByDifficulty.get(difficulties[i])?.push(pattern)
      }
    })
  }

  getPattern(id: string): ObstaclePattern | undefined {
    return this.patterns.get(id)
  }

  getPatternsForDifficulty(difficulty: string): ObstaclePattern[] {
    return this.patternsByDifficulty.get(difficulty) || []
  }

  getAllPatterns(): ObstaclePattern[] {
    return PATTERN_LIBRARY
  }
}
