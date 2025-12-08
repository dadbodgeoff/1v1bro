/**
 * Property-based tests for PlayerCardBanner component
 * 
 * **Feature: lobby-playercard-redesign**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { render, screen } from '@testing-library/react'
import { PlayerCardBanner, type PlayerCardSize } from './PlayerCardBanner'
import type { Cosmetic, Rarity } from '@/types/cosmetic'

// Arbitrary for generating valid Cosmetic objects
const cosmeticArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  type: fc.constant('playercard' as const),
  rarity: fc.constantFrom('common', 'uncommon', 'rare', 'epic', 'legendary') as fc.Arbitrary<Rarity>,
  price_coins: fc.integer({ min: 0, max: 10000 }),
  image_url: fc.webUrl(),
  is_limited: fc.boolean(),
})

const playerNameArb = fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0)

const sizeArb = fc.constantFrom('small', 'medium', 'large') as fc.Arbitrary<PlayerCardSize>

describe('PlayerCardBanner', () => {
  /**
   * **Feature: lobby-playercard-redesign, Property 1: PlayerCardBanner renders playercard image and name**
   * **Validates: Requirements 1.1, 1.3, 4.2**
   * 
   * *For any* valid playercard cosmetic and player name, the PlayerCardBanner component
   * SHALL render both the playercard's image_url and the player's display name in the output.
   */
  describe('Property 1: PlayerCardBanner renders playercard image and name', () => {
    it('should render playercard image when provided', () => {
      fc.assert(
        fc.property(cosmeticArb, playerNameArb, (cosmetic, playerName) => {
          const { unmount } = render(
            <PlayerCardBanner
              playercard={cosmetic as Cosmetic}
              playerName={playerName}
            />
          )

          // Image should be rendered with correct src
          const image = screen.getByTestId('playercard-image')
          expect(image).toBeDefined()
          expect(image.getAttribute('src')).toBe(cosmetic.image_url)

          unmount()
        }),
        { numRuns: 50 }
      )
    })

    it('should render player name', () => {
      fc.assert(
        fc.property(cosmeticArb, playerNameArb, (cosmetic, playerName) => {
          const { unmount } = render(
            <PlayerCardBanner
              playercard={cosmetic as Cosmetic}
              playerName={playerName}
            />
          )

          // Name should be rendered
          const nameElement = screen.getByTestId('playercard-name')
          expect(nameElement).toBeDefined()
          expect(nameElement.textContent).toContain(playerName)

          unmount()
        }),
        { numRuns: 50 }
      )
    })

    it('should render both image and name together', () => {
      fc.assert(
        fc.property(cosmeticArb, playerNameArb, (cosmetic, playerName) => {
          const { unmount } = render(
            <PlayerCardBanner
              playercard={cosmetic as Cosmetic}
              playerName={playerName}
            />
          )

          // Both should be present
          expect(screen.getByTestId('playercard-image')).toBeDefined()
          expect(screen.getByTestId('playercard-name')).toBeDefined()
          expect(screen.getByTestId('playercard-name').textContent).toContain(playerName)

          unmount()
        }),
        { numRuns: 30 }
      )
    })
  })

  /**
   * **Feature: lobby-playercard-redesign, Property 2: PlayerCardBanner fallback to placeholder**
   * **Validates: Requirements 1.2, 4.3**
   * 
   * *For any* null or undefined playercard input, the PlayerCardBanner component
   * SHALL render a default placeholder design without errors.
   */
  describe('Property 2: PlayerCardBanner fallback to placeholder', () => {
    it('should render placeholder when playercard is null', () => {
      fc.assert(
        fc.property(playerNameArb, (playerName) => {
          const { unmount } = render(
            <PlayerCardBanner
              playercard={null}
              playerName={playerName}
            />
          )

          // Placeholder should be rendered instead of image
          expect(screen.getByTestId('playercard-placeholder')).toBeDefined()
          expect(screen.queryByTestId('playercard-image')).toBeNull()

          // Name should still be rendered
          expect(screen.getByTestId('playercard-name').textContent).toContain(playerName)

          unmount()
        }),
        { numRuns: 30 }
      )
    })

    it('should show first letter of name in placeholder', () => {
      fc.assert(
        fc.property(playerNameArb, (playerName) => {
          const { unmount } = render(
            <PlayerCardBanner
              playercard={null}
              playerName={playerName}
            />
          )

          const placeholder = screen.getByTestId('playercard-placeholder')
          const firstLetter = playerName[0]?.toUpperCase() || '?'
          expect(placeholder.textContent).toContain(firstLetter)

          unmount()
        }),
        { numRuns: 30 }
      )
    })
  })

  /**
   * **Feature: lobby-playercard-redesign, Property 4: Size variants produce different dimensions**
   * **Validates: Requirements 4.4**
   * 
   * *For any* size prop value ('small', 'medium', 'large'), the PlayerCardBanner
   * SHALL render with distinct dimensions corresponding to that size.
   */
  describe('Property 4: Size variants produce different dimensions', () => {
    it('should apply correct size attribute', () => {
      fc.assert(
        fc.property(sizeArb, playerNameArb, (size, playerName) => {
          const { unmount } = render(
            <PlayerCardBanner
              playercard={null}
              playerName={playerName}
              size={size}
            />
          )

          const banner = screen.getByTestId('playercard-banner')
          expect(banner.getAttribute('data-size')).toBe(size)

          unmount()
        }),
        { numRuns: 20 }
      )
    })

    it('should have different widths for different sizes', () => {
      const sizes: PlayerCardSize[] = ['small', 'medium', 'large']
      const widths: number[] = []

      for (const size of sizes) {
        const { unmount } = render(
          <PlayerCardBanner
            playercard={null}
            playerName="Test"
            size={size}
          />
        )

        const banner = screen.getByTestId('playercard-banner')
        const width = parseInt(banner.style.width || '0', 10)
        widths.push(width)

        unmount()
      }

      // Each size should have a different width
      expect(widths[0]).toBeLessThan(widths[1]) // small < medium
      expect(widths[1]).toBeLessThan(widths[2]) // medium < large
    })

    it('should default to medium size', () => {
      const { unmount } = render(
        <PlayerCardBanner
          playercard={null}
          playerName="Test"
        />
      )

      const banner = screen.getByTestId('playercard-banner')
      expect(banner.getAttribute('data-size')).toBe('medium')

      unmount()
    })
  })

  describe('Status indicators', () => {
    it('should show HOST badge when isHost is true', () => {
      const { unmount } = render(
        <PlayerCardBanner
          playercard={null}
          playerName="Test"
          showStatus={{ isHost: true }}
        />
      )

      expect(screen.getByText('HOST')).toBeDefined()

      unmount()
    })

    it('should show READY badge when isReady is true and not host', () => {
      const { unmount } = render(
        <PlayerCardBanner
          playercard={null}
          playerName="Test"
          showStatus={{ isHost: false, isReady: true }}
        />
      )

      expect(screen.getByText('READY')).toBeDefined()

      unmount()
    })

    it('should show (you) indicator for current user', () => {
      const { unmount } = render(
        <PlayerCardBanner
          playercard={null}
          playerName="Test"
          isCurrentUser={true}
        />
      )

      expect(screen.getByText('(you)')).toBeDefined()

      unmount()
    })
  })
})
