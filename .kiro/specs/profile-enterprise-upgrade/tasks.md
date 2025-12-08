# Profile Enterprise Upgrade - Implementation Plan

## Overview

This implementation plan transforms the Profile experience into an enterprise-grade system matching the quality established in the Item Shop, Battle Pass, and Inventory redesigns. The plan is organized into phases that build incrementally, ensuring each phase produces working code.

**Estimated Time:** 1-2 weeks
**New Files:** 11 files
**Modified Files:** 3 files

---

## Phase 1: Enterprise Component Foundation

- [x] 1. Create Enterprise Directory Structure
  - [x] 1.1 Create `frontend/src/components/profile/enterprise/` directory
    - Create directory structure for enterprise components
    - _Requirements: 1.1_

  - [x] 1.2 Create `frontend/src/components/profile/enterprise/index.ts`
    - Create barrel export file (initially empty, will add exports as components are created)
    - _Requirements: 1.4_

- [x] 2. Create ProfileSection Component
  - [x] 2.1 Create `frontend/src/components/profile/enterprise/ProfileSection.tsx`
    - Implement section header with icon container (10x10, 40px)
    - Add H2 title (xl-2xl bold) and subtitle (sm muted)
    - Support badge variants (default, count, new)
    - Implement consistent padding (24px) and margin (32px bottom)
    - Add optional collapse/expand functionality
    - _Requirements: 2.2, 7.1_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 2: Profile Header System

- [x] 4. Create ProfileHeader Component (Unified Progression)
  - [x] 4.1 Create `frontend/src/components/profile/enterprise/ProfileHeader.tsx`
    - Implement full-width banner (256px desktop, 160px mobile)
    - Add gradient overlay from transparent to rgba(0,0,0,0.7)
    - Display avatar (120px) with 4px border
    - Implement tier ring with circular progress indicator (uses Battle Pass progress)
    - Accept battlePassProgress prop for unified progression display
    - Add player identity section (name H1 3xl-4xl extrabold, title sm accent, tier badge)
    - Add country flag emoji with tooltip
    - Add edit button for own profile (top-right)
    - Handle banner image vs solid color display
    - Handle no active season state (show 0% progress, "No Active Season")
    - _Requirements: 2.1, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 4.2 Write property test for profile header typography
    - **Property 1: Profile Header Typography**
    - **Validates: Requirements 2.1**

  - [x] 4.3 Write property test for banner display mode
    - **Property 3: Banner Display Mode**
    - **Validates: Requirements 3.2, 3.3**

  - [x] 4.4 Write property test for tier ring progress calculation (unified)
    - **Property 4: Tier Ring Progress Calculation**
    - **Validates: Requirements 3.4**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 3: Statistics Dashboard

- [x] 6. Create StatsCard Component
  - [x] 6.1 Create `frontend/src/components/profile/enterprise/StatsCard.tsx`
    - Implement value display (2xl-3xl bold, tabular-nums)
    - Add label display (xs-sm medium, uppercase, tracking-wider, muted)
    - Support optional trend indicator (↑/↓) with color coding
    - Add color code variants (default, success, warning, danger)
    - Implement card background with subtle border
    - Add hover lift effect (translateY -2px, shadow enhancement)
    - Support optional icon display
    - _Requirements: 2.3, 4.2, 4.5_

  - [x] 6.2 Write property test for stats card typography
    - **Property 2: Stats Card Typography**
    - **Validates: Requirements 2.3**

- [x] 7. Create StatsDashboard Component (Unified Progression)
  - [x] 7.1 Create `frontend/src/components/profile/enterprise/StatsDashboard.tsx`
    - Implement responsive grid (2 cols mobile, 3-4 cols desktop)
    - Accept both profile and battlePassProgress props
    - Configure 6 stats: Games Played, Wins, Win Rate, Current Tier (from Battle Pass), Season XP (from Battle Pass), Best Streak
    - Calculate win rate with color coding (green >60%, yellow 40-60%, red <40%)
    - Format large numbers with compact notation (12.5k)
    - Handle edge case of 0 games played (show "N/A" for win rate)
    - Handle no active season (show "—" for tier and XP)
    - Add click handler on tier card to navigate to Battle Pass page
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.7_

  - [x] 7.2 Write property test for win rate calculation and color coding
    - **Property 5: Win Rate Calculation and Color Coding**
    - **Validates: Requirements 4.3**

  - [x] 7.3 Write property test for stats dashboard card count (unified)
    - **Property 6: Stats Dashboard Card Count**
    - **Validates: Requirements 4.1**

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 4: Match History Section

