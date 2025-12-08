# Frontend 2025 Redesign - Implementation Plan

## Overview

This implementation plan transforms the 1v1bro frontend into a professional, enterprise-grade 2025 design system. The plan is organized into phases that build incrementally, ensuring each phase produces working code.

**Estimated Time:** 2-3 weeks
**New Files:** ~20 files
**Modified Files:** ~15 files

---

## Phase 1: Design System Foundation

- [x] 1. Create Design Tokens
  - [x] 1.1 Create `frontend/src/styles/tokens.css`
    - Define CSS custom properties for colors (bg, text, accent, border, rarity)
    - Define spacing scale (4px base: 1-16)
    - Define typography (font-family, sizes xs-4xl, weights)
    - Define border radius (sm-full)
    - Define shadows (sm-xl)
    - Define transition durations (fast, normal, slow)
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 1.2 Update `frontend/src/index.css`
    - Import tokens.css
    - Remove legacy cyan/purple color definitions
    - Update base styles to use design tokens
    - Add shimmer animation keyframes for skeletons
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.3 Write property test for no legacy colors
    - **Property 14: No Legacy Colors**
    - Generate component renders, verify no cyan (#06b6d4) or purple (#a855f7)
    - **Validates: Requirements 1.3**

- [x] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 2: Core Component Library

- [x] 3. Update Button Component
  - [x] 3.1 Update `frontend/src/components/ui/Button.tsx`
    - Add `premium` variant with amber gradient
    - Update all variants to use design tokens
    - Add `leftIcon` and `rightIcon` props
    - Add active state with scale(0.98) transform
    - Ensure focus ring uses indigo-500
    - _Requirements: 2.1, 7.1_

  - [x] 3.2 Write property test for button variants
    - **Property 1: Button Variant Styling**
    - **Validates: Requirements 2.1**

- [x] 4. Update Input Component
  - [x] 4.1 Update `frontend/src/components/ui/Input.tsx`
    - Update background to #111111, border to white/6%
    - Add `leftIcon` and `rightIcon` slots
    - Update focus state to indigo-500 ring
    - Ensure error state uses rose-500
    - _Requirements: 2.2_

- [x] 5. Update Badge Component
  - [x] 5.1 Update `frontend/src/components/ui/Badge.tsx`
    - Add rarity variants (common, uncommon, rare, epic, legendary)
    - Add shimmer animation option for legendary
    - Update colors to match design tokens
    - _Requirements: 2.5_

  - [x] 5.2 Write property test for badge rarity colors
    - **Property 2: Badge Rarity Colors**
    - **Validates: Requirements 2.5**

- [x] 6. Create Modal Component
  - [x] 6.1 Create `frontend/src/components/ui/Modal.tsx`
    - Implement backdrop with blur and bg-black/60%
    - Add scale animation (0.95 → 1.0) on open
    - Implement focus trap within modal
    - Add Escape key to close
    - Add close button in top-right
    - Support size variants (sm, md, lg, xl)
    - _Requirements: 2.4_

  - [x] 6.2 Write property test for modal focus trap
    - **Property 3: Modal Focus Trap**
    - **Validates: Requirements 2.4**

- [x] 7. Create Additional UI Components
  - [x] 7.1 Create `frontend/src/components/ui/Tooltip.tsx`
    - Dark tooltip with white text
    - Configurable position (top, bottom, left, right)
    - Arrow pointing to trigger
    - 200ms delay before showing
    - _Requirements: 2.6_

  - [x] 7.2 Create `frontend/src/components/ui/Select.tsx`
    - Dropdown trigger matching Input styling
    - Options list with hover highlighting
    - Checkmark for selected option
    - Keyboard navigation (arrows, enter, escape)
    - _Requirements: 2.7_

  - [x] 7.3 Create `frontend/src/components/ui/Progress.tsx`
    - Linear variant with rounded track and animated fill
    - Circular variant with SVG ring
    - Color variants (default, success, warning, premium)
    - Optional percentage label
    - _Requirements: 2.8_

  - [x] 7.4 Update `frontend/src/components/ui/Skeleton.tsx`
    - Add shimmer animation (left-to-right gradient sweep)
    - Add shape variants (text, circle, rectangle, card)
    - Ensure animation uses 1.5s duration
    - _Requirements: 2.9_

- [x] 8. Create Toast System
  - [x] 8.1 Create `frontend/src/components/ui/Toast.tsx`
    - Toast component with type variants (success, error, info, warning)
    - Slide-in animation from top-right
    - Auto-dismiss with configurable duration
    - Manual dismiss with X button
    - Stack multiple toasts with 8px gap
    - _Requirements: 7.4_

  - [x] 8.2 Create `frontend/src/hooks/useToast.ts`
    - Toast state management
    - addToast, removeToast functions
    - Auto-dismiss timer handling
    - _Requirements: 7.4_

- [x] 9. Create Confetti Component
  - [x] 9.1 Create `frontend/src/components/ui/Confetti.tsx`
    - Particle burst animation
    - Configurable particle count and colors
    - Rarity-based presets (common: 20, legendary: 100)
    - 1-2 second duration
    - _Requirements: 7.5_

  - [x] 9.2 Create `frontend/src/hooks/useConfetti.ts`
    - Trigger confetti with rarity parameter
    - Handle animation lifecycle
    - _Requirements: 7.5_

- [x] 10. Update Component Exports
  - [x] 10.1 Update `frontend/src/components/ui/index.ts`
    - Export all new components (Modal, Tooltip, Select, Progress, Toast, Confetti)
    - _Requirements: 2.1-2.10_

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 3: Shop Module Redesign

- [x] 12. Create Shop Components
  - [x] 12.1 Create `frontend/src/components/shop/ShopCard.tsx`
    - Rarity gradient border based on item rarity
    - Aspect-square preview image
    - Name, type badge, price with coin icon
    - Hover: scale(1.02), shadow enhancement
    - Owned state: green badge, disabled purchase, opacity 0.8
    - Limited: pulsing badge indicator
    - _Requirements: 3.1, 3.2, 3.7_

  - [x] 12.2 Write property test for owned item display
    - **Property 6: Owned Item Display**
    - **Validates: Requirements 3.7**

  - [x] 12.3 Create `frontend/src/components/shop/ShopFilters.tsx`
    - Horizontal pill buttons for type filter
    - Dropdown for rarity filter
    - Sort dropdown (featured, price, newest, rarity)
    - Active filters highlighted with indigo background
    - _Requirements: 3.3, 3.10_

  - [x] 12.4 Write property test for shop filter application
    - **Property 4: Shop Filter Application**
    - **Validates: Requirements 3.3**

  - [x] 12.5 Write property test for shop sort order
    - **Property 5: Shop Sort Order**
    - **Validates: Requirements 3.10**

  - [x] 12.6 Create `frontend/src/components/shop/FeaturedItem.tsx`
    - Full-width hero card
    - Large preview image (400px+)
    - Animated glow effect
    - "Featured" badge
    - Countdown timer for limited items
    - _Requirements: 3.4_

  - [x] 12.7 Create `frontend/src/components/shop/PurchaseModal.tsx`
    - Item preview centered
    - Price breakdown (cost, balance, remaining)
    - Confirm and Cancel buttons
    - Insufficient funds state with "Get Coins" CTA
    - Loading state during purchase
    - _Requirements: 3.5_

  - [x] 12.8 Create `frontend/src/hooks/useCountdown.ts`
    - Countdown timer hook for limited items
    - Returns days, hours, minutes, seconds
    - Updates every second
    - _Requirements: 3.9_

  - [x] 12.9 Write property test for limited item countdown
    - **Property 7: Limited Item Countdown**
    - **Validates: Requirements 3.9**

- [x] 13. Update Shop Page
  - [x] 13.1 Update `frontend/src/pages/Shop.tsx`
    - Integrate FeaturedItem hero section
    - Integrate ShopFilters component
    - Replace ShopGrid with new ShopCard grid
    - Add skeleton loading states
    - Integrate PurchaseModal
    - Add confetti on successful purchase
    - _Requirements: 3.1-3.10_

  - [x] 13.2 Update `frontend/src/components/cosmetics/ShopGrid.tsx`
    - Use new ShopCard component
    - Implement responsive grid (2/3/4 columns)
    - Add skeleton loading state
    - _Requirements: 3.1, 3.8_

  - [x] 13.3 Write property test for responsive grid columns
    - **Property 11: Responsive Grid Columns**
    - **Validates: Requirements 3.1, 6.1**

- [x] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 4: Battle Pass Redesign

- [x] 15. Create Battle Pass Components
  - [x] 15.1 Create `frontend/src/components/battlepass/SeasonHeader.tsx`
    - Season name and theme display
    - Banner/artwork image
    - Days remaining countdown
    - "Ending Soon" warning if < 3 days
    - _Requirements: 4.7_

  - [x] 15.2 Create `frontend/src/components/battlepass/XPProgressBar.tsx`
    - Current tier number prominently displayed
    - Gradient progress bar (indigo → purple)
    - "currentXP / xpToNextTier XP" text format
    - Percentage label on bar
    - Animated fill on XP changes
    - _Requirements: 4.5_

  - [x] 15.3 Write property test for XP progress calculation
    - **Property 8: XP Progress Calculation**
    - **Validates: Requirements 4.5**

  - [x] 15.4 Create `frontend/src/components/battlepass/TierCard.tsx`
    - Tier number badge
    - Free reward (bottom) and premium reward (top)
    - Lock icon on premium if not purchased
    - Glow effect if claimable (emerald for free, amber for premium)
    - Checkmark if claimed
    - Reduced opacity (0.5) if locked
    - Claim button overlay when claimable
    - _Requirements: 4.2, 4.3, 4.9_

  - [x] 15.5 Write property test for tier claimable state
    - **Property 9: Tier Claimable State**
    - **Validates: Requirements 4.3**

  - [x] 15.6 Write property test for premium lock display
    - **Property 10: Premium Lock Display**
    - **Validates: Requirements 4.2, 4.9**

  - [x] 15.7 Create `frontend/src/components/battlepass/PremiumUpsell.tsx`
    - Banner for non-premium users
    - Preview of 3-5 locked premium rewards
    - "Upgrade to Premium" CTA with amber styling
    - Price and value proposition
    - _Requirements: 4.6_

- [x] 16. Update Battle Pass Track
  - [x] 16.1 Update `frontend/src/components/battlepass/BattlePassTrack.tsx`
    - Horizontal scrollable track with snap-scroll
    - Use new TierCard component
    - Auto-scroll to current tier on load
    - Visual connector line between tiers
    - Keyboard navigation (left/right arrows)
    - Scroll indicators when more content exists
    - _Requirements: 4.1, 4.2, 4.8_

- [x] 17. Update Battle Pass Page
  - [x] 17.1 Update `frontend/src/pages/BattlePass.tsx`
    - Integrate SeasonHeader component
    - Integrate XPProgressBar component
    - Use updated BattlePassTrack
    - Integrate PremiumUpsell for non-premium users
    - Add claim animations with particle effects
    - Add skeleton loading states
    - _Requirements: 4.1-4.10_

- [x] 18. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 5: Dashboard Polish

- [x] 19. Update Dashboard Styling
  - [x] 19.1 Update `frontend/src/components/dashboard/DashboardLayout.tsx`
    - Ensure #0a0a0a base background
    - Verify max-width container (1280px)
    - Ensure consistent 24px padding
    - _Requirements: 5.1_

  - [x] 19.2 Update `frontend/src/components/dashboard/Sidebar.tsx`
    - Update active state to indigo-500 left border
    - Update hover state to bg-white/5%
    - Ensure smooth width transition (200ms)
    - Remove any cyan/purple colors
    - _Requirements: 5.2_

  - [x] 19.3 Update all dashboard widgets
    - Update `QuickActionsWidget.tsx` - use #111111 bg, white/6% border
    - Update `BattlePassWidget.tsx` - use design tokens
    - Update `MatchHistoryWidget.tsx` - use design tokens
    - Update `FriendsWidget.tsx` - use design tokens
    - Ensure rounded-xl corners, 20px padding
    - Remove any cyan/purple colors
    - _Requirements: 5.3_

  - [x] 19.4 Update `frontend/src/components/dashboard/DashboardHeader.tsx`
    - Ensure avatar is 32px, rounded-full
    - Add coin balance with coin icon
    - Verify notification bell styling
    - Remove any cyan/purple colors
    - _Requirements: 5.4_

- [x] 20. Create Empty States
  - [x] 20.1 Create `frontend/src/components/ui/EmptyState.tsx`
    - Icon/illustration (64px, neutral-600)
    - Title and description text
    - Primary action button
    - Consistent styling
    - _Requirements: 5.5_

  - [x] 20.2 Add empty states to widgets
    - MatchHistoryWidget: "No matches yet" with "Play a Match" CTA
    - FriendsWidget: "No friends online" with "Add Friends" CTA
    - BattlePassWidget: "No active season" message
    - _Requirements: 5.5_

- [x] 21. Add Loading Skeletons
  - [x] 21.1 Add skeleton states to dashboard widgets
    - QuickActionsWidget skeleton
    - BattlePassWidget skeleton
    - MatchHistoryWidget skeleton (3-5 row skeletons)
    - FriendsWidget skeleton (3-5 row skeletons)
    - _Requirements: 5.6_

- [x] 22. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 6: Accessibility and Polish

- [x] 23. Accessibility Improvements
  - [x] 23.1 Add keyboard focus styles
    - Ensure all interactive elements have visible focus ring
    - Use 2px indigo-500 ring
    - Verify logical tab order
    - _Requirements: 6.2_

  - [x] 23.2 Write property test for keyboard focus visibility
    - **Property 12: Keyboard Focus Visibility**
    - **Validates: Requirements 6.2**

  - [x] 23.3 Add ARIA labels
    - Add aria-label to icon-only buttons
    - Add aria-live regions for dynamic content
    - Ensure semantic HTML throughout
    - _Requirements: 6.3_

  - [x] 23.4 Verify touch targets
    - Ensure minimum 44x44px tap targets
    - Add touch feedback (opacity change)
    - _Requirements: 6.5_

  - [x] 23.5 Write property test for touch target size
    - **Property 13: Touch Target Size**
    - **Validates: Requirements 6.5**

- [x] 24. Animation Polish
  - [x] 24.1 Add card hover animations
    - translateY(-2px) lift effect
    - Shadow enhancement (shadow-lg → shadow-xl)
    - Border brightening (white/6% → white/10%)
    - 200ms ease-out transition
    - _Requirements: 7.2_

  - [x] 24.2 Add page transitions
    - Fade out old content (150ms)
    - Fade in new content (150ms)
    - _Requirements: 7.6_

- [x] 25. Final Color Audit
  - [x] 25.1 Search and replace legacy colors
    - Find all instances of cyan-* classes
    - Find all instances of purple-* classes
    - Replace with appropriate indigo/amber alternatives
    - Verify no hardcoded #06b6d4 or #a855f7
    - _Requirements: 1.3_

- [x] 26. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Quick Reference

### New Files
| File | Purpose |
|------|---------|
| styles/tokens.css | Design tokens as CSS custom properties |
| components/ui/Modal.tsx | Modal with animations and focus trap |
| components/ui/Tooltip.tsx | Tooltip component |
| components/ui/Select.tsx | Dropdown select component |
| components/ui/Progress.tsx | Linear and circular progress |
| components/ui/Toast.tsx | Toast notification component |
| components/ui/Confetti.tsx | Celebration particle effects |
| components/ui/EmptyState.tsx | Empty state component |
| components/shop/ShopCard.tsx | Individual shop item card |
| components/shop/ShopFilters.tsx | Filter pills and sort dropdown |
| components/shop/FeaturedItem.tsx | Hero featured item section |
| components/shop/PurchaseModal.tsx | Purchase confirmation modal |
| components/battlepass/SeasonHeader.tsx | Season info with countdown |
| components/battlepass/TierCard.tsx | Individual tier card |
| components/battlepass/XPProgressBar.tsx | XP progress display |
| components/battlepass/PremiumUpsell.tsx | Premium upgrade CTA |
| hooks/useToast.ts | Toast state management |
| hooks/useConfetti.ts | Confetti animation hook |
| hooks/useCountdown.ts | Countdown timer hook |

### Modified Files
| File | Changes |
|------|---------|
| index.css | Import tokens, remove legacy colors, add animations |
| components/ui/Button.tsx | Add premium variant, update colors |
| components/ui/Input.tsx | Add icon slots, update styling |
| components/ui/Badge.tsx | Add rarity variants |
| components/ui/Skeleton.tsx | Add shimmer animation |
| components/ui/index.ts | Export new components |
| pages/Shop.tsx | Full redesign with new components |
| components/cosmetics/ShopGrid.tsx | Use ShopCard, responsive grid |
| pages/BattlePass.tsx | Full redesign with new components |
| components/battlepass/BattlePassTrack.tsx | Horizontal scroll, TierCard |
| components/dashboard/DashboardLayout.tsx | Update styling |
| components/dashboard/Sidebar.tsx | Update colors, transitions |
| components/dashboard/DashboardHeader.tsx | Update styling |
| components/dashboard/*.tsx | Update all widgets |

### Property Tests Summary
| Property | Test File | Validates |
|----------|-----------|-----------|
| 1. Button Variant Styling | ui.test.ts | 2.1 |
| 2. Badge Rarity Colors | ui.test.ts | 2.5 |
| 3. Modal Focus Trap | ui.test.ts | 2.4 |
| 4. Shop Filter Application | shop.test.ts | 3.3 |
| 5. Shop Sort Order | shop.test.ts | 3.10 |
| 6. Owned Item Display | shop.test.ts | 3.7 |
| 7. Limited Item Countdown | shop.test.ts | 3.9 |
| 8. XP Progress Calculation | battlepass.test.ts | 4.5 |
| 9. Tier Claimable State | battlepass.test.ts | 4.3 |
| 10. Premium Lock Display | battlepass.test.ts | 4.2, 4.9 |
| 11. Responsive Grid Columns | shop.test.ts | 3.1, 6.1 |
| 12. Keyboard Focus Visibility | accessibility.test.ts | 6.2 |
| 13. Touch Target Size | accessibility.test.ts | 6.5 |
| 14. No Legacy Colors | design-system.test.ts | 1.3 |

---

*Total Tasks: 26 phases with sub-tasks*
*Estimated Time: 2-3 weeks*
*New Files: ~20*
*Property Tests: 14*
