/**
 * QuickCategoryPicker - Fast category selection for instant play
 * 
 * Shows a streamlined category picker with large, tappable buttons.
 * Designed to be quick (2-3 seconds) while still letting users choose
 * their preferred trivia category.
 * 
 * @module components/game/QuickCategoryPicker
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/helpers'
import { useCategories } from '@/hooks/useCategories'
import { getCategoryConfig, getCategoryColor } from '@/config/categories'

export interface QuickCategoryPickerProps {
  /** Whether the picker is visible */
  visible: boolean
  /** Callback when a category is selected */
  onSelect: (categorySlug: string) => void
  /** Additional CSS classes */
  className?: string
}

export function QuickCategoryPicker({
  visible,
  onSelect,
  className,
}: QuickCategoryPickerProps) {
  const { categories, isLoading } = useCategories()
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)


  // Filter to categories with questions
  const availableCategories = categories.filter(c => c.question_count > 0)

  // Handle category selection
  const handleSelect = (slug: string) => {
    setSelectedSlug(slug)
    // Brief delay for visual feedback, then trigger callback
    setTimeout(() => {
      onSelect(slug)
    }, 150)
  }

  // Reset selection when hidden
  useEffect(() => {
    if (!visible) {
      setSelectedSlug(null)
    }
  }, [visible])

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
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md mx-4"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Pick Your Trivia
              </h2>
              <p className="text-neutral-400 text-sm">
                What do you want to be quizzed on?
              </p>
            </div>

            {/* Category Grid */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {availableCategories.map((category) => {
                  const config = getCategoryConfig(category.slug)
                  const color = getCategoryColor(category.slug)
                  const isSelected = selectedSlug === category.slug

                  return (
                    <motion.button
                      key={category.slug}
                      onClick={() => handleSelect(category.slug)}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        'relative p-4 rounded-xl border-2 transition-all',
                        'flex flex-col items-center gap-2',
                        'min-h-[100px] min-w-[44px]', // Touch target compliance
                        isSelected
                          ? 'border-white bg-white/10 scale-105'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                      )}
                      style={{
                        boxShadow: isSelected ? `0 0 20px ${color}40` : undefined,
                      }}
                    >
                      {/* Icon */}
                      <span className="text-3xl">{config.icon}</span>
                      
                      {/* Label */}
                      <span className="text-white font-semibold text-sm">
                        {config.label}
                      </span>
                      
                      {/* Question count */}
                      <span className="text-neutral-500 text-xs">
                        {category.question_count.toLocaleString()} questions
                      </span>

                      {/* Selection indicator */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center"
                        >
                          <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </motion.div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            )}

            {/* Hint */}
            <p className="text-center text-neutral-600 text-xs mt-4">
              Tap a category to start playing
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default QuickCategoryPicker
