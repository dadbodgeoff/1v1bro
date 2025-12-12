/**
 * CoinShop - Enterprise Design System
 * Main coin purchase page with premium styling
 * 
 * Typography hierarchy:
 * - Headline: text-[32px] md:text-[40px] font-extrabold tracking-[-0.03em]
 * - Subheadline: text-[15px] md:text-[17px] leading-[1.6] text-[#B4B4B4]
 * - Section titles: text-[20px] font-bold tracking-[-0.02em]
 * - Body: text-[14px] text-[#B4B4B4]
 * - Labels: text-[12px] font-semibold uppercase tracking-[0.02em]
 * 
 * Requirements: 8.1, 8.5
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCoinPurchase } from '@/hooks/useCoinPurchase'
import { useBalance } from '@/hooks/useBalance'
import type { CoinPackage } from '@/types/coin'
import { formatPrice, formatCoins } from '@/types/coin'

// Coin image URL from Supabase storage
const COIN_IMAGE_URL = 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/playercard/coins.jpg'

export function CoinShop() {
  const navigate = useNavigate()
  const { packages, loading, error, purchaseLoading, fetchPackages, purchasePackage } = useCoinPurchase()
  const { coins, loading: balanceLoading, fetchBalance } = useBalance()

  useEffect(() => {
    fetchPackages()
    fetchBalance()
  }, [fetchPackages, fetchBalance])

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button - Touch optimized */}
        <button
          onClick={() => navigate(-1)}
          className="text-[#737373] hover:text-white mb-6 flex items-center gap-2 transition-colors text-[14px] min-h-[44px] touch-manipulation"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Hero Header */}
        <div className="relative mb-12 p-8 md:p-12 rounded-2xl bg-gradient-to-br from-[#1a1a1c] to-[#111113] border border-white/[0.08] overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Left: Title & Description */}
            <div className="text-center md:text-left">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-amber-400 mb-3">
                Premium Currency
              </p>
              <h1 className="text-[32px] md:text-[40px] font-extrabold tracking-[-0.03em] text-white leading-[1.1] mb-4">
                Get Coins
              </h1>
              <p className="text-[15px] md:text-[17px] leading-[1.6] text-[#B4B4B4] max-w-md">
                Purchase coins to unlock exclusive skins, emotes, and the Premium Battle Pass
              </p>
            </div>

            {/* Right: Current Balance */}
            <div className="flex flex-col items-center p-6 rounded-xl bg-black/40 border border-white/[0.08]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#737373] mb-2">
                Your Balance
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={COIN_IMAGE_URL}
                  alt="Coins"
                  className="w-10 h-10 rounded-full object-cover shadow-lg"
                />
                <span className="text-[32px] font-extrabold text-amber-400 tabular-nums">
                  {balanceLoading ? '...' : formatCoins(coins)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
            <p className="text-[14px] text-red-400">{error}</p>
            <button 
              onClick={fetchPackages} 
              className="mt-2 text-[13px] text-red-300 hover:text-red-200 underline transition-colors min-h-[44px] touch-manipulation"
            >
              Try again
            </button>
          </div>
        )}

        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-white mb-1">
            Choose a Package
          </h2>
          <p className="text-[14px] text-[#737373]">
            Select the coin bundle that works best for you
          </p>
        </div>

        {/* Loading State */}
        {loading && packages.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-[320px] bg-[#1a1a1c] rounded-xl animate-pulse border border-white/[0.06]" />
            ))}
          </div>
        )}

        {/* Package Grid */}
        {packages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-16">
            {packages.map((pkg) => (
              <CoinPackageCard
                key={pkg.id}
                pkg={pkg}
                onPurchase={purchasePackage}
                loading={purchaseLoading === pkg.id}
              />
            ))}
          </div>
        )}

        {/* Trust Indicators */}
        <div className="mb-16 p-6 rounded-xl bg-[#111113] border border-white/[0.06]">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            <TrustBadge
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
              color="emerald"
              label="Secure Payment"
            />
            <TrustBadge
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              }
              color="blue"
              label="Powered by Stripe"
            />
            <TrustBadge
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              color="amber"
              label="Instant Delivery"
            />
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-white text-center mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            <FAQItem
              question="How do I use my coins?"
              answer="Coins can be used to purchase skins, emotes, and other cosmetics in the Shop, or to unlock the Premium Battle Pass."
            />
            <FAQItem
              question="When will I receive my coins?"
              answer="Coins are credited instantly after your payment is processed. If you don't see them, try refreshing the page."
            />
            <FAQItem
              question="Can I get a refund?"
              answer="All purchases of virtual currency are final. Virtual goods are delivered instantly and cannot be returned. Please review our Refund Policy for more details."
            />
          </div>
        </div>

        {/* Legal Footer */}
        <div className="mt-16 pt-8 border-t border-white/[0.06] text-center">
          <p className="text-[12px] text-[#737373] mb-3">
            By making a purchase, you agree to our Terms of Service and acknowledge that all sales are final.
          </p>
          <div className="flex justify-center gap-6 text-[12px]">
            <a href="/terms" className="text-[#737373] hover:text-white transition-colors">Terms of Service</a>
            <a href="/privacy" className="text-[#737373] hover:text-white transition-colors">Privacy Policy</a>
            <a href="/refunds" className="text-[#737373] hover:text-white transition-colors">Refund Policy</a>
          </div>
        </div>
      </div>
    </div>
  )
}

