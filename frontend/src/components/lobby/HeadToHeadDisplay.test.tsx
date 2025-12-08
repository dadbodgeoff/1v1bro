/**
 * Property-based tests for HeadToHeadDisplay component
 * 
 * **Feature: lobby-playercard-redesign**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { render, screen } from '@testing-library/react'
import { HeadToHeadDisplay } from './HeadToHeadDisplay'
import type { Player } from '@/types/api'

// Arbitrary for generating valid Player objects
const playerArb = fc.record({
  id: fc.uuid(),
  display_name: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
  is_host: fc.boolean(),
  is_ready: fc.boolean(),
  playercard: fc.option(
    fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      type: fc.constant('playercard'),
      rarity: fc.constantFrom('common', 'uncommon', 'rare', 'epic', 'legendary'),
      image_url: fc.webUrl(),
    }),
    { nil: null }
  ),
}) as fc.Arbitrary<Player>

describe('HeadToHeadDisplay', () => {
  /**
   * **Feature: lobby-playercard-redesign, Property 3: Current user positioned on left**
   * **Validates: Requirements 2.3**
   * 
   * *For any* lobby with a current user and players array, the HeadToHeadDisplay
   * SHALL position the current user's card on the left side regardless of their
   * position in the players array.
   */
  describe('Property 3: Current user positioned on left', () => {
    it('should always render current user on the left side', () => {
      fc.assert(
        fc.property(playerArb, playerArb, (player1, player2) => {
          // Make player1 the current user
          const currentPlayer = { ...player1, id: 'current-user-id' }
          const opponent = { ...player2, id: 'opponent-id' }

          const { unmount } = render(
            <HeadToHeadDisplay
              currentPlayer={currentPlayer}
              opponent={opponent}
              isWaitingForOpponent={false}
            />
          )

          const leftPlayer = screen.getByTestId('left-player')
          const rightPlayer = screen.getByTestId('right-player')

          // Left player should contain "(you)" indicator
          expect(leftPlayer.textContent).toContain('(you)')
          
          // Right player should NOT contain "(you)" indicator
          expect(rightPlayer.textContent).not.toContain('(you)')

          unmount()
        }),
        { numRuns: 30 }
      )
    })

    it('should render VS indicator between players', () => {
      fc.assert(
        fc.property(playerArb, (player) => {
          const { unmount } = render(
            <HeadToHeadDisplay
              currentPlayer={player}
              opponent={null}
              isWaitingForOpponent={true}
            />
          )

          const vsIndicator = screen.getByTestId('vs-indicator')
          expect(vsIndicator).toBeDefined()
          expect(vsIndicator.textContent).toContain('VS')

          unmount()
        }),
        { numRuns: 20 }
      )
    })

    it('should maintain left positioning regardless of host status', () => {
      // Test with current user as host
      const currentAsHost: Player = {
        id: 'current',
        display_name: 'CurrentUser',
        is_host: true,
        is_ready: true,
        playercard: null,
      }
      const opponentNotHost: Player = {
        id: 'opponent',
        display_name: 'Opponent',
        is_host: false,
        is_ready: true,
        playercard: null,
      }

      const { unmount: unmount1 } = render(
        <HeadToHeadDisplay
          currentPlayer={currentAsHost}
          opponent={opponentNotHost}
          isWaitingForOpponent={false}
        />
      )

      let leftPlayer = screen.getByTestId('left-player')
      expect(leftPlayer.textContent).toContain('(you)')
      unmount1()

      // Test with current user NOT as host
      const currentNotHost: Player = {
        id: 'current',
        display_name: 'CurrentUser',
        is_host: false,
        is_ready: true,
        playercard: null,
      }
      const opponentAsHost: Player = {
        id: 'opponent',
        display_name: 'Opponent',
        is_host: true,
        is_ready: true,
        playercard: null,
      }

      const { unmount: unmount2 } = render(
        <HeadToHeadDisplay
          currentPlayer={currentNotHost}
          opponent={opponentAsHost}
          isWaitingForOpponent={false}
        />
      )

      leftPlayer = screen.getByTestId('left-player')
      expect(leftPlayer.textContent).toContain('(you)')
      unmount2()
    })
  })

  describe('Waiting for opponent', () => {
    it('should show waiting placeholder when opponent is null and waiting', () => {
      fc.assert(
        fc.property(playerArb, (currentPlayer) => {
          const { unmount } = render(
            <HeadToHeadDisplay
              currentPlayer={currentPlayer}
              opponent={null}
              isWaitingForOpponent={true}
            />
          )

          const waitingPlaceholder = screen.getByTestId('waiting-placeholder')
          expect(waitingPlaceholder).toBeDefined()
          expect(waitingPlaceholder.textContent).toContain('Waiting')

          unmount()
        }),
        { numRuns: 20 }
      )
    })

    it('should show opponent card when opponent joins', () => {
      fc.assert(
        fc.property(playerArb, playerArb, (currentPlayer, opponent) => {
          const { unmount } = render(
            <HeadToHeadDisplay
              currentPlayer={currentPlayer}
              opponent={opponent}
              isWaitingForOpponent={false}
            />
          )

          // Should not show waiting placeholder
          expect(screen.queryByTestId('waiting-placeholder')).toBeNull()

          // Right player should have opponent's name
          const rightPlayer = screen.getByTestId('right-player')
          const expectedName = opponent.display_name || 'Opponent'
          expect(rightPlayer.textContent).toContain(expectedName)

          unmount()
        }),
        { numRuns: 20 }
      )
    })
  })

  describe('Layout structure', () => {
    it('should have three main sections: left, vs, right', () => {
      const player: Player = {
        id: 'test',
        display_name: 'Test',
        is_host: true,
        is_ready: true,
        playercard: null,
      }

      const { unmount } = render(
        <HeadToHeadDisplay
          currentPlayer={player}
          opponent={null}
          isWaitingForOpponent={true}
        />
      )

      expect(screen.getByTestId('head-to-head-display')).toBeDefined()
      expect(screen.getByTestId('left-player')).toBeDefined()
      expect(screen.getByTestId('vs-indicator')).toBeDefined()
      expect(screen.getByTestId('right-player')).toBeDefined()

      unmount()
    })
  })
})
