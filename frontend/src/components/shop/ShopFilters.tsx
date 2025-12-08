/**
 * ShopFilters Component - 2025 Design System
 * Requirements: 3.3, 3.10
 *
 * Shop filtering and sorting with:
 * - Horizontal pill buttons for type filter
 * - Dropdown for rarity filter
 * - Sort dropdown (featured, price, newest, rarity)
 * - Active filters highlighted with indigo background
 */

import { cn } from '@/utils/helpers'
import { Select } from '@/components/ui/Select'
import type { CosmeticType, Rarity } from '@/types/cosmetic'

export type SortOption =
  | 'featured'
  | 'price-asc'
  | 'price-desc'
  | 'newest'
  | 'rarity-asc'
  | 'rarity-desc'

interface ShopFiltersProps {
  selectedType: CosmeticType | null
  selectedRarity: Rarity | null
  selectedSort: SortOption
  onTypeChange: (type: CosmeticType | null) => void
  onRarityChange: (rarity: Rarity | null) => void
  onSortChange: (sort: SortOption) => void
}

const typeOptions: { value: CosmeticType | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'skin', label: 'Skins' },
  { value: 'emote', label: 'Emotes' },
  { value: 'banner', label: 'Banners' },
  { value: 'nameplate', label: 'Nameplates' },
  { value: 'effect', label: 'Effects' },
  { value: 'trail', label: 'Trails' },
]

const rarityOptions: { value: Rarity | null; label: string }[] = [
  { value: null, label: 'All Rarities' },
  { value: 'common', label: 'Common' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'rare', label: 'Rare' },
  { value: 'epic', label: 'Epic' },
  { value: 'legendary', label: 'Legendary' },
]

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'rarity-asc', label: 'Rarity: Common to Legendary' },
  { value: 'rarity-desc', label: 'Rarity: Legendary to Common' },
]

export function ShopFilters({
  selectedType,
  selectedRarity,
  selectedSort,
  onTypeChange,
  onRarityChange,
  onSortChange,
}: ShopFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Type Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {typeOptions.map((option) => (
          <button
            key={option.value ?? 'all'}
            onClick={() => onTypeChange(option.value)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
              selectedType === option.value
                ? 'bg-[#6366f1] text-white'
                : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-white/10 hover:text-white'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Rarity & Sort Dropdowns */}
      <div className="flex flex-wrap gap-3">
        <div className="w-48">
          <Select
            value={selectedRarity ?? ''}
            onChange={(value) => onRarityChange(value === '' ? null : (value as Rarity))}
            options={rarityOptions.map((opt) => ({
              value: opt.value ?? '',
              label: opt.label,
            }))}
            placeholder="Filter by Rarity"
          />
        </div>

        <div className="w-56">
          <Select
            value={selectedSort}
            onChange={(value) => onSortChange(value as SortOption)}
            options={sortOptions.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
            placeholder="Sort by"
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Apply filters and sorting to cosmetic items.
 */
export function filterAndSortItems<T extends { type: string; rarity: string; price_coins: number; id: string }>(
  items: T[],
  filters: {
    type: CosmeticType | null
    rarity: Rarity | null
    sort: SortOption
  }
): T[] {
  let filtered = [...items]

  // Apply type filter
  if (filters.type) {
    filtered = filtered.filter((item) => item.type === filters.type)
  }

  // Apply rarity filter
  if (filters.rarity) {
    filtered = filtered.filter((item) => item.rarity === filters.rarity)
  }

  // Apply sorting
  const rarityOrder: Record<string, number> = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5,
  }

  switch (filters.sort) {
    case 'price-asc':
      filtered.sort((a, b) => a.price_coins - b.price_coins)
      break
    case 'price-desc':
      filtered.sort((a, b) => b.price_coins - a.price_coins)
      break
    case 'rarity-asc':
      filtered.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity])
      break
    case 'rarity-desc':
      filtered.sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity])
      break
    case 'newest':
      // Assuming newer items have higher IDs or we'd need a created_at field
      filtered.sort((a, b) => b.id.localeCompare(a.id))
      break
    case 'featured':
    default:
      // Featured items first (would need a featured flag), otherwise keep original order
      break
  }

  return filtered
}
