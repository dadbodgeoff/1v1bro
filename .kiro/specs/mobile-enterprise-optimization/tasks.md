# Implementation Plan

## Phase 1: Foundation & Utilities

- [x] 1. Create mobile optimization utility components and hooks
  - [x] 1.1 Create ResponsiveContainer component with fluid max-width and padding
    - Add to `frontend/src/components/ui/ResponsiveContainer.tsx`
    - Support maxWidth variants: sm, md, lg, xl, 2xl, full
    - Use CSS variables for padding that scales with viewport
    - _Requirements: 1.1, 2.1, 9.1_
  - [x] 1.2 Create TouchTarget wrapper component
    - Add to `frontend/src/components/ui/TouchTarget.tsx`
    - Enforce minimum 44px dimensions on touch devices
    - Add visual debug mode for development
    - _Requirements: 1.3, 2.3, 3.3_
  - [x] 1.3 Create ResponsiveGrid component with breakpoint-aware columns
    - Add to `frontend/src/components/ui/ResponsiveGrid.tsx`
    - Accept cols config for mobile/tablet/desktop
    - Use CSS Grid with responsive gap
    - _Requirements: 1.2, 4.1, 5.1_
  - [x] 1.4 Write property test for touch target minimum size
    - **Property 1: Touch Target Minimum Size**
    - **Validates: Requirements 1.3, 2.3, 3.3, 4.3, 5.3, 6.2**
  - [x] 1.5 Write property test for responsive grid adaptation
    - **Property 4: Responsive Grid Adaptation**
    - **Validates: Requirements 1.2, 4.1, 5.1**

- [x] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Profile Module Optimization

- [x] 3. Optimize Profile page for mobile
  - [x] 3.1 Update ProfileHeader component for responsive layout
    - Convert avatar to percentage-based sizing (max-w-[25vw] or similar)
    - Stack header content vertically on mobile
    - Use fluid typography for name and stats
    - _Requirements: 1.4, 1.5_
  - [x] 3.2 Update StatsDashboard for responsive grid
    - Change to grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
    - Ensure stat cards use responsive padding
    - _Requirements: 1.2_
  - [x] 3.3 Update ProfileSection and social links for mobile
    - Stack social link buttons on mobile
    - Ensure all buttons meet touch target requirements
    - _Requirements: 1.3_
  - [x] 3.4 Write property test for profile layout responsiveness
    - **Property 3: Mobile Layout Single Column**
    - **Validates: Requirements 1.1**

## Phase 3: Dashboard Module Optimization

- [x] 4. Optimize Dashboard/Home page for mobile
  - [x] 4.1 Update DashboardLayout for mobile navigation
    - Ensure sidebar collapses properly on mobile
    - Add safe area handling for fixed elements
    - _Requirements: 10.1, 10.3_
  - [x] 4.2 Update Home page grid layout
    - Change to single column on mobile (grid-cols-1 lg:grid-cols-3)
    - Ensure widgets stack vertically with proper spacing
    - _Requirements: 2.1_
  - [x] 4.3 Update HeroPlaySection for responsive sizing
    - Use fluid typography for headings
    - Ensure CTA buttons are full-width on mobile
    - _Requirements: 2.2, 2.3_
  - [x] 4.4 Update dashboard widgets for mobile
    - Ensure all widget cards use responsive padding
    - Add horizontal scroll for overflow content
    - _Requirements: 2.5_
  - [x] 4.5 Write property test for safe area handling
    - **Property 8: Safe Area Handling**
    - **Validates: Requirements 2.4, 10.3**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Battle Pass Module Optimization

