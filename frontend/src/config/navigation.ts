/**
 * Navigation Configuration
 * 
 * Centralized navigation items for enterprise configurability.
 * Allows enabling/disabling items, reordering, and role-based visibility.
 * 
 * @module config/navigation
 */

export type NavItemId = 
  | 'play' 
  | 'profile' 
  | 'battlepass' 
  | 'shop' 
  | 'inventory' 
  | 'coins' 
  | 'leaderboards' 
  | 'friends' 
  | 'achievements'
  | 'settings'

export interface NavItemConfig {
  id: NavItemId
  label: string
  icon: string
  path: string
  /** Optional badge count */
  badge?: number
  /** Whether this item is enabled (default: true) */
  enabled?: boolean
  /** Required user roles to see this item */
  requiredRoles?: string[]
  /** Feature flag key for conditional display */
  featureFlag?: string
}

/**
 * Default navigation configuration
 * Can be overridden via props or context
 */
export const DEFAULT_NAV_ITEMS: NavItemConfig[] = [
  { id: 'play', label: 'Play', icon: '🎮', path: '/dashboard', enabled: true },
  { id: 'profile', label: 'Profile', icon: '👤', path: '/profile', enabled: true },
  { id: 'battlepass', label: 'Battle Pass', icon: '⭐', path: '/battlepass', enabled: true },
  { id: 'shop', label: 'Shop', icon: '🛒', path: '/shop', enabled: true },
  { id: 'inventory', label: 'Inventory', icon: '🎒', path: '/inventory', enabled: true },
  { id: 'coins', label: 'Get Coins', icon: '🪙', path: '/coins', enabled: true },
  { id: 'leaderboards', label: 'Leaderboards', icon: '🏆', path: '/leaderboards', enabled: true },
  { id: 'friends', label: 'Friends', icon: '👥', path: '/friends', enabled: true },
  { id: 'achievements', label: 'Achievements', icon: '🏆', path: '/achievements', enabled: true },
  { id: 'settings', label: 'Settings', icon: '⚙️', path: '/settings', enabled: true },
]

/**
 * Filter navigation items based on enabled status and feature flags
 */
export function getEnabledNavItems(
  items: NavItemConfig[] = DEFAULT_NAV_ITEMS,
  featureFlags?: Record<string, boolean>
): NavItemConfig[] {
  return items.filter(item => {
    if (item.enabled === false) return false
    if (item.featureFlag && featureFlags && !featureFlags[item.featureFlag]) return false
    return true
  })
}

/**
 * Get a specific nav item by ID
 */
export function getNavItem(id: NavItemId, items: NavItemConfig[] = DEFAULT_NAV_ITEMS): NavItemConfig | undefined {
  return items.find(item => item.id === id)
}
