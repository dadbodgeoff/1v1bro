# Implementation Plan

## Phase 1: Landing Page Optimization

- [x] 1. Optimize landing page components for mobile
  - [x] 1.1 Update LandingHeader mobile menu toggle
    - Add `min-h-[44px] min-w-[44px]` to menu toggle button
    - Ensure mobile menu items have `min-h-[44px]` and adequate spacing
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 Verify hero section CTA buttons
    - Confirm CTAButton component has `min-h-[56px]` (already good, verify)
    - _Requirements: 1.3_
  - [x] 1.3 Verify StickyMobileCTA
    - Confirm button has adequate height and safe area padding
    - _Requirements: 1.4_
  - [x] 1.4 Write property test for landing page touch targets
    - **Property 1: Game Flow Touch Target Minimum Size (landing subset)**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

## Phase 2: Matchmaking Flow Optimization

- [x] 2. Optimize matchmaking components for mobile
  - [x] 2.1 Update CategorySelector touch targets
    - Add `min-h-[44px]` to category button className
    - _Requirements: 2.1_
  - [x] 2.2 Update MapSelector touch targets
    - Add `min-h-[44px]` to map button className
    - _Requirements: 2.2_
  - [x] 2.3 Update QueueStatus modal
    - Add `min-h-[44px]` to cancel button
    - Add safe area padding to modal container
    - _Requirements: 2.3_
  - [x] 2.4 Update MatchFoundModal
    - Add safe area padding to modal container
    - _Requirements: 2.4, 2.5_
  - [x] 2.5 Write property test for matchmaking touch targets
    - **Property 1: Game Flow Touch Target Minimum Size (matchmaking subset)**
    - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Lobby Optimization

- [x] 4. Optimize lobby components for mobile
  - [x] 4.1 Update HeadToHeadDisplay responsive sizing
    - Replace fixed `w-[240px] h-[360px]` with responsive sizing
    - Use `max-w-[240px] w-full aspect-[2/3]` or similar pattern
    - Add mobile breakpoint for vertical stacking or scaling
    - _Requirements: 3.1, 3.2_
  - [x] 4.2 Update LobbyCode touch target
    - Add `min-h-[44px]` to copy button
    - _Requirements: 3.3_
  - [x] 4.3 Update Lobby.tsx action buttons
    - Verify Ready Up, Start Game, Leave buttons have `min-h-[44px]`
    - Verify safe area classes on header and action area
    - _Requirements: 3.4, 3.5_
  - [x] 4.4 Write property test for lobby touch targets and responsive sizing
    - **Property 1: Game Flow Touch Target Minimum Size (lobby subset)**
    - **Property 3: No Hardcoded Layout Dimensions**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Phase 4: Bot Game Optimization

- [x] 5. Optimize bot game setup and results screens
  - [x] 5.1 Update SetupScreen category buttons
    - Add `min-h-[44px]` to category selection buttons
    - _Requirements: 4.1_
  - [x] 5.2 Update SetupScreen map buttons
    - Add `min-h-[44px]` to map selection buttons
    - _Requirements: 4.2_
  - [x] 5.3 Update SetupScreen action buttons
    - Add `min-h-[44px]` to Start Game and Back buttons
    - _Requirements: 4.3_
  - [x] 5.4 Update ResultsScreen action buttons
    - Add `min-h-[44px]` to Play Again and Back buttons
    - Add safe area handling
    - _Requirements: 4.4, 4.5_
  - [x] 5.5 Write property test for bot game touch targets
    - **Property 1: Game Flow Touch Target Minimum Size (bot game subset)**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Arena Overlays Optimization

- [x] 7. Optimize arena overlay components
  - [x] 7.1 Update RespawnOverlay button
    - Add `min-h-[44px] min-w-[44px]` to Watch Replay button
    - _Requirements: 5.1_
  - [x] 7.2 Verify RotateDeviceHint buttons
    - Confirm action buttons have adequate height (already has py-3, verify)
    - _Requirements: 5.2_
  - [x] 7.3 Verify RoundResultOverlay responsive sizing
    - Ensure overlay doesn't overflow on mobile viewports
    - _Requirements: 5.3_
  - [x] 7.4 Verify ArenaQuizPanel overlay mode
    - Confirm answer buttons meet touch target requirements
    - _Requirements: 5.5_
  - [x] 7.5 Write property test for arena overlay touch targets
    - **Property 1: Game Flow Touch Target Minimum Size (arena subset)**
    - **Validates: Requirements 5.1, 5.2, 5.5**

## Phase 6: Instant Play Optimization

- [x] 8. Optimize instant play components
  - [x] 8.1 Update QuickCategoryPicker touch targets
    - Add `min-h-[44px]` to category option buttons
    - _Requirements: 6.1_
  - [x] 8.2 Update InstantPlayTutorial button
    - Add `min-h-[44px]` to dismiss/continue button
    - _Requirements: 6.2_
  - [x] 8.3 Update GuestMatchSummary buttons
    - Add `min-h-[44px]` to action buttons
    - _Requirements: 6.3_
  - [x] 8.4 Update ConversionPromptModal
    - Add safe area padding
    - Add `min-h-[44px]` to CTA buttons
    - _Requirements: 6.4_
  - [x] 8.5 Write property test for instant play touch targets
    - **Property 1: Game Flow Touch Target Minimum Size (instant play subset)**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Global Property Tests

- [x] 10. Write comprehensive property-based tests
  - [x] 10.1 Write consolidated touch target property test
    - Test all game flow buttons across all screens
    - **Property 1: Game Flow Touch Target Minimum Size**
    - **Validates: Requirements 7.1**
  - [x] 10.2 Write touch target spacing property test
    - **Property 2: Touch Target Spacing**
    - **Validates: Requirements 7.2**
  - [x] 10.3 Write responsive grid property test
    - **Property 4: Responsive Grid Columns**
    - **Validates: Requirements 1.5, 8.3**
  - [x] 10.4 Write horizontal overflow property test
    - **Property 5: Horizontal Overflow Prevention**
    - **Validates: Requirements 5.3, 8.5**
  - [x] 10.5 Write fluid typography property test
    - **Property 6: Fluid Typography**
    - **Validates: Requirements 8.4**
  - [x] 10.6 Write mobile modal presentation property test
    - **Property 7: Mobile Modal Presentation**
    - **Validates: Requirements 3.2, 8.2**

## Phase 8: Final Validation

- [ ] 11. Final comprehensive testing
  - [x] 11.1 Run all property-based tests
    - Ensure 100+ iterations per test
    - Test across viewport range 320px-1920px
    - _Requirements: All_
  - [x] 11.2 Manual testing on real devices
    - Test on iPhone (Safari)
    - Test on Android (Chrome)
    - _Requirements: All_

- [x] 12. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
