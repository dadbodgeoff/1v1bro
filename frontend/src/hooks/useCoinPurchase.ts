/**
 * Hook for coin purchase flow.
 * Requirements: 1.4, 2.2, 3.2
 */

import { useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import type {
  CoinPackage,
  CheckoutResponse,
  PurchaseVerifyResponse,
} from '../types/coin';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface UseCoinPurchaseReturn {
  packages: CoinPackage[];
  loading: boolean;
  error: string | null;
  purchaseLoading: string | null; // Package ID being purchased
  fetchPackages: () => Promise<void>;
  purchasePackage: (packageId: string) => Promise<void>;
  verifyPurchase: (sessionId: string) => Promise<PurchaseVerifyResponse | null>;
  clearError: () => void;
}

export function useCoinPurchase(): UseCoinPurchaseReturn {
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = useAuthStore((s) => s.token);

  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, [token]);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Fetch available coin packages.
   * Requirements: 1.4
   */
  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/coins/packages`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch packages');
      }

      const data = await response.json();
      const packagesData = data.data?.packages || data.packages || [];
      setPackages(packagesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  /**
   * Create checkout session and redirect to Stripe.
   * Requirements: 2.2
   */
  const purchasePackage = useCallback(async (packageId: string) => {
    setPurchaseLoading(packageId);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/coins/checkout`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ package_id: packageId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to create checkout');
      }

      const data = await response.json();
      const checkout: CheckoutResponse = data.data || data;

      // Redirect to Stripe Checkout
      if (checkout.checkout_url) {
        window.location.href = checkout.checkout_url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPurchaseLoading(null);
    }
    // Note: Don't clear purchaseLoading on success since we're redirecting
  }, [getAuthHeaders]);

  /**
   * Verify purchase completion after Stripe redirect.
   * Requirements: 3.2
   */
  const verifyPurchase = useCallback(async (sessionId: string): Promise<PurchaseVerifyResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/coins/verify?session_id=${encodeURIComponent(sessionId)}`,
        {
          headers: getAuthHeaders(),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to verify purchase');
      }

      const data = await response.json();
      return data.data || data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  return {
    packages,
    loading,
    error,
    purchaseLoading,
    fetchPackages,
    purchasePackage,
    verifyPurchase,
    clearError,
  };
}
