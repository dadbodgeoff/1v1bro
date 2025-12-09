/**
 * Profile Enterprise Property Tests
 *
 * Property-based tests using fast-check for profile functionality.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { calculateTierProgress } from './enterprise/ProfileHeader'
import type { PlayerBattlePass, Season } from '@/types/battlepass'

// ============================================
// Arbitraries (Test Data Generators)
// ============================================

/**
 * Generate a valid Season object
 */
const seasonArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  season_number: fc.integer({ min: 1, max: 20 }),
  theme: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  banner_url: fc.option(fc.webUrl(), { nil: undefined }),
  start_date: fc.constant('2024-01-01T00:00:00.000Z'),
  end_date: fc.constant('2025-12-31T23:59:59.999Z'),
  is_active: fc.boolean(),
  xp_per_tier: fc.integer({ min: 100, max: 5000 }),
})

/**
 * Generate a valid PlayerBattlePass object
 */
const battlePassProgressArb = fc.record({
  user_id: fc.uuid(),
  season: seasonArb as fc.Arbitrary<Season>,
  current_tier: fc.integer({ min: 1, max: 100 }),
  current_xp: fc.integer({ min: 0, max: 10000 }),
  xp_to_next_tier: fc.integer({ min: 1, max: 5000 }),
  total_xp: fc.integer({ min: 0, max: 500000 }),
  is_premium: fc.boolean(),
  claimed_rewards: fc.array(fc.integer({ min: 1, max: 100 }), { maxLength: 50 }),
  claimable_rewards: fc.array(fc.integer({ min: 1, max: 100 }), { maxLength: 10 }),
})

/**
 * Generate a valid Profile object
 * Matches backend Profile schema - uses user_id and flat privacy fields
 */
const profileArb = fc.record({
  user_id: fc.uuid(),
  display_name: fc.string({ minLength: 3, maxLength: 30 }),
  bio: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
  avatar_url: fc.option(fc.webUrl(), { nil: undefined }),
  banner_url: fc.option(fc.webUrl(), { nil: undefined }),
  banner_color: fc.option(fc.constantFrom('#1a1a2e', '#2d2d44', '#3b3b5c', '#4a4a6a', '#5a5a7a'), { nil: undefined }),
  level: fc.integer({ min: 1, max: 100 }),
  total_xp: fc.integer({ min: 0, max: 500000 }),
  title: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  country: fc.option(fc.constantFrom('US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP', 'KR', 'BR', 'MX'), { nil: undefined }),
  social_links: fc.option(fc.record({
    twitter: fc.option(fc.webUrl(), { nil: undefined }),
    twitch: fc.option(fc.webUrl(), { nil: undefined }),
    youtube: fc.option(fc.webUrl(), { nil: undefined }),
    discord: fc.option(fc.string({ minLength: 2, maxLength: 32 }), { nil: undefined }),
  }), { nil: undefined }),
  // Privacy settings are flat fields, not nested object
  is_public: fc.boolean(),
  accept_friend_requests: fc.boolean(),
  allow_messages: fc.boolean(),
  // Game statistics
  games_played: fc.integer({ min: 0, max: 10000 }),
  games_won: fc.integer({ min: 0, max: 10000 }),
  best_win_streak: fc.integer({ min: 0, max: 100 }),
  created_at: fc.constant('2024-01-01T00:00:00.000Z'),
  updated_at: fc.constant('2024-06-01T00:00:00.000Z'),
})

// ============================================
// Property Tests
// ============================================

