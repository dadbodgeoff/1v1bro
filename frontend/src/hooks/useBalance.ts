/**
 * Hook for coin balance management.
 * Requirements: 5.1, 5.2
 */

import { useCallback, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useBalanceStore } from '../stores/balanceStore';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Cache duration in milliseconds (30 seconds)
const CACHE_DURATION = 30000;

interface UseBalanceReturn {
  coins: number;
  loading: boolean;
  error: string | null;
  fetchBalance: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  addCoins: (amount: number) => void;
  subtractCoins: (amount: number) => void;
}

export function useBalance(): UseBalanceReturn {
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  
  const {
    coins,
    loading,
    error,
    lastFetched,
    setCoins,
    addCoins,
    subtractCoins,
    setLoading,
    setError,
  } = useBalanceStore();

  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, [token]);

  /**
   * Fetch balance from API.
   * Requirements: 5.1
   */
  const fetchBalance = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    // Check cache
    if (lastFetched && Date.now() - lastFetched < CACHE_DURATION) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/v1/coins/balance`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json();
      const balance = data.data?.coins ?? data.coins ?? 0;
      setCoins(balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, lastFetched, getAuthHeaders, setCoins, setLoading, setError]);

  /**
   * Force refresh balance (bypass cache).
   * Requirements: 5.2
   */
  const refreshBalance = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/v1/coins/balance`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json();
      const balance = data.data?.coins ?? data.coins ?? 0;
      setCoins(balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getAuthHeaders, setCoins, setLoading, setError]);

  // Fetch balance on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && !lastFetched) {
      fetchBalance();
    }
  }, [isAuthenticated, lastFetched, fetchBalance]);

  return {
    coins,
    loading,
    error,
    fetchBalance,
    refreshBalance,
    addCoins,
    subtractCoins,
  };
}