- [x] 9. Create MatchHistoryItem Component
  - [x] 9.1 Create `frontend/src/components/profile/enterprise/MatchHistoryItem.tsx`
    - Display opponent avatar (40px) and display name
    - Implement WIN/LOSS badge with color coding (green/red)
    - Show XP earned with icon
    - Display relative timestamp ("2 hours ago", "Yesterday")
    - Add left border accent based on outcome
    - Implement hover effect with background highlight
    - _Requirements: 2.4, 5.2, 5.3, 5.4_

  - [x] 9.2 Write property test for match outcome styling
    - **Property 7: Match Outcome Styling**
    - **Validates: Requirements 5.3, 5.4**

- [x] 10. Create MatchHistorySection Component
  - [x] 10.1 Create `frontend/src/components/profile/enterprise/MatchHistorySection.tsx`
    - Implement section header with "Recent Matches" title and count badge
    - Display list of MatchHistoryItems (5-10 matches)
    - Add "View All" link if more matches exist
    - Implement empty state with message
    - Add skeleton loading state (5 rows)
    - _Requirements: 5.1, 5.5_

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 5: Loadout Preview

- [x] 12. Create LoadoutPreview Component
  - [x] 12.1 Create `frontend/src/components/profile/enterprise/LoadoutPreview.tsx`
    - Implement horizontal row of 6 loadout slots
    - Display slot type icons for each slot
    - Show item preview (64px desktop, 48px mobile) with rarity border for filled slots
    - Show placeholder icon with dashed border for empty slots
    - Add item name below preview (truncated)
    - Implement rarity glow on hover for filled slots
    - Add "Customize" link to inventory page
    - Support responsive layout (6x1 desktop, 3x2 mobile)
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 12.2 Write property test for loadout slot display
    - **Property 8: Loadout Slot Display**
    - **Validates: Requirements 6.2, 6.3**

- [x] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 6: Social Links

- [x] 14. Create SocialLinkButton Component
  - [x] 14.1 Create `frontend/src/components/profile/enterprise/SocialLinkButton.tsx`
    - Implement platform icon display (Twitter, Twitch, YouTube, Discord)
    - Add platform name or username text
    - Apply platform brand color on hover
    - Handle external link behavior (open in new tab)
    - Handle Discord copy-to-clipboard with toast notification
    - Add external link indicator icon for URLs
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 14.2 Write property test for social link platform colors
    - **Property 9: Social Link Platform Colors**
    - **Validates: Requirements 7.4**

- [x] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 7: Achievement Showcase

- [x] 16. Create AchievementBadge Component
  - [x] 16.1 Create `frontend/src/components/profile/enterprise/AchievementBadge.tsx`
    - Display achievement icon (48px default, 64px for legendary)
    - Apply rarity-colored background to icon container
    - Show achievement name below icon
    - Implement rarity border and glow effects
    - Add shimmer animation for legendary achievements
    - Support size variants (sm, md, lg)
    - Add hover tooltip with description and earned date
    - Implement hover scale effect (1.1x)
    - _Requirements: 9.1, 9.3, 9.4_

  - [x] 16.2 Write property test for achievement rarity styling
    - **Property 10: Achievement Rarity Styling**
    - **Validates: Requirements 9.1, 9.3**

  - [x] 16.3 Write property test for achievement ordering
    - **Property 11: Achievement Ordering**
    - **Validates: Requirements 9.2**

- [x] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 8: Profile Editor Enhancement

