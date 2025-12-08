# User Services & Microservices Architecture - Implementation Plan

## Overview

This implementation follows a **bottom-up, service-by-service approach**:

1. Database migrations (schema foundation)
2. Cache infrastructure (Redis setup)
3. Enhanced Authentication Service
4. Profile Service with file storage
5. Cosmetics Service with inventory
6. Battle Pass Service with XP tracking
7. Enhanced Leaderboard Service with ELO
8. Event-driven integration
9. API Gateway enhancements

**Key Principles:**
- Each file stays under 300 lines
- Property-based tests for all correctness properties
- Cache-aside pattern for all cached data
- Event-driven communication between services
- Idempotent event handlers

**Estimated Time:** 3-4 weeks
**Total New Files:** ~40 files
**Lines of Code:** ~6,000 lines

---

## Phase 1: Infrastructure Foundation

- [x] 1. Database Migrations
  - [x] 1.1 Create `backend/app/database/migrations/006_profiles_extended.sql`
    - Add bio, banner_url, banner_color columns to user_profiles
    - Add level, total_xp, title columns
    - Add country, social_links JSONB columns
    - Add privacy settings columns (is_public, accept_friend_requests, allow_messages)
    - Add 2FA columns (two_factor_enabled, two_factor_secret)
    - Create indexes for country and level
    - _Requirements: 2.1, 2.8, 12.8_

  - [x] 1.2 Create `backend/app/database/migrations/007_cosmetics.sql`
    - Create cosmetics_catalog table with type, rarity, pricing
    - Create inventory table with user_id, cosmetic_id, acquired_date
    - Create loadouts table with equipped slots
    - Create indexes for inventory queries
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [x] 1.3 Create `backend/app/database/migrations/008_battlepass.sql`
    - Create seasons table with dates and active flag
    - Create battlepass_tiers table with rewards
    - Create player_battlepass table with progress tracking
    - Create xp_logs table for analytics
    - Create indexes for progress queries
    - _Requirements: 4.1, 4.2, 4.10_

  - [x] 1.4 Create `backend/app/database/migrations/009_elo_ratings.sql`
    - Create player_ratings table with ELO and tier
    - Create match_results table for ELO history
    - Initialize ratings for existing users (default 1200)
    - Create indexes for leaderboard queries
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

  - [x] 1.5 Run migrations and verify
    - Execute all migrations against test database
    - Verify existing data preserved
    - Verify new columns have defaults
    - _Requirements: 13.1, 13.5, 13.9_

- [x] 2. Cache Infrastructure
  - [x] 2.1 Create `backend/app/cache/__init__.py`
    - Export CacheManager and redis_client
    - _Requirements: 11.1_

  - [x] 2.2 Create `backend/app/cache/redis_client.py`
    - Implement Redis connection with aioredis
    - Configure connection pooling
    - Add health check method
    - _Requirements: 11.1, 9.10_

  - [x] 2.3 Create `backend/app/cache/cache_manager.py`
    - Implement CacheManager class
    - Implement get/set/delete with TTL
    - Implement get_json/set_json helpers
    - Implement sorted set operations (zadd, zrange, zrank)
    - Implement key() helper for consistent naming
    - _Requirements: 11.2-11.8_

  - [x] 2.4 Write property test for cache operations
    - **Property 13: Cache Invalidation**
    - **Validates: Requirements 3.8, 11.7**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.



---

## Phase 2: Enhanced Authentication Service

- [x] 4. Authentication Schemas
  - [x] 4.1 Update `backend/app/schemas/auth.py`
    - Add TwoFactorSetup schema with secret and qr_code_url
    - Add TwoFactorVerify schema with code
    - Add PasswordResetRequest schema
    - Add PasswordResetConfirm schema with token and new_password
    - Add TokenPayload schema with RS256 claims
    - _Requirements: 1.5, 1.8, 1.10_

