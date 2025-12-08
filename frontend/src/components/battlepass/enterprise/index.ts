/**
 * Battle Pass Enterprise Components
 * 
 * Enterprise-grade components for the Battle Pass experience,
 * following the same patterns as the Shop enterprise components.
 * 
 * Components:
 * - BattlePassHeader: Page header with season info, XP display, countdown
 * - RewardDisplayBox: Configurable size display with rarity theming
 * - ProgressSection: Combined tier badge, XP bar, statistics
 * - TrackSection: Section container with title, subtitle, content
 * - TierIndicator: Tier number display with state styling
 * - ClaimCTA: Conversion-optimized claim buttons
 */

// BattlePassHeader - Enterprise page header with gradient title, XP display, countdown
export { BattlePassHeader, calculateCountdown } from './BattlePassHeader'
export type { default as BattlePassHeaderDefault } from './BattlePassHeader'

// RewardDisplayBox - Configurable size display with rarity theming
export {
  RewardDisplayBox,
  sizeConfig,
  rarityBorders,
  rarityGlows,
  rarityBgGradients,
  getRarityBorder,
  getRarityGlow,
  getSizeConfig,
} from './RewardDisplayBox'
export type {
  DisplaySize,
  RewardType,
  ClaimState,
  Rarity,
  Reward,
} from './RewardDisplayBox'

// ProgressSection - Combined tier badge, XP bar, statistics
export { ProgressSection, calculateXPPercentage } from './ProgressSection'

// TrackSection - Section container with title, subtitle, content
export { TrackSection, getBadgeStyle } from './TrackSection'
export type { BadgeVariant } from './TrackSection'

// TierIndicator - Tier number display with state styling
export { TierIndicator, getTierState } from './TierIndicator'
export type { TierIndicatorSize, TierState } from './TierIndicator'

// ClaimCTA - Conversion-optimized claim buttons
export { ClaimCTA, getVariantStyle, isVariantDisabled } from './ClaimCTA'
export type { ClaimCTAVariant, ClaimCTASize } from './ClaimCTA'
