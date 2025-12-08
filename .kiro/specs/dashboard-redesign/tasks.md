# Dashboard Redesign - Implementation Plan

## Overview

This implementation plan transforms the current Home.tsx into a comprehensive game-launcher style dashboard with navigation to all features. The plan reuses existing components where possible and creates new layout/widget components.

**Estimated Time:** 1-2 weeks
**New Files:** ~15 files
**Modified Files:** ~5 files

---

## Phase 1: Layout Foundation

- [x] 1. Create Dashboard Layout Components
  - [x] 1.1 Create `frontend/src/components/dashboard/DashboardLayout.tsx`
    - Implement main layout wrapper with sidebar, header, and content areas
    - Use CSS Grid for responsive layout
    - Handle sidebar collapse state
    - _Requirements: 2.1, 7.3, 7.4_

  - [x] 1.2 Create `frontend/src/components/dashboard/Sidebar.tsx`
    - Implement navigation sidebar with all nav items
    - Add active state highlighting
    - Implement mobile hamburger menu collapse
    - Add notification badges support
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 1.3 Create `frontend/src/components/dashboard/DashboardHeader.tsx`
    - Display user avatar with fallback
    - Display display name
    - Integrate RankBadge component for tier display
    - Display level and XP progress bar
    - Add click handler for profile navigation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 1.4 Write property test for rank tier display
    - **Property 1: Rank Badge Tier Correctness**
    - **Validates: Requirements 1.3**

  - [x] 1.5 Write property test for level calculation
    - **Property 2: Level Calculation Correctness**
    - **Validates: Requirements 1.4**

- [x] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 2: Dashboard Widgets

- [x] 3. Create Quick Actions Widget
  - [x] 3.1 Create `frontend/src/components/dashboard/QuickActionsWidget.tsx`
    - Implement Find Match button as primary action
    - Implement Create Lobby and Join Lobby as secondary actions
    - Integrate with useMatchmaking hook
    - Display queue status when in queue
    - Display cooldown timer when applicable
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Write property test for queue status display
    - **Property 3: Queue Status Display**
    - **Validates: Requirements 3.4**

  - [x] 3.3 Write property test for match found modal
    - **Property 4: Match Found Modal Display**
    - **Validates: Requirements 3.5**

- [x] 4. Create Battle Pass Widget
  - [x] 4.1 Create `frontend/src/components/dashboard/BattlePassWidget.tsx`
    - Display current tier number
    - Display XP progress bar toward next tier
    - Display claimable rewards count with badge
    - Display season name
    - Add click handler for navigation to Battle Pass page
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 4.2 Write property test for battle pass widget data
    - **Property 5: Battle Pass Widget Data**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [x] 4.3 Write property test for claimable rewards badge
    - **Property 6: Claimable Rewards Badge**
    - **Validates: Requirements 4.5**

- [x] 5. Create Match History Widget
  - [x] 5.1 Create `frontend/src/components/dashboard/MatchHistoryWidget.tsx`
    - Display last 3-5 recent matches
    - Show opponent name and avatar
    - Show win/loss result indicator
    - Show ELO change (green for positive, red for negative)
    - Add click handler for match details
    - Handle empty state with prompt
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 5.2 Write property test for match history limit
    - **Property 7: Match History Limit**
    - **Validates: Requirements 5.1**

  - [x] 5.3 Write property test for match display fields
    - **Property 8: Match Display Fields**
    - **Validates: Requirements 5.2**

- [x] 6. Create Friends Widget
  - [x] 6.1 Create `frontend/src/components/dashboard/FriendsWidget.tsx`
    - Display online friends (filter by status)
    - Show avatar, name, and activity for each friend
    - Add click handler for friend options
    - Add "View All" button to open friends panel
    - Handle empty state
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 6.2 Write property test for online friends filter
    - **Property 9: Online Friends Filter**
    - **Validates: Requirements 6.1**

  - [x] 6.3 Write property test for friend display fields
    - **Property 10: Friend Display Fields**
    - **Validates: Requirements 6.2**

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 3: Feature Pages

- [x] 8. Create Profile Page
  - [x] 8.1 Create `frontend/src/pages/Profile.tsx`
    - Integrate ProfileCard component for display
    - Integrate ProfileEditor component for editing
    - Add tabs for View/Edit modes
    - Fetch profile data using useProfile hook
    - _Requirements: 8.1_

- [x] 9. Create Battle Pass Page
  - [x] 9.1 Create `frontend/src/pages/BattlePass.tsx`
    - Integrate BattlePassTrack component
    - Integrate XPProgress component
    - Fetch battle pass data using useBattlePass hook
    - Handle reward claiming
    - _Requirements: 8.2_

