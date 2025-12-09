/**
 * Inventory page - Enterprise-grade collection management
 * 
 * Features:
 * - Enterprise header with gradient title and collection stats
 * - Enhanced loadout panel with slot previews
 * - Filtered inventory grid with enterprise item boxes
 * - Advanced filtering and sorting
 * 
 * Requirements: 8.4
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCosmetics } from '../hooks/useCosmetics'
import type { CosmeticType, Rarity } from '../types/cosmetic'
import {
  InventoryHeader,
  InventorySection,
  LoadoutPanel,
  FilterBar,
  InventoryItemBox,
  type InventoryFilters,
  type CollectionStatsData,
} from '../components/inventory/enterprise'

export const Inventory: React.FC = () => {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid')
  const [filters, setFilters] = useState<InventoryFilters>({
    type: 'all',
    rarity: 'all',
    status: 'all',
    sort: 'newest',
  })
  const [, setActionLoading] = useState<string | null>(null)

  const {
    inventory,
    inventoryLoading,
    fetchInventory,
    loadout,
    fetchLoadout,
    equipCosmetic,
    unequipCosmetic,
    error,
    clearError,
  } = useCosmetics()

  useEffect(() => {
    fetchInventory()
    fetchLoadout()
  }, [fetchInventory, fetchLoadout])

  // Calculate collection stats
  const stats: CollectionStatsData = useMemo(() => {
    const byType: Partial<Record<CosmeticType, number>> = {}
    const byRarity: Partial<Record<Rarity, number>> = {}

    for (const item of inventory) {
      const type = item.cosmetic.type
      const rarity = item.cosmetic.rarity
      byType[type] = (byType[type] || 0) + 1
      byRarity[rarity] = (byRarity[rarity] || 0) + 1
    }

    return {
      totalOwned: inventory.length,
      byType,
      byRarity,
    }
  }, [inventory])

  // Calculate item counts for filters
  const itemCounts = useMemo(() => {
    const byType: Partial<Record<CosmeticType, number>> = {}
    const byRarity: Partial<Record<Rarity, number>> = {}
    let equipped = 0
    let unequipped = 0

    for (const item of inventory) {
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
      total: inventory.length,
      byType,
      byRarity,
      equipped,
      unequipped,
    }
  }, [inventory])

  // Filter and sort inventory
  const filteredItems = useMemo(() => {
    let items = [...inventory]

    // Apply type filter
    if (filters.type !== 'all') {
      items = items.filter((item) => item.cosmetic.type === filters.type)
    }

    // Apply rarity filter
    if (filters.rarity !== 'all') {
      items = items.filter((item) => item.cosmetic.rarity === filters.rarity)
    }

    // Apply status filter
    if (filters.status === 'equipped') {
      items = items.filter((item) => item.is_equipped)
    } else if (filters.status === 'unequipped') {
      items = items.filter((item) => !item.is_equipped)
    }

    // Apply sort
    switch (filters.sort) {
      case 'newest':
        items.sort((a, b) => new Date(b.acquired_date).getTime() - new Date(a.acquired_date).getTime())
        break
      case 'oldest':
        items.sort((a, b) => new Date(a.acquired_date).getTime() - new Date(b.acquired_date).getTime())
        break
      case 'name-asc':
        items.sort((a, b) => a.cosmetic.name.localeCompare(b.cosmetic.name))
        break
      case 'name-desc':
        items.sort((a, b) => b.cosmetic.name.localeCompare(a.cosmetic.name))
        break
      case 'rarity': {
        const rarityOrder: Record<Rarity, number> = {
          legendary: 5,
          epic: 4,
          rare: 3,
          uncommon: 2,
          common: 1,
        }
        items.sort((a, b) => rarityOrder[b.cosmetic.rarity] - rarityOrder[a.cosmetic.rarity])
        break
      }
    }

    // Always show equipped items first when not filtering by status
    if (filters.status === 'all') {
      items.sort((a, b) => (b.is_equipped ? 1 : 0) - (a.is_equipped ? 1 : 0))
    }

    return items
  }, [inventory, filters])

  const handleEquip = async (cosmeticId: string) => {
    setActionLoading(cosmeticId)
    clearError()
    try {
      await equipCosmetic(cosmeticId)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnequip = async (cosmeticId: string) => {
    setActionLoading(cosmeticId)
    clearError()
    try {
      await unequipCosmetic(cosmeticId)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSlotClick = (type: CosmeticType) => {
    setFilters((prev) => ({ ...prev, type, status: 'all' }))
  }

  // Determine grid size based on view mode
  const itemSize = viewMode === 'compact' ? 'sm' : 'md'
  const gridCols = viewMode === 'compact' 
    ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6' 
    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-[var(--color-text-muted)] hover:text-white mb-6 flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Enterprise Header */}
        <InventoryHeader
          totalItems={inventory.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          stats={stats}
          className="mb-8"
        />

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-[#ef4444]/20 border border-[#ef4444] text-[#ef4444] px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-[#ef4444] hover:text-[#f87171] transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Loadout Section */}
        <InventorySection
          title="Current Loadout"
          subtitle="Your equipped cosmetics"
          icon={<span className="text-2xl">🎮</span>}
          badge={Object.values(loadout || {}).filter(Boolean).length}
          badgeVariant="equipped"
        >
          <LoadoutPanel
            loadout={loadout}
            inventory={inventory}
            onSlotClick={handleSlotClick}
            onUnequip={handleUnequip}
          />
        </InventorySection>

        {/* Collection Section */}
        <InventorySection
          title="My Items"
          subtitle={`${filteredItems.length} items${filters.type !== 'all' || filters.rarity !== 'all' || filters.status !== 'all' ? ' (filtered)' : ''}`}
          icon={<span className="text-2xl">📦</span>}
          badge={filteredItems.length}
          badgeVariant="count"
        >
          {/* Filter Bar */}
          <FilterBar
            filters={filters}
            onFiltersChange={setFilters}
            itemCounts={itemCounts}
            className="mb-6"
          />

          {/* Inventory Grid */}
          {inventoryLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
              <p className="text-[var(--color-text-muted)] mt-4">Loading inventory...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-[var(--color-text-muted)] text-lg mb-2">
                {inventory.length === 0 ? 'Your inventory is empty' : 'No items match your filters'}
              </p>
              <p className="text-[var(--color-text-muted)] text-sm mb-6">
                {inventory.length === 0 
                  ? 'Visit the shop to get some cosmetics!' 
                  : 'Try adjusting your filters or clearing them'}
              </p>
              {inventory.length === 0 ? (
                <button
                  onClick={() => navigate('/shop')}
                  className="bg-[#6366f1] hover:bg-[#4f46e5] text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Go to Shop
                </button>
              ) : (
                <button
                  onClick={() => setFilters({ type: 'all', rarity: 'all', status: 'all', sort: 'newest' })}
                  className="text-[#6366f1] hover:text-[#818cf8] font-medium transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className={`grid ${gridCols} gap-4`}>
              {filteredItems.map((item) => (
                <InventoryItemBox
                  key={item.id}
                  item={item}
                  size={itemSize}
                  onEquip={() => handleEquip(item.cosmetic_id || item.cosmetic?.id)}
                  onUnequip={() => handleUnequip(item.cosmetic_id || item.cosmetic?.id)}
                />
              ))}
            </div>
          )}
        </InventorySection>
      </div>
    </div>
  )
}

export default Inventory
