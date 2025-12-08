/**
 * PlayerCardBanner - Displays a player's equipped playercard with their name
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.3, 4.4
 * 
 * Enterprise features:
 * - Optimized image loading with skeleton states
 * - Error handling with retry capability
 * - Lazy loading for off-screen cards
 * - In-memory caching to prevent re-fetches
 */

import type { Cosmetic } from '@/types/cosmetic'
import { RARITY_COLORS } from '@/types/cosmetic'
import { OptimizedImage } from '@/components/ui/OptimizedImage'

export type PlayerCardSize = 'small' | 'medium' | 'large'

interface PlayerCardBannerProps {
  /** The equipped playercard cosmetic, or null for default placeholder */
  playercard: Cosmetic | null
  /** Player's display name */
  playerName: string
  /** Whether this is the current user */
  isCurrentUser?: boolean
  /** Size variant */
  size?: PlayerCardSize
  /** Status indicators */
  showStatus?: {
    isHost?: boolean
    isReady?: boolean
  }
}

/** Size dimensions for each variant */
const SIZE_CONFIG: Record<PlayerCardSize, { width: number; height: number; nameSize: string }> = {
  small: { width: 120, height: 180, nameSize: 'text-xs' },
  medium: { width: 180, height: 270, nameSize: 'text-sm' },
  large: { width: 240, height: 360, nameSize: 'text-base' },
}

/**
 * Default placeholder when no playercard is equipped
 */
function DefaultPlaceholder({ playerName }: { playerName: string }) {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-neutral-800 to-neutral-900"
      data-testid="playercard-placeholder"
    >
      <div className="w-16 h-16 rounded-full bg-neutral-700 flex items-center justify-center mb-3">
        <span className="text-2xl text-neutral-400">
          {playerName[0]?.toUpperCase() || '?'}
        </span>
      </div>
      <span className="text-xs text-neutral-500">No Card Equipped</span>
    </div>
  )
}

export function PlayerCardBanner({
  playercard,
  playerName,
  isCurrentUser = false,
  size = 'medium',
  showStatus,
}: PlayerCardBannerProps) {
  const { width, height, nameSize } = SIZE_CONFIG[size]
  const rarityColor = playercard ? RARITY_COLORS[playercard.rarity] : '#4b5563'

  return (
    <div
      className="flex flex-col items-center"
      style={{ width }}
      data-testid="playercard-banner"
      data-size={size}
    >
      {/* Card Container */}
      <div
        className={`relative rounded-xl overflow-hidden transition-all ${
          isCurrentUser ? 'ring-2 ring-white/30' : ''
        }`}
        style={{
          width,
          height,
          background: `linear-gradient(135deg, ${rarityColor}20, ${rarityColor}40)`,
          border: `2px solid ${rarityColor}60`,
        }}
      >
        {playercard ? (
          /* Playercard Image with optimized loading */
          <OptimizedImage
            src={playercard.image_url}
            alt={playercard.name}
            width={width}
            height={height}
            priority={size === 'large'} // Priority load for large (lobby) cards
            lazy={size !== 'large'}
            timeout={20000} // 20s timeout for slow connections
            objectFit="cover"
            showSkeleton={true}
            skeletonColor={`${rarityColor}30`}
            fallback={<DefaultPlaceholder playerName={playerName} />}
          />
        ) : (
          /* Default Placeholder */
          <DefaultPlaceholder playerName={playerName} />
        )}

        {/* Rarity Glow Effect */}
        {playercard && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: `inset 0 0 30px ${rarityColor}30`,
            }}
          />
        )}

        {/* Status Badge */}
        {showStatus && (
          <div className="absolute top-2 right-2 z-10">
            {showStatus.isHost && (
              <span className="px-2 py-0.5 bg-amber-500/90 text-white text-xs font-bold rounded">
                HOST
              </span>
            )}
            {!showStatus.isHost && showStatus.isReady && (
              <span className="px-2 py-0.5 bg-emerald-500/90 text-white text-xs font-bold rounded">
                READY
              </span>
            )}
          </div>
        )}
      </div>

      {/* Player Name */}
      <div className="mt-3 text-center" data-testid="playercard-name">
        <span className={`font-semibold text-white ${nameSize}`}>
          {playerName || 'Unknown'}
        </span>
        {isCurrentUser && (
          <span className="ml-1 text-neutral-500 text-xs">(you)</span>
        )}
      </div>
    </div>
  )
}