- [x] 18. Create ProfileEditorForm Component
  - [x] 18.1 Create `frontend/src/components/profile/enterprise/ProfileEditorForm.tsx`
    - Implement split layout (form left, preview right on desktop)
    - Implement stacked layout (form above preview on mobile)
    - Add enterprise-styled form inputs with labels
    - Implement character count displays for text fields
    - Add display name validation (3-30 characters)
    - Add bio character count (0-500)
    - Implement avatar upload with preview and validation
    - Implement banner upload with preview and validation
    - Add file type validation (JPEG, PNG, WebP)
    - Add file size validation (<5MB)
    - Implement unsaved changes detection
    - Add "Unsaved changes" indicator
    - Enable/disable Save button based on changes
    - Add loading states for save and upload actions
    - Implement cancel with confirmation if unsaved changes
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 18.2 Write property test for display name validation
    - **Property 12: Display Name Validation**
    - **Validates: Requirements 8.2**

  - [x] 18.3 Write property test for file upload validation
    - **Property 13: File Upload Validation**
    - **Validates: Requirements 8.4**

  - [x] 18.4 Write property test for unsaved changes detection
    - **Property 14: Unsaved Changes Detection**
    - **Validates: Requirements 8.5**

- [x] 19. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 9: Update Enterprise Exports

- [x] 20. Update Enterprise Exports
  - [x] 20.1 Update `frontend/src/components/profile/enterprise/index.ts`
    - Export ProfileHeader
    - Export StatsCard
    - Export StatsDashboard
    - Export MatchHistoryItem
    - Export MatchHistorySection
    - Export LoadoutPreview
    - Export SocialLinkButton
    - Export AchievementBadge
    - Export ProfileSection
    - Export ProfileEditorForm
    - _Requirements: 1.4_

- [x] 21. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 10: Page Integration

- [x] 22. Update Profile Page (Unified Progression)
  - [x] 22.1 Update `frontend/src/pages/Profile.tsx`
    - Import and use useBattlePass hook for unified progression data
    - Pass battlePassProgress to ProfileHeader and StatsDashboard
    - Replace basic header with ProfileHeader (with tier ring)
    - Add ProfileSection "Statistics" with StatsDashboard (unified stats)
    - Add ProfileSection "Current Loadout" with LoadoutPreview
    - Add ProfileSection "Recent Matches" with MatchHistorySection
    - Add ProfileSection "Achievements" with AchievementBadge grid (if achievements exist)
    - Add ProfileSection "Connect" with SocialLinkButton row
    - Replace ProfileEditor with ProfileEditorForm in edit mode
    - Update skeleton loading states
    - Ensure proper section spacing and layout
    - Implement responsive breakpoints
    - Handle no active season state gracefully
    - _Requirements: 7.2, 10.1, 10.2, 10.3_

- [x] 23. Add Match History Hook
  - [x] 23.1 Create `frontend/src/hooks/useMatchHistory.ts` (if not exists)
    - Implement fetchMatchHistory function
    - Add pagination support
    - Handle loading and error states
    - _Requirements: 5.1_

- [x] 24. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 11: Polish and Animations

- [x] 25. Add Micro-interactions
  - [x] 25.1 Add hover and interaction animations
    - Add translateY(-2px) lift on StatsCard hover
    - Add scale(1.05) on avatar hover
    - Add platform color transition on SocialLinkButton hover
    - Add scale(1.1) on AchievementBadge hover
    - Add background highlight on MatchHistoryItem hover
    - _Requirements: 4.2, 3.5, 7.4, 9.4, 5.2_

- [x] 26. Add Level Ring Animation
  - [x] 26.1 Implement level ring animations
    - Animate progress from 0 to current value on load (800ms ease-out)
    - Add pulse effect on level up
    - _Requirements: 3.4_

- [x] 27. Add Loading Skeletons
  - [x] 27.1 Implement skeleton loading states
    - ProfileHeader skeleton (banner, avatar circle, text lines)
    - StatsDashboard skeleton (6 card skeletons with shimmer)
    - MatchHistorySection skeleton (5 row skeletons)
    - LoadoutPreview skeleton (6 slot skeletons)
    - _Requirements: 5.5_

- [x] 28. Add Responsive Behavior
  - [x] 28.1 Implement responsive breakpoints
    - Mobile (<640px): Stack sections, 160px banner, 2-col stats, 3x2 loadout
    - Tablet (640-1024px): 3-col stats, 6x1 loadout, side-by-side editor
    - Desktop (>1024px): 4-col stats, full loadout, side panel editor
    - Ensure 44x44px minimum tap targets
    - Add touch feedback on mobile
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 29. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Quick Reference

