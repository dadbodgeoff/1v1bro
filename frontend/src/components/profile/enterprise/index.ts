/**
 * Profile Enterprise Components
 * 
 * Enterprise-grade profile components following the architecture pattern
 * established in Shop, Battle Pass, and Inventory enterprise modules.
 */

export { ProfileSection } from './ProfileSection'
export { ProfileHeader, calculateTierProgress } from './ProfileHeader'
export { StatsCard, calculateWinRate, formatCompactNumber } from './StatsCard'
export { StatsDashboard, getStatsConfig } from './StatsDashboard'
export { MatchHistoryItem, MatchHistoryItemSkeleton, getOutcomeStyle, formatRelativeTime, outcomeStyles } from './MatchHistoryItem'
export type { MatchResult } from './MatchHistoryItem'
export { MatchHistorySection } from './MatchHistorySection'
export { LoadoutPreview, getRaritySlotStyle, isSlotFilled } from './LoadoutPreview'
export { SocialLinkButton, platformConfig, getPlatformColor } from './SocialLinkButton'
export { AchievementBadge, rarityStyles, getRarityStyle, sortAchievements } from './AchievementBadge'
export type { Achievement } from './AchievementBadge'
export { ProfileEditorForm, validateDisplayName, validateFileUpload, validateSocialLink, hasUnsavedChanges, VALIDATION } from './ProfileEditorForm'
export { ProfileErrorBoundary, SectionErrorBoundary } from './ProfileErrorBoundary'
