/**
 * useArenaCosmetics - Manages emote and skin initialization for GameArena
 * 
 * Handles emote callbacks, inventory, and skin application
 * 
 * @module hooks/useArenaCosmetics
 */

import { useEffect } from 'react'
import type { MutableRefObject } from 'react'
import type { GameEngine } from '@/game'

interface EmoteData {
  id: string
  name: string
  image_url: string
}

interface SkinData {
  skinId?: string
  spriteSheetUrl?: string
  metadataUrl?: string
}

interface UseArenaCosmeticsOptions {
  engineRef: MutableRefObject<GameEngine | null>
  playerId: string
  opponentId?: string
  // Emote props
  setRemoteEmoteCallback?: (callback: (playerId: string, emoteId: string) => void) => void
  sendEmote?: (emoteId: string) => void
  inventoryEmotes?: EmoteData[]
  equippedEmoteId?: string | null
  // Skin props
  equippedSkin?: SkinData | null
  opponentSkin?: SkinData | null
}

export function useArenaCosmetics({
  engineRef,
  playerId,
  opponentId,
  setRemoteEmoteCallback,
  sendEmote,
  inventoryEmotes,
  equippedEmoteId,
  equippedSkin,
  opponentSkin,
}: UseArenaCosmeticsOptions): void {
  // Register emote callbacks
  useEffect(() => {
    if (setRemoteEmoteCallback) {
      setRemoteEmoteCallback((pid, emoteId) => {
        engineRef.current?.handleRemoteEmote(pid, emoteId)
      })
    }
  }, [setRemoteEmoteCallback, playerId, engineRef])

  // Wire emote trigger to WebSocket send
  useEffect(() => {
    if (sendEmote && engineRef.current) {
      const emoteManager = engineRef.current.getEmoteManager()
      emoteManager.setOnEmoteTrigger((event) => {
        sendEmote(event.emoteId)
      })
    }
  }, [sendEmote, playerId, engineRef])

  // Initialize emotes with inventory and equipped emote
  useEffect(() => {
    if (engineRef.current && inventoryEmotes) {
      engineRef.current.initializeEmotes(inventoryEmotes, equippedEmoteId ?? null)
    }
  }, [inventoryEmotes, equippedEmoteId, playerId, engineRef])

  // Initialize player skin - with retry to handle timing issues
  useEffect(() => {
    const applySkin = () => {
      if (!engineRef.current) {
        return false
      }
      
      if (equippedSkin) {
        if (equippedSkin.spriteSheetUrl) {
          // Dynamic skin from CMS
          engineRef.current.setDynamicSkin(playerId, equippedSkin.spriteSheetUrl, equippedSkin.metadataUrl)
        } else if (equippedSkin.skinId) {
          // Static bundled skin
          engineRef.current.setPlayerSkin(playerId, equippedSkin.skinId)
        }
      }
      return true
    }
    
    // Try immediately
    if (applySkin()) return
    
    // Retry after a short delay if engine wasn't ready
    const retryTimer = setTimeout(() => {
      applySkin()
    }, 100)
    
    return () => clearTimeout(retryTimer)
  }, [equippedSkin, playerId, engineRef])

  // Initialize opponent skin
  useEffect(() => {
    if (!engineRef.current || !opponentId) return
    
    if (opponentSkin) {
      if (opponentSkin.spriteSheetUrl) {
        engineRef.current.setDynamicSkin(opponentId, opponentSkin.spriteSheetUrl, opponentSkin.metadataUrl)
      } else if (opponentSkin.skinId) {
        engineRef.current.setPlayerSkin(opponentId, opponentSkin.skinId)
      }
    }
  }, [opponentSkin, opponentId, engineRef])
}
