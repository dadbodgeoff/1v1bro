/**
 * LoadoutPreviewWidget - Enterprise Loadout Preview Widget
 * 
 * Current equipped cosmetics display for the dashboard.
 * 
 * Features:
 * - Widget header with "Your Loadout" title and "Customize" link
 * - 3 equipped item slots: Skin, Banner, Player Card
 * - Item preview image (64px) and name when equipped
 * - Placeholder icon and "Empty" label when empty
 * - Rarity border color on equipped items
 * - Navigate to /inventory on click
 * - Uses loadoutWithDetails for direct item data (no inventory dependency)
 * 
 * Props:
 * @param className - Additional CSS classes
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCosmetics } from '@/hooks/useCosmetics'
import { RARITY_COLORS, type CosmeticType, type Rarity, type Cosmetic, type InventoryItem } from '@/types/cosmetic'
import { DashboardSection } from './DashboardSection'
import { SkinPreview } from '@/components/shop/SkinPreview'

export interface LoadoutPreviewWidgetProps {
  className?: string
}

export interface LoadoutSlotData {
  type: CosmeticType
  label: string
  item: {
    id: string
    name: string
    previewUrl: string | null
    rarity: Rarity
  } | null
}

/**
 * Gets the display state for a loadout slot from full cosmetic data
 * @param slotType - The cosmetic type for this slot
 * @param cosmetic - The equipped cosmetic object (or null)
 * @returns Slot data with item details or null
 */
export function getSlotDisplayStateFromCosmetic(
  slotType: CosmeticType,
  cosmetic: Cosmetic | null
): LoadoutSlotData {
  const labels: Record<CosmeticType, string> = {
    skin: 'Skin',
    banner: 'Banner',
    playercard: 'Player Card',
    emote: 'Emote',
    nameplate: 'Nameplate',
    effect: 'Effect',
    trail: 'Trail',
  }

  if (!cosmetic) {
    return { type: slotType, label: labels[slotType], item: null }
  }

  return {
    type: slotType,
    label: labels[slotType],
    item: {
      id: cosmetic.id,
      name: cosmetic.name,
      previewUrl: cosmetic.image_url || null,
      rarity: cosmetic.rarity,
    },
  }
}

/**
 * Gets the display state for a loadout slot (legacy - uses inventory lookup)
 * @param slotType - The cosmetic type for this slot
 * @param loadoutId - The equipped item ID (or undefined)
 * @param inventory - Full inventory to look up item details
 * @returns Slot data with item details or null
 * @deprecated Use getSlotDisplayStateFromCosmetic with loadoutWithDetails instead
 */
export function getSlotDisplayState(
  slotType: CosmeticType,
  loadoutId: string | undefined,
  inventory: InventoryItem[]
): LoadoutSlotData {
  const labels: Record<CosmeticType, string> = {
    skin: 'Skin',
    banner: 'Banner',
    playercard: 'Player Card',
    emote: 'Emote',
    nameplate: 'Nameplate',
    effect: 'Effect',
    trail: 'Trail',
  }

  if (!loadoutId) {
    return { type: slotType, label: labels[slotType], item: null }
  }

  const inventoryItem = inventory.find(
    i => i.cosmetic_id === loadoutId || i.cosmetic?.id === loadoutId
  )

  if (!inventoryItem?.cosmetic) {
    return { type: slotType, label: labels[slotType], item: null }
  }

  return {
    type: slotType,
    label: labels[slotType],
    item: {
      id: inventoryItem.cosmetic.id,
      name: inventoryItem.cosmetic.name,
      previewUrl: inventoryItem.cosmetic.image_url || null,
      rarity: inventoryItem.cosmetic.rarity,
    },
  }
}

/**
 * Gets rarity border color for equipped items
 * @param rarity - Item rarity
 * @returns CSS border color
 */
export function getSlotBorderColor(rarity: Rarity | null): string {
  if (!rarity) return 'border-white/[0.08]'
  return `border-[${RARITY_COLORS[rarity]}]`
}