- [x] 10. Create Shop Page
  - [x] 10.1 Create `frontend/src/pages/Shop.tsx`
    - Integrate ShopGrid component
    - Add filter controls for type and rarity
    - Fetch shop data using useCosmetics hook
    - Handle purchase flow
    - _Requirements: 8.3_

- [x] 11. Create Inventory Page
  - [x] 11.1 Create `frontend/src/pages/Inventory.tsx`
    - Integrate InventoryGrid component
    - Integrate LoadoutDisplay component
    - Add tabs for Inventory/Loadout views
    - Fetch inventory data using useCosmetics hook
    - Handle equip/unequip flow
    - _Requirements: 8.4_

- [x] 12. Create Settings Page
  - [x] 12.1 Create `frontend/src/pages/Settings.tsx`
    - Add privacy settings section with toggles
    - Add notification preferences section
    - Add 2FA management section
    - Add sign out button
    - Integrate with profile update API
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 4: Routing and Integration

- [x] 14. Update App Router
  - [x] 14.1 Update `frontend/src/App.tsx`
    - Add /profile route with ProtectedRoute
    - Add /battlepass route with ProtectedRoute
    - Add /shop route with ProtectedRoute
    - Add /inventory route with ProtectedRoute
    - Add /settings route with ProtectedRoute
    - Update page exports in pages/index.ts
    - _Requirements: 8.5_

- [x] 15. Refactor Home to Dashboard
  - [x] 15.1 Update `frontend/src/pages/Home.tsx`
    - Wrap content with DashboardLayout
    - Replace current layout with widget-based layout
    - Add DashboardHeader with profile summary
    - Add QuickActionsWidget
    - Add BattlePassWidget
    - Add MatchHistoryWidget
    - Add FriendsWidget
    - Remove redundant code
    - _Requirements: 1.1-1.5, 3.1-3.5, 4.1-4.5, 5.1-5.4, 6.1-6.4_

- [x] 16. Create Dashboard Index Export
  - [x] 16.1 Create `frontend/src/components/dashboard/index.ts`
    - Export all dashboard components
    - _Requirements: 7.3_

- [x] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 5: Data Flow Fixes and API Integration

- [x] 18. Fix Schema Alignment Issues
  - [x] 18.1 Fix `frontend/src/hooks/useProfile.ts` upload URL field name
    - Change `file_path` to `storage_path` to match backend SignedUploadUrl schema
    - _Requirements: 1.1_

  - [x] 18.2 Fix `frontend/src/hooks/useBattlePass.ts` endpoint path
    - Change `/api/v1/me/battlepass` to `/api/v1/battlepass/me` to match backend router
    - _Requirements: 4.1, 4.2_

  - [x] 18.3 Update `frontend/src/types/battlepass.ts` to match backend schema
    - Change `claimed_free_tiers`/`claimed_premium_tiers` to single `claimed_rewards` array
    - Change `claimable_free_tiers`/`claimable_premium_tiers` to single `claimable_rewards` array
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 18.4 Normalize RankTier case in `frontend/src/types/leaderboard.ts`
    - Add case-insensitive tier lookup or normalize backend response
    - _Requirements: 1.3_

- [x] 19. Enhance Match History Backend Endpoint
  - [x] 19.1 Update `backend/app/api/v1/game.py` to include opponent details
    - Join with user_profiles table to get opponent display_name and avatar_url
    - Include ELO change from match_results table
    - _Requirements: 5.1, 5.2_

  - [x] 19.2 Update `backend/app/schemas/game.py` GameHistoryItem
    - Add opponent_avatar_url field
    - Add elo_change field
    - _Requirements: 5.2_

- [x] 20. Create Dashboard Data Hook
  - [x] 20.1 Create `frontend/src/hooks/useDashboard.ts`
    - Combine profile, battlepass, rating, and friends data fetching
    - Implement match history fetching with new enhanced endpoint
    - Handle loading and error states for each data source independently
    - Handle 404 from ELO endpoint gracefully (user has no rating yet)
    - Implement data refresh on window focus
    - _Requirements: 1.1-1.4, 4.1-4.3, 5.1, 6.1_

- [x] 21. Create Match History Types and API
  - [x] 21.1 Create `frontend/src/types/matchHistory.ts`
    - Define RecentMatch interface matching enhanced backend response
    - Define MatchHistoryResponse interface
    - _Requirements: 5.1, 5.2_

  - [x] 21.2 Add match history endpoint to `frontend/src/services/api.ts`
    - Add getRecentMatches function calling GET /api/v1/games/history
    - _Requirements: 5.1_

