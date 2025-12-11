/**
 * BotPersonalitySystem - Human-like bot opponent generation
 * 
 * Generates randomized bot personalities with varied names, avatars,
 * and behavior patterns to make guest play feel more engaging.
 * 
 * @module game/guest/BotPersonalitySystem
 * Requirements: 7.2, 7.3
 */

/**
 * Bot personality configuration
 */
export interface BotPersonality {
  name: string
  avatarUrl: string
  difficulty: 'easy' | 'medium' | 'hard'
  behaviorBias: 'aggressive' | 'defensive' | 'balanced'
  quizSpeed: 'fast' | 'medium' | 'slow'
  tauntFrequency: number // 0-1, chance to taunt after events
}

/**
 * Bot behavior configuration derived from personality
 */
export interface BotBehaviorConfig {
  quizAccuracy: number      // 0-1, chance to answer correctly
  minAnswerTimeMs: number   // Minimum time to answer
  maxAnswerTimeMs: number   // Maximum time to answer
  shootCooldownMs: number   // Time between shots
  shootAccuracy: number     // 0-1, chance to aim at player
  aggroRange: number        // Distance to start chasing
  retreatHealthPct: number  // Health % to start evading
  reactionTimeMs: number    // Delay before reacting
}

/**
 * Pool of bot names - varied and memorable
 */
const BOT_NAME_POOL = [
  'QuizMaster_99',
  'TriviaKing',
  'BrainiacBot',
  'FactFinder',
  'KnowledgeNinja',
  'QuestionQueen',
  'SmartShooter',
  'WisdomWarrior',
  'MindMaster',
  'ThinkTank',
  'BrainStorm',
  'QuizWhiz',
  'FactChecker',
  'TriviaBot3000',
  'SmartAlec',
  'WittyBot',
]

/**
 * Avatar URLs for bots
 */
const BOT_AVATAR_POOL = [
  '/avatars/bot-1.png',
  '/avatars/bot-2.png',
  '/avatars/bot-3.png',
  '/avatars/bot-4.png',
  '/avatars/bot-5.png',
  '/avatars/bot-6.png',
]

/**
 * Behavior presets by difficulty
 */
const DIFFICULTY_PRESETS: Record<BotPersonality['difficulty'], Partial<BotBehaviorConfig>> = {
  easy: {
    quizAccuracy: 0.4,
    minAnswerTimeMs: 4000,
    maxAnswerTimeMs: 9000,
    shootCooldownMs: 1200,
    shootAccuracy: 0.5,
    reactionTimeMs: 400,
  },
  medium: {
    quizAccuracy: 0.55,
    minAnswerTimeMs: 2500,
    maxAnswerTimeMs: 8000,
    shootCooldownMs: 800,
    shootAccuracy: 0.7,
    reactionTimeMs: 200,
  },
  hard: {
    quizAccuracy: 0.75,
    minAnswerTimeMs: 1500,
    maxAnswerTimeMs: 5000,
    shootCooldownMs: 500,
    shootAccuracy: 0.85,
    reactionTimeMs: 100,
  },
}

/**
 * Behavior modifiers by bias
 */
const BIAS_MODIFIERS: Record<BotPersonality['behaviorBias'], Partial<BotBehaviorConfig>> = {
  aggressive: {
    aggroRange: 500,
    retreatHealthPct: 15,
  },
  defensive: {
    aggroRange: 300,
    retreatHealthPct: 40,
  },
  balanced: {
    aggroRange: 400,
    retreatHealthPct: 25,
  },
}

/**
 * BotPersonalitySystem class
 * 
 * Manages bot personality generation with uniqueness guarantees.
 */
