/**
 * PurchaseModal Component - 2025 Design System
 * Requirements: 3.5
 *
 * Purchase confirmation modal with:
 * - Item preview centered
 * - Price breakdown (cost, balance, remaining)
 * - Confirm and Cancel buttons
 * - Insufficient funds state with "Get Coins" CTA
 * - Loading state during purchase
 */

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { Cosmetic } from '@/types/cosmetic'
import { getCosmeticTypeName } from '@/types/cosmetic'

interface PurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  item: Cosmetic | null
  userBalance: number
  onConfirm: () => Promise<void>
  onGetCoins?: () => void
}

export function PurchaseModal({
  isOpen,
  onClose,
  item,
  userBalance,
  onConfirm,
  onGetCoins,
}: PurchaseModalProps) {
  const [isPurchasing, setIsPurchasing] = useState(false)

  if (!item) return null

  const canAfford = userBalance >= item.price_coins
  const balanceAfter = userBalance - item.price_coins

  const handleConfirm = async () => {
    if (!canAfford || isPurchasing) return
    setIsPurchasing(true)
    try {
      await onConfirm()
      onClose()
    } catch {
      // Error handling done by parent
    } finally {
      setIsPurchasing(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Purchase" size="md">
      <div className="space-y-6">
        {/* Item Preview */}
        <div className="flex flex-col items-center">
          <div className="w-48 h-48 rounded-xl overflow-hidden bg-[var(--color-bg-elevated)] mb-4">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-semibold text-white">{item.name}</h3>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Badge variant={item.rarity} size="sm">
                {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
              </Badge>
              <span className="text-sm text-[var(--color-text-muted)]">
                {getCosmeticTypeName(item.type)}
              </span>
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-secondary)]">Price</span>
            <div className="flex items-center gap-1.5">
              <CoinIcon className="w-4 h-4 text-[#f59e0b]" />
              <span className="font-semibold text-white">
                {item.price_coins.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-secondary)]">Your Balance</span>
            <div className="flex items-center gap-1.5">
              <CoinIcon className="w-4 h-4 text-[#f59e0b]" />
              <span className={canAfford ? 'font-semibold text-white' : 'font-semibold text-[#f43f5e]'}>
                {userBalance.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="border-t border-[var(--color-border-subtle)] pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Balance After</span>
              <div className="flex items-center gap-1.5">
                <CoinIcon className="w-4 h-4 text-[#f59e0b]" />
                <span className={canAfford ? 'font-semibold text-[#10b981]' : 'font-semibold text-[#f43f5e]'}>
                  {canAfford ? balanceAfter.toLocaleString() : 'Insufficient'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Insufficient Funds Warning */}
        {!canAfford && (
          <div className="bg-[#f43f5e]/10 border border-[#f43f5e]/30 rounded-xl p-4">
            <p className="text-sm text-[#f43f5e] mb-3">
              You need {(item.price_coins - userBalance).toLocaleString()} more coins to purchase this item.
            </p>
            {onGetCoins && (
              <Button variant="premium" size="sm" onClick={onGetCoins}>
                Get More Coins
              </Button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={onClose}
            disabled={isPurchasing}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleConfirm}
            disabled={!canAfford}
            isLoading={isPurchasing}
          >
            {canAfford ? 'Confirm Purchase' : 'Insufficient Funds'}
          </Button>
        </div>
      </div>
    </Modal>
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
