/**
 * SoftConversionPrompts - Strategic, non-intrusive signup prompts
 * 
 * Manages when and how to show conversion prompts to guest players
 * based on their engagement level and session progress.
 * 
 * @module game/guest/SoftConversionPrompts
 * Requirements: 3.1, 3.2, 5.4
 */

import { type GuestSessionStats } from './GuestSessionManager'

/**
 * Conversion prompt types
 */
export type PromptType = 
  | 'feature-preview'   // After first match - show what they're missing
  | 'stats-save'        // After third match - show accumulated stats
  | 'break-suggestion'  // After fifth match - suggest taking a break + signup
  | 'progress-warning'  // When leaving - warn about losing progress

/**
 * Conversion prompt data
 */
export interface ConversionPrompt {
  id: string
  type: PromptType
  title: string
  message: string
  features?: string[]
  ctaText: string
  secondaryCta?: string
  dismissable: boolean
}

/**
 * Guest mode indicator configuration
 */
export interface GuestIndicatorConfig {
  visible: boolean
  message: string
  showSignupButton: boolean
}

/**
 * Prompt interaction types
 */
export type PromptInteraction = 'shown' | 'clicked' | 'dismissed'

/**
 * Prompt interaction record
 */
export interface PromptInteractionRecord {
  promptId: string
  action: PromptInteraction
  timestamp: number
}

/**
 * Prompt definitions
 */
const PROMPTS: Record<string, ConversionPrompt> = {
  'first-match': {
    id: 'first-match',
    type: 'feature-preview',
    title: 'Nice game!',
    message: 'Create a free account to unlock more features:',
    features: [
      '🏆 Compete on leaderboards',
      '💰 Earn coins & unlock cosmetics',
      '📊 Track your stats & progress',
      '🎮 Play against real players',
    ],
    ctaText: 'Create Free Account',
    secondaryCta: 'Maybe Later',
    dismissable: true,
  },
  'third-match': {
    id: 'third-match',
    type: 'stats-save',
    title: "You're on a roll!",
    message: "Don't lose your progress. Sign up to save:",
    features: [], // Will be populated with actual stats
    ctaText: 'Save My Progress',
    secondaryCta: 'Keep Playing',
    dismissable: true,
  },
  'fifth-match': {
    id: 'fifth-match',
    type: 'break-suggestion',
    title: 'Taking a break?',
    message: 'Your progress will be lost when you leave. Create an account to keep it!',
    features: [
      '✨ All your XP will be credited',
      '🏅 Achievements will be unlocked',
      '🎁 Get a welcome bonus',
    ],
    ctaText: 'Sign Up & Save',
    secondaryCta: 'Continue Playing',
    dismissable: true,
  },
  'leaving': {
    id: 'leaving',
    type: 'progress-warning',
    title: 'Wait!',
    message: "You'll lose all your progress if you leave. Sign up to keep it!",
    ctaText: 'Save Progress',
    secondaryCta: 'Leave Anyway',
    dismissable: true,
  },
}

/**
 * Category suggestions for variety
 */
const CATEGORY_SUGGESTIONS = [
  { slug: 'fortnite', name: 'Fortnite', icon: '🎮' },
  { slug: 'nfl', name: 'NFL', icon: '🏈' },
  { slug: 'sports', name: 'Sports', icon: '⚽' },
  { slug: 'movies', name: 'Movies', icon: '🎬' },
  { slug: 'music', name: 'Music', icon: '🎵' },
  { slug: 'general', name: 'General', icon: '🧠' },
]

/**
 * SoftConversionPrompts class
 * 
 * Manages prompt display logic and interaction tracking.
 */
export class SoftConversionPrompts {
  private static instance: SoftConversionPrompts | null = null
  
