/**
 * Cosmetics Store - Global state for shop, inventory, and loadout
 * Uses Zustand for shared state across all components
 * Requirements: 3.3-3.6
 */

import { create } from 'zustand'
import type { Cosmetic, InventoryItem, Loadout } from '@/types/cosmetic'
import { API_BASE } from '@/utils/constants'

/**
 * Raw loadout with full cosmetic objects (as returned by backend)
 */
export interface LoadoutWithDetails {
  user_id?: string
  skin_equipped: Cosmetic | null
  emote_equipped: Cosmetic | null
  banner_equipped: Cosmetic | null
  nameplate_equipped: Cosmetic | null
  effect_equipped: Cosmetic | null
  trail_equipped: Cosmetic | null
  playercard_equipped: Cosmetic | null
  runner_equipped: Cosmetic | null
}

interface CosmeticsState {
  // Shop
  shopItems: Cosmetic[]
  shopLoading: boolean
  shopLastFetched: number | null

  // Inventory
  inventory: InventoryItem[]
  inventoryLoading: boolean
  inventoryLastFetched: number | null

  // Loadout
  loadout: Loadout | null
  loadoutWithDetails: LoadoutWithDetails | null
  loadoutLoading: boolean

  // Error
  error: string | null

  // Actions
  fetchShop: (token: string | null, force?: boolean) => Promise<void>
  fetchInventory: (token: string | null, force?: boolean) => Promise<void>
  fetchLoadout: (token: string | null, force?: boolean) => Promise<void>
  purchaseCosmetic: (token: string | null, cosmeticId: string) => Promise<boolean>
  equipCosmetic: (token: string | null, cosmeticId: string) => Promise<void>
  unequipCosmetic: (token: string | null, cosmeticId: string) => Promise<void>
  clearError: () => void
  resetAll: () => void
}

// Cache duration: 2 minutes for shop/inventory (reduces API calls while keeping data fresh)
// Users can force refresh by navigating away and back
const CACHE_DURATION = 2 * 60 * 1000

const getAuthHeaders = (token: string | null) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