- [x] 22. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Quick Reference

### New Files
| File | Purpose |
|------|---------|
| components/dashboard/DashboardLayout.tsx | Main layout wrapper |
| components/dashboard/Sidebar.tsx | Navigation sidebar |
| components/dashboard/DashboardHeader.tsx | Profile summary header |
| components/dashboard/QuickActionsWidget.tsx | Play actions |
| components/dashboard/BattlePassWidget.tsx | BP progress widget |
| components/dashboard/MatchHistoryWidget.tsx | Recent matches |
| components/dashboard/FriendsWidget.tsx | Online friends |
| components/dashboard/index.ts | Exports |
| pages/Profile.tsx | Profile page |
| pages/BattlePass.tsx | Battle Pass page |
| pages/Shop.tsx | Shop page |
| pages/Inventory.tsx | Inventory page |
| pages/Settings.tsx | Settings page |
| hooks/useDashboard.ts | Dashboard data hook |
| types/matchHistory.ts | Match history types |

### Modified Files
| File | Changes |
|------|---------|
| App.tsx | Add new routes |
| pages/Home.tsx | Refactor to use new layout |
| pages/index.ts | Export new pages |
| hooks/useProfile.ts | Fix storage_path field name |
| hooks/useBattlePass.ts | Fix endpoint path |
| types/battlepass.ts | Align with backend schema |
| types/leaderboard.ts | Normalize RankTier case |
| backend/app/api/v1/game.py | Enhance with opponent details + ELO |
| backend/app/schemas/game.py | Add opponent_avatar_url, elo_change |

### Data Flow Verification Checklist
| Data Point | Frontend Source | Backend Endpoint | Table | Status |
|------------|-----------------|------------------|-------|--------|
| User Avatar | useProfile → profile.avatar_url | GET /profiles/me | user_profiles.avatar_url | ✅ |
| Display Name | useProfile → profile.display_name | GET /profiles/me | user_profiles.display_name | ✅ |
| Rank Badge | useDashboard → rating.tier | GET /leaderboards/elo/me | elo_ratings.current_tier | ✅ Fixed (normalizeRankTier) |
| Level | useProfile → profile.level | GET /profiles/me | user_profiles.level | ✅ |
| Total XP | useProfile → profile.total_xp | GET /profiles/me | user_profiles.total_xp | ✅ |
| BP Current Tier | useBattlePass → progress.current_tier | GET /battlepass/me | player_battlepass.current_tier | ✅ Fixed endpoint |
| BP Current XP | useBattlePass → progress.current_xp | GET /battlepass/me | player_battlepass.current_xp | ✅ Fixed endpoint |
| BP Claimable | useBattlePass → progress.claimable_rewards.length | GET /battlepass/me | player_battlepass.claimed_rewards | ✅ Fixed schema |
| Match History | gameAPI.getRecentMatches → matches | GET /games/history | games + match_results + user_profiles | ✅ Enhanced endpoint |
| Online Friends | useFriends → friends.filter(online) | GET /friends | friendships + presence | ✅ |
| Queue Status | useMatchmaking → queuePosition | WS /ws/matchmaking | Redis queue | ✅ |
| Avatar Upload | useProfile.uploadAvatar | POST /profiles/me/avatar/* | storage + user_profiles | ✅ Fixed storage_path |

### Property Tests Summary
| Property | Test File | Validates |
|----------|-----------|-----------|
| 1. Rank Tier Correctness | dashboard.test.ts | 1.3 |
| 2. Level Calculation | dashboard.test.ts | 1.4 |
| 3. Queue Status Display | dashboard.test.ts | 3.4 |
| 4. Match Found Modal | dashboard.test.ts | 3.5 |
| 5. Battle Pass Widget Data | dashboard.test.ts | 4.1, 4.2, 4.3 |
| 6. Claimable Rewards Badge | dashboard.test.ts | 4.5 |
| 7. Match History Limit | dashboard.test.ts | 5.1 |
| 8. Match Display Fields | dashboard.test.ts | 5.2 |
| 9. Online Friends Filter | dashboard.test.ts | 6.1 |
| 10. Friend Display Fields | dashboard.test.ts | 6.2 |

---

*Total Tasks: 20 (with sub-tasks)*
*Estimated Time: 1-2 weeks*
*New Files: ~15*
*Property Tests: 10*
