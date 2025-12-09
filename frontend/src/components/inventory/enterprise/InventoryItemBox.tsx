/**
 * InventoryItemBox - Configurable Size Display Component
 * 
 * Enterprise Standard Box Sizes:
 * - XL (Featured): 420px min-height, 240px image, full details
 * - LG (Spotlight): 200px min-height, 160px image, with description
 * - MD (Standard): 280px min-height, 120px image, essential info
 * - SM (Compact): 180px min-height, 80px image, name + type only
 * 
 * Typography Hierarchy per size:
 * - XL: 28px extrabold title, 12px uppercase type label, 14px description
 * - LG: 22px bold title, 11px uppercase type label, 13px description
 * - MD: 16px bold title, 10px uppercase type label, no description
 * - SM: 14px semibold title, no type label, no description
 * 
 * Features:
 * - Rarity borders, glows, and background gradients
 * - Equipped indicator (green checkmark badge, "EQUIPPED" label)
 * - Acquired date display for larger sizes
 * - Hover lift effect (translateY -2px)
 * - SkinPreview support for animated skins
 */

import { cn } from '@/utils/helpers'
import type { InventoryItem, Rarity, CosmeticType } from '@/types/cosmetic'
import { getCosmeticTypeName } from '@/types/cosmetic'
import { SkinPreview, type SkinId } from '@/components/shop/SkinPreview'
import { DynamicImage } from '@/components/shop/DynamicImage'
import { Badge } from '@/components/ui/Badge'
import { EquipCTA } from './EquipCTA'

// Types that are coming soon and not yet implemented
const COMING_SOON_TYPES: CosmeticType[] = ['nameplate', 'effect', 'trail']

export type DisplaySize = 'xl' | 'lg' | 'md' | 'sm'

interface InventoryItemBoxProps {
  item: InventoryItem
  size?: DisplaySize
  onEquip: () => void
  onUnequip: () => void
  onViewDetails?: () => void
  className?: string
}

/**
 * Enterprise Standard Size Configuration
 * Each size has uniform, purpose-driven specifications
 */
export const sizeConfig = {
  // XL: Featured - Maximum visual impact
  xl: {
    container: 'col-span-2 row-span-2',
    minHeight: 'min-h-[420px]',
    imageSize: 240,
    imageWrapper: 'p-4',
    padding: 'p-6',
    gap: 'gap-4',
    badgeGap: 'mb-4',
    titleSize: 'text-2xl md:text-[28px]',
    titleWeight: 'font-extrabold',
    titleTracking: 'tracking-tight',
    typeSize: 'text-xs',
    descSize: 'text-sm',
    showDescription: true,
    showType: true,
    showAcquiredDate: true,
    badgeSize: 'md' as const,
    ctaSize: 'md' as const,
  },
  // LG: Spotlight - Horizontal emphasis
  lg: {
    container: 'col-span-2 row-span-1',
    minHeight: 'min-h-[200px]',
    imageSize: 160,
    imageWrapper: 'p-3',
    padding: 'p-5',
    gap: 'gap-3',
    badgeGap: 'mb-3',
    titleSize: 'text-xl md:text-[22px]',
    titleWeight: 'font-bold',
    titleTracking: 'tracking-tight',
    typeSize: 'text-[11px]',
    descSize: 'text-[13px]',
    showDescription: true,
    showType: true,
    showAcquiredDate: true,
    badgeSize: 'md' as const,
    ctaSize: 'md' as const,
  },
  // MD: Standard - Balanced grid item
  md: {
    container: 'col-span-1 row-span-1',
    minHeight: 'min-h-[280px]',
    imageSize: 120,
    imageWrapper: 'p-2',
    padding: 'p-4',
    gap: 'gap-2',
    badgeGap: 'mb-2',
    titleSize: 'text-base',
    titleWeight: 'font-bold',
    titleTracking: '',
    typeSize: 'text-[10px]',
    descSize: '',
    showDescription: false,
    showType: true,
    showAcquiredDate: false,
    badgeSize: 'sm' as const,
    ctaSize: 'sm' as const,
  },
  // SM: Compact - Minimal footprint
  sm: {
    container: 'col-span-1 row-span-1',
    minHeight: 'min-h-[180px]',
    imageSize: 80,
    imageWrapper: 'p-1',
    padding: 'p-3',
    gap: 'gap-1.5',
    badgeGap: 'mb-1.5',
    titleSize: 'text-sm',
    titleWeight: 'font-semibold',
    titleTracking: '',
    typeSize: '',
    descSize: '',
    showDescription: false,
    showType: false,
    showAcquiredDate: false,
    badgeSize: 'sm' as const,
    ctaSize: 'sm' as const,
  },
}

export const rarityBorders: Record<Rarity, string> = {
  common: 'border-[#737373]/40',
  uncommon: 'border-[#10b981]/40',
  rare: 'border-[#3b82f6]/40',
  epic: 'border-[#a855f7]/40',
  legendary: 'border-[#f59e0b]/50',
}

export const rarityGlows: Record<Rarity, string> = {
  common: '',
  uncommon: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]',
  rare: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]',
  epic: 'hover:shadow-[0_0_35px_rgba(168,85,247,0.3)]',
  legendary: 'hover:shadow-[0_0_40px_rgba(245,158,11,0.35)]',
}

