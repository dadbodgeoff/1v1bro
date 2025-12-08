/**
 * Battle Pass hook for season progression management.
 * Requirements: 4.1-4.9
 */

import { useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import type { Season, BattlePassTier, PlayerBattlePass } from '../types/battlepass';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface UseBattlePassReturn {
  season: Season | null;
  tiers: BattlePassTier[];
  progress: PlayerBattlePass | null;
  loading: boolean;
  error: string | null;
  fetchSeason: () => Promise<void>;
  fetchProgress: () => Promise<void>;
  fetchTiers: (seasonId?: string) => Promise<void>;
  claimReward: (tier: number, isPremium: boolean) => Promise<boolean>;
  purchasePremium: () => Promise<boolean>;
}

export function useBattlePass(): UseBattlePassReturn {
  const [season, setSeason] = useState<Season | null>(null);
  const [tiers, setTiers] = useState<BattlePassTier[]>([]);
  const [progress, setProgress] = useState<PlayerBattlePass | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get token from auth store
  const token = useAuthStore((s) => s.token);

  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, [token]);

  const fetchSeason = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use public endpoint - no auth required for viewing season info
      const response = await fetch(`${API_BASE}/api/v1/battlepass/public/current`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        // 404 is expected if no active season
        if (response.status === 404) {
          setSeason(null);
          return;
        }
        throw new Error('Failed to fetch season');
      }
      
      const data = await response.json();
      // Handle API response wrapper
      setSeason(data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fixed: endpoint path was /api/v1/me/battlepass, backend router is /api/v1/battlepass/me
      const response = await fetch(`${API_BASE}/api/v1/battlepass/me`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch progress');
      
      const data = await response.json();
      // Handle APIResponse wrapper - extract data field
      setProgress(data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const fetchTiers = useCallback(async (seasonId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const id = seasonId || season?.id;
      if (!id) {
        setTiers([]);
        return;
      }
      // Use public endpoint - no auth required for viewing tier rewards
      const response = await fetch(`${API_BASE}/api/v1/battlepass/public/tiers/${id}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setTiers([]);
          return;
        }
        throw new Error('Failed to fetch tiers');
      }
      
      const data = await response.json();
      // Handle API response wrapper
      const tiersData = data.data || data;
      setTiers(tiersData.tiers || tiersData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [season?.id]);

  const claimReward = useCallback(async (tier: number, isPremium: boolean): Promise<boolean> => {
    setError(null);
    try {
      // Fixed: endpoint is /battlepass/me/claim-reward not /me/battlepass/claim-reward
      const response = await fetch(`${API_BASE}/api/v1/battlepass/me/claim-reward`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ tier, is_premium: isPremium }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to claim reward');
      }

      // Refresh progress after claiming
      await fetchProgress();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [getAuthHeaders, fetchProgress]);

  const purchasePremium = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      // Fixed: endpoint is /battlepass/me/purchase-premium not /me/battlepass/purchase-premium
      const response = await fetch(`${API_BASE}/api/v1/battlepass/me/purchase-premium`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        
        // Handle insufficient funds (402 Payment Required)
        if (response.status === 402) {
          const detail = data.detail;
          const message = typeof detail === 'object' 
            ? `Insufficient coins: have ${detail.current_balance}, need ${detail.required}`
            : 'Insufficient coin balance';
          throw new Error(message);
        }
        
        throw new Error(data.detail || 'Failed to purchase premium');
      }

      // Refresh progress after purchase
      await fetchProgress();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [getAuthHeaders, fetchProgress]);

  return {
    season,
    tiers,
    progress,
    loading,
    error,
    fetchSeason,
    fetchProgress,
    fetchTiers,
    claimReward,
    purchasePremium,
  };
}