- [x] 5. Enhanced Auth Service
  - [x] 5.1 Update `backend/app/services/auth_service.py`
    - Implement RS256 JWT signing (replace HS256)
    - Implement bcrypt hashing with cost factor 12
    - Implement enable_2fa() with TOTP secret generation
    - Implement verify_2fa() with pyotp validation
    - Implement initiate_password_reset() with email token
    - Implement complete_password_reset() with token validation
    - Add token blacklist for logout invalidation
    - _Requirements: 1.1, 1.2, 1.7, 1.8, 1.9, 1.10_

  - [x] 5.2 Write property test for password hashing
    - **Property 1: Password Hashing Security**
    - **Validates: Requirements 1.1, 12.3**

  - [x] 5.3 Write property test for JWT structure
    - **Property 2: JWT Token Structure**
    - **Validates: Requirements 1.2, 1.5**

  - [x] 5.4 Write property test for token validation
    - **Property 4: Token Validation Correctness**
    - **Validates: Requirements 1.6**

- [x] 6. Enhanced Rate Limiting
  - [x] 6.1 Update `backend/app/middleware/rate_limit.py`
    - Implement Redis-backed rate limiting
    - Configure per-endpoint limits (auth=10/min, game=1000/min, etc.)
    - Add X-RateLimit-Remaining and X-RateLimit-Reset headers
    - Implement IP-based tracking for auth endpoints
    - _Requirements: 1.3, 1.4, 7.2, 7.3_

  - [x] 6.2 Write property test for rate limiting
    - **Property 3: Rate Limiting Enforcement**
    - **Validates: Requirements 1.3, 1.4**

- [x] 7. Auth API Updates
  - [x] 7.1 Update `backend/app/api/v1/auth.py`
    - Add POST /auth/refresh endpoint
    - Add POST /auth/password-reset endpoint
    - Add POST /auth/2fa/enable endpoint
    - Add POST /auth/2fa/verify endpoint
    - Add GET /auth/validate endpoint
    - _Requirements: 1.2, 1.8, 1.10_

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 3: Profile Service

- [x] 9. Profile Schemas
  - [x] 9.1 Create `backend/app/schemas/profile.py`
    - Define ProfileUpdate schema with validation
    - Define SocialLinks schema with URL validation
    - Define PrivacySettings schema
    - Define Profile response schema
    - Define SignedUploadUrl schema
    - _Requirements: 2.1, 2.2, 2.8, 2.9_

- [x] 10. Storage Service
  - [x] 10.1 Create `backend/app/services/storage_service.py`
    - Implement StorageService class
    - Implement generate_signed_upload_url() with 5-min expiration
    - Implement process_avatar() with resize to 128/256/512
    - Implement process_banner() with resize to 960x270/1920x540
    - Implement get_cdn_url() for serving
    - Implement delete_old_versions() for cleanup
    - _Requirements: 10.1-10.10_

- [x] 11. Profile Repository
  - [x] 11.1 Create `backend/app/database/repositories/profile_repo.py`
    - Implement ProfileRepository class
    - Implement get_profile() with privacy filtering
    - Implement update_profile() with validation
    - Implement update_avatar_url()
    - Implement update_banner_url()
    - Implement update_privacy_settings()
    - Implement increment_xp() and compute_level()
    - _Requirements: 2.1, 2.7, 2.10_

- [x] 12. Profile Service
  - [x] 12.1 Create `backend/app/services/profile_service.py`
    - Implement ProfileService class
    - Implement get_profile() with viewer privacy check
    - Implement update_profile() with validation
    - Implement get_avatar_upload_url()
    - Implement confirm_avatar_upload() with processing trigger
    - Implement get_banner_upload_url()
    - Implement confirm_banner_upload()
    - Implement compute_level() formula: floor(sqrt(total_xp / 100))
    - _Requirements: 2.1-2.10_

  - [x] 12.2 Write property test for profile validation
    - **Property 5: Profile Field Validation**
    - **Validates: Requirements 2.2**

- [x] 13. Profile API
  - [x] 13.1 Create `backend/app/api/v1/profiles.py`
    - Create profiles router
    - Implement GET /profiles/{user_id} endpoint
    - Implement GET /profiles/me endpoint
    - Implement PUT /profiles/me endpoint
    - Implement POST /profiles/me/avatar/upload-url endpoint
    - Implement POST /profiles/me/avatar/confirm endpoint
    - Implement POST /profiles/me/banner/upload-url endpoint
    - Implement POST /profiles/me/banner/confirm endpoint
    - _Requirements: 2.1-2.6_

  - [x] 13.2 Register profile router in `backend/app/api/v1/router.py`
    - Add profiles router to v1 router
    - _Requirements: 7.7_

