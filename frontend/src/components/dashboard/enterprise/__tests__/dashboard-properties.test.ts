/**
 * Dashboard Enterprise Property-Based Tests
 * 
 * Property-based tests for dashboard enterprise components using fast-check.
 * Each test validates correctness properties defined in the design document.
 * 
 * @module dashboard/enterprise/__tests__/dashboard-properties
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { formatCooldown } from '../HeroPlaySection'

describe('Dashboard Enterprise Properties', () => {
  /**
   * **Feature: dashboard-enterprise-upgrade, Property 7: Cooldown Timer Format**
   * **Validates: Requirements 2.4**
   * 
   * For any cooldown value in seconds, the display SHALL show:
   * - Format "M:SS" (e.g., "2:30" for 150 seconds)
   * - "0:00" when cooldown reaches zero
   * - Correct minute and second calculation
   */
  describe('Property 7: Cooldown Timer Format', () => {
    it('formats cooldown as M:SS for any non-negative seconds', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 3600 }), // 0 to 1 hour
          (seconds) => {
            const result = formatCooldown(seconds)
            
            // Should match M:SS format
            const formatRegex = /^\d+:\d{2}$/
            expect(result).toMatch(formatRegex)
            
            // Parse back and verify
            const [mins, secs] = result.split(':').map(Number)
            expect(mins).toBe(Math.floor(seconds / 60))
            expect(secs).toBe(seconds % 60)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('returns "0:00" when cooldown is zero', () => {
      expect(formatCooldown(0)).toBe('0:00')
    })

    it('pads seconds with leading zero when less than 10', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 9 }), // 0-9 seconds
          fc.integer({ min: 0, max: 60 }), // 0-60 minutes
          (secs, mins) => {
            const totalSeconds = mins * 60 + secs
            const result = formatCooldown(totalSeconds)
            
            // Seconds part should always be 2 digits
            const secondsPart = result.split(':')[1]
            expect(secondsPart.length).toBe(2)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('correctly calculates minutes and seconds for any value', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 7200 }), // 0 to 2 hours
          (totalSeconds) => {
            const result = formatCooldown(totalSeconds)
            const [mins, secs] = result.split(':').map(Number)
            
            // Reconstruct and verify
            const reconstructed = mins * 60 + secs
            expect(reconstructed).toBe(totalSeconds)
            
            // Seconds should always be 0-59
            expect(secs).toBeGreaterThanOrEqual(0)
            expect(secs).toBeLessThan(60)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})


import { calculateXpProgress } from '../BattlePassWidget'

