/**
 * Dashboard Enterprise Components
 * 
 * Barrel export file for all enterprise-grade dashboard components.
 * These components follow the same patterns as Shop, Battle Pass, 
 * Inventory, and Profile enterprise modules.
 * 
 * @module dashboard/enterprise
 * Requirements: 1.1, 1.4
 */

// Components exported as they are created
export { DashboardSection } from './DashboardSection'
export { HeroPlaySection, formatCooldown } from './HeroPlaySection'
export { BattlePassWidget, calculateXpProgress } from './BattlePassWidget'
export { StatsSummaryWidget, calculateWinRate, getRankFromElo, formatTierName } from './StatsSummaryWidget'
export { ShopPreviewWidget, isValidShopItem, getRarityColor, truncateItemName } from './ShopPreviewWidget'
export { LoadoutPreviewWidget, getSlotDisplayState, getSlotDisplayStateFromCosmetic, getSlotBorderColor } from './LoadoutPreviewWidget'
export { MatchHistoryWidget, formatEloChange, getEloChangeColorClass, formatRelativeTime, getMatchResultDisplay } from './MatchHistoryWidget'
export { FriendsWidget, filterOnlineFriends } from './FriendsWidget'