- [x] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 4: Cosmetics Service

- [x] 15. Cosmetics Schemas
  - [x] 15.1 Create `backend/app/schemas/cosmetic.py`
    - Define CosmeticType enum (skin, emote, banner, nameplate, effect, trail)
    - Define Rarity enum (common, uncommon, rare, epic, legendary)
    - Define Cosmetic schema
    - Define InventoryItem schema
    - Define Loadout schema
    - Define ShopFilters schema
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 16. Cosmetics Repository
  - [x] 16.1 Create `backend/app/database/repositories/cosmetics_repo.py`
    - Implement CosmeticsRepository class
    - Implement get_shop() with filtering
    - Implement get_cosmetic() by ID
    - Implement get_inventory() for user
    - Implement add_to_inventory()
    - Implement get_loadout()
    - Implement update_loadout()
    - Implement check_ownership()
    - _Requirements: 3.3-3.6_

- [x] 17. Cosmetics Service
  - [x] 17.1 Create `backend/app/services/cosmetics_service.py`
    - Implement CosmeticsService class
    - Implement get_shop() with Redis caching (24h TTL)
    - Implement get_cosmetic()
    - Implement get_inventory() with Redis caching (5min TTL)
    - Implement purchase_cosmetic() with ownership check
    - Implement equip_cosmetic() with slot mapping
    - Implement unequip_cosmetic()
    - Implement get_loadout()
    - Implement _invalidate_inventory_cache()
    - _Requirements: 3.3-3.10_

  - [x] 17.2 Write property test for cosmetic type validation
    - **Property 6: Cosmetic Type Validation**
    - **Validates: Requirements 3.1**

  - [x] 17.3 Write property test for inventory consistency
    - **Property 7: Inventory Consistency**
    - **Validates: Requirements 3.4, 3.5**

- [x] 18. Cosmetics API
  - [x] 18.1 Create `backend/app/api/v1/cosmetics.py`
    - Create cosmetics router
    - Implement GET /cosmetics/shop endpoint
    - Implement GET /cosmetics/{type} endpoint
    - Implement GET /cosmetics/{cosmetic_id} endpoint
    - Implement GET /me/inventory endpoint
    - Implement POST /cosmetics/{cosmetic_id}/purchase endpoint
    - Implement POST /cosmetics/{cosmetic_id}/equip endpoint
    - Implement GET /cosmetics/equipped endpoint
    - _Requirements: 3.3-3.6_

  - [x] 18.2 Register cosmetics router in `backend/app/api/v1/router.py`
    - Add cosmetics router to v1 router
    - _Requirements: 7.7_

- [x] 19. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.



---

## Phase 5: Battle Pass Service

- [x] 20. Battle Pass Schemas
  - [x] 20.1 Create `backend/app/schemas/battlepass.py`
    - Define Season schema
    - Define BattlePassTier schema
    - Define Reward schema (type, value, cosmetic)
    - Define PlayerBattlePass schema with progress
    - Define XPSource enum
    - Define XPAwardResult schema
    - Define ClaimResult schema
    - _Requirements: 4.1, 4.2, 4.6_

- [x] 21. Battle Pass Repository
  - [x] 21.1 Create `backend/app/database/repositories/battlepass_repo.py`
    - Implement BattlePassRepository class
    - Implement get_current_season()
    - Implement get_player_progress()
    - Implement create_player_progress()
    - Implement update_progress() with XP and tier
    - Implement get_tier_rewards()
    - Implement mark_reward_claimed()
    - Implement log_xp_gain()
    - _Requirements: 4.1, 4.2, 4.6, 4.10_

