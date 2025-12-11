/**
 * MilestoneSystem - Detects and tracks guest player achievements
 * 
 * Provides deterministic milestone detection based on session statistics.
 * Milestones encourage continued play and provide conversion hooks.
 * 
 * @module game/guest/MilestoneSystem
 * Requirements: 4.2
 */

import type { GuestSessionStats } from './GuestSessionManager'

/**
 * Milestone definition
 */
export interface GuestMilestone {
  id: string
  name: string
  description: string
  xpBonus: number
  icon: string
}

/**
 * Milestone condition function type
 */
type MilestoneCondition = (stats: GuestSessionStats) => boolean

/**
 * Internal milestone definition with condition
 */
interface MilestoneDefinition extends GuestMilestone {
  condition: MilestoneCondition
}

/**
 * All available milestones with their conditions
 */
const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  {
    id: 'first_match',
    name: 'First Steps',
    description: 'Complete your first match',
    xpBonus: 50,
    icon: '🎮',
    condition: (stats) => stats.matchesPlayed >= 1,
  },
  {
    id: 'first_win',
    name: 'Victory!',
    description: 'Win your first match',
    xpBonus: 100,
    icon: '🏆',
    condition: (stats) => stats.matchesWon >= 1,
  },
  {
    id: 'three_matches',
    name: 'Getting Warmed Up',
    description: 'Complete 3 matches',
    xpBonus: 75,
    icon: '🔥',
    condition: (stats) => stats.matchesPlayed >= 3,
  },
  {
    id: 'five_matches',
    name: 'Dedicated Player',
    description: 'Complete 5 matches',
    xpBonus: 150,
    icon: '⭐',
    condition: (stats) => stats.matchesPlayed >= 5,
  },
  {
    id: 'first_kill',
    name: 'First Blood',
    description: 'Eliminate your first opponent',
    xpBonus: 25,
    icon: '🎯',
    condition: (stats) => stats.totalKills >= 1,
  },
  {
    id: 'five_kills',
    name: 'Sharpshooter',
    description: 'Eliminate 5 opponents total',
    xpBonus: 75,
    icon: '🔫',
    condition: (stats) => stats.totalKills >= 5,
  },
  {
    id: 'ten_kills',
    name: 'Marksman',
    description: 'Eliminate 10 opponents total',
    xpBonus: 150,
    icon: '💥',
    condition: (stats) => stats.totalKills >= 10,
  },
  {
    id: 'quiz_master',
    name: 'Quiz Master',
    description: 'Answer 10 questions correctly',
    xpBonus: 100,
    icon: '🧠',
    condition: (stats) => stats.questionsCorrect >= 10,
  },
  {
    id: 'perfect_accuracy',
    name: 'Perfect Round',
    description: 'Answer 5+ questions with 80%+ accuracy',
    xpBonus: 125,
    icon: '💯',
    condition: (stats) => 
      stats.questionsAnswered >= 5 && 
      (stats.questionsCorrect / stats.questionsAnswered) >= 0.8,
  },
  {
    id: 'category_explorer',
    name: 'Category Explorer',
    description: 'Play matches in 3 different categories',
    xpBonus: 100,
    icon: '🗺️',
    condition: (stats) => stats.categoriesPlayed.length >= 3,
  },
  {
    id: 'xp_collector',
    name: 'XP Collector',
    description: 'Earn 500 preview XP',
    xpBonus: 50,
    icon: '✨',
    condition: (stats) => stats.previewXpEarned >= 500,
  },
  {
    id: 'xp_hoarder',
    name: 'XP Hoarder',
    description: 'Earn 1000 preview XP',
    xpBonus: 100,
    icon: '💎',
    condition: (stats) => stats.previewXpEarned >= 1000,
  },
]

/**
 * Check which milestones are achieved for given stats
 * 
 * Pure function for deterministic milestone detection.
 * Returns all milestones that the stats qualify for.
 */
export function checkMilestones(stats: GuestSessionStats): GuestMilestone[] {
  return MILESTONE_DEFINITIONS
    .filter(m => m.condition(stats))
    .map(({ condition: _, ...milestone }) => milestone)
}

/**
 * Get newly achieved milestones (not already in achieved list)
 */
export function getNewMilestones(
  stats: GuestSessionStats,
  alreadyAchieved: string[]
): GuestMilestone[] {
  return checkMilestones(stats)
    .filter(m => !alreadyAchieved.includes(m.id))
}

/**
 * Get milestone by ID
 */
export function getMilestoneById(id: string): GuestMilestone | undefined {
  const def = MILESTONE_DEFINITIONS.find(m => m.id === id)
  if (!def) return undefined
  const { condition: _, ...milestone } = def
  return milestone
}

/**
 * Get all available milestones (without conditions)
 */
export function getAllMilestones(): GuestMilestone[] {
  return MILESTONE_DEFINITIONS.map(({ condition: _, ...m }) => m)
}

/**
 * Calculate total XP bonus from achieved milestones
 */
export function calculateMilestoneXpBonus(achievedIds: string[]): number {
  return achievedIds.reduce((total, id) => {
    const milestone = getMilestoneById(id)
    return total + (milestone?.xpBonus ?? 0)
  }, 0)
}
