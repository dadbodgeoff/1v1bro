/**
 * TutorialOverlay - Interactive tutorial overlay for practice mode
 *
 * **Feature: single-player-enhancement**
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**
 */

import type { TutorialStep, TutorialStepContent } from '@/game/bot/TutorialManager'

interface TutorialOverlayProps {
  step: TutorialStep
  content: TutorialStepContent | null
  stepNumber: number
  totalSteps: number
  onSkip: () => void
  onComplete: () => void
}

export function TutorialOverlay({
  step,
  content,
  stepNumber,
  totalSteps,
  onSkip,
  onComplete,
}: TutorialOverlayProps) {
  // Don't render if tutorial is complete
  if (step === 'complete' || !content) {
    return null
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Tutorial panel */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="bg-neutral-900/95 border border-white/10 rounded-2xl p-6 max-w-md backdrop-blur-sm">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs text-neutral-400 uppercase tracking-wider">
                Tutorial
              </span>
            </div>
            <span className="text-xs text-neutral-500">
              Step {stepNumber} of {totalSteps}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-white mb-2">
            {content.title}
          </h3>

          {/* Description */}
          <p className="text-neutral-400 text-sm mb-4">{content.description}</p>

          {/* Instructions */}
          <ul className="space-y-2 mb-4">
            {content.instructions.map((instruction, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-indigo-400 mt-0.5">•</span>
                <span className="text-neutral-300">{instruction}</span>
              </li>
            ))}
          </ul>

          {/* Completion hint */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-4 py-3 mb-4">
            <p className="text-indigo-300 text-sm">{content.completionHint}</p>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < stepNumber
                    ? 'bg-indigo-500'
                    : i === stepNumber - 1
                      ? 'bg-indigo-400'
                      : 'bg-neutral-700'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={onSkip}
              className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Skip Tutorial
            </button>
            <button
              onClick={onComplete}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-500 transition-colors"
            >
              I Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Tutorial prompt shown before starting practice mode
 * **Validates: Requirements 6.1**
 */
interface TutorialPromptProps {
  onAccept: () => void
  onDecline: () => void
}

export function TutorialPrompt({ onAccept, onDecline }: TutorialPromptProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white">
            Welcome to Practice Mode!
          </h2>
        </div>

        <p className="text-neutral-400 mb-6">
          It looks like this is your first time here. Would you like a quick
          tutorial to learn the game mechanics?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 px-4 py-2.5 bg-white/5 text-neutral-300 text-sm font-medium rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
          >
            Skip Tutorial
          </button>
          <button
            onClick={onAccept}
            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Start Tutorial
          </button>
        </div>
      </div>
    </div>
  )
}
