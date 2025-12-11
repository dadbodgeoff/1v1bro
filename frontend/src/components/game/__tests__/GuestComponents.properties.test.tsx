/**
 * Property tests for Guest UI Components
 * 
 * Tests touch target compliance and component behavior.
 * 
 * @module components/game/__tests__/GuestComponents.properties.test
 * Feature: guest-experience-enhancement
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { GuestMatchSummary } from '../GuestMatchSummary'
import { ConversionPromptModal } from '../ConversionPromptModal'
import { GuestModeIndicator } from '../GuestModeIndicator'
import { type MatchResult } from '@/game/guest/GuestSessionManager'
import { type GuestMilestone } from '@/game/guest/MilestoneSystem'
import { type ConversionPrompt, type GuestIndicatorConfig } from '@/game/guest/SoftConversionPrompts'

// Wrapper for router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

/**
 * Generate valid MatchResult
 */
const matchResultArb = fc.record({
  won: fc.boolean(),
  playerScore: fc.integer({ min: 0, max: 15000 }),
  botScore: fc.integer({ min: 0, max: 15000 }),
  kills: fc.integer({ min: 0, max: 50 }),
  deaths: fc.integer({ min: 0, max: 50 }),
  questionsAnswered: fc.integer({ min: 1, max: 15 }),
  questionsCorrect: fc.integer({ min: 0, max: 15 }),
  matchDurationMs: fc.integer({ min: 60000, max: 600000 }),
  category: fc.constantFrom('fortnite', 'nfl', 'sports', 'movies', 'music', 'general'),
}).filter(r => r.questionsCorrect <= r.questionsAnswered)

/**
 * Generate valid GuestMilestone
 */
const milestoneArb: fc.Arbitrary<GuestMilestone> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  description: fc.string({ minLength: 1, maxLength: 100 }),
  xpBonus: fc.integer({ min: 0, max: 500 }),
  icon: fc.constantFrom('🏆', '⭐', '🎯', '🔥', '💎'),
})

/**
 * Generate valid ConversionPrompt
 */
const conversionPromptArb: fc.Arbitrary<ConversionPrompt> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  type: fc.constantFrom('feature-preview', 'stats-save', 'break-suggestion', 'progress-warning') as fc.Arbitrary<ConversionPrompt['type']>,
  title: fc.string({ minLength: 1, maxLength: 50 }),
  message: fc.string({ minLength: 1, maxLength: 200 }),
  features: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 }),
  ctaText: fc.string({ minLength: 1, maxLength: 30 }),
  secondaryCta: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
  dismissable: fc.boolean(),
})

/**
 * Generate valid GuestIndicatorConfig
 */
const indicatorConfigArb: fc.Arbitrary<GuestIndicatorConfig> = fc.record({
  visible: fc.boolean(),
  message: fc.string({ minLength: 1, maxLength: 30 }),
  showSignupButton: fc.boolean(),
})

