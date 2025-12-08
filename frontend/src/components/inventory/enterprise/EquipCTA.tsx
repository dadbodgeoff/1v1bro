/**
 * EquipCTA - Equip/Unequip Buttons Component
 * 
 * Variants:
 * - default: Indigo bg for equip action
 * - equipped: Green bg with checkmark, shows "Equipped"
 * - unequip: Gray bg for unequip action
 * - loading: Shows spinner during API call
 * 
 * Sizes:
 * - sm: Compact button for small cards
 * - md: Standard button for medium cards
 * - lg: Large button for featured items
 * 
 * Features:
 * - Slot type hint text ("Equip as Skin")
 * - Loading state with spinner
 * - Hover and active states
 * - Checkmark icon for equipped variant
 */

import { cn } from '@/utils/helpers'
import type { CosmeticType } from '@/types/cosmetic'
import { getCosmeticTypeName } from '@/types/cosmetic'

export type EquipVariant = 'default' | 'equipped' | 'unequip' | 'loading'

interface EquipCTAProps {
  variant: EquipVariant
  size?: 'sm' | 'md' | 'lg'
  onClick?: (e: React.MouseEvent) => void
  slotType?: CosmeticType
  className?: string
}

export const variantStyles: Record<EquipVariant, string> = {
  default: 'bg-[#6366f1] hover:bg-[#4f46e5] text-white cursor-pointer',
  equipped: 'bg-[#10b981] text-white cursor-default',
  unequip: 'bg-[#374151] hover:bg-[#4b5563] text-white cursor-pointer',
  loading: 'bg-[#6366f1] text-white cursor-wait opacity-75',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
}

export function EquipCTA({
  variant,
  size = 'md',
  onClick,
  slotType,
  className,
}: EquipCTAProps) {
  const isClickable = variant !== 'equipped' && variant !== 'loading'
  
  const getButtonText = () => {
    switch (variant) {
      case 'loading':
        return 'Loading...'
      case 'equipped':
        return 'Equipped'
      case 'unequip':
        return 'Unequip'
      default:
        return slotType ? `Equip as ${getCosmeticTypeName(slotType)}` : 'Equip'
    }
  }

  return (
    <button
      onClick={isClickable ? onClick : undefined}
      disabled={variant === 'loading'}
      className={cn(
        'w-full rounded-lg font-bold transition-all duration-200',
        'flex items-center justify-center gap-2',
        'active:scale-[0.98]',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {/* Loading Spinner */}
      {variant === 'loading' && (
        <svg 
          className="w-4 h-4 animate-spin" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {/* Equipped Checkmark */}
      {variant === 'equipped' && (
        <svg 
          className="w-4 h-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}

      <span>{getButtonText()}</span>
    </button>
  )
}
