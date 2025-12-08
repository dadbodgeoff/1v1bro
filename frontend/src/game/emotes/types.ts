/**
 * Emote system type definitions
 * Types for emote display, assets, and events
 */

import type { Vector2 } from '../types'

// ============================================================================
// Emote Phase Types
// ============================================================================

export type EmotePhase = 'pop-in' | 'display' | 'fade-out'

// ============================================================================
// Active Emote Types
// ============================================================================

export interface ActiveEmote {
  id: string                    // Unique instance ID
  emoteId: string               // Cosmetic ID from database
  playerId: string              // Player who triggered
  position: Vector2             // Current display position
  startTime: number             // Timestamp when triggered
  duration: number              // How long to display (ms)
  phase: EmotePhase             // Current animation phase
  opacity: number               // Current opacity (0-1)
  scale: number                 // Current scale (0.5-1.0)
}

// ============================================================================
// Emote Asset Types
// ============================================================================

export interface EmoteAsset {
  id: string                    // Cosmetic ID
  name: string                  // Display name
  imageUrl: string              // URL to emote image
  image: HTMLImageElement | null // Loaded image element
  loaded: boolean               // Whether image is ready
}

export interface EmoteInventoryItem {
  id: string
  name: string
  image_url: string
}

// ============================================================================
// Emote State Types
// ============================================================================

export interface EmoteState {
  equippedEmoteId: string | null           // Currently equipped emote
  activeEmotes: Map<string, ActiveEmote>   // Player ID -> Active emote
  cooldownEnd: number                      // Timestamp when cooldown expires
  assets: Map<string, EmoteAsset>          // Emote ID -> Asset data
}

// ============================================================================
// Emote Event Types
// ============================================================================

export interface EmoteTriggerEvent {
  playerId: string
  emoteId: string
  timestamp: number
}

// ============================================================================
// Emote Callbacks
// ============================================================================

export interface EmoteCallbacks {
  onEmoteTrigger?: (event: EmoteTriggerEvent) => void
}
