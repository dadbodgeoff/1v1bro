/**
 * Cosmetic types for shop and inventory.
 * Requirements: 3.1, 3.2
 */

/**
 * Types of cosmetic items.
 */
export type CosmeticType = 'skin' | 'emote' | 'banner' | 'nameplate' | 'effect' | 'trail' | 'playercard' | 'runner';

/**
 * Rarity levels for cosmetics.
 */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/**
 * Rarity colors for display.
 */
export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#9ca3af',     // gray
  uncommon: '#22c55e',   // green
  rare: '#3b82f6',       // blue
  epic: '#a855f7',       // purple
  legendary: '#f59e0b',  // orange
};

/**
 * Rarity background gradients.
 */
export const RARITY_GRADIENTS: Record<Rarity, string> = {
  common: 'from-gray-600 to-gray-700',
  uncommon: 'from-green-600 to-green-700',
  rare: 'from-blue-600 to-blue-700',
  epic: 'from-[#a855f7] to-[#9333ea]',
  legendary: 'from-orange-500 to-yellow-600',
};

/**
 * Cosmetic item from catalog.
 */
export interface Cosmetic {
  id: string;
  name: string;
  description?: string;
  type: CosmeticType;
  rarity: Rarity;
  price_coins: number;
  image_url: string;
  shop_preview_url?: string;  // Custom shop preview image (takes priority over image_url)
  preview_video_url?: string;
  model_url?: string;  // 3D GLB model URL for interactive preview
  is_limited: boolean;
  event?: string;
  release_date?: string;
  owned_by_count?: number;
  available_until?: string;
  skin_id?: string;  // Maps to frontend SkinId for sprite-based skins
  // Dynamic asset URLs (from CMS)
  sprite_sheet_url?: string;
  sprite_meta_url?: string;
  is_featured?: boolean;
  sort_order?: number;
}

/**
 * Inventory item (owned cosmetic).
 */
export interface InventoryItem {
  id: string;
  cosmetic_id: string;
  cosmetic: Cosmetic;
  acquired_date: string;
  is_equipped: boolean;
}

/**
 * Player loadout (equipped items).
 */
export interface Loadout {
  skin?: string;
  emote?: string;
  banner?: string;
  nameplate?: string;
  effect?: string;
  trail?: string;
  playercard?: string;
  runner?: string;
}

/**
 * Shop filters.
 */
export interface ShopFilters {
  type?: CosmeticType;
  rarity?: Rarity;
  max_price?: number;
  search?: string;
}

/**
 * Get display name for cosmetic type.
 */
export function getCosmeticTypeName(type: CosmeticType): string {
  const names: Record<CosmeticType, string> = {
    skin: 'Skin',
    emote: 'Emote',
    banner: 'Banner',
    nameplate: 'Nameplate',
    effect: 'Effect',
    trail: 'Trail',
    playercard: 'Player Card',
    runner: 'Runner',
  };
  return names[type];
}

/**
 * Get slot name for loadout.
 */
export function getSlotForType(type: CosmeticType): keyof Loadout {
  return type;
}
