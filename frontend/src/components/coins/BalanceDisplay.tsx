/**
 * BalanceDisplay - Shows current coin balance.
 * Requirements: 5.1, 5.4
 */

import { formatCoins } from '../../types/coin';

interface BalanceDisplayProps {
  balance: number;
  loading?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeConfig = {
  sm: {
    container: 'gap-1.5 px-2 py-1',
    icon: 'w-4 h-4',
    text: 'text-sm font-medium',
  },
  md: {
    container: 'gap-2 px-3 py-1.5',
    icon: 'w-5 h-5',
    text: 'text-base font-semibold',
  },
  lg: {
    container: 'gap-2.5 px-4 py-2',
    icon: 'w-6 h-6',
    text: 'text-lg font-bold',
  },
};

export function BalanceDisplay({
  balance,
  loading = false,
  showIcon = true,
  size = 'md',
  className = '',
}: BalanceDisplayProps) {
  const config = sizeConfig[size];

  if (loading) {
    return (
      <div
        className={`
          flex items-center rounded-full bg-[var(--color-bg-elevated)]
          ${config.container} ${className}
        `}
      >
        {showIcon && (
          <div className={`${config.icon} rounded-full bg-yellow-500/30 animate-pulse`} />
        )}
        <div className={`${config.text} w-12 h-4 bg-[var(--color-bg-card)] rounded animate-pulse`} />
      </div>
    );
  }

  return (
    <div
      className={`
        flex items-center rounded-full bg-[var(--color-bg-elevated)]
        border border-yellow-500/30
        ${config.container} ${className}
      `}
    >
      {showIcon && (
        <img
          src="https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/playercard/coins.jpg"
          alt="Coins"
          className={`${config.icon} rounded-full object-cover`}
        />
      )}
      <span className={`${config.text} text-yellow-400`}>
        {formatCoins(balance)}
      </span>
    </div>
  );
}
