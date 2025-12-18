/**
 * EngagementComposer - Composes tactical patterns into engagement phrases
 * 
 * Creates coherent sequences of patterns that flow naturally together,
 * respecting aggression levels and player state.
 */

import type {
  BotInput,
  BotState,
  EngagementPhrase,
  EngagementPhraseType,
  TacticalPattern,
  TacticalPatternType,
} from './types';
import { TacticsLibrary } from './TacticsLibrary';
import type { CombatFlowAnalyzer } from './CombatFlowAnalyzer';

/**
 * Phrase template defining pattern sequence structure
 */
interface PhraseTemplate {
  type: EngagementPhraseType;
  patternTypes: TacticalPatternType[];
  minAggression: number;
  maxAggression: number;
  minHealth: number;
}

/**
 * Phrase templates for different engagement types
 */
const PHRASE_TEMPLATES: PhraseTemplate[] = [
  // Pressure phrases - sustained aggression
  {
    type: 'pressure',
    patternTypes: ['PUSH', 'STRAFE', 'PUSH'],
    minAggression: 0.6,
    maxAggression: 1.0,
    minHealth: 0.4,
  },
  {
    type: 'pressure',
    patternTypes: ['STRAFE', 'PUSH', 'STRAFE'],
    minAggression: 0.55,
    maxAggression: 0.9,
    minHealth: 0.35,
  },

  // Probe phrases - testing player reactions
  {
    type: 'probe',
    patternTypes: ['PEEK', 'STRAFE', 'PEEK'],
    minAggression: 0.3,
    maxAggression: 0.7,
    minHealth: 0.2,
  },
  {
    type: 'probe',
    patternTypes: ['STRAFE', 'PEEK', 'HOLD'],
    minAggression: 0.25,
    maxAggression: 0.65,
    minHealth: 0.2,
  },

  // Punish phrases - capitalizing on player mistakes
  {
    type: 'punish',
    patternTypes: ['HOLD', 'PUSH', 'STRAFE'],
    minAggression: 0.4,
    maxAggression: 0.8,
    minHealth: 0.3,
  },
  {
    type: 'punish',
    patternTypes: ['PEEK', 'PUSH', 'PUSH'],
    minAggression: 0.5,
    maxAggression: 0.9,
    minHealth: 0.4,
  },

  // Reset phrases - disengaging and repositioning
  {
    type: 'reset',
    patternTypes: ['RETREAT', 'FLANK', 'HOLD'],
    minAggression: 0.1,
    maxAggression: 0.5,
    minHealth: 0.1,
  },
  {
    type: 'reset',
    patternTypes: ['RETREAT', 'STRAFE', 'RETREAT'],
    minAggression: 0.0,
    maxAggression: 0.4,
    minHealth: 0.0,
  },
];

/**
 * Transition compatibility between pattern types
 * Higher value = smoother transition
 */
const TRANSITION_SCORES: Record<TacticalPatternType, Record<TacticalPatternType, number>> = {
  STRAFE: { STRAFE: 0.8, PEEK: 0.9, PUSH: 0.7, RETREAT: 0.6, HOLD: 0.7, FLANK: 0.8 },
  PEEK: { STRAFE: 0.9, PEEK: 0.7, PUSH: 0.8, RETREAT: 0.8, HOLD: 0.9, FLANK: 0.6 },
  PUSH: { STRAFE: 0.8, PEEK: 0.5, PUSH: 0.6, RETREAT: 0.4, HOLD: 0.5, FLANK: 0.7 },
  RETREAT: { STRAFE: 0.7, PEEK: 0.8, PUSH: 0.4, RETREAT: 0.6, HOLD: 0.8, FLANK: 0.9 },
  HOLD: { STRAFE: 0.7, PEEK: 0.9, PUSH: 0.6, RETREAT: 0.8, HOLD: 0.5, FLANK: 0.6 },
  FLANK: { STRAFE: 0.8, PEEK: 0.7, PUSH: 0.8, RETREAT: 0.7, HOLD: 0.6, FLANK: 0.5 },
};

export class EngagementComposer {
  private tacticsLibrary: TacticsLibrary;
  private flowAnalyzer: CombatFlowAnalyzer | null;
  private lastPhraseType: EngagementPhraseType | null = null;
  private phraseCounter: number = 0;

  constructor(tacticsLibrary: TacticsLibrary, flowAnalyzer?: CombatFlowAnalyzer) {
    this.tacticsLibrary = tacticsLibrary;
    this.flowAnalyzer = flowAnalyzer ?? null;
  }

