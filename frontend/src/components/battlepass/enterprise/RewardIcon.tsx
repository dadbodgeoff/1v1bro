/**
 * RewardIcon - Displays reward icons based on type
 * 
 * Handles coins, XP boosts, cosmetics, titles, and generic rewards
 * 
 * @module battlepass/enterprise/RewardIcon
 */

import { SkinPreview } from '@/components/shop/SkinPreview'
import type { Reward } from './types'

// Supabase storage URL for coin reward image
const COINS_IMAGE_URL = '/api/v1/storage/cosmetics/playercard/coins.jpg'

interface RewardIconProps {
  reward: Reward
  size: number
}

/**
 * Check if a cosmetic is a playercard based on name or URL
 */
function isPlayercard(reward: Reward): boolean {
  const name = (reward.cosmetic_name || '').toLowerCase()
  const url = decodeURIComponent(reward.preview_url || reward.sprite_sheet_url || '').toLowerCase()
  return (
    name.includes('card') || 
    url.includes('playercard') || 
    url.includes('player card') ||
    url.includes('player%20card')
  )
}

export function RewardIcon({ reward, size }: RewardIconProps) {
  // For cosmetics, check if it's a playercard (portrait aspect ratio)
  if (reward.type === 'cosmetic') {
    const spriteUrl = reward.sprite_sheet_url || reward.preview_url
    
    // Playercards need portrait aspect ratio display
    if (spriteUrl && isPlayercard(reward)) {
      return (
        <div 
          className="relative rounded-lg overflow-hidden border border-white/10"
          style={{ 
            width: size, 
            height: size * 1.4, // Portrait aspect ratio
          }}
        >
          <img
            src={spriteUrl}
            alt={reward.cosmetic_name || 'Player Card'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Subtle gradient overlay for polish */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
        </div>
      )
    }
    
    // Regular cosmetics use SkinPreview (sprite sheets)
    if (spriteUrl) {
      return (
        <SkinPreview
          spriteSheetUrl={spriteUrl}
          size={size}
          animate={false}
          frameIndex={0}
        />
      )
    }
  }

  // For non-cosmetic rewards with preview images
  if (reward.preview_url) {
    return (
      <SkinPreview
        spriteSheetUrl={reward.preview_url}
        size={size}
        animate={false}
        frameIndex={0}
      />
    )
  }

  const iconSize = Math.min(size * 0.6, 64)

  switch (reward.type) {
    case 'coins':
      return (
        <div 
          className="relative rounded-lg overflow-hidden"
          style={{ width: size, height: size }}
        >
          <img
            src={COINS_IMAGE_URL}
            alt={`${reward.value} Coins`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.parentElement?.classList.add('coins-fallback')
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f59e0b]/20 via-transparent to-transparent pointer-events-none" />
        </div>
      )
    case 'xp_boost':
      return <XPBoostIcon className="text-[#6366f1]" style={{ width: iconSize, height: iconSize }} />
    case 'title':
      return <TitleIcon className="text-white" style={{ width: iconSize, height: iconSize }} />
    default:
      return <GiftIcon className="text-[var(--color-text-muted)]" style={{ width: iconSize, height: iconSize }} />
  }
}

// Icon components
function XPBoostIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function TitleIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function GiftIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  )
}
