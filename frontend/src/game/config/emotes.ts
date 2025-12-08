/**
 * Emote system configuration
 * All emote-related constants and default values
 */

// ============================================================================
// Timing Configuration
// ============================================================================

export const EMOTE_TIMING = {
  duration: 2000,           // 2 seconds display time
  cooldown: 3000,           // 3 seconds between emotes
  popInDuration: 150,       // 150ms scale animation
  fadeOutDuration: 200,     // 200ms fade animation
}

// ============================================================================
// Positioning Configuration
// ============================================================================

export const EMOTE_POSITION = {
  yOffset: -55,             // Pixels above player center
  size: 48,                 // Width and height in pixels
}

// ============================================================================
// Animation Configuration
// ============================================================================

export const EMOTE_ANIMATION = {
  popInStartScale: 0.5,     // Initial scale
  popInEndScale: 1.0,       // Final scale
}

// ============================================================================
// Input Configuration
// ============================================================================

export const EMOTE_INPUT = {
  triggerKey: 'KeyE',       // Default trigger key
}

// ============================================================================
// Combined Config Export
// ============================================================================

export const EMOTE_CONFIG = {
  // Timing
  duration: EMOTE_TIMING.duration,
  cooldown: EMOTE_TIMING.cooldown,
  popInDuration: EMOTE_TIMING.popInDuration,
  fadeOutDuration: EMOTE_TIMING.fadeOutDuration,
  
  // Positioning
  yOffset: EMOTE_POSITION.yOffset,
  size: EMOTE_POSITION.size,
  
  // Animation
  popInStartScale: EMOTE_ANIMATION.popInStartScale,
  popInEndScale: EMOTE_ANIMATION.popInEndScale,
  
  // Input
  triggerKey: EMOTE_INPUT.triggerKey,
}

// ============================================================================
// Derived Constants
// ============================================================================

export const EMOTE_TOTAL_DURATION = EMOTE_CONFIG.duration + EMOTE_CONFIG.fadeOutDuration