  /**
   * Compose an engagement phrase for current situation
   */
  compose(
    state: BotState,
    aggression: number,
    input: BotInput,
    hasCover: boolean = false
  ): EngagementPhrase | null {
    const healthRatio = input.botHealth / input.botMaxHealth;

    // Find suitable templates
    const candidates = PHRASE_TEMPLATES.filter(t =>
      aggression >= t.minAggression &&
      aggression <= t.maxAggression &&
      healthRatio >= t.minHealth
    );

    if (candidates.length === 0) {
      return null;
    }

    // Score templates
    const scored = candidates.map(template => {
      let score = 1.0;

      // Prefer phrases that match current state
      score *= this.getStateScore(state, template.type);

      // Avoid repeating same phrase type
      if (template.type === this.lastPhraseType) {
        score *= 0.5;
      }

      // Apply flow analyzer weights if available
      if (this.flowAnalyzer) {
        const weights = this.flowAnalyzer.getCounterWeights();
        for (const patternType of template.patternTypes) {
          score *= weights[patternType] ?? 1.0;
        }
      }

      // Add randomness
      score *= 0.8 + Math.random() * 0.4;

      return { template, score };
    });

    // Select best template
    scored.sort((a, b) => b.score - a.score);
    const selectedTemplate = scored[0].template;

    // Build phrase from template
    const phrase = this.buildPhrase(
      selectedTemplate,
      aggression,
      healthRatio,
      hasCover
    );

    this.lastPhraseType = selectedTemplate.type;
    this.phraseCounter++;

    return phrase;
  }

  /**
   * Build a phrase from a template
   */
  private buildPhrase(
    template: PhraseTemplate,
    aggression: number,
    healthRatio: number,
    hasCover: boolean
  ): EngagementPhrase {
    const patterns: TacticalPattern[] = [];
    let totalDuration = 0;

    // Get counter weights if available
    const weights = this.flowAnalyzer?.getCounterWeights();

    for (let i = 0; i < template.patternTypes.length; i++) {
      const patternType = template.patternTypes[i];
      const availablePatterns = this.tacticsLibrary.getPatternsByType(patternType);

      // Filter patterns that match conditions
      const validPatterns = availablePatterns.filter(p =>
        aggression >= p.minAggression &&
        aggression <= p.maxAggression &&
        healthRatio >= p.minHealth &&
        (!p.requiresCover || hasCover)
      );

      if (validPatterns.length === 0) {
        // Fallback to any pattern of this type
        const fallback = availablePatterns[0];
        if (fallback) {
          patterns.push(fallback);
          totalDuration += fallback.duration;
        }
        continue;
      }

      // Score patterns
      const scoredPatterns = validPatterns.map(p => {
        let score = 1.0;

        // Apply personality weights
        if (weights) {
          score *= weights[p.type] ?? 1.0;
        }

        // Prefer smooth transitions
        if (i > 0) {
          const prevType = patterns[i - 1].type;
          score *= TRANSITION_SCORES[prevType][p.type] ?? 0.5;
        }

        // Prefer patterns that match aggression level
        const aggressionMid = (p.minAggression + p.maxAggression) / 2;
        const aggressionFit = 1 - Math.abs(aggression - aggressionMid);
        score *= 0.7 + aggressionFit * 0.3;

        // Add randomness
        score *= 0.9 + Math.random() * 0.2;

        return { pattern: p, score };
      });

      scoredPatterns.sort((a, b) => b.score - a.score);
      const selected = scoredPatterns[0].pattern;

      patterns.push(selected);
      totalDuration += selected.duration;
    }

    return {
      id: `phrase-${this.phraseCounter}`,
      type: template.type,
      patterns,
      totalDuration,
    };
  }

  /**
   * Get score for how well a phrase type matches current state
   */
  private getStateScore(state: BotState, phraseType: EngagementPhraseType): number {
    const scores: Record<BotState, Record<EngagementPhraseType, number>> = {
      PATROL: { pressure: 0.5, probe: 1.0, punish: 0.6, reset: 0.8 },
      ENGAGE: { pressure: 1.0, probe: 0.8, punish: 0.9, reset: 0.4 },
      RETREAT: { pressure: 0.2, probe: 0.5, punish: 0.3, reset: 1.0 },
      REPOSITION: { pressure: 0.4, probe: 0.7, punish: 0.5, reset: 0.9 },
      EXECUTING_SIGNATURE: { pressure: 0.5, probe: 0.5, punish: 0.5, reset: 0.5 },
    };

    return scores[state]?.[phraseType] ?? 0.5;
  }

  /**
   * Check if a transition between patterns is smooth
   */
  isSmooth(from: TacticalPattern, to: TacticalPattern): boolean {
    const score = TRANSITION_SCORES[from.type]?.[to.type] ?? 0.5;
    return score >= 0.7;
  }

  /**
   * Get transition score between two pattern types
   */
  getTransitionScore(from: TacticalPatternType, to: TacticalPatternType): number {
    return TRANSITION_SCORES[from]?.[to] ?? 0.5;
  }

  /**
   * Reset state
   */
  reset(): void {
    this.lastPhraseType = null;
    this.phraseCounter = 0;
  }
}
