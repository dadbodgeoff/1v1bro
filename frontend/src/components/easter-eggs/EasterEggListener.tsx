/**
 * EasterEggListener - Global keyboard/click listener for easter egg triggers.
 * Requirements: 6.1, 6.6
 * 
 * Listens for keyboard inputs and click sequences to detect easter egg triggers.
 * Shows hint animation when user is close to completing a sequence.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getEasterEggRegistry,
  HINT_THRESHOLD,
} from '../../systems/polish/EasterEggRegistry';
import type { EasterEggActivation } from '../../systems/polish/EasterEggRegistry';
import { usePolishStore } from '../../stores/polishStore';

// ============================================
// Types
// ============================================

interface EasterEggListenerProps {
  onActivation?: (activation: EasterEggActivation) => void;
  children?: React.ReactNode;
}

interface HintState {
  visible: boolean;
  eggId: string | null;
  progress: number;
}

// ============================================
// Styles
// ============================================

const hintOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
  zIndex: 9998,
};

const hintIndicatorStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '20px',
  right: '20px',
  padding: '8px 16px',
  borderRadius: '20px',
  background: 'rgba(255, 215, 0, 0.9)',
  color: '#000',
  fontSize: '14px',
  fontWeight: 600,
  boxShadow: '0 4px 12px rgba(255, 215, 0, 0.4)',
};

// ============================================
// Component
// ============================================

export function EasterEggListener({ onActivation, children }: EasterEggListenerProps) {
  const [hint, setHint] = useState<HintState>({
    visible: false,
    eggId: null,
    progress: 0,
  });
  
  const celebrationAnimations = usePolishStore((s) => s.settings.celebrationAnimations);
  const registryRef = useRef(getEasterEggRegistry());

  // Handle keyboard input
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if typing in an input field
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    const registry = registryRef.current;
    const activation = registry.registerKeyInput(event.code);
    
    if (activation) {
      onActivation?.(activation);
    }
  }, [onActivation]);

  // Handle progress updates for hints
  const handleProgress = useCallback((eggId: string, progress: number) => {
    if (progress >= HINT_THRESHOLD && progress < 1) {
      setHint({
        visible: true,
        eggId,
        progress,
      });
    } else if (progress === 0 || progress >= 1) {
      setHint((prev) => {
        if (prev.eggId === eggId) {
          return { visible: false, eggId: null, progress: 0 };
        }
        return prev;
      });
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    const registry = registryRef.current;
    
    // Listen for keyboard events
    window.addEventListener('keydown', handleKeyDown);
    
    // Listen for progress updates
    const unsubscribeProgress = registry.onProgress(handleProgress);
    
    // Listen for activations
    const unsubscribeActivation = registry.onActivation((activation) => {
      onActivation?.(activation);
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unsubscribeProgress();
      unsubscribeActivation();
    };
  }, [handleKeyDown, handleProgress, onActivation]);

  // Don't show hints if animations are disabled
  if (!celebrationAnimations) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      
      {/* Hint overlay */}
      <AnimatePresence>
        {hint.visible && (
          <div style={hintOverlayStyle}>
            <motion.div
              style={hintIndicatorStyle}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <span role="img" aria-label="sparkles">✨</span>
              {' '}Something's happening...
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================
// Click Target Hook
// ============================================

/**
 * Hook to register click events on a specific target for easter egg detection.
 */
export function useEasterEggClick(target: string) {
  const registryRef = useRef(getEasterEggRegistry());
  
  const handleClick = useCallback(() => {
    return registryRef.current.registerClick(target);
  }, [target]);
  
  return handleClick;
}

// ============================================
// URL Check Hook
// ============================================

/**
 * Hook to check for secret URL easter eggs on route change.
 */
export function useEasterEggUrlCheck(path: string) {
  const registryRef = useRef(getEasterEggRegistry());
  const [activation, setActivation] = useState<EasterEggActivation | null>(null);
  
  useEffect(() => {
    const result = registryRef.current.checkSecretUrl(path);
    if (result) {
      setActivation(result);
    }
  }, [path]);
  
  return activation;
}

export default EasterEggListener;
