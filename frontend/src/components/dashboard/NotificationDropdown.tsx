/**
 * NotificationDropdown - Notification panel component for dashboard header
 * 
 * Features:
 * - Groups notifications by type (friend_request, match_invite, reward, system)
 * - Mark individual/all as read
 * - Navigate to relevant page on click
 * - Focus trap and keyboard navigation
 * - Close on Escape or click outside
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.6
 */

import { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFocusTrap } from '@/hooks/useAccessibility'
import { Bell, UserPlus, Gamepad2, Gift, Info, Check, X } from 'lucide-react'
import { Z_INDEX } from '@/config/zindex'

export interface Notification {
  id: string
  type: 'friend_request' | 'match_invite' | 'reward' | 'system'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  actionUrl?: string
}

export interface NotificationGroup {
  type: Notification['type']
  label: string
  icon: React.ReactNode
  notifications: Notification[]
}

export interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDismiss?: (id: string) => void
  anchorRef?: React.RefObject<HTMLButtonElement | null>
}

const TYPE_CONFIG: Record<Notification['type'], { label: string; icon: React.ReactNode }> = {
  friend_request: { label: 'Friend Requests', icon: <UserPlus className="w-4 h-4" /> },
  match_invite: { label: 'Match Invites', icon: <Gamepad2 className="w-4 h-4" /> },
  reward: { label: 'Rewards', icon: <Gift className="w-4 h-4" /> },
  system: { label: 'System', icon: <Info className="w-4 h-4" /> },
}

const TYPE_ORDER: Notification['type'][] = ['friend_request', 'match_invite', 'reward', 'system']

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function NotificationDropdown({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
}: NotificationDropdownProps) {
  const navigate = useNavigate()
  const dropdownRef = useFocusTrap<HTMLDivElement>(isOpen, onClose)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  // Group notifications by type
  const groups: NotificationGroup[] = TYPE_ORDER
    .map(type => ({
      type,
      ...TYPE_CONFIG[type],
      notifications: notifications.filter(n => n.type === type),
    }))
    .filter(group => group.notifications.length > 0)

  const flatNotifications = groups.flatMap(g => g.notifications)
  const unreadCount = notifications.filter(n => !n.isRead).length

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        onClose()
        break
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => Math.min(prev + 1, flatNotifications.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < flatNotifications.length) {
          handleNotificationClick(flatNotifications[focusedIndex])
        }
        break
    }
  }, [flatNotifications, focusedIndex, onClose])

  // Handle notification click
  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl)
      onClose()
    }
  }, [navigate, onClose, onMarkAsRead])

  if (!isOpen) return null

  return (
    <div
      ref={dropdownRef}
      role="dialog"
      aria-label="Notifications"
      aria-modal="true"
      className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] shadow-xl"
      style={{ zIndex: Z_INDEX.tooltip }}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[var(--color-accent-primary)]" />
          <span className="font-semibold text-[var(--color-text-primary)]">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-[var(--color-accent-primary)] text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="text-xs text-[var(--color-accent-primary)] hover:text-[var(--color-accent-primary-hover)] transition-colors"
            aria-label="Mark all as read"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="overflow-y-auto max-h-72" role="list" aria-label="Notification list">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-[var(--color-text-muted)]">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.type} role="group" aria-label={group.label}>
              <div className="px-4 py-2 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider bg-[var(--color-bg-card)]/50 flex items-center gap-2">
                {group.icon}
                {group.label}
              </div>
              {group.notifications.map((notification) => {
                const globalIdx = flatNotifications.indexOf(notification)
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full px-4 py-3 text-left hover:bg-[var(--color-bg-hover)] transition-colors flex items-start gap-3 ${
                      !notification.isRead ? 'bg-[var(--color-bg-active)]' : ''
                    } ${globalIdx === focusedIndex ? 'ring-2 ring-inset ring-[var(--color-accent-primary)]' : ''}`}
                    role="listitem"
                    aria-label={`${notification.title}: ${notification.message}`}
                    tabIndex={globalIdx === focusedIndex ? 0 : -1}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium truncate ${notification.isRead ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-primary)]'}`}>
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[var(--color-accent-primary)] flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-[var(--color-text-muted)] truncate">{notification.message}</p>
                      <span className="text-xs text-[var(--color-text-disabled)]">{formatRelativeTime(notification.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onMarkAsRead(notification.id)
                          }}
                          className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)] transition-colors"
                          aria-label="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {onDismiss && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDismiss(notification.id)
                          }}
                          className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-accent-error)] transition-colors"
                          aria-label="Dismiss notification"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
