/**
 * BotPersonality - Personality configurations and difficulty presets
 * 
 * Defines the three bot personalities (Rusher, Sentinel, Duelist)
 * and four difficulty levels (Easy, Medium, Hard, Adaptive).
 */

import type {
  BotPersonalityConfig,
  BotPersonalityType,
  DifficultyLevel,
  DifficultyPreset,
} from './types';

/**
 * Bot personality configurations
 */
export const BOT_PERSONALITIES: Record<BotPersonalityType, BotPersonalityConfig> = {
  rusher: {
    type: 'rusher',
    displayName: 'Blitz',
    baseAggression: 0.7,
    aggressionVolatility: 0.3,
    tacticWeights: {
      STRAFE: 1.2,
      PEEK: 0.6,
      PUSH: 1.5,
      RETREAT: 0.5,
      HOLD: 0.3,
      FLANK: 1.3,
    },
    reactionTimeMs: 200,
    accuracyBase: 0.7,
    trackingSkill: 0.8,
    signatures: ['double-push', 'bait-and-rush', 'corner-slide'],
    mercyThreshold: 0.8,
    mercyDuration: 3000,
  },

  sentinel: {
    type: 'sentinel',
    displayName: 'Warden',
    baseAggression: 0.35,
    aggressionVolatility: 0.15,
    tacticWeights: {
      STRAFE: 0.8,
      PEEK: 1.4,
      PUSH: 0.4,
      RETREAT: 1.2,
      HOLD: 1.6,
      FLANK: 0.5,
    },
    reactionTimeMs: 180,
    accuracyBase: 0.85,
    trackingSkill: 0.6,
    signatures: ['angle-hold', 'bait-peek', 'punish-push'],
    mercyThreshold: 0.7,
    mercyDuration: 4000,
  },

  duelist: {
    type: 'duelist',
    displayName: 'Echo',
    baseAggression: 0.5,
    aggressionVolatility: 0.25,
    tacticWeights: {
      STRAFE: 1.0,
      PEEK: 1.0,
      PUSH: 1.0,
      RETREAT: 1.0,
      HOLD: 1.0,
      FLANK: 1.0,
    },
    reactionTimeMs: 220,
    accuracyBase: 0.75,
    trackingSkill: 0.75,
    signatures: ['mirror-play', 'counter-push', 'read-and-punish'],
    mercyThreshold: 0.75,
    mercyDuration: 3500,
  },
};

/**
 * Difficulty presets
 */
export const DIFFICULTY_PRESETS: Record<DifficultyLevel, DifficultyPreset> = {
  easy: {
    name: 'easy',
    aggressionMultiplier: 0.7,
    reactionTimeMultiplier: 1.5,    // Slower reactions
    accuracyMultiplier: 0.7,        // Less accurate
    mercyEnabled: true,
    mercyThresholdMultiplier: 0.6,  // Mercy triggers easier
    useSignatures: false,           // No signature moves
    patternComplexity: 0.3,         // Simple patterns only
  },

  medium: {
    name: 'medium',
    aggressionMultiplier: 1.0,
    reactionTimeMultiplier: 1.0,
    accuracyMultiplier: 1.0,
    mercyEnabled: true,
    mercyThresholdMultiplier: 1.0,
    useSignatures: true,
    patternComplexity: 0.6,
  },

  hard: {
    name: 'hard',
    aggressionMultiplier: 1.2,
    reactionTimeMultiplier: 0.7,    // Faster reactions
    accuracyMultiplier: 1.2,        // More accurate
    mercyEnabled: false,            // No mercy
    mercyThresholdMultiplier: 1.5,
    useSignatures: true,
    patternComplexity: 1.0,         // All patterns available
  },

  adaptive: {
    name: 'adaptive',
    aggressionMultiplier: 1.0,
    reactionTimeMultiplier: 1.0,
    accuracyMultiplier: 1.0,
    mercyEnabled: true,
    mercyThresholdMultiplier: 0.8,  // Slightly easier mercy trigger
    useSignatures: true,
    patternComplexity: 0.8,
  },
};

/**
 * Get a personality by type
 */
export function getPersonality(type: BotPersonalityType): BotPersonalityConfig {
  return BOT_PERSONALITIES[type];
}

/**
 * Get a difficulty preset by level
 */
export function getDifficultyPreset(level: DifficultyLevel): DifficultyPreset {
  return DIFFICULTY_PRESETS[level];
}

/**
 * Get a random personality
 */
export function getRandomPersonality(): BotPersonalityConfig {
  const types: BotPersonalityType[] = ['rusher', 'sentinel', 'duelist'];
  const randomType = types[Math.floor(Math.random() * types.length)];
  return BOT_PERSONALITIES[randomType];
}

/**
 * Get all personality types
 */
export function getAllPersonalityTypes(): BotPersonalityType[] {
  return ['rusher', 'sentinel', 'duelist'];
}

/**
 * Get all difficulty levels
 */
export function getAllDifficultyLevels(): DifficultyLevel[] {
  return ['easy', 'medium', 'hard', 'adaptive'];
}

/**
 * Get personality display info for UI
 */
export function getPersonalityDisplayInfo(type: BotPersonalityType): {
  name: string;
  description: string;
  playstyle: string;
} {
  switch (type) {
    case 'rusher':
      return {
        name: 'Blitz',
        description: 'Aggressive attacker who pressures relentlessly',
        playstyle: 'High aggression, fast pushes, flanking maneuvers',
      };
    case 'sentinel':
      return {
        name: 'Warden',
        description: 'Defensive specialist who holds angles and punishes mistakes',
        playstyle: 'Low aggression, precise aim, patient positioning',
      };
    case 'duelist':
      return {
        name: 'Echo',
        description: 'Adaptive fighter who mirrors and counters your playstyle',
        playstyle: 'Balanced approach, reads opponent, flexible tactics',
      };
  }
}

/**
 * Get difficulty display info for UI
 */
export function getDifficultyDisplayInfo(level: DifficultyLevel): {
  name: string;
  description: string;
} {
  switch (level) {
    case 'easy':
      return {
        name: 'Easy',
        description: 'Slower reactions, less accurate, forgiving mercy system',
      };
    case 'medium':
      return {
        name: 'Medium',
        description: 'Balanced challenge with signature moves enabled',
      };
    case 'hard':
      return {
        name: 'Hard',
        description: 'Fast reactions, high accuracy, no mercy',
      };
    case 'adaptive':
      return {
        name: 'Adaptive',
        description: 'Adjusts to your skill level during the match',
      };
  }
}