export function LoadoutPreviewWidget({ className }: LoadoutPreviewWidgetProps) {
  const navigate = useNavigate()
  const { loadoutWithDetails, loadoutLoading, fetchLoadout } = useCosmetics()

  useEffect(() => {
    fetchLoadout()
  }, [fetchLoadout])

  const handleClick = () => {
    navigate('/inventory')
  }

  const handleCustomize = () => {
    navigate('/inventory')
  }

  // Get slot data for the 3 main slots directly from loadoutWithDetails
  // No inventory lookup needed - backend returns full cosmetic objects
  const slots: LoadoutSlotData[] = [
    getSlotDisplayStateFromCosmetic('skin', loadoutWithDetails?.skin_equipped ?? null),
    getSlotDisplayStateFromCosmetic('banner', loadoutWithDetails?.banner_equipped ?? null),
    getSlotDisplayStateFromCosmetic('playercard', loadoutWithDetails?.playercard_equipped ?? null),
  ]

  // Loading state
  if (loadoutLoading && !loadoutWithDetails) {
    return (
      <DashboardSection
        title="Your Loadout"
        actionLabel="Customize"
        onAction={handleCustomize}
        className={className}
      >
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-white/[0.05] rounded-lg mb-2" />
              <div className="h-3 w-12 bg-white/[0.1] rounded mx-auto" />
            </div>
          ))}
        </div>
      </DashboardSection>
    )
  }

  return (
    <DashboardSection
      title="Your Loadout"
      actionLabel="Customize"
      onAction={handleCustomize}
      onClick={handleClick}
      className={className}
    >
      {/* Slots grid - Requirements 5.1 */}
      <div className="grid grid-cols-3 gap-3">
        {slots.map((slot) => (
          <LoadoutSlot key={slot.type} slot={slot} onClick={handleClick} />
        ))}
      </div>
    </DashboardSection>
  )
}

// Loadout Slot Component
interface LoadoutSlotProps {
  slot: LoadoutSlotData
  onClick?: () => void
}

function LoadoutSlot({ slot, onClick }: LoadoutSlotProps) {
  const hasItem = slot.item !== null
  const rarityColor = slot.item?.rarity ? RARITY_COLORS[slot.item.rarity] : null
  const isSkin = slot.type === 'skin'

  return (
    <button
      onClick={onClick}
      className="group text-center transition-all duration-200 hover:-translate-y-0.5 w-full"
    >
      {/* Slot preview - 64px - Requirements 5.2, 5.3 */}
      <div
        className={`
          relative aspect-square rounded-lg overflow-hidden mb-2 transition-all duration-200
          ${hasItem 
            ? 'border-2' 
            : 'border-2 border-dashed border-white/[0.08] group-hover:border-white/20'
          }
        `}
        style={hasItem && rarityColor ? { 
          borderColor: `${rarityColor}66`,
          boxShadow: `0 0 0 0 ${rarityColor}00`
        } : undefined}
        onMouseEnter={(e) => {
          if (hasItem && rarityColor) {
            e.currentTarget.style.borderColor = rarityColor
            e.currentTarget.style.boxShadow = `0 0 12px ${rarityColor}40`
          }
        }}
        onMouseLeave={(e) => {
          if (hasItem && rarityColor) {
            e.currentTarget.style.borderColor = `${rarityColor}66`
            e.currentTarget.style.boxShadow = `0 0 0 0 ${rarityColor}00`
          }
        }}
      >
        {hasItem && slot.item ? (
          // Equipped item - Requirements 5.2
          // Use SkinPreview for skins to show sprite sheet frame
          isSkin && slot.item.previewUrl ? (
            <SkinPreview
              spriteSheetUrl={slot.item.previewUrl}
              size={64}
              animate={false}
              frameIndex={0}
              className="w-full h-full"
            />
          ) : slot.item.previewUrl ? (
            <img
              src={slot.item.previewUrl}
              alt={slot.item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-white/[0.05] flex items-center justify-center">
              <SlotIcon type={slot.type} className="w-6 h-6 text-neutral-400" />
            </div>
          )
        ) : (
          // Empty slot - Requirements 5.3
          <div className="w-full h-full bg-white/[0.02] flex items-center justify-center group-hover:bg-white/[0.04]">
            <SlotIcon type={slot.type} className="w-6 h-6 text-neutral-600 opacity-50 group-hover:opacity-70" />
          </div>
        )}

        {/* Rarity indicator dot for equipped items */}
        {hasItem && rarityColor && (
          <div 
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ backgroundColor: rarityColor }}
          />
        )}
      </div>

      {/* Slot label/name - xs font, truncated - Requirements 5.2, 5.3 */}
      <p className={`text-xs truncate ${hasItem ? 'text-neutral-300 group-hover:text-white' : 'text-neutral-500 group-hover:text-neutral-400'}`}>
        {hasItem && slot.item ? slot.item.name : 'Empty'}
      </p>
      
      {/* Slot type label */}
      <p className="text-[10px] text-neutral-600 group-hover:text-neutral-500">
        {slot.label}
      </p>
    </button>
  )
}

// Slot Icon Component
function SlotIcon({ type, className }: { type: CosmeticType; className?: string }) {
  switch (type) {
    case 'skin':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    case 'banner':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      )
    case 'playercard':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
      )
    default:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
  }
}
