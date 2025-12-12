/**
 * ShopCard Component - 2025 Design System
 * Requirements: 3.1, 3.2, 3.7, 4.2, 4.3
 *
 * Individual shop item card with:
 * - Rarity gradient border based on item rarity
 * - Aspect-square preview image (dynamic loading)
 * - Name, type badge, price with coin icon
 * - Hover: scale(1.02), shadow enhancement
 * - Owned state: green badge, disabled purchase, opacity 0.8
 * - Limited: pulsing badge indicator
 */

import { cn } from '@/utils/helpers'
import { Badge } from '@/components/ui/Badge'
import type { Cosmetic } from '@/types/cosmetic'
import { getCosmeticTypeName } from '@/types/cosmetic'
import { SkinPreview, type SkinId } from './SkinPreview'
import { DynamicImage } from './DynamicImage'
import { rarityBorders, rarityGlowsSubtle } from '@/styles/rarity'

interface ShopCardProps {
  item: Cosmetic
  isOwned: boolean
  onPurchase: () => void
  onViewDetails: () => void
}

export function ShopCard({ item, isOwned, onPurchase, onViewDetails }: ShopCardProps) {
  const isLimited = item.is_limited && item.available_until
  
  // Check if this is a sprite-based skin (static bundled)
  const skinId: SkinId | null = item.type === 'skin' && item.skin_id 
    ? (item.skin_id as SkinId) 
    : null
  
  // Check for dynamic sprite sheet (from CMS)
  const hasDynamicSprite = item.type === 'skin' && item.sprite_sheet_url

  return (
    <div
      className={cn(
        'group relative bg-[var(--color-bg-card)] rounded-xl border-2 overflow-hidden',
        'transition-all duration-200 ease-out cursor-pointer',
        'hover:scale-[1.02] hover:shadow-xl',
        rarityBorders[item.rarity],
        rarityGlowsSubtle[item.rarity],
        isOwned && 'opacity-80'
      )}
      onClick={onViewDetails}
    >
      {/* Preview Image or Skin Preview */}
      {/* Priority: shop_preview_url > sprite (for skins) > image_url (for banners/other) */}
      <div className="relative aspect-square bg-[var(--color-bg-elevated)] overflow-hidden flex items-center justify-center">
        {item.shop_preview_url ? (
          // Custom shop preview image (highest priority)
          <DynamicImage
            src={item.shop_preview_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : hasDynamicSprite ? (
          // Dynamic sprite animation for skins
          <SkinPreview 
            spriteSheetUrl={item.sprite_sheet_url}
            metadataUrl={item.sprite_meta_url}
            size={160} 
            animate={true}
            className="scale-110"
          />
        ) : skinId ? (
          // Static bundled sprite
          <SkinPreview 
            skinId={skinId} 
            size={160} 
            animate={true}
            className="scale-110"
          />
        ) : (
          // Banner/other items use image_url
          <DynamicImage
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        )}

        {/* Owned Overlay */}
        {isOwned && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10b981] rounded-full">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-semibold text-white">Owned</span>
            </div>
          </div>
        )}

        {/* Hover Overlay (non-owned) */}
        {!isOwned && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onViewDetails()
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg backdrop-blur-sm transition-colors"
            >
              View Details
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPurchase()
              }}
              className="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-medium rounded-lg transition-colors"
            >
              Quick Buy
            </button>
          </div>
        )}

        {/* Limited Badge */}
        {isLimited && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-[#f43f5e]/90 rounded-full">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-white">Limited</span>
          </div>
        )}

        {/* Rarity Badge */}
        <div className="absolute top-2 right-2">
          <Badge variant={item.rarity} size="sm" shimmer={item.rarity === 'legendary'}>
            {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Name & Type */}
        <div>
          <h3 className="text-sm font-semibold text-white truncate">{item.name}</h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            {getCosmeticTypeName(item.type)}
          </p>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CoinIcon className="w-4 h-4 text-[#f59e0b]" />
            <span className="text-sm font-bold text-white">
              {item.price_coins.toLocaleString()}
            </span>
          </div>

          {isOwned ? (
            <span className="text-xs text-[#10b981] font-medium">In Inventory</span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPurchase()
              }}
              className="px-3 py-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-medium rounded-lg transition-colors"
            >
              Buy
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function CoinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill="#000" fontWeight="bold">
        $
      </text>
    </svg>
  )
}
