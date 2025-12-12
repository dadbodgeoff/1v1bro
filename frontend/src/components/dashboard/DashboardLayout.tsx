/**
 * DashboardLayout - 2025 Design System
 * Requirements: 5.1, 10.1, 10.3
 *
 * Main layout wrapper with:
 * - #0a0a0a base background
 * - Sidebar on left (collapsed by default on mobile, visible on desktop)
 * - Header at top with user info
 * - Main content area with max-width container (1280px)
 * - Consistent 24px padding on content area
 * - Safe area handling for notched devices
 * - Offline banner for network status
 * - Command palette for quick actions
 * - Keyboard shortcuts support
 * 
 * Mobile Optimization:
 * - Sidebar starts collapsed on mobile (< 1024px)
 * - Safe area insets for notch and home indicator
 * - Touch-optimized header controls
 */

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { DashboardHeader } from './DashboardHeader'
import { OfflineBanner } from './OfflineBanner'
import { CommandPalette } from './CommandPalette'
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal'
import { useViewport } from '@/hooks/useViewport'
import { useOfflineStatus } from '@/hooks/useOfflineStatus'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useAnalytics } from '@/hooks/useAnalytics'

export type NavItem =
  | 'play'
  | 'profile'
  | 'battlepass'
  | 'shop'
  | 'inventory'
  | 'coins'
  | 'leaderboards'
  | 'friends'
  | 'settings'

interface DashboardLayoutProps {
  children: ReactNode
  activeNav?: NavItem
}

export function DashboardLayout({ children, activeNav = 'play' }: DashboardLayoutProps) {
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  // Sidebar collapsed by default on mobile/tablet, expanded on desktop
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false)
  
  // Offline status tracking
  const { isOffline, lastOnline, wasOffline, clearWasOffline } = useOfflineStatus({
    onOnline: () => {
      // Trigger data refresh when coming back online
      window.dispatchEvent(new CustomEvent('dashboard:refresh'))
    },
  })

  // Analytics
  const { trackCommandExecuted, trackShortcutUsed } = useAnalytics({ trackOnMount: true })

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onCommandPalette: () => {
      setCommandPaletteOpen(true)
      trackShortcutUsed('cmd+k')
    },
    onFindMatch: () => {
      navigate('/matchmaking')
      trackShortcutUsed('cmd+shift+f')
    },
    onNavigate: (path) => {
      navigate(path)
      trackShortcutUsed(`navigate:${path}`)
    },
    onShowHelp: () => {
      setShortcutsModalOpen(prev => !prev)
      trackShortcutUsed('?')
    },
    onCloseModal: () => {
      if (commandPaletteOpen) setCommandPaletteOpen(false)
      else if (shortcutsModalOpen) setShortcutsModalOpen(false)
    },
  })
  
  // Auto-collapse sidebar when switching to mobile, expand on desktop
  useEffect(() => {
    setSidebarCollapsed(!isDesktop)
  }, [isDesktop])

  // Handle retry connection
  const handleRetry = useCallback(() => {
    window.dispatchEvent(new CustomEvent('dashboard:refresh'))
  }, [])

  // Handle find match from command palette
  const handleFindMatch = useCallback(() => {
    navigate('/matchmaking')
    trackCommandExecuted({ command: 'findMatch', source: 'palette' })
  }, [navigate, trackCommandExecuted])

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] flex safe-area-x">
      {/* Sidebar */}
      <Sidebar
        activeItem={activeNav}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Offline Banner */}
        <OfflineBanner
          isOffline={isOffline}
          lastOnline={lastOnline}
          wasOffline={wasOffline}
          onRetry={handleRetry}
          onDismissReconnected={clearWasOffline}
        />

        {/* Header */}
        <DashboardHeader onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

        {/* Page Content - 24px padding, 1280px max-width */}
        <main className="flex-1 overflow-auto p-6 safe-area-bottom">
          <div className="max-w-[1280px] mx-auto">{children}</div>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onFindMatch={handleFindMatch}
        onShowHelp={() => {
          setCommandPaletteOpen(false)
          setShortcutsModalOpen(true)
        }}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />
    </div>
  )
}