describe('Guest UI Components', () => {
  describe('Property 8: Mobile touch target compliance', () => {
    /**
     * Property 8: Mobile touch target compliance
     * For any interactive element displayed on a mobile device,
     * the touch target dimensions SHALL be at least 44x44 CSS pixels.
     * 
     * Validates: Requirements 6.1, 6.3
     */
    it('GuestMatchSummary buttons should have minimum 48px height', () => {
      fc.assert(
        fc.property(
          matchResultArb,
          fc.integer({ min: 0, max: 5000 }),
          fc.integer({ min: 0, max: 10000 }),
          fc.array(milestoneArb, { maxLength: 3 }),
          (result, previewXp, totalXp, milestones) => {
            const { container } = render(
              <RouterWrapper>
                <GuestMatchSummary
                  visible={true}
                  result={result}
                  previewXp={previewXp}
                  totalSessionXp={totalXp}
                  newMilestones={milestones}
                  onPlayAgain={() => {}}
                  onDismiss={() => {}}
                />
              </RouterWrapper>
            )

            // Check all buttons have min-h-[48px] class
            const buttons = container.querySelectorAll('button')
            buttons.forEach(button => {
              const classes = button.className
              // Should have min-h-[48px] for touch compliance
              expect(classes).toMatch(/min-h-\[4[48]px\]/)
            })
          }
        ),
        { numRuns: 50 }
      )
    })

    it('ConversionPromptModal buttons should have minimum 48px height', () => {
      fc.assert(
        fc.property(
          conversionPromptArb,
          (prompt) => {
            const { container } = render(
              <RouterWrapper>
                <ConversionPromptModal
                  visible={true}
                  prompt={prompt}
                  onPrimaryCta={() => {}}
                  onSecondaryCta={() => {}}
                />
              </RouterWrapper>
            )

            const buttons = container.querySelectorAll('button')
            buttons.forEach(button => {
              const classes = button.className
              expect(classes).toMatch(/min-h-\[4[48]px\]/)
            })
          }
        ),
        { numRuns: 50 }
      )
    })

    it('GuestModeIndicator signup button should have minimum touch target', () => {
      fc.assert(
        fc.property(
          indicatorConfigArb.filter(c => c.visible && c.showSignupButton),
          (config) => {
            const { container } = render(
              <RouterWrapper>
                <GuestModeIndicator config={config} />
              </RouterWrapper>
            )

            const buttons = container.querySelectorAll('button')
            buttons.forEach(button => {
              const classes = button.className
              // Should have min-h and min-w for touch compliance
              expect(classes).toMatch(/min-[hw]-\[/)
            })
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('Component rendering', () => {
    it('GuestMatchSummary should display correct stats', () => {
      fc.assert(
        fc.property(
          matchResultArb,
          fc.integer({ min: 0, max: 5000 }),
          fc.integer({ min: 0, max: 10000 }),
          (result, previewXp, totalXp) => {
            const { unmount, getByRole } = render(
              <RouterWrapper>
                <GuestMatchSummary
                  visible={true}
                  result={result}
                  previewXp={previewXp}
                  totalSessionXp={totalXp}
                  newMilestones={[]}
                  onPlayAgain={() => {}}
                />
              </RouterWrapper>
            )

            // Should show victory or defeat heading
            const heading = result.won ? 'Victory!' : 'Defeat'
            const h2 = getByRole('heading', { level: 2 })
            expect(h2.textContent).toBe(heading)

            unmount()
          }
        ),
        { numRuns: 50 }
      )
    })

    it('ConversionPromptModal should display prompt content', () => {
      fc.assert(
        fc.property(
          conversionPromptArb,
          (prompt) => {
            const { unmount, getByRole } = render(
              <RouterWrapper>
                <ConversionPromptModal
                  visible={true}
                  prompt={prompt}
                  onPrimaryCta={() => {}}
                  onSecondaryCta={() => {}}
                />
              </RouterWrapper>
            )

            // Should show title in heading
            const h2 = getByRole('heading', { level: 2 })
            expect(h2.textContent).toBe(prompt.title)

            unmount()
          }
        ),
        { numRuns: 50 }
      )
    })

    it('GuestModeIndicator should show message when visible', () => {
      fc.assert(
        fc.property(
          indicatorConfigArb.filter(c => c.visible),
          (config) => {
            const { unmount, container } = render(
              <RouterWrapper>
                <GuestModeIndicator config={config} />
              </RouterWrapper>
            )

            // Should contain the message text
            expect(container.textContent).toContain(config.message)

            unmount()
          }
        ),
        { numRuns: 50 }
      )
    })

    it('GuestModeIndicator should not render when not visible', () => {
      const config: GuestIndicatorConfig = {
        visible: false,
        message: 'Test',
        showSignupButton: true,
      }

      const { container } = render(
        <RouterWrapper>
          <GuestModeIndicator config={config} />
        </RouterWrapper>
      )

      expect(container.firstChild).toBeNull()
    })
  })
})
