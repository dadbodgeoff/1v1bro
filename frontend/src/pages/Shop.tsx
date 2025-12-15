/**
 * Shop Page - Enterprise 2025 Redesign
 * 
 * Professional item shop with:
 * - ShopHeader with balance and seasonal branding
 * - Featured Section (XL items) with countdown
 * - Daily Rotation Section
 * - Category-based browsing
 * - Conversion-optimized CTAs
 * - All core logic preserved from original
 */

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShopAnalytics } from '@/hooks/useShopAnalytics'
import { useCosmetics } from '@/hooks/useCosmetics'
import { useConfetti } from '@/hooks/useConfetti'
import { useToast } from '@/hooks/useToast'
import { useBalance } from '@/hooks/useBalance'
import { ShopFilters, filterAndSortItems, type SortOption } from '@/components/shop/ShopFilters'
import { PurchaseModal } from '@/components/shop/PurchaseModal'
import { Confetti } from '@/components/ui/Confetti'
import { ShopCardSkeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import type { Cosmetic, CosmeticType, Rarity } from '@/types/cosmetic'
import { mapRarity } from '@/hooks/useConfetti'

// Enterprise Components
import {
  ShopHeader,
  ShopSection,
  ItemDisplayBox,
} from '@/components/shop/enterprise'

export function Shop() {
  const navigate = useNavigate()
  const {
    shopItems,
    shopLoading,
    fetchShop,
    inventory,
    fetchInventory,
    purchaseCosmetic,
    error,
    clearError,
  } = useCosmetics()

  // Filter state
  const [selectedType, setSelectedType] = useState<CosmeticType | null>(null)
  const [selectedRarity, setSelectedRarity] = useState<Rarity | null>(null)
  const [selectedSort, setSelectedSort] = useState<SortOption>('featured')
  const [activeSection, setActiveSection] = useState<'all' | 'skins' | 'banners' | 'runners'>('all')

  // Purchase modal state
  const [purchaseItem, setPurchaseItem] = useState<Cosmetic | null>(null)
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)

  // Confetti and toast
  const confetti = useConfetti()
  const toast = useToast()
  
  // Analytics
  const shopAnalytics = useShopAnalytics()

  // Real user balance from balance hook (Requirements: 5.5)
  const { coins: userBalance, refreshBalance } = useBalance()

  // Daily refresh time (next midnight UTC)
  const dailyRefreshTime = useMemo(() => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    tomorrow.setUTCHours(0, 0, 0, 0)
    return tomorrow
  }, [])

  // Fetch data on mount - single effect, parallel fetches
  useEffect(() => {
    Promise.all([fetchShop(), fetchInventory()])
    shopAnalytics.trackShopView()
  }, []) // Empty deps - only fetch on mount

  // Create set of owned cosmetic IDs
  const ownedIds = useMemo(() => {
    return new Set(inventory.map((item) => item.cosmetic_id))
  }, [inventory])

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return filterAndSortItems(shopItems, {
      type: selectedType,
      rarity: selectedRarity,
      sort: selectedSort,
    })
  }, [shopItems, selectedType, selectedRarity, selectedSort])

  // Categorize items for sections
  const { featuredItems, dailyItems, skinItems, bannerItems, runnerItems } = useMemo(() => {
    const skins = shopItems.filter(item => item.type === 'skin')
    const banners = shopItems.filter(item => item.type === 'banner')
    const runners = shopItems.filter(item => item.type === 'runner')
    
    // Build featured items list: prioritize is_featured, then legendary, then epic, then by sort_order
    // Always try to fill 5 slots for the 1 XL + 4 SM grid layout
    const featuredSet = new Set<string>()
    const featuredList: typeof shopItems = []
    
    // 1. Items explicitly marked as featured
    shopItems.filter(item => item.is_featured).forEach(item => {
      if (featuredList.length < 5 && !featuredSet.has(item.id)) {
        featuredList.push(item)
        featuredSet.add(item.id)
      }
    })
    
    // 2. Legendary items
    shopItems.filter(item => item.rarity === 'legendary').forEach(item => {
      if (featuredList.length < 5 && !featuredSet.has(item.id)) {
        featuredList.push(item)
        featuredSet.add(item.id)
      }
    })
    
    // 3. Epic items
    shopItems.filter(item => item.rarity === 'epic').forEach(item => {
      if (featuredList.length < 5 && !featuredSet.has(item.id)) {
        featuredList.push(item)
        featuredSet.add(item.id)
      }
    })
    
    // 4. Fill remaining slots with any other items by sort_order
    shopItems
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .forEach(item => {
        if (featuredList.length < 5 && !featuredSet.has(item.id)) {
          featuredList.push(item)
          featuredSet.add(item.id)
        }
      })
    
    // Daily rotation: items not in featured section
    const daily = shopItems
      .filter(item => !featuredSet.has(item.id))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .slice(0, 6)

    return {
      featuredItems: featuredList,
      dailyItems: daily,
      skinItems: skins,
      bannerItems: banners,
      runnerItems: runners,
    }
  }, [shopItems])

  // Items to display based on active section
  const displayItems = useMemo(() => {
    switch (activeSection) {
      case 'skins':
        return filterAndSortItems(skinItems, { type: selectedType, rarity: selectedRarity, sort: selectedSort })
      case 'banners':
        return filterAndSortItems(bannerItems, { type: selectedType, rarity: selectedRarity, sort: selectedSort })
      case 'runners':
        return filterAndSortItems(runnerItems, { type: selectedType, rarity: selectedRarity, sort: selectedSort })
      default:
        return filteredItems
    }
  }, [activeSection, skinItems, bannerItems, runnerItems, filteredItems, selectedType, selectedRarity, selectedSort])

  const handlePurchase = async () => {
    if (!purchaseItem) return
    clearError()
    
    // Track purchase start
    shopAnalytics.trackPurchaseStart(purchaseItem.id, purchaseItem.price_coins, 'coins')
    
    const success = await purchaseCosmetic(purchaseItem.id)
    if (success) {
      // Track purchase complete
      shopAnalytics.trackPurchaseComplete(purchaseItem.id, purchaseItem.price_coins, 'coins')
      
      // Refresh balance after successful purchase
      refreshBalance()
      confetti.fire({
        rarity: mapRarity(purchaseItem.rarity),
        originX: 0.5,
        originY: 0.4,
      })
      toast.success('Purchase Complete!', `You now own ${purchaseItem.name}`)
      setIsPurchaseModalOpen(false)
      setPurchaseItem(null)
    } else if (error?.includes('Insufficient')) {
      // Track purchase failed
      shopAnalytics.trackPurchaseFailed(purchaseItem.id, 'insufficient_funds')
      toast.error('Insufficient Coins', 'Get more coins to purchase this item')
    } else {
      // Track other failures
      shopAnalytics.trackPurchaseFailed(purchaseItem.id, error || 'unknown_error')
    }
  }

  const openPurchaseModal = useCallback((item: Cosmetic) => {
    // Track item view when opening purchase modal
    shopAnalytics.trackItemView(item.id, item.type, item.price_coins, item.rarity)
    setPurchaseItem(item)
    setIsPurchaseModalOpen(true)
  }, [shopAnalytics])

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-[var(--color-text-secondary)] hover:text-white mb-6 flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Enterprise Shop Header */}
        <ShopHeader
          balance={userBalance}
          seasonName="Item Shop"
          seasonTheme="neon"
          dailyRefreshTime={dailyRefreshTime}
          onBalanceClick={() => navigate('/coins')}
        />

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-[#f43f5e]/10 border border-[#f43f5e]/30 text-[#f43f5e] px-4 py-3 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="text-[#f43f5e] hover:text-[#fb7185]">✕</button>
          </div>
        )}

        {/* Loading State */}
        {shopLoading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ShopCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Featured Section - 1 XL hero + 4 SM in 2x2 grid */}
            {featuredItems.length > 0 && (
              <ShopSection
                title="Featured"
                subtitle="Limited time offers"
                badge="HOT"
                badgeVariant="hot"
                icon={<StarIcon className="w-5 h-5" />}
              >
                {/* Mobile: Stack hero + 2x2 grid. Desktop: 4-col with hero spanning 2x2 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Hero Item - full width on mobile, 2x2 on desktop */}
                  {featuredItems[0] && (
                    <ItemDisplayBox
                      key={featuredItems[0].id}
                      item={featuredItems[0]}
                      size="xl"
                      isOwned={ownedIds.has(featuredItems[0].id)}
                      onPurchase={() => openPurchaseModal(featuredItems[0])}
                      onViewDetails={() => {/* TODO: Item detail modal */}}
                      className="col-span-2 md:row-span-2"
                    />
                  )}
                  {/* Supporting Items - 2x2 grid */}
                  {featuredItems.slice(1, 5).map((item) => (
                    <ItemDisplayBox
                      key={item.id}
                      item={item}
                      size="sm"
                      isOwned={ownedIds.has(item.id)}
                      onPurchase={() => openPurchaseModal(item)}
                      onViewDetails={() => {/* TODO: Item detail modal */}}
                    />
                  ))}
                </div>
              </ShopSection>
            )}

            {/* Daily Rotation Section */}
            {dailyItems.length > 0 && (
              <ShopSection
                title="Daily Rotation"
                subtitle="Refreshes every 24 hours"
                endTime={dailyRefreshTime}
                icon={<ClockIcon className="w-5 h-5" />}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {dailyItems.map((item) => (
                    <ItemDisplayBox
                      key={item.id}
                      item={item}
                      size="sm"
                      isOwned={ownedIds.has(item.id)}
                      onPurchase={() => openPurchaseModal(item)}
                      onViewDetails={() => {/* TODO: Item detail modal */}}
                    />
                  ))}
                </div>
              </ShopSection>
            )}

            {/* Browse Section Header */}
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">Browse Items</h2>
              <p className="text-sm text-[var(--color-text-muted)] font-medium">Explore our full collection</p>
            </div>

            {/* Category Tabs - pill style navigation */}
            <div className="flex items-center gap-1 mb-6 p-1 bg-[var(--color-bg-elevated)] rounded-xl w-fit border border-white/5">
              {(['all', 'skins', 'banners', 'runners'] as const).map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    activeSection === section
                      ? 'bg-[#6366f1] text-white shadow-lg shadow-indigo-500/25'
                      : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {section === 'all' ? 'All Items' : section.charAt(0).toUpperCase() + section.slice(1)}
                </button>
              ))}
            </div>

            {/* Filters & Count Row */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <ShopFilters
                selectedType={selectedType}
                selectedRarity={selectedRarity}
                selectedSort={selectedSort}
                onTypeChange={setSelectedType}
                onRarityChange={setSelectedRarity}
                onSortChange={setSelectedSort}
              />
              
              {/* Items Count - right aligned */}
              <span className="text-sm text-[var(--color-text-muted)] font-medium tabular-nums">
                {displayItems.length} {displayItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Main Grid */}
            {displayItems.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayItems.map((item) => (
                  <ItemDisplayBox
                    key={item.id}
                    item={item}
                    size="md"
                    isOwned={ownedIds.has(item.id)}
                    onPurchase={() => openPurchaseModal(item)}
                    onViewDetails={() => {/* TODO: Item detail modal */}}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                onClearFilters={() => {
                  setSelectedType(null)
                  setSelectedRarity(null)
                  setActiveSection('all')
                }}
              />
            )}
          </>
        )}

        {/* Purchase Modal */}
        <PurchaseModal
          isOpen={isPurchaseModalOpen}
          onClose={() => {
            setIsPurchaseModalOpen(false)
            setPurchaseItem(null)
          }}
          item={purchaseItem}
          userBalance={userBalance}
          onConfirm={handlePurchase}
        />

        {/* Confetti */}
        <Confetti
          active={confetti.isActive}
          rarity={confetti.rarity}
          originX={confetti.originX}
          originY={confetti.originY}
          onComplete={confetti.onComplete}
        />
      </div>
    </div>
  )
}

function EmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[var(--color-bg-elevated)] flex items-center justify-center border border-white/5">
        <svg className="w-10 h-10 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">No items found</h3>
      <p className="text-[var(--color-text-muted)] mb-6 font-medium">
        Try adjusting your filters or check back later.
      </p>
      <Button variant="secondary" onClick={onClearFilters}>
        Clear Filters
      </Button>
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

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export default Shop
