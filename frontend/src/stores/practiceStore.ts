/**
 * Practice Store - Personal best storage with dual persistence
 *
 * Handles localStorage for guest users and API calls for authenticated users.
 *
 * **Feature: single-player-enhancement**
 * **Validates: Requirements 4.1, 4.4, 4.5**
 */

import { create } from 'zustand'
import type { DifficultyLevel, PracticeType } from '@/game/bot/BotConfigManager'

// Personal best record structure
export interface PersonalBestRecord {
  category: string
  difficulty: DifficultyLevel
  practiceType: PracticeType
  score: number
  accuracy: number
  achievedAt: string // ISO timestamp
}

// Guest practice data stored in localStorage
export interface GuestPracticeData {
  personalBests: Record<string, PersonalBestRecord> // key: "category:difficulty:type"
  tutorialCompleted: boolean
  todaySessionCount: number
  lastSessionDate: string // ISO date
}

// Store state
interface PracticeStoreState {
  personalBests: Map<string, PersonalBestRecord>
  tutorialCompleted: boolean
  todaySessionCount: number
  lastSessionDate: string
  isLoading: boolean
  error: string | null
}

// Store actions
interface PracticeStoreActions {
  // Personal best operations
  getPersonalBest: (
    category: string,
    difficulty: DifficultyLevel,
    practiceType: PracticeType
  ) => PersonalBestRecord | null
  setPersonalBest: (record: PersonalBestRecord) => Promise<void>
  isNewPersonalBest: (
    category: string,
    difficulty: DifficultyLevel,
    practiceType: PracticeType,
    score: number
  ) => boolean

  // Tutorial operations
  markTutorialCompleted: () => void
  shouldShowTutorial: () => boolean

  // Session tracking
  incrementSessionCount: () => void
  getDailySessionCount: () => number

  // Persistence
  loadFromStorage: () => void
  saveToStorage: () => void
  syncWithBackend: (token: string) => Promise<void>

  // Reset
  reset: () => void
}

const STORAGE_KEY = 'practice_data'

/**
 * Generate storage key for personal best lookup
 */
export function getPersonalBestKey(
  category: string,
  difficulty: DifficultyLevel,
  practiceType: PracticeType
): string {
  return `${category}:${difficulty}:${practiceType}`
}

/**
 * Check if a score is a new personal best
 * **Property 7: Personal best update condition**
 * **Validates: Requirements 4.1**
 */
export function checkIsNewPersonalBest(
  existingBest: PersonalBestRecord | null,
  newScore: number
): boolean {
  if (existingBest === null) return true
  return newScore > existingBest.score
}

/**
 * Serialize personal best record for localStorage
 * **Property 8: Guest data persistence round-trip**
 * **Validates: Requirements 4.4**
 */
export function serializeRecord(record: PersonalBestRecord): string {
  return JSON.stringify(record)
}

/**
 * Deserialize personal best record from localStorage
 * **Property 8: Guest data persistence round-trip**
 * **Validates: Requirements 4.4**
 */
export function deserializeRecord(json: string): PersonalBestRecord | null {
  try {
    const parsed = JSON.parse(json)
    // Validate required fields
    if (
      typeof parsed.category !== 'string' ||
      typeof parsed.difficulty !== 'string' ||
      typeof parsed.practiceType !== 'string' ||
      typeof parsed.score !== 'number' ||
      typeof parsed.accuracy !== 'number' ||
      typeof parsed.achievedAt !== 'string'
    ) {
      return null
    }
    return parsed as PersonalBestRecord
  } catch {
    return null
  }
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Load guest practice data from localStorage
 */
function loadGuestData(): GuestPracticeData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return {
        personalBests: {},
        tutorialCompleted: false,
        todaySessionCount: 0,
        lastSessionDate: getTodayDate(),
      }
    }
    const data = JSON.parse(stored) as GuestPracticeData

    // Reset session count if it's a new day
    if (data.lastSessionDate !== getTodayDate()) {
      data.todaySessionCount = 0
      data.lastSessionDate = getTodayDate()
    }

    return data
  } catch {
    return {
      personalBests: {},
      tutorialCompleted: false,
      todaySessionCount: 0,
      lastSessionDate: getTodayDate(),
    }
  }
}

/**
 * Save guest practice data to localStorage
 */