- [x] 6. Optimize Battle Pass page for mobile
  - [x] 6.1 Update BattlePassHeader for responsive layout
    - Use fluid typography for season name
    - Stack XP display and countdown on mobile
    - _Requirements: 3.2_
  - [x] 6.2 Update BattlePassTrack for horizontal scrolling
    - Ensure overflow-x-auto with momentum scrolling
    - Add scroll snap points for tier cards
    - Ensure touch-friendly navigation arrows
    - _Requirements: 3.1, 3.5_
  - [x] 6.3 Update tier cards for responsive sizing
    - Use responsive card widths (min-w-[140px] or similar)
    - Ensure claim buttons meet 44px touch target
    - _Requirements: 3.2, 3.3_
  - [x] 6.4 Update ProgressSection for responsive progress bar
    - Use percentage-based width (w-full)
    - Responsive height with CSS variables
    - _Requirements: 3.4_
  - [x] 6.5 Write property test for horizontal scroll containers
    - **Property 11: Horizontal Scroll Containers**
    - **Validates: Requirements 3.1, 4.4, 7.3**

## Phase 5: Shop Module Optimization

- [x] 7. Optimize Shop page for mobile
  - [x] 7.1 Update Shop grid layout
    - Change to grid-cols-2 md:grid-cols-3 lg:grid-cols-4
    - Ensure proper gap spacing
    - _Requirements: 4.1_
  - [x] 7.2 Update ItemDisplayBox for responsive sizing
    - Use fluid typography for prices and names
    - Ensure purchase buttons meet touch target
    - _Requirements: 4.2, 4.3_
  - [x] 7.3 Update ShopFilters for mobile
    - Use horizontally scrollable filter chips
    - Ensure filter buttons meet touch target
    - _Requirements: 4.4_
  - [x] 7.4 Update PurchaseModal for mobile presentation
    - Use bottom sheet style on mobile
    - Add safe area padding
    - Stack action buttons vertically
    - _Requirements: 4.5_
  - [x] 7.5 Write property test for modal mobile presentation
    - **Property 10: Modal Mobile Presentation**
    - **Validates: Requirements 4.5, 5.5, 6.4, 8.5, 11.1**

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Inventory Module Optimization

- [x] 9. Optimize Inventory page for mobile
  - [x] 9.1 Update Inventory grid layout
    - Change to grid-cols-2 md:grid-cols-3 lg:grid-cols-4
    - Ensure consistent aspect ratios
    - _Requirements: 5.1, 5.2_
  - [x] 9.2 Update InventoryItemBox for touch optimization
    - Ensure equip/unequip buttons meet 44px touch target
    - Add adequate spacing between action buttons
    - _Requirements: 5.3_
  - [x] 9.3 Update FilterBar for mobile
    - Use collapsible filter panel or bottom sheet
    - Ensure filter controls meet touch target
    - _Requirements: 5.4_
  - [x] 9.4 Update LoadoutPanel for responsive layout
    - Stack loadout slots on mobile if needed
    - Ensure slot buttons meet touch target
    - _Requirements: 5.3_
  - [x] 9.5 Write property test for responsive card sizing
    - **Property 12: Responsive Card Sizing**
    - **Validates: Requirements 3.2, 5.2, 14.1**

## Phase 7: Coin Shop Module Optimization

- [x] 10. Optimize CoinShop page for mobile
  - [x] 10.1 Update CoinShop layout
    - Stack package cards on mobile (grid-cols-1 sm:grid-cols-2)
    - Ensure hero section is responsive
    - _Requirements: 6.1_
  - [x] 10.2 Update CoinPackageCard for mobile
    - Use fluid typography for prices
    - Ensure buy buttons are full-width and meet touch target
    - _Requirements: 6.2, 6.3_
  - [x] 10.3 Update purchase flow for mobile
    - Ensure success/error states have touch-friendly buttons
    - Use appropriate modal presentation
    - _Requirements: 6.4, 6.5_
  - [x] 10.4 Write property test for fluid typography
    - **Property 6: Fluid Typography Scale**
    - **Validates: Requirements 1.5, 2.2, 4.2, 6.3, 7.2**

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 8: Leaderboards Module Optimization

