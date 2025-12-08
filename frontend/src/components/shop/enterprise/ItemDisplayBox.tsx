/**
 * ItemDisplayBox - Configurable Size Display Component
 * 
 * Enterprise Standard Box Sizes:
 * - XL (Featured Hero): 2x2 grid span, large preview, full details
 * - LG (Spotlight): 2x1 horizontal, medium preview, with description
 * - MD (Standard): 1x1 grid cell, compact preview, essential info
 * - SM (Compact): 1x1 minimal, small preview, name + price only
 * 
 * Typography Hierarchy per size:
 * - XL: 28px title, 12px type label, 14px description
 * - LG: 22px title, 11px type label, 13px description  
 * - MD: 16px title, 10px type label, no description
 * - SM: 14px title, no type label, no description
 */

import { cn } from '@/utils/helpers'
import type { Cosmetic, Rarity } from '@/types/cosmetic'
import { getCosmeticTypeName } from '@/types/cosmetic'
import { SkinPreview, type SkinId } from '../SkinPreview'
import { DynamicImage } from '../DynamicImage'
import { PriceTag } from './PriceTag'
import { UrgencyCTA } from './UrgencyCTA'
import { Badge } from '@/components/ui/Badge'

type DisplaySize = 'xl' | 'lg' | 'md' | 'sm'

interface ItemDisplayBoxProps {
  item: Cosmetic
  size?: DisplaySize
  isOwned?: boolean
  onPurchase: () => void
  onViewDetails?: () => void
  showQuickBuy?: boolean
  className?: string
}

/**
 * Enterprise Standard Size Configuration
 * Each size has uniform, purpose-driven specifications
 */
const sizeConfig = {
  // XL: Featured Hero - Maximum visual impact
  xl: {
    // Grid behavior
    container: 'col-span-2 row-span-2',
    minHeight: 'min-h-[420px]',
    // Asset display
    imageSize: 240,
    imageWrapper: 'p-4',
    // Spacing
    padding: 'p-6',
    gap: 'gap-4',
    badgeGap: 'mb-4',
    // Typography
    titleSize: 'text-2xl md:text-[28px]',
    titleWeight: 'font-extrabold',
    titleTracking: 'tracking-tight',
    typeSize: 'text-xs',
    descSize: 'text-sm',
    // Content visibility
    showDescription: true,
    showType: true,
    // Component sizes
    badgeSize: 'md' as const,
    priceSize: 'lg' as const,
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
    badgeSize: 'md' as const,
    priceSize: 'md' as const,
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
    badgeSize: 'sm' as const,
    priceSize: 'sm' as const,
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
    badgeSize: 'sm' as const,
    priceSize: 'sm' as const,
    ctaSize: 'sm' as const,
  },
}

const rarityBorders: Record<Rarity, string> = {
  common: 'border-[#737373]/40',
  uncommon: 'border-[#10b981]/40',
  rare: 'border-[#3b82f6]/40',
  epic: 'border-[#a855f7]/40',
  legendary: 'border-[#f59e0b]/50',
}

const rarityGlows: Record<Rarity, string> = {
  common: '',
  uncommon: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]',
  rare: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]',
  epic: 'hover:shadow-[0_0_35px_rgba(168,85,247,0.3)]',
  legendary: 'hover:shadow-[0_0_40px_rgba(245,158,11,0.35)]',
}

const rarityBgGradients: Record<Rarity, string> = {
  common: 'from-[#737373]/5 to-transparent',
  uncommon: 'from-[#10b981]/10 to-transparent',
  rare: 'from-[#3b82f6]/10 to-transparent',
  epic: 'from-[#a855f7]/10 to-transparent',
  legendary: 'from-[#f59e0b]/15 to-transparent',
}

