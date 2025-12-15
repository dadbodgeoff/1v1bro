/**
 * CategorySelector - Pre-game trivia category selection
 * 
 * Allows players to choose their trivia category before starting a run.
 * Supports extensible categories with icons and descriptions.
 */

import React, { memo } from 'react'
import type { TriviaCategory } from '../world/TriviaQuestionProvider'

export interface CategoryOption {
  id: TriviaCategory
  name: string
  description: string
  icon: string
  color: string
  questionCount?: number
}

// Available categories - easily extensible
export const TRIVIA_CATEGORIES: CategoryOption[] = [
  {
    id: 'fortnite',
    name: 'Fortnite',
    description: 'Battle Royale, skins, weapons & lore',
    icon: '🎮',
    color: 'from-purple-500 to-blue-500',
    questionCount: 500,
  },
  {
    id: 'nfl',
    name: 'NFL',
    description: 'Teams, players, stats & history',
    icon: '🏈',
    color: 'from-green-500 to-emerald-500',
    questionCount: 300,
  },
  {
    id: 'mixed',
    name: 'Mixed',
    description: 'Random mix of all categories',
    icon: '🎲',
    color: 'from-orange-500 to-amber-500',
  },
]

export interface CategorySelectorProps {
  selectedCategory: TriviaCategory
  onSelect: (category: TriviaCategory) => void
  disabled?: boolean
}

const CategoryCard = memo(({
  category,
  isSelected,
  onSelect,
  disabled,
}: {
  category: CategoryOption
  isSelected: boolean
  onSelect: () => void
  disabled?: boolean
}) => (
  <button
    onClick={onSelect}
    disabled={disabled}
    className={`
      relative w-full p-4 rounded-xl border-2 transition-all duration-200
      ${isSelected 
        ? `border-white/50 bg-gradient-to-br ${category.color} bg-opacity-20 scale-[1.02] shadow-lg` 
        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
      }
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    {/* Selected indicator */}
    {isSelected && (
      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center">
        <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    )}
    
    <div className="flex items-start gap-3">
      {/* Icon */}
      <span className="text-3xl">{category.icon}</span>
      
      {/* Content */}
      <div className="flex-1 text-left">
        <h3 className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-gray-200'}`}>
          {category.name}
        </h3>
        <p className="text-sm text-gray-400 mt-0.5">
          {category.description}
        </p>
        {category.questionCount && (
          <p className="text-xs text-gray-500 mt-1">
            {category.questionCount}+ questions
          </p>
        )}
      </div>
    </div>
  </button>
))
CategoryCard.displayName = 'CategoryCard'

export const CategorySelector: React.FC<CategorySelectorProps> = memo(({
  selectedCategory,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-white">Choose Your Trivia</h3>
        <p className="text-sm text-gray-400">Answer questions to earn bonus points</p>
      </div>
      
      <div className="grid gap-3">
        {TRIVIA_CATEGORIES.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            isSelected={selectedCategory === category.id}
            onSelect={() => onSelect(category.id)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
})
CategorySelector.displayName = 'CategorySelector'

export default CategorySelector
