/**
 * PracticeSetupScreen - Setup screen for practice mode with difficulty and type selection
 *
 * **Feature: single-player-enhancement**
 * **Validates: Requirements 1.1, 1.5, 2.1, 2.5, 4.2, 6.1**
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCategories } from '@/hooks/useCategories'
import { usePracticeStore } from '@/stores/practiceStore'
import {
  type DifficultyLevel,
  type PracticeType,
  getAllDifficultyLevels,
  getAllPracticeTypes,
} from '@/game/bot/BotConfigManager'
import { TutorialPrompt } from './TutorialOverlay'
import type { MapConfig } from '@/game/config/maps'

interface PracticeSetupScreenProps {
  availableMaps: Array<{
    id: string
    name: string
    description: string
    config: MapConfig
  }>
  selectedMap: MapConfig
  onMapSelect: (config: MapConfig) => void
  selectedCategory: string
  onCategorySelect: (category: string) => void
  selectedDifficulty: DifficultyLevel
  onDifficultySelect: (difficulty: DifficultyLevel) => void
  selectedPracticeType: PracticeType
  onPracticeTypeSelect: (type: PracticeType) => void
  onStartGame: () => void
  isLoading: boolean
  error: string | null
  onRetry: () => void
  isGuest: boolean
}

const DIFFICULTY_INFO: Record<
  DifficultyLevel,
  { label: string; description: string; color: string }
> = {
  easy: {
    label: 'Easy',
    description: 'Bot accuracy 40%, slower reactions',
    color: 'emerald',
  },
  medium: {
    label: 'Medium',
    description: 'Bot accuracy 55%, balanced challenge',
    color: 'amber',
  },
  hard: {
    label: 'Hard',
    description: 'Bot accuracy 75%, fast reactions',
    color: 'red',
  },
}

const PRACTICE_TYPE_INFO: Record<
  PracticeType,
  { label: string; description: string }
> = {
  quiz_only: {
    label: 'Quiz Only',
    description: 'Rapid-fire trivia, no combat',
  },
  combat_only: {
    label: 'Combat Only',
    description: 'Arena combat with respawning',
  },
  full_game: {
    label: 'Full Game',
    description: 'Quiz + combat, like multiplayer',
  },
}

export function PracticeSetupScreen({
  availableMaps,
  selectedMap,
  onMapSelect,
  selectedCategory,
  onCategorySelect,
  selectedDifficulty,
  onDifficultySelect,
  selectedPracticeType,
  onPracticeTypeSelect,
  onStartGame,
  isLoading,
  error,
  onRetry,
  isGuest,
}: PracticeSetupScreenProps) {
  const navigate = useNavigate()
  const { categories, isLoading: categoriesLoading } = useCategories()
  const practiceStore = usePracticeStore()

  // Tutorial prompt state
  const [showTutorialPrompt, setShowTutorialPrompt] = useState(false)

  // Check if should show tutorial on mount
  useEffect(() => {
    if (practiceStore.shouldShowTutorial()) {
      setShowTutorialPrompt(true)
    }
  }, [])

  // Get personal best for current selection
  const personalBest = practiceStore.getPersonalBest(
    selectedCategory,
    selectedDifficulty,
    selectedPracticeType
  )

  const handleTutorialAccept = () => {
    setShowTutorialPrompt(false)
    onStartGame()
  }

  const handleTutorialDecline = () => {
    setShowTutorialPrompt(false)
    practiceStore.markTutorialCompleted()
  }

  const handleStartGame = () => {
    if (practiceStore.shouldShowTutorial()) {
      setShowTutorialPrompt(true)
    } else {
      onStartGame()
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-4 py-8">
      {/* Tutorial prompt modal */}
      {showTutorialPrompt && (
        <TutorialPrompt
          onAccept={handleTutorialAccept}
          onDecline={handleTutorialDecline}
        />
      )}

      <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">
        Practice Mode
      </h1>
      <p className="text-neutral-500 mb-6 text-center max-w-md text-sm">
        Practice your skills against an AI opponent. Customize difficulty and
        game mode.
      </p>

      {/* Difficulty Selection */}
      <div className="w-full max-w-md mb-6">
        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3 text-center">
          Select Difficulty
        </p>
        <div className="grid grid-cols-3 gap-3">
          {getAllDifficultyLevels().map((level) => {
            const info = DIFFICULTY_INFO[level]
            const isSelected = selectedDifficulty === level
            return (
              <button
                key={level}
                onClick={() => onDifficultySelect(level)}
                className={`p-3 rounded-xl border transition-all text-center ${
                  isSelected
                    ? `bg-${info.color}-500/20 border-${info.color}-500/40 ring-1 ring-${info.color}-500/30`
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mx-auto mb-2 ${
                    isSelected ? `bg-${info.color}-400` : 'bg-neutral-600'
                  }`}
                />
                <span className="text-sm font-medium text-white">
                  {info.label}
                </span>
                <p className="text-xs text-neutral-500 mt-1">
                  {info.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Practice Type Selection */}
      <div className="w-full max-w-md mb-6">
        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3 text-center">
          Select Mode
        </p>
        <div className="grid grid-cols-3 gap-3">
          {getAllPracticeTypes().map((type) => {
            const info = PRACTICE_TYPE_INFO[type]
            const isSelected = selectedPracticeType === type
            return (
              <button
                key={type}
                onClick={() => onPracticeTypeSelect(type)}
                className={`p-3 rounded-xl border transition-all text-center ${
                  isSelected
                    ? 'bg-indigo-500/20 border-indigo-500/40 ring-1 ring-indigo-500/30'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mx-auto mb-2 ${
                    isSelected ? 'bg-indigo-400' : 'bg-neutral-600'
                  }`}
                />
                <span className="text-sm font-medium text-white">
                  {info.label}
                </span>
                <p className="text-xs text-neutral-500 mt-1">
                  {info.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Category Selection */}
      <div className="w-full max-w-md mb-6">
        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3 text-center">
          Select Category
        </p>
        <div className="grid grid-cols-2 gap-3">
          {categoriesLoading ? (
            <div className="col-span-2 text-center py-4 text-neutral-500 text-sm">
              Loading categories...
            </div>
          ) : (
            categories.map((cat) => {
              const hasQuestions = cat.question_count > 0
              return (
                <button
                  key={cat.slug}
                  onClick={() => hasQuestions && onCategorySelect(cat.slug)}
                  disabled={!hasQuestions}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    !hasQuestions
                      ? 'bg-white/[0.01] border-white/[0.03] opacity-50 cursor-not-allowed'
                      : selectedCategory === cat.slug
                        ? 'bg-indigo-500/20 border-indigo-500/40 ring-1 ring-indigo-500/30'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        !hasQuestions
                          ? 'bg-neutral-700'
                          : selectedCategory === cat.slug
                            ? 'bg-indigo-400'
                            : 'bg-neutral-600'
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${hasQuestions ? 'text-white' : 'text-neutral-500'}`}
                    >
                      {cat.name}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {hasQuestions
                      ? `${cat.question_count.toLocaleString()} questions`
                      : 'No questions available'}
                  </p>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Map Selection */}
      <div className="w-full max-w-md mb-6">
        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3 text-center">
          Select Map
        </p>
        <div className="grid grid-cols-2 gap-3">
          {availableMaps.map((map) => (
            <button
              key={map.id}
              onClick={() => onMapSelect(map.config)}
              className={`p-4 rounded-xl border transition-all text-left ${
                selectedMap === map.config
                  ? 'bg-white/[0.08] border-white/20 ring-1 ring-white/20'
                  : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    selectedMap === map.config
                      ? 'bg-emerald-400'
                      : 'bg-neutral-600'
                  }`}
                />
                <span className="text-sm font-medium text-white">
                  {map.name}
                </span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                {map.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Personal Best Display */}
      {personalBest && (
        <div className="w-full max-w-md mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-400 uppercase tracking-wider mb-1">
                Personal Best
              </p>
              <p className="text-2xl font-bold text-white tabular-nums">
                {personalBest.score.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-500">Accuracy</p>
              <p className="text-lg font-semibold text-amber-400">
                {personalBest.accuracy?.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="w-full max-w-md mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400 text-sm text-center mb-3">{error}</p>
          <button
            onClick={onRetry}
            className="w-full px-4 py-2 bg-red-500/20 text-red-300 text-sm font-medium rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleStartGame}
          disabled={isLoading || !!error}
          className="px-6 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Loading...' : 'Start Game'}
        </button>
        <button
          onClick={() => navigate(isGuest ? '/' : '/dashboard')}
          className="px-6 py-2.5 bg-white/[0.06] text-neutral-300 text-sm font-medium rounded-lg border border-white/[0.1] hover:bg-white/[0.1] transition-colors"
        >
          Back
        </button>
      </div>

      {/* Guest mode hint */}
      {isGuest && (
        <p className="text-xs text-neutral-500 mt-4 text-center">
          Playing as guest ·{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-blue-500 hover:text-blue-400"
          >
            Sign up
          </button>{' '}
          to track stats & earn rewards
        </p>
      )}
    </div>
  )
}
