# Battle Pass Enterprise Upgrade - Implementation Plan

## Overview

This implementation plan transforms the Battle Pass experience into an enterprise-grade system matching the quality established in the Item Shop redesign. The plan is organized into phases that build incrementally, ensuring each phase produces working code.

**Estimated Time:** 1-2 weeks
**New Files:** 7 files
**Modified Files:** 6 files

---

## Phase 1: Enterprise Component Foundation

- [x] 1. Create Enterprise Directory Structure
  - [x] 1.1 Create `frontend/src/components/battlepass/enterprise/` directory
    - Create directory structure for enterprise components
    - _Requirements: 1.1_

  - [x] 1.2 Create `frontend/src/components/battlepass/enterprise/index.ts`
    - Create barrel export file (initially empty, will add exports as components are created)
    - _Requirements: 1.4_

- [x] 2. Create BattlePassHeader Component
  - [x] 2.1 Create `frontend/src/components/battlepass/enterprise/BattlePassHeader.tsx`
    - Implement season name with 4xl-5xl extrabold gradient text
    - Add theme subtitle with sm uppercase tracking-wider
    - Add 1.5px gradient accent bar below title
    - Implement XP quick display with tier badge
    - Add countdown timer using useCountdown hook
    - Support seasonal theme colors (default, winter, summer, halloween, neon)
    - Add optional banner image background with gradient overlay
    - _Requirements: 2.1, 4.4_

  - [ ]* 2.2 Write property test for countdown timer accuracy
    - **Property 6: Countdown Timer Accuracy**
    - **Validates: Requirements 4.4**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 2: Reward Display System

- [x] 4. Create RewardDisplayBox Component
  - [x] 4.1 Create `frontend/src/components/battlepass/enterprise/RewardDisplayBox.tsx`
    - Implement sizeConfig with xl/lg/md/sm specifications
    - Add size-specific typography (titleSize, titleWeight, typeSize)
    - Implement rarity borders, glows, and background gradients
    - Add reward preview image/icon display
    - Add reward name and type label
    - Implement claim state styling (locked, claimable, claimed)
    - Add premium theming (amber gradient background, crown badge)
    - Add lock overlay for locked premium rewards
    - Add checkmark overlay for claimed rewards
    - Add pulsing glow for claimable rewards
    - _Requirements: 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2_

  - [ ]* 4.2 Write property test for size config typography consistency
    - **Property 4: Size Config Typography Consistency**
    - **Validates: Requirements 2.3, 3.1**

  - [ ]* 4.3 Write property test for rarity theming application
    - **Property 5: Rarity Theming Application**
    - **Validates: Requirements 3.2**

  - [ ]* 4.4 Write property test for premium lock display
    - **Property 3: Premium Lock Display**
    - **Validates: Requirements 5.2**

- [x] 5. Create ClaimCTA Component
  - [x] 5.1 Create `frontend/src/components/battlepass/enterprise/ClaimCTA.tsx`
    - Implement variant styles (default, premium, claimed, locked)
    - Add size variants (sm, md, lg)
    - Add loading state with spinner
    - Add checkmark icon for claimed variant
    - Add lock icon for locked variant
    - Implement hover and active states
    - Add uppercase tracking on small buttons
    - _Requirements: 7.1_

  - [ ]* 5.2 Write property test for claim state transitions
    - **Property 7: Claim State Transitions**
    - **Validates: Requirements 7.3, 7.4**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 3: Progress Visualization

- [x] 7. Create ProgressSection Component
  - [x] 7.1 Create `frontend/src/components/battlepass/enterprise/ProgressSection.tsx`
    - Implement prominent tier badge with accent styling
    - Add gradient XP progress bar (indigo→purple)
    - Display "currentXP / xpToNextTier XP" with tabular-nums
    - Add percentage label positioned at fill edge
    - Add "X XP to Tier Y" hint text
    - Implement 500ms ease-out fill animation
    - Use 12px height track with elevated background
    - _Requirements: 4.1, 4.2_

  - [ ]* 7.2 Write property test for XP progress percentage calculation
    - **Property 1: XP Progress Percentage Calculation**
    - **Validates: Requirements 4.1, 4.2**

