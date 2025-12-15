/**
 * Account management API functions (2FA, export, delete)
 * 
 * @module hooks/settings/accountApi
 */

import type { SettingsApiOptions } from './settingsApi'
import { API_BASE } from '../../utils/constants'

export interface TwoFactorSetupResponse {
  secret: string
  qr_code_url: string
  recovery_codes: string[]
}

export interface DataExportResponse {
  status: string
  message: string
}

export async function enable2FAApi(
  options: SettingsApiOptions
): Promise<TwoFactorSetupResponse | null> {
  options.onSavingStart()
  try {
    const response = await fetch(`${API_BASE}/auth/2fa/enable`, {
      method: 'POST',
      headers: options.getAuthHeaders(),
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to enable 2FA')
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

export async function verify2FAApi(
  code: string,
  options: SettingsApiOptions
): Promise<boolean> {
  options.onSavingStart()
  try {
    const response = await fetch(`${API_BASE}/auth/2fa/verify`, {
      method: 'POST',
      headers: options.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ code }),
    })

    if (!response.ok) {
      throw new Error('Invalid verification code')
    }

    return true
  } catch (err) {
    options.onError(err instanceof Error ? err.message : 'Unknown error')
    return false
  } finally {
    options.onSavingEnd()
  }
}

export async function disable2FAApi(
  code: string,
  options: SettingsApiOptions
): Promise<boolean> {
  options.onSavingStart()
  try {
    const response = await fetch(`${API_BASE}/auth/2fa/disable`, {
      method: 'DELETE',
      headers: options.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ code }),
    })

    if (!response.ok) {
      throw new Error('Failed to disable 2FA')
    }

    return true
  } catch (err) {
    options.onError(err instanceof Error ? err.message : 'Unknown error')
    return false
  } finally {
    options.onSavingEnd()
  }
}

export async function exportDataApi(
  options: SettingsApiOptions
): Promise<DataExportResponse | null> {
  options.onSavingStart()
  try {
    const response = await fetch(`${API_BASE}/settings/account/export`, {
      method: 'POST',
      headers: options.getAuthHeaders(),
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to request data export')
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

export async function deleteAccountApi(
  password: string,
  confirmation: string,
  options: SettingsApiOptions
): Promise<boolean> {
  options.onSavingStart()
  try {
    const response = await fetch(`${API_BASE}/settings/account`, {
      method: 'DELETE',
      headers: options.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ password, confirmation }),
    })

    if (!response.ok) {
      throw new Error('Failed to delete account')
    }

    return true
  } catch (err) {
    options.onError(err instanceof Error ? err.message : 'Unknown error')
    return false
  } finally {
    options.onSavingEnd()
  }
}
