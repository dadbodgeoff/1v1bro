/**
 * Dashboard components index.
 * Requirements: 7.3, 8.1, 9.1, 10.3
 */

export { DashboardLayout, type NavItem } from './DashboardLayout'
export { Sidebar } from './Sidebar'
export { DashboardHeader, calculateLevel, calculateXpProgress } from './DashboardHeader'
export { QuickActionsWidget } from './QuickActionsWidget'
export { BattlePassWidget } from './BattlePassWidget'
export { MatchHistoryWidget } from './MatchHistoryWidget'
export { FriendsWidget, filterOnlineFriends } from './FriendsWidget'

// Enterprise Dashboard Components (8/10+ upgrade)
export { NotificationDropdown } from './NotificationDropdown'
export type { Notification, NotificationGroup, NotificationDropdownProps } from './NotificationDropdown'
export { CommandPalette } from './CommandPalette'
export type { CommandItem, CommandPaletteProps } from './CommandPalette'
export { KeyboardShortcutsModal } from './KeyboardShortcutsModal'
export type { KeyboardShortcutsModalProps } from './KeyboardShortcutsModal'
export { OfflineBanner } from './OfflineBanner'
export type { OfflineBannerProps } from './OfflineBanner'

// Arena Mode Card
export { ArenaCard } from './ArenaCard'
