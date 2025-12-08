/**
 * CoinShop - Main coin purchase page.
 * Requirements: 8.1, 8.5
 */

import { useEffect } from 'react';
import { useCoinPurchase } from '../hooks/useCoinPurchase';
import { useBalance } from '../hooks/useBalance';
import { CoinPackageCard } from '../components/coins/CoinPackageCard';
import { BalanceDisplay } from '../components/coins/BalanceDisplay';

export function CoinShop() {
  const { packages, loading, error, purchaseLoading, fetchPackages, purchasePackage } = useCoinPurchase();
  const { coins, loading: balanceLoading, fetchBalance } = useBalance();

  useEffect(() => {
    fetchPackages();
    fetchBalance();
  }, [fetchPackages, fetchBalance]);

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent mb-4">
            Get Coins
          </h1>
          <p className="text-[var(--color-text-secondary)] mb-6">
            Purchase coins to unlock skins, emotes, and the Battle Pass
          </p>
          <div className="flex justify-center">
            <BalanceDisplay balance={coins} loading={balanceLoading} size="lg" />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
            <p className="text-red-400">{error}</p>
            <button onClick={fetchPackages} className="mt-2 text-sm text-red-300 hover:text-red-200 underline">
              Try again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && packages.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-80 bg-[var(--color-bg-card)] rounded-xl animate-pulse" />
            ))}
          </div>
        )}


        {/* Package Grid */}
        {packages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
            {packages.map((pkg) => (
              <CoinPackageCard
                key={pkg.id}
                package={pkg}
                onPurchase={purchasePackage}
                loading={purchaseLoading === pkg.id}
              />
            ))}
          </div>
        )}

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center items-center gap-6 mb-12 text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm">Secure Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span className="text-sm">Powered by Stripe</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm">Instant Delivery</span>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="bg-[var(--color-bg-card)] rounded-lg p-4 cursor-pointer">
              <summary className="font-medium text-white">How do I use my coins?</summary>
              <p className="mt-2 text-[var(--color-text-secondary)] text-sm">
                Coins can be used to purchase skins, emotes, and other cosmetics in the Shop, or to unlock the Premium Battle Pass.
              </p>
            </details>
            <details className="bg-[var(--color-bg-card)] rounded-lg p-4 cursor-pointer">
              <summary className="font-medium text-white">When will I receive my coins?</summary>
              <p className="mt-2 text-[var(--color-text-secondary)] text-sm">
                Coins are credited instantly after your payment is processed. If you don't see them, try refreshing the page.
              </p>
            </details>
            <details className="bg-[var(--color-bg-card)] rounded-lg p-4 cursor-pointer">
              <summary className="font-medium text-white">Can I get a refund?</summary>
              <p className="mt-2 text-[var(--color-text-secondary)] text-sm">
                Refunds are handled on a case-by-case basis. Please contact support if you have any issues with your purchase.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}