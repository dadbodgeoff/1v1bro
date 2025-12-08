/**
 * ShopGrid Component - 2025 Design System
 * Requirements: 3.1, 3.8
 *
 * Updated to use new ShopCard component with:
 * - Responsive grid (2/3/4 columns)
 * - Skeleton loading state
 */

import { ShopCard } from '@/components/shop/ShopCard'
import { ShopCardSkeleton } from '@/components/ui/Skeleton'
import type { Cosmetic } from '@/types/cosmetic'

interface ShopGridProps {
  items: Cosmetic[]
  ownedIds: Set<string>
  onPurchase: (item: Cosmetic) => void
  onViewDetails: (item: Cosmetic) => void
  loading?: boolean
}

export function ShopGrid({
  items,
  ownedIds,
  onPurchase,
  onViewDetails,
  loading = false,
}: ShopGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ShopCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <p className="text-[var(--color-text-muted)]">No items found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <ShopCard
          key={item.id}
          item={item}
          isOwned={ownedIds.has(item.id)}
          onPurchase={() => onPurchase(item)}
          onViewDetails={() => onViewDetails(item)}
        />
      ))}
    </div>
  )
}

export default ShopGrid