- [x] 12. Optimize Leaderboards pages for mobile
  - [x] 12.1 Update LeaderboardHub grid layout
    - Change to grid-cols-1 md:grid-cols-2 lg:grid-cols-3
    - Ensure cards are responsive
    - _Requirements: 7.1_
  - [x] 12.2 Update LeaderboardCard for mobile
    - Use fluid typography for names and scores
    - Add text truncation for long names
    - _Requirements: 7.2_
  - [x] 12.3 Update LeaderboardDetail for mobile
    - Use horizontally scrollable tabs
    - Ensure tab buttons meet touch target
    - Add sticky user ranking indicator
    - _Requirements: 7.3, 7.4_
  - [x] 12.4 Update pagination controls
    - Ensure navigation buttons meet touch target
    - _Requirements: 7.5_
  - [x] 12.5 Write property test for list row touch height
    - **Property 14: List Row Touch Height**
    - **Validates: Requirements 8.1**

## Phase 9: Friends Module Optimization

- [x] 13. Optimize Friends page for mobile
  - [x] 13.1 Update Friends page layout
    - Stack columns on mobile (grid-cols-1 lg:grid-cols-3)
    - Ensure adequate row height for touch (min 44px)
    - _Requirements: 8.1_
  - [x] 13.2 Update FriendsList for touch optimization
    - Ensure action buttons meet 44px touch target
    - Add adequate spacing between buttons
    - _Requirements: 8.2_
  - [x] 13.3 Update UserSearch for mobile
    - Ensure input height is at least 44px
    - Use mobile-optimized keyboard
    - _Requirements: 8.3_
  - [x] 13.4 Update FriendRequests for touch optimization
    - Ensure accept/decline buttons meet touch target
    - Stack buttons if needed on mobile
    - _Requirements: 8.4_
  - [x] 13.5 Update friends panel/modal for mobile
    - Use full-screen or slide-over presentation
    - Add safe area handling
    - _Requirements: 8.5_
  - [x] 13.6 Write property test for touch target spacing
    - **Property 2: Touch Target Spacing**
    - **Validates: Requirements 13.2**

- [x] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 10: Settings Module Optimization

- [x] 15. Optimize Settings page for mobile
  - [x] 15.1 Update Settings page layout
    - Ensure single-column layout throughout
    - Add clear section separation
    - _Requirements: 9.1_
  - [x] 15.2 Update SettingsToggle for touch optimization
    - Ensure toggle tap area is at least 44px
    - Add adequate spacing between toggles
    - _Requirements: 9.2_
  - [x] 15.3 Update SettingsSection for mobile
    - Use collapsible sections if needed
    - Ensure section headers are touch-friendly
    - _Requirements: 9.3_
  - [x] 15.4 Update form inputs for mobile
    - Ensure all inputs are at least 44px height
    - Add proper input types for mobile keyboards
    - _Requirements: 9.4_
  - [x] 15.5 Update action buttons for mobile
    - Use full-width buttons on mobile
    - Ensure all buttons meet touch target
    - _Requirements: 9.5_
  - [x] 15.6 Write property test for input field sizing
    - **Property 15: Input Field Sizing**
    - **Validates: Requirements 9.4**

## Phase 11: Global Navigation Optimization

- [x] 16. Optimize global navigation for mobile
  - [x] 16.1 Update Sidebar for mobile
    - Ensure proper slide-out behavior
    - Add safe area handling
    - _Requirements: 10.1, 10.3_
  - [x] 16.2 Update navigation items for touch
    - Ensure all nav items meet 44px touch target
    - Add adequate spacing between items
    - _Requirements: 10.2_
  - [x] 16.3 Update DashboardHeader for mobile
    - Ensure menu toggle meets touch target
    - Add safe area handling for top
    - _Requirements: 10.1_
  - [x] 16.4 Update sub-navigation patterns
    - Use horizontally scrollable breadcrumbs if needed
    - Ensure collapsible patterns work on mobile
    - _Requirements: 10.5_
  - [x] 16.5 Write property test for horizontal overflow prevention
    - **Property 9: Horizontal Overflow Prevention**
    - **Validates: Requirements 2.5**

- [x] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 12: Modal & Overlay Optimization

