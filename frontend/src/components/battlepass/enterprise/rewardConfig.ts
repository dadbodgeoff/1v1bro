/**
 * Configuration for RewardDisplayBox
 * 
 * Size configurations and rarity styling
 * 
 * @module battlepass/enterprise/rewardConfig
 */

import type { Rarity, SizeConfig, DisplaySize } from './types'

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

export const rarityBorders: Record<Rarity, string> = {
  common: 'border-[#737373]/40',
  uncommon: 'border-[#10b981]/40',
  rare: 'border-[#3b82f6]/40',
  epic: 'border-[#a855f7]/40',
  legendary: 'border-[#f59e0b]/50',
}

export const rarityGlows: Record<Rarity, string> = {
  common: '',
  uncommon: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]',
  rare: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]',
  epic: 'hover:shadow-[0_0_35px_rgba(168,85,247,0.3)]',
  legendary: 'hover:shadow-[0_0_40px_rgba(245,158,11,0.35)]',
}

export const rarityBgGradients: Record<Rarity, string> = {
  common: 'from-[#737373]/5 to-transparent',
  uncommon: 'from-[#10b981]/10 to-transparent',
  rare: 'from-[#3b82f6]/10 to-transparent',
  epic: 'from-[#a855f7]/10 to-transparent',
  legendary: 'from-[#f59e0b]/15 to-transparent',
}

export const premiumStyles = {
  background: 'from-[#f59e0b]/20 to-[#ea580c]/20',
  border: 'border-[#f59e0b]/30',
  glow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]',
}

/**
 * Get rarity border class for a given rarity.
 */
export function getRarityBorder(rarity: Rarity): string {
  return rarityBorders[rarity]
}

/**
 * Get rarity glow class for a given rarity.
 */
export function getRarityGlow(rarity: Rarity): string {
  return rarityGlows[rarity]
}

/**
 * Get size config for a given size.
 */
export function getSizeConfig(size: DisplaySize): SizeConfig {
  return sizeConfig[size]
}
