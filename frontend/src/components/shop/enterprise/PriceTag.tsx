/**
 * PriceTag - Enterprise Price Display Component
 * 
 * Features:
 * - Original price with strikethrough for sales
 * - Discount percentage badge
 * - Bundle pricing support
 * - Animated coin icon
 * - Animated number counting (Enterprise Polish 2025)
 */

import { cn } from '@/utils/helpers'
import { AnimatedNumber } from '@/components/ui/animations'

interface PriceTagProps {
  price: number
  originalPrice?: number
  isFree?: boolean
  size?: 'sm' | 'md' | 'lg'
  showCoin?: boolean
  className?: string
}

const sizeStyles = {
  sm: {
    price: 'text-sm font-bold',
    original: 'text-xs',
    coin: 'w-4 h-4',
    badge: 'text-[10px] px-1.5 py-0.5 font-bold',
  },
  md: {
    price: 'text-lg font-bold tabular-nums',
    original: 'text-sm',
    coin: 'w-5 h-5',
    badge: 'text-xs px-2 py-0.5 font-bold',
  },
  lg: {
    price: 'text-2xl font-extrabold tabular-nums tracking-tight',
    original: 'text-base',
    coin: 'w-7 h-7',
    badge: 'text-sm px-2.5 py-1 font-bold',
  },
}

export function PriceTag({
  price,
  originalPrice,
  isFree = false,
  size = 'md',
  showCoin = true,
  className,
}: PriceTagProps) {
  const styles = sizeStyles[size]
  const hasDiscount = originalPrice && originalPrice > price
  const discountPercent = hasDiscount 
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0

  if (isFree) {
    return (
      <span className={cn(
        'font-bold text-[#10b981]',
        styles.price,
        className
      )}>
        FREE
      </span>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Discount Badge */}
      {hasDiscount && (
        <span className={cn(
          'font-semibold bg-[#10b981] text-white rounded-full',
          styles.badge
        )}>
          -{discountPercent}%
        </span>
      )}

      {/* Original Price (strikethrough) */}
      {hasDiscount && (
        <span className={cn(
          'text-[var(--color-text-muted)] line-through',
          styles.original
        )}>
          {originalPrice.toLocaleString()}
        </span>
      )}

      {/* Current Price */}
      <div className="flex items-center gap-1.5">
        {showCoin && <CoinIcon className={cn('text-[#f59e0b]', styles.coin)} />}
        <AnimatedNumber
          value={price}
          duration={600}
          className={cn(
            'font-bold text-white',
            styles.price,
            hasDiscount && 'text-[#10b981]'
          )}
        />
      </div>
    </div>
  )
}

function CoinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill="#000" fontWeight="bold">$</text>
    </svg>
  )
}