export const rarityBgGradients: Record<Rarity, string> = {
  common: 'from-[#737373]/5 to-transparent',
  uncommon: 'from-[#10b981]/10 to-transparent',
  rare: 'from-[#3b82f6]/10 to-transparent',
  epic: 'from-[#a855f7]/10 to-transparent',
  legendary: 'from-[#f59e0b]/15 to-transparent',
}

export const equippedGlow = 'shadow-[0_0_20px_rgba(16,185,129,0.3)]'

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

export function InventoryItemBox({
  item,
  size = 'md',
  onEquip,
  onUnequip,
  onViewDetails,
  className,
}: InventoryItemBoxProps) {
  const config = sizeConfig[size]
  const cosmetic = item.cosmetic
  const skinId: SkinId | null = cosmetic.type === 'skin' && cosmetic.skin_id 
    ? (cosmetic.skin_id as SkinId) 
    : null
  const hasDynamicSprite = cosmetic.type === 'skin' && cosmetic.sprite_sheet_url

  return (
    <div
      className={cn(
        'group relative bg-[var(--color-bg-card)] rounded-xl border-2 overflow-hidden',
        'transition-all duration-300 ease-out cursor-pointer',
        'hover:scale-[1.02] hover:-translate-y-0.5',
        rarityBorders[cosmetic.rarity],
        rarityGlows[cosmetic.rarity],
        item.is_equipped && equippedGlow,
        config.container,
        config.minHeight,
        className
      )}
      onClick={onViewDetails}
    >
      {/* Rarity Background Gradient */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br pointer-events-none',
        rarityBgGradients[cosmetic.rarity]
      )} />

      <div className={cn('relative h-full flex flex-col', config.padding)}>
        {/* Top Badges Row */}
        <div className={cn('flex items-start justify-between', config.badgeGap)}>
          {/* Equipped Badge */}
          {item.is_equipped ? (
            <div className={cn(
              'flex items-center bg-[#10b981] rounded-full',
              size === 'sm' ? 'gap-1 px-1.5 py-0.5' : 'gap-1.5 px-2 py-1'
            )}>
              <svg 
                className={size === 'sm' ? 'w-3 h-3 text-white' : 'w-4 h-4 text-white'} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className={cn(
                'font-bold text-white uppercase tracking-wide',
                size === 'sm' ? 'text-[9px]' : 'text-[10px]'
              )}>Equipped</span>
            </div>
          ) : (
            <div />
          )}
          
          {/* Rarity Badge */}
          <Badge 
            variant={cosmetic.rarity} 
            size={config.badgeSize}
            shimmer={cosmetic.rarity === 'legendary'}
          >
            {cosmetic.rarity.charAt(0).toUpperCase() + cosmetic.rarity.slice(1)}
          </Badge>
        </div>

        {/* Image/Preview Area */}
        <div className={cn('flex-1 flex items-center justify-center', config.imageWrapper)}>
          <div className="relative">
            {/* Coming Soon overlay for unimplemented types */}
            {COMING_SOON_TYPES.includes(cosmetic.type) && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded-lg">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Coming Soon</span>
              </div>
            )}
            {hasDynamicSprite ? (
              <SkinPreview
                spriteSheetUrl={cosmetic.sprite_sheet_url}
                metadataUrl={cosmetic.sprite_meta_url}
                size={config.imageSize}
                animate={item.is_equipped}
              />
            ) : skinId ? (
              <SkinPreview 
                skinId={skinId} 
                size={config.imageSize} 
                animate={item.is_equipped} 
              />
            ) : (
              <DynamicImage
                src={cosmetic.image_url}
                alt={cosmetic.name}
                className="rounded-lg object-contain"
                style={{ width: config.imageSize, height: config.imageSize }}
                removeBackgroundMode="auto"
              />
            )}
          </div>
        </div>

        {/* Item Info */}
        <div className={cn('flex flex-col', config.gap)}>
          <div>
            {/* Item Name */}
            <h3 className={cn(
              'text-white truncate leading-tight',
              config.titleSize,
              config.titleWeight,
              config.titleTracking
            )}>
              {cosmetic.name}
            </h3>
            
            {/* Item Type */}
            {config.showType && config.typeSize && (
              <p className={cn(
                'text-[var(--color-text-muted)] font-semibold uppercase tracking-wider mt-0.5',
                config.typeSize
              )}>
                {getCosmeticTypeName(cosmetic.type)}
              </p>
            )}
          </div>

          {/* Description */}
          {config.showDescription && cosmetic.description && (
            <p className={cn(
              'text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed',
              config.descSize
            )}>
              {cosmetic.description}
            </p>
          )}

          {/* Acquired Date */}
          {config.showAcquiredDate && item.acquired_date && (
            <p className="text-xs text-[var(--color-text-muted)]">
              Acquired {formatRelativeDate(item.acquired_date)}
            </p>
          )}

          {/* Equip CTA */}
          <div className="pt-1">
            <EquipCTA
              variant={item.is_equipped ? 'equipped' : 'default'}
              size={config.ctaSize}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                if (item.is_equipped) {
                  onUnequip()
                } else {
                  onEquip()
                }
              }}
              slotType={cosmetic.type}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
