/**
 * useShopAnalytics - Track shop interactions for monetization funnel
 * 
 * Usage:
 *   const shopAnalytics = useShopAnalytics()
 *   shopAnalytics.trackShopView()
 *   shopAnalytics.trackItemView(item.id, item.type, item.price)
 *   shopAnalytics.trackPurchaseComplete(item.id, item.price, 'coins')
 */

import { useCallback } from 'react'
import { analytics } from '@/services/analytics'

export function useShopAnalytics() {
  const trackShopView = useCallback(() => {
    analytics.trackEvent('shop_view')
  }, [])

  const trackItemView = useCallback((itemId: string, itemType: string, price: number, rarity?: string) => {
    analytics.trackEvent('shop_item_view', { 
      item_id: itemId, 
      item_type: itemType, 
      price,
      rarity,
    })
  }, [])

  const trackItemPreview = useCallback((itemId: string, itemType: string) => {
    analytics.trackEvent('shop_item_preview', { item_id: itemId, item_type: itemType })
  }, [])

  const trackPurchaseStart = useCallback((itemId: string, price: number, currency: string) => {
    analytics.trackEvent('shop_purchase_start', { item_id: itemId, price, currency })
  }, [])

  const trackPurchaseComplete = useCallback((itemId: string, price: number, currency: string) => {
    analytics.trackEvent('shop_purchase_complete', { item_id: itemId, price, currency })
  }, [])

  const trackPurchaseFailed = useCallback((itemId: string, errorType: string) => {
    analytics.trackEvent('shop_purchase_failed', { item_id: itemId, error_type: errorType })
  }, [])

  const trackCosmeticEquip = useCallback((itemId: string, slot: string, rarity?: string) => {
    analytics.trackEvent('cosmetic_equip', { item_id: itemId, slot, rarity })
  }, [])

  const trackCosmeticUnequip = useCallback((itemId: string, slot: string) => {
    analytics.trackEvent('cosmetic_unequip', { item_id: itemId, slot })
  }, [])

  return {
    trackShopView,
    trackItemView,
    trackItemPreview,
    trackPurchaseStart,
    trackPurchaseComplete,
    trackPurchaseFailed,
    trackCosmeticEquip,
    trackCosmeticUnequip,
  }
}