describe('Battle Pass Widget Properties', () => {
  /**
   * **Feature: dashboard-enterprise-upgrade, Property 1: Battle Pass Widget Display Consistency**
   * **Validates: Requirements 3.1, 3.2**
   * 
   * For any Battle Pass progress data with valid tier (1-100) and XP values (0 to xpToNextTier),
   * the widget SHALL display:
   * - Current tier as the primary value
   * - XP progress percentage calculated as currentXp / (currentXp + xpToNextTier) * 100
   *   (where currentXp + xpToNextTier = xpPerTier, the total XP needed for the tier)
   * - Claimable rewards badge only when claimableCount > 0
   */
  describe('Property 1: Battle Pass Widget Display Consistency', () => {
    it('calculates XP progress percentage correctly for any valid XP values', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }), // currentXp
          fc.integer({ min: 1, max: 10000 }), // xpToNextTier (must be > 0)
          (currentXp, xpToNextTier) => {
            const progress = calculateXpProgress(currentXp, xpToNextTier)
            
            // Progress should be between 0 and 100
            expect(progress).toBeGreaterThanOrEqual(0)
            expect(progress).toBeLessThanOrEqual(100)
            
            // Verify calculation: currentXp / (currentXp + xpToNextTier) * 100
            // This gives the percentage of the tier completed
            const xpPerTier = currentXp + xpToNextTier
            const expected = Math.min(100, Math.round((currentXp / xpPerTier) * 100))
            expect(progress).toBe(expected)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('returns 100% when xpToNextTier is 0 or negative', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }), // currentXp
          fc.integer({ min: -100, max: 0 }), // xpToNextTier (0 or negative)
          (currentXp, xpToNextTier) => {
            const progress = calculateXpProgress(currentXp, xpToNextTier)
            expect(progress).toBe(100)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('caps progress at 100% when currentXp exceeds xpToNextTier', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }), // xpToNextTier
          fc.integer({ min: 1, max: 100 }), // multiplier
          (xpToNextTier, multiplier) => {
            const currentXp = xpToNextTier * multiplier // currentXp >= xpToNextTier
            const progress = calculateXpProgress(currentXp, xpToNextTier)
            expect(progress).toBeLessThanOrEqual(100)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('returns 0% when currentXp is 0', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }), // xpToNextTier
          (xpToNextTier) => {
            const progress = calculateXpProgress(0, xpToNextTier)
            expect(progress).toBe(0)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})


import { calculateWinRate, getRankFromElo, formatTierName } from '../StatsSummaryWidget'
import { RANK_TIERS } from '@/types/leaderboard'

describe('Stats Summary Widget Properties', () => {
  /**
   * **Feature: dashboard-enterprise-upgrade, Property 4: Stats Value Formatting**
   * **Validates: Requirements 6.2, 6.3, 6.4, 6.6**
   * 
   * For any stats data, the widget SHALL display:
   * - Win rate as percentage with correct calculation (wins / gamesPlayed * 100)
   * - Rank tier determined by ELO rating using RANK_TIERS mapping
   * - ELO rating as numeric value with optional change indicator
   * - "0" or "Unranked" for missing/null values
   */
  describe('Property 4: Stats Value Formatting', () => {
    it('calculates win rate correctly for any valid wins and games played', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }), // wins
          fc.integer({ min: 1, max: 10000 }), // gamesPlayed (must be > 0)
          (wins, gamesPlayed) => {
            // Ensure wins <= gamesPlayed for realistic data
            const actualWins = Math.min(wins, gamesPlayed)
            const winRate = calculateWinRate(actualWins, gamesPlayed)
            
            // Win rate should be between 0 and 100
            expect(winRate).toBeGreaterThanOrEqual(0)
            expect(winRate).toBeLessThanOrEqual(100)
            
            // Verify calculation
            const expected = Math.round((actualWins / gamesPlayed) * 100)
            expect(winRate).toBe(expected)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('returns 0% win rate when gamesPlayed is 0 or negative', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }), // wins
          fc.integer({ min: -100, max: 0 }), // gamesPlayed (0 or negative)
          (wins, gamesPlayed) => {
            const winRate = calculateWinRate(wins, gamesPlayed)
            expect(winRate).toBe(0)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('determines rank tier correctly from ELO rating', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 3000 }), // ELO rating
          (elo) => {
            const tier = getRankFromElo(elo)
            const tierInfo = RANK_TIERS[tier]
            
            // Tier should be valid
            expect(tierInfo).toBeDefined()
            
            // ELO should be within tier range
            expect(elo).toBeGreaterThanOrEqual(tierInfo.min)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('returns bronze tier for null ELO', () => {
      const tier = getRankFromElo(null)
      expect(tier).toBe('bronze')
    })

    it('formats tier name with first letter capitalized', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster'),
          (tier) => {
            const formatted = formatTierName(tier as 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'grandmaster')
            
            // First letter should be uppercase
            expect(formatted[0]).toBe(formatted[0].toUpperCase())
            
            // Rest should be lowercase
            expect(formatted.slice(1)).toBe(tier.slice(1))
            
            return true
          }
        ),
        { numRuns: 7 } // One for each tier
      )
    })

    it('win rate is 100% when wins equals gamesPlayed', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }), // gamesPlayed
          (gamesPlayed) => {
            const winRate = calculateWinRate(gamesPlayed, gamesPlayed)
            expect(winRate).toBe(100)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})


import { isValidShopItem, getRarityColor, truncateItemName } from '../ShopPreviewWidget'
import { RARITY_COLORS, type Rarity as CosmeticRarity } from '@/types/cosmetic'

describe('Shop Preview Widget Properties', () => {
  /**
   * **Feature: dashboard-enterprise-upgrade, Property 2: Shop Item Display Completeness**
   * **Validates: Requirements 4.2**
   * 
   * For any shop item with valid data, the rendered preview SHALL contain:
   * - Item preview image (or placeholder if missing)
   * - Item name (truncated if exceeds max length)
   * - Rarity indicator with correct color mapping
   * - Price with coin icon
   */
  describe('Property 2: Shop Item Display Completeness', () => {
    it('validates shop items have required fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }),
            name: fc.string({ minLength: 1 }),
            rarity: fc.constantFrom('common', 'uncommon', 'rare', 'epic', 'legendary'),
            price_coins: fc.integer({ min: 0, max: 10000 }),
          }),
          (item) => {
            const isValid = isValidShopItem(item)
            expect(isValid).toBe(true)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('rejects items missing required fields', () => {
      // Missing id
      expect(isValidShopItem({ name: 'Test', rarity: 'common', price_coins: 100 })).toBe(false)
      // Missing name
      expect(isValidShopItem({ id: '1', rarity: 'common', price_coins: 100 })).toBe(false)
      // Missing rarity
      expect(isValidShopItem({ id: '1', name: 'Test', price_coins: 100 })).toBe(false)
      // Missing price
      expect(isValidShopItem({ id: '1', name: 'Test', rarity: 'common' })).toBe(false)
    })

    it('returns correct rarity color for all rarities', () => {
      const rarities: CosmeticRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']
      
      for (const rarity of rarities) {
        const color = getRarityColor(rarity)
        expect(color).toBe(RARITY_COLORS[rarity])
      }
    })

    it('truncates item names correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 5, max: 20 }),
          (name, maxLength) => {
            const truncated = truncateItemName(name, maxLength)
            
            // Result should never exceed maxLength
            expect(truncated.length).toBeLessThanOrEqual(maxLength)
            
            // If original was short enough, should be unchanged
            if (name.length <= maxLength) {
              expect(truncated).toBe(name)
            } else {
              // Should end with ellipsis
              expect(truncated.endsWith('…')).toBe(true)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('does not truncate short names', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 12 }),
          (name) => {
            const truncated = truncateItemName(name, 12)
            expect(truncated).toBe(name)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})


import { getSlotDisplayState, getSlotBorderColor } from '../LoadoutPreviewWidget'
import type { InventoryItem, CosmeticType, Rarity as LoadoutRarity } from '@/types/cosmetic'

describe('Loadout Preview Widget Properties', () => {
  /**
   * **Feature: dashboard-enterprise-upgrade, Property 3: Loadout Slot Display State**
   * **Validates: Requirements 5.2, 5.3**
   * 
   * For any loadout configuration, each slot SHALL display:
   * - Item preview and name when item is equipped (item !== null)
   * - Placeholder icon and "Empty" label when slot is empty (item === null)
   * - Correct rarity border color when item is equipped
   */
  describe('Property 3: Loadout Slot Display State', () => {
    // Helper to create mock inventory items
    const createInventoryItem = (
      id: string,
      type: CosmeticType,
      rarity: LoadoutRarity
    ): InventoryItem => ({
      id: `inv-${id}`,
      cosmetic_id: id,
      cosmetic: {
        id,
        name: `Item ${id}`,
        type,
        rarity,
        price_coins: 100,
        image_url: `https://example.com/${id}.png`,
        is_limited: false,
      },
      acquired_date: '2024-01-01',
      is_equipped: true,
    })

    it('returns null item when loadoutId is undefined', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('skin', 'banner', 'playercard') as fc.Arbitrary<CosmeticType>,
          (slotType) => {
            const result = getSlotDisplayState(slotType, undefined, [])
            expect(result.item).toBeNull()
            expect(result.type).toBe(slotType)
            return true
          }
        ),
        { numRuns: 10 }
      )
    })

    it('returns item data when loadoutId matches inventory item', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('skin', 'banner', 'playercard') as fc.Arbitrary<CosmeticType>,
          fc.constantFrom('common', 'uncommon', 'rare', 'epic', 'legendary') as fc.Arbitrary<LoadoutRarity>,
          fc.uuid(),
          (slotType, rarity, id) => {
            const inventory = [createInventoryItem(id, slotType, rarity)]
            const result = getSlotDisplayState(slotType, id, inventory)
            
            expect(result.item).not.toBeNull()
            expect(result.item?.id).toBe(id)
            expect(result.item?.rarity).toBe(rarity)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('returns null item when loadoutId does not match any inventory item', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('skin', 'banner', 'playercard') as fc.Arbitrary<CosmeticType>,
          fc.uuid(),
          fc.uuid(),
          (slotType, loadoutId, inventoryId) => {
            // Ensure IDs are different
            if (loadoutId === inventoryId) return true
            
            const inventory = [createInventoryItem(inventoryId, slotType, 'common')]
            const result = getSlotDisplayState(slotType, loadoutId, inventory)
            
            expect(result.item).toBeNull()
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('returns correct label for each slot type', () => {
      const expectedLabels: Record<CosmeticType, string> = {
        skin: 'Skin',
        banner: 'Banner',
        playercard: 'Player Card',
        emote: 'Emote',
        nameplate: 'Nameplate',
        effect: 'Effect',
        trail: 'Trail',
      }

      for (const [type, label] of Object.entries(expectedLabels)) {
        const result = getSlotDisplayState(type as CosmeticType, undefined, [])
        expect(result.label).toBe(label)
      }
    })

    it('returns default border color for null rarity', () => {
      const borderColor = getSlotBorderColor(null)
      expect(borderColor).toBe('border-white/[0.08]')
    })

    it('returns rarity-specific border color for valid rarities', () => {
      const rarities: LoadoutRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']
      
      for (const rarity of rarities) {
        const borderColor = getSlotBorderColor(rarity)
        expect(borderColor).toContain('border-[')
        expect(borderColor).toContain(RARITY_COLORS[rarity])
      }
    })
  })
})


import { formatEloChange, getEloChangeColorClass, getMatchResultDisplay } from '../MatchHistoryWidget'
import type { RecentMatch } from '@/types/matchHistory'

describe('Match History Widget Properties', () => {
  /**
   * **Feature: dashboard-enterprise-upgrade, Property 5: Match History Item Display**
   * **Validates: Requirements 7.2**
   * 
   * For any match data, the rendered item SHALL contain:
   * - Opponent avatar and display name
   * - Win/Loss indicator with correct color (green for win, red for loss)
   * - ELO change with sign (+/-) and color
   * - Relative timestamp in human-readable format
   */
  describe('Property 5: Match History Item Display', () => {
    it('formats positive ELO change with + sign', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (change) => {
            const formatted = formatEloChange(change)
            expect(formatted.startsWith('+')).toBe(true)
            expect(formatted).toBe(`+${change}`)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('formats negative ELO change with - sign', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: -1 }),
          (change) => {
            const formatted = formatEloChange(change)
            expect(formatted.startsWith('-')).toBe(true)
            expect(formatted).toBe(`${change}`)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('formats zero ELO change as ±0', () => {
      expect(formatEloChange(0)).toBe('±0')
    })

    it('formats null/undefined ELO change as —', () => {
      expect(formatEloChange(null)).toBe('—')
      expect(formatEloChange(undefined)).toBe('—')
    })

    it('returns correct color class for ELO changes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: 100 }),
          (change) => {
            const colorClass = getEloChangeColorClass(change)
            
            if (change > 0) {
              expect(colorClass).toContain('emerald')
            } else if (change < 0) {
              expect(colorClass).toContain('red')
            } else {
              expect(colorClass).toContain('neutral')
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('returns neutral color for null/undefined ELO', () => {
      expect(getEloChangeColorClass(null)).toContain('neutral')
      expect(getEloChangeColorClass(undefined)).toContain('neutral')
    })

    it('returns correct result display for wins', () => {
      const winMatch: RecentMatch = {
        id: '1',
        opponent_id: '2',
        opponent_name: 'Test',
        opponent_avatar_url: null,
        won: true,
        is_tie: false,
        my_score: 10,
        opponent_score: 5,
        elo_change: 15,
        created_at: new Date().toISOString(),
      }
      
      const result = getMatchResultDisplay(winMatch)
      expect(result.text).toBe('Victory')
      expect(result.colorClass).toContain('emerald')
    })

    it('returns correct result display for losses', () => {
      const lossMatch: RecentMatch = {
        id: '1',
        opponent_id: '2',
        opponent_name: 'Test',
        opponent_avatar_url: null,
        won: false,
        is_tie: false,
        my_score: 5,
        opponent_score: 10,
        elo_change: -15,
        created_at: new Date().toISOString(),
      }
      
      const result = getMatchResultDisplay(lossMatch)
      expect(result.text).toBe('Defeat')
      expect(result.colorClass).toContain('red')
    })

    it('returns correct result display for ties', () => {
      const tieMatch: RecentMatch = {
        id: '1',
        opponent_id: '2',
        opponent_name: 'Test',
        opponent_avatar_url: null,
        won: false,
        is_tie: true,
        my_score: 5,
        opponent_score: 5,
        elo_change: 0,
        created_at: new Date().toISOString(),
      }
      
      const result = getMatchResultDisplay(tieMatch)
      expect(result.text).toBe('Draw')
      expect(result.colorClass).toContain('amber')
    })
  })
})


import { filterOnlineFriends } from '../FriendsWidget'
import type { Friend } from '@/types/friend'

describe('Friends Widget Properties', () => {
  /**
   * **Feature: dashboard-enterprise-upgrade, Property 6: Friends Display Filtering**
   * **Validates: Requirements 8.1, 8.2**
   * 
   * For any friends list, the widget SHALL display only friends where:
   * - is_online === true
   * - show_online_status !== false
   * - Limited to maxItems count
   */
  describe('Property 6: Friends Display Filtering', () => {
    // Helper to create mock friends
    const createFriend = (
      id: string,
      isOnline: boolean,
      showOnlineStatus: boolean
    ): Friend => ({
      friendship_id: id,
      user_id: `user-${id}`,
      display_name: `Friend ${id}`,
      avatar_url: null,
      is_online: isOnline,
      show_online_status: showOnlineStatus,
      created_at: '2024-01-01',
    })

    it('filters to only include online friends with visible status', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              isOnline: fc.boolean(),
              showOnlineStatus: fc.boolean(),
            }),
            { minLength: 0, maxLength: 20 }
          ),
          (friendsData) => {
            const friends = friendsData.map(f => 
              createFriend(f.id, f.isOnline, f.showOnlineStatus)
            )
            
            const filtered = filterOnlineFriends(friends)
            
            // All filtered friends should be online with visible status
            for (const friend of filtered) {
              expect(friend.is_online).toBe(true)
              expect(friend.show_online_status).not.toBe(false)
            }
            
            // Count should match expected
            const expectedCount = friends.filter(
              f => f.is_online === true && f.show_online_status !== false
            ).length
            expect(filtered.length).toBe(expectedCount)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('returns empty array when no friends are online', () => {
      const friends = [
        createFriend('1', false, true),
        createFriend('2', false, true),
        createFriend('3', false, false),
      ]
      
      const filtered = filterOnlineFriends(friends)
      expect(filtered.length).toBe(0)
    })

    it('excludes friends with show_online_status = false', () => {
      const friends = [
        createFriend('1', true, true),   // Should be included
        createFriend('2', true, false),  // Should be excluded
        createFriend('3', true, true),   // Should be included
      ]
      
      const filtered = filterOnlineFriends(friends)
      expect(filtered.length).toBe(2)
      expect(filtered.find(f => f.friendship_id === '2')).toBeUndefined()
    })

    it('includes all online friends with visible status', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          (count) => {
            // Create all online friends with visible status
            const friends = Array.from({ length: count }, (_, i) => 
              createFriend(`${i}`, true, true)
            )
            
            const filtered = filterOnlineFriends(friends)
            expect(filtered.length).toBe(count)
            
            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('preserves friend order after filtering', () => {
      const friends = [
        createFriend('a', true, true),
        createFriend('b', false, true),
        createFriend('c', true, true),
        createFriend('d', true, false),
        createFriend('e', true, true),
      ]
      
      const filtered = filterOnlineFriends(friends)
      expect(filtered.map(f => f.friendship_id)).toEqual(['a', 'c', 'e'])
    })
  })
})
