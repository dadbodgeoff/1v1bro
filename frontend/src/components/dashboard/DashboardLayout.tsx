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
 * 
 * Mobile Optimization:
 * - Sidebar starts collapsed on mobile (< 1024px)
 * - Safe area insets for notch and home indicator
 * - Touch-optimized header controls
 */

import { useState, useEffect, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { DashboardHeader } from './DashboardHeader'
import { useViewport } from '@/hooks/useViewport'

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
  const { isDesktop } = useViewport()
  // Sidebar collapsed by default on mobile/tablet, expanded on desktop
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  
  // Auto-collapse sidebar when switching to mobile, expand on desktop
  useEffect(() => {
    setSidebarCollapsed(!isDesktop)
  }, [isDesktop])

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
        {/* Header */}
        <DashboardHeader onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

        {/* Page Content - 24px padding, 1280px max-width */}
        <main className="flex-1 overflow-auto p-6 safe-area-bottom">
          <div className="max-w-[1280px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
