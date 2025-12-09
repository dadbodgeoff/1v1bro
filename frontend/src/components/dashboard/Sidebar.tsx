/**
 * Sidebar - 2025 Design System
 * Requirements: 5.2
 *
 * Navigation sidebar with:
 * - Navigation items with icon + label
 * - Active item with indigo-500 left border and bg-white/5%
 * - Hover state with bg-white/5%
 * - Collapse to icon-only on mobile/tablet
 * - Smooth width transition (200ms)
 */

import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { NavItem } from './DashboardLayout'

interface NavItemConfig {
  id: NavItem
  label: string
  icon: string
  path: string
  badge?: number
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'play', label: 'Play', icon: '🎮', path: '/dashboard' },
  { id: 'profile', label: 'Profile', icon: '👤', path: '/profile' },
  { id: 'battlepass', label: 'Battle Pass', icon: '⭐', path: '/battlepass' },
  { id: 'shop', label: 'Shop', icon: '🛒', path: '/shop' },
  { id: 'inventory', label: 'Inventory', icon: '🎒', path: '/inventory' },
  { id: 'leaderboards', label: 'Leaderboards', icon: '🏆', path: '/leaderboards' },
  { id: 'friends', label: 'Friends', icon: '👥', path: '/friends' },
  { id: 'settings', label: 'Settings', icon: '⚙️', path: '/settings' },
]

interface SidebarProps {
  activeItem: NavItem
  isCollapsed: boolean
  onToggle: () => void
  badges?: Partial<Record<NavItem, number>>
}

export function Sidebar({ activeItem, isCollapsed, onToggle, badges = {} }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleNavClick = (item: NavItemConfig) => {
    navigate(item.path)
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 0 : 240,
          x: isCollapsed ? -240 : 0,
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`
          fixed lg:relative z-50 h-screen
          bg-[var(--color-bg-card)] border-r border-[var(--color-border-subtle)]
          flex flex-col overflow-hidden safe-area-y
          ${isCollapsed ? 'lg:w-0' : 'lg:w-60'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-[var(--color-border-subtle)]">
          <span className="text-lg font-bold text-white">1v1 Bro</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {NAV_ITEMS.map((item) => {
              const isActive = item.path === location.pathname || activeItem === item.id
              const badge = badges[item.id] || item.badge

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                      text-sm font-medium transition-all duration-200
                      ${
                        isActive
                          ? 'bg-white/5 text-white border-l-2 border-[var(--color-accent-primary)]'
                          : 'text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                      }
                    `}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {badge && badge > 0 && (
                      <span className="px-2 py-0.5 text-xs bg-[var(--color-accent-error)] text-white rounded-full">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border-subtle)]">
          <p className="text-xs text-[var(--color-text-muted)] text-center">v1.0.0</p>
        </div>
      </motion.aside>
    </>
  )
}
