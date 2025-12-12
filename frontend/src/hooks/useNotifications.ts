/**
 * useNotifications - Hook for managing user notifications
 * 
 * Features:
 * - Fetch notifications with pagination
 * - Real-time updates via WebSocket
 * - Mark as read (individual and all)
 * - Delete notifications
 * - Unread count tracking
 * 
 * @module hooks/useNotifications
 */

import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

const API_BASE = import.meta.env.VITE_API_URL || ''

export type NotificationType = 'friend_request' | 'match_invite' | 'reward' | 'system'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  action_url?: string
  metadata?: Record<string, unknown>
  is_read: boolean
  created_at: string
  read_at?: string
}

interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  total: number
  isLoading: boolean
  error: string | null
}

interface UseNotificationsReturn extends NotificationsState {
  fetchNotifications: (options?: { unreadOnly?: boolean; limit?: number; offset?: number }) => Promise<void>
  fetchUnreadCount: () => Promise<number>
  markAsRead: (notificationIds: string[]) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useNotifications(): UseNotificationsReturn {
  const { token } = useAuthStore()
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    unreadCount: 0,
    total: 0,
    isLoading: false,
    error: null,
  })

  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }, [token])

  const fetchNotifications = useCallback(async (options?: {
    unreadOnly?: boolean
    limit?: number
    offset?: number
  }) => {
    if (!token) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const params = new URLSearchParams()
      if (options?.unreadOnly) params.set('unread_only', 'true')
      if (options?.limit) params.set('limit', String(options.limit))
      if (options?.offset) params.set('offset', String(options.offset))

      const response = await fetch(
        `${API_BASE}/api/v1/notifications?${params.toString()}`,
        { headers: getAuthHeaders() }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        notifications: data.notifications || [],
        unreadCount: data.unread_count || 0,
        total: data.total || 0,
        isLoading: false,
      }))
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }))
    }
  }, [token, getAuthHeaders])

  const fetchUnreadCount = useCallback(async (): Promise<number> => {
    if (!token) return 0

    try {
      const response = await fetch(
        `${API_BASE}/api/v1/notifications/count`,
        { headers: getAuthHeaders() }
      )

      if (!response.ok) return state.unreadCount

      const data = await response.json()
      const count = data.unread_count || 0
      
      setState(prev => ({ ...prev, unreadCount: count }))
      return count
    } catch {
      return state.unreadCount
    }
  }, [token, getAuthHeaders, state.unreadCount])

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    if (!token || notificationIds.length === 0) return

    try {
      const response = await fetch(`${API_BASE}/api/v1/notifications/read`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ notification_ids: notificationIds }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read')
      }

      // Update local state
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n =>
          notificationIds.includes(n.id) ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - notificationIds.filter(id => 
          prev.notifications.find(n => n.id === id && !n.is_read)
        ).length),
      }))
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }, [token, getAuthHeaders])

  const markAllAsRead = useCallback(async () => {
    if (!token) return

    try {
      const response = await fetch(`${API_BASE}/api/v1/notifications/read-all`, {
        method: 'POST',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to mark all as read')
      }

      // Update local state
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({
          ...n,
          is_read: true,
          read_at: n.read_at || new Date().toISOString(),
        })),
        unreadCount: 0,
      }))
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }, [token, getAuthHeaders])

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!token) return

    try {
      const response = await fetch(`${API_BASE}/api/v1/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to delete notification')
      }

      // Update local state
      setState(prev => {
        const notification = prev.notifications.find(n => n.id === notificationId)
        return {
          ...prev,
          notifications: prev.notifications.filter(n => n.id !== notificationId),
          unreadCount: notification && !notification.is_read 
            ? Math.max(0, prev.unreadCount - 1) 
            : prev.unreadCount,
          total: Math.max(0, prev.total - 1),
        }
      })
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }, [token, getAuthHeaders])

  const refresh = useCallback(async () => {
    await fetchNotifications()
  }, [fetchNotifications])

  // Handle real-time notification updates via WebSocket
  useEffect(() => {
    // Import wsService dynamically to avoid circular deps
    import('@/services/websocket').then(({ wsService }) => {
      const handleNotification = (payload: unknown) => {
        const notification = payload as Notification
        setState(prev => ({
          ...prev,
          notifications: [notification, ...prev.notifications],
          unreadCount: prev.unreadCount + 1,
          total: prev.total + 1,
        }))
      }

      const unsub = wsService.on('notification', handleNotification)
      return () => unsub()
    })
  }, [])

  // Fetch initial data
  useEffect(() => {
    if (token) {
      fetchNotifications()
    }
  }, [token, fetchNotifications])

  return {
    ...state,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  }
}

export default useNotifications
