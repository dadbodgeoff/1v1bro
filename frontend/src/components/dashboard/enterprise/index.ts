/**
 * Dashboard Enterprise Components
 * 
 * Barrel export file for all enterprise-grade dashboard components.
 * These components follow the same patterns as Shop, Battle Pass, 
 * Inventory, and Profile enterprise modules.
 * 
 * @module dashboard/enterprise
 * Requirements: 1.1, 1.4, 8.1, 9.1, 10.3, 11.1
 */

// Error Boundary
export { WidgetErrorBoundary } from './WidgetErrorBoundary'
export type { WidgetErrorBoundaryProps } from './WidgetErrorBoundary'

// Skeleton Loader
export { WidgetSkeleton } from './WidgetSkeleton'
export type { WidgetSkeletonProps, SkeletonVariant } from './WidgetSkeleton'

// Animation Components
export { AnimatedWidget, PulseOnChange, BounceBadge, StaggerContainer, StaggerItem } from './AnimatedWidget'
export type { AnimatedWidgetProps } from './AnimatedWidget'

// Components exported as they are created
export { DashboardSection } from './DashboardSection'
export { HeroPlaySection } from './HeroPlaySection'
export { BattlePassWidget, calculateXpProgress } from './BattlePassWidget'
export { StatsSummaryWidget, calculateWinRate, getRankFromElo, formatTierName } from './StatsSummaryWidget'
export { ShopPreviewWidget, isValidShopItem, getRarityColor, truncateItemName } from './ShopPreviewWidget'
export { LoadoutPreviewWidget, getSlotDisplayState, getSlotDisplayStateFromCosmetic, getSlotBorderColor } from './LoadoutPreviewWidget'
export { MatchHistoryWidget, formatEloChange, getEloChangeColorClass, formatRelativeTime, getMatchResultDisplay } from './MatchHistoryWidget'
export { FriendsWidget, filterOnlineFriends } from './FriendsWidget'

// Game Mode Cards (2D ArenaShooterCard removed for mobile-app branch)
export { SurvivalRunnerCard } from './SurvivalRunnerCard'

// Re-export from parent dashboard folder for convenience
export { NotificationDropdown } from '../NotificationDropdown'
export type { Notification, NotificationGroup, NotificationDropdownProps } from '../NotificationDropdown'
export { CommandPalette } from '../CommandPalette'
export type { CommandItem, CommandPaletteProps } from '../CommandPalette'
export { KeyboardShortcutsModal } from '../KeyboardShortcutsModal'
export type { KeyboardShortcutsModalProps } from '../KeyboardShortcutsModal'
export { OfflineBanner } from '../OfflineBanner'
export type { OfflineBannerProps } from '../OfflineBanner'
