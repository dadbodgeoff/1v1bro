/**
 * Features Configuration
 * 
 * Centralized feature display config for landing pages.
 * Allows marketing to update content without code changes.
 * 
 * @module config/features
 */

import type { ReactNode } from 'react'

export interface FeatureConfig {
  id: string
  title: string
  description: string
  /** Icon component or element */
  icon?: ReactNode
  /** Whether this feature is enabled (default: true) */
  enabled?: boolean
  /** Sort order (lower = first) */
  order?: number
}

/**
 * Default feature list for landing page
 * Icons are passed separately to avoid circular dependencies
 */
export const DEFAULT_FEATURES: Omit<FeatureConfig, 'icon'>[] = [
  {
    id: 'arena',
    title: 'Real-time 2D arena',
    description: 'WASD movement, obstacles, hazards, and projectiles instead of static quiz screens.',
    enabled: true,
    order: 1,
  },
  {
    id: 'trivia',
    title: 'Head-to-head trivia',
    description: 'Fifteen fast-paced questions where timing and accuracy both matter.',
    enabled: true,
    order: 2,
  },
  {
    id: 'powerups',
    title: 'Power-ups that flip rounds',
    description: 'Freeze time, steal points, shield yourself, and more.',
    enabled: true,
    order: 3,
  },
  {
    id: 'battlepass',
    title: 'Progression & battle pass',
    description: 'Unlock skins, emotes, and crowns as you climb tiers each season.',
    enabled: true,
    order: 4,
  },
  {
    id: 'cosmetic',
    title: 'Cosmetic-only monetization',
    description: 'No pay-to-win: coins and skins are for flexing, not stat boosts.',
    enabled: true,
    order: 5,
  },
  {
    id: 'browser',
    title: 'Play anywhere',
    description: 'Runs in the browser; perfect for Discord calls, parties, and office breaks.',
    enabled: true,
    order: 6,
  },
]

/**
 * Get enabled features sorted by order
 */
export function getEnabledFeatures(
  features: Omit<FeatureConfig, 'icon'>[] = DEFAULT_FEATURES
): Omit<FeatureConfig, 'icon'>[] {
  return features
    .filter(f => f.enabled !== false)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
}

/**
 * Get feature titles for testing
 */
export function getFeatureTitles(
  features: Omit<FeatureConfig, 'icon'>[] = DEFAULT_FEATURES
): string[] {
  return getEnabledFeatures(features).map(f => f.title)
}