- [x] 22. Battle Pass Service
  - [x] 22.1 Create `backend/app/services/battlepass_service.py`
    - Implement BattlePassService class
    - Implement get_current_season()
    - Implement get_player_progress() with claimable rewards calculation
    - Implement award_xp() with tier advancement logic
    - Implement claim_reward() with premium check
    - Implement purchase_premium()
    - Implement get_tier_rewards()
    - Implement calculate_match_xp() with formula and clamping [50, 300]
    - _Requirements: 4.1-4.10_

  - [x] 22.2 Write property test for XP bounds
    - **Property 8: XP Calculation Bounds**
    - **Validates: Requirements 4.4**

  - [x] 22.3 Write property test for tier advancement
    - **Property 9: Tier Advancement Correctness**
    - **Validates: Requirements 4.5**

- [x] 23. Battle Pass API
  - [x] 23.1 Create `backend/app/api/v1/battlepass.py`
    - Create battlepass router
    - Implement GET /battlepass/current endpoint
    - Implement GET /me/battlepass endpoint
    - Implement POST /me/battlepass/claim-reward endpoint
    - Implement GET /me/battlepass/xp-progress endpoint
    - Implement GET /battlepass/tiers/{season} endpoint
    - Implement POST /me/battlepass/purchase-premium endpoint
    - _Requirements: 4.1-4.9_

  - [x] 23.2 Register battlepass router in `backend/app/api/v1/router.py`
    - Add battlepass router to v1 router
    - _Requirements: 7.7_

- [x] 24. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 6: Enhanced Leaderboard Service with ELO

- [x] 25. ELO Schemas
  - [x] 25.1 Update `backend/app/schemas/leaderboard.py`
    - Add RankTier enum (Bronze through Grandmaster)
    - Add PlayerRating schema
    - Add LeaderboardEntry schema with ELO and tier
    - Add UserRankResponse schema with nearby players
    - Add MatchResult schema for ELO history
    - _Requirements: 5.5, 5.6, 5.8_

- [x] 26. Ratings Repository
  - [x] 26.1 Create `backend/app/database/repositories/ratings_repo.py`
    - Implement RatingsRepository class
    - Implement get_rating() by user_id
    - Implement update_rating() with ELO and tier
    - Implement get_leaderboard() with pagination
    - Implement get_regional_leaderboard() with country filter
    - Implement get_user_rank() with position
    - Implement get_nearby_players()
    - _Requirements: 5.6, 5.7, 5.8_

  - [x] 26.2 Create `backend/app/database/repositories/match_results_repo.py`
    - Implement MatchResultsRepository class
    - Implement create_result() with ELO deltas
    - Implement get_results_for_player() with pagination
    - Implement get_head_to_head() for matchup stats
    - _Requirements: 6.2, 6.8_

- [x] 27. Enhanced Leaderboard Service
  - [x] 27.1 Update `backend/app/services/leaderboard_service.py`
    - Add K_FACTORS dict by rating range
    - Add TIERS dict with ELO ranges
    - Implement calculate_elo_change() with standard formula
    - Implement update_ratings() for both players after match
    - Implement get_global_leaderboard() with Redis caching
    - Implement get_regional_leaderboard()
    - Implement get_user_rank() with nearby players
    - Implement get_tier() from ELO
    - Implement _clamp_elo() to [100, 3000]
    - _Requirements: 5.1-5.10_

  - [x] 27.2 Write property test for ELO zero-sum
    - **Property 10: ELO Zero-Sum**
    - **Validates: Requirements 5.3**

  - [x] 27.3 Write property test for ELO bounds
    - **Property 11: ELO Bounds**
    - **Validates: Requirements 5.4**

  - [x] 27.4 Write property test for tier assignment
    - **Property 12: Rank Tier Assignment**
    - **Validates: Requirements 5.5**

- [x] 28. Leaderboard API Updates
  - [x] 28.1 Update `backend/app/api/v1/leaderboards.py`
    - Update GET /leaderboards/global with ELO sorting
    - Add GET /leaderboards/regional/{region} endpoint
    - Update GET /leaderboards/me with nearby players
    - Add GET /leaderboards/seasonal/{season} endpoint
    - _Requirements: 5.6, 5.7, 5.8, 5.10_

- [x] 29. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 7: Event-Driven Integration

