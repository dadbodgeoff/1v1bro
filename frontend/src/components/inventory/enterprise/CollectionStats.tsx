/**
 * CollectionStats - Statistics Display Component
 * 
 * Features:
 * - Total items owned display with icon
 * - Type breakdown with icons for each cosmetic type
 * - Rarity breakdown with colored dot indicators
 * - Collection completion percentage (if total catalog known)
 * - Inline and expanded variants
 * - Shimmer effect on legendary count if > 0
 * 
 * Typography:
 * - Stat value: 2xl (24px) bold, white text, tabular-nums
 * - Stat label: xs (12px) medium, muted color, uppercase
 * - Progress percentage: sm (14px) semibold, accent color
 */

import { cn } from '@/utils/helpers'
import type { CosmeticType, Rarity } from '@/types/cosmetic'
import { getCosmeticTypeName } from '@/types/cosmetic'
import { SLOT_ICONS } from './LoadoutPanel'
import type { CollectionStatsData } from './InventoryHeader'

interface CollectionStatsProps {
  stats: CollectionStatsData
  variant?: 'inline' | 'expanded'
  className?: string
}

export const rarityIndicators: Record<Rarity, string> = {
  common: 'bg-[#737373]',
  uncommon: 'bg-[#10b981]',
  rare: 'bg-[#3b82f6]',
  epic: 'bg-[#a855f7]',
  legendary: 'bg-[#f59e0b]',
}

const COSMETIC_TYPES: CosmeticType[] = ['skin', 'emote', 'banner', 'nameplate', 'effect', 'trail']
const RARITIES: Rarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common']

export function CollectionStats({
  stats,
  variant = 'expanded',
  className,
}: CollectionStatsProps) {
  const completionPercentage = stats.totalCatalog && stats.totalCatalog > 0
    ? Math.round((stats.totalOwned / stats.totalCatalog) * 100)
    : null

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-6 text-sm', className)}>
        {/* Total Count */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">📦</span>
          <span className="text-white font-bold tabular-nums">{stats.totalOwned}</span>
          <span className="text-[var(--color-text-muted)]">items</span>
        </div>

        {/* Rarity Pills */}
        <div className="flex items-center gap-3">
          {RARITIES.map((rarity) => {
            const count = stats.byRarity[rarity] || 0
            if (count === 0) return null
            return (
              <div key={rarity} className="flex items-center gap-1.5">
                <span className={cn(
                  'w-2 h-2 rounded-full',
                  rarityIndicators[rarity],
                  rarity === 'legendary' && count > 0 && 'animate-pulse'
                )} />
                <span className="text-[var(--color-text-secondary)] font-medium tabular-nums">
                  {count}
                </span>
              </div>
            )
          })}
        </div>

        {/* Completion */}
        {completionPercentage !== null && (
          <div className="flex items-center gap-2">
            <span className="text-[#6366f1] font-semibold">{completionPercentage}%</span>
            <span className="text-[var(--color-text-muted)]">complete</span>
          </div>
        )}
      </div>
    )
  }

  // Expanded variant
  return (
    <div className={cn('space-y-6', className)}>
      {/* Total Items Card */}
      <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-2xl">
          📦
        </div>
        <div>
          <div className="text-2xl font-bold text-white tabular-nums">{stats.totalOwned}</div>
          <div className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Total Items
          </div>
        </div>
        {completionPercentage !== null && (
          <div className="ml-auto text-right">
            <div className={cn(
              'text-sm font-semibold',
              completionPercentage === 100 ? 'text-[#10b981]' : 'text-[#6366f1]'
            )}>
              {completionPercentage}%
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">
              {stats.totalOwned} / {stats.totalCatalog}
            </div>
          </div>
        )}
      </div>

      {/* Type Breakdown */}
      <div>
        <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
          By Type
        </h4>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {COSMETIC_TYPES.map((type) => {
            const count = stats.byType[type] || 0
            return (
              <div
                key={type}
                className="bg-[var(--color-bg-card)] rounded-lg p-3 text-center"
              >
                <div className="text-xl mb-1">{SLOT_ICONS[type]}</div>
                <div className="text-lg font-bold text-white tabular-nums">{count}</div>
                <div className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase">
                  {getCosmeticTypeName(type)}s
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Rarity Breakdown */}
      <div>
        <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
          By Rarity
        </h4>
        <div className="flex flex-wrap gap-2">
          {RARITIES.map((rarity) => {
            const count = stats.byRarity[rarity] || 0
            return (
              <div
                key={rarity}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg',
                  'bg-[var(--color-bg-card)]',
                  rarity === 'legendary' && count > 0 && 'ring-1 ring-[#f59e0b]/30'
                )}
              >
                <span className={cn(
                  'w-3 h-3 rounded-full',
                  rarityIndicators[rarity],
                  rarity === 'legendary' && count > 0 && 'animate-pulse'
                )} />
                <span className="text-white font-bold tabular-nums">{count}</span>
                <span className="text-xs text-[var(--color-text-muted)] capitalize">
                  {rarity}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Completion Progress Bar (if catalog total known) */}
      {completionPercentage !== null && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Collection Progress
            </span>
            <span className={cn(
              'text-sm font-semibold',
              completionPercentage === 100 ? 'text-[#10b981]' : 'text-[#6366f1]'
            )}>
              {completionPercentage}%
            </span>
          </div>
          <div className="h-2 bg-[var(--color-bg-card)] rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                completionPercentage === 100
                  ? 'bg-gradient-to-r from-[#10b981] to-[#34d399]'
                  : 'bg-gradient-to-r from-[#6366f1] to-[#a855f7]'
              )}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          {completionPercentage === 100 && (
            <div className="mt-2 text-center">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#10b981]/20 text-[#10b981] text-sm font-semibold">
                🏆 Collection Complete!
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
