# Implementation Plan: Achievement System

- [x] 1. Extend Achievement Database Schema
  - [x] 1.1 Create migration to add new achievement categories and definitions
    - Add combat, accuracy, and social category achievements to existing achievements table
    - Add 15 new achievements (combat: 5, accuracy: 4, social: 5) to reach 30 total
    - Add coin_reward column with default value 3
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x] 1.2 Write property test for progressive tier ordering
    - **Property 10: Progressive Tier Ordering**
    - **Validates: Requirements 5.3**

- [x] 2. Implement Achievement Repository
  - [x] 2.1 Create `backend/app/database/repositories/achievement_repo.py`
    - Implement get_active_achievements() method
    - Implement get_user_earned_achievement_ids() method
    - Implement award_achievement() with duplicate prevention
    - Implement get_user_achievements_with_details() with join
    - _Requirements: 1.3, 7.1, 7.2_

  - [x] 2.2 Write property test for achievement unlock idempotency
    - **Property 2: Achievement Unlock Idempotency**
    - **Validates: Requirements 1.3**

- [x] 3. Implement Achievement Service
  - [x] 3.1 Create `backend/app/services/achievement_service.py`
    - Implement check_and_award_achievements() method
    - Implement criteria evaluation for all criteria_types (games_played, games_won, win_streak, total_kills, accuracy, friends_count)
    - Integrate with BalanceService for 3-coin rewards
    - Integrate with NotificationService for real-time notifications
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_

  - [x] 3.2 Write property test for achievement unlock threshold
    - **Property 1: Achievement Unlock Threshold**
    - **Validates: Requirements 1.2, 1.4**

  - [x] 3.3 Write property test for coin reward transaction completeness
    - **Property 3: Coin Reward Transaction Completeness**
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [x] 3.4 Write property test for multi-achievement coin calculation
    - **Property 4: Multi-Achievement Coin Calculation**
    - **Validates: Requirements 2.4**

- [x] 4. Implement Achievement Progress Service
  - [x] 4.1 Add progress calculation methods to AchievementService
    - Implement get_achievement_progress() deriving from user_profiles stats
    - Implement get_achievement_stats() for profile display
    - Calculate completion percentage and rarity breakdown
    - _Requirements: 8.1, 8.2, 10.1, 10.2, 10.4_

  - [x] 4.2 Write property test for progress calculation accuracy
    - **Property 9: Progress Calculation Accuracy**
    - **Validates: Requirements 4.5, 8.2**

  - [x] 4.3 Write property test for progress derivation from stats
    - **Property 15: Progress Derivation from Stats**
    - **Validates: Requirements 8.1, 8.4**

  - [x] 4.4 Write property test for profile stats calculation
    - **Property 18: Profile Stats Calculation**
    - **Validates: Requirements 10.1, 10.2, 10.4**


