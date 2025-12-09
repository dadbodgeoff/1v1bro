/**
 * Cosmetics hook for shop, inventory, and loadout management.
 * Requirements: 3.3-3.6
 */

import { useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import type { Cosmetic, InventoryItem, Loadout, ShopFilters } from '../types/cosmetic';

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Raw loadout with full cosmetic objects (as returned by backend)
 */
export interface LoadoutWithDetails {
  user_id?: string;
  skin_equipped: Cosmetic | null;
  emote_equipped: Cosmetic | null;
  banner_equipped: Cosmetic | null;
  nameplate_equipped: Cosmetic | null;
  effect_equipped: Cosmetic | null;
  trail_equipped: Cosmetic | null;
  playercard_equipped: Cosmetic | null;
}

interface UseCosmeticsReturn {
  // Shop
  shopItems: Cosmetic[];
  shopLoading: boolean;
  fetchShop: (filters?: ShopFilters) => Promise<void>;
  
  // Inventory
  inventory: InventoryItem[];
  inventoryLoading: boolean;
  fetchInventory: () => Promise<void>;
  
  // Loadout
  loadout: Loadout | null;
  loadoutWithDetails: LoadoutWithDetails | null;  // Full cosmetic objects for display
  loadoutLoading: boolean;
  fetchLoadout: () => Promise<void>;
  
  // Actions
  purchaseCosmetic: (cosmeticId: string) => Promise<boolean>;
  equipCosmetic: (cosmeticId: string) => Promise<void>;
  unequipCosmetic: (cosmeticId: string) => Promise<void>;
  
  // State
  error: string | null;
  clearError: () => void;
}

export function useCosmetics(): UseCosmeticsReturn {
  const [shopItems, setShopItems] = useState<Cosmetic[]>([]);
  const [shopLoading, setShopLoading] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [loadout, setLoadout] = useState<Loadout | null>(null);
  const [loadoutWithDetails, setLoadoutWithDetails] = useState<LoadoutWithDetails | null>(null);
  const [loadoutLoading, setLoadoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get token from auth store instead of localStorage
  const token = useAuthStore((s) => s.token);

  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, [token]);

  const clearError = useCallback(() => setError(null), []);

  const fetchShop = useCallback(async (filters?: ShopFilters) => {
    setShopLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.set('type', filters.type);
      if (filters?.rarity) params.set('rarity', filters.rarity);
      if (filters?.max_price) params.set('max_price', filters.max_price.toString());
      if (filters?.search) params.set('search', filters.search);

      const url = `${API_BASE}/api/v1/cosmetics/shop${params.toString() ? `?${params}` : ''}`;
      const response = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch shop');
      
      const data = await response.json();
      // Handle API response wrapper
      const shopData = data.data || data;
      setShopItems(shopData.items || shopData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setShopLoading(false);
    }
  }, [getAuthHeaders]);

  const fetchInventory = useCallback(async () => {
    setInventoryLoading(true);
    setError(null);
    console.log('[useCosmetics] Fetching inventory...');
    try {
      // Fixed: endpoint is /cosmetics/me/inventory not /me/inventory
      const response = await fetch(`${API_BASE}/api/v1/cosmetics/me/inventory`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      console.log('[useCosmetics] Inventory response status:', response.status);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      
      const data = await response.json();
      console.log('[useCosmetics] Inventory raw response:', data);
      // Handle API response wrapper
      const inventoryData = data.data || data;
      const items = inventoryData.items || inventoryData || [];
      console.log('[useCosmetics] Inventory items:', items.length, items);
      setInventory(items);
    } catch (err) {
      console.error('[useCosmetics] Inventory fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setInventoryLoading(false);
    }
  }, [getAuthHeaders]);

  const fetchLoadout = useCallback(async () => {
    setError(null);
    setLoadoutLoading(true);
    try {
      // Fixed: endpoint is /cosmetics/me/equipped not /cosmetics/equipped
      const response = await fetch(`${API_BASE}/api/v1/cosmetics/me/equipped`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch loadout');
      
      const data = await response.json();
      // Handle API response wrapper
      const rawLoadout = data.data || data;
      
      // Store full loadout with cosmetic details for display components
      const detailedLoadout: LoadoutWithDetails = {
        user_id: rawLoadout.user_id,
        skin_equipped: rawLoadout.skin_equipped || null,
        emote_equipped: rawLoadout.emote_equipped || null,
        banner_equipped: rawLoadout.banner_equipped || null,
        nameplate_equipped: rawLoadout.nameplate_equipped || null,
        effect_equipped: rawLoadout.effect_equipped || null,
        trail_equipped: rawLoadout.trail_equipped || null,
        playercard_equipped: rawLoadout.playercard_equipped || null,
      };
      setLoadoutWithDetails(detailedLoadout);
      
      // Transform backend schema (skin_equipped: Cosmetic) to frontend schema (skin: string)
      // Backend returns full Cosmetic objects, frontend expects just IDs
      const transformedLoadout: Loadout = {
        skin: rawLoadout.skin_equipped?.id ?? rawLoadout.skin_equipped ?? undefined,
        emote: rawLoadout.emote_equipped?.id ?? rawLoadout.emote_equipped ?? undefined,
        banner: rawLoadout.banner_equipped?.id ?? rawLoadout.banner_equipped ?? undefined,
        nameplate: rawLoadout.nameplate_equipped?.id ?? rawLoadout.nameplate_equipped ?? undefined,
        effect: rawLoadout.effect_equipped?.id ?? rawLoadout.effect_equipped ?? undefined,
        trail: rawLoadout.trail_equipped?.id ?? rawLoadout.trail_equipped ?? undefined,
        playercard: rawLoadout.playercard_equipped?.id ?? rawLoadout.playercard_equipped ?? undefined,
      };
      
      setLoadout(transformedLoadout);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoadoutLoading(false);
    }
  }, [getAuthHeaders]);

  const purchaseCosmetic = useCallback(async (cosmeticId: string): Promise<boolean> => {
    setError(null);
    console.log('[useCosmetics] Starting purchase for:', cosmeticId);
    try {
      const url = `${API_BASE}/api/v1/cosmetics/${cosmeticId}/purchase`;
      console.log('[useCosmetics] POST to:', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      console.log('[useCosmetics] Purchase response status:', response.status);
      if (!response.ok) {
        const data = await response.json();
        console.log('[useCosmetics] Purchase failed:', data);
        
        // Handle insufficient funds (402 Payment Required)
        if (response.status === 402) {
          const detail = data.detail;
          const message = typeof detail === 'object' 
            ? `Insufficient coins: have ${detail.current_balance}, need ${detail.required}`
            : 'Insufficient coin balance';
          throw new Error(message);
        }
        
        throw new Error(data.detail || 'Purchase failed');
      }

      const result = await response.json();
      console.log('[useCosmetics] Purchase success:', result);

      // Refresh inventory after purchase
      await fetchInventory();
      return true;
    } catch (err) {
      console.error('[useCosmetics] Purchase error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [getAuthHeaders, fetchInventory]);

  const equipCosmetic = useCallback(async (cosmeticId: string) => {
    setError(null);
    console.log('[useCosmetics] Starting equip for:', cosmeticId);
    try {
      const url = `${API_BASE}/api/v1/cosmetics/${cosmeticId}/equip`;
      console.log('[useCosmetics] POST to:', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      console.log('[useCosmetics] Equip response status:', response.status);
      if (!response.ok) {
        const data = await response.json();
        console.log('[useCosmetics] Equip failed:', data);
        throw new Error('Failed to equip cosmetic');
      }

      const result = await response.json();
      console.log('[useCosmetics] Equip success:', result);

      // Refresh loadout and inventory
      await Promise.all([fetchLoadout(), fetchInventory()]);
    } catch (err) {
      console.error('[useCosmetics] Equip error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [getAuthHeaders, fetchLoadout, fetchInventory]);

  const unequipCosmetic = useCallback(async (cosmeticId: string) => {
    setError(null);
    try {
      // Backend expects { slot: CosmeticType } not { cosmetic_id }
      // Look up the cosmetic type from inventory
      const item = inventory.find(i => i.cosmetic_id === cosmeticId || i.cosmetic?.id === cosmeticId);
      if (!item?.cosmetic?.type) {
        throw new Error('Cosmetic not found in inventory');
      }
      
      const response = await fetch(`${API_BASE}/api/v1/cosmetics/me/unequip`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ slot: item.cosmetic.type }),
      });

      if (!response.ok) throw new Error('Failed to unequip cosmetic');

      // Refresh loadout and inventory
      await Promise.all([fetchLoadout(), fetchInventory()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [getAuthHeaders, fetchLoadout, fetchInventory, inventory]);

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
  };
}
