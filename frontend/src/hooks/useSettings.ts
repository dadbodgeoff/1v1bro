/**
 * Settings hook for fetching and updating user settings.
 * Requirements: 5.2, 11.1, 11.2
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
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
} from '../types/settings'
import {
  fetchSettingsApi,
  updateNotificationsApi,
  updateAudioApi,
  updateVideoApi,
  updateAccessibilityApi,
  updateKeybindsApi,
  resetKeybindsApi,
  updatePrivacyApi,
} from './settings/settingsApi'
import {
  enable2FAApi,
  verify2FAApi,
  disable2FAApi,
  exportDataApi,
  deleteAccountApi,
  type TwoFactorSetupResponse,
  type DataExportResponse,
} from './settings/accountApi'

const DEBOUNCE_MS = 500

interface UseSettingsReturn {
  settings: UserSettings | null
  loading: boolean
  error: string | null
  saving: boolean
  fetchSettings: () => Promise<void>
  updateNotifications: (updates: NotificationPreferencesUpdate) => Promise<NotificationPreferences | null>
  updateAudio: (updates: AudioSettingsUpdate) => Promise<AudioSettings | null>
  updateVideo: (updates: VideoSettingsUpdate) => Promise<VideoSettings | null>
  updateAccessibility: (updates: AccessibilitySettingsUpdate) => Promise<AccessibilitySettings | null>
  updateKeybinds: (updates: KeybindsUpdate) => Promise<Keybinds | null>
  resetKeybinds: () => Promise<Keybinds | null>
  updatePrivacy: (updates: PrivacySettingsUpdate) => Promise<PrivacySettings | null>
  updateAudioDebounced: (updates: AudioSettingsUpdate) => void
  updateAccessibilityDebounced: (updates: AccessibilitySettingsUpdate) => void
  enable2FA: () => Promise<TwoFactorSetupResponse | null>
  verify2FA: (code: string) => Promise<boolean>
  disable2FA: (code: string) => Promise<boolean>
  exportData: () => Promise<DataExportResponse | null>
  deleteAccount: (password: string, confirmation: string) => Promise<boolean>
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  
  const token = useAuthStore((s) => s.token)
  
  const audioDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const accessibilityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const getAuthHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token])

  const apiOptions = useCallback(() => ({
    getAuthHeaders,
    onError: (err: string) => setError(err),
    onSavingStart: () => setSaving(true),
    onSavingEnd: () => setSaving(false),
  }), [getAuthHeaders])

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await fetchSettingsApi({ getAuthHeaders, onError: setError })
    setSettings(result)
    setLoading(false)
  }, [getAuthHeaders])

  const updateNotifications = useCallback(async (updates: NotificationPreferencesUpdate) => {
    const result = await updateNotificationsApi(updates, apiOptions())
    if (result) setSettings(prev => prev ? { ...prev, notifications: result } : null)
    return result
  }, [apiOptions])

  const updateAudio = useCallback(async (updates: AudioSettingsUpdate) => {
    const result = await updateAudioApi(updates, apiOptions())
    if (result) setSettings(prev => prev ? { ...prev, audio: result } : null)
    return result
  }, [apiOptions])

  const updateVideo = useCallback(async (updates: VideoSettingsUpdate) => {
    const result = await updateVideoApi(updates, apiOptions())
    if (result) setSettings(prev => prev ? { ...prev, video: result } : null)
    return result
  }, [apiOptions])

  const updateAccessibility = useCallback(async (updates: AccessibilitySettingsUpdate) => {
    const result = await updateAccessibilityApi(updates, apiOptions())
    if (result) setSettings(prev => prev ? { ...prev, accessibility: result } : null)
    return result
  }, [apiOptions])

  const updateKeybinds = useCallback(async (updates: KeybindsUpdate) => {
    const result = await updateKeybindsApi(updates, apiOptions())
    if (result) setSettings(prev => prev ? { ...prev, keybinds: result } : null)
    return result
  }, [apiOptions])

  const resetKeybinds = useCallback(async () => {
    const result = await resetKeybindsApi(apiOptions())
    if (result) setSettings(prev => prev ? { ...prev, keybinds: result } : null)
    return result
  }, [apiOptions])

  const updatePrivacy = useCallback(async (updates: PrivacySettingsUpdate) => {
    return updatePrivacyApi(updates, apiOptions())
  }, [apiOptions])

  const updateAudioDebounced = useCallback((updates: AudioSettingsUpdate) => {
    setSettings(prev => prev ? { ...prev, audio: { ...prev.audio, ...updates } } : null)
    if (audioDebounceRef.current) clearTimeout(audioDebounceRef.current)
    audioDebounceRef.current = setTimeout(() => updateAudio(updates), DEBOUNCE_MS)
  }, [updateAudio])

  const updateAccessibilityDebounced = useCallback((updates: AccessibilitySettingsUpdate) => {
    setSettings(prev => prev ? { ...prev, accessibility: { ...prev.accessibility, ...updates } } : null)
    if (accessibilityDebounceRef.current) clearTimeout(accessibilityDebounceRef.current)
    accessibilityDebounceRef.current = setTimeout(() => updateAccessibility(updates), DEBOUNCE_MS)
  }, [updateAccessibility])

  useEffect(() => {
    return () => {
      if (audioDebounceRef.current) clearTimeout(audioDebounceRef.current)
      if (accessibilityDebounceRef.current) clearTimeout(accessibilityDebounceRef.current)
    }
  }, [])

  const enable2FA = useCallback(() => enable2FAApi(apiOptions()), [apiOptions])
  const verify2FA = useCallback((code: string) => verify2FAApi(code, apiOptions()), [apiOptions])
  const disable2FA = useCallback((code: string) => disable2FAApi(code, apiOptions()), [apiOptions])
  const exportData = useCallback(() => exportDataApi(apiOptions()), [apiOptions])
  const deleteAccount = useCallback((password: string, confirmation: string) => 
    deleteAccountApi(password, confirmation, apiOptions()), [apiOptions])

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
    enable2FA,
    verify2FA,
    disable2FA,
    exportData,
    deleteAccount,
  }
}
