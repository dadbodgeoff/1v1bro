/**
 * RarityBadge - Displays rarity indicator badge
 * 
 * @module battlepass/enterprise/RarityBadge
 */

import { cn } from '@/utils/helpers'
import type { Rarity } from './types'

interface RarityBadgeProps {
  rarity: Rarity
  size: 'sm' | 'md'
}

export const rarityColors: Record<Rarity, string> = {
  common: 'bg-[#737373]',
  uncommon: 'bg-[#10b981]',
  rare: 'bg-[#3b82f6]',
  epic: 'bg-[#a855f7]',
  legendary: 'bg-[#f59e0b]',
}

export function RarityBadge({ rarity, size }: RarityBadgeProps) {
  return (
    <span
      className={cn(
        'rounded-full font-bold text-white uppercase tracking-wide',
        rarityColors[rarity],
        rarity === 'legendary' && 'animate-shimmer',
        size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'
      )}
    >
      {rarity}
    </span>
  )
}
