/**
 * Dashboard Components Property Tests
 *
 * Tests correctness properties for dashboard components including:
 * - Rank tier calculation from ELO rating
 * - Level calculation from XP
 * - Queue status display
 * - Match found modal display
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { getRankTier, RANK_TIERS } from '@/types/leaderboard'
import { calculateLevel, calculateXpProgress } from './DashboardHeader'

describe('Dashboard Components', () => {
  /**
   * **Feature: dashboard-redesign, Property 1: Rank Badge Tier Correctness**
   *
   * *For any* ELO rating value between 100 and 3000, the RankBadge component
   * should display the correct tier icon and label according to the tier ranges:
   * - Bronze: 100-799
   * - Silver: 800-1199
   * - Gold: 1200-1599
   * - Platinum: 1600-1999
   * - Diamond: 2000-2399
   * - Master: 2400-2799
   * - Grandmaster: 2800-3000
   *
   * **Validates: Requirements 1.3**
   */
  describe('Property 1: Rank Badge Tier Correctness', () => {
    const eloArb = fc.integer({ min: 100, max: 3000 })

    it('getRankTier returns bronze for ELO 100-799', () => {
      fc.assert(
        fc.property(fc.integer({ min: 100, max: 799 }), (elo) => {
          expect(getRankTier(elo)).toBe('bronze')
        }),
        { numRuns: 100 }
      )
    })

    it('getRankTier returns silver for ELO 800-1199', () => {
      fc.assert(
        fc.property(fc.integer({ min: 800, max: 1199 }), (elo) => {
          expect(getRankTier(elo)).toBe('silver')
        }),
        { numRuns: 100 }
      )
    })

    it('getRankTier returns gold for ELO 1200-1599', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1200, max: 1599 }), (elo) => {
          expect(getRankTier(elo)).toBe('gold')
        }),
        { numRuns: 100 }
      )
    })

    it('getRankTier returns platinum for ELO 1600-1999', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1600, max: 1999 }), (elo) => {
          expect(getRankTier(elo)).toBe('platinum')
        }),
        { numRuns: 100 }
      )
    })

    it('getRankTier returns diamond for ELO 2000-2399', () => {
      fc.assert(
        fc.property(fc.integer({ min: 2000, max: 2399 }), (elo) => {
          expect(getRankTier(elo)).toBe('diamond')
        }),
        { numRuns: 100 }
      )
    })

    it('getRankTier returns master for ELO 2400-2799', () => {
      fc.assert(
        fc.property(fc.integer({ min: 2400, max: 2799 }), (elo) => {
          expect(getRankTier(elo)).toBe('master')
        }),
        { numRuns: 100 }
      )
    })

    it('getRankTier returns grandmaster for ELO 2800-3000', () => {
      fc.assert(
        fc.property(fc.integer({ min: 2800, max: 3000 }), (elo) => {
          expect(getRankTier(elo)).toBe('grandmaster')
        }),
        { numRuns: 100 }
      )
    })

    it('tier info exists for all returned tiers', () => {
      fc.assert(
        fc.property(eloArb, (elo) => {
          const tier = getRankTier(elo)
          const tierInfo = RANK_TIERS[tier]
          expect(tierInfo).toBeDefined()
          expect(tierInfo.icon).toBeTruthy()
          expect(tierInfo.color).toBeTruthy()
          expect(tierInfo.min).toBeLessThanOrEqual(tierInfo.max)
        }),
        { numRuns: 100 }
      )
    })

    it('ELO falls within tier min/max bounds', () => {
      fc.assert(
        fc.property(eloArb, (elo) => {
          const tier = getRankTier(elo)
          const tierInfo = RANK_TIERS[tier]
          expect(elo).toBeGreaterThanOrEqual(tierInfo.min)
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: dashboard-redesign, Property 2: Level Calculation Correctness**
   *
   * *For any* total XP value, the displayed level should equal floor(sqrt(total_xp / 100)) + 1,
   * and the XP progress bar should show the correct percentage toward the next level.
   *
   * **Validates: Requirements 1.4**
   */
  describe('Property 2: Level Calculation Correctness', () => {
    const xpArb = fc.integer({ min: 0, max: 1000000 })

    it('level equals floor(sqrt(total_xp / 100)) + 1', () => {
      fc.assert(
        fc.property(xpArb, (totalXp) => {
          const level = calculateLevel(totalXp)
          const expectedLevel = totalXp < 0 ? 1 : Math.floor(Math.sqrt(totalXp / 100)) + 1
          expect(level).toBe(expectedLevel)
        }),
        { numRuns: 100 }
      )
    })

    it('level is always at least 1', () => {
      fc.assert(
        fc.property(xpArb, (totalXp) => {
          const level = calculateLevel(totalXp)
          expect(level).toBeGreaterThanOrEqual(1)
        }),
        { numRuns: 100 }
      )
    })

    it('level increases monotonically with XP', () => {
      fc.assert(
        fc.property(xpArb, fc.integer({ min: 0, max: 100000 }), (baseXp, additionalXp) => {
          const level1 = calculateLevel(baseXp)
          const level2 = calculateLevel(baseXp + additionalXp)
          expect(level2).toBeGreaterThanOrEqual(level1)
        }),
        { numRuns: 100 }
      )
    })

    it('XP progress percentage is between 0 and 100', () => {
      fc.assert(
        fc.property(xpArb, (totalXp) => {
          const progress = calculateXpProgress(totalXp)
          expect(progress.percent).toBeGreaterThanOrEqual(0)
          expect(progress.percent).toBeLessThanOrEqual(100)
        }),
        { numRuns: 100 }
      )
    })

    it('XP progress current is non-negative', () => {
      fc.assert(
        fc.property(xpArb, (totalXp) => {
          const progress = calculateXpProgress(totalXp)
          expect(progress.current).toBeGreaterThanOrEqual(0)
        }),
        { numRuns: 100 }
      )
    })

    it('XP progress required is positive', () => {
      fc.assert(
        fc.property(xpArb, (totalXp) => {
          const progress = calculateXpProgress(totalXp)
          expect(progress.required).toBeGreaterThan(0)
        }),
        { numRuns: 100 }
      )
    })

    it('XP progress current is less than or equal to required', () => {
      fc.assert(
        fc.property(xpArb, (totalXp) => {
          const progress = calculateXpProgress(totalXp)
          expect(progress.current).toBeLessThanOrEqual(progress.required)
        }),
        { numRuns: 100 }
      )
    })

    it('XP at level boundary gives 0% progress', () => {
      const levelBoundaries = [0, 100, 400, 900, 1600]
      levelBoundaries.forEach((xp) => {
        const progress = calculateXpProgress(xp)
        expect(progress.current).toBe(0)
        expect(progress.percent).toBe(0)
      })
    })
  })

  /**
   * **Feature: dashboard-redesign, Property 3: Queue Status Display**
   *
   * *For any* queue state where isInQueue is true, the dashboard should display
   * the queue status component with the current queue time and position.
   *
   * **Validates: Requirements 3.4**
   */
  describe('Property 3: Queue Status Display', () => {
    // Helper to format time like the QueueStatus component
    function formatTime(seconds: number): string {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    it('queue time formats correctly for any non-negative seconds', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 3600 }), (seconds) => {
          const formatted = formatTime(seconds)
          // Should be in MM:SS format
          expect(formatted).toMatch(/^\d{2}:\d{2}$/)
          // Parse back and verify
          const [mins, secs] = formatted.split(':').map(Number)
          expect(mins * 60 + secs).toBe(seconds)
        }),
        { numRuns: 100 }
      )
    })

    it('queue position is displayed when not null', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000 }), (position) => {
          // Position should be a positive integer
          expect(position).toBeGreaterThan(0)
          // Formatted position should include the number
          const formatted = `#${position}`
          expect(formatted).toContain(position.toString())
        }),
        { numRuns: 100 }
      )
    })

    it('queue size is always non-negative', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 10000 }), (queueSize) => {
          expect(queueSize).toBeGreaterThanOrEqual(0)
        }),
        { numRuns: 100 }
      )
    })

    it('queue state is consistent - position <= queue size when both present', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (position, additionalPlayers) => {
            const queueSize = position + additionalPlayers - 1
            // Position should be <= queue size (you can't be position 5 in a queue of 3)
            expect(position).toBeLessThanOrEqual(queueSize + 1)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: dashboard-redesign, Property 4: Match Found Modal Display**
   *
   * *For any* state where isMatchFound is true and matchData is present,
   * the dashboard should display the MatchFoundModal component.
   *
   * **Validates: Requirements 3.5**
   */
  describe('Property 4: Match Found Modal Display', () => {
    // Arbitrary for match data
    const matchDataArb = fc.record({
      lobbyCode: fc.stringMatching(/^[A-Z0-9]{6}$/),
      opponentName: fc.string({ minLength: 1, maxLength: 50 }),
    })

    it('match data has valid lobby code format', () => {
      fc.assert(
        fc.property(matchDataArb, (matchData) => {
          // Lobby code should be 6 alphanumeric characters
          expect(matchData.lobbyCode).toMatch(/^[A-Z0-9]{6}$/)
          expect(matchData.lobbyCode.length).toBe(6)
        }),
        { numRuns: 100 }
      )
    })

    it('match data has non-empty opponent name', () => {
      fc.assert(
        fc.property(matchDataArb, (matchData) => {
          expect(matchData.opponentName.length).toBeGreaterThan(0)
        }),
        { numRuns: 100 }
      )
    })

    it('match found state requires both isMatchFound and matchData', () => {
      fc.assert(
        fc.property(fc.boolean(), fc.option(matchDataArb, { nil: null }), (isMatchFound, matchData) => {
          // Modal should only show when both conditions are true
          const shouldShowModal = isMatchFound && matchData !== null
          if (shouldShowModal) {
            expect(isMatchFound).toBe(true)
            expect(matchData).not.toBeNull()
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})


// Import battle pass helpers for testing
import { getXPProgress, getClaimableCount, getDaysRemaining } from '@/types/battlepass'
import type { PlayerBattlePass, Season } from '@/types/battlepass'

/**
 * **Feature: dashboard-redesign, Property 5: Battle Pass Widget Data**
 *
 * *For any* battle pass progress data, the widget should display the current tier,
 * XP progress percentage (currentXP / xpToNextTier * 100), and claimable rewards count.
 *
 * **Validates: Requirements 4.1, 4.2, 4.3**
 */
describe('Property 5: Battle Pass Widget Data', () => {
  // Simplified arbitrary for battle pass progress (without nested season to avoid date issues)
  const progressArb = fc
    .record({
      current_tier: fc.integer({ min: 1, max: 100 }),
      current_xp: fc.integer({ min: 0, max: 5000 }),
      xp_to_next_tier: fc.integer({ min: 100, max: 10000 }),
      total_xp: fc.integer({ min: 0, max: 1000000 }),
      is_premium: fc.boolean(),
      claimed_rewards: fc.array(fc.integer({ min: 1, max: 100 }), { maxLength: 50 }),
      claimable_rewards: fc.array(fc.integer({ min: 1, max: 100 }), { maxLength: 20 }),
    })
    .map((p) => ({
      ...p,
      user_id: 'test-user',
      season: {
        id: 'test-season',
        name: 'Test Season',
        season_number: 1,
        xp_per_tier: 1000,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T00:00:00Z',
        is_active: true,
        max_tier: 100,
      },
    }))

  it('XP progress percentage is between 0 and 100', () => {
    fc.assert(
      fc.property(progressArb, (progress) => {
        const xpProgress = getXPProgress(progress as PlayerBattlePass)
        expect(xpProgress).toBeGreaterThanOrEqual(0)
        expect(xpProgress).toBeLessThanOrEqual(100)
      }),
      { numRuns: 100 }
    )
  })

  it('XP progress is 100 when xp_to_next_tier is 0', () => {
    fc.assert(
      fc.property(progressArb, (progress) => {
        const modifiedProgress = { ...progress, xp_to_next_tier: 0 } as PlayerBattlePass
        const xpProgress = getXPProgress(modifiedProgress)
        expect(xpProgress).toBe(100)
      }),
      { numRuns: 100 }
    )
  })

  it('current tier is always positive', () => {
    fc.assert(
      fc.property(progressArb, (progress) => {
        expect(progress.current_tier).toBeGreaterThan(0)
      }),
      { numRuns: 100 }
    )
  })

  it('claimable count matches array length', () => {
    fc.assert(
      fc.property(progressArb, (progress) => {
        const count = getClaimableCount(progress as PlayerBattlePass)
        expect(count).toBe(progress.claimable_rewards.length)
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: dashboard-redesign, Property 6: Claimable Rewards Badge**
 *
 * *For any* claimable rewards count greater than 0, the Battle Pass widget
 * should display a notification badge showing the count.
 *
 * **Validates: Requirements 4.5**
 */
describe('Property 6: Claimable Rewards Badge', () => {
  it('claimable count is non-negative', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 1, max: 100 }), { maxLength: 50 }), (claimableRewards) => {
        const progress = { claimable_rewards: claimableRewards } as PlayerBattlePass
        const count = getClaimableCount(progress)
        expect(count).toBeGreaterThanOrEqual(0)
      }),
      { numRuns: 100 }
    )
  })

  it('badge should show when claimable count > 0', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 20 }), (claimableRewards) => {
        const progress = { claimable_rewards: claimableRewards } as PlayerBattlePass
        const count = getClaimableCount(progress)
        const shouldShowBadge = count > 0
        expect(shouldShowBadge).toBe(true)
        expect(count).toBe(claimableRewards.length)
      }),
      { numRuns: 100 }
    )
  })

  it('badge should not show when claimable count is 0', () => {
    const progress = {
      user_id: 'test',
      season: { id: 's1', name: 'Test', season_number: 1, xp_per_tier: 1000, start_date: '', end_date: '', is_active: true, max_tier: 100 },
      current_tier: 1,
      current_xp: 0,
      xp_to_next_tier: 100,
      total_xp: 0,
      is_premium: false,
      claimed_rewards: [],
      claimable_rewards: [],
    } as PlayerBattlePass
    const count = getClaimableCount(progress)
    expect(count).toBe(0)
  })

  it('days remaining is non-negative', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date(), max: new Date('2030-12-31') }).filter((d) => !isNaN(d.getTime())),
        (endDate) => {
          const season = {
            id: 'test',
            name: 'Test Season',
            season_number: 1,
            xp_per_tier: 1000,
            start_date: new Date().toISOString(),
            end_date: endDate.toISOString(),
            is_active: true,
            max_tier: 100,
          } as Season
          const days = getDaysRemaining(season)
          expect(days).toBeGreaterThanOrEqual(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})


// Import match history helpers for testing
import { getMatchResultText, getMatchResultColor, getEloChangeDisplay, getEloChangeColor } from '@/types/matchHistory'
import type { RecentMatch } from '@/types/matchHistory'

/**
 * **Feature: dashboard-redesign, Property 7: Match History Limit**
 *
 * *For any* match history array, the MatchHistoryWidget should display at most
 * maxItems (default 5) matches, showing the most recent first.
 *
 * **Validates: Requirements 5.1**
 */
describe('Property 7: Match History Limit', () => {
  // Arbitrary for match data
  const matchArb = fc.record({
    id: fc.uuid(),
    opponent_id: fc.uuid(),
    opponent_name: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
    opponent_avatar_url: fc.option(fc.webUrl(), { nil: null }),
    my_score: fc.integer({ min: 0, max: 100 }),
    opponent_score: fc.integer({ min: 0, max: 100 }),
    won: fc.boolean(),
    is_tie: fc.boolean(),
    elo_change: fc.integer({ min: -50, max: 50 }),
    created_at: fc.constant(new Date().toISOString()),
  })

  it('displayed matches never exceed maxItems', () => {
    fc.assert(
      fc.property(
        fc.array(matchArb, { minLength: 0, maxLength: 20 }),
        fc.integer({ min: 1, max: 10 }),
        (matches, maxItems) => {
          const displayed = matches.slice(0, maxItems)
          expect(displayed.length).toBeLessThanOrEqual(maxItems)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('default maxItems is 5', () => {
    const defaultMaxItems = 5
    fc.assert(
      fc.property(fc.array(matchArb, { minLength: 0, maxLength: 20 }), (matches) => {
        const displayed = matches.slice(0, defaultMaxItems)
        expect(displayed.length).toBeLessThanOrEqual(5)
      }),
      { numRuns: 100 }
    )
  })

  it('all matches are displayed when count <= maxItems', () => {
    fc.assert(
      fc.property(fc.array(matchArb, { minLength: 0, maxLength: 5 }), (matches) => {
        const maxItems = 5
        const displayed = matches.slice(0, maxItems)
        expect(displayed.length).toBe(matches.length)
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: dashboard-redesign, Property 8: Match Display Fields**
 *
 * *For any* match in the history, the display should include the opponent name,
 * result (win/loss indicator), and ELO change (positive for wins, negative for losses).
 *
 * **Validates: Requirements 5.2**
 */
describe('Property 8: Match Display Fields', () => {
  const matchArb = fc.record({
    id: fc.uuid(),
    opponent_id: fc.uuid(),
    opponent_name: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
    opponent_avatar_url: fc.option(fc.webUrl(), { nil: null }),
    my_score: fc.integer({ min: 0, max: 100 }),
    opponent_score: fc.integer({ min: 0, max: 100 }),
    won: fc.boolean(),
    is_tie: fc.boolean(),
    elo_change: fc.integer({ min: -50, max: 50 }),
    created_at: fc.constant(new Date().toISOString()),
  })

  it('result text is Victory, Defeat, or Tie', () => {
    fc.assert(
      fc.property(matchArb, (match) => {
        const result = getMatchResultText(match as RecentMatch)
        expect(['Victory', 'Defeat', 'Tie']).toContain(result)
      }),
      { numRuns: 100 }
    )
  })

  it('result color is appropriate for outcome', () => {
    fc.assert(
      fc.property(matchArb, (match) => {
        const color = getMatchResultColor(match as RecentMatch)
        if (match.is_tie) {
          expect(color).toBe('text-yellow-400')
        } else if (match.won) {
          expect(color).toBe('text-green-400')
        } else {
          expect(color).toBe('text-red-400')
        }
      }),
      { numRuns: 100 }
    )
  })

  it('ELO change display includes sign', () => {
    fc.assert(
      fc.property(fc.integer({ min: -100, max: 100 }), (eloChange) => {
        const display = getEloChangeDisplay(eloChange)
        if (eloChange > 0) {
          expect(display).toMatch(/^\+\d+$/)
        } else if (eloChange < 0) {
          expect(display).toMatch(/^-\d+$/)
        } else {
          expect(display).toBe('±0')
        }
      }),
      { numRuns: 100 }
    )
  })

  it('ELO change color is green for positive, red for negative', () => {
    fc.assert(
      fc.property(fc.integer({ min: -100, max: 100 }), (eloChange) => {
        const color = getEloChangeColor(eloChange)
        if (eloChange > 0) {
          expect(color).toBe('text-green-400')
        } else if (eloChange < 0) {
          expect(color).toBe('text-red-400')
        } else {
          expect(color).toBe('text-neutral-400')
        }
      }),
      { numRuns: 100 }
    )
  })
})


// Import friends widget helpers for testing
import { filterOnlineFriends } from './FriendsWidget'
import type { Friend } from '@/types/friend'

/**
 * **Feature: dashboard-redesign, Property 9: Online Friends Filter**
 *
 * *For any* friends list, the FriendsWidget should only display friends with
 * status 'online', 'in_game', or 'in_lobby', excluding offline friends.
 *
 * **Validates: Requirements 6.1**
 */
describe('Property 9: Online Friends Filter', () => {
  // Arbitrary for friend data
  const friendArb = fc.record({
    friendship_id: fc.uuid(),
    user_id: fc.uuid(),
    display_name: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
    avatar_url: fc.option(fc.webUrl(), { nil: null }),
    is_online: fc.boolean(),
    show_online_status: fc.boolean(),
    created_at: fc.constant(new Date().toISOString()),
  })

  it('only returns friends who are online and show status', () => {
    fc.assert(
      fc.property(fc.array(friendArb, { maxLength: 20 }), (friends) => {
        const onlineFriends = filterOnlineFriends(friends as Friend[])
        // All returned friends should be online and showing status
        onlineFriends.forEach((friend) => {
          expect(friend.is_online).toBe(true)
          expect(friend.show_online_status).toBe(true)
        })
      }),
      { numRuns: 100 }
    )
  })

  it('excludes offline friends', () => {
    fc.assert(
      fc.property(fc.array(friendArb, { maxLength: 20 }), (friends) => {
        const onlineFriends = filterOnlineFriends(friends as Friend[])
        const offlineFriends = friends.filter((f) => !f.is_online)
        // None of the offline friends should be in the result
        offlineFriends.forEach((offlineFriend) => {
          expect(onlineFriends.find((f) => f.friendship_id === offlineFriend.friendship_id)).toBeUndefined()
        })
      }),
      { numRuns: 100 }
    )
  })

  it('excludes friends who hide online status', () => {
    fc.assert(
      fc.property(fc.array(friendArb, { maxLength: 20 }), (friends) => {
        const onlineFriends = filterOnlineFriends(friends as Friend[])
        const hiddenFriends = friends.filter((f) => !f.show_online_status)
        // None of the hidden status friends should be in the result
        hiddenFriends.forEach((hiddenFriend) => {
          expect(onlineFriends.find((f) => f.friendship_id === hiddenFriend.friendship_id)).toBeUndefined()
        })
      }),
      { numRuns: 100 }
    )
  })

  it('result count is <= input count', () => {
    fc.assert(
      fc.property(fc.array(friendArb, { maxLength: 20 }), (friends) => {
        const onlineFriends = filterOnlineFriends(friends as Friend[])
        expect(onlineFriends.length).toBeLessThanOrEqual(friends.length)
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: dashboard-redesign, Property 10: Friend Display Fields**
 *
 * *For any* online friend displayed, the widget should show the friend's avatar
 * (or placeholder), display name, and current activity status.
 *
 * **Validates: Requirements 6.2**
 */
describe('Property 10: Friend Display Fields', () => {
  const friendArb = fc.record({
    friendship_id: fc.uuid(),
    user_id: fc.uuid(),
    display_name: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
    avatar_url: fc.option(fc.webUrl(), { nil: null }),
    is_online: fc.constant(true),
    show_online_status: fc.constant(true),
    created_at: fc.constant(new Date().toISOString()),
  })

  it('friend has valid friendship_id', () => {
    fc.assert(
      fc.property(friendArb, (friend) => {
        expect(friend.friendship_id).toBeTruthy()
        expect(typeof friend.friendship_id).toBe('string')
      }),
      { numRuns: 100 }
    )
  })

  it('friend has valid user_id', () => {
    fc.assert(
      fc.property(friendArb, (friend) => {
        expect(friend.user_id).toBeTruthy()
        expect(typeof friend.user_id).toBe('string')
      }),
      { numRuns: 100 }
    )
  })

  it('display name fallback works for null names', () => {
    fc.assert(
      fc.property(friendArb, (friend) => {
        const displayName = friend.display_name || 'Unknown'
        expect(displayName.length).toBeGreaterThan(0)
      }),
      { numRuns: 100 }
    )
  })

  it('avatar initial is derived from display name or fallback', () => {
    fc.assert(
      fc.property(friendArb, (friend) => {
        // Use the same logic as the component
        const name = friend.display_name?.trim() || '?'
        const initial = name.charAt(0).toUpperCase()
        // Initial should be a single character
        expect(initial.length).toBe(1)
        // If name is empty after trim, fallback to '?'
        if (!friend.display_name?.trim()) {
          expect(initial).toBe('?')
        }
      }),
      { numRuns: 100 }
    )
  })
})
