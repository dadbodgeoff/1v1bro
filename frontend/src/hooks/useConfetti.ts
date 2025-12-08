/**
 * useConfetti Hook - 2025 Design System
 * Requirements: 7.5
 *
 * Trigger confetti with rarity parameter and handle animation lifecycle.
 */

import { useState, useCallback } from 'react'
import type { Rarity } from '@/components/ui/Confetti'

export interface UseConfettiReturn {
  /** Whether confetti is currently active */
  isActive: boolean
  /** Current rarity being displayed */
  rarity: Rarity
  /** Origin X position (0-1) */
  originX: number
  /** Origin Y position (0-1) */
  originY: number
  /** Trigger confetti burst */
  fire: (options?: ConfettiOptions) => void
  /** Stop confetti immediately */
  stop: () => void
  /** Called when animation completes */
  onComplete: () => void
}

export interface ConfettiOptions {
  rarity?: Rarity
  originX?: number
  originY?: number
}

export function useConfetti(): UseConfettiReturn {
  const [isActive, setIsActive] = useState(false)
  const [rarity, setRarity] = useState<Rarity>('common')
  const [originX, setOriginX] = useState(0.5)
  const [originY, setOriginY] = useState(0.5)

  const fire = useCallback((options: ConfettiOptions = {}) => {
    setRarity(options.rarity ?? 'common')
    setOriginX(options.originX ?? 0.5)
    setOriginY(options.originY ?? 0.5)
    setIsActive(true)
  }, [])

  const stop = useCallback(() => {
    setIsActive(false)
  }, [])

  const onComplete = useCallback(() => {
    setIsActive(false)
  }, [])

  return {
    isActive,
    rarity,
    originX,
    originY,
    fire,
    stop,
    onComplete,
  }
}

// ============================================
// Convenience functions for common use cases
// ============================================

/**
 * Fire confetti for a purchase based on item rarity
 */
export function getConfettiRarityFromPrice(price: number): Rarity {
  if (price >= 5000) return 'legendary'
  if (price >= 2500) return 'epic'
  if (price >= 1000) return 'rare'
  if (price >= 500) return 'uncommon'
  return 'common'
}

/**
 * Map string rarity to Confetti rarity type
 */
export function mapRarity(rarity: string): Rarity {
  const normalized = rarity.toLowerCase()
  if (normalized === 'legendary') return 'legendary'
  if (normalized === 'epic') return 'epic'
  if (normalized === 'rare') return 'rare'
  if (normalized === 'uncommon') return 'uncommon'
  return 'common'
}
