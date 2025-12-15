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
 * 
 * Skin Preview on Hover:
 * - 3D Preview: For skins with model_url - interactive 360° rotation and zoom
 * - 2D Sprite Preview: For skins with sprite sheets - direction controls and animation speed
 * 
 * Enterprise Polish (2025):
 * - 3D perspective tilt on hover
 * - Staggered element reveals
 * - Rarity ambient particles for legendary/epic
 * - Spring physics animations
 */

import { useRef, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/helpers'
import type { Cosmetic } from '@/types/cosmetic'
import { getCosmeticTypeName } from '@/types/cosmetic'
import { SkinPreview, type SkinId } from '../SkinPreview'
import { DynamicImage } from '../DynamicImage'
import { SkinPreview3DPopup, useSkinPreview3D } from '../SkinPreview3DPopup'
import { SpritePreviewPopup, useSpritePreview } from '../SpritePreviewPopup'
import { PriceTag } from './PriceTag'
import { UrgencyCTA } from './UrgencyCTA'
import { Badge } from '@/components/ui/Badge'
import { RarityGlow, useTiltEffect } from '@/components/ui/animations'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { rarityBorders, rarityGlows, rarityBgGradients } from '@/styles/rarity'

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



export const ItemDisplayBox = memo(function ItemDisplayBox({
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
  
  // 3D model URL for hover preview (model_url takes priority, fallback to .glb shop_preview_url)
  const modelUrl = item.model_url || (item.shop_preview_url?.endsWith('.glb') ? item.shop_preview_url : null)
  const has3DModel = (item.type === 'skin' || item.type === 'runner') && modelUrl
  
  // Static thumbnail for card display (PNG/WebP shop_preview_url, NOT .glb)
  const hasStaticThumbnail = item.shop_preview_url && !item.shop_preview_url.endsWith('.glb')
  
  // Show 3D placeholder only if we have a 3D model but NO static thumbnail
  const show3DPlaceholder = has3DModel && !hasStaticThumbnail
  const { prefersReducedMotion } = useReducedMotion()

  // 3D Preview popup state (for skins with model_url)
  const preview3D = useSkinPreview3D()
  // 2D Sprite preview popup state (for skins without model_url)
  const spritePreview = useSpritePreview()
  const cardRef = useRef<HTMLDivElement>(null)
  
  // Determine if this skin has a 2D sprite preview (no 3D model but has sprite)
  const has2DSprite = item.type === 'skin' && !has3DModel && (hasDynamicSprite || skinId)

  // 3D tilt effect for premium feel
  const { tiltStyle, glareStyle } = useTiltEffect(cardRef as React.RefObject<HTMLElement>, {
    maxTilt: size === 'xl' ? 6 : size === 'lg' ? 7 : 8,
    scale: 1.02,
    glare: item.rarity === 'legendary' || item.rarity === 'epic',
    glareOpacity: item.rarity === 'legendary' ? 0.2 : 0.12,
  })

  // Handle hover for preview popups
  const handleMouseEnter = useCallback(() => {
    if (has3DModel && modelUrl && cardRef.current) {
      // Show 3D preview for skins with model_url or .glb shop_preview_url
      preview3D.showPreview(modelUrl, item.name, cardRef.current)
    } else if (has2DSprite && cardRef.current) {
      // Show 2D sprite preview for skins without 3D model
      spritePreview.showPreview(item.name, cardRef.current, {
        skinId: skinId || undefined,
        spriteSheetUrl: item.sprite_sheet_url,
        metadataUrl: item.sprite_meta_url,
      })
    }
  }, [has3DModel, has2DSprite, modelUrl, item.name, item.sprite_sheet_url, item.sprite_meta_url, skinId, preview3D, spritePreview])

  const handleMouseLeave = useCallback(() => {
    if (has3DModel) {
      preview3D.hidePreview()
    } else if (has2DSprite) {
      spritePreview.hidePreview()
    }
  }, [has3DModel, has2DSprite, preview3D, spritePreview])

  // Determine CTA variant
  const ctaVariant = isOwned 
    ? 'owned' 
    : isLimited 
      ? 'limited' 
      : 'default'

  // Show ambient effects for high-rarity items
  const showRarityEffects = (item.rarity === 'legendary' || item.rarity === 'epic') && !isOwned

  // Stagger animation variants for child elements
  const containerVariants = {
    initial: {},
    hover: {
      transition: { staggerChildren: 0.04, delayChildren: 0.02 }
    }
  }

  const childVariants = {
    initial: { opacity: 0.9, y: 2 },
    hover: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } }
  }

  const CardWrapper = showRarityEffects ? RarityGlow : 'div'
  const cardWrapperProps = showRarityEffects 
    ? { rarity: item.rarity, particles: true, glowRing: true, shimmer: item.rarity === 'legendary' }
    : { rarity: 'common' as const, particles: false, glowRing: false, shimmer: false }

  return (
    <>
    <CardWrapper {...cardWrapperProps} className={config.container}>
    <motion.div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={onViewDetails ? 'button' : undefined}
      tabIndex={onViewDetails ? 0 : undefined}
      aria-label={`${item.name}, ${item.rarity} ${getCosmeticTypeName(item.type)}${isOwned ? ', owned' : ''}`}
      onKeyDown={(e) => {
        if (onViewDetails && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onViewDetails()
        }
      }}
      className={cn(
        'group relative bg-[var(--color-bg-card)] rounded-xl border-2 overflow-hidden',
        'cursor-pointer',
        // Accessibility utilities
        'focus-ring press-feedback touch-target',
        rarityBorders[item.rarity],
        // Only use CSS glow if not using RarityGlow component
        !showRarityEffects && rarityGlows[item.rarity],
        config.minHeight,
        isOwned && 'opacity-85',
        className
      )}
      style={!prefersReducedMotion ? tiltStyle : undefined}
      variants={!prefersReducedMotion ? containerVariants : undefined}
      initial="initial"
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      onClick={onViewDetails}
    >
      {/* Rarity Background Gradient */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br pointer-events-none',
        rarityBgGradients[item.rarity]
      )} />

      {/* Glare overlay for 3D effect */}
      {!prefersReducedMotion && (item.rarity === 'legendary' || item.rarity === 'epic') && (
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit] transition-opacity duration-300 z-20"
          style={glareStyle}
        />
      )}

      <div className={cn('relative h-full flex flex-col', config.padding)}>
        {/* Top Badges Row - uniform spacing per size */}
        <motion.div 
          className={cn('flex items-start justify-between', config.badgeGap)}
          variants={!prefersReducedMotion ? childVariants : undefined}
        >
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
        </motion.div>

        {/* Image/Preview Area - centered with uniform wrapper */}
        <motion.div 
          className={cn('flex-1 flex items-center justify-center', config.imageWrapper)}
          variants={!prefersReducedMotion ? childVariants : undefined}
        >
          <div className="relative">
            {/* 3D Model Placeholder - only show if no static thumbnail available */}
            {show3DPlaceholder ? (
              <div 
                className="flex flex-col items-center justify-center bg-gradient-to-br from-[#6366f1]/20 to-[#8b5cf6]/20 rounded-lg border border-[#6366f1]/30"
                style={{ width: config.imageSize, height: config.imageSize }}
              >
                <svg 
                  className="w-12 h-12 text-[#6366f1] mb-2"
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
                <span className="text-xs text-[#6366f1] font-medium">Hover for 3D</span>
              </div>
            ) : hasStaticThumbnail ? (
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

            {/* 3D Preview indicator badge */}
            {has3DModel && !isOwned && (
              <div className={cn(
                'absolute bottom-1 right-1 flex items-center gap-1 bg-[#6366f1]/90 rounded-full',
                'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1'
              )}>
                <svg 
                  className={size === 'sm' ? 'w-3 h-3 text-white' : 'w-3.5 h-3.5 text-white'}
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
                <span className={cn(
                  'font-semibold text-white',
                  size === 'sm' ? 'text-[8px]' : 'text-[10px]'
                )}>3D</span>
              </div>
            )}

            {/* 2D Sprite Preview indicator badge */}
            {has2DSprite && !isOwned && (
              <div className={cn(
                'absolute bottom-1 right-1 flex items-center gap-1 bg-[#10b981]/90 rounded-full',
                'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1'
              )}>
                <svg 
                  className={size === 'sm' ? 'w-3 h-3 text-white' : 'w-3.5 h-3.5 text-white'}
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className={cn(
                  'font-semibold text-white',
                  size === 'sm' ? 'text-[8px]' : 'text-[10px]'
                )}>Preview</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Item Info - uniform typography hierarchy */}
        <div className={cn('flex flex-col', config.gap)}>
          <motion.div variants={!prefersReducedMotion ? childVariants : undefined}>
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
          </motion.div>

          {/* Description - secondary text */}
          {config.showDescription && item.description && (
            <motion.p 
              className={cn(
                'text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed',
                config.descSize
              )}
              variants={!prefersReducedMotion ? childVariants : undefined}
            >
              {item.description}
            </motion.p>
          )}

          {/* Price & CTA - action row with uniform sizing */}
          <motion.div 
            className="flex items-center justify-between pt-1"
            variants={!prefersReducedMotion ? childVariants : undefined}
          >
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
          </motion.div>
        </div>
      </div>
    </motion.div>
    </CardWrapper>

    {/* 3D Preview Popup - shows on hover for skins with 3D model */}
    {has3DModel && modelUrl && (
      <SkinPreview3DPopup
        modelUrl={modelUrl}
        skinName={item.name}
        isVisible={preview3D.isVisible}
        anchorRef={preview3D.anchorRef}
        onMouseEnter={preview3D.handlePopupMouseEnter}
        onMouseLeave={preview3D.handlePopupMouseLeave}
      />
    )}

    {/* 2D Sprite Preview Popup - shows on hover for skins without model_url */}
    {has2DSprite && (
      <SpritePreviewPopup
        skinId={spritePreview.skinId}
        spriteSheetUrl={spritePreview.spriteSheetUrl}
        metadataUrl={spritePreview.metadataUrl}
        skinName={spritePreview.skinName}
        isVisible={spritePreview.isVisible}
        anchorRef={spritePreview.anchorRef}
        onMouseEnter={spritePreview.handlePopupMouseEnter}
        onMouseLeave={spritePreview.handlePopupMouseLeave}
      />
    )}
    </>
  )
})
