/**
 * FeaturesSection - 2×3 feature grid section
 * 
 * Displays 6 feature cards showcasing key platform features.
 * 
 * @module landing/enterprise/FeaturesSection
 * Requirements: 7.1, 7.3, 7.4
 */

import { cn } from '@/utils/helpers'
import { SectionHeader } from './SectionHeader'
import { FeatureCard } from './FeatureCard'
import {
  ArenaIcon,
  TriviaIcon,
  PowerUpIcon,
  BattlePassIcon,
  CosmeticIcon,
  BrowserIcon,
} from './icons'

export interface FeaturesSectionProps {
  /** Additional CSS classes */
  className?: string
}

/**
 * Feature data - exactly 6 features as specified
 */
export const FEATURES = [
  {
    id: 'arena',
    title: 'Real-time 2D arena',
    description: 'WASD movement, obstacles, hazards, and projectiles instead of static quiz screens.',
    icon: <ArenaIcon size="xl" />,
  },
  {
    id: 'trivia',
    title: 'Head-to-head trivia',
    description: 'Fifteen fast-paced questions where timing and accuracy both matter.',
    icon: <TriviaIcon size="xl" />,
  },
  {
    id: 'powerups',
    title: 'Power-ups that flip rounds',
    description: 'Freeze time, steal points, shield yourself, and more.',
    icon: <PowerUpIcon size="xl" />,
  },
  {
    id: 'battlepass',
    title: 'Progression & battle pass',
    description: 'Unlock skins, emotes, and crowns as you climb tiers each season.',
    icon: <BattlePassIcon size="xl" />,
  },
  {
    id: 'cosmetic',
    title: 'Cosmetic-only monetization',
    description: 'No pay-to-win: coins and skins are for flexing, not stat boosts.',
    icon: <CosmeticIcon size="xl" />,
  },
  {
    id: 'browser',
    title: 'Play anywhere',
    description: 'Runs in the browser; perfect for Discord calls, parties, and office breaks.',
    icon: <BrowserIcon size="xl" />,
  },
] as const

/**
 * Get feature titles for testing
 */
export function getFeatureTitles(): string[] {
  return FEATURES.map(f => f.title)
}

export function FeaturesSection({ className }: FeaturesSectionProps) {
  return (
    <section
      className={cn(
        'relative py-20 md:py-[120px] bg-[#111113]',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader title="Built For Competitive Chaos" />

        {/* Features Grid - 2×3 on desktop, 2 columns on tablet, 1 on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {FEATURES.map((feature) => (
            <FeatureCard
              key={feature.id}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