export const useCosmeticsStore = create<CosmeticsState>((set, get) => ({
  // Initial state
  shopItems: [],
  shopLoading: false,
  shopLastFetched: null,
  inventory: [],
  inventoryLoading: false,
  inventoryLastFetched: null,
  loadout: null,
  loadoutWithDetails: null,
  loadoutLoading: false,
  error: null,

  fetchShop: async (token, force = false) => {
    const state = get()
    const now = Date.now()

    // Skip if recently fetched (unless forced)
    if (!force && state.shopLastFetched && now - state.shopLastFetched < CACHE_DURATION) {
      return
    }

    set({ shopLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE}/cosmetics/shop`, {
        headers: getAuthHeaders(token),
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to fetch shop')

      const data = await response.json()
      const shopData = data.data || data
      set({
        shopItems: shopData.items || shopData || [],
        shopLoading: false,
        shopLastFetched: now,
      })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Unknown error',
        shopLoading: false,
      })
    }
  },

  fetchInventory: async (token, force = false) => {
    const state = get()
    const now = Date.now()

    if (!force && state.inventoryLastFetched && now - state.inventoryLastFetched < CACHE_DURATION) {
      return
    }

    set({ inventoryLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE}/cosmetics/me/inventory`, {
        headers: getAuthHeaders(token),
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to fetch inventory')

      const data = await response.json()
      const inventoryData = data.data || data
      set({
        inventory: inventoryData.items || inventoryData || [],
        inventoryLoading: false,
        inventoryLastFetched: now,
      })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Unknown error',
        inventoryLoading: false,
      })
    }
  },

  fetchLoadout: async (token, _force = false) => {
    set({ loadoutLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE}/cosmetics/me/equipped`, {
        headers: getAuthHeaders(token),
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to fetch loadout')

      const data = await response.json()
      const rawLoadout = data.data || data

      const detailedLoadout: LoadoutWithDetails = {
        user_id: rawLoadout.user_id,
        skin_equipped: rawLoadout.skin_equipped || null,
        emote_equipped: rawLoadout.emote_equipped || null,
        banner_equipped: rawLoadout.banner_equipped || null,
        nameplate_equipped: rawLoadout.nameplate_equipped || null,
        effect_equipped: rawLoadout.effect_equipped || null,
        trail_equipped: rawLoadout.trail_equipped || null,
        playercard_equipped: rawLoadout.playercard_equipped || null,
        runner_equipped: rawLoadout.runner_equipped || null,
      }

      const transformedLoadout: Loadout = {
        skin: rawLoadout.skin_equipped?.id ?? rawLoadout.skin_equipped ?? undefined,
        emote: rawLoadout.emote_equipped?.id ?? rawLoadout.emote_equipped ?? undefined,
        banner: rawLoadout.banner_equipped?.id ?? rawLoadout.banner_equipped ?? undefined,
        nameplate: rawLoadout.nameplate_equipped?.id ?? rawLoadout.nameplate_equipped ?? undefined,
        effect: rawLoadout.effect_equipped?.id ?? rawLoadout.effect_equipped ?? undefined,
        trail: rawLoadout.trail_equipped?.id ?? rawLoadout.trail_equipped ?? undefined,
        playercard: rawLoadout.playercard_equipped?.id ?? rawLoadout.playercard_equipped ?? undefined,
        runner: rawLoadout.runner_equipped?.id ?? rawLoadout.runner_equipped ?? undefined,
      }

      set({
        loadout: transformedLoadout,
        loadoutWithDetails: detailedLoadout,
        loadoutLoading: false,
      })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Unknown error',
        loadoutLoading: false,
      })
    }
  },

  purchaseCosmetic: async (token, cosmeticId) => {
    set({ error: null })
    try {
      const response = await fetch(`${API_BASE}/cosmetics/${cosmeticId}/purchase`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        credentials: 'include',
      })

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 402) {
          const detail = data.detail
          const message =
            typeof detail === 'object'
              ? `Insufficient coins: have ${detail.current_balance}, need ${detail.required}`
              : 'Insufficient coin balance'
          throw new Error(message)
        }
        throw new Error(data.detail || 'Purchase failed')
      }

      // Force refresh inventory after purchase
      await get().fetchInventory(token, true)
      return true
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error' })
      return false
    }
  },

  equipCosmetic: async (token, cosmeticId) => {
    set({ error: null })
    try {
      const response = await fetch(`${API_BASE}/cosmetics/${cosmeticId}/equip`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to equip cosmetic')

      // Force refresh loadout and inventory
      await Promise.all([get().fetchLoadout(token, true), get().fetchInventory(token, true)])
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error' })
      throw err
    }
  },

  unequipCosmetic: async (token, cosmeticId) => {
    set({ error: null })
    try {
      const { inventory } = get()
      const item = inventory.find((i) => i.cosmetic_id === cosmeticId || i.cosmetic?.id === cosmeticId)
      if (!item?.cosmetic?.type) {
        throw new Error('Cosmetic not found in inventory')
      }

      const response = await fetch(`${API_BASE}/cosmetics/me/unequip`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        credentials: 'include',
        body: JSON.stringify({ slot: item.cosmetic.type }),
      })

      if (!response.ok) throw new Error('Failed to unequip cosmetic')

      // Force refresh loadout and inventory
      await Promise.all([get().fetchLoadout(token, true), get().fetchInventory(token, true)])
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error' })
      throw err
    }
  },

  clearError: () => set({ error: null }),

  resetAll: () =>
    set({
      shopItems: [],
      shopLoading: false,
      shopLastFetched: null,
      inventory: [],
      inventoryLoading: false,
      inventoryLastFetched: null,
      loadout: null,
      loadoutWithDetails: null,
      loadoutLoading: false,
      error: null,
    }),
}))