- [x] 30. Event Infrastructure
  - [x] 30.1 Create `backend/app/events/__init__.py`
    - Export EventPublisher, EventSubscriber
    - _Requirements: 8.1_

  - [x] 30.2 Create `backend/app/events/publisher.py`
    - Implement EventPublisher class
    - Define TOPICS dict for all event types
    - Implement publish() generic method
    - Implement publish_match_completed()
    - Implement publish_cosmetic_purchased()
    - Implement publish_reward_earned()
    - Implement publish_player_levelup()
    - _Requirements: 8.2, 8.6, 8.7, 8.8_

  - [x] 30.3 Create `backend/app/events/subscriber.py`
    - Implement EventSubscriber class
    - Implement start() to begin listening
    - Implement handle_message() with routing
    - Implement acknowledgment and retry logic
    - _Requirements: 8.9, 8.10_

  - [x] 30.4 Create `backend/app/events/handlers.py`
    - Implement handle_match_completed() - updates stats, ELO, XP
    - Implement handle_cosmetic_purchased() - audit logging
    - Implement handle_reward_earned() - notifications
    - Ensure all handlers are idempotent
    - _Requirements: 8.3, 8.4, 8.5, 8.9_

  - [x] 30.5 Write property test for event idempotency
    - **Property 14: Event Idempotency**
    - **Validates: Requirements 8.9**

- [x] 31. Game Service Integration
  - [x] 31.1 Update `backend/app/services/game_service.py`
    - Import EventPublisher
    - Publish match.completed event on game end
    - Include all match data in event payload
    - _Requirements: 8.2_

- [x] 32. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.



---

## Phase 8: API Gateway Enhancements

- [x] 33. Enhanced Middleware
  - [x] 33.1 Update `backend/app/middleware/auth.py`
    - Implement RS256 JWT verification
    - Add token blacklist checking
    - Add request tracing with X-Request-ID
    - _Requirements: 1.2, 1.6, 7.8_

  - [x] 33.2 Create `backend/app/middleware/request_logging.py`
    - Implement request logging middleware
    - Log timestamp, user_id, endpoint, response_time, status_code
    - Use structured JSON format
    - _Requirements: 7.4, 14.2_

  - [x] 33.3 Update `backend/app/middleware/rate_limit.py`
    - Add per-category rate limits
    - Add X-RateLimit headers to responses
    - Implement Redis-backed counters
    - _Requirements: 7.2, 7.3_

- [x] 34. API Gateway Configuration
  - [x] 34.1 Update `backend/app/main.py`
    - Add CORS configuration with allowed origins
    - Add gzip compression middleware
    - Add request size limits (10MB uploads, 1MB others)
    - Add health check endpoint
    - Register all new routers
    - _Requirements: 7.5, 7.9, 7.10, 14.6_

- [x] 35. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 9: Frontend Integration

- [x] 36. Profile Frontend
  - [x] 36.1 Create `frontend/src/types/profile.ts`
    - Define Profile interface
    - Define ProfileUpdate interface
    - Define SocialLinks interface
    - Define PrivacySettings interface
    - _Requirements: 2.1_

  - [x] 36.2 Create `frontend/src/hooks/useProfile.ts`
    - Implement profile fetching
    - Implement profile update
    - Implement avatar upload flow
    - Implement banner upload flow
    - _Requirements: 2.1-2.6_

  - [x] 36.3 Create `frontend/src/components/profile/ProfileCard.tsx`
    - Display avatar, banner, display_name, bio
    - Display level, title, country
    - Display social links
    - _Requirements: 2.1_

  - [x] 36.4 Create `frontend/src/components/profile/ProfileEditor.tsx`
    - Form for editing profile fields
    - Avatar upload with preview
    - Banner upload with preview
    - Privacy settings toggles
    - _Requirements: 2.2-2.8_

