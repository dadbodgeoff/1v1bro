/**
 * useKeyboardShortcuts - Global keyboard shortcut handling for dashboard
 * 
 * Features:
 * - Register global keyboard shortcuts
 * - Handle Cmd/Ctrl+K for command palette
 * - Handle Cmd/Ctrl+Shift+F for Find Match
 * - Handle Cmd/Ctrl+P for Profile navigation
 * - Handle ? for help modal
 * - Prevent conflicts with browser shortcuts
 * 
 * Requirements: 9.1, 9.4, 9.5, 9.6
 */

import { useEffect, useCallback, useRef } from 'react'

export interface KeyboardShortcut {
  key: string
  modifiers: ('cmd' | 'ctrl' | 'shift' | 'alt')[]
  action: string
  description: string
  category: 'navigation' | 'action' | 'general'
  handler: () => void
}

export const DASHBOARD_SHORTCUTS: Omit<KeyboardShortcut, 'handler'>[] = [
  { key: 'k', modifiers: ['cmd'], action: 'openCommandPalette', description: 'Open command palette', category: 'general' },
  { key: 'f', modifiers: ['cmd', 'shift'], action: 'findMatch', description: 'Find Match', category: 'action' },
  { key: 'p', modifiers: ['cmd'], action: 'goToProfile', description: 'Go to Profile', category: 'navigation' },
  { key: 'b', modifiers: ['cmd'], action: 'goToBattlePass', description: 'Go to Battle Pass', category: 'navigation' },
  { key: 's', modifiers: ['cmd', 'shift'], action: 'goToShop', description: 'Go to Shop', category: 'navigation' },
  { key: 'i', modifiers: ['cmd'], action: 'goToInventory', description: 'Go to Inventory', category: 'navigation' },
  { key: 'h', modifiers: ['cmd'], action: 'goToHome', description: 'Go to Dashboard', category: 'navigation' },
  { key: '?', modifiers: [], action: 'showHelp', description: 'Show keyboard shortcuts', category: 'general' },
  { key: 'Escape', modifiers: [], action: 'closeModal', description: 'Close modal/palette', category: 'general' },
]

interface UseKeyboardShortcutsOptions {
  onCommandPalette?: () => void
  onFindMatch?: () => void
  onNavigate?: (path: string) => void
  onShowHelp?: () => void
  onCloseModal?: () => void
  enabled?: boolean
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const optionsRef = useRef(options)
  optionsRef.current = options

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip if disabled
    if (optionsRef.current.enabled === false) return

    // Skip if typing in input/textarea
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow Escape in inputs
      if (e.key !== 'Escape') return
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const cmdKey = isMac ? e.metaKey : e.ctrlKey
    const key = e.key.toLowerCase()

    // Command palette: Cmd/Ctrl+K
    if (cmdKey && !e.shiftKey && key === 'k') {
      e.preventDefault()
      optionsRef.current.onCommandPalette?.()
      return
    }

    // Find Match: Cmd/Ctrl+Shift+F
    if (cmdKey && e.shiftKey && key === 'f') {
      e.preventDefault()
      optionsRef.current.onFindMatch?.()
      return
    }

    // Profile: Cmd/Ctrl+P
    if (cmdKey && !e.shiftKey && key === 'p') {
      e.preventDefault()
      optionsRef.current.onNavigate?.('/profile')
      return
    }

    // Battle Pass: Cmd/Ctrl+B
    if (cmdKey && !e.shiftKey && key === 'b') {
      e.preventDefault()
      optionsRef.current.onNavigate?.('/battlepass')
      return
    }

    // Shop: Cmd/Ctrl+Shift+S
    if (cmdKey && e.shiftKey && key === 's') {
      e.preventDefault()
      optionsRef.current.onNavigate?.('/shop')
      return
    }

    // Inventory: Cmd/Ctrl+I
    if (cmdKey && !e.shiftKey && key === 'i') {
      e.preventDefault()
      optionsRef.current.onNavigate?.('/inventory')
      return
    }

    // Home: Cmd/Ctrl+H
    if (cmdKey && !e.shiftKey && key === 'h') {
      e.preventDefault()
      optionsRef.current.onNavigate?.('/dashboard')
      return
    }

    // Help: ?
    if (!cmdKey && !e.shiftKey && e.key === '?') {
      e.preventDefault()
      optionsRef.current.onShowHelp?.()
      return
    }

    // Close modal: Escape
    if (e.key === 'Escape') {
      optionsRef.current.onCloseModal?.()
      return
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return {
    shortcuts: DASHBOARD_SHORTCUTS,
  }
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: Omit<KeyboardShortcut, 'handler'>): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const parts: string[] = []

  if (shortcut.modifiers.includes('cmd') || shortcut.modifiers.includes('ctrl')) {
    parts.push(isMac ? '⌘' : 'Ctrl')
  }
  if (shortcut.modifiers.includes('shift')) {
    parts.push(isMac ? '⇧' : 'Shift')
  }
  if (shortcut.modifiers.includes('alt')) {
    parts.push(isMac ? '⌥' : 'Alt')
  }

  const key = shortcut.key === 'Escape' ? 'Esc' : shortcut.key.toUpperCase()
  parts.push(key)

  return parts.join(isMac ? '' : '+')
}
