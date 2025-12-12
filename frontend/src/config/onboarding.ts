/**
 * Onboarding Configuration
 * 
 * Centralized onboarding steps for enterprise configurability.
 * Allows customizing steps, A/B testing, and content updates without code changes.
 * 
 * @module config/onboarding
 */

export interface OnboardingHighlight {
  icon: string
  text: string
}

export interface OnboardingStep {
  id: string
  icon: string
  title: string
  subtitle: string
  highlights: OnboardingHighlight[]
  /** CSS variable name for accent color (e.g., '--color-brand') */
  accentColorVar: string
  /** Whether this step is enabled (default: true) */
  enabled?: boolean
}

/**
 * Default onboarding steps
 * Colors reference CSS variables from tokens.css
 */
export const DEFAULT_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    icon: '🎮',
    title: 'Welcome to 1v1 Bro',
    subtitle: "We're in Alpha! Player counts may vary, but the action is real. Here's a quick tour of what you can do.",
    highlights: [
      { icon: '⚔️', text: 'Real-time 1v1 arena combat' },
      { icon: '🧠', text: 'Trivia questions during battle' },
      { icon: '🏆', text: 'Earn XP, coins, and rewards' },
    ],
    accentColorVar: '--color-brand', // Orange
    enabled: true,
  },
  {
    id: 'practice',
    icon: '🤖',
    title: 'Practice Mode',
    subtitle: 'Warm up against an AI opponent. Perfect for learning the controls and testing strategies.',
    highlights: [
      { icon: '🎯', text: 'Fight a bot that shoots back' },
      { icon: '📚', text: 'Real trivia questions' },
      { icon: '🔄', text: 'Play anytime, no waiting' },
    ],
    accentColorVar: '--color-accent-success', // Green
    enabled: true,
  },
  {
    id: 'matchmaking',
    icon: '⚡',
    title: 'Live Matchmaking',
    subtitle: 'Queue up for real PvP battles. See how many players are waiting and jump into action.',
    highlights: [
      { icon: '👥', text: 'Live player queue count' },
      { icon: '🌐', text: 'Match with real opponents' },
      { icon: '📊', text: 'Ranked & casual modes' },
    ],
    accentColorVar: '--color-accent-info', // Blue
    enabled: true,
  },
  {
    id: 'shop',
    icon: '🛒',
    title: 'Shop & Battle Pass',
    subtitle: 'Customize your look with skins, emotes, and more. Progress through the Battle Pass for exclusive rewards.',
    highlights: [
      { icon: '🎭', text: 'Unique character skins' },
      { icon: '⭐', text: '35 tiers of Battle Pass rewards' },
      { icon: '🪙', text: 'Earn coins by playing' },
    ],
    accentColorVar: '--color-brand', // Orange
    enabled: true,
  },
  {
    id: 'profile',
    icon: '👤',
    title: 'Your Profile',
    subtitle: 'Track your stats, manage your loadout, and customize your settings.',
    highlights: [
      { icon: '📦', text: 'Inventory - equip your items' },
      { icon: '⚙️', text: 'Settings - audio, controls, display' },
      { icon: '📈', text: 'Profile - stats and match history' },
    ],
    accentColorVar: '--color-accent-error', // Pink/Rose
    enabled: true,
  },
]

/**
 * Get enabled onboarding steps
 */
export function getEnabledOnboardingSteps(
  steps: OnboardingStep[] = DEFAULT_ONBOARDING_STEPS
): OnboardingStep[] {
  return steps.filter(step => step.enabled !== false)
}

/**
 * Get CSS color value from variable name
 */
export function getAccentColor(varName: string): string {
  if (typeof window === 'undefined') {
    // SSR fallback
    return varName === '--color-brand' ? '#F97316' : '#6366F1'
  }
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#F97316'
}
