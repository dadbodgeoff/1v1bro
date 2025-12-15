/**
 * Profile hook for fetching and updating user profiles.
 * Requirements: 2.1-2.6
 * 
 * Features:
 * - Exponential backoff retry for network failures
 * - Profile CRUD operations
 * - Avatar/banner upload with signed URLs
 */

import { useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import type { Profile, ProfileUpdate, PrivacySettingsUpdate, SignedUploadUrl } from '../types/profile';
import { API_BASE } from '../utils/constants';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/**
 * Exponential backoff delay calculation
 */
function getRetryDelay(attempt: number): number {
  return Math.min(BASE_DELAY_MS * Math.pow(2, attempt), 10000);
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  retryCount: number;
  fetchProfile: (userId?: string) => Promise<void>;
  updateProfile: (updates: ProfileUpdate) => Promise<void>;
  updatePrivacySettings: (settings: PrivacySettingsUpdate) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  uploadBanner: (file: File) => Promise<void>;
  retry: () => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const lastFetchUserId = useRef<string | undefined>(undefined);

  // Get token from auth store
  const token = useAuthStore((s) => s.token);

  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, [token]);

  /**
   * Fetch with exponential backoff retry
   */
  const fetchWithRetry = useCallback(async (
    endpoint: string,
    attempt: number = 0
  ): Promise<Response> => {
    const response = await fetch(endpoint, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    // Retry on 5xx errors
    if (response.status >= 500 && attempt < MAX_RETRIES) {
      await sleep(getRetryDelay(attempt));
      return fetchWithRetry(endpoint, attempt + 1);
    }

    return response;
  }, [getAuthHeaders]);

  const fetchProfile = useCallback(async (userId?: string) => {
    setLoading(true);
    setError(null);
    lastFetchUserId.current = userId;

    try {
      const endpoint = userId 
        ? `${API_BASE}/profiles/${userId}`
        : `${API_BASE}/profiles/me`;
      
      const response = await fetchWithRetry(endpoint);

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      // Handle API response wrapper
      setProfile(data.data || data);
      setRetryCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  }, [fetchWithRetry]);

  const retry = useCallback(async () => {
    await fetchProfile(lastFetchUserId.current);
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: ProfileUpdate) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/profiles/me`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to update profile');
      }

      const data = await response.json();
      // Handle API response wrapper
      setProfile(data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const updatePrivacySettings = useCallback(async (settings: PrivacySettingsUpdate) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/profiles/me/privacy`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update privacy settings');
      }

      // Refresh profile to get updated settings
      await fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, fetchProfile]);

  const uploadAvatar = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get signed upload URL
      const urlResponse = await fetch(`${API_BASE}/profiles/me/avatar/upload-url?content_type=${encodeURIComponent(file.type)}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const urlData = await urlResponse.json();
      // Handle API response wrapper
      const { upload_url, storage_path }: SignedUploadUrl = urlData.data || urlData;

      // 2. Upload file to signed URL
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // 3. Confirm upload
      const confirmResponse = await fetch(`${API_BASE}/profiles/me/avatar/confirm`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ storage_path }),
      });

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm upload');
      }

      // Refresh profile to get new avatar URL
      await fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, fetchProfile]);

  const uploadBanner = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get signed upload URL
      const urlResponse = await fetch(`${API_BASE}/profiles/me/banner/upload-url?content_type=${encodeURIComponent(file.type)}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const urlData = await urlResponse.json();
      // Handle API response wrapper
      const { upload_url, storage_path }: SignedUploadUrl = urlData.data || urlData;

      // 2. Upload file to signed URL
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // 3. Confirm upload
      const confirmResponse = await fetch(`${API_BASE}/profiles/me/banner/confirm`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ storage_path }),
      });

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm upload');
      }

      // Refresh profile to get new banner URL
      await fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, fetchProfile]);

  return {
    profile,
    loading,
    error,
    retryCount,
    fetchProfile,
    updateProfile,
    updatePrivacySettings,
    uploadAvatar,
    uploadBanner,
    retry,
  };
}