  private promptsShown: Set<string> = new Set()
  private promptsDismissed: Set<string> = new Set()
  private interactions: PromptInteractionRecord[] = []

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): SoftConversionPrompts {
    if (!SoftConversionPrompts.instance) {
      SoftConversionPrompts.instance = new SoftConversionPrompts()
    }
    return SoftConversionPrompts.instance
  }

  /**
   * Reset singleton (for testing)
   */
  static resetInstance(): void {
    SoftConversionPrompts.instance = null
  }

  /**
   * Check if a prompt should be shown based on session stats
   */
  shouldShowPrompt(stats: GuestSessionStats): ConversionPrompt | null {
    const { matchesPlayed } = stats

    // First match prompt
    if (matchesPlayed === 1 && !this.promptsShown.has('first-match')) {
      return this.getPrompt('first-match')
    }

    // Third match prompt with stats
    if (matchesPlayed === 3 && !this.promptsShown.has('third-match')) {
      return this.getPromptWithStats('third-match', stats)
    }

    // Fifth match prompt
    if (matchesPlayed === 5 && !this.promptsShown.has('fifth-match')) {
      return this.getPrompt('fifth-match')
    }

    return null
  }

  /**
   * Get a prompt by ID
   */
  getPrompt(promptId: string): ConversionPrompt | null {
    return PROMPTS[promptId] ? { ...PROMPTS[promptId] } : null
  }

  /**
   * Get prompt with dynamic stats
   */
  getPromptWithStats(promptId: string, stats: GuestSessionStats): ConversionPrompt | null {
    const prompt = this.getPrompt(promptId)
    if (!prompt) return null

    if (promptId === 'third-match') {
      prompt.features = [
        `🎯 ${stats.matchesWon} wins`,
        `⚔️ ${stats.totalKills} eliminations`,
        `✅ ${stats.questionsCorrect} correct answers`,
        `✨ ${stats.previewXpEarned} XP earned`,
      ]
    }

    return prompt
  }

  /**
   * Get leaving prompt (always available)
   */
  getLeavingPrompt(stats: GuestSessionStats): ConversionPrompt | null {
    // Only show if they have meaningful progress
    if (stats.matchesPlayed === 0 || stats.previewXpEarned < 100) {
      return null
    }

    const prompt = this.getPrompt('leaving')
    if (!prompt) return null

    prompt.message = `You have ${stats.previewXpEarned} XP and ${stats.matchesWon} wins. Sign up to keep them!`
    return prompt
  }

  /**
   * Record prompt interaction
   */
  recordPromptInteraction(promptId: string, action: PromptInteraction): void {
    const record: PromptInteractionRecord = {
      promptId,
      action,
      timestamp: Date.now(),
    }
    this.interactions.push(record)

    if (action === 'shown') {
      this.promptsShown.add(promptId)
    } else if (action === 'dismissed') {
      this.promptsDismissed.add(promptId)
    }
  }

  /**
   * Check if prompt was shown
   */
  wasPromptShown(promptId: string): boolean {
    return this.promptsShown.has(promptId)
  }

  /**
   * Check if prompt was dismissed
   */
  wasPromptDismissed(promptId: string): boolean {
    return this.promptsDismissed.has(promptId)
  }

  /**
   * Get all interactions
   */
  getInteractions(): PromptInteractionRecord[] {
    return [...this.interactions]
  }

  /**
   * Get guest mode indicator config
   */
  getGuestIndicatorConfig(stats: GuestSessionStats): GuestIndicatorConfig {
    // Show more urgency as they play more
    if (stats.matchesPlayed >= 5) {
      return {
        visible: true,
        message: `${stats.previewXpEarned} XP at risk`,
        showSignupButton: true,
      }
    } else if (stats.matchesPlayed >= 3) {
      return {
        visible: true,
        message: 'Guest Mode',
        showSignupButton: true,
      }
    } else {
      return {
        visible: true,
        message: 'Guest',
        showSignupButton: false,
      }
    }
  }

  /**
   * Suggest a different category after repeated plays
   * Property 7: Category suggestion probability (≥20% for different category)
   */
  suggestCategory(currentCategory: string, matchesInCategory: number): string | null {
    // Only suggest after 3+ matches in same category
    if (matchesInCategory < 3) {
      return null
    }

    // 30% chance to suggest different category (exceeds 20% requirement)
    if (Math.random() < 0.3) {
      const otherCategories = CATEGORY_SUGGESTIONS.filter(c => c.slug !== currentCategory)
      if (otherCategories.length > 0) {
        const suggestion = otherCategories[Math.floor(Math.random() * otherCategories.length)]
        return suggestion.slug
      }
    }

    return null
  }

  /**
   * Get category suggestion with display info
   */
  getCategorySuggestion(currentCategory: string, matchesInCategory: number): { slug: string; name: string; icon: string } | null {
    const suggestedSlug = this.suggestCategory(currentCategory, matchesInCategory)
    if (!suggestedSlug) return null

    const category = CATEGORY_SUGGESTIONS.find(c => c.slug === suggestedSlug)
    return category || null
  }

  /**
   * Reset state (for new session)
   */
  reset(): void {
    this.promptsShown.clear()
    this.promptsDismissed.clear()
    this.interactions = []
  }
}

// Export singleton getter
export const getSoftConversionPrompts = () => SoftConversionPrompts.getInstance()