- [x] 18. Optimize all modals and overlays for mobile
  - [x] 18.1 Audit and update all modal usages
    - Ensure mobileFullScreen or mobileBottomSheet is enabled
    - Add safe area padding to all modals
    - _Requirements: 11.1_
  - [x] 18.2 Update modal close buttons
    - Ensure all close buttons meet 44px touch target
    - Position accessibly (top-right with adequate padding)
    - _Requirements: 11.2_
  - [x] 18.3 Update modal scroll behavior
    - Ensure internal scrolling works properly
    - Prevent background scroll when modal is open
    - _Requirements: 11.3_
  - [x] 18.4 Update confirmation dialogs
    - Stack action buttons vertically on mobile
    - Ensure adequate spacing between buttons
    - _Requirements: 11.4_
  - [x] 18.5 Write property test for no hardcoded layout dimensions
    - **Property 5: No Hardcoded Layout Dimensions**
    - **Validates: Requirements 1.4, 12.2**

## Phase 13: Typography & Spacing Audit

- [x] 19. Audit and fix typography across all modules
  - [x] 19.1 Audit all font-size declarations
    - Replace hardcoded px values with fluid typography
    - Ensure minimum 12px for all text, 16px for body
    - _Requirements: 12.1, 12.4_
  - [x] 19.2 Audit all heading elements
    - Ensure headings use clamp() or responsive classes
    - Verify proper scaling between breakpoints
    - _Requirements: 12.3_
  - [x] 19.3 Audit all line-height declarations
    - Replace fixed px values with relative values (1.5+)
    - _Requirements: 12.5_
  - [x] 19.4 Write property test for minimum font size
    - **Property 7: Minimum Font Size**
    - **Validates: Requirements 12.4**
  - [x] 19.5 Write property test for line height relative values
    - **Property 18: Line Height Relative Values**
    - **Validates: Requirements 12.5**

- [x] 20. Audit and fix spacing across all modules
  - [x] 20.1 Audit all padding and margin declarations
    - Replace hardcoded px values with CSS variables or Tailwind classes
    - Ensure responsive spacing scales with viewport
    - _Requirements: 12.2_
  - [x] 20.2 Audit all gap declarations in grids/flexbox
    - Use responsive gap values
    - _Requirements: 12.2_

- [x] 21. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 14: Loading States & Error Handling

- [x] 22. Optimize loading and error states for mobile
  - [x] 22.1 Audit all skeleton loaders
    - Ensure skeleton dimensions match final content
    - Use responsive sizing
    - _Requirements: 14.1_
  - [x] 22.2 Audit all image elements
    - Ensure responsive sizing with aspect ratio containers
    - Add proper loading states
    - _Requirements: 14.2_
  - [x] 22.3 Audit all loading indicators
    - Ensure loading spinners are in touch-target compliant containers
    - _Requirements: 14.3_
  - [x] 22.4 Audit all error states
    - Ensure error messages are mobile-friendly
    - Ensure retry buttons meet touch target
    - _Requirements: 14.4_
  - [x] 22.5 Audit all empty states
    - Ensure responsive layouts
    - Ensure appropriately sized illustrations
    - _Requirements: 14.5_
  - [x] 22.6 Write property test for image responsiveness
    - **Property 16: Image Responsiveness**
    - **Validates: Requirements 14.2**
  - [x] 22.7 Write property test for empty state responsiveness
    - **Property 17: Empty State Responsiveness**
    - **Validates: Requirements 14.5**

## Phase 15: Final Validation

- [x] 23. Final comprehensive testing
  - [x] 23.1 Run all property-based tests
    - Ensure 100+ iterations per test
    - Test across all viewport widths
    - _Requirements: All_
  - [x] 23.2 Manual testing on real devices
    - Test on iPhone (Safari)
    - Test on Android (Chrome)
    - Test on iPad (Safari)
    - _Requirements: All_
  - [x] 23.3 Accessibility audit
    - Verify touch targets with accessibility tools
    - Verify focus management on mobile
    - _Requirements: 1.3, 6.2_

- [x] 24. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
