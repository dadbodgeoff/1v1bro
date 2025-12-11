/**
 * Guest Experience Module
 * 
 * Exports all guest-related functionality for unauthenticated play.
 * 
 * @module game/guest
 */

export {
  GuestSessionManager,
  getGuestSession,
  calculatePreviewXp,
  accumulateStats,
  type GuestSessionStats,
  type MatchResult,
} from './GuestSessionManager'

export {
  checkMilestones,
  getNewMilestones,
  getMilestoneById,
  getAllMilestones,
  calculateMilestoneXpBonus,
  type GuestMilestone,
} from './MilestoneSystem'

export {
  InstantPlayManager,
  getInstantPlayManager,
  type InstantPlayConfig,
} from './InstantPlayManager'

export {
  BotPersonalitySystem,
  getBotPersonalitySystem,
  BOT_NAMES,
  type BotPersonality,
  type BotBehaviorConfig,
} from './BotPersonalitySystem'

export {
  EngagementFeedbackSystem,
  getEngagementFeedbackSystem,
  XP_AMOUNTS,
  type FeedbackConfig,
  type XpPopup,
  type MilestoneUnlock,
  type MatchSummaryData,
  type FeedbackEvent,
  type FeedbackListener,
} from './EngagementFeedbackSystem'

export {
  SoftConversionPrompts,
  getSoftConversionPrompts,
  type ConversionPrompt,
  type PromptType,
  type GuestIndicatorConfig,
  type PromptInteraction,
  type PromptInteractionRecord,
} from './SoftConversionPrompts'

export {
  SessionTransferFlow,
  getSessionTransferFlow,
  calculateTransferRewards,
  type SessionTransferData,
  type TransferResult,
} from './SessionTransferFlow'