### New Files
| File | Purpose |
|------|---------|
| components/profile/enterprise/index.ts | Barrel export file |
| components/profile/enterprise/ProfileHeader.tsx | Enhanced header with banner, avatar, level ring |
| components/profile/enterprise/StatsCard.tsx | Individual statistic display |
| components/profile/enterprise/StatsDashboard.tsx | Grid of stats cards |
| components/profile/enterprise/MatchHistoryItem.tsx | Single match result row |
| components/profile/enterprise/MatchHistorySection.tsx | Section container for match history |
| components/profile/enterprise/LoadoutPreview.tsx | Equipped cosmetics display |
| components/profile/enterprise/SocialLinkButton.tsx | Styled social media link |
| components/profile/enterprise/AchievementBadge.tsx | Achievement display with rarity |
| components/profile/enterprise/ProfileSection.tsx | Section container component |
| components/profile/enterprise/ProfileEditorForm.tsx | Enhanced editor with preview |

### Modified Files
| File | Changes |
|------|---------|
| pages/Profile.tsx | Integrate enterprise components, add sections |
| hooks/useMatchHistory.ts | Add match history fetching (if needed) |

### Property Tests Summary
| Property | Test File | Validates |
|----------|-----------|-----------|
| 1. Profile Header Typography | profile.test.ts | 2.1 |
| 2. Stats Card Typography | profile.test.ts | 2.3 |
| 3. Banner Display Mode | profile.test.ts | 3.2, 3.3 |
| 4. Level Ring Progress Calculation | profile.test.ts | 3.4 |
| 5. Win Rate Calculation and Color Coding | profile.test.ts | 4.3 |
| 6. Stats Dashboard Card Count | profile.test.ts | 4.1 |
| 7. Match Outcome Styling | profile.test.ts | 5.3, 5.4 |
| 8. Loadout Slot Display | profile.test.ts | 6.2, 6.3 |
| 9. Social Link Platform Colors | profile.test.ts | 7.4 |
| 10. Achievement Rarity Styling | profile.test.ts | 9.1, 9.3 |
| 11. Achievement Ordering | profile.test.ts | 9.2 |
| 12. Display Name Validation | profile.test.ts | 8.2 |
| 13. File Upload Validation | profile.test.ts | 8.4 |
| 14. Unsaved Changes Detection | profile.test.ts | 8.5 |

### Typography Reference
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Player Name (H1) | 3xl-4xl (30-36px) | extrabold | white |
| Player Title | sm (14px) | medium | indigo-400 |
| Level Badge | sm (14px) | bold | white on indigo |
| Section Title (H2) | xl-2xl (20-24px) | bold | white |
| Section Subtitle | sm (14px) | medium | muted |
| Stat Value | 2xl-3xl (24-30px) | bold | white |
| Stat Label | xs-sm (12-14px) | medium | muted, uppercase |
| Match Opponent | base (16px) | medium | white |
| Match Outcome | sm (14px) | bold | green/red |
| Bio Text | base (16px) | regular | gray-300 |

### Color Reference
| Element | Color |
|---------|-------|
| Win Badge | #10b981 (green) |
| Loss Badge | #ef4444 (red) |
| Level Ring Progress | #6366f1 (indigo-500) |
| Level Ring Track | #374151 (gray-700) |
| Twitter | #1DA1F2 |
| Twitch | #9146FF |
| YouTube | #FF0000 |
| Discord | #5865F2 |

### Rarity Styling Reference
| Rarity | Border | Glow |
|--------|--------|------|
| Common | #737373 | none |
| Uncommon | #10b981 | 0_0_20px rgba(16,185,129,0.3) |
| Rare | #3b82f6 | 0_0_20px rgba(59,130,246,0.3) |
| Epic | #a855f7 | 0_0_25px rgba(168,85,247,0.3) |
| Legendary | #f59e0b | 0_0_30px rgba(245,158,11,0.4) + shimmer |

---

*Total Tasks: 29 phases with sub-tasks*
*Estimated Time: 1-2 weeks*
*New Files: 11*
*Property Tests: 14*
