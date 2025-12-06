/**
 * PersonalityQuiz - Era Match quiz
 */

import { useState } from 'react'
import { personalityQuestions, getPersonalityResult } from '@/data/fortnite-quiz-data'

interface PersonalityQuizProps {
  onBack: () => void
}

export function PersonalityQuiz({ onBack }: PersonalityQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [traits, setTraits] = useState<Record<string, number>>({})
  const [result, setResult] = useState<ReturnType<typeof getPersonalityResult> | null>(null)

  const currentQuestion = personalityQuestions[currentIndex]
  const progress = (currentIndex / personalityQuestions.length) * 100

  const handleAnswer = (optionIndex: number) => {
    const option = currentQuestion.options[optionIndex]
    const newTraits = { ...traits }

    Object.entries(option.traits).forEach(([trait, value]) => {
      newTraits[trait] = (newTraits[trait] || 0) + value
    })

    setTraits(newTraits)

    if (currentIndex < personalityQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setResult(getPersonalityResult(newTraits))
    }
  }

  if (result) {
    return (
      <div>
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
            Your Fortnite Era
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{result.era}</h1>
        </div>

        {/* Description */}
        <div className="p-6 bg-white/[0.02] border border-white/[0.08] rounded-lg mb-8">
          <p className="text-neutral-300 leading-relaxed">{result.description}</p>
        </div>

        {/* Signature skins */}
        <div className="mb-10">
          <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-4">
            Signature Cosmetics
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.skins.map((skin) => (
              <span
                key={skin}
                className="px-3 py-1.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-md text-neutral-300"
              >
                {skin}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-3 text-sm text-neutral-400 bg-white/[0.02] border border-white/[0.08] rounded-lg hover:bg-white/[0.04] hover:text-white transition-all"
          >
            Back to Menu
          </button>
          <button
            onClick={() => {
              setCurrentIndex(0)
              setTraits({})
              setResult(null)
            }}
            className="flex-1 py-3 text-sm font-medium bg-white text-black rounded-lg hover:bg-neutral-200 transition-all"
          >
            Retake
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="text-sm text-neutral-500 hover:text-white transition-colors mb-6"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">Era Match</h1>
        <p className="text-neutral-500 mt-2">Discover your Fortnite personality</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-neutral-500 mb-2">
          <span>
            Question {currentIndex + 1} of {personalityQuestions.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-0.5 bg-white/[0.08] rounded-full overflow-hidden">
          <div
            className="h-full bg-white/40 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h2 className="text-xl font-medium text-white leading-relaxed mb-6">
          {currentQuestion.question}
        </h2>

        <div className="space-y-2">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              className="w-full p-4 rounded-lg border bg-white/[0.02] border-white/[0.08] text-left hover:bg-white/[0.04] hover:border-white/[0.12] transition-all"
            >
              <span className="text-white">{option.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
