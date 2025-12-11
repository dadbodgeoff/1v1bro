/**
 * Game Flow Mobile Optimization Property Tests
 * 
 * **Feature: game-flow-mobile-optimization**
 * Tests mobile optimization for landing page, matchmaking, lobby, bot game,
 * instant play, and arena overlay components.
 */

import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const SRC_DIR = path.resolve(__dirname, '../../')

function readFileContent(relativePath: string): string {
  const fullPath = path.join(SRC_DIR, relativePath)
  if (!fs.existsSync(fullPath)) return ''
  return fs.readFileSync(fullPath, 'utf-8')
}

/**
 * Check if content has touch target compliance patterns
 */
function hasTouchTargetCompliance(content: string): boolean {
  const patterns = [
    /min-h-\[44px\]/,
    /min-h-\[4[4-9]px\]/,
    /min-h-\[5[0-9]px\]/,
    /min-h-\[6[0-9]px\]/,
    /min-h-\[100px\]/,
    /min-h-11/,
    /min-h-12/,
    /min-h-14/,
    /\bh-11\b/,
    /\bh-12\b/,
    /\bh-14\b/,
    /py-3/,
    /py-4/,
    /py-5/,
  ]
  return patterns.some(p => p.test(content))
}

/**
 * Check if content has safe area handling
 */
function hasSafeAreaHandling(content: string): boolean {
  return content.includes('pb-safe') ||
    content.includes('pt-safe') ||
    content.includes('safe-area') ||
    content.includes('env(safe-area')
}

