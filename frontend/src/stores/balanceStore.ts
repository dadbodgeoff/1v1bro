/**
 * Balance store for coin balance state management.
 * Requirements: 5.2
 */

import { create } from 'zustand';

interface BalanceState {
  coins: number;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  
  // Actions
  setCoins: (coins: number) => void;
  addCoins: (amount: number) => void;
  subtractCoins: (amount: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useBalanceStore = create<BalanceState>((set) => ({
  coins: 0,
  loading: false,
  error: null,
  lastFetched: null,

  setCoins: (coins) => set({ 
    coins, 
    lastFetched: Date.now(),
    error: null,
  }),

  addCoins: (amount) => set((state) => ({ 
    coins: state.coins + amount,
    lastFetched: Date.now(),
  })),

  subtractCoins: (amount) => set((state) => ({ 
    coins: Math.max(0, state.coins - amount),
    lastFetched: Date.now(),
  })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  reset: () => set({ 
    coins: 0, 
    loading: false, 
    error: null,
    lastFetched: null,
  }),
}));
