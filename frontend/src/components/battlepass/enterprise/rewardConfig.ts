/**
 * Configuration for RewardDisplayBox
 * 
 * Size configurations and rarity styling
 * 
 * @module battlepass/enterprise/rewardConfig
 */

import type { SizeConfig, DisplaySize } from './types'
import {
  rarityBorders as sharedRarityBorders,
  rarityGlows as sharedRarityGlows,
  rarityBgGradients as sharedRarityBgGradients,
  premiumStyles as sharedPremiumStyles,
  getRarityBorder as sharedGetRarityBorder,
  getRarityGlow as sharedGetRarityGlow,
} from '@/styles/rarity'

// Re-export from shared rarity module for backward compatibility
export const rarityBorders = sharedRarityBorders
export const rarityGlows = sharedRarityGlows
export const rarityBgGradients = sharedRarityBgGradients
export const premiumStyles = sharedPremiumStyles
export const getRarityBorder = sharedGetRarityBorder
export const getRarityGlow = sharedGetRarityGlow

/**
 * Enterprise Standard Size Configuration
 */
export const sizeConfig: Record<DisplaySize, SizeConfig> = {
  xl: {
    container: 'col-span-2 row-span-2',
    minHeight: 'min-h-[420px]',
    imageSize: 240,
    imageWrapper: 'p-4',
    padding: 'p-6',
    gap: 'gap-4',
    badgeGap: 'mb-4',
    titleSize: 'text-2xl md:text-[28px]',
    titleWeight: 'font-extrabold',
    titleTracking: 'tracking-tight',
    typeSize: 'text-xs',
    descSize: 'text-sm',
    showDescription: true,
    showType: true,
    badgeSize: 'md',
    ctaSize: 'md',
  },
  lg: {
    container: 'col-span-2 row-span-1',
    minHeight: 'min-h-[200px]',
    imageSize: 160,
    imageWrapper: 'p-3',
    padding: 'p-5',
    gap: 'gap-3',
    badgeGap: 'mb-3',
    titleSize: 'text-xl md:text-[22px]',
    titleWeight: 'font-bold',
    titleTracking: 'tracking-tight',
    typeSize: 'text-[11px]',
    descSize: 'text-[13px]',
    showDescription: true,
    showType: true,
    badgeSize: 'md',
    ctaSize: 'md',
  },
  md: {
    container: 'col-span-1 row-span-1',
    minHeight: 'min-h-[280px]',
    imageSize: 120,
    imageWrapper: 'p-2',
    padding: 'p-4',
    gap: 'gap-2',
    badgeGap: 'mb-2',
    titleSize: 'text-base',
    titleWeight: 'font-bold',
    titleTracking: '',
    typeSize: 'text-[10px]',
    descSize: '',
    showDescription: false,
    showType: true,
    badgeSize: 'sm',
    ctaSize: 'sm',
  },
  sm: {
    container: 'col-span-1 row-span-1',
    minHeight: 'min-h-[180px]',
    imageSize: 64,
    imageWrapper: 'p-1',
    padding: 'p-2',
    gap: 'gap-1',
    badgeGap: 'mb-1',
    titleSize: 'text-xs',
    titleWeight: 'font-semibold',
    titleTracking: '',
    typeSize: '',
    descSize: '',
    showDescription: false,
    showType: false,
    badgeSize: 'sm',
    ctaSize: 'sm',
  },
}

/**
 * Get size config for a given size.
 */
export function getSizeConfig(size: DisplaySize): SizeConfig {
  return sizeConfig[size]
}