export function ItemDisplayBox({
  item,
  size = 'md',
  isOwned = false,
  onPurchase,
  onViewDetails,
  showQuickBuy = true,
  className,
}: ItemDisplayBoxProps) {
  const config = sizeConfig[size]
  const isLimited = item.is_limited && item.available_until
  const skinId: SkinId | null = item.type === 'skin' && item.skin_id ? (item.skin_id as SkinId) : null
  const hasDynamicSprite = item.type === 'skin' && item.sprite_sheet_url

  // Determine CTA variant
  const ctaVariant = isOwned 
    ? 'owned' 
    : isLimited 
      ? 'limited' 
      : 'default'

  return (
    <div
      className={cn(
        'group relative bg-[var(--color-bg-card)] rounded-xl border-2 overflow-hidden',
        'transition-all duration-300 ease-out cursor-pointer',
        'hover:scale-[1.02]',
        rarityBorders[item.rarity],
        rarityGlows[item.rarity],
        config.container,
        config.minHeight,
        isOwned && 'opacity-85',
        className
      )}
      onClick={onViewDetails}
    >
      {/* Rarity Background Gradient */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br pointer-events-none',
        rarityBgGradients[item.rarity]
      )} />

      <div className={cn('relative h-full flex flex-col', config.padding)}>
        {/* Top Badges Row - uniform spacing per size */}
        <div className={cn('flex items-start justify-between', config.badgeGap)}>
          {/* Limited Badge */}
          {isLimited && (
            <div className={cn(
              'flex items-center bg-[#f43f5e]/90 rounded-full',
              size === 'sm' ? 'gap-1 px-1.5 py-0.5' : 'gap-1.5 px-2 py-1'
            )}>
              <span className={cn(
                'bg-white rounded-full animate-pulse',
                size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'
              )} />
              <span className={cn(
                'font-bold text-white uppercase tracking-wide',
                size === 'sm' ? 'text-[9px]' : 'text-[10px]'
              )}>Limited</span>
            </div>
          )}
          {!isLimited && <div />}
          
          {/* Rarity Badge - size from config */}
          <Badge 
            variant={item.rarity} 
            size={config.badgeSize}
            shimmer={item.rarity === 'legendary'}
          >
            {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
          </Badge>
        </div>

        {/* Image/Preview Area - centered with uniform wrapper */}
        <div className={cn('flex-1 flex items-center justify-center', config.imageWrapper)}>
          <div className="relative">
            {item.shop_preview_url ? (
              <DynamicImage
                src={item.shop_preview_url}
                alt={item.name}
                className="rounded-lg object-cover"
                style={{ width: config.imageSize, height: config.imageSize }}
                removeBackgroundMode="auto"
              />
            ) : hasDynamicSprite ? (
              <SkinPreview
                spriteSheetUrl={item.sprite_sheet_url}
                metadataUrl={item.sprite_meta_url}
                size={config.imageSize}
                animate={true}
              />
            ) : skinId ? (
              <SkinPreview skinId={skinId} size={config.imageSize} animate={true} />
            ) : (
              <DynamicImage
                src={item.image_url}
                alt={item.name}
                className="rounded-lg object-cover"
                style={{ width: config.imageSize, height: config.imageSize }}
                removeBackgroundMode="auto"
              />
            )}

            {/* Owned Overlay - scales with size */}
            {isOwned && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <div className={cn(
                  'flex items-center bg-[#10b981] rounded-full',
                  size === 'sm' ? 'gap-1 px-2 py-1' : 'gap-1.5 px-3 py-1.5'
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
                    'font-bold text-white',
                    size === 'sm' ? 'text-[10px]' : 'text-xs'
                  )}>Owned</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Item Info - uniform typography hierarchy */}
        <div className={cn('flex flex-col', config.gap)}>
          <div>
            {/* Item Name - H3 level with size-specific styling */}
            <h3 className={cn(
              'text-white truncate leading-tight',
              config.titleSize,
              config.titleWeight,
              config.titleTracking
            )}>
              {item.name}
            </h3>
            {/* Item Type - tertiary label */}
            {config.showType && config.typeSize && (
              <p className={cn(
                'text-[var(--color-text-muted)] font-semibold uppercase tracking-wider mt-0.5',
                config.typeSize
              )}>
                {getCosmeticTypeName(item.type)}
              </p>
            )}
          </div>

          {/* Description - secondary text */}
          {config.showDescription && item.description && (
            <p className={cn(
              'text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed',
              config.descSize
            )}>
              {item.description}
            </p>
          )}

          {/* Price & CTA - action row with uniform sizing */}
          <div className="flex items-center justify-between pt-1">
            <PriceTag 
              price={item.price_coins} 
              size={config.priceSize}
            />
            
            {showQuickBuy && (
              <UrgencyCTA
                variant={ctaVariant}
                size={config.ctaSize}
                onClick={() => onPurchase()}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
