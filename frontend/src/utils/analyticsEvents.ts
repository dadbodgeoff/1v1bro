/**
 * Analytics Events - Centralized event definitions
 * 
 * Defines all trackable events for consistent analytics across the app.
 * Use these with the useAnalyticsContext hook.
 */

// Event categories
export const ANALYTICS_EVENTS = {
  // User lifecycle
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  
  // Game events
  GAME_STARTED: 'game_started',
  GAME_COMPLETED: 'game_completed',
  GAME_ABANDONED: 'game_abandoned',
  MATCHMAKING_STARTED: 'matchmaking_started',
  MATCHMAKING_COMPLETED: 'matchmaking_completed',
  BOT_GAME_STARTED: 'bot_game_started',
  
  // Engagement
  DEMO_PLAYED: 'demo_played',
  TUTORIAL_STARTED: 'tutorial_started',
  TUTORIAL_COMPLETED: 'tutorial_completed',
  TUTORIAL_SKIPPED: 'tutorial_skipped',
  
  // Commerce
  SHOP_VIEWED: 'shop_viewed',
  ITEM_VIEWED: 'item_viewed',
  ITEM_PURCHASED: 'item_purchased',
  BATTLEPASS_VIEWED: 'battlepass_viewed',
  BATTLEPASS_PURCHASED: 'battlepass_purchased',
  
  // Social
  FRIEND_ADDED: 'friend_added',
  FRIEND_INVITED: 'friend_invited',
  LOBBY_CREATED: 'lobby_created',
  LOBBY_JOINED: 'lobby_joined',
  
  // Features
  LEADERBOARD_VIEWED: 'leaderboard_viewed',
  PROFILE_VIEWED: 'profile_viewed',
  SETTINGS_CHANGED: 'settings_changed',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
} as const

export type AnalyticsEventName = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS]
