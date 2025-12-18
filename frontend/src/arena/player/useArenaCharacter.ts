/**
 * useArenaCharacter Hook
 * 
 * React hook for loading arena characters with cosmetics integration.
 * Handles loading state, progress, and equipped skin from inventory.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useCosmeticsStore } from '@/stores/cosmeticsStore'
import { useAuthStore } from '@/stores/authStore'
import { 
  arenaCharacterLoader, 
  type LoadedCharacter, 
  type LoadProgress 
} from './ArenaCharacterLoader'
import { 
  getArenaCharacterSkin, 
  DEFAULT_ARENA_SKIN,
  type ArenaCharacterSkin 
} from './ArenaCharacterConfig'
import { AnimationController } from './AnimationController'

export interface UseArenaCharacterOptions {
  /** Load only essential animations for faster startup */
  essentialsOnly?: boolean
  /** Auto-load remaining animations after essentials */
  autoLoadRemaining?: boolean
  /** Use default skin regardless of equipped cosmetic */
  useDefaultSkin?: boolean
}

export interface UseArenaCharacterResult {
  /** Loaded character (null while loading) */
  character: LoadedCharacter | null
  /** Animation controller (null while loading) */
  animationController: AnimationController | null
  /** Current skin configuration */
  skin: ArenaCharacterSkin
  /** Loading state */
  isLoading: boolean
  /** Loading progress */
  progress: LoadProgress | null
  /** Error message if loading failed */
  error: string | null
  /** Reload character (e.g., after skin change) */
  reload: () => Promise<void>
  /** Load remaining animations (if essentialsOnly was true) */
  loadRemaining: () => Promise<void>
}

/**
 * Hook for loading and managing arena character
 */
export function useArenaCharacter(
  options: UseArenaCharacterOptions = {}
): UseArenaCharacterResult {
  const { essentialsOnly = false, autoLoadRemaining = true, useDefaultSkin = false } = options

  const { token } = useAuthStore()
  const { loadoutWithDetails, fetchLoadout } = useCosmeticsStore()

  const [character, setCharacter] = useState<LoadedCharacter | null>(null)
  const [animationController, setAnimationController] = useState<AnimationController | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState<LoadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadingRef = useRef(false)
  const remainingLoadedRef = useRef(false)

  // Determine skin to use
  const getSkin = useCallback((): ArenaCharacterSkin => {
    if (useDefaultSkin) {
      return DEFAULT_ARENA_SKIN
    }

    // Check for equipped arena character cosmetic
    const equippedArenaChar = loadoutWithDetails?.arena_character_equipped
    
    if (equippedArenaChar?.model_url) {
      return getArenaCharacterSkin({
        id: equippedArenaChar.id,
        name: equippedArenaChar.name,
        model_url: equippedArenaChar.model_url,
        animations: equippedArenaChar.arena_animations,
      })
    }

    return DEFAULT_ARENA_SKIN
  }, [useDefaultSkin, loadoutWithDetails])

  const skin = getSkin()

  // Load character
  const loadCharacter = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true

    setIsLoading(true)
    setError(null)
    setProgress(null)
    remainingLoadedRef.current = false

    try {
      const skinToLoad = getSkin()
      
      const loaded = essentialsOnly
        ? await arenaCharacterLoader.loadEssentials(skinToLoad, setProgress)
        : await arenaCharacterLoader.loadCharacter(skinToLoad, setProgress)

      setCharacter(loaded)
      
      // Create animation controller
      const controller = new AnimationController(loaded.mixer, loaded.animations)
      setAnimationController(controller)

      // Start with idle animation
      controller.play('idle')

    } catch (err) {
      console.error('[useArenaCharacter] Failed to load character:', err)
      setError(err instanceof Error ? err.message : 'Failed to load character')
    } finally {
      setIsLoading(false)
      loadingRef.current = false
    }
  }, [essentialsOnly, getSkin])

  // Load remaining animations
  const loadRemaining = useCallback(async () => {
    if (!character || remainingLoadedRef.current) return

    remainingLoadedRef.current = true

    try {
      await arenaCharacterLoader.loadRemaining(character, setProgress)
      
      // Update animation controller with new animations
      if (animationController) {
        for (const [name, clip] of character.animations) {
          if (!animationController.hasAnimation(name)) {
            animationController.addAnimation(name, clip)
          }
        }
      }
    } catch (err) {
      console.error('[useArenaCharacter] Failed to load remaining animations:', err)
    }
  }, [character, animationController])

  // Reload character
  const reload = useCallback(async () => {
    arenaCharacterLoader.clearCache()
    await loadCharacter()
  }, [loadCharacter])

  // Initial load
  useEffect(() => {
    loadCharacter()
  }, []) // Only on mount

  // Fetch loadout if not loaded
  useEffect(() => {
    if (token && !loadoutWithDetails) {
      fetchLoadout(token)
    }
  }, [token, loadoutWithDetails, fetchLoadout])

  // Auto-load remaining after essentials
  useEffect(() => {
    if (
      essentialsOnly && 
      autoLoadRemaining && 
      character && 
      !isLoading && 
      !remainingLoadedRef.current
    ) {
      // Delay to let game start first
      const timer = setTimeout(() => {
        loadRemaining()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [essentialsOnly, autoLoadRemaining, character, isLoading, loadRemaining])

  return {
    character,
    animationController,
    skin,
    isLoading,
    progress,
    error,
    reload,
    loadRemaining,
  }
}
