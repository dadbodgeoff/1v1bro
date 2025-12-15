/**
 * FeaturesSection - 2×3 feature grid section
 * 
 * Displays 6 feature cards showcasing key platform features.
 * 
 * @module landing/enterprise/FeaturesSection
 * Requirements: 7.1, 7.3, 7.4
 */

import { useMemo } from 'react'
import { cn } from '@/utils/helpers'
import { SectionHeader } from './SectionHeader'
import { FeatureCard } from './FeatureCard'
import { getEnabledFeatures, DEFAULT_FEATURES, type FeatureConfig } from '@/config/features'
import { useSectionViewTracking } from '@/hooks/useSectionViewTracking'
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
  /** Custom features (defaults to DEFAULT_FEATURES from config) */
  features?: Omit<FeatureConfig, 'icon'>[]
}

/**
 * Icon mapping for feature IDs
 * Allows config to remain serializable while components provide icons
 */
const FEATURE_ICONS: Record<string, React.ReactNode> = {
  arena: <ArenaIcon size="xl" />,
  trivia: <TriviaIcon size="xl" />,
  powerups: <PowerUpIcon size="xl" />,
  battlepass: <BattlePassIcon size="xl" />,
  cosmetic: <CosmeticIcon size="xl" />,
  browser: <BrowserIcon size="xl" />,
}

// Re-export for backwards compatibility
export { getFeatureTitles } from '@/config/features'
export const FEATURES = DEFAULT_FEATURES

export function FeaturesSection({ className, features }: FeaturesSectionProps) {
  // Get enabled features from config
  const enabledFeatures = useMemo(() => getEnabledFeatures(features || DEFAULT_FEATURES), [features])
  const sectionRef = useSectionViewTracking('features')
  
  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className={cn(
        'relative py-20 md:py-[120px] bg-[var(--color-bg-card)]',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader title="Built For Competitive Chaos" />

        {/* Features Grid - 2×3 on desktop, 2 columns on tablet, 1 on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {enabledFeatures.map((feature) => (
            <FeatureCard
              key={feature.id}
              icon={FEATURE_ICONS[feature.id] || null}
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
