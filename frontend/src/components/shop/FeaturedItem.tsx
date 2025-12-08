/**
 * FeaturedItem Component - 2025 Design System
 * Requirements: 3.4, 4.1
 *
 * Hero featured item section with:
 * - Full-width hero card
 * - Large preview image (400px+) - dynamically loaded
 * - Animated glow effect
 * - "Featured" badge
 * - Countdown timer for limited items
 */

import { cn } from '@/utils/helpers'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Cosmetic, Rarity } from '@/types/cosmetic'
import { getCosmeticTypeName } from '@/types/cosmetic'
import { useCountdown } from '@/hooks/useCountdown'
import { DynamicImage } from './DynamicImage'

interface FeaturedItemProps {
  item: Cosmetic
  isOwned: boolean
  onPurchase: () => void
  onViewDetails: () => void
}

const rarityGlowStyles: Record<Rarity, string> = {
  common: 'shadow-[0_0_60px_rgba(115,115,115,0.3)]',
  uncommon: 'shadow-[0_0_60px_rgba(16,185,129,0.3)]',
  rare: 'shadow-[0_0_60px_rgba(59,130,246,0.3)]',
  epic: 'shadow-[0_0_60px_rgba(168,85,247,0.4)]',
  legendary: 'shadow-[0_0_80px_rgba(245,158,11,0.5)]',
}

const rarityBorderStyles: Record<Rarity, string> = {
  common: 'border-[#737373]/30',
  uncommon: 'border-[#10b981]/30',
  rare: 'border-[#3b82f6]/30',
  epic: 'border-[#a855f7]/30',
  legendary: 'border-[#f59e0b]/40',
}

export function FeaturedItem({ item, isOwned, onPurchase, onViewDetails }: FeaturedItemProps) {
  const countdown = useCountdown(item.available_until ? new Date(item.available_until) : null)
  const isLimited = item.is_limited && item.available_until

  return (
    <div
      className={cn(
        'relative bg-[var(--color-bg-card)] rounded-2xl border-2 overflow-hidden',
        'transition-all duration-300',
        rarityBorderStyles[item.rarity],
        rarityGlowStyles[item.rarity]
      )}
    >
      <div className="flex flex-col lg:flex-row">
        {/* Large Preview Image - uses shop_preview_url if available */}
        <div className="relative lg:w-[400px] xl:w-[480px] aspect-square lg:aspect-auto bg-[var(--color-bg-elevated)]">
          <DynamicImage
            src={item.shop_preview_url || item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />

          {/* Featured Badge */}
          <div className="absolute top-4 left-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#6366f1] rounded-full">
              <StarIcon className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">Featured</span>
            </div>
          </div>

          {/* Limited Badge */}
          {isLimited && (
            <div className="absolute top-4 right-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f43f5e]/90 rounded-full">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-white">Limited Time</span>
              </div>
            </div>
          )}

          {/* Owned Overlay */}
          {isOwned && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#10b981] rounded-full">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-base font-semibold text-white">Owned</span>
              </div>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 p-6 lg:p-8 flex flex-col justify-center">
          {/* Rarity & Type */}
          <div className="flex items-center gap-3 mb-3">
            <Badge variant={item.rarity} shimmer={item.rarity === 'legendary'}>
              {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
            </Badge>
            <span className="text-sm text-[var(--color-text-muted)]">
              {getCosmeticTypeName(item.type)}
            </span>
          </div>

          {/* Name */}
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
            {item.name}
          </h2>

          {/* Description */}
          <p className="text-[var(--color-text-secondary)] mb-6 line-clamp-2">
            {item.description}
          </p>

          {/* Countdown Timer */}
          {isLimited && countdown && (
            <div className="mb-6">
              <p className="text-sm text-[var(--color-text-muted)] mb-2">Ends in:</p>
              <div className="flex items-center gap-3">
                {countdown.days > 0 && (
                  <TimeBlock value={countdown.days} label="Days" />
                )}
                <TimeBlock value={countdown.hours} label="Hours" />
                <TimeBlock value={countdown.minutes} label="Min" />
                {countdown.days === 0 && (
                  <TimeBlock value={countdown.seconds} label="Sec" />
                )}
              </div>
            </div>
          )}

          {/* Price & Actions */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CoinIcon className="w-6 h-6 text-[#f59e0b]" />
              <span className="text-2xl font-bold text-white">
                {item.price_coins.toLocaleString()}
              </span>
            </div>

            {isOwned ? (
              <Button variant="secondary" onClick={onViewDetails}>
                View in Inventory
              </Button>
            ) : (
              <>
                <Button variant="primary" onClick={onPurchase}>
                  Purchase Now
                </Button>
                <Button variant="ghost" onClick={onViewDetails}>
                  Details
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 bg-[var(--color-bg-elevated)] rounded-lg flex items-center justify-center">
        <span className="text-xl font-bold text-white">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-[var(--color-text-muted)] mt-1">{label}</span>
    </div>
  )
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
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