- [x] 8. Create TierIndicator Component
  - [x] 8.1 Create `frontend/src/components/battlepass/enterprise/TierIndicator.tsx`
    - Implement current tier styling (accent bg, scale 1.1, glow)
    - Add unlocked tier styling (elevated bg, white text)
    - Add locked tier styling (subtle bg, muted text, opacity 50%)
    - Support size variants (sm, md, lg)
    - Add transition animations between states
    - _Requirements: 2.4_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 4: Section Organization

- [x] 10. Create TrackSection Component
  - [x] 10.1 Create `frontend/src/components/battlepass/enterprise/TrackSection.tsx`
    - Implement section header with icon container (12x12)
    - Add H2 title (2xl-3xl bold) and subtitle (sm muted)
    - Support badge variants (default, hot, new, limited, premium)
    - Add optional countdown timer
    - Implement consistent padding (24px) and margin (48px bottom)
    - Add View All link option
    - _Requirements: 2.2, 6.1, 6.3_

- [x] 11. Update Enterprise Exports
  - [x] 11.1 Update `frontend/src/components/battlepass/enterprise/index.ts`
    - Export BattlePassHeader
    - Export RewardDisplayBox
    - Export ProgressSection
    - Export TrackSection
    - Export TierIndicator
    - Export ClaimCTA
    - _Requirements: 1.4_

- [x] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 5: Battle Pass Track Integration

- [x] 13. Update BattlePassTrack Component
  - [x] 13.1 Update `frontend/src/components/battlepass/BattlePassTrack.tsx`
    - Replace TierCard internals with RewardDisplayBox
    - Add TierIndicator for tier numbers
    - Implement visual connector line between tiers
    - Add filled portion in accent color up to current tier
    - Improve scroll indicators styling
    - Add keyboard navigation (left/right arrows)
    - Auto-scroll to current tier on load
    - Use responsive size variants (SM mobile, MD tablet, LG desktop)
    - _Requirements: 4.3, 6.4, 8.1, 8.2, 8.3_

  - [ ]* 13.2 Write property test for tier claimable state determination
    - **Property 2: Tier Claimable State Determination**
    - **Validates: Requirements 7.2**

  - [ ]* 13.3 Write property test for responsive size variant selection
    - **Property 8: Responsive Size Variant Selection**
    - **Validates: Requirements 8.1, 8.2, 8.3**

- [x] 14. Update TierCard Component
  - [x] 14.1 Update `frontend/src/components/battlepass/TierCard.tsx`
    - Integrate RewardDisplayBox for free and premium rewards
    - Use TierIndicator for tier number display
    - Add ClaimCTA for claim buttons
    - Implement claimable glow effects (emerald free, amber premium)
    - Add claimed checkmark overlay
    - Add locked state with reduced opacity
    - _Requirements: 7.2, 7.3, 7.4_

- [x] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 6: Page Integration

- [x] 16. Update BattlePass Page
  - [x] 16.1 Update `frontend/src/pages/BattlePass.tsx`
    - Replace SeasonHeader with BattlePassHeader
    - Replace XPProgressBar with ProgressSection
    - Wrap BattlePassTrack in TrackSection
    - Add section organization with proper headers
    - Integrate confetti on successful claims
    - Update skeleton loading states
    - Ensure proper section spacing and layout
    - _Requirements: 6.2_

- [x] 17. Update PremiumUpsell Component
  - [x] 17.1 Update `frontend/src/components/battlepass/PremiumUpsell.tsx`
    - Update to enterprise styling (amber gradient background)
    - Add crown icon badge
    - Update headline to 2xl bold
    - Improve reward preview display with lock overlays
    - Update CTA button to premium variant styling
    - Add shadow and glow effects
    - _Requirements: 5.3, 5.4_

- [x] 18. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 7: Polish and Animations

- [x] 19. Add Claim Animations
  - [x] 19.1 Add claim flow animations
    - Add loading state on claim button during API call
    - Trigger confetti burst on successful claim (rarity-appropriate)
    - Add "+[reward]" toast notification
    - Animate checkmark overlay appearance
    - Update claimed status immediately (optimistic update)
    - _Requirements: 7.3_

