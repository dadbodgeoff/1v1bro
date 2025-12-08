/**
 * InventoryHeader - Enterprise Inventory Header Component
 * 
 * Features:
 * - Page title with gradient text (H1 level) - 4xl-5xl extrabold
 * - Item count subtitle with sm medium weight, muted color
 * - 1.5px gradient accent bar below title
 * - View toggle (grid/compact) with icon buttons
 * - Optional CollectionStats integration
 * 
 * Typography Hierarchy:
 * - H1: "My Collection" in 4xl-5xl (36-48px) extrabold with gradient text (indigo→purple)
 * - Subtitle: Item count in sm (14px) medium weight, muted color
 */

import { cn } from '@/utils/helpers'
import type { CosmeticType, Rarity } from '@/types/cosmetic'

export interface CollectionStatsData {
  totalOwned: number
  totalCatalog?: number
  byType: Partial<Record<CosmeticType, number>>
  byRarity: Partial<Record<Rarity, number>>
}

interface InventoryHeaderProps {
  totalItems: number
  viewMode: 'grid' | 'compact'
  onViewModeChange: (mode: 'grid' | 'compact') => void
  stats?: CollectionStatsData
  className?: string
}

export function InventoryHeader({
  totalItems,
  viewMode,
  onViewModeChange,
  stats,
  className,
}: InventoryHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Title Row */}
      <div className="flex items-start justify-between">
        <div>
          {/* H1: Page Title with Gradient */}
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            My Collection
          </h1>
          
          {/* Subtitle: Item Count */}
          <p className="text-sm font-medium text-[var(--color-text-muted)] mt-1">
            {totalItems} {totalItems === 1 ? 'item' : 'items'} owned
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-[var(--color-bg-elevated)] rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              'p-2 rounded-md transition-colors',
              viewMode === 'grid'
                ? 'bg-[#6366f1] text-white'
                : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-bg-card)]'
            )}
            aria-label="Grid view"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => onViewModeChange('compact')}
            className={cn(
              'p-2 rounded-md transition-colors',
              viewMode === 'compact'
                ? 'bg-[#6366f1] text-white'
                : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-bg-card)]'
            )}
            aria-label="Compact view"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Gradient Accent Bar */}
      <div className="h-[1.5px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full" />

      {/* Optional Inline Stats */}
      {stats && (
        <div className="flex items-center gap-6 text-sm">
          {/* Rarity breakdown pills */}
          <div className="flex items-center gap-3">
            {(['legendary', 'epic', 'rare', 'uncommon', 'common'] as Rarity[]).map((rarity) => {
              const count = stats.byRarity[rarity] || 0
              if (count === 0) return null
              return (
                <div key={rarity} className="flex items-center gap-1.5">
                  <span className={cn(
                    'w-2 h-2 rounded-full',
                    rarity === 'legendary' && 'bg-[#f59e0b]',
                    rarity === 'epic' && 'bg-[#a855f7]',
                    rarity === 'rare' && 'bg-[#3b82f6]',
                    rarity === 'uncommon' && 'bg-[#10b981]',
                    rarity === 'common' && 'bg-[#737373]'
                  )} />
                  <span className="text-[var(--color-text-secondary)] font-medium tabular-nums">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Completion percentage if catalog total known */}
          {stats.totalCatalog && stats.totalCatalog > 0 && (
            <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
              <span className="text-[#6366f1] font-semibold">
                {Math.round((stats.totalOwned / stats.totalCatalog) * 100)}%
              </span>
              <span>complete</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