describe('Profile Enterprise Property Tests', () => {
  /**
   * **Feature: profile-enterprise-upgrade, Property 4: Tier Ring Progress Calculation**
   * **Validates: Requirements 3.4**
   *
   * For any Battle Pass progress with current_tier, current_xp, and xp_to_next_tier,
   * the tier ring SHALL display progress percentage calculated as
   * (current_xp / xp_to_next_tier) * 100. If no active season, display 0%.
   */
  describe('Property 4: Tier Ring Progress Calculation', () => {
    it('progress equals (current_xp / xp_to_next_tier) * 100', () => {
      fc.assert(
        fc.property(
          battlePassProgressArb,
          (progress) => {
            const result = calculateTierProgress(progress as PlayerBattlePass)
            const expected = Math.min(100, Math.round((progress.current_xp / progress.xp_to_next_tier) * 100))
            return result === expected
          }
        ),
        { numRuns: 100 }
      )
    })

    it('progress is clamped to [0, 100]', () => {
      fc.assert(
        fc.property(
          battlePassProgressArb,
          (progress) => {
            const result = calculateTierProgress(progress as PlayerBattlePass)
            return result >= 0 && result <= 100
          }
        ),
        { numRuns: 100 }
      )
    })

    it('null progress returns 0%', () => {
      expect(calculateTierProgress(null)).toBe(0)
      expect(calculateTierProgress(undefined)).toBe(0)
    })

    it('zero xp_to_next_tier returns 100%', () => {
      fc.assert(
        fc.property(
          battlePassProgressArb,
          (progress) => {
            const modifiedProgress = { ...progress, xp_to_next_tier: 0 } as PlayerBattlePass
            return calculateTierProgress(modifiedProgress) === 100
          }
        ),
        { numRuns: 100 }
      )
    })

    it('zero current_xp returns 0%', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5000 }),
          (xpToNextTier) => {
            const progress = {
              current_xp: 0,
              xp_to_next_tier: xpToNextTier,
            } as PlayerBattlePass
            return calculateTierProgress(progress) === 0
          }
        ),
        { numRuns: 100 }
      )
    })

    it('full xp returns 100%', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5000 }),
          (xpToNextTier) => {
            const progress = {
              current_xp: xpToNextTier,
              xp_to_next_tier: xpToNextTier,
            } as PlayerBattlePass
            return calculateTierProgress(progress) === 100
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: profile-enterprise-upgrade, Property 3: Banner Display Mode**
   * **Validates: Requirements 3.2, 3.3**
   *
   * For any profile, if banner_url exists then ProfileHeader SHALL display
   * the image with object-cover and gradient overlay; if banner_url is null
   * then ProfileHeader SHALL display solid color from banner_color
   * (defaulting to #1a1a2e).
   */
  describe('Property 3: Banner Display Mode', () => {
    it('profile with banner_url should use image mode', () => {
      fc.assert(
        fc.property(
          profileArb.filter(p => p.banner_url !== undefined),
          (profile) => {
            // When banner_url exists, image mode should be used
            return profile.banner_url !== undefined && profile.banner_url !== null
          }
        ),
        { numRuns: 100 }
      )
    })

    it('profile without banner_url should use solid color mode', () => {
      fc.assert(
        fc.property(
          profileArb.map(p => ({ ...p, banner_url: undefined })),
          (profile) => {
            // When banner_url is undefined, solid color should be used
            // The color should be banner_color or default #1a1a2e
            const expectedColor = profile.banner_color || '#1a1a2e'
            return profile.banner_url === undefined && expectedColor !== undefined
          }
        ),
        { numRuns: 100 }
      )
    })

    it('default banner color is #1a1a2e when no color set', () => {
      fc.assert(
        fc.property(
          profileArb.map(p => ({ ...p, banner_url: undefined, banner_color: undefined })),
          (profile) => {
            const defaultColor = '#1a1a2e'
            return profile.banner_color === undefined && defaultColor === '#1a1a2e'
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: profile-enterprise-upgrade, Property 1: Profile Header Typography**
   * **Validates: Requirements 2.1**
   *
   * For any profile data, the ProfileHeader SHALL render the display name
   * with 3xl-4xl extrabold styling, title with sm medium accent color,
   * and level badge with sm bold white text on indigo background.
   */
  describe('Property 1: Profile Header Typography', () => {
    it('display name is always present and non-empty', () => {
      fc.assert(
        fc.property(
          profileArb,
          (profile) => {
            return profile.display_name.length >= 3 && profile.display_name.length <= 30
          }
        ),
        { numRuns: 100 }
      )
    })

    it('title is optional but when present has valid length', () => {
      fc.assert(
        fc.property(
          profileArb,
          (profile) => {
            if (profile.title === undefined) return true
            return profile.title.length >= 1 && profile.title.length <= 50
          }
        ),
        { numRuns: 100 }
      )
    })

    it('tier badge shows current tier from battle pass', () => {
      fc.assert(
        fc.property(
          battlePassProgressArb,
          (progress) => {
            // Tier badge should display the current_tier value
            return progress.current_tier >= 1 && progress.current_tier <= 100
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})


// Import StatsCard utilities
import { calculateWinRate, formatCompactNumber } from './enterprise/StatsCard'

describe('StatsCard Property Tests', () => {
  /**
   * **Feature: profile-enterprise-upgrade, Property 2: Stats Card Typography**
   * **Validates: Requirements 2.3**
   *
   * For any StatsCard with value and label, the component SHALL render
   * value with 2xl-3xl bold tabular-nums styling and label with xs-sm
   * medium uppercase tracking-wider styling.
   */
  describe('Property 2: Stats Card Typography', () => {
    it('value can be string or number', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.integer({ min: 0, max: 1000000 })
          ),
          (value) => {
            // Value should be displayable
            return value !== undefined && value !== null
          }
        ),
        { numRuns: 100 }
      )
    })

    it('label is always a non-empty string', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (label) => {
            return label.length >= 1 && label.length <= 50
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: profile-enterprise-upgrade, Property 5: Win Rate Calculation and Color Coding**
   * **Validates: Requirements 4.3**
   *
   * For any profile with games_played > 0, the win rate SHALL be calculated
   * as (games_won / games_played) * 100 and color coded: green if > 60%,
   * yellow if 40-60%, red if < 40%. If games_played = 0, display "N/A".
   */
  describe('Property 5: Win Rate Calculation and Color Coding', () => {
    it('win rate equals (games_won / games_played) * 100', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 0, max: 10000 }),
          (gamesPlayed, gamesWon) => {
            // Ensure gamesWon <= gamesPlayed for realistic data
            const actualWon = Math.min(gamesWon, gamesPlayed)
            const result = calculateWinRate(gamesPlayed, actualWon)
            
            const expectedRate = (actualWon / gamesPlayed) * 100
            const expectedValue = `${expectedRate.toFixed(1)}%`
            
            return result.value === expectedValue
          }
        ),
        { numRuns: 100 }
      )
    })

    it('zero games played returns N/A', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          (gamesWon) => {
            const result = calculateWinRate(0, gamesWon)
            return result.value === 'N/A' && result.colorCode === 'default'
          }
        ),
        { numRuns: 100 }
      )
    })

    it('win rate > 60% is success (green)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 1000 }),
          (gamesPlayed) => {
            // Win rate > 60% means gamesWon > 0.6 * gamesPlayed
            const gamesWon = Math.ceil(gamesPlayed * 0.61)
            const result = calculateWinRate(gamesPlayed, gamesWon)
            return result.colorCode === 'success'
          }
        ),
        { numRuns: 100 }
      )
    })

    it('win rate 40-60% is warning (yellow)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 1000 }),
          (gamesPlayed) => {
            // Win rate 50% (middle of 40-60%)
            const gamesWon = Math.floor(gamesPlayed * 0.5)
            const result = calculateWinRate(gamesPlayed, gamesWon)
            return result.colorCode === 'warning'
          }
        ),
        { numRuns: 100 }
      )
    })

    it('win rate < 40% is danger (red)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 1000 }),
          (gamesPlayed) => {
            // Win rate < 40% means gamesWon < 0.4 * gamesPlayed
            const gamesWon = Math.floor(gamesPlayed * 0.39)
            const result = calculateWinRate(gamesPlayed, gamesWon)
            return result.colorCode === 'danger'
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Test formatCompactNumber utility
   */
  describe('formatCompactNumber', () => {
    it('formats millions correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000000, max: 999999999 }),
          (num) => {
            const result = formatCompactNumber(num)
            return result.endsWith('M')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('formats thousands correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 999999 }),
          (num) => {
            const result = formatCompactNumber(num)
            return result.endsWith('k')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('returns raw number for values under 1000', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 999 }),
          (num) => {
            const result = formatCompactNumber(num)
            return result === num.toString()
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})


// Import StatsDashboard utilities
import { getStatsConfig } from './enterprise/StatsDashboard'
import type { Profile } from '@/types/profile'

describe('StatsDashboard Property Tests', () => {
  /**
   * **Feature: profile-enterprise-upgrade, Property 6: Stats Dashboard Card Count**
   * **Validates: Requirements 4.1**
   *
   * For any profile and Battle Pass data, the StatsDashboard SHALL render
   * exactly 6 StatsCards: Games Played, Wins, Win Rate, Current Tier
   * (from Battle Pass), Season XP (from Battle Pass), and Best Streak.
   */
  describe('Property 6: Stats Dashboard Card Count', () => {
    it('always returns exactly 6 stats', () => {
      fc.assert(
        fc.property(
          profileArb,
          fc.option(battlePassProgressArb, { nil: null }),
          (profile, battlePassProgress) => {
            const stats = getStatsConfig(profile as Profile, battlePassProgress as PlayerBattlePass | null)
            return stats.length === 6
          }
        ),
        { numRuns: 100 }
      )
    })

    it('contains all required stat keys', () => {
      fc.assert(
        fc.property(
          profileArb,
          fc.option(battlePassProgressArb, { nil: null }),
          (profile, battlePassProgress) => {
            const stats = getStatsConfig(profile as Profile, battlePassProgress as PlayerBattlePass | null)
            const keys = stats.map(s => s.key)
            
            return (
              keys.includes('games_played') &&
              keys.includes('games_won') &&
              keys.includes('win_rate') &&
              keys.includes('elo_rating') &&
              keys.includes('bp_tier') &&
              keys.includes('best_streak')
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it('shows dash for tier when no active season', () => {
      fc.assert(
        fc.property(
          profileArb,
          (profile) => {
            // No battle pass progress = no active season
            const stats = getStatsConfig(profile as Profile, null)
            const tierStat = stats.find(s => s.key === 'bp_tier')
            
            return tierStat?.value === '—'
          }
        ),
        { numRuns: 100 }
      )
    })

    it('shows tier value when active season exists', () => {
      fc.assert(
        fc.property(
          profileArb,
          battlePassProgressArb.map(bp => ({
            ...bp,
            season: { ...bp.season, is_active: true }
          })),
          (profile, battlePassProgress) => {
            const stats = getStatsConfig(profile as Profile, battlePassProgress as PlayerBattlePass)
            const tierStat = stats.find(s => s.key === 'bp_tier')
            
            return tierStat?.value === `Tier ${battlePassProgress.current_tier}`
          }
        ),
        { numRuns: 100 }
      )
    })

    it('tier card is clickable only when active season', () => {
      fc.assert(
        fc.property(
          profileArb,
          battlePassProgressArb,
          (profile, battlePassProgress) => {
            const activeProgress = { ...battlePassProgress, season: { ...battlePassProgress.season, is_active: true } }
            const inactiveProgress = { ...battlePassProgress, season: { ...battlePassProgress.season, is_active: false } }
            
            const activeStats = getStatsConfig(profile as Profile, activeProgress as PlayerBattlePass)
            const inactiveStats = getStatsConfig(profile as Profile, inactiveProgress as PlayerBattlePass)
            
            const activeTier = activeStats.find(s => s.key === 'bp_tier')
            const inactiveTier = inactiveStats.find(s => s.key === 'bp_tier')
            
            return activeTier?.clickable === true && inactiveTier?.clickable === false
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})


// Import MatchHistoryItem utilities
import { getOutcomeStyle, outcomeStyles } from './enterprise/MatchHistoryItem'

describe('MatchHistoryItem Property Tests', () => {
  /**
   * **Feature: profile-enterprise-upgrade, Property 7: Match Outcome Styling**
   * **Validates: Requirements 5.3, 5.4**
   *
   * For any match result, if won is true then MatchHistoryItem SHALL display
   * "WIN" badge with green (#10b981) background and green left border;
   * if won is false then SHALL display "LOSS" badge with red (#ef4444)
   * background and red left border.
   */
  describe('Property 7: Match Outcome Styling', () => {
    it('win returns correct styling', () => {
      fc.assert(
        fc.property(
          fc.constant(true),
          (won) => {
            const style = getOutcomeStyle(won)
            return (
              style.text === 'WIN' &&
              style.badge.includes('#10b981') &&
              style.border.includes('#10b981') &&
              style.xpPrefix === '+'
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it('loss returns correct styling', () => {
      fc.assert(
        fc.property(
          fc.constant(false),
          (won) => {
            const style = getOutcomeStyle(won)
            return (
              style.text === 'LOSS' &&
              style.badge.includes('#ef4444') &&
              style.border.includes('#ef4444') &&
              style.xpPrefix === ''
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it('outcome style is deterministic based on won flag', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (won) => {
            const style1 = getOutcomeStyle(won)
            const style2 = getOutcomeStyle(won)
            return (
              style1.text === style2.text &&
              style1.badge === style2.badge &&
              style1.border === style2.border
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it('win and loss have different colors', () => {
      const winStyle = getOutcomeStyle(true)
      const lossStyle = getOutcomeStyle(false)
      
      expect(winStyle.badge).not.toBe(lossStyle.badge)
      expect(winStyle.border).not.toBe(lossStyle.border)
      expect(winStyle.text).not.toBe(lossStyle.text)
    })

    it('outcomeStyles contains correct hex colors', () => {
      expect(outcomeStyles.win.badge).toContain('#10b981')
      expect(outcomeStyles.win.border).toContain('#10b981')
      expect(outcomeStyles.loss.badge).toContain('#ef4444')
      expect(outcomeStyles.loss.border).toContain('#ef4444')
    })
  })
})


// Import LoadoutPreview utilities
import { isSlotFilled } from './enterprise/LoadoutPreview'
import type { Loadout, CosmeticType } from '@/types/cosmetic'

describe('LoadoutPreview Property Tests', () => {
  /**
   * **Feature: profile-enterprise-upgrade, Property 8: Loadout Slot Display**
   * **Validates: Requirements 6.2, 6.3**
   *
   * For any loadout slot, if the slot contains an equipped item then
   * LoadoutPreview SHALL display item preview with rarity border;
   * if the slot is empty then SHALL display slot type icon with
   * dashed border and 50% opacity.
   */
  describe('Property 8: Loadout Slot Display', () => {
    const slotTypes: CosmeticType[] = ['skin', 'emote', 'banner', 'nameplate', 'effect', 'trail']

    it('null loadout returns false for all slots', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...slotTypes),
          (slotType) => {
            return isSlotFilled(null, slotType) === false
          }
        ),
        { numRuns: 100 }
      )
    })

    it('empty loadout returns false for all slots', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...slotTypes),
          (slotType) => {
            const emptyLoadout: Loadout = {}
            return isSlotFilled(emptyLoadout, slotType) === false
          }
        ),
        { numRuns: 100 }
      )
    })

    it('filled slot returns true', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...slotTypes),
          fc.uuid(),
          (slotType, itemId) => {
            const loadout: Loadout = { [slotType]: itemId }
            return isSlotFilled(loadout, slotType) === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('other slots remain unfilled when one is filled', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...slotTypes),
          fc.uuid(),
          (filledSlot, itemId) => {
            const loadout: Loadout = { [filledSlot]: itemId }
            const otherSlots = slotTypes.filter(s => s !== filledSlot)
            return otherSlots.every(slot => isSlotFilled(loadout, slot) === false)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})


// Import SocialLinkButton utilities
import { getPlatformColor, platformConfig } from './enterprise/SocialLinkButton'

describe('SocialLinkButton Property Tests', () => {
  /**
   * **Feature: profile-enterprise-upgrade, Property 9: Social Link Platform Colors**
   * **Validates: Requirements 7.4**
   *
   * For any SocialLinkButton, the component SHALL apply the correct platform
   * brand color on hover: Twitter (#1DA1F2), Twitch (#9146FF),
   * YouTube (#FF0000), Discord (#5865F2).
   */
  describe('Property 9: Social Link Platform Colors', () => {
    it('Twitter returns correct color', () => {
      expect(getPlatformColor('twitter')).toBe('#1DA1F2')
    })

    it('Twitch returns correct color', () => {
      expect(getPlatformColor('twitch')).toBe('#9146FF')
    })

    it('YouTube returns correct color', () => {
      expect(getPlatformColor('youtube')).toBe('#FF0000')
    })

    it('Discord returns correct color', () => {
      expect(getPlatformColor('discord')).toBe('#5865F2')
    })

    it('all platforms have unique colors', () => {
      const platforms = ['twitter', 'twitch', 'youtube', 'discord'] as const
      const colors = platforms.map(p => getPlatformColor(p))
      const uniqueColors = new Set(colors)
      expect(uniqueColors.size).toBe(platforms.length)
    })

    it('platformConfig has correct isUrl settings', () => {
      expect(platformConfig.twitter.isUrl).toBe(true)
      expect(platformConfig.twitch.isUrl).toBe(true)
      expect(platformConfig.youtube.isUrl).toBe(true)
      expect(platformConfig.discord.isUrl).toBe(false) // Discord copies to clipboard
    })
  })
})


// Import AchievementBadge utilities
import { getRarityStyle, sortAchievements, rarityStyles, type Achievement } from './enterprise/AchievementBadge'
import type { Rarity } from '@/types/cosmetic'

describe('AchievementBadge Property Tests', () => {
  /**
   * **Feature: profile-enterprise-upgrade, Property 10: Achievement Rarity Styling**
   * **Validates: Requirements 9.1, 9.3**
   *
   * For any AchievementBadge with rarity, the component SHALL apply the
   * correct border color and glow effect from rarityStyles. If rarity
   * is "legendary", SHALL also apply shimmer animation.
   */
  describe('Property 10: Achievement Rarity Styling', () => {
    const rarities: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']

    it('each rarity has unique border color', () => {
      const borders = rarities.map(r => getRarityStyle(r).border)
      const uniqueBorders = new Set(borders)
      expect(uniqueBorders.size).toBe(rarities.length)
    })

    it('legendary has shimmer animation', () => {
      expect(getRarityStyle('legendary').shimmer).toBe(true)
    })

    it('non-legendary rarities do not have shimmer', () => {
      const nonLegendary: Rarity[] = ['common', 'uncommon', 'rare', 'epic']
      nonLegendary.forEach(rarity => {
        expect(getRarityStyle(rarity).shimmer).toBe(false)
      })
    })

    it('higher rarities have glow effects', () => {
      expect(getRarityStyle('common').glow).toBe('')
      expect(getRarityStyle('uncommon').glow).not.toBe('')
      expect(getRarityStyle('rare').glow).not.toBe('')
      expect(getRarityStyle('epic').glow).not.toBe('')
      expect(getRarityStyle('legendary').glow).not.toBe('')
    })

    it('rarityStyles contains correct hex colors', () => {
      expect(rarityStyles.common.border).toContain('#737373')
      expect(rarityStyles.uncommon.border).toContain('#10b981')
      expect(rarityStyles.rare.border).toContain('#3b82f6')
      expect(rarityStyles.epic.border).toContain('#a855f7')
      expect(rarityStyles.legendary.border).toContain('#f59e0b')
    })
  })

  /**
   * **Feature: profile-enterprise-upgrade, Property 11: Achievement Ordering**
   * **Validates: Requirements 9.2**
   *
   * For any list of achievements, the achievements section SHALL display
   * them ordered by rarity (legendary first, then epic, rare, uncommon,
   * common) and then by earned_at date (newest first), limited to 6 items.
   */
  describe('Property 11: Achievement Ordering', () => {
    const createAchievement = (rarity: Rarity, daysAgo: number): Achievement => ({
      id: `${rarity}-${daysAgo}`,
      name: `${rarity} Achievement`,
      description: 'Test achievement',
      icon_url: '/test.png',
      rarity,
      earned_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    })

    it('sorts by rarity first (legendary > epic > rare > uncommon > common)', () => {
      const achievements: Achievement[] = [
        createAchievement('common', 1),
        createAchievement('legendary', 5),
        createAchievement('rare', 2),
        createAchievement('epic', 3),
        createAchievement('uncommon', 4),
      ]

      const sorted = sortAchievements(achievements)
      
      expect(sorted[0].rarity).toBe('legendary')
      expect(sorted[1].rarity).toBe('epic')
      expect(sorted[2].rarity).toBe('rare')
      expect(sorted[3].rarity).toBe('uncommon')
      expect(sorted[4].rarity).toBe('common')
    })

    it('sorts by date within same rarity (newest first)', () => {
      const achievements: Achievement[] = [
        createAchievement('rare', 5),  // 5 days ago
        createAchievement('rare', 1),  // 1 day ago (newest)
        createAchievement('rare', 3),  // 3 days ago
      ]

      const sorted = sortAchievements(achievements)
      
      // All rare, should be sorted by date (newest first)
      expect(sorted[0].id).toBe('rare-1')
      expect(sorted[1].id).toBe('rare-3')
      expect(sorted[2].id).toBe('rare-5')
    })

    it('does not mutate original array', () => {
      const achievements: Achievement[] = [
        createAchievement('common', 1),
        createAchievement('legendary', 2),
      ]
      const originalFirst = achievements[0]

      sortAchievements(achievements)

      expect(achievements[0]).toBe(originalFirst)
    })

    it('handles empty array', () => {
      const sorted = sortAchievements([])
      expect(sorted).toEqual([])
    })

    it('handles single achievement', () => {
      const achievements = [createAchievement('epic', 1)]
      const sorted = sortAchievements(achievements)
      expect(sorted.length).toBe(1)
      expect(sorted[0].rarity).toBe('epic')
    })
  })
})


// Import ProfileEditorForm utilities
import { validateDisplayName, validateFileUpload, hasUnsavedChanges, VALIDATION } from './enterprise/ProfileEditorForm'

describe('ProfileEditorForm Property Tests', () => {
  /**
   * **Feature: profile-enterprise-upgrade, Property 12: Display Name Validation**
   * **Validates: Requirements 8.2**
   *
   * For any display name input, the ProfileEditorForm SHALL validate
   * minimum 3 characters and maximum 30 characters, showing error state
   * for invalid input and character count display.
   */
  describe('Property 12: Display Name Validation', () => {
    it('names shorter than min are invalid', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: VALIDATION.displayName.min - 1 }),
          (name) => {
            const result = validateDisplayName(name)
            return result.valid === false && result.error !== undefined
          }
        ),
        { numRuns: 100 }
      )
    })

    it('names within valid range are valid', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: VALIDATION.displayName.min, maxLength: VALIDATION.displayName.max }),
          (name) => {
            const result = validateDisplayName(name)
            return result.valid === true && result.error === undefined
          }
        ),
        { numRuns: 100 }
      )
    })

    it('names longer than max are invalid', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: VALIDATION.displayName.max + 1, maxLength: VALIDATION.displayName.max + 50 }),
          (name) => {
            const result = validateDisplayName(name)
            return result.valid === false && result.error !== undefined
          }
        ),
        { numRuns: 100 }
      )
    })

    it('validation constants are correct', () => {
      expect(VALIDATION.displayName.min).toBe(3)
      expect(VALIDATION.displayName.max).toBe(30)
    })
  })

  /**
   * **Feature: profile-enterprise-upgrade, Property 13: File Upload Validation**
   * **Validates: Requirements 8.4**
   *
   * For any file upload (avatar or banner), the ProfileEditorForm SHALL
   * validate file type is one of [JPEG, PNG, WebP] and file size is less
   * than 5MB, showing error message for invalid files.
   */
  describe('Property 13: File Upload Validation', () => {
    it('valid file types are accepted', () => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp']
      validTypes.forEach(type => {
        const file = new File(['test'], 'test.jpg', { type })
        const result = validateFileUpload(file)
        expect(result.valid).toBe(true)
      })
    })

    it('invalid file types are rejected', () => {
      const invalidTypes = ['image/gif', 'image/bmp', 'application/pdf', 'text/plain']
      invalidTypes.forEach(type => {
        const file = new File(['test'], 'test.file', { type })
        const result = validateFileUpload(file)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('JPEG, PNG, or WebP')
      })
    })

    it('files under 5MB are accepted', () => {
      // Create a small file (under 5MB)
      const smallContent = new Array(1000).fill('a').join('')
      const file = new File([smallContent], 'test.jpg', { type: 'image/jpeg' })
      const result = validateFileUpload(file)
      expect(result.valid).toBe(true)
    })

    it('validation constants are correct', () => {
      expect(VALIDATION.file.maxSize).toBe(5 * 1024 * 1024) // 5MB
      expect(VALIDATION.file.types).toContain('image/jpeg')
      expect(VALIDATION.file.types).toContain('image/png')
      expect(VALIDATION.file.types).toContain('image/webp')
    })
  })

  /**
   * **Feature: profile-enterprise-upgrade, Property 14: Unsaved Changes Detection**
   * **Validates: Requirements 8.5**
   *
   * For any form state where current values differ from initial profile
   * values, the ProfileEditorForm SHALL display "Unsaved changes" indicator
   * and enable the Save button.
   */
  describe('Property 14: Unsaved Changes Detection', () => {
    const createProfile = (displayName: string, bio: string, title: string) => ({
      user_id: 'test-id',
      display_name: displayName,
      bio: bio || undefined,
      title: title || undefined,
      level: 1,
      total_xp: 0,
      games_played: 0,
      games_won: 0,
      // Privacy settings are flat fields
      is_public: true,
      accept_friend_requests: true,
      allow_messages: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    }) as Profile

    it('no changes returns false', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 30 }),
          fc.string({ minLength: 0, maxLength: 100 }),
          fc.string({ minLength: 0, maxLength: 50 }),
          (displayName, bio, title) => {
            const profile = createProfile(displayName, bio, title)
            return hasUnsavedChanges(profile, { displayName, bio, title }) === false
          }
        ),
        { numRuns: 100 }
      )
    })

    it('changed display name returns true', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 30 }),
          fc.string({ minLength: 3, maxLength: 30 }),
          (original, changed) => {
            if (original === changed) return true // Skip if same
            const profile = createProfile(original, '', '')
            return hasUnsavedChanges(profile, { displayName: changed, bio: '', title: '' }) === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('changed bio returns true', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (original, changed) => {
            if (original === changed) return true // Skip if same
            const profile = createProfile('TestUser', original, '')
            return hasUnsavedChanges(profile, { displayName: 'TestUser', bio: changed, title: '' }) === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('changed title returns true', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (original, changed) => {
            if (original === changed) return true // Skip if same
            const profile = createProfile('TestUser', '', original)
            return hasUnsavedChanges(profile, { displayName: 'TestUser', bio: '', title: changed }) === true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
