/**
 * DashboardLayout - 2025 Design System
 * Requirements: 5.1
 *
 * Main layout wrapper with:
 * - #0a0a0a base background
 * - Sidebar on left (collapsible on mobile)
 * - Header at top with user info
 * - Main content area with max-width container (1280px)
 * - Consistent 24px padding on content area
 */

import { useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { DashboardHeader } from './DashboardHeader'

export type NavItem =
  | 'play'
  | 'profile'
  | 'battlepass'
  | 'shop'
  | 'inventory'
  | 'leaderboards'
  | 'friends'
  | 'settings'

interface DashboardLayoutProps {
  children: ReactNode
  activeNav?: NavItem
}

export function DashboardLayout({ children, activeNav = 'play' }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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