// Enterprise Coin Package Card
function CoinPackageCard({
  pkg,
  onPurchase,
  loading = false,
}: {
  pkg: CoinPackage
  onPurchase: (packageId: string) => void
  loading?: boolean
}) {
  const hasBonus = pkg.bonus_coins > 0
  const isPopular = pkg.badge === 'POPULAR' || pkg.badge === 'BEST VALUE'

  return (
    <div
      className={`
        relative flex flex-col rounded-xl border-2 bg-[#111113] overflow-hidden
        transition-all duration-200
        ${loading ? 'opacity-75 pointer-events-none' : 'hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10'}
        ${isPopular ? 'border-amber-500/50 ring-1 ring-amber-500/20' : 'border-white/[0.08]'}
      `}
    >
      {/* Badge */}
      {pkg.badge && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-bl-xl">
          {pkg.badge}
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col items-center p-6 flex-1">
        {/* Coin Icon */}
        <div className="relative mb-4">
          <img
            src={COIN_IMAGE_URL}
            alt="Coins"
            className="w-16 h-16 rounded-full object-cover shadow-lg"
          />
          {isPopular && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          )}
        </div>

        {/* Package Name */}
        <h3 className="text-[15px] font-bold text-white mb-3">{pkg.name}</h3>

        {/* Coin Amount */}
        <div className="text-center mb-3">
          <div className="text-[28px] font-extrabold text-amber-400 tabular-nums">
            {formatCoins(pkg.total_coins)}
          </div>
          <div className="text-[12px] text-[#737373] uppercase tracking-wider">coins</div>
        </div>

        {/* Bonus Display */}
        {hasBonus && (
          <div className="flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[12px] text-[#737373] line-through tabular-nums">
              {formatCoins(pkg.base_coins)}
            </span>
            <span className="text-[12px] font-semibold text-emerald-400">
              +{pkg.bonus_percent}%
            </span>
          </div>
        )}

        {/* Price */}
        <div className="text-[22px] font-bold text-white mb-4 tabular-nums">
          {formatPrice(pkg.price_cents)}
        </div>
      </div>

      {/* Buy Button - Touch optimized */}
      <button
        onClick={() => onPurchase(pkg.id)}
        disabled={loading}
        className={`
          w-full py-4 font-bold text-[14px] uppercase tracking-wider transition-all duration-150 min-h-[48px] touch-manipulation
          ${loading
            ? 'bg-[#333] cursor-wait text-[#737373]'
            : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-[0.98] text-black'
          }
        `}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </span>
        ) : (
          'Buy Now'
        )}
      </button>
    </div>
  )
}

// Trust Badge Component
function TrustBadge({ 
  icon, 
  color, 
  label 
}: { 
  icon: React.ReactNode
  color: 'emerald' | 'blue' | 'amber'
  label: string 
}) {
  const colorClasses = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    amber: 'text-amber-400',
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className={colorClasses[color]}>{icon}</div>
      <span className="text-[13px] text-[#B4B4B4]">{label}</span>
    </div>
  )
}

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
      <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
        <span className="text-[14px] font-medium text-white">{question}</span>
        <svg 
          className="w-5 h-5 text-[#737373] transition-transform group-open:rotate-180" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="px-4 pb-4">
        <p className="text-[14px] text-[#B4B4B4] leading-[1.6]">{answer}</p>
      </div>
    </details>
  )
}
