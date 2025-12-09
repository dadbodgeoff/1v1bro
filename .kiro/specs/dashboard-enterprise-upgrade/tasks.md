                  ®5gt # Dashboard Enterprise Upgrade - Implementation Plan

## Overview

This implementation plan transforms the Dashboard (Home) page into an enterprise-grade hub that showcases all platform features. The plan is organized into phases that build incrementally, ensuring each phase produces working code.

**Estimated Time:** 1-2 weeks
**New Files:** 10 files
**Modified Files:** 4 files

---

## Phase 1: Enterprise Directory and Foundation

- [x] 1. Create Enterprise Directory Structure
  - [x] 1.1 Create `frontend/src/components/dashboard/enterprise/` directory and barrel export
    - Create directory structure for enterprise components
    - Create `index.ts` barrel export file (initially empty)
    - _Requirements: 1.1, 1.4_

- [x] 2. Create DashboardSection Component
  - [x] 2.1 Create `frontend/src/components/dashboard/enterprise/DashboardSection.tsx`
    - Implement section container with card background (bg-[#111111])
    - Add border styling (border-white/[0.06]) and rounded corners (rounded-xl)
    - Add consistent padding (p-5)
    - Support optional title, badge, and action link in header
    - Support badge variants (default, count, new, hot)
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 2: Hero Play Section

- [x] 4. Create HeroPlaySection Component
  - [x] 4.1 Create `frontend/src/components/dashboard/enterprise/HeroPlaySection.tsx`
    - Implement "Quick Play" title in 2xl bold
    - Integrate existing CategorySelector and MapSelector components
    - Add primary "Find Match" button with accent color (indigo-500)
    - Add secondary actions row (Create Lobby, Join Lobby)
    - Integrate useMatchmaking hook for queue state
    - Handle cooldown display with "Cooldown: X:XX" format
    - Add Practice vs Bot button navigating to /bot-game
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 4.2 Write property test for cooldown timer format
    - **Property 7: Cooldown Timer Format**
    - **Validates: Requirements 2.4**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 3: Battle Pass and Stats Widgets

- [x] 6. Enhance BattlePassWidget Component
  - [x] 6.1 Update `frontend/src/components/dashboard/enterprise/BattlePassWidget.tsx`
    - Move existing BattlePassWidget to enterprise directory
    - Add season name display in header
    - Enhance tier display with 3xl bold font
    - Add XP progress bar with indigo gradient
    - Add claimable rewards badge with emerald color and pulse animation
    - Add premium badge with star icon and amber color
    - Add days remaining display
    - Handle empty state when no active season
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 6.2 Write property test for Battle Pass widget display
    - **Property 1: Battle Pass Widget Display Consistency**
    - **Validates: Requirements 3.1, 3.2**

- [x] 7. Create StatsSummaryWidget Component
  - [x] 7.1 Create `frontend/src/components/dashboard/enterprise/StatsSummaryWidget.tsx`
    - Implement "Your Stats" title with "View Profile" link
    - Add 2x2 grid of stat cards
    - Display Total Wins with trophy icon
    - Display Win Rate as percentage with color coding
    - Display Rank Tier with tier icon and name
    - Display ELO Rating with numeric value
    - Handle empty state with "0" and "Unranked" defaults
    - Navigate to /profile on click
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 7.2 Write property test for stats value formatting
    - **Property 4: Stats Value Formatting**
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.6**

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 4: Shop and Loadout Widgets

- [x] 9. Create ShopPreviewWidget Component
  - [x] 9.1 Create `frontend/src/components/dashboard/enterprise/ShopPreviewWidget.tsx`
    - Implement "Featured Items" title with "View Shop" link
    - Display 3-4 featured items in horizontal layout
    - Show item preview image (80px), name, rarity indicator, price
    - Add daily rotation countdown timer
    - Apply rarity border/glow on hover
    - Navigate to /shop on item click or "View Shop" click
    - Handle loading state with skeleton placeholders
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 9.2 Write property test for shop item display
    - **Property 2: Shop Item Display Completeness**
    - **Validates: Requirements 4.2**

- [x] 10. Create LoadoutPreviewWidget Component
  - [x] 10.1 Create `frontend/src/components/dashboard/enterprise/LoadoutPreviewWidget.tsx`
    - Implement "Your Loadout" title with "Customize" link
    - Display 3 slots: Skin, Banner, Player Card
    - Show item preview (64px) and name when equipped
    - Show placeholder icon and "Empty" label when empty
    - Apply rarity border color to equipped items
    - Navigate to /inventory on click
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 10.2 Write property test for loadout slot display
    - **Property 3: Loadout Slot Display State**
    - **Validates: Requirements 5.2, 5.3**

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 5: Match History and Friends Widgets

- [x] 12. Enhance MatchHistoryWidget Component
  - [x] 12.1 Update `frontend/src/components/dashboard/enterprise/MatchHistoryWidget.tsx`
    - Move existing MatchHistoryWidget to enterprise directory
    - Enhance match item display with opponent avatar (32px)
    - Add Win/Loss badge with green/red color
    - Add ELO change display with +/- sign and color
    - Add relative timestamp ("2h ago", "Yesterday")
    - Navigate to /match/:id on click
    - Handle empty state with "Play a Match" CTA
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 12.2 Write property test for match history item display
    - **Property 5: Match History Item Display**
    - **Validates: Requirements 7.2**

- [x] 13. Enhance FriendsWidget Component
  - [x] 13.1 Update `frontend/src/components/dashboard/enterprise/FriendsWidget.tsx`
    - Move existing FriendsWidget to enterprise directory
    - Add "Friends Online" title with count badge
    - Change "View All" to navigate to /friends (not open panel)
    - Display friend avatar (32px), name, online status indicator
    - Filter to show only online friends (is_online && show_online_status)
    - Handle empty state with "Add Friends" CTA
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 13.2 Write property test for friends display filtering
    - **Property 6: Friends Display Filtering**
    - **Validates: Requirements 8.1, 8.2**

- [x] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 6: Friends Page and Route

- [x] 15. Create Friends Page
  - [x] 15.1 Create `frontend/src/pages/Friends.tsx`
    - Create dedicated Friends page component
    - Use DashboardLayout wrapper with activeNav="friends"
    - Integrate existing FriendsList component
    - Integrate existing FriendRequests component
    - Integrate existing UserSearch component
    - Add page header with "Friends" title
    - Fetch friends data on mount using useFriends hook
    - Handle loading and error states
    - _Requirements: 8.5, 8.6_

  - [x] 15.2 Add /friends route to App.tsx
    - Add protected route for /friends path
    - Import Friends page component
    - Ensure sidebar navigation works correctly
    - _Requirements: 8.5_

- [x] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 7: Dashboard Page Integration

- [x] 17. Update Enterprise Exports
  - [x] 17.1 Update `frontend/src/components/dashboard/enterprise/index.ts`
    - Export DashboardSection
    - Export HeroPlaySection
    - Export BattlePassWidget
    - Export StatsSummaryWidget
    - Export ShopPreviewWidget
    - Export LoadoutPreviewWidget
    - Export MatchHistoryWidget
    - Export FriendsWidget
    - _Requirements: 1.4_

- [x] 18. Update Home Page
  - [x] 18.1 Update `frontend/src/pages/Home.tsx`
    - Import enterprise components from new directory
    - Replace QuickActionsWidget with HeroPlaySection
    - Replace existing BattlePassWidget with enterprise version
    - Add ShopPreviewWidget to right column
    - Add LoadoutPreviewWidget to right column
    - Add StatsSummaryWidget to right column
    - Replace existing MatchHistoryWidget with enterprise version
    - Replace existing FriendsWidget with enterprise version
    - Implement 3-column grid layout for desktop
    - Implement 2-column grid for tablet
    - Implement single-column stack for mobile
    - Remove FriendsPanel (replaced by /friends page)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 19. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 8: Polish and Responsive

- [x] 20. Add Responsive Behavior
  - [x] 20.1 Implement responsive breakpoints across all widgets
    - Desktop (>1024px): 3-column grid, full widget sizes
    - Tablet (640-1024px): 2-column grid, adjusted sizes
    - Mobile (<640px): Single column, stacked widgets
    - Ensure 44px minimum tap targets on all buttons
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 21. Add Hover and Interaction Effects
  - [x] 21.1 Add micro-interactions to widgets
    - Add hover lift effect (translateY -1px) on clickable widgets
    - Add background highlight (bg-white/[0.02]) on hover
    - Add smooth transitions (200ms ease)
    - Add loading spinners for async actions
    - _Requirements: 3.3, 4.3, 5.4, 6.5, 7.3_

- [x] 22. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Quick Reference

### New Files
| File | Purpose |
|------|---------|
| components/dashboard/enterprise/index.ts | Barrel export file |
| components/dashboard/enterprise/DashboardSection.tsx | Section container |
| components/dashboard/enterprise/HeroPlaySection.tsx | Primary play actions |
| components/dashboard/enterprise/BattlePassWidget.tsx | Battle Pass progress (enhanced) |
| components/dashboard/enterprise/StatsSummaryWidget.tsx | Key stats display |
| components/dashboard/enterprise/ShopPreviewWidget.tsx | Featured shop items |
| components/dashboard/enterprise/LoadoutPreviewWidget.tsx | Equipped cosmetics |
| components/dashboard/enterprise/MatchHistoryWidget.tsx | Recent matches (enhanced) |
| components/dashboard/enterprise/FriendsWidget.tsx | Online friends (enhanced) |
| pages/Friends.tsx | Dedicated friends page |

### Modified Files
| File | Changes |
|------|---------|
| pages/Home.tsx | Integrate enterprise components, update layout |
| App.tsx | Add /friends route |
| components/dashboard/index.ts | Update exports if needed |
| pages/index.ts | Export Friends page |

### Property Tests Summary
| Property | Test File | Validates |
|----------|-----------|-----------|
| 1. Battle Pass Widget Display Consistency | dashboard-properties.test.ts | 3.1, 3.2 |
| 2. Shop Item Display Completeness | dashboard-properties.test.ts | 4.2 |
| 3. Loadout Slot Display State | dashboard-properties.test.ts | 5.2, 5.3 |
| 4. Stats Value Formatting | dashboard-properties.test.ts | 6.2, 6.3, 6.4, 6.6 |
| 5. Match History Item Display | dashboard-properties.test.ts | 7.2 |
| 6. Friends Display Filtering | dashboard-properties.test.ts | 8.1, 8.2 |
| 7. Cooldown Timer Format | dashboard-properties.test.ts | 2.4 |

### Widget Layout Reference
| Widget | Desktop Position | Tablet Position | Mobile Order |
|--------|-----------------|-----------------|--------------|
| HeroPlaySection | Left col, top | Left col, top | 1 |
| MatchHistoryWidget | Left col, bottom | Left col, bottom | 6 |
| BattlePassWidget | Right col, 1st | Right col, 1st | 2 |
| ShopPreviewWidget | Right col, 2nd | Right col, 2nd | 3 |
| LoadoutPreviewWidget | Right col, 3rd | Right col, 3rd | 4 |
| StatsSummaryWidget | Right col, 4th | Full width | 5 |
| FriendsWidget | Right col, 5th | Full width | 7 |

---

*Total Tasks: 22 phases with sub-tasks*
*Estimated Time: 1-2 weeks*
*New Files: 10*
*Property Tests: 7*