- [x] 37. Cosmetics Frontend
  - [x] 37.1 Create `frontend/src/types/cosmetic.ts`
    - Define CosmeticType enum
    - Define Rarity enum
    - Define Cosmetic interface
    - Define InventoryItem interface
    - Define Loadout interface
    - _Requirements: 3.1, 3.2_

  - [x] 37.2 Create `frontend/src/hooks/useCosmetics.ts`
    - Implement shop fetching with filters
    - Implement inventory fetching
    - Implement purchase flow
    - Implement equip/unequip flow
    - _Requirements: 3.3-3.6_

  - [x] 37.3 Create `frontend/src/components/cosmetics/ShopGrid.tsx`
    - Display cosmetics in grid layout
    - Filter by type and rarity
    - Show price and owned status
    - _Requirements: 3.3_

  - [x] 37.4 Create `frontend/src/components/cosmetics/InventoryGrid.tsx`
    - Display owned cosmetics
    - Show equipped status
    - Equip/unequip buttons
    - _Requirements: 3.6_

  - [x] 37.5 Create `frontend/src/components/cosmetics/LoadoutDisplay.tsx`
    - Display currently equipped items
    - Quick-swap functionality
    - _Requirements: 3.5_

- [x] 38. Battle Pass Frontend
  - [x] 38.1 Create `frontend/src/types/battlepass.ts`
    - Define Season interface
    - Define BattlePassTier interface
    - Define PlayerBattlePass interface
    - Define XPAwardResult interface
    - _Requirements: 4.1, 4.2_

  - [x] 38.2 Create `frontend/src/hooks/useBattlePass.ts`
    - Implement season fetching
    - Implement progress fetching
    - Implement reward claiming
    - Implement premium purchase
    - _Requirements: 4.1-4.9_

  - [x] 38.3 Create `frontend/src/components/battlepass/BattlePassTrack.tsx`
    - Display tier progression track
    - Show free and premium rewards
    - Highlight current tier
    - Claim buttons for available rewards
    - _Requirements: 4.2, 4.6, 4.8_

  - [x] 38.4 Create `frontend/src/components/battlepass/XPProgress.tsx`
    - Display current XP and tier
    - Progress bar to next tier
    - XP breakdown by source
    - _Requirements: 4.2, 4.5_

- [x] 39. Enhanced Leaderboard Frontend
  - [x] 39.1 Update `frontend/src/types/leaderboard.ts`
    - Add RankTier type
    - Add PlayerRating interface
    - Add ELO-based LeaderboardEntry
    - _Requirements: 5.5, 5.6_

  - [x] 39.2 Update `frontend/src/pages/LeaderboardHub.tsx`
    - Add ELO-based global leaderboard
    - Add regional filter
    - Display rank tiers with icons
    - _Requirements: 5.6, 5.7_

  - [x] 39.3 Create `frontend/src/components/leaderboard/RankBadge.tsx`
    - Display rank tier with icon and color
    - Bronze through Grandmaster styling
    - _Requirements: 5.5_

  - [x] 39.4 Update `frontend/src/pages/LeaderboardDetail.tsx`
    - Show user's rank with nearby players
    - Display ELO and tier
    - Show peak ELO
    - _Requirements: 5.8_

- [x] 40. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 10: Integration Testing

- [x] 41. Integration Tests
  - [x] 41.1 Create `backend/tests/integration/test_profile_flow.py`
    - Test profile creation on registration
    - Test profile update with validation
    - Test avatar upload flow
    - Test privacy settings
    - _Requirements: 2.1-2.10_

  - [x] 41.2 Create `backend/tests/integration/test_cosmetics_flow.py`
    - Test shop browsing
    - Test purchase flow
    - Test equip/unequip flow
    - Test inventory caching
    - _Requirements: 3.1-3.10_

  - [x] 41.3 Create `backend/tests/integration/test_battlepass_flow.py`
    - Test XP award from match
    - Test tier advancement
    - Test reward claiming
    - Test premium upgrade
    - _Requirements: 4.1-4.10_

  - [x] 41.4 Create `backend/tests/integration/test_elo_flow.py`
    - Test ELO calculation after match
    - Test tier assignment
    - Test leaderboard updates
    - Test regional filtering
    - _Requirements: 5.1-5.10_

  - [x] 41.5 Create `backend/tests/integration/test_event_flow.py`
    - Test match.completed event publishing
    - Test event handler execution
    - Test idempotent handling
    - _Requirements: 8.1-8.10_

- [x] 42. Migration Testing
  - [x] 42.1 Write property test for migration idempotency
    - **Property 15: Migration Idempotency**
    - **Validates: Requirements 13.9**

  - [x] 42.2 Test migration on production-like data
    - Create test database with sample data
    - Run all migrations
    - Verify data integrity
    - Verify rollback capability
    - _Requirements: 13.1-13.10_

