/**
 * Settings hook for fetching and updating user settings.
 * Requirements: 5.2, 11.1, 11.2
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import type {
  UserSettings,
  NotificationPreferencesUpdate,
  AudioSettingsUpdate,
  VideoSettingsUpdate,
  AccessibilitySettingsUpdate,
  KeybindsUpdate,
  PrivacySettingsUpdate,
  NotificationPreferences,
  AudioSettings,
  VideoSettings,
  AccessibilitySettings,
  Keybinds,
  PrivacySettings,
} from '../types/settings';
import { getDefaultSettings } from '../types/settings';

const API_BASE = import.meta.env.VITE_API_URL || '';
const DEBOUNCE_MS = 500;

interface TwoFactorSetupResponse {
  secret: string;
  qr_code_url: string;
  recovery_codes: string[];
}

interface DataExportResponse {
  status: string;
  message: string;
}

interface UseSettingsReturn {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  fetchSettings: () => Promise<void>;
  updateNotifications: (updates: NotificationPreferencesUpdate) => Promise<NotificationPreferences | null>;
  updateAudio: (updates: AudioSettingsUpdate) => Promise<AudioSettings | null>;
  updateVideo: (updates: VideoSettingsUpdate) => Promise<VideoSettings | null>;
  updateAccessibility: (updates: AccessibilitySettingsUpdate) => Promise<AccessibilitySettings | null>;
  updateKeybinds: (updates: KeybindsUpdate) => Promise<Keybinds | null>;
  resetKeybinds: () => Promise<Keybinds | null>;
  updatePrivacy: (updates: PrivacySettingsUpdate) => Promise<PrivacySettings | null>;
  // Debounced versions for sliders
  updateAudioDebounced: (updates: AudioSettingsUpdate) => void;
  updateAccessibilityDebounced: (updates: AccessibilitySettingsUpdate) => void;
  // 2FA
  enable2FA: () => Promise<TwoFactorSetupResponse | null>;
  verify2FA: (code: string) => Promise<boolean>;
  disable2FA: (code: string) => Promise<boolean>;
  // Account management
  exportData: () => Promise<DataExportResponse | null>;
  deleteAccount: (password: string, confirmation: string) => Promise<boolean>;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const token = useAuthStore((s) => s.token);
  
  // Debounce timers
  const audioDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accessibilityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, [token]);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/settings/me`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings(data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Use defaults on error
      const defaults = getDefaultSettings();
      setSettings({ user_id: '', ...defaults });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const updateNotifications = useCallback(async (
    updates: NotificationPreferencesUpdate
  ): Promise<NotificationPreferences | null> => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/settings/notifications`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update notification settings');
      }

      const data = await response.json();
      const result = data.data || data;
      
      // Update local state
      setSettings(prev => prev ? { ...prev, notifications: result } : null);
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setSaving(false);
    }
  }, [getAuthHeaders]);

  const updateAudio = useCallback(async (
    updates: AudioSettingsUpdate
  ): Promise<AudioSettings | null> => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/settings/audio`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update audio settings');
      }

      const data = await response.json();
      const result = data.data || data;
      
      setSettings(prev => prev ? { ...prev, audio: result } : null);
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setSaving(false);
    }
  }, [getAuthHeaders]);

  const updateVideo = useCallback(async (
    updates: VideoSettingsUpdate
  ): Promise<VideoSettings | null> => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/settings/video`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update video settings');
      }

      const data = await response.json();
      const result = data.data || data;
      
      setSettings(prev => prev ? { ...prev, video: result } : null);
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setSaving(false);
    }
  }, [getAuthHeaders]);

  const updateAccessibility = useCallback(async (
    updates: AccessibilitySettingsUpdate
  ): Promise<AccessibilitySettings | null> => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/settings/accessibility`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update accessibility settings');
      }

      const data = await response.json();
      const result = data.data || data;
      
      setSettings(prev => prev ? { ...prev, accessibility: result } : null);
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setSaving(false);
    }
  }, [getAuthHeaders]);

  const updateKeybinds = useCallback(async (
    updates: KeybindsUpdate
  ): Promise<Keybinds | null> => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/settings/keybinds`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update keybinds');
      }

      const data = await response.json();
      const result = data.data || data;
      
      setSettings(prev => prev ? { ...prev, keybinds: result } : null);
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setSaving(false);
    }
  }, [getAuthHeaders]);

  const resetKeybinds = useCallback(async (): Promise<Keybinds | null> => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/settings/keybinds/reset`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to reset keybinds');
      }

      const data = await response.json();
      const result = data.data || data;
      
      setSettings(prev => prev ? { ...prev, keybinds: result } : null);
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setSaving(false);
    }
  }, [getAuthHeaders]);

  const updatePrivacy = useCallback(async (
    updates: PrivacySettingsUpdate
  ): Promise<PrivacySettings | null> => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/settings/privacy`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update privacy settings');
      }

      const data = await response.json();
      return data.data || data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setSaving(false);
    }
  }, [getAuthHeaders]);

  // Debounced update for audio sliders
  const updateAudioDebounced = useCallback((updates: AudioSettingsUpdate) => {
    // Update local state immediately for responsiveness
    setSettings(prev => {
      if (!prev) return null;
      return {
        ...prev,
        audio: { ...prev.audio, ...updates },
      };
    });
    
    // Debounce the API call
    if (audioDebounceRef.current) {
      clearTimeout(audioDebounceRef.current);
    }
    audioDebounceRef.current = setTimeout(() => {
      updateAudio(updates);
    }, DEBOUNCE_MS);
  }, [updateAudio]);

  // Debounced update for accessibility sliders
  const updateAccessibilityDebounced = useCallback((updates: AccessibilitySettingsUpdate) => {
    setSettings(prev => {
      if (!prev) return null;
      return {
        ...prev,
        accessibility: { ...prev.accessibility, ...updates },
      };
    });
    
    if (accessibilityDebounceRef.current) {
      clearTimeout(accessibilityDebounceRef.current);
    }
    accessibilityDebounceRef.current = setTimeout(() => {
      updateAccessibility(updates);
    }, DEBOUNCE_MS);
  }, [updateAccessibility]);

  // Cleanup debounce timers
  useEffect(() => {
    return () => {
      if (audioDebounceRef.current) clearTimeout(audioDebounceRef.current);
      if (accessibilityDebounceRef.current) clearTimeout(accessibilityDebounceRef.current);
    };
  }, []);

  // ============================================
  // 2FA Functions
  // ============================================
  
  const enable2FA = useCallback(async (): Promise<{ secret: string; qr_code_url: string; recovery_codes: string[] } | null> => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/2fa/enable`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to enable 2FA');
      }

      const data = await response.json();
      return data.data || data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setSaving(false);
    }
  }, [getAuthHeaders]);

  const verify2FA = useCallback(async (code: string): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/2fa/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setSaving(false);
    }
  }, [getAuthHeaders]);

  const disable2FA = useCallback(async (code: string): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/2fa/disable`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Failed to disable 2FA');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setSaving(false);
    }
  }, [getAuthHeaders]);

  // ============================================
  // Account Management Functions
  // ============================================

  const exportData = useCallback(async (): Promise<{ status: string; message: string } | null> => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/settings/account/export`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to request data export');
      }

      const data = await response.json();
      return data.data || data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setSaving(false);
    }
  }, [getAuthHeaders]);

  const deleteAccount = useCallback(async (password: string, confirmation: string): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/settings/account`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ password, confirmation }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setSaving(false);
    }
  }, [getAuthHeaders]);

  return {
    settings,
    loading,
    error,
    saving,
    fetchSettings,
    updateNotifications,
    updateAudio,
    updateVideo,
    updateAccessibility,
    updateKeybinds,
    resetKeybinds,
    updatePrivacy,
    updateAudioDebounced,
    updateAccessibilityDebounced,
    // 2FA
    enable2FA,
    verify2FA,
    disable2FA,
    // Account management
    exportData,
    deleteAccount,
  };
}
