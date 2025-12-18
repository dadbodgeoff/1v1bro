/**
 * LoadoutPanel - Enhanced Loadout Display Component
 * 
 * Features:
 * - 6 loadout slots in responsive grid (3x2 mobile, 6x1 desktop)
 * - Slot type icons and labels for each slot
 * - Filled slot styling with item preview and rarity border
 * - Empty slot styling with dashed border and placeholder icon
 * - Click handler to filter inventory by slot type
 * - Hover effects on slots
 * 
 * Typography:
 * - Slot type: sm (14px) semibold, uppercase tracking-wider, muted color
 * - Item name: base (16px) medium, white text, truncate overflow
 * - Empty slot: sm (14px) regular, muted color, italic
 */

import { cn } from '@/utils/helpers'
import type { Loadout, InventoryItem, CosmeticType } from '@/types/cosmetic'
import { getCosmeticTypeName } from '@/types/cosmetic'
import { rarityBorders, rarityGlowsSubtle } from '@/styles/rarity'
import { DynamicImage } from '@/components/shop/DynamicImage'
import { SkinPreview, type SkinId } from '@/components/shop/SkinPreview'

// Types that are coming soon and not yet implemented
const COMING_SOON_TYPES: CosmeticType[] = ['nameplate', 'effect', 'trail']

interface LoadoutPanelProps {
  loadout: Loadout | null
  inventory: InventoryItem[]
  onSlotClick: (type: CosmeticType) => void
  onUnequip?: (cosmeticId: string) => void
  className?: string
}

const SLOTS: CosmeticType[] = ['skin', 'runner', 'emote', 'banner', 'playercard', 'nameplate', 'effect', 'trail']

export const SLOT_ICONS: Record<CosmeticType, string> = {
  skin: '👤',
  emote: '💃',
  banner: '🏳️',
  nameplate: '🏷️',
  effect: '✨',
  trail: '🌟',
  playercard: '🎴',
  runner: '🏃',
  arena_character: '🎮',
}

export function LoadoutPanel({
  loadout,
  inventory,
  onSlotClick,
  onUnequip,
  className,
}: LoadoutPanelProps) {
  const getEquippedItem = (type: CosmeticType): InventoryItem | undefined => {
    const cosmeticId = loadout?.[type as keyof Loadout]
    if (!cosmeticId) return undefined
    return inventory.find((item) => item.cosmetic_id === cosmeticId || item.cosmetic?.id === cosmeticId)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Responsive Grid: 4 cols on mobile, 8 on desktop */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
        {SLOTS.map((type) => {
          const equippedItem = getEquippedItem(type)
          const rarity = equippedItem?.cosmetic?.rarity

          return (
            <button
              key={type}
              onClick={() => onSlotClick(type)}
              className={cn(
                'relative rounded-xl p-3 transition-all duration-200',
                'hover:-translate-y-0.5',
                'focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50',
                equippedItem ? [
                  'bg-[var(--color-bg-elevated)] border-2',
                  rarity && rarityBorders[rarity],
                  rarity && rarityGlowsSubtle[rarity],
                ] : [
                  'bg-[var(--color-bg-card)] border-2 border-dashed border-[var(--color-border-subtle)]',
                  'hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-elevated)]',
                ]
              )}
              title={equippedItem ? `Click to change ${getCosmeticTypeName(type)}` : `Click to equip ${getCosmeticTypeName(type)}`}
            >
              {/* Slot Content */}
              <div className="aspect-square bg-[var(--color-bg-card)] rounded-lg flex items-center justify-center mb-2 overflow-hidden relative">
                {/* Coming Soon overlay for unimplemented types */}
                {COMING_SOON_TYPES.includes(type) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded-lg">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Coming Soon</span>
                  </div>
                )}
                {equippedItem ? (
                  // Priority: 1. Static thumbnail (PNG/WebP), 2. Sprite sheet, 3. Fallback image
                  (() => {
                    const cosmetic = equippedItem.cosmetic
                    const hasStaticThumbnail = cosmetic.shop_preview_url && !cosmetic.shop_preview_url.endsWith('.glb')
                    const hasSpriteSheet = cosmetic.sprite_sheet_url
                    
                    if (hasStaticThumbnail) {
                      return (
                        <DynamicImage
                          src={cosmetic.shop_preview_url}
                          alt={cosmetic.name}
                          className="w-full h-full object-cover p-1"
                          removeBackgroundMode="auto"
                        />
                      )
                    } else if ((cosmetic.type === 'skin' || cosmetic.type === 'runner') && hasSpriteSheet) {
                      return (
                        <SkinPreview
                          spriteSheetUrl={cosmetic.sprite_sheet_url}
                          metadataUrl={cosmetic.sprite_meta_url}
                          skinId={cosmetic.skin_id as SkinId | undefined}
                          size={80}
                          animate={false}
                          frameIndex={0}
                        />
                      )
                    } else {
                      return (
                        <DynamicImage
                          src={cosmetic.image_url}
                          alt={cosmetic.name}
                          className="w-full h-full object-contain p-1"
                          removeBackgroundMode="auto"
                        />
                      )
                    }
                  })()
                ) : (
                  <span className="text-3xl opacity-30">{SLOT_ICONS[type]}</span>
                )}
              </div>

              {/* Slot Label */}
              <div className="text-center space-y-0.5">
                {/* Slot Type */}
                <div className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {getCosmeticTypeName(type)}
                </div>
                
                {/* Item Name or Empty Label */}
                {equippedItem ? (
                  <div className="text-base font-medium text-white truncate">
                    {equippedItem.cosmetic.name}
                  </div>
                ) : (
                  <div className="text-sm text-[var(--color-text-muted)] italic">
                    Empty
                  </div>
                )}
              </div>

              {/* Unequip Button (shown on hover for equipped items) */}
              {equippedItem && onUnequip && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const cosmeticId = equippedItem.cosmetic_id || equippedItem.cosmetic?.id
                    if (cosmeticId) onUnequip(cosmeticId)
                  }}
                  className={cn(
                    'absolute top-1 right-1 w-6 h-6 rounded-full',
                    'bg-[#374151] hover:bg-[#ef4444] text-white',
                    'flex items-center justify-center',
                    'opacity-0 group-hover:opacity-100 transition-opacity',
                    'text-xs font-bold'
                  )}
                  title="Unequip"
                >
                  ✕
                </button>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
