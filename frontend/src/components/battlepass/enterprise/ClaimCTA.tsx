/**
 * ClaimCTA - Conversion-Optimized Claim Buttons
 * 
 * Variants:
 * - default: Indigo bg for standard claims
 * - premium: Amber gradient for premium claims
 * - claimed: Emerald bg with checkmark, disabled
 * - locked: Gray bg with lock icon, disabled
 * 
 * Size variants: sm, md, lg
 * 
 * Requirements: 7.1
 */

import { cn } from '@/utils/helpers'

export type ClaimCTAVariant = 'default' | 'premium' | 'claimed' | 'locked'
export type ClaimCTASize = 'sm' | 'md' | 'lg'

interface ClaimCTAProps {
  variant: ClaimCTAVariant
  size?: ClaimCTASize
  onClick?: () => void
  isLoading?: boolean
  className?: string
}

const variantStyles: Record<ClaimCTAVariant, string> = {
  default: 'bg-[#6366f1] hover:bg-[#4f46e5] text-white',
  premium: 'bg-gradient-to-r from-[#f59e0b] to-[#ea580c] hover:from-[#fbbf24] hover:to-[#f97316] text-black',
  claimed: 'bg-[#10b981] text-white cursor-default',
  locked: 'bg-[#374151] text-[#9ca3af] cursor-not-allowed',
}

const sizeStyles: Record<ClaimCTASize, string> = {
  sm: 'px-2.5 py-1 text-xs gap-1',
  md: 'px-4 py-2 text-sm gap-1.5',
  lg: 'px-6 py-3 text-base gap-2',
}

const iconSizes: Record<ClaimCTASize, string> = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

export function ClaimCTA({
  variant,
  size = 'md',
  onClick,
  isLoading = false,
  className,
}: ClaimCTAProps) {
  const isDisabled = variant === 'claimed' || variant === 'locked' || isLoading
  const showIcon = variant === 'claimed' || variant === 'locked'

  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-bold uppercase tracking-wide',
        'transition-all duration-200 ease-out',
        'active:scale-[0.98]',
        variantStyles[variant],
        sizeStyles[size],
        isLoading && 'opacity-70',
        className
      )}
    >
      {isLoading ? (
        <LoadingSpinner className={iconSizes[size]} />
      ) : showIcon ? (
        <>
          {variant === 'claimed' && <CheckIcon className={iconSizes[size]} />}
          {variant === 'locked' && <LockIcon className={iconSizes[size]} />}
          <span>{getButtonText(variant)}</span>
        </>
      ) : (
        <span>{getButtonText(variant)}</span>
      )}
    </button>
  )
}

function getButtonText(variant: ClaimCTAVariant): string {
  switch (variant) {
    case 'default':
      return 'Claim'
    case 'premium':
      return 'Claim'
    case 'claimed':
      return 'Claimed'
    case 'locked':
      return 'Locked'
    default:
      return 'Claim'
  }
}

// Icons
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} viewBox="0 0 24 24" fill="none">
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
  )
}

/**
 * Get variant style for a given variant.
 * Exported for property testing.
 */
export function getVariantStyle(variant: ClaimCTAVariant): string {
  return variantStyles[variant]
}

/**
 * Determine if a variant is disabled.
 * Exported for property testing.
 */
export function isVariantDisabled(variant: ClaimCTAVariant): boolean {
  return variant === 'claimed' || variant === 'locked'
}

export default ClaimCTA
