/**
 * Inventory grid component for displaying owned cosmetics.
 * 
 * This component now uses enterprise components for consistent styling.
 * For full inventory management, use the Inventory page directly.
 * 
 * Requirements: 3.6
 */

import React, { useState, useMemo } from 'react'
import type { InventoryItem, CosmeticType, Rarity } from '../../types/cosmetic'
import { 
  InventoryItemBox, 
  FilterBar,
  type InventoryFilters,
  type DisplaySize,
} from '../inventory/enterprise'

interface InventoryGridProps {
  items: InventoryItem[]
  onEquip: (cosmeticId: string) => Promise<void>
  onUnequip: (cosmeticId: string) => Promise<void>
  loading?: boolean
  size?: DisplaySize
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({
  items,
  onEquip,
  onUnequip,
  loading = false,
  size = 'md',
}) => {
  const [filters, setFilters] = useState<InventoryFilters>({
    type: 'all',
    rarity: 'all',
    status: 'all',
    sort: 'newest',
  })
  const [, setActionLoading] = useState<string | null>(null)

  // Calculate item counts for filters
  const itemCounts = useMemo(() => {
    const byType: Partial<Record<CosmeticType, number>> = {}
    const byRarity: Partial<Record<Rarity, number>> = {}
    let equipped = 0
    let unequipped = 0

    for (const item of items) {
      const type = item.cosmetic.type
      const rarity = item.cosmetic.rarity
      byType[type] = (byType[type] || 0) + 1
      byRarity[rarity] = (byRarity[rarity] || 0) + 1
      if (item.is_equipped) {
        equipped++
      } else {
        unequipped++
      }
    }

    return {
      total: items.length,
      byType,
      byRarity,
      equipped,
      unequipped,
    }
  }, [items])

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...items]

    if (filters.type !== 'all') {
      result = result.filter((item) => item.cosmetic.type === filters.type)
    }

    if (filters.rarity !== 'all') {
      result = result.filter((item) => item.cosmetic.rarity === filters.rarity)
    }

    if (filters.status === 'equipped') {
      result = result.filter((item) => item.is_equipped)
    } else if (filters.status === 'unequipped') {
      result = result.filter((item) => !item.is_equipped)
    }

    switch (filters.sort) {
      case 'newest':
        result.sort((a, b) => new Date(b.acquired_date).getTime() - new Date(a.acquired_date).getTime())
        break
      case 'oldest':
        result.sort((a, b) => new Date(a.acquired_date).getTime() - new Date(b.acquired_date).getTime())
        break
      case 'name-asc':
        result.sort((a, b) => a.cosmetic.name.localeCompare(b.cosmetic.name))
        break
      case 'name-desc':
        result.sort((a, b) => b.cosmetic.name.localeCompare(a.cosmetic.name))
        break
      case 'rarity':
        const rarityOrder: Record<Rarity, number> = {
          legendary: 5,
          epic: 4,
          rare: 3,
          uncommon: 2,
          common: 1,
        }
        result.sort((a, b) => rarityOrder[b.cosmetic.rarity] - rarityOrder[a.cosmetic.rarity])
        break
    }

    return result
  }, [items, filters])

  const handleEquip = async (item: InventoryItem) => {
    const cosmeticId = item.cosmetic_id || item.cosmetic?.id
    if (!cosmeticId) return

    setActionLoading(item.id)
    try {
      if (item.is_equipped) {
        await onUnequip(cosmeticId)
      } else {
        await onEquip(cosmeticId)
      }
    } finally {
      setActionLoading(null)
    }
  }

  // Determine grid columns based on size
  const gridCols = size === 'sm' 
    ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6' 
    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        itemCounts={itemCounts}
      />

      {/* Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--color-text-muted)] mt-4">Loading inventory...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-[var(--color-text-muted)]">
            {items.length === 0 ? 'Your inventory is empty' : 'No items match your filters'}
          </p>
        </div>
      ) : (
        <div className={`grid ${gridCols} gap-4`}>
          {filteredItems.map((item) => (
            <InventoryItemBox
              key={item.id}
              item={item}
              size={size}
              onEquip={() => handleEquip(item)}
              onUnequip={() => handleEquip(item)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default InventoryGrid
