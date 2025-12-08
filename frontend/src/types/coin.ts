/**
 * Coin purchase system types.
 * Requirements: 1.1, 4.1
 */

/**
 * A purchasable coin package.
 */
export interface CoinPackage {
  id: string;
  name: string;
  price_cents: number;
  base_coins: number;
  bonus_coins: number;
  total_coins: number;
  bonus_percent: number;
  badge?: string;
  sort_order: number;
  is_active: boolean;
  stripe_price_id?: string;
}

/**
 * Transaction type.
 */
export type TransactionType = 'credit' | 'debit';

/**
 * A coin transaction record.
 */
export interface CoinTransaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  source: string;
  package_id?: string;
  stripe_session_id?: string;
  stripe_payment_intent?: string;
  amount_cents?: number;
  balance_after: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * User's coin balance.
 */
export interface UserBalance {
  user_id: string;
  coins: number;
  lifetime_purchased: number;
  lifetime_spent: number;
  updated_at?: string;
}

/**
 * Balance response from API.
 */
export interface BalanceResponse {
  coins: number;
}

/**
 * Paginated transaction list response.
 */
export interface TransactionListResponse {
  items: CoinTransaction[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * Checkout session response.
 */
export interface CheckoutResponse {
  session_id: string;
  checkout_url: string;
}

/**
 * Purchase verification response.
 */
export interface PurchaseVerifyResponse {
  success: boolean;
  coins_credited: number;
  new_balance: number;
  message?: string;
  already_fulfilled: boolean;
}

/**
 * Format price in cents to display string.
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Format coin amount with commas.
 */
export function formatCoins(coins: number): string {
  return coins.toLocaleString();
}

/**
 * Get source display name.
 */
export function getSourceDisplayName(source: string): string {
  const names: Record<string, string> = {
    stripe_purchase: 'Purchase',
    cosmetic_purchase: 'Shop Purchase',
    battlepass: 'Battle Pass',
    refund: 'Refund',
    admin: 'Admin',
  };
  return names[source] || source;
}
