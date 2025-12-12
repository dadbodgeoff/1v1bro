/**
 * Rarity Styling System - Centralized Design Tokens
 * 
 * Single source of truth for all rarity-based styling across the application.
 * Import from here instead of defining rarity styles locally in components.
 * 
 * @module styles/rarity
 */

import type { Rarity } from '@/types/cosmetic'

/**
 * Rarity CSS variable names
 * Use these to reference colors from tokens.css
 */
export const RARITY_COLOR_VARS: Record<Rarity, string> = {
  common: '--color-rarity-common',
  uncommon: '--color-rarity-uncommon',
  rare: '--color-rarity-rare',
  epic: '--color-rarity-epic',
  legendary: '--color-rarity-legendary',
}

/**
 * Rarity color hex values (fallbacks for SSR/canvas)
 * These should match tokens.css values
 */
export const RARITY_HEX_COLORS: Record<Rarity, string> = {
  common: '#737373',
  uncommon: '#10b981',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
}

/**
 * Get rarity color from CSS variable with fallback
 */
export function getRarityColor(rarity: Rarity): string {
  if (typeof window === 'undefined') return RARITY_HEX_COLORS[rarity]
  return getComputedStyle(document.documentElement).getPropertyValue(RARITY_COLOR_VARS[rarity]).trim() || RARITY_HEX_COLORS[rarity]
}

/**
 * Rarity border classes with opacity
 */
export const rarityBorders: Record<Rarity, string> = {
  common: 'border-[#737373]/40',
  uncommon: 'border-[#10b981]/40',
  rare: 'border-[#3b82f6]/40',
  epic: 'border-[#a855f7]/40',
  legendary: 'border-[#f59e0b]/50',
}

/**
 * Rarity hover glow effects (standard intensity)
 */
export const rarityGlows: Record<Rarity, string> = {
  common: '',
  uncommon: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]',
  rare: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]',
  epic: 'hover:shadow-[0_0_35px_rgba(168,85,247,0.3)]',
  legendary: 'hover:shadow-[0_0_40px_rgba(245,158,11,0.35)]',
}

/**
 * Rarity hover glow effects (subtle intensity for smaller items)
 */
export const rarityGlowsSubtle: Record<Rarity, string> = {
  common: 'hover:shadow-[0_0_15px_rgba(115,115,115,0.2)]',
  uncommon: 'hover:shadow-[0_0_15px_rgba(16,185,129,0.25)]',
  rare: 'hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]',
  epic: 'hover:shadow-[0_0_15px_rgba(168,85,247,0.35)]',
  legendary: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]',
}

/**
 * Rarity glow effects (always visible, for featured items)
 */
export const rarityGlowsAlwaysOn: Record<Rarity, string> = {
  common: 'shadow-[0_0_60px_rgba(115,115,115,0.3)]',
  uncommon: 'shadow-[0_0_60px_rgba(16,185,129,0.3)]',
  rare: 'shadow-[0_0_60px_rgba(59,130,246,0.3)]',
  epic: 'shadow-[0_0_60px_rgba(168,85,247,0.4)]',
  legendary: 'shadow-[0_0_80px_rgba(245,158,11,0.5)]',
}

/**
 * Rarity background gradients
 */
export const rarityBgGradients: Record<Rarity, string> = {
  common: 'from-[#737373]/5 to-transparent',
  uncommon: 'from-[#10b981]/10 to-transparent',
  rare: 'from-[#3b82f6]/10 to-transparent',
  epic: 'from-[#a855f7]/10 to-transparent',
  legendary: 'from-[#f59e0b]/15 to-transparent',
}

/**
 * Equipped item glow
 */
export const equippedGlow = 'shadow-[0_0_20px_rgba(16,185,129,0.3)]'

/**
 * Premium/special item styles
 */
export const premiumStyles = {
  background: 'from-[#f59e0b]/20 to-[#ea580c]/20',
  border: 'border-[#f59e0b]/30',
  glow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]',
}

/**
 * Achievement badge rarity styles (includes bg gradient and shimmer)
 */
export const achievementRarityStyles: Record<Rarity, {
  border: string
  glow: string
  bgGradient: string
  shimmer: boolean
}> = {
  common: {
    border: 'border-[#737373]',
    glow: '',
    bgGradient: 'from-gray-600 to-gray-700',
    shimmer: false,
  },
  uncommon: {
    border: 'border-[#10b981]',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    bgGradient: 'from-green-600 to-green-700',
    shimmer: false,
  },
  rare: {
    border: 'border-[#3b82f6]',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    bgGradient: 'from-blue-600 to-blue-700',
    shimmer: false,
  },
  epic: {
    border: 'border-[#a855f7]',
    glow: 'shadow-[0_0_25px_rgba(168,85,247,0.3)]',
    bgGradient: 'from-[#a855f7] to-[#9333ea]',
    shimmer: false,
  },
  legendary: {
    border: 'border-[#f59e0b]',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.4)]',
    bgGradient: 'from-orange-500 to-yellow-600',
    shimmer: true,
  },
}

// Helper functions
export function getRarityBorder(rarity: Rarity): string {
  return rarityBorders[rarity]
}

export function getRarityGlow(rarity: Rarity): string {
  return rarityGlows[rarity]
}

export function getRarityBgGradient(rarity: Rarity): string {
  return rarityBgGradients[rarity]
}
