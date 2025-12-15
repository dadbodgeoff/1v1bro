/**
 * useHaptic - React hook for haptic feedback integration
 * 
 * Provides convenient methods for triggering haptic feedback in components.
 * Integrates with the HapticEngine and polish settings.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.7
 */

import { useCallback, useMemo } from 'react'
import { usePolishStore } from '@/stores/polishStore'
import { 
  getHapticEngine, 
  type UIAction, 
  type UIHapticPattern,
  type HapticTriggerOptions 
} from '@/systems/polish/HapticEngine'

// ============================================
// Hook Return Type
// ============================================

export interface UseHapticReturn {
  /** Whether haptic feedback is enabled in settings */
  isEnabled: boolean
  /** Whether the device supports haptic feedback */
  isSupported: boolean
  
  /** Trigger haptic for a UI action */
  trigger: (action: UIAction, options?: HapticTriggerOptions) => void
  
  /** Convenience methods for common actions */
  onButtonPrimary: () => void
  onButtonSecondary: () => void
  onToggle: () => void
  onSuccess: () => void
  onError: () => void
  onNavigation: () => void
  onPurchase: () => void
  onUnlock: () => void
  
  /** Direct pattern trigger (for advanced use) */
  triggerPattern: (pattern: UIHapticPattern, options?: HapticTriggerOptions) => void
}

// ============================================
// Hook Implementation
// ============================================

/**
 * Hook for haptic feedback in React components
 * 
 * @example
 * ```tsx
 * function MyButton() {
 *   const { onButtonPrimary } = useHaptic()
 *   
 *   return (
 *     <button onClick={() => {
 *       onButtonPrimary()
 *       // ... other click handling
 *     }}>
 *       Click me
 *     </button>
 *   )
 * }
 * ```
 */
export function useHaptic(): UseHapticReturn {
  const hapticFeedbackEnabled = usePolishStore((s) => s.settings.hapticFeedback)
  
  // Get or create the haptic engine with current settings
  const engine = useMemo(() => {
    return getHapticEngine(hapticFeedbackEnabled)
  }, [hapticFeedbackEnabled])
  
  // Update engine enabled state when settings change
  useMemo(() => {
    engine.setEnabled(hapticFeedbackEnabled)
  }, [engine, hapticFeedbackEnabled])
  
  // Generic trigger
  const trigger = useCallback((action: UIAction, options?: HapticTriggerOptions) => {
    engine.triggerAction(action, options)
  }, [engine])
  
  // Direct pattern trigger
  const triggerPattern = useCallback((pattern: UIHapticPattern, options?: HapticTriggerOptions) => {
    engine.trigger(pattern, options)
  }, [engine])
  
  // Convenience methods
  const onButtonPrimary = useCallback(() => {
    engine.triggerAction('button-primary')
  }, [engine])
  
  const onButtonSecondary = useCallback(() => {
    engine.triggerAction('button-secondary')
  }, [engine])
  
  const onToggle = useCallback(() => {
    engine.triggerAction('toggle')
  }, [engine])
  
  const onSuccess = useCallback(() => {
    engine.triggerAction('success')
  }, [engine])
  
  const onError = useCallback(() => {
    engine.triggerAction('error')
  }, [engine])
  
  const onNavigation = useCallback(() => {
    engine.triggerAction('navigation')
  }, [engine])
  
  const onPurchase = useCallback(() => {
    engine.triggerAction('purchase')
  }, [engine])
  
  const onUnlock = useCallback(() => {
    engine.triggerAction('unlock')
  }, [engine])
  
  return {
    isEnabled: engine.isEnabled,
    isSupported: engine.isSupported,
    trigger,
    triggerPattern,
    onButtonPrimary,
    onButtonSecondary,
    onToggle,
    onSuccess,
    onError,
    onNavigation,
    onPurchase,
    onUnlock,
  }
}

// ============================================
// Standalone Trigger Function
// ============================================

/**
 * Trigger haptic feedback outside of React components
 * 
 * @example
 * ```ts
 * // In a non-React context
 * triggerHaptic('success')
 * ```
 */
export function triggerHaptic(
  action: UIAction, 
  options?: HapticTriggerOptions
): void {
  const engine = getHapticEngine()
  engine.triggerAction(action, options)
}
