/**
 * ConversionPromptModal - Non-intrusive signup prompt modal
 * 
 * Shows feature previews and accumulated stats to encourage
 * guest players to create an account.
 * 
 * @module components/game/ConversionPromptModal
 * Requirements: 3.1, 3.2, 3.3
 */

import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/utils/helpers'
import { type ConversionPrompt } from '@/game/guest/SoftConversionPrompts'

export interface ConversionPromptModalProps {
  /** Whether the modal is visible */
  visible: boolean
  /** Prompt data to display */
  prompt: ConversionPrompt | null
  /** Callback when primary CTA is clicked */
  onPrimaryCta?: () => void
  /** Callback when secondary CTA (dismiss) is clicked */
  onSecondaryCta?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * ConversionPromptModal component
 */
export function ConversionPromptModal({
  visible,
  prompt,
  onPrimaryCta,
  onSecondaryCta,
  className,
}: ConversionPromptModalProps) {
  const navigate = useNavigate()

  // Handle primary CTA click
  const handlePrimaryCta = useCallback(() => {
    if (onPrimaryCta) {
      onPrimaryCta()
    }
    navigate('/register')
  }, [navigate, onPrimaryCta])

  // Handle secondary CTA click
  const handleSecondaryCta = useCallback(() => {
    if (onSecondaryCta) {
      onSecondaryCta()
    }
  }, [onSecondaryCta])

  if (!prompt) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center',
            'bg-black/80 backdrop-blur-sm',
            className
          )}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full max-w-sm mx-4"
          >
            {/* Card */}
            <div className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden">
              {/* Gradient header */}
              <div className="h-1 bg-gradient-to-r from-purple-500 to-orange-500" />
              
              {/* Content */}
              <div className="p-6">
                {/* Title */}
                <h2 className="text-xl font-bold text-white mb-2 text-center">
                  {prompt.title}
                </h2>
                
                {/* Message */}
                <p className="text-neutral-400 text-sm text-center mb-4">
                  {prompt.message}
                </p>

                {/* Features list */}
                {prompt.features && prompt.features.length > 0 && (
                  <div className="space-y-2 mb-6">
                    {prompt.features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        className="flex items-center gap-2 text-sm text-neutral-300"
                      >
                        <span>{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* CTAs */}
                <div className="space-y-3">
                  <button
                    onClick={handlePrimaryCta}
                    className={cn(
                      'w-full px-6 py-3 rounded-xl font-semibold text-sm',
                      'bg-gradient-to-r from-purple-500 to-orange-500 text-white',
                      'hover:opacity-90 transition-opacity',
                      'min-h-[48px]' // Touch target compliance
                    )}
                  >
                    {prompt.ctaText}
                  </button>

                  {prompt.secondaryCta && prompt.dismissable && (
                    <button
                      onClick={handleSecondaryCta}
                      className={cn(
                        'w-full px-6 py-3 rounded-xl font-medium text-sm',
                        'text-neutral-500 hover:text-neutral-300 transition-colors',
                        'min-h-[48px]' // Touch target compliance
                      )}
                    >
                      {prompt.secondaryCta}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ConversionPromptModal
