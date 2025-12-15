/**
 * PolishProvider - Global polish systems context
 * 
 * Initializes and provides access to all polish subsystems:
 * - TransitionManager: Page transition animations
 * - CelebrationSystem: Reward/celebration animations
 * - HapticEngine: Tactile feedback
 * - AmbientEffectRenderer: Seasonal particle effects
 * - CinematicController: Achievement unlock cinematics
 * - EasterEggRegistry: Hidden interaction tracking
 * 
 * Requirements: 8.1
 */

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { 
  usePolishStore, 
  syncPolishWithAccessibility,
  type PolishSettings 
} from '@/stores/polishStore'
import { 
  getHapticEngine,
  type UIHapticPattern 
} from '@/systems/polish/HapticEngine'
import {
  getTransitionManager,
  type TransitionManager as TransitionManagerClass,
} from '@/systems/polish/TransitionManager'
import {
  getEasterEggRegistry,
  type EasterEggActivation,
} from '@/systems/polish/EasterEggRegistry'

// ============================================
// System Placeholder Types
// ============================================

// TransitionManager is now implemented
export type TransitionManager = TransitionManagerClass

// These will be replaced with actual implementations in later tasks

export interface CelebrationSystem {
  isActive: boolean
  queueLength: number
  queue: (celebration: unknown) => void
  skip: () => void
}

export interface HapticEngine {
  isSupported: boolean
  isEnabled: boolean
  trigger: (pattern: UIHapticPattern) => void
}

export interface AmbientEffectRenderer {
  isActive: boolean
  theme: string
  setTheme: (theme: string) => void
}

export interface CinematicController {
  state: 'idle' | 'entering' | 'displaying' | 'exiting'
  queueLength: number
  queueAchievement: (achievement: unknown) => void
  skip: () => void
}

export interface EasterEggRegistry {
  discovered: string[]
  isDiscovered: (id: string) => boolean
  registerKeyInput: (key: string) => EasterEggActivation | null
  registerClick: (target: string) => EasterEggActivation | null
  checkSecretUrl: (path: string) => EasterEggActivation | null
  getProgress: (eggId: string) => number
}

// ============================================
// Context Types
// ============================================

export interface PolishContextValue {
  // System instances
  transitionManager: TransitionManager
  celebrationSystem: CelebrationSystem
  hapticEngine: HapticEngine
  ambientRenderer: AmbientEffectRenderer
  cinematicController: CinematicController
  easterEggRegistry: EasterEggRegistry
  
  // Quick access to settings
  settings: PolishSettings
  updateSettings: (updates: Partial<PolishSettings>) => void
}

const PolishContext = createContext<PolishContextValue | null>(null)

// ============================================
// Hook
// ============================================

export function usePolishContext(): PolishContextValue {
  const ctx = useContext(PolishContext)
  if (!ctx) {
    throw new Error('usePolishContext must be used within PolishProvider')
  }
  return ctx
}

// ============================================
// Provider Props
// ============================================

interface PolishProviderProps {
  children: ReactNode
}

// ============================================
// Placeholder System Factories
// ============================================

function createTransitionManager(
  reducedMotion: boolean,
  pageTransitionsEnabled: boolean
): TransitionManager {
  return getTransitionManager({
    reducedMotion,
    pageTransitionsEnabled,
  })
}

function createCelebrationSystem(): CelebrationSystem {
  return {
    isActive: false,
    queueLength: 0,
    queue: () => {},
    skip: () => {},
  }
}

function createHapticEngine(enabled: boolean): HapticEngine {
  const engine = getHapticEngine(enabled)
  
  return {
    get isSupported() { return engine.isSupported },
    get isEnabled() { return engine.isEnabled },
    trigger: (pattern: UIHapticPattern) => engine.trigger(pattern),
  }
}

function createAmbientEffectRenderer(): AmbientEffectRenderer {
  return {
    isActive: false,
    theme: 'none',
    setTheme: () => {},
  }
}

function createCinematicController(): CinematicController {
  return {
    state: 'idle',
    queueLength: 0,
    queueAchievement: () => {},
    skip: () => {},
  }
}

function createEasterEggRegistry(enabled: boolean): EasterEggRegistry {
  const registry = getEasterEggRegistry()
  registry.setEnabled(enabled)
  
  return {
    get discovered() { return registry.discovered },
    isDiscovered: (id: string) => registry.isDiscovered(id),
    registerKeyInput: (key: string) => registry.registerKeyInput(key),
    registerClick: (target: string) => registry.registerClick(target),
    checkSecretUrl: (path: string) => registry.checkSecretUrl(path),
    getProgress: (eggId: string) => registry.getProgress(eggId),
  }
}

// ============================================
// Provider Component
// ============================================

export function PolishProvider({ children }: PolishProviderProps) {
  const settings = usePolishStore((s) => s.settings)
  const updateSettings = usePolishStore((s) => s.updateSettings)
  const initialize = usePolishStore((s) => s.initialize)

  // Initialize store on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  // Sync with accessibility settings
  useEffect(() => {
    const unsubscribe = syncPolishWithAccessibility()
    return unsubscribe
  }, [])

  // Create system instances
  // These are memoized to prevent unnecessary re-renders
  // In future tasks, these will be replaced with actual implementations
  const systems = useMemo(() => ({
    transitionManager: createTransitionManager(
      !settings.celebrationAnimations, // reduced motion when animations disabled
      settings.pageTransitions
    ),
    celebrationSystem: createCelebrationSystem(),
    hapticEngine: createHapticEngine(settings.hapticFeedback),
    ambientRenderer: createAmbientEffectRenderer(),
    cinematicController: createCinematicController(),
    easterEggRegistry: createEasterEggRegistry(settings.celebrationAnimations),
  }), [settings.hapticFeedback, settings.celebrationAnimations, settings.pageTransitions])

  const contextValue = useMemo<PolishContextValue>(() => ({
    ...systems,
    settings,
    updateSettings,
  }), [systems, settings, updateSettings])

  return (
    <PolishContext.Provider value={contextValue}>
      {children}
    </PolishContext.Provider>
  )
}

// ============================================
// Convenience Hooks
// ============================================

export function useTransitionManager(): TransitionManager {
  return usePolishContext().transitionManager
}

export function useCelebrationSystem(): CelebrationSystem {
  return usePolishContext().celebrationSystem
}

export function useHapticEngine(): HapticEngine {
  return usePolishContext().hapticEngine
}

export function useAmbientRenderer(): AmbientEffectRenderer {
  return usePolishContext().ambientRenderer
}

export function useCinematicController(): CinematicController {
  return usePolishContext().cinematicController
}

export function useEasterEggRegistry(): EasterEggRegistry {
  return usePolishContext().easterEggRegistry
}

export function usePolishSettings(): PolishSettings {
  return usePolishContext().settings
}