- [x] 43. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 11: Documentation and Deployment

- [x] 44. API Documentation
  - [x] 44.1 Update OpenAPI schemas
    - Document all new endpoints
    - Add request/response examples
    - Document error codes
    - _Requirements: All_

- [x] 45. Deployment Configuration
  - [x] 45.1 Update environment configuration
    - Add Redis connection settings
    - Add Cloud Storage settings
    - Add Pub/Sub settings
    - Add RS256 key paths
    - _Requirements: 11.1, 10.1, 8.1, 1.2_

  - [x] 45.2 Create Cloud Run service configurations
    - Configure autoscaling for each service
    - Set memory and CPU limits
    - Configure health checks
    - _Requirements: 15.1-15.10_

- [x] 46. Final Verification
  - [x] 46.1 Run full test suite
    - All unit tests pass
    - All property tests pass
    - All integration tests pass
    - _Requirements: All_

  - [x] 46.2 Performance verification
    - API response time < 200ms p95
    - Database queries < 100ms
    - Cache hit rate > 90%
    - _Requirements: Success Metrics_

---

## Quick Reference

### File Size Targets

| File | Target Lines |
|------|--------------|
| auth_service.py (enhanced) | <300 |
| profile_service.py | <250 |
| cosmetics_service.py | <250 |
| battlepass_service.py | <300 |
| leaderboard_service.py (enhanced) | <300 |
| storage_service.py | <150 |
| cache_manager.py | <150 |
| publisher.py | <100 |
| subscriber.py | <150 |
| handlers.py | <200 |
| profile_repo.py | <200 |
| cosmetics_repo.py | <200 |
| battlepass_repo.py | <250 |
| ratings_repo.py | <200 |

### Property Tests Summary

| Property | Test File | Validates |
|----------|-----------|-----------|
| 1. Password Hashing | test_auth_enhanced.py | 1.1, 12.3 |
| 2. JWT Structure | test_auth_enhanced.py | 1.2, 1.5 |
| 3. Rate Limiting | test_auth_enhanced.py | 1.3, 1.4 |
| 4. Token Validation | test_auth_enhanced.py | 1.6 |
| 5. Profile Validation | test_profiles.py | 2.2 |
| 6. Cosmetic Types | test_cosmetics.py | 3.1 |
| 7. Inventory Consistency | test_cosmetics.py | 3.4, 3.5 |
| 8. XP Bounds | test_battlepass.py | 4.4 |
| 9. Tier Advancement | test_battlepass.py | 4.5 |
| 10. ELO Zero-Sum | test_elo.py | 5.3 |
| 11. ELO Bounds | test_elo.py | 5.4 |
| 12. Tier Assignment | test_elo.py | 5.5 |
| 13. Cache Invalidation | test_cache.py | 3.8, 11.7 |
| 14. Event Idempotency | test_events.py | 8.9 |
| 15. Migration Idempotency | test_migrations.py | 13.9 |

### ELO Rank Tiers

| Tier | ELO Range | Icon |
|------|-----------|------|
| Bronze | 100-799 | 🥉 |
| Silver | 800-1199 | 🥈 |
| Gold | 1200-1599 | 🥇 |
| Platinum | 1600-1999 | 💎 |
| Diamond | 2000-2399 | 💠 |
| Master | 2400-2799 | 👑 |
| Grandmaster | 2800-3000 | 🏆 |

### XP Formula

```
Base XP:
- Win: 100 XP
- Loss: 50 XP

Bonuses:
- Per kill: +5 XP
- Per streak count: +10 XP
- Per second played: +0.1 XP

Bounds: [50, 300] XP per match
```

### Cache TTLs

| Cache Key | TTL |
|-----------|-----|
| Session tokens | Token expiration |
| Leaderboards | 5 minutes |
| Cosmetics catalog | 24 hours |
| Player inventory | 5 minutes |
| Rate limit counters | 60 seconds |

---

*Total Tasks: 46 (with sub-tasks)*
*Estimated Time: 3-4 weeks*
*New Files: ~40*
*Property Tests: 15*

