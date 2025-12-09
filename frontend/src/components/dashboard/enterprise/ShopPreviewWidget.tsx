/**
 * ShopPreviewWidget - Enterprise Shop Preview Widget
 * 
 * Featured shop items carousel for the dashboard.
 * 
 * Features:
 * - Widget header with "Featured Items" title and "View Shop" link
 * - 3-4 featured items in horizontal layout
 * - Item preview image (80px), name, rarity indicator, price
 * - Daily rotation countdown timer
 * - Rarity border/glow on hover
 * - Navigate to /shop on item click or "View Shop" click
 * - Loading state with skeleton placeholders
 * 
 * Props:
 * @param maxItems - Maximum items to display (default: 4)
 * @param className - Additional CSS classes
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCosmetics } from '@/hooks/useCosmetics'
import { RARITY_COLORS, type Cosmetic, type Rarity } from '@/types/cosmetic'
import { DashboardSection } from './DashboardSection'

export interface ShopPreviewWidgetProps {
  maxItems?: number
  className?: string
}

/**
 * Validates that a shop item has all required display fields
 * @param item - Shop item to validate
 * @returns true if item has all required fields for display
 */
export function isValidShopItem(item: Partial<Cosmetic>): boolean {
  return !!(
    item.id &&
    item.name &&
    item.rarity &&
    typeof item.price_coins === 'number'
  )
}

/**
 * Gets the rarity color for an item
 * @param rarity - Item rarity
 * @returns Hex color string
 */
export function getRarityColor(rarity: Rarity): string {
  return RARITY_COLORS[rarity] || RARITY_COLORS.common
}

/**
 * Truncates item name if too long
 * @param name - Item name
 * @param maxLength - Maximum length (default: 12)
 * @returns Truncated name with ellipsis if needed
 */
export function truncateItemName(name: string, maxLength: number = 12): string {
  if (name.length <= maxLength) return name
  return name.slice(0, maxLength - 1) + '…'
}

export function ShopPreviewWidget({ maxItems = 4, className }: ShopPreviewWidgetProps) {
  const navigate = useNavigate()
  const { shopItems, shopLoading, fetchShop } = useCosmetics()
  const [timeUntilRefresh, setTimeUntilRefresh] = useState<string>('')

  useEffect(() => {
    fetchShop()
  }, [fetchShop])

  // Calculate time until next daily refresh (midnight UTC)
  // Updates every second for accurate countdown, syncs with server on shop fetch
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setUTCHours(24, 0, 0, 0)
      const diff = tomorrow.getTime() - now.getTime()
      
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      // Show seconds when under 1 hour for precision
      if (hours === 0) {
        setTimeUntilRefresh(`${minutes}m ${seconds}s`)
      } else {
        setTimeUntilRefresh(`${hours}h ${minutes}m`)
      }
      
      // Auto-refresh shop when timer hits zero
      if (diff <= 0) {
        fetchShop()
      }
    }

    updateTimer()
    // Update every second for accurate countdown
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [fetchShop])

  const handleViewShop = () => {
    navigate('/shop')
  }

  const handleItemClick = () => {
    navigate('/shop')
  }

  // Get featured items (prioritize is_featured, then take first N)
  const featuredItems = shopItems
    .filter(item => isValidShopItem(item))
    .sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1
      if (!a.is_featured && b.is_featured) return 1
      return (a.sort_order ?? 0) - (b.sort_order ?? 0)
    })
    .slice(0, maxItems)

  // Loading state - Requirements 4.6
  if (shopLoading && featuredItems.length === 0) {
    return (
      <DashboardSection
        title="Featured Items"
        actionLabel="View Shop"
        onAction={handleViewShop}
        className={className}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(maxItems)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-white/[0.05] rounded-lg mb-2" />
              <div className="h-3 w-16 bg-white/[0.1] rounded mb-1" />
              <div className="h-3 w-12 bg-white/[0.1] rounded" />
            </div>
          ))}
        </div>
      </DashboardSection>
    )
  }

  // Empty state
  if (featuredItems.length === 0) {
    return (
      <DashboardSection
        title="Featured Items"
        actionLabel="View Shop"
        onAction={handleViewShop}
        className={className}
      >
        <div className="text-center py-4">
          <p className="text-sm text-neutral-400">No items available</p>
          <p className="text-xs text-neutral-500">Check back soon</p>
        </div>
      </DashboardSection>
    )
  }

  return (
    <DashboardSection
      title="Featured Items"
      actionLabel="View Shop"
      onAction={handleViewShop}
      className={className}
    >
      {/* Daily rotation timer - Requirements 4.1 */}
      <div className="flex items-center gap-1.5 mb-3 text-xs text-neutral-500">
        <ClockIcon className="w-3.5 h-3.5" />
        <span>Refreshes in {timeUntilRefresh}</span>
      </div>

      {/* Items grid - Requirements 4.2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {featuredItems.map((item) => (
          <ShopItemCard
            key={item.id}
            item={item}
            onClick={handleItemClick}
          />
        ))}
      </div>
    </DashboardSection>
  )
}

// Shop Item Card Component
interface ShopItemCardProps {
  item: Cosmetic
  onClick: () => void
}

function ShopItemCard({ item, onClick }: ShopItemCardProps) {
  const rarityColor = getRarityColor(item.rarity)

  return (
    <button
      onClick={onClick}
      className="group text-left transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* Item preview image - 80px height - Requirements 4.2 */}
      <div 
        className="relative aspect-square rounded-lg overflow-hidden mb-2 border-2 transition-all duration-200"
        style={{ 
          borderColor: `${rarityColor}33`,
          boxShadow: `0 0 0 0 ${rarityColor}00`
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = rarityColor
          e.currentTarget.style.boxShadow = `0 0 12px ${rarityColor}40`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = `${rarityColor}33`
          e.currentTarget.style.boxShadow = `0 0 0 0 ${rarityColor}00`
        }}
      >
        {item.shop_preview_url || item.image_url ? (
          <img
            src={item.shop_preview_url || item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-white/[0.05] flex items-center justify-center">
            <span className="text-2xl">🎨</span>
          </div>
        )}

        {/* Rarity indicator dot */}
        <div 
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
          style={{ backgroundColor: rarityColor }}
        />
      </div>

      {/* Item name - sm font, truncated - Requirements 4.2 */}
      <p className="text-xs font-medium text-neutral-300 truncate mb-0.5">
        {truncateItemName(item.name)}
      </p>

      {/* Price with coin icon - Requirements 4.2 */}
      <div className="flex items-center gap-1">
        <CoinIcon className="w-3 h-3 text-amber-400" />
        <span className="text-xs font-semibold text-amber-400 tabular-nums">
          {item.price_coins.toLocaleString()}
        </span>
      </div>
    </button>
  )
}

// Icon Components
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CoinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" />
    </svg>
  )
}