export class BotPersonalitySystem {
  private static instance: BotPersonalitySystem | null = null
  private lastUsedName: string | null = null
  private usedNamesThisSession: Set<string> = new Set()

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): BotPersonalitySystem {
    if (!BotPersonalitySystem.instance) {
      BotPersonalitySystem.instance = new BotPersonalitySystem()
    }
    return BotPersonalitySystem.instance
  }

  /**
   * Reset singleton (for testing)
   */
  static resetInstance(): void {
    BotPersonalitySystem.instance = null
  }


  /**
   * Generate a random bot personality
   * Ensures no consecutive name repeats
   */
  generatePersonality(): BotPersonality {
    // Pick a name that's different from the last one
    let name: string
    const availableNames = BOT_NAME_POOL.filter(n => n !== this.lastUsedName)
    
    if (availableNames.length > 0) {
      name = availableNames[Math.floor(Math.random() * availableNames.length)]
    } else {
      // Fallback if somehow all names are used (shouldn't happen)
      name = BOT_NAME_POOL[Math.floor(Math.random() * BOT_NAME_POOL.length)]
    }
    
    this.lastUsedName = name
    this.usedNamesThisSession.add(name)

    // Random avatar
    const avatarUrl = BOT_AVATAR_POOL[Math.floor(Math.random() * BOT_AVATAR_POOL.length)]

    // Random difficulty (weighted toward medium for fair play)
    const difficultyRoll = Math.random()
    let difficulty: BotPersonality['difficulty']
    if (difficultyRoll < 0.25) {
      difficulty = 'easy'
    } else if (difficultyRoll < 0.85) {
      difficulty = 'medium'
    } else {
      difficulty = 'hard'
    }

    // Random behavior bias
    const biases: BotPersonality['behaviorBias'][] = ['aggressive', 'defensive', 'balanced']
    const behaviorBias = biases[Math.floor(Math.random() * biases.length)]

    // Quiz speed based on difficulty
    const quizSpeeds: BotPersonality['quizSpeed'][] = ['fast', 'medium', 'slow']
    const speedIndex = difficulty === 'hard' ? 0 : difficulty === 'medium' ? 1 : 2
    const quizSpeed = quizSpeeds[speedIndex]

    // Taunt frequency
    const tauntFrequency = 0.1 + Math.random() * 0.2 // 10-30%

    return {
      name,
      avatarUrl,
      difficulty,
      behaviorBias,
      quizSpeed,
      tauntFrequency,
    }
  }

  /**
   * Get behavior configuration for a personality
   */
  getBehaviorConfig(personality: BotPersonality): BotBehaviorConfig {
    const difficultyPreset = DIFFICULTY_PRESETS[personality.difficulty]
    const biasModifier = BIAS_MODIFIERS[personality.behaviorBias]

    return {
      quizAccuracy: difficultyPreset.quizAccuracy ?? 0.5,
      minAnswerTimeMs: difficultyPreset.minAnswerTimeMs ?? 3000,
      maxAnswerTimeMs: difficultyPreset.maxAnswerTimeMs ?? 7000,
      shootCooldownMs: difficultyPreset.shootCooldownMs ?? 800,
      shootAccuracy: difficultyPreset.shootAccuracy ?? 0.6,
      aggroRange: biasModifier.aggroRange ?? 400,
      retreatHealthPct: biasModifier.retreatHealthPct ?? 25,
      reactionTimeMs: difficultyPreset.reactionTimeMs ?? 200,
    }
  }

  /**
   * Get the last used name
   */
  getLastUsedName(): string | null {
    return this.lastUsedName
  }

  /**
   * Get all names used this session
   */
  getUsedNames(): string[] {
    return Array.from(this.usedNamesThisSession)
  }

  /**
   * Reset session tracking (for new game session)
   */
  resetSession(): void {
    this.usedNamesThisSession.clear()
    // Keep lastUsedName to prevent immediate repeat
  }

  /**
   * Get the name pool size
   */
  getNamePoolSize(): number {
    return BOT_NAME_POOL.length
  }
}

// Export singleton getter
export const getBotPersonalitySystem = () => BotPersonalitySystem.getInstance()

// Export name pool for testing
export const BOT_NAMES = BOT_NAME_POOL
