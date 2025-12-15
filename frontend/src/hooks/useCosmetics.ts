/**
 * Cosmetics hook for shop, inventory, and loadout management.
 * Uses global Zustand store for shared state across components.
 * Requirements: 3.3-3.6
 */

import { useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useCosmeticsStore, type LoadoutWithDetails } from '@/stores/cosmeticsStore'
import type { Cosmetic, InventoryItem, Loadout, ShopFilters } from '@/types/cosmetic'

// Re-export for backwards compatibility
export type { LoadoutWithDetails }

interface UseCosmeticsReturn {
  // Shop
  shopItems: Cosmetic[]
  shopLoading: boolean
  fetchShop: (filters?: ShopFilters) => Promise<void>

  // Inventory
  inventory: InventoryItem[]
  inventoryLoading: boolean
  fetchInventory: () => Promise<void>

  // Loadout
  loadout: Loadout | null
  loadoutWithDetails: LoadoutWithDetails | null
  loadoutLoading: boolean
  fetchLoadout: () => Promise<void>

  // Actions
  purchaseCosmetic: (cosmeticId: string) => Promise<boolean>
  equipCosmetic: (cosmeticId: string) => Promise<void>
  unequipCosmetic: (cosmeticId: string) => Promise<void>

  // State
  error: string | null
  clearError: () => void
}

export function useCosmetics(): UseCosmeticsReturn {
  const token = useAuthStore((s) => s.token)

  // Get state from global store
  const shopItems = useCosmeticsStore((s) => s.shopItems)
  const shopLoading = useCosmeticsStore((s) => s.shopLoading)
  const inventory = useCosmeticsStore((s) => s.inventory)
  const inventoryLoading = useCosmeticsStore((s) => s.inventoryLoading)
  const loadout = useCosmeticsStore((s) => s.loadout)
  const loadoutWithDetails = useCosmeticsStore((s) => s.loadoutWithDetails)
  const loadoutLoading = useCosmeticsStore((s) => s.loadoutLoading)
  const error = useCosmeticsStore((s) => s.error)

  // Get actions from global store
  const storeFetchShop = useCosmeticsStore((s) => s.fetchShop)
  const storeFetchInventory = useCosmeticsStore((s) => s.fetchInventory)
  const storeFetchLoadout = useCosmeticsStore((s) => s.fetchLoadout)
  const storePurchaseCosmetic = useCosmeticsStore((s) => s.purchaseCosmetic)
  const storeEquipCosmetic = useCosmeticsStore((s) => s.equipCosmetic)
  const storeUnequipCosmetic = useCosmeticsStore((s) => s.unequipCosmetic)
  const clearError = useCosmeticsStore((s) => s.clearError)

  // Wrap store actions with token
  // Note: force=false by default - store handles caching (2 min TTL)
  // Only pass force=true when user explicitly requests refresh
  const fetchShop = useCallback(
    async (_filters?: ShopFilters) => {
      await storeFetchShop(token, false)
    },
    [token, storeFetchShop]
  )

  const fetchInventory = useCallback(async () => {
    await storeFetchInventory(token, false)
  }, [token, storeFetchInventory])

  const fetchLoadout = useCallback(async () => {
    await storeFetchLoadout(token, false)
  }, [token, storeFetchLoadout])

  const purchaseCosmetic = useCallback(
    async (cosmeticId: string) => {
      return storePurchaseCosmetic(token, cosmeticId)
    },
    [token, storePurchaseCosmetic]
  )

  const equipCosmetic = useCallback(
    async (cosmeticId: string) => {
      await storeEquipCosmetic(token, cosmeticId)
    },
    [token, storeEquipCosmetic]
  )

  const unequipCosmetic = useCallback(
    async (cosmeticId: string) => {
      await storeUnequipCosmetic(token, cosmeticId)
    },
    [token, storeUnequipCosmetic]
  )

  return {
    shopItems,
    shopLoading,
    fetchShop,
    inventory,
    inventoryLoading,
    fetchInventory,
    loadout,
    loadoutWithDetails,
    loadoutLoading,
    fetchLoadout,
    purchaseCosmetic,
    equipCosmetic,
    unequipCosmetic,
    error,
    clearError,
  }
}
