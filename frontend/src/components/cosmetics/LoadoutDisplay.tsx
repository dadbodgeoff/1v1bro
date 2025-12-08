/**
 * Loadout display component showing currently equipped items.
 * 
 * This component now wraps the enterprise LoadoutPanel for consistent styling.
 * 
 * Requirements: 3.5
 */

import React from 'react'
import type { Loadout, InventoryItem, CosmeticType } from '../../types/cosmetic'
import { LoadoutPanel } from '../inventory/enterprise'

interface LoadoutDisplayProps {
  loadout: Loadout | null
  inventory: InventoryItem[]
  onSlotClick?: (type: CosmeticType) => void
  onUnequip?: (cosmeticId: string) => void
}

export const LoadoutDisplay: React.FC<LoadoutDisplayProps> = ({
  loadout,
  inventory,
  onSlotClick,
  onUnequip,
}) => {
  const handleSlotClick = (type: CosmeticType) => {
    onSlotClick?.(type)
  }

  return (
    <div className="bg-[var(--color-bg-card)] rounded-lg p-4">
      <h3 className="text-white font-bold text-lg mb-4">Current Loadout</h3>
      <LoadoutPanel
        loadout={loadout}
        inventory={inventory}
        onSlotClick={handleSlotClick}
        onUnequip={onUnequip}
      />
    </div>
  )
}

export default LoadoutDisplay