- [x] 20. Add Micro-interactions
  - [x] 20.1 Add hover and interaction animations
    - Add translateY(-2px) lift on RewardDisplayBox hover
    - Add shadow enhancement on hover
    - Add scale(0.98) on ClaimCTA click
    - Add smooth XP bar fill transitions
    - Add countdown number fade transitions
    - _Requirements: 7.1, 7.2_

- [x] 21. Add Responsive Behavior
  - [x] 21.1 Implement responsive breakpoints
    - Mobile (<640px): Stack header, SM tier cards, 2-3 visible tiers
    - Tablet (640-1024px): MD tier cards, 4-5 visible tiers
    - Desktop (>1024px): LG/XL featured, 6-8 visible tiers
    - Ensure 44x44px minimum tap targets
    - Add swipe gesture support for track scrolling
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 22. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Quick Reference

### New Files
| File | Purpose |
|------|---------|
| components/battlepass/enterprise/index.ts | Barrel export file |
| components/battlepass/enterprise/BattlePassHeader.tsx | Enterprise page header |
| components/battlepass/enterprise/RewardDisplayBox.tsx | Configurable reward display |
| components/battlepass/enterprise/ProgressSection.tsx | Combined progress display |
| components/battlepass/enterprise/TrackSection.tsx | Section container |
| components/battlepass/enterprise/TierIndicator.tsx | Tier number display |
| components/battlepass/enterprise/ClaimCTA.tsx | Claim buttons |

### Modified Files
| File | Changes |
|------|---------|
| pages/BattlePass.tsx | Integrate enterprise components, add sections |
| components/battlepass/BattlePassTrack.tsx | Use enterprise components, improve styling |
| components/battlepass/TierCard.tsx | Integrate RewardDisplayBox, ClaimCTA |
| components/battlepass/PremiumUpsell.tsx | Upgrade to enterprise styling |
| components/battlepass/SeasonHeader.tsx | May deprecate in favor of BattlePassHeader |
| components/battlepass/XPProgressBar.tsx | May deprecate in favor of ProgressSection |

### Property Tests Summary
| Property | Test File | Validates |
|----------|-----------|-----------|
| 1. XP Progress Percentage Calculation | battlepass.test.ts | 4.1, 4.2 |
| 2. Tier Claimable State Determination | battlepass.test.ts | 7.2 |
| 3. Premium Lock Display | battlepass.test.ts | 5.2 |
| 4. Size Config Typography Consistency | battlepass.test.ts | 2.3, 3.1 |
| 5. Rarity Theming Application | battlepass.test.ts | 3.2 |
| 6. Countdown Timer Accuracy | battlepass.test.ts | 4.4 |
| 7. Claim State Transitions | battlepass.test.ts | 7.3, 7.4 |
| 8. Responsive Size Variant Selection | battlepass.test.ts | 8.1, 8.2, 8.3 |

### Size Configuration Reference
| Size | Min Height | Image | Title | Type Label | Description |
|------|------------|-------|-------|------------|-------------|
| XL | 420px | 240px | 28px extrabold | 12px | 14px |
| LG | 200px | 160px | 22px bold | 11px | 13px |
| MD | 280px | 120px | 16px bold | 10px | none |
| SM | 180px | 80px | 14px semibold | none | none |

### Rarity Theming Reference
| Rarity | Border | Hover Glow | Background |
|--------|--------|------------|------------|
| Common | #737373/40% | none | #737373/5% |
| Uncommon | #10b981/40% | 0_0_30px rgba(16,185,129,0.2) | #10b981/10% |
| Rare | #3b82f6/40% | 0_0_30px rgba(59,130,246,0.25) | #3b82f6/10% |
| Epic | #a855f7/40% | 0_0_35px rgba(168,85,247,0.3) | #a855f7/10% |
| Legendary | #f59e0b/50% | 0_0_40px rgba(245,158,11,0.35) | #f59e0b/15% |

---

*Total Tasks: 22 phases with sub-tasks*
*Estimated Time: 1-2 weeks*
*New Files: 7*
*Property Tests: 8*