describe('Game Flow Mobile Optimization', () => {

  /**
   * **Feature: game-flow-mobile-optimization, Property 1: Game Flow Touch Target Minimum Size (landing subset)**
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
   * 
   * *For any* interactive button or tappable element in landing page components,
   * the element SHALL have minimum dimensions of 44×44px.
   */
  describe('Landing Page Touch Targets', () => {
    it('LandingHeader should have touch-compliant mobile menu toggle', () => {
      const content = readFileContent('components/landing/enterprise/LandingHeader.tsx')
      
      // Mobile menu button should have min-h-[44px] min-w-[44px]
      expect(content).toMatch(/min-h-\[44px\]/)
      expect(content).toMatch(/min-w-\[44px\]/)
    })

    it('LandingHeader mobile menu items should have touch targets', () => {
      const content = readFileContent('components/landing/enterprise/LandingHeader.tsx')
      
      // Mobile menu nav items should have min-h-[44px]
      const mobileMenuSection = content.split('Mobile Menu Overlay')[1] || content
      expect(mobileMenuSection).toMatch(/min-h-\[44px\]/)
    })

    it('CTAButton should have adequate touch target height', () => {
      const content = readFileContent('components/landing/enterprise/CTAButton.tsx')
      
      // Should have min-h-[56px] or larger for default size
      expect(content).toMatch(/min-h-\[5[6-9]px\]|min-h-\[6[0-9]px\]/)
    })

    it('StickyMobileCTA should have touch target and safe area', () => {
      const content = readFileContent('components/landing/enterprise/StickyMobileCTA.tsx')
      
      // Should have min-h-[44px] on button
      expect(content).toMatch(/min-h-\[44px\]/)
      // Should have safe area padding
      expect(hasSafeAreaHandling(content)).toBe(true)
    })
  })

  /**
   * **Feature: game-flow-mobile-optimization, Property 1: Game Flow Touch Target Minimum Size (matchmaking subset)**
   * **Validates: Requirements 2.1, 2.2, 2.3**
   * 
   * *For any* interactive button in matchmaking components,
   * the element SHALL have minimum dimensions of 44×44px.
   */
  describe('Matchmaking Touch Targets', () => {
    it('CategorySelector buttons should have touch targets', () => {
      const content = readFileContent('components/matchmaking/CategorySelector.tsx')
      expect(content).toMatch(/min-h-\[44px\]/)
    })

    it('MapSelector buttons should have touch targets', () => {
      const content = readFileContent('components/matchmaking/MapSelector.tsx')
      expect(content).toMatch(/min-h-\[44px\]/)
    })

    it('QueueStatus cancel button should have touch target', () => {
      const content = readFileContent('components/matchmaking/QueueStatus.tsx')
      expect(content).toMatch(/min-h-\[44px\]/)
    })

    it('QueueStatus modal should have safe area handling', () => {
      const content = readFileContent('components/matchmaking/QueueStatus.tsx')
      expect(hasSafeAreaHandling(content)).toBe(true)
    })

    it('MatchFoundModal should have safe area handling', () => {
      const content = readFileContent('components/matchmaking/MatchFoundModal.tsx')
      expect(hasSafeAreaHandling(content)).toBe(true)
    })
  })

  /**
   * **Feature: game-flow-mobile-optimization, Property 1: Game Flow Touch Target Minimum Size (lobby subset)**
   * **Property 3: No Hardcoded Layout Dimensions**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   * 
   * *For any* interactive button in lobby components, the element SHALL have minimum 44×44px.
   * *For any* player card, the element SHALL use responsive sizing.
   */
  describe('Lobby Touch Targets and Responsive Sizing', () => {
    it('LobbyCode copy button should have touch target', () => {
      const content = readFileContent('components/lobby/LobbyCode.tsx')
      expect(content).toMatch(/min-h-\[44px\]/)
    })

    it('Lobby action buttons should have touch targets', () => {
      const content = readFileContent('pages/Lobby.tsx')
      // Should have multiple min-h-[44px] for Ready Up, Start Game buttons
      const matches = content.match(/min-h-\[44px\]/g)
      expect(matches).not.toBeNull()
      expect(matches!.length).toBeGreaterThanOrEqual(3)
    })

    it('HeadToHeadDisplay should use responsive sizing', () => {
      const content = readFileContent('components/lobby/HeadToHeadDisplay.tsx')
      // Should use max-w and aspect-ratio instead of fixed dimensions
      expect(content).toMatch(/max-w-\[240px\]/)
      expect(content).toMatch(/aspect-\[2\/3\]/)
    })

    it('Lobby should have safe area handling', () => {
      const content = readFileContent('pages/Lobby.tsx')
      expect(hasSafeAreaHandling(content)).toBe(true)
    })
  })

  /**
   * **Feature: game-flow-mobile-optimization, Property 1: Game Flow Touch Target Minimum Size (bot game subset)**
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
   * 
   * *For any* interactive button in bot game screens, the element SHALL have minimum 44×44px.
   */
  describe('Bot Game Touch Targets', () => {
    it('BotGame SetupScreen buttons should have touch targets', () => {
      const content = readFileContent('pages/BotGame.tsx')
      // Should have min-h-[44px] for category, map, start, and back buttons
      const matches = content.match(/min-h-\[44px\]/g)
      expect(matches).not.toBeNull()
      expect(matches!.length).toBeGreaterThanOrEqual(4)
    })

    it('BotGame ResultsScreen buttons should have touch targets', () => {
      const content = readFileContent('pages/BotGame.tsx')
      // Play Again and Back buttons should have touch targets
      expect(content).toContain('onPlayAgain')
      expect(content).toContain('min-h-[44px]')
    })
  })

  /**
   * **Feature: game-flow-mobile-optimization, Property 1: Game Flow Touch Target Minimum Size (arena subset)**
   * **Validates: Requirements 5.1, 5.2, 5.5**
   * 
   * *For any* interactive button in arena overlays, the element SHALL have minimum 44×44px.
   */
  describe('Arena Overlay Touch Targets', () => {
    it('RespawnOverlay Watch Replay button should have touch target', () => {
      const content = readFileContent('components/game/RespawnOverlay.tsx')
      expect(content).toMatch(/min-h-\[44px\]/)
      expect(content).toMatch(/min-w-\[44px\]/)
    })

    it('ArenaQuizPanel answer buttons should have touch targets', () => {
      const content = readFileContent('components/game/ArenaQuizPanel.tsx')
      expect(content).toMatch(/min-h-\[44px\]/)
    })

    it('ArenaQuizPanel should have safe area handling', () => {
      const content = readFileContent('components/game/ArenaQuizPanel.tsx')
      expect(hasSafeAreaHandling(content)).toBe(true)
    })
  })

  /**
   * **Feature: game-flow-mobile-optimization, Property 1: Game Flow Touch Target Minimum Size (instant play subset)**
   * **Validates: Requirements 6.1, 6.2, 6.3**
   * 
   * *For any* interactive button in instant play components, the element SHALL have minimum 44×44px.
   */
  describe('Instant Play Touch Targets', () => {
    it('QuickCategoryPicker buttons should have touch targets', () => {
      const content = readFileContent('components/game/QuickCategoryPicker.tsx')
      expect(content).toMatch(/min-h-\[100px\]/)
      expect(content).toMatch(/min-w-\[44px\]/)
    })

    it('InstantPlayTutorial dismiss button should have touch target', () => {
      const content = readFileContent('components/game/InstantPlayTutorial.tsx')
      expect(content).toMatch(/min-h-\[44px\]/)
    })

    it('GuestMatchSummary buttons should have touch targets', () => {
      const content = readFileContent('components/game/GuestMatchSummary.tsx')
      expect(content).toMatch(/min-h-\[48px\]/)
    })

    it('ConversionPromptModal buttons should have touch targets', () => {
      const content = readFileContent('components/game/ConversionPromptModal.tsx')
      expect(content).toMatch(/min-h-\[48px\]/)
    })
  })

  /**
   * **Feature: game-flow-mobile-optimization, Property 1: Game Flow Touch Target Minimum Size**
   * **Validates: Requirements 7.1**
   * 
   * *For any* interactive button or tappable element in game flow screens,
   * the element SHALL have minimum dimensions of 44×44px.
   */
  describe('Global Touch Target Compliance', () => {
    const gameFlowComponents = [
      'components/landing/enterprise/LandingHeader.tsx',
      'components/landing/enterprise/StickyMobileCTA.tsx',
      'components/matchmaking/CategorySelector.tsx',
      'components/matchmaking/MapSelector.tsx',
      'components/matchmaking/QueueStatus.tsx',
      'components/lobby/LobbyCode.tsx',
      'pages/Lobby.tsx',
      'pages/BotGame.tsx',
      'components/game/RespawnOverlay.tsx',
      'components/game/ArenaQuizPanel.tsx',
      'components/game/QuickCategoryPicker.tsx',
      'components/game/InstantPlayTutorial.tsx',
      'components/game/GuestMatchSummary.tsx',
      'components/game/ConversionPromptModal.tsx',
    ]

    it('all game flow components should have touch target compliance', () => {
      for (const componentPath of gameFlowComponents) {
        const content = readFileContent(componentPath)
        if (content) {
          const hasTouchTarget = hasTouchTargetCompliance(content)
          expect(hasTouchTarget).toBe(true)
        }
      }
    })
  })

  /**
   * **Feature: game-flow-mobile-optimization, Property 3: No Hardcoded Layout Dimensions**
   * **Validates: Requirements 3.1, 8.1**
   * 
   * *For any* player card or layout container, the element SHALL use responsive sizing.
   */
  describe('Responsive Layout Compliance', () => {
    it('HeadToHeadDisplay should not use fixed pixel dimensions for player cards', () => {
      const content = readFileContent('components/lobby/HeadToHeadDisplay.tsx')
      // Should use max-w and aspect-ratio instead of fixed w-[240px] h-[360px]
      expect(content).toMatch(/max-w-\[240px\]/)
      expect(content).toMatch(/aspect-\[2\/3\]/)
    })
  })

  /**
   * **Feature: game-flow-mobile-optimization, Property 7: Mobile Modal Presentation**
   * **Validates: Requirements 3.2, 8.2**
   * 
   * *For any* modal displayed on mobile viewports, the modal SHALL use safe area padding.
   */
  describe('Modal Safe Area Compliance', () => {
    const modalComponents = [
      'components/matchmaking/QueueStatus.tsx',
      'components/matchmaking/MatchFoundModal.tsx',
      'components/game/ArenaQuizPanel.tsx',
    ]

    it('modal components should have safe area handling', () => {
      for (const componentPath of modalComponents) {
        const content = readFileContent(componentPath)
        if (content) {
          expect(hasSafeAreaHandling(content)).toBe(true)
        }
      }
    })
  })
})