function saveGuestData(data: GuestPracticeData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save practice data to localStorage:', e)
  }
}

export const usePracticeStore = create<PracticeStoreState & PracticeStoreActions>(
  (set, get) => ({
    // Initial state
    personalBests: new Map(),
    tutorialCompleted: false,
    todaySessionCount: 0,
    lastSessionDate: getTodayDate(),
    isLoading: false,
    error: null,

    // Get personal best for category/difficulty/type combination
    getPersonalBest: (category, difficulty, practiceType) => {
      const key = getPersonalBestKey(category, difficulty, practiceType)
      return get().personalBests.get(key) || null
    },

    // Set personal best (saves to localStorage for guests)
    setPersonalBest: async (record) => {
      const key = getPersonalBestKey(
        record.category,
        record.difficulty,
        record.practiceType
      )

      set((state) => {
        const newBests = new Map(state.personalBests)
        newBests.set(key, record)
        return { personalBests: newBests }
      })

      // Save to localStorage
      get().saveToStorage()
    },

    // Check if score is a new personal best
    isNewPersonalBest: (category, difficulty, practiceType, score) => {
      const existing = get().getPersonalBest(category, difficulty, practiceType)
      return checkIsNewPersonalBest(existing, score)
    },

    // Mark tutorial as completed
    markTutorialCompleted: () => {
      set({ tutorialCompleted: true })
      get().saveToStorage()
    },

    // Check if tutorial should be shown
    shouldShowTutorial: () => {
      return !get().tutorialCompleted
    },

    // Increment daily session count
    incrementSessionCount: () => {
      const today = getTodayDate()
      set((state) => {
        // Reset count if new day
        if (state.lastSessionDate !== today) {
          return {
            todaySessionCount: 1,
            lastSessionDate: today,
          }
        }
        return {
          todaySessionCount: state.todaySessionCount + 1,
        }
      })
      get().saveToStorage()
    },

    // Get daily session count
    getDailySessionCount: () => {
      const today = getTodayDate()
      const state = get()
      if (state.lastSessionDate !== today) {
        return 0
      }
      return state.todaySessionCount
    },

    // Load from localStorage
    loadFromStorage: () => {
      const data = loadGuestData()

      const bests = new Map<string, PersonalBestRecord>()
      for (const [key, record] of Object.entries(data.personalBests)) {
        bests.set(key, record)
      }

      set({
        personalBests: bests,
        tutorialCompleted: data.tutorialCompleted,
        todaySessionCount: data.todaySessionCount,
        lastSessionDate: data.lastSessionDate,
      })
    },

    // Save to localStorage
    saveToStorage: () => {
      const state = get()
      const personalBests: Record<string, PersonalBestRecord> = {}

      state.personalBests.forEach((record, key) => {
        personalBests[key] = record
      })

      const data: GuestPracticeData = {
        personalBests,
        tutorialCompleted: state.tutorialCompleted,
        todaySessionCount: state.todaySessionCount,
        lastSessionDate: state.lastSessionDate,
      }

      saveGuestData(data)
    },

    // Sync with backend for authenticated users
    syncWithBackend: async (token) => {
      set({ isLoading: true, error: null })

      try {
        // Fetch personal bests from backend
        const response = await fetch('/api/v1/practice/personal-bests', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch personal bests')
        }

        const data = await response.json()
        const bests = new Map<string, PersonalBestRecord>()

        for (const record of data.personal_bests || []) {
          const key = getPersonalBestKey(
            record.category,
            record.difficulty,
            record.practice_type
          )
          bests.set(key, {
            category: record.category,
            difficulty: record.difficulty,
            practiceType: record.practice_type,
            score: record.score,
            accuracy: record.accuracy,
            achievedAt: record.achieved_at,
          })
        }

        set({ personalBests: bests, isLoading: false })
      } catch (e) {
        set({
          error: e instanceof Error ? e.message : 'Unknown error',
          isLoading: false,
        })
      }
    },

    // Reset store
    reset: () => {
      set({
        personalBests: new Map(),
        tutorialCompleted: false,
        todaySessionCount: 0,
        lastSessionDate: getTodayDate(),
        isLoading: false,
        error: null,
      })
    },
  })
)

// Initialize store from localStorage on module load
if (typeof window !== 'undefined') {
  usePracticeStore.getState().loadFromStorage()
}
