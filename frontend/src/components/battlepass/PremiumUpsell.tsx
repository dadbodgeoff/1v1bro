/**
 * PremiumUpsell Component - 2025 Enterprise Design System
 * Requirements: 4.6, 5.3, 5.4
 *
 * Enterprise premium upgrade CTA with:
 * - Gradient background (amber-500/10 → orange-500/10)
 * - Crown icon badge
 * - Headline in 2xl bold
 * - Preview of 3-5 locked premium rewards with lock overlays
 * - Premium variant CTA button with amber gradient
 * - Shadow and glow effects
 */

import { cn } from '@/utils/helpers'

interface PremiumRewardPreview {
  preview_url?: string
  type: string
  name: string
}

interface PremiumUpsellProps {
  price: number
  rewards: PremiumRewardPreview[]
  onUpgrade: () => void
  onDismiss?: () => void
  className?: string
}

export function PremiumUpsell({
  price,
  rewards,
  onUpgrade,
  onDismiss,
  className,
}: PremiumUpsellProps) {
  // Show up to 5 rewards
  const displayRewards = rewards.slice(0, 5)

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-gradient-to-br from-[#f59e0b]/10 via-[#ea580c]/10 to-[#f59e0b]/10',
        'border-2 border-[#f59e0b]/30',
        'shadow-lg shadow-[#f59e0b]/10',
        'hover:shadow-xl hover:shadow-[#f59e0b]/20 transition-shadow duration-300',
        className
      )}
    >
      {/* Decorative glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#f59e0b]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#ea580c]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Dismiss Button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-2 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-white/10 transition-colors z-10"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <div className="relative p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-8">
          {/* Content */}
          <div className="flex-1">
            {/* Premium Badge with Crown */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#f59e0b] rounded-full mb-4 shadow-lg shadow-[#f59e0b]/30">
              <CrownIcon className="w-5 h-5 text-black" />
              <span className="text-sm font-bold text-black uppercase tracking-wide">Premium Pass</span>
            </div>

            {/* Headline - 2xl bold */}
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">
              Unlock Premium Rewards
            </h3>

            {/* Value Proposition */}
            <p className="text-base text-[var(--color-text-secondary)] mb-6 max-w-lg leading-relaxed">
              Get exclusive cosmetics, bonus coins, and XP boosts with the Premium Battle Pass. 
              Unlock all premium rewards instantly for tiers you've already completed!
            </p>

            {/* Premium CTA Button - amber gradient */}
            <button
              onClick={onUpgrade}
              className={cn(
                'inline-flex items-center gap-2 px-6 py-3 rounded-xl',
                'bg-gradient-to-r from-[#f59e0b] to-[#ea580c]',
                'hover:from-[#fbbf24] hover:to-[#f97316]',
                'text-black font-bold text-base uppercase tracking-wide',
                'shadow-lg shadow-[#f59e0b]/30 hover:shadow-xl hover:shadow-[#f59e0b]/40',
                'transition-all duration-200 active:scale-[0.98]'
              )}
            >
              <CrownIcon className="w-5 h-5" />
              Upgrade for {price.toLocaleString()} Coins
            </button>
          </div>

          {/* Reward Previews - larger with better styling */}
          <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap">
            {displayRewards.map((reward, index) => (
              <div
                key={index}
                className={cn(
                  'relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden',
                  'bg-gradient-to-br from-[#f59e0b]/20 to-[#ea580c]/20',
                  'border-2 border-[#f59e0b]/40',
                  'flex items-center justify-center',
                  'shadow-md shadow-[#f59e0b]/10'
                )}
              >
                {reward.preview_url ? (
                  <img
                    src={reward.preview_url}
                    alt={reward.name}
                    className="w-14 h-14 md:w-16 md:h-16 object-contain opacity-50"
                  />
                ) : (
                  <GiftIcon className="w-10 h-10 text-[#f59e0b]/40" />
                )}

                {/* Lock Overlay */}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                  <div className="w-8 h-8 rounded-full bg-[#f59e0b]/20 flex items-center justify-center">
                    <LockIcon className="w-5 h-5 text-[#f59e0b]" />
                  </div>
                </div>
              </div>
            ))}

            {rewards.length > 5 && (
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-[var(--color-bg-elevated)] border-2 border-[var(--color-border-subtle)] flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-white">+{rewards.length - 5}</span>
                <span className="text-xs text-[var(--color-text-muted)]">more</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
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

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  )
}
