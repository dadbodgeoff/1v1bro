/**
 * ShopHeader - Enterprise Shop Header Component
 * 
 * Features:
 * - Seasonal branding with dynamic themes
 * - User balance display with coin animation
 * - Navigation breadcrumb
 * - Refresh timer for daily rotation
 * - Enterprise typography hierarchy
 */

import { cn } from '@/utils/helpers'
import { useCountdown } from '@/hooks/useCountdown'

interface ShopHeaderProps {
  balance: number
  seasonName?: string
  seasonTheme?: 'default' | 'winter' | 'summer' | 'halloween' | 'neon'
  dailyRefreshTime?: Date | null
  onBalanceClick?: () => void
}

const themeStyles = {
  default: {
    // Clean white to silver - premium, not AI slop
    gradient: 'from-white via-[#e2e8f0] to-[#94a3b8]',
    barGradient: 'from-[#f59e0b] via-[#d97706] to-[#b45309]',
    accent: '#f59e0b',
  },
  winter: {
    // Ice blue to white
    gradient: 'from-white via-[#e0f2fe] to-[#bae6fd]',
    barGradient: 'from-[#38bdf8] via-[#0ea5e9] to-[#0284c7]',
    accent: '#0ea5e9',
  },
  summer: {
    // Warm white to gold
    gradient: 'from-white via-[#fef3c7] to-[#fcd34d]',
    barGradient: 'from-[#f59e0b] via-[#d97706] to-[#b45309]',
    accent: '#f59e0b',
  },
  halloween: {
    // White to orange
    gradient: 'from-white via-[#fed7aa] to-[#fdba74]',
    barGradient: 'from-[#f97316] via-[#ea580c] to-[#c2410c]',
    accent: '#f97316',
  },
  neon: {
    // Clean white - let the bar provide color
    gradient: 'from-white via-[#f1f5f9] to-[#cbd5e1]',
    barGradient: 'from-[#f59e0b] via-[#d97706] to-[#b45309]',
    accent: '#f59e0b',
  },
}

export function ShopHeader({
  balance,
  seasonName = 'Item Shop',
  seasonTheme = 'default',
  dailyRefreshTime,
  onBalanceClick,
}: ShopHeaderProps) {
  const countdown = useCountdown(dailyRefreshTime ?? null)
  const theme = themeStyles[seasonTheme]

  return (
    <header className="relative mb-10">
      {/* Background Gradient Bar - gold accent, not AI rainbow */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-1 rounded-full bg-gradient-to-r',
        theme.barGradient
      )} />
      
      <div className="flex items-center justify-between pt-6 pb-2">
        {/* Left: Title & Season */}
        <div className="flex items-center gap-5">
          {/* Page Title - H1 level, largest in hierarchy */}
          <h1 className={cn(
            'text-4xl md:text-5xl font-extrabold tracking-tight',
            'bg-gradient-to-r bg-clip-text text-transparent',
            theme.gradient
          )}>
            {seasonName}
          </h1>
          
          {/* Daily Refresh Timer - secondary info */}
          {countdown && (
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-elevated)] rounded-xl border border-white/10">
              <RefreshIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
              <span className="text-sm text-[var(--color-text-secondary)] font-medium">
                Refreshes in{' '}
                <span className="font-bold text-white tabular-nums">
                  {countdown.hours}h {countdown.minutes}m
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Right: Balance - prominent but secondary to title */}
        <button
          onClick={onBalanceClick}
          className={cn(
            'group flex items-center gap-3 px-5 py-2.5 rounded-xl',
            'bg-[var(--color-bg-elevated)] border border-white/10',
            'hover:border-[#f59e0b]/50 transition-all duration-200',
            'hover:shadow-[0_0_24px_rgba(245,158,11,0.2)]'
          )}
        >
          <div className="relative">
            <CoinIcon className="w-7 h-7 text-[#f59e0b] group-hover:scale-110 transition-transform" />
            <div className="absolute inset-0 bg-[#f59e0b]/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium">Balance</span>
            <span className="text-xl font-bold text-white tabular-nums">{balance.toLocaleString()}</span>
          </div>
          <PlusIcon className="w-5 h-5 text-[#10b981] opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
      
      {/* Subtle divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mt-4" />
    </header>
  )
}

function CoinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill="#000" fontWeight="bold">$</text>
    </svg>
  )
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}