- [x] 5. Integrate Achievement Checks with Match Flow
  - [x] 5.1 Update ProgressionService to trigger achievement checks
    - Call achievement_service.check_and_award_achievements() after award_match_xp()
    - Handle achievement check failures gracefully (log but don't fail match flow)
    - _Requirements: 1.1, 2.5_

  - [x] 5.2 Write property test for achievement permanence
    - **Property 16: Achievement Permanence**
    - **Validates: Requirements 8.5**

- [x] 6. Checkpoint - Backend Tests
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Create Achievement API Endpoints
  - [x] 7.1 Create `backend/app/api/v1/achievements.py`
    - GET /achievements - List all achievement definitions with pagination
    - GET /achievements/me - List current user's earned achievements
    - GET /achievements/progress - Get progress toward locked achievements
    - POST /achievements/check - Manually trigger achievement evaluation
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 7.2 Register routes in `backend/app/api/v1/__init__.py`
    - Add achievements router to API
    - _Requirements: 7.1_

  - [x] 7.3 Write property test for pagination correctness
    - **Property 14: Pagination Correctness**
    - **Validates: Requirements 7.5**

- [x] 8. Create Achievement Notification Integration
  - [x] 8.1 Add notify_achievement method to NotificationService
    - Create notification with type="reward" and achievement metadata
    - Send WebSocket notification with achievement details
    - Include name, description, rarity, icon_url, coin_reward in payload
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [x] 8.2 Write property test for notification content completeness
    - **Property 5: Notification Content Completeness**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 9. Checkpoint - Backend Integration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Create Frontend Achievement Types
  - [x] 10.1 Create `frontend/src/types/achievements.ts`
    - Define Achievement, UserAchievement, AchievementProgress interfaces
    - Define AchievementStats, AchievementUnlock interfaces
    - Define AchievementRarity, AchievementCategory, CriteriaType types
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 10.2 Write property test for serialization round-trip
    - **Property 19: Serialization Round-Trip**
    - **Validates: Requirements 11.1, 11.2, 11.3**

- [x] 11. Create Achievement API Service
  - [x] 11.1 Create `frontend/src/services/achievementService.ts`
    - Implement getAchievements() with pagination
    - Implement getUserAchievements()
    - Implement getAchievementProgress()
    - Implement checkAchievements()
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 12. Create useAchievements Hook
  - [x] 12.1 Create `frontend/src/hooks/useAchievements.ts`
    - Fetch achievements, user achievements, and progress
    - Calculate achievement stats
    - Handle loading and error states
    - Support refetch and manual check
    - _Requirements: 4.1, 4.2, 4.5, 10.1, 10.2, 10.3, 10.4_

- [x] 13. Create Achievement Card Component
  - [x] 13.1 Create `frontend/src/components/achievements/AchievementCard.tsx`
    - Display achievement name, description, icon, rarity badge
    - Show progress bar for locked achievements
    - Show earned timestamp for unlocked achievements
    - Apply rarity-colored border/glow effects
    - Ensure touch targets >= 44x44px
    - _Requirements: 4.2, 4.3, 6.2_

  - [x] 13.2 Write property test for achievement display completeness
    - **Property 8: Achievement Display Completeness**
    - **Validates: Requirements 4.2, 4.3**

  - [x] 13.3 Write property test for mobile touch target compliance
    - **Property 11: Mobile Touch Target Compliance**
    - **Validates: Requirements 6.2**


- [x] 14. Create Achievement Toast Component
  - [x] 14.1 Create `frontend/src/components/achievements/AchievementToast.tsx`
    - Display achievement icon, name, rarity glow, "+3 coins" indicator
    - Apply rarity-appropriate animation (subtle to dramatic)
    - Auto-dismiss after 5 seconds with fade-out
    - Support click to navigate to achievements page
    - _Requirements: 9.1, 9.2, 9.3, 9.5_

  - [x] 14.2 Create `frontend/src/hooks/useAchievementToasts.ts`
    - Manage toast queue with 1-second delays between toasts
    - Handle auto-dismiss timing
    - Support manual dismiss
    - _Requirements: 9.3, 9.4_

  - [x] 14.3 Write property test for rarity animation mapping
    - **Property 6: Rarity Animation Mapping**
    - **Validates: Requirements 3.4**

  - [x] 14.4 Write property test for toast queue timing
    - **Property 17: Toast Queue Timing**
    - **Validates: Requirements 9.3, 9.4**

- [x] 15. Create Achievement Detail Modal
  - [x] 15.1 Create `frontend/src/components/achievements/AchievementDetailModal.tsx`
    - Use BottomSheetModal on mobile, centered modal on desktop
    - Display full achievement details with progress visualization
    - Show earned timestamp or progress bar based on unlock status
    - _Requirements: 6.3, 4.2, 4.3_

- [x] 16. Create Achievement Panel Page
  - [x] 16.1 Create `frontend/src/components/achievements/AchievementPanel.tsx`
    - Display category tabs (horizontally scrollable on mobile)
    - Show achievement grid (1 col mobile, 2 tablet, 3+ desktop)
    - Implement filter controls (all/locked/unlocked)
    - Show progress indicators per category
    - Use staggered entry animations respecting prefers-reduced-motion
    - _Requirements: 4.1, 4.4, 4.5, 6.1, 6.4, 6.5_

  - [x] 16.2 Write property test for achievement grouping by category
    - **Property 7: Achievement Grouping by Category**
    - **Validates: Requirements 4.1, 4.4**

  - [x] 16.3 Write property test for mobile layout responsiveness
    - **Property 12: Mobile Layout Responsiveness**
    - **Validates: Requirements 6.1**

  - [x] 16.4 Write property test for reduced motion compliance
    - **Property 13: Reduced Motion Compliance**
    - **Validates: Requirements 6.5**

- [x] 17. Create Achievements Page Route
  - [x] 17.1 Create `frontend/src/pages/Achievements.tsx`
    - Wrap AchievementPanel with DashboardLayout
    - Handle WebSocket achievement notifications
    - Integrate with toast system for real-time unlocks
    - _Requirements: 4.1, 9.1_

  - [x] 17.2 Add route to `frontend/src/App.tsx`
    - Add /achievements route with authentication
    - _Requirements: 4.1_

- [x] 18. Checkpoint - Frontend Components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Integrate Achievements into Profile
  - [x] 19.1 Update ProfileHeader or create ProfileAchievements component
    - Display total achievements earned / total possible
    - Show achievement breakdown by rarity
    - Display 3 most recent achievements
    - Show completion percentage
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 20. Integrate Achievement Toasts into Game Flow
  - [x] 20.1 Update game components to listen for achievement WebSocket events
    - Subscribe to achievement unlock notifications
    - Trigger toast display on achievement unlock
    - Queue multiple toasts with proper timing
    - _Requirements: 9.1, 9.4_

- [x] 21. Add Navigation to Achievements
  - [x] 21.1 Update sidebar/navigation to include Achievements link
    - Add achievements icon and link to navigation
    - Show badge with unviewed achievement count (optional)
    - _Requirements: 4.1_

- [x] 22. Final Checkpoint - Full Integration
  - Ensure all tests pass, ask the user if questions arise.
