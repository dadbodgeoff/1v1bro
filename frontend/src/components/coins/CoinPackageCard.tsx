/**
 * CoinPackageCard - Display card for a coin package.
 * Requirements: 1.2, 1.3, 8.2, 8.3, 8.4
 */

import type { CoinPackage } from '../../types/coin';
import { formatPrice, formatCoins } from '../../types/coin';

interface CoinPackageCardProps {
  package: CoinPackage;
  onPurchase: (packageId: string) => void;
  loading?: boolean;
}

export function CoinPackageCard({
  package: pkg,
  onPurchase,
  loading = false,
}: CoinPackageCardProps) {
  const hasBonus = pkg.bonus_coins > 0;

  return (
    <div
      className={`
        relative flex flex-col rounded-xl border-2 bg-[var(--color-bg-card)]
        transition-all duration-200 overflow-hidden
        ${loading ? 'opacity-75 pointer-events-none' : 'hover:-translate-y-1 hover:shadow-lg'}
        ${pkg.badge ? 'border-yellow-500/50' : 'border-[var(--color-border-subtle)]'}
      `}
    >
      {/* Badge */}
      {pkg.badge && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
          {pkg.badge}
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col items-center p-6 flex-1">
        {/* Coin Icon */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center mb-4 shadow-lg">
          <svg
            className="w-8 h-8 text-yellow-900"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <text
              x="12"
              y="16"
              textAnchor="middle"
              fontSize="10"
              fill="white"
              fontWeight="bold"
            >
              $
            </text>
          </svg>
        </div>

        {/* Package Name */}
        <h3 className="text-lg font-bold text-white mb-2">{pkg.name}</h3>

        {/* Coin Amount */}
        <div className="text-center mb-4">
          <div className="text-3xl font-extrabold text-yellow-400">
            {formatCoins(pkg.total_coins)}
          </div>
          <div className="text-sm text-[var(--color-text-secondary)]">coins</div>
        </div>

        {/* Bonus Display */}
        {hasBonus && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-[var(--color-text-secondary)] line-through">
              {formatCoins(pkg.base_coins)}
            </span>
            <span className="text-sm font-semibold text-emerald-400">
              +{pkg.bonus_percent}% bonus
            </span>
          </div>
        )}

        {/* Price */}
        <div className="text-2xl font-bold text-white mb-4">
          {formatPrice(pkg.price_cents)}
        </div>
      </div>

      {/* Buy Button */}
      <button
        onClick={() => onPurchase(pkg.id)}
        disabled={loading}
        className={`
          w-full py-4 font-bold text-lg transition-all duration-150
          ${loading
            ? 'bg-gray-600 cursor-wait'
            : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 active:scale-[0.98]'
          }
          text-black
        `}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          'Buy Now'
        )}
      </button>
    </div>
  );
}
