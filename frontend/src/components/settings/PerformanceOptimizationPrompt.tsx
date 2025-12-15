/**
 * PerformanceOptimizationPrompt - One-time prompt for low-end devices.
 * Requirements: 7.5
 * 
 * Shows a prompt suggesting performance-optimized settings when
 * a low-end device is detected.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  calculatePerformanceScore,
  hasPromptBeenDismissed,
  dismissPrompt,
  LOW_END_THRESHOLD,
} from '../../utils/performanceScore';
import { usePolishStore } from '../../stores/polishStore';

interface PerformanceOptimizationPromptProps {
  onOptimize?: () => void;
  onDismiss?: () => void;
}

export function PerformanceOptimizationPrompt({
  onOptimize,
  onDismiss,
}: PerformanceOptimizationPromptProps) {
  const [visible, setVisible] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const updatePolishSettings = usePolishStore((s) => s.updateSettings);
  const setPerformanceScore = usePolishStore((s) => s.setPerformanceScore);

  useEffect(() => {
    // Check if prompt was already dismissed
    if (hasPromptBeenDismissed()) return;

    // Calculate performance score
    calculatePerformanceScore().then((result) => {
      setScore(result.score);
      setPerformanceScore(result.score);
      
      if (result.score < LOW_END_THRESHOLD) {
        setVisible(true);
      }
    });
  }, [setPerformanceScore]);

  const handleOptimize = () => {
    // Apply performance-optimized settings
    updatePolishSettings({
      ambientEffects: false,
      celebrationAnimations: false,
    });
    dismissPrompt();
    setVisible(false);
    onOptimize?.();
  };


  const handleDismiss = () => {
    dismissPrompt();
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
      >
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚡</div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Optimize for Performance?
              </h3>
              <p className="text-[var(--color-text-secondary)] text-sm mb-3">
                We detected your device may benefit from reduced visual effects.
                {score !== null && (
                  <span className="block mt-1 text-xs opacity-70">
                    Performance score: {score}/100
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleOptimize}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors min-h-[44px] touch-manipulation"
                >
                  Optimize
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 bg-transparent hover:bg-white/10 text-[var(--color-text-secondary)] text-sm font-medium rounded-lg transition-colors min-h-[44px] touch-manipulation"
                >
                  Keep Current
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PerformanceOptimizationPrompt;
