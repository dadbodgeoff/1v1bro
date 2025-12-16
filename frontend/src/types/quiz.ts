/**
 * Fortnite Quiz Types
 * Types for the dynamic quiz and survey system
 */

export type QuizDifficulty = 'casual' | 'moderate' | 'expert' | 'legendary' | 'impossible'
export type QuizCategory = 'seasons' | 'events' | 'skins' | 'weapons' | 'esports' | 'collabs' | 'maps' | 'mixed' | 'nfl' | 'general' | 'history' | 'cosmetics' | 'gameplay' | 'lore' | 'competitive' | 'movies'
export type QuizMode = 'classic' | 'speed' | 'era-battle' | 'timeline' | 'personality'

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: QuizDifficulty
  category: QuizCategory
  points: number
  chapter?: number
  season?: number
  year?: number
  tags: string[]
}

export interface TimelineQuestion {
  id: string
  events: string[]
  correctOrder: number[]
  difficulty: QuizDifficulty
  points: number
}

export interface EraBattleQuestion {
  id: string
  question: string
  seasonA: { chapter: number; season: number; name: string }
  seasonB: { chapter: number; season: number; name: string }
  correctAnswer: 'A' | 'B' | 'tie'
  explanation: string
  points: number
}

export interface PersonalityQuestion {
  id: string
  question: string
  options: { text: string; traits: Record<string, number> }[]
}

export interface QuizConfig {
  mode: QuizMode
  difficulty?: QuizDifficulty
  category?: QuizCategory
  questionCount: number
  timeLimit?: number // seconds per question, 0 = no limit
  chapter?: number // filter by specific chapter
}

export interface QuizState {
  config: QuizConfig
  questions: QuizQuestion[]
  currentIndex: number
  answers: (number | null)[]
  score: number
  startTime: number
  questionStartTime: number
  isComplete: boolean
}

export interface QuizResult {
  score: number
  maxScore: number
  percentage: number
  correctCount: number
  totalQuestions: number
  timeSpent: number
  difficulty: QuizDifficulty
  rank: string
  breakdown: {
    category: QuizCategory
    correct: number
    total: number
  }[]
}

export interface PersonalityResult {
  era: string
  description: string
  matchPercentage: number
  traits: Record<string, number>
  recommendedSkins: string[]
}

export interface SurveyQuestion {
  id: string
  type: 'rating' | 'choice' | 'ranking' | 'agree-disagree'
  question: string
  options?: string[]
  category: string
}

export interface SurveyResponse {
  questionId: string
  answer: string | number | string[]
}
