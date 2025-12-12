/**
 * OnboardingModal - First-time user walkthrough
 * Multi-step modal introducing key features
 * 
 * Steps:
 * 1. Welcome + Alpha notice
 * 2. Practice Mode (Bot Match)
 * 3. Live Matchmaking
 * 4. Shop & Battle Pass
 * 5. Inventory, Settings & Profile
 * 
 * Typography (matches enterprise design system):
 * - Headline: text-[28px] md:text-[36px] font-extrabold tracking-[-0.03em]
 * - Subheadline: text-[15px] md:text-[17px] leading-[1.6] text-[#B4B4B4]
 * - Body: text-[14px] text-[#B4B4B4]
 * - Labels: text-[12px] font-semibold uppercase tracking-[0.02em]
 */

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/helpers'
import { 
  DEFAULT_ONBOARDING_STEPS, 
  getEnabledOnboardingSteps, 
  getAccentColor,
  type OnboardingStep 
} from '@/config/onboarding'

const STORAGE_KEY = 'onboarding_completed'

interface OnboardingModalProps {
  onClose: () => void
  /** Custom steps (defaults to DEFAULT_ONBOARDING_STEPS) */
  steps?: OnboardingStep[]
}

export function OnboardingModal({ onClose, steps }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(true) // Default to true for onboarding

  // Get enabled steps from config
  const enabledSteps = useMemo(() => getEnabledOnboardingSteps(steps || DEFAULT_ONBOARDING_STEPS), [steps])
  
  const step = enabledSteps[currentStep]
  const accentColor = getAccentColor(step.accentColorVar)
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === enabledSteps.length - 1
  const progress = ((currentStep + 1) / enabledSteps.length) * 100

  const handleNext = () => {
    if (isLastStep) {
      handleClose()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
    onClose()
  }

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    onClose()
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && handleSkip()}
      >
        <motion.div
          key={step.id}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-[#111113] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Decorative glow effect */}
          <div
            className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
            style={{ backgroundColor: accentColor }}
          />

          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
            <motion.div
              className="h-full"
              style={{ backgroundColor: accentColor }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-[12px] text-white/40 hover:text-white/60 transition-colors z-10"
          >
            Skip tour
          </button>

          {/* Header */}
          <div className="relative px-6 py-8 md:px-8 md:py-10 border-b border-white/10">
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-1.5 mb-6">
              {enabledSteps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-200',
                    idx === currentStep
                      ? 'w-6'
                      : 'hover:opacity-80'
                  )}
                  style={{
                    backgroundColor: idx === currentStep ? accentColor : 'rgba(255,255,255,0.2)',
                  }}
                />
              ))}
            </div>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              {step.icon}
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-[24px] md:text-[28px] font-extrabold tracking-[-0.03em] text-white leading-[1.1] text-center"
            >
              {step.title}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[14px] md:text-[15px] leading-[1.6] text-[#B4B4B4] mt-3 text-center max-w-sm mx-auto"
            >
              {step.subtitle}
            </motion.p>

            {/* Alpha badge on first step */}
            {isFirstStep && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
                className="flex justify-center mt-4"
              >
                <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 border border-amber-500/30 rounded-full">
                  🚧 Alpha Build
                </span>
              </motion.div>
            )}
          </div>

          {/* Content */}
          <div className="relative p-6 md:p-8">
            {/* Highlights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="space-y-3 mb-6"
            >
              {step.highlights.map((highlight, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                >
                  <span className="text-lg">{highlight.icon}</span>
                  <span className="text-[14px] text-[#B4B4B4]">{highlight.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Don't show again (only on last step) */}
            {isLastStep && (
              <motion.label
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-3 mb-5 cursor-pointer group"
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div
                    className={cn(
                      'w-5 h-5 rounded border-2 transition-all duration-200',
                      'border-white/20 bg-transparent',
                      'group-hover:border-white/40'
                    )}
                    style={{
                      borderColor: dontShowAgain ? accentColor : undefined,
                      backgroundColor: dontShowAgain ? accentColor : undefined,
                    }}
                  >
                    {dontShowAgain && (
                      <svg
                        className="w-full h-full text-black p-0.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-[14px] text-[#737373] group-hover:text-[#B4B4B4] transition-colors">
                  Don't show this again
                </span>
              </motion.label>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3">
              {!isFirstStep && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleBack}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/[0.06] border border-white/[0.1] text-[14px] font-semibold text-white/70 hover:bg-white/[0.1] hover:text-white transition-all"
                >
                  Back
                </motion.button>
              )}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                onClick={handleNext}
                className={cn(
                  'flex-1 py-3 px-4 rounded-xl',
                  'text-[14px] font-bold text-black',
                  'shadow-lg transition-all duration-200 active:scale-[0.98]',
                  isFirstStep && 'flex-none w-full'
                )}
                style={{
                  background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
                  boxShadow: `0 8px 24px ${accentColor}40`,
                }}
              >
                {isLastStep ? "Let's Go!" : 'Next'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) {
      // Small delay to let the page load first
      const timer = setTimeout(() => setShowOnboarding(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  return {
    showOnboarding,
    closeOnboarding: () => setShowOnboarding(false),
    // Allow manual trigger for settings page "replay tour"
    openOnboarding: () => setShowOnboarding(true),
  }
}
