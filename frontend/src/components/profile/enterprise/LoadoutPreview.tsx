/**
 * LoadoutPreview - Equipped Cosmetics Display Component
 * 
 * Features:
 * - Horizontal row of 6 loadout slots
 * - Slot type icons for each slot
 * - Item preview (64px desktop, 48px mobile) with rarity border for filled slots
 * - Placeholder icon with dashed border for empty slots
 * - Item name below preview (truncated)
 * - Rarity glow on hover for filled slots
 * - "Customize" link to inventory page
 * - Responsive layout (6x1 desktop, 3x2 mobile)
 * 
 * Props:
 * - loadout: Loadout data with equipped item IDs
 * - inventory: Array of InventoryItems to get cosmetic details
 * - showCustomizeLink: Show link to inventory
 * - onCustomize: Callback when customize is clicked
 * - className: Additional CSS classes
 */

import { cn } from '@/utils/helpers'
import type { Loadout, InventoryItem, CosmeticType, Rarity } from '@/types/cosmetic'
import { RARITY_COLORS } from '@/types/cosmetic'
import { DynamicImage } from '@/components/shop/DynamicImage'

interface LoadoutPreviewProps {
  loadout: Loadout | null
  inventory?: InventoryItem[]
  showCustomizeLink?: boolean
  onCustomize?: () => void
  className?: string
}

// Slot configuration
const SLOT_TYPES: CosmeticType[] = ['skin', 'emote', 'banner', 'nameplate', 'effect', 'trail']

const SLOT_ICONS: Record<CosmeticType, string> = {
  skin: '👤',
  emote: '😀',
  banner: '🏳️',
  nameplate: '📛',
  effect: '✨',
  trail: '💫',
  playercard: '🎴',
}

const SLOT_LABELS: Record<CosmeticType, string> = {
  skin: 'Skin',
  emote: 'Emote',
  banner: 'Banner',
  nameplate: 'Nameplate',
  effect: 'Effect',
  trail: 'Trail',
  playercard: 'Player Card',
}

/**
 * Get rarity styling for slot border and glow
 */
export function getRaritySlotStyle(rarity: Rarity): {
  border: string
  glow: string
} {
  const styles: Record<Rarity, { border: string; glow: string }> = {
    common: { 
      border: `border-[${RARITY_COLORS.common}]`, 
      glow: '' 
    },
    uncommon: { 
      border: `border-[${RARITY_COLORS.uncommon}]`, 
      glow: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
    },
    rare: { 
      border: `border-[${RARITY_COLORS.rare}]`, 
      glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
    },
    epic: { 
      border: `border-[${RARITY_COLORS.epic}]`, 
      glow: 'hover:shadow-[0_0_25px_rgba(168,85,247,0.3)]' 
    },
    legendary: { 
      border: `border-[${RARITY_COLORS.legendary}]`, 
      glow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]' 
    },
  }
  return styles[rarity]
}

/**
 * Check if a slot has an equipped item
 */
export function isSlotFilled(loadout: Loadout | null, slotType: CosmeticType): boolean {
  if (!loadout) return false
  return !!loadout[slotType as keyof Loadout]
}

export function LoadoutPreview({
  loadout,
  inventory = [],
  showCustomizeLink = true,
  onCustomize,
  className,
}: LoadoutPreviewProps) {
  // Get equipped item details from inventory
  const getEquippedItem = (slotType: CosmeticType): InventoryItem | undefined => {
    if (!loadout) return undefined
    const equippedId = loadout[slotType as keyof Loadout]
    if (!equippedId) return undefined
    return inventory.find(item => item.cosmetic_id === equippedId || item.cosmetic.id === equippedId)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Slots Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {SLOT_TYPES.map((slotType) => {
          const equippedItem = getEquippedItem(slotType)
          const isFilled = !!equippedItem

          return (
            <div key={slotType} className="flex flex-col items-center gap-2">
              {/* Slot Container */}
              <div
                className={cn(
                  'relative w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center transition-all duration-200',
                  isFilled
                    ? 'bg-[var(--color-bg-elevated)] border-2'
                    : 'bg-[var(--color-bg-card)] border-2 border-dashed border-[var(--color-border-subtle)]'
                )}
                style={isFilled && equippedItem ? {
                  borderColor: RARITY_COLORS[equippedItem.cosmetic.rarity]
                } : undefined}
              >
                {isFilled && equippedItem ? (
                  // Filled Slot - Show Item Preview with background removal
                  <DynamicImage
                    src={equippedItem.cosmetic.image_url}
                    alt={equippedItem.cosmetic.name}
                    className="w-12 h-12 md:w-16 md:h-16 object-contain"
                    removeBackgroundMode="auto"
                  />
                ) : (
                  // Empty Slot - Show Icon
                  <span className="text-2xl opacity-50">
                    {SLOT_ICONS[slotType]}
                  </span>
                )}
              </div>

              {/* Slot Label */}
              <span className={cn(
                'text-xs font-medium truncate max-w-full',
                isFilled ? 'text-white' : 'text-[var(--color-text-muted)]'
              )}>
                {isFilled && equippedItem 
                  ? equippedItem.cosmetic.name 
                  : SLOT_LABELS[slotType]
                }
              </span>
            </div>
          )
        })}
      </div>

      {/* Customize Link */}
      {showCustomizeLink && onCustomize && (
        <button
          onClick={onCustomize}
          className="w-full py-2 text-sm font-semibold text-[#6366f1] hover:text-[#818cf8] transition-colors text-center rounded-lg hover:bg-white/5"
        >
          Customize Loadout
        </button>
      )}
    </div>
  )
}
