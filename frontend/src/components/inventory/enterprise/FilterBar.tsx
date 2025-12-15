/**
 * FilterBar - Filter Chips and Sort Controls Component
 * 
 * Features:
 * - Type filter chips (All, Skin, Emote, Banner, Nameplate, Effect, Trail)
 * - Rarity filter dropdown with all rarity options
 * - Equipped status toggle (All, Equipped, Unequipped)
 * - Sort dropdown (Newest, Oldest, Name A-Z, Name Z-A, Rarity)
 * - Active filter summary display
 * - "Clear All" button when filters active
 * - Item counts on filter chips
 */

import { cn } from '@/utils/helpers'
import type { CosmeticType, Rarity } from '@/types/cosmetic'
import { getCosmeticTypeName } from '@/types/cosmetic'

export interface InventoryFilters {
  type: CosmeticType | 'all'
  rarity: Rarity | 'all'
  status: 'all' | 'equipped' | 'unequipped'
  sort: 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'rarity'
}

interface FilterBarProps {
  filters: InventoryFilters
  onFiltersChange: (filters: InventoryFilters) => void
  itemCounts: {
    total: number
    byType: Partial<Record<CosmeticType, number>>
    byRarity: Partial<Record<Rarity, number>>
    equipped: number
    unequipped: number
  }
  className?: string
}

const COSMETIC_TYPES: CosmeticType[] = ['skin', 'runner', 'emote', 'banner', 'playercard', 'nameplate', 'effect', 'trail']
const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']

export const filterChipStyles = {
  active: 'bg-[#6366f1] text-white',
  inactive: 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)]',
}

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'rarity', label: 'Rarity' },
] as const

export function FilterBar({
  filters,
  onFiltersChange,
  itemCounts,
  className,
}: FilterBarProps) {
  const hasActiveFilters = filters.type !== 'all' || filters.rarity !== 'all' || filters.status !== 'all'

  const updateFilter = <K extends keyof InventoryFilters>(key: K, value: InventoryFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFiltersChange({
      type: 'all',
      rarity: 'all',
      status: 'all',
      sort: filters.sort, // Keep sort preference
    })
  }

  // Calculate filtered count for summary
  const getFilteredCount = () => {
    let count = itemCounts.total
    if (filters.type !== 'all') {
      count = itemCounts.byType[filters.type] || 0
    }
    // Note: This is a simplified count - actual filtering happens in parent
    return count
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Type Filter Chips - horizontal scroll on mobile, wrap on desktop */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
        <button
          onClick={() => updateFilter('type', 'all')}
          className={cn(
            'px-4 py-2.5 min-h-[44px] rounded-lg font-medium text-sm transition-colors flex-shrink-0 touch-manipulation',
            filters.type === 'all' ? filterChipStyles.active : filterChipStyles.inactive
          )}
        >
          All ({itemCounts.total})
        </button>
        {COSMETIC_TYPES.map((type) => {
          const count = itemCounts.byType[type] || 0
          return (
            <button
              key={type}
              onClick={() => updateFilter('type', type)}
              className={cn(
                'px-4 py-2.5 min-h-[44px] rounded-lg font-medium text-sm transition-colors flex-shrink-0 touch-manipulation',
                filters.type === type ? filterChipStyles.active : filterChipStyles.inactive
              )}
            >
              {getCosmeticTypeName(type)} ({count})
            </button>
          )
        })}
      </div>

      {/* Second Row: Rarity, Status, Sort - stack on mobile, row on desktop */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
        {/* Rarity Dropdown - 44px min height for touch */}
        <select
          value={filters.rarity}
          onChange={(e) => updateFilter('rarity', e.target.value as Rarity | 'all')}
          className={cn(
            'px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium touch-manipulation',
            'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]',
            'border border-[var(--color-border-subtle)]',
            'focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50',
            filters.rarity !== 'all' && 'bg-[#6366f1] text-white border-[#6366f1]'
          )}
        >
          <option value="all">All Rarities</option>
          {RARITIES.map((rarity) => (
            <option key={rarity} value={rarity}>
              {rarity.charAt(0).toUpperCase() + rarity.slice(1)} ({itemCounts.byRarity[rarity] || 0})
            </option>
          ))}
        </select>

        {/* Status Toggle - 44px min height for touch */}
        <div className="flex rounded-lg overflow-hidden border border-[var(--color-border-subtle)]">
          {(['all', 'equipped', 'unequipped'] as const).map((status) => (
            <button
              key={status}
              onClick={() => updateFilter('status', status)}
              className={cn(
                'px-3 py-2.5 min-h-[44px] text-sm font-medium transition-colors touch-manipulation',
                filters.status === status
                  ? 'bg-[#6366f1] text-white'
                  : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)]'
              )}
            >
              {status === 'all' ? 'All' : status === 'equipped' ? `Equipped (${itemCounts.equipped})` : `Unequipped (${itemCounts.unequipped})`}
            </button>
          ))}
        </div>

        {/* Sort Dropdown - 44px min height for touch */}
        <select
          value={filters.sort}
          onChange={(e) => updateFilter('sort', e.target.value as InventoryFilters['sort'])}
          className={cn(
            'px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium touch-manipulation',
            'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]',
            'border border-[var(--color-border-subtle)]',
            'focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50'
          )}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Clear All Button - 44px min height for touch */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors touch-manipulation"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Active Filter Summary */}
      {hasActiveFilters && (
        <div className="text-sm text-[var(--color-text-muted)]">
          Showing{' '}
          <span className="text-white font-medium">{getFilteredCount()}</span>
          {filters.rarity !== 'all' && (
            <span className="text-white font-medium"> {filters.rarity}</span>
          )}
          {filters.type !== 'all' && (
            <span className="text-white font-medium"> {getCosmeticTypeName(filters.type)}s</span>
          )}
          {filters.status !== 'all' && (
            <span className="text-white font-medium"> ({filters.status})</span>
          )}
        </div>
      )}
    </div>
  )
}
