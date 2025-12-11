/**
 * Settings API functions
 * 
 * @module hooks/settings/settingsApi
 */

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
} from '../../types/settings'
import { getDefaultSettings } from '../../types/settings'

const API_BASE = import.meta.env.VITE_API_URL || ''

export interface SettingsApiOptions {
  getAuthHeaders: () => Record<string, string>
  onError: (error: string) => void
  onSavingStart: () => void
  onSavingEnd: () => void
}

export async function fetchSettingsApi(
  options: Pick<SettingsApiOptions, 'getAuthHeaders' | 'onError'>
): Promise<UserSettings | null> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/settings/me`, {
      headers: options.getAuthHeaders(),
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch settings')
    }

    const data = await response.json()
    return data.data || data
  } catch (err) {
    options.onError(err instanceof Error ? err.message : 'Unknown error')
    const defaults = getDefaultSettings()
    return { user_id: '', ...defaults }
  }
}

export async function updateNotificationsApi(
  updates: NotificationPreferencesUpdate,
  options: SettingsApiOptions
): Promise<NotificationPreferences | null> {
  options.onSavingStart()
  try {
    const response = await fetch(`${API_BASE}/api/v1/settings/notifications`, {
      method: 'PUT',
      headers: options.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error('Failed to update notification settings')
    }

    const data = await response.json()
    return data.data || data
  } catch (err) {
    options.onError(err instanceof Error ? err.message : 'Unknown error')
    return null
  } finally {
    options.onSavingEnd()
  }
}

export async function updateAudioApi(
  updates: AudioSettingsUpdate,
  options: SettingsApiOptions
): Promise<AudioSettings | null> {
  options.onSavingStart()
  try {
    const response = await fetch(`${API_BASE}/api/v1/settings/audio`, {
      method: 'PUT',
      headers: options.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error('Failed to update audio settings')
    }

    const data = await response.json()
    return data.data || data
  } catch (err) {
    options.onError(err instanceof Error ? err.message : 'Unknown error')
    return null
  } finally {
    options.onSavingEnd()
  }
}

export async function updateVideoApi(
  updates: VideoSettingsUpdate,
  options: SettingsApiOptions
): Promise<VideoSettings | null> {
  options.onSavingStart()
  try {
    const response = await fetch(`${API_BASE}/api/v1/settings/video`, {
      method: 'PUT',
      headers: options.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error('Failed to update video settings')
    }

    const data = await response.json()
    return data.data || data
  } catch (err) {
    options.onError(err instanceof Error ? err.message : 'Unknown error')
    return null
  } finally {
    options.onSavingEnd()
  }
}

export async function updateAccessibilityApi(
  updates: AccessibilitySettingsUpdate,
  options: SettingsApiOptions
): Promise<AccessibilitySettings | null> {
  options.onSavingStart()
  try {
    const response = await fetch(`${API_BASE}/api/v1/settings/accessibility`, {
      method: 'PUT',
      headers: options.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error('Failed to update accessibility settings')
    }

    const data = await response.json()
    return data.data || data
  } catch (err) {
    options.onError(err instanceof Error ? err.message : 'Unknown error')
    return null
  } finally {
    options.onSavingEnd()
  }
}

export async function updateKeybindsApi(
  updates: KeybindsUpdate,
  options: SettingsApiOptions
): Promise<Keybinds | null> {
  options.onSavingStart()
  try {
    const response = await fetch(`${API_BASE}/api/v1/settings/keybinds`, {
      method: 'PUT',
      headers: options.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error('Failed to update keybinds')
    }

    const data = await response.json()
    return data.data || data
  } catch (err) {
    options.onError(err instanceof Error ? err.message : 'Unknown error')
    return null
  } finally {
    options.onSavingEnd()
  }
}

export async function resetKeybindsApi(
  options: SettingsApiOptions
): Promise<Keybinds | null> {
  options.onSavingStart()
  try {
    const response = await fetch(`${API_BASE}/api/v1/settings/keybinds/reset`, {
      method: 'POST',
      headers: options.getAuthHeaders(),
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to reset keybinds')
    }

    const data = await response.json()
    return data.data || data
  } catch (err) {
    options.onError(err instanceof Error ? err.message : 'Unknown error')
    return null
  } finally {
    options.onSavingEnd()
  }
}

export async function updatePrivacyApi(
  updates: PrivacySettingsUpdate,
  options: SettingsApiOptions
): Promise<PrivacySettings | null> {
  options.onSavingStart()
  try {
    const response = await fetch(`${API_BASE}/api/v1/settings/privacy`, {
      method: 'PUT',
      headers: options.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error('Failed to update privacy settings')
    }

    const data = await response.json()
    return data.data || data
  } catch (err) {
    options.onError(err instanceof Error ? err.message : 'Unknown error')
    return null
  } finally {
    options.onSavingEnd()
  }
}
