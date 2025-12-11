/**
 * BotQuizBehavior - Handles bot quiz answering logic
 * Extracted from BotGame.tsx to reduce component complexity
 */

export interface BotQuizConfig {
  quizAccuracy: number    // 0-1, chance to answer correctly
  minAnswerTime: number   // ms minimum time to answer
  maxAnswerTime: number   // ms maximum time to answer
}

export const DEFAULT_BOT_QUIZ_CONFIG: BotQuizConfig = {
  quizAccuracy: 0.55,
  minAnswerTime: 2500,
  maxAnswerTime: 8000,
}

export interface BotAnswer {
  answer: string
  timeMs: number
}

export interface QuizQuestion {
  correct_answer: string
  options: string[]
}

/**
 * Calculate bot's answer for a question
 * Returns the answer choice and simulated response time
 */
export function calculateBotAnswer(
  question: QuizQuestion,
  config: BotQuizConfig = DEFAULT_BOT_QUIZ_CONFIG
): BotAnswer {
  const timeMs = config.minAnswerTime + Math.random() * (config.maxAnswerTime - config.minAnswerTime)
  const isCorrect = Math.random() < config.quizAccuracy
  
  let answer: string
  if (isCorrect) {
    answer = question.correct_answer
  } else {
    const wrongAnswers = ['A', 'B', 'C', 'D'].filter(a => a !== question.correct_answer)
    answer = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)]
  }
  
  return { answer, timeMs }
}

/**
 * Calculate score for an answer
 * Faster correct answers get higher scores
 */
export function calculateAnswerScore(
  answer: string,
  correctAnswer: string,
  timeMs: number
): number {
  if (answer !== correctAnswer) return 0
  return Math.max(100, 1000 - Math.floor(timeMs / 30))
}

/**
 * Get the text of the correct answer from options
 */
export function getCorrectAnswerText(question: QuizQuestion): string {
  const index = question.correct_answer.charCodeAt(0) - 65
  return question.options[index] || question.correct_answer
}
