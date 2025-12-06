# User Services & Microservices Architecture - Requirements Document

## Introduction

This document defines the comprehensive requirements for transitioning the 1v1bro game backend from a monolithic architecture to a service-oriented architecture with dedicated user services. The current implementation has a solid game core (60Hz tick system, WebSocket sync, lobby management) but lacks persistent player profiles, cosmetics, battle pass progression, and proper service decomposition.

This upgrade introduces six new services following enterprise microservices patterns:
1. **Authentication Service** - Enhanced auth with JWT RS256, rate limiting, 2FA support
2. **Profile Service** - User profiles, avatars, banners, customization
3. **Cosmetics Service** - Skins, emotes, effects, inventory management
4. **Battle Pass Service** - Seasonal progression, XP tracking, tier rewards
5. **Leaderboard Service** - ELO rating, ranked tiers, seasonal rankings
6. **Statistics Service** - Match history, performance analytics, trends

The implementation follows established codebase patterns: Repository Pattern for data access, Service Pattern for business logic, Schema Pattern for validation, and Migration Pattern for database changes.

## Glossary

- **Authentication_Service**: Service responsible for user registration, login, JWT token generation/validation
- **Profile_Service**: Service managing user profile data, avatars, banners, and public information
- **Cosmetics_Service**: Service managing cosmetic items (skins, emotes, effects) and player inventory
- **BattlePass_Service**: Service managing seasonal progression, XP tracking, and reward distribution
- **Leaderboard_Service**: Service managing ELO ratings, rankings, and competitive tiers
- **Statistics_Service**: Service aggregating match data, generating insights, and tracking performance
- **JWT**: JSON Web Token used for stateless authentication
- **ELO**: Rating system where points are exchanged between players based on match outcome
- **MMR**: Matchmaking Rating - numerical skill rating calculated from player performance
- **Cosmetic**: Visual customization item (skin, emote, banner, effect, nameplate)
- **Battle_Pass**: Seasonal progression system with tiers and rewards
- **XP**: Experience points earned from gameplay that advance battle pass tiers
- **Inventory**: Collection of cosmetics owned by a player
- **Loadout**: Currently equipped cosmetics visible in-game
- **K_Factor**: Maximum ELO rating change per game (32 standard)
- **Rank_Tier**: Competitive tier based on ELO (Bronze, Silver, Gold, Platinum, Diamond, Master, Grandmaster)

---

## Current State Analysis

| Component | Current Implementation | Limitation |
|-----------|----------------------|------------|
| Authentication | Supabase Auth + basic JWT | No RS256 signing, no rate limiting, no 2FA |
| User Profiles | Basic user_profiles table | No avatars, banners, bios, social links |
| Cosmetics | None | No skins, emotes, or visual customization |
| Battle Pass | None | No seasonal progression or rewards |
| Leaderboards | Basic stats-based | No ELO system, no ranked tiers |
| Statistics | Basic games_played/won | No detailed analytics, no trends |
| Architecture | Monolithic FastAPI | All services in single codebase |
| File Storage | None | No avatar/banner upload capability |
| Caching | None | No Redis layer for performance |
| Events | None | No Pub/Sub for service communication |

### Problems to Solve

1. **No Profile Customization**: Players cannot upload avatars, banners, or customize profiles
2. **No Cosmetics System**: No skins, emotes, or visual differentiation between players
3. **No Battle Pass**: No seasonal progression to drive engagement
4. **No Proper ELO**: Current MMR is basic, no ranked tiers or seasons
5. **No Service Separation**: All logic in monolith, hard to scale independently
6. **No File Storage**: Cannot handle user-uploaded media
7. **No Caching Layer**: Database hit on every request
8. **No Event System**: Services tightly coupled, no async communication

---

## Requirements

### Requirement 1: Enhanced Authentication Service

**User Story:** As a player, I want secure authentication with modern security features, so that my account is protected from unauthorized access.

#### Acceptance Criteria

1. WHEN a user registers THEN the Authentication_Service SHALL hash passwords using bcrypt with cost factor 12 or higher
2. WHEN a user logs in successfully THEN the Authentication_Service SHALL generate a JWT token signed with RS256 algorithm (not HS256)
3. WHEN a user attempts login THEN the Authentication_Service SHALL enforce rate limiting of 5 attempts per minute per IP address
4. IF a user exceeds login rate limit THEN the Authentication_Service SHALL return HTTP 429 with retry-after header in seconds
5. WHEN a JWT token is generated THEN the Authentication_Service SHALL include user_id, email, and expiration timestamp in the payload
6. WHEN validating a token THEN the Authentication_Service SHALL verify the RS256 signature and check expiration
7. WHEN a user logs out THEN the Authentication_Service SHALL invalidate the session and clear auth cookies
8. THE Authentication_Service SHALL support optional TOTP-based 2FA (Google Authenticator compatible)
9. WHEN 2FA is enabled THEN the Authentication_Service SHALL require TOTP code after password verification
10. THE Authentication_Service SHALL provide password reset flow via email with time-limited tokens (15 minutes)



---

### Requirement 2: Profile Service

**User Story:** As a player, I want to customize my profile with avatars, banners, and personal information, so that I can express my identity and be recognized by other players.

#### Acceptance Criteria

1. WHEN a user views their profile THEN the Profile_Service SHALL return display_name, bio, avatar_url, banner_url, level, title, country, and social_links
2. WHEN a user updates their profile THEN the Profile_Service SHALL validate bio length (max 200 characters) and display_name (3-50 characters)
3. WHEN a user uploads an avatar THEN the Profile_Service SHALL generate a signed upload URL for Cloud Storage with 5-minute expiration
4. WHEN an avatar is uploaded THEN the Profile_Service SHALL validate format (JPEG, PNG, WebP), size (max 5MB), and resize to 128x128, 256x256, and 512x512 variants
5. WHEN a user uploads a banner THEN the Profile_Service SHALL validate format (JPEG, PNG, WebP), size (max 10MB), and resize to 960x270 and 1920x540 variants
6. WHEN viewing another user's profile THEN the Profile_Service SHALL return only public information based on privacy settings
7. THE Profile_Service SHALL compute user level from total XP using formula: level = floor(sqrt(total_xp / 100))
8. WHEN a user sets privacy settings THEN the Profile_Service SHALL respect is_public, accept_friend_requests, and allow_messages flags
9. THE Profile_Service SHALL support social links for Twitch, YouTube, and Twitter with URL validation
10. WHEN profile data changes THEN the Profile_Service SHALL update the updated_at timestamp

---

### Requirement 3: Cosmetics Service

**User Story:** As a player, I want to collect and equip cosmetic items, so that I can customize my in-game appearance and stand out from other players.

#### Acceptance Criteria

1. THE Cosmetics_Service SHALL support the following cosmetic types: skin, emote, banner, nameplate, effect, trail
2. THE Cosmetics_Service SHALL support the following rarity tiers: common, uncommon, rare, epic, legendary
3. WHEN a user views the shop THEN the Cosmetics_Service SHALL return all available cosmetics with name, type, rarity, description, image_url, and price
4. WHEN a user purchases a cosmetic THEN the Cosmetics_Service SHALL add the item to their inventory with acquired_date timestamp
5. WHEN a user equips a cosmetic THEN the Cosmetics_Service SHALL update their loadout for the appropriate slot (skin, emote, banner, nameplate, effect)
6. WHEN a user views their inventory THEN the Cosmetics_Service SHALL return all owned cosmetics with equipped status
7. THE Cosmetics_Service SHALL cache the cosmetics catalog in Redis with 24-hour TTL
8. THE Cosmetics_Service SHALL cache user inventory in Redis with 5-minute TTL, invalidated on purchase/equip
9. WHEN a cosmetic is limited edition THEN the Cosmetics_Service SHALL track is_limited flag and remove from shop after season end
10. THE Cosmetics_Service SHALL track owned_by_count for each cosmetic (updated weekly for analytics)

---

### Requirement 4: Battle Pass Service

**User Story:** As a player, I want to progress through a seasonal battle pass by playing games, so that I can earn exclusive rewards and have goals to work toward.

#### Acceptance Criteria

1. THE BattlePass_Service SHALL support seasons with season_number, name, theme, start_date, end_date, and is_active flag
2. WHEN a season is active THEN the BattlePass_Service SHALL track player progress with current_tier (0-100), current_xp, and is_premium flag
3. WHEN a game ends THEN the BattlePass_Service SHALL award XP based on: Win=100, Loss=50, +5 per kill, +10 per streak count, +0.1 per second played
4. THE BattlePass_Service SHALL cap XP per match at 300 and minimum at 50 (even for losses)
5. WHEN a player earns enough XP THEN the BattlePass_Service SHALL advance their tier (default: 1000 XP per tier)
6. WHEN a player reaches a new tier THEN the BattlePass_Service SHALL make the tier reward claimable
7. WHEN a player claims a reward THEN the BattlePass_Service SHALL add the reward to their inventory and mark tier as claimed
8. THE BattlePass_Service SHALL support free_reward and premium_reward per tier (premium requires is_premium=true)
9. WHEN a player purchases premium pass THEN the BattlePass_Service SHALL set is_premium=true and unlock all premium rewards for claimed tiers
10. THE BattlePass_Service SHALL log all XP gains with source (match_win, match_loss, season_challenge, daily_bonus) for analytics

---

### Requirement 5: Enhanced Leaderboard Service

**User Story:** As a competitive player, I want to see my ELO rating and rank tier, so that I can track my skill level and compete for top positions.

#### Acceptance Criteria

1. THE Leaderboard_Service SHALL calculate ELO using the standard formula with K_Factor=32 for players under 2000, K_Factor=24 for 2000-2400, K_Factor=16 for 2400+
2. WHEN a new player is created THEN the Leaderboard_Service SHALL assign starting ELO of 1200
3. WHEN a game ends THEN the Leaderboard_Service SHALL calculate ELO change: new_elo = old_elo + K * (score - expected_score)
4. THE Leaderboard_Service SHALL clamp ELO to range [100, 3000] to prevent extreme outliers
5. THE Leaderboard_Service SHALL assign rank tiers: Bronze (100-799), Silver (800-1199), Gold (1200-1599), Platinum (1600-1999), Diamond (2000-2399), Master (2400-2799), Grandmaster (2800-3000)
6. WHEN viewing global leaderboard THEN the Leaderboard_Service SHALL return top 100 players sorted by ELO descending
7. WHEN viewing regional leaderboard THEN the Leaderboard_Service SHALL filter by player country and return top 100
8. WHEN viewing user rank THEN the Leaderboard_Service SHALL return rank position, ELO, tier, and nearby players (±5 positions)
9. THE Leaderboard_Service SHALL cache leaderboards in Redis sorted sets with 5-minute TTL
10. THE Leaderboard_Service SHALL support seasonal leaderboards that reset at season end with historical archives

---

### Requirement 6: Statistics Service

**User Story:** As a player, I want to view detailed statistics and performance trends, so that I can understand my strengths and areas for improvement.

#### Acceptance Criteria

1. THE Statistics_Service SHALL track lifetime, seasonal, weekly, and daily statistics separately
2. WHEN a game ends THEN the Statistics_Service SHALL record match_history with all game details (players, scores, duration, map, ELO changes)
3. THE Statistics_Service SHALL compute the following derived statistics: win_rate, kd_ratio, accuracy_pct, avg_answer_time_ms, answer_rate
4. WHEN viewing lifetime stats THEN the Statistics_Service SHALL return all cumulative statistics since account creation
5. WHEN viewing seasonal stats THEN the Statistics_Service SHALL return statistics for the current season only
6. WHEN viewing match history THEN the Statistics_Service SHALL return recent matches with pagination (default 10, max 50)
7. THE Statistics_Service SHALL track performance trends: improving, stable, or declining based on 30-day ELO movement
8. WHEN viewing matchup statistics THEN the Statistics_Service SHALL return win/loss record against specific opponents
9. THE Statistics_Service SHALL track personal bests: fastest_answer_ms, best_win_streak, peak_elo
10. THE Statistics_Service SHALL support public/private visibility based on profile privacy settings



---

### Requirement 7: API Gateway

**User Story:** As a system operator, I want a unified API gateway that handles authentication, rate limiting, and request routing, so that all services are protected and monitored consistently.

#### Acceptance Criteria

1. THE API_Gateway SHALL validate JWT tokens on all protected endpoints before routing to services
2. THE API_Gateway SHALL apply rate limiting per endpoint category: auth=10/min, game=1000/min, leaderboard=100/min, upload=10/min
3. WHEN rate limit is exceeded THEN the API_Gateway SHALL return HTTP 429 with X-RateLimit-Remaining and X-RateLimit-Reset headers
4. THE API_Gateway SHALL log all requests with timestamp, user_id, endpoint, response_time, and status_code
5. THE API_Gateway SHALL handle CORS with configurable allowed origins
6. WHEN a service is unavailable THEN the API_Gateway SHALL return HTTP 503 with retry-after header
7. THE API_Gateway SHALL route requests to appropriate services based on URL prefix (/auth, /profiles, /cosmetics, /battlepass, /leaderboards, /stats)
8. THE API_Gateway SHALL support request tracing with X-Request-ID header propagation
9. THE API_Gateway SHALL compress responses using gzip for payloads over 1KB
10. THE API_Gateway SHALL enforce maximum request body size of 10MB for uploads, 1MB for other requests

---

### Requirement 8: Event-Driven Architecture

**User Story:** As a system architect, I want services to communicate via events, so that they remain loosely coupled and can scale independently.

#### Acceptance Criteria

1. THE Event_System SHALL use Google Cloud Pub/Sub for asynchronous event delivery
2. WHEN a match completes THEN the Game_Service SHALL publish a match.completed event with match_id, player_ids, winner_id, duration, and scores
3. WHEN a match.completed event is received THEN the Statistics_Service SHALL record match_history and update player_stats
4. WHEN a match.completed event is received THEN the Leaderboard_Service SHALL calculate and update ELO ratings
5. WHEN a match.completed event is received THEN the BattlePass_Service SHALL award XP to both players
6. WHEN a cosmetic is purchased THEN the Cosmetics_Service SHALL publish a player.cosmetic_purchased event
7. WHEN a battle pass reward is earned THEN the BattlePass_Service SHALL publish a battlepass.reward_earned event
8. WHEN a player levels up THEN the Profile_Service SHALL publish a player.levelup event
9. THE Event_System SHALL guarantee at-least-once delivery with idempotent event handlers
10. THE Event_System SHALL support dead-letter queues for failed event processing with 3 retry attempts

---

### Requirement 9: Database Architecture

**User Story:** As a system architect, I want clear data ownership boundaries between services, so that each service can evolve independently without breaking others.

#### Acceptance Criteria

1. THE Authentication_Service SHALL own: users, sessions, password_reset_tokens tables
2. THE Profile_Service SHALL own: profiles, profile_settings tables
3. THE Cosmetics_Service SHALL own: cosmetics_catalog, inventory, loadouts tables
4. THE BattlePass_Service SHALL own: seasons, player_battlepass, battlepass_tiers, xp_logs tables
5. THE Leaderboard_Service SHALL own: player_ratings, match_results tables
6. THE Statistics_Service SHALL own: player_stats, match_history tables
7. WHEN a service needs data from another service THEN it SHALL call that service's API (never direct database access)
8. THE Database SHALL use PostgreSQL with separate schemas per service for logical isolation
9. THE Database SHALL use Redis for caching with service-specific key prefixes
10. ALL database operations SHALL use connection pooling with max 20 connections per service

---

### Requirement 10: File Storage

**User Story:** As a player, I want to upload profile images that are served quickly worldwide, so that my customizations are visible to all players.

#### Acceptance Criteria

1. THE File_Storage SHALL use Google Cloud Storage with buckets: gs://1v1bro-user-media/avatars/ and gs://1v1bro-user-media/banners/
2. WHEN uploading a file THEN the Profile_Service SHALL generate a signed URL with 5-minute expiration for direct client upload
3. WHEN a file is uploaded THEN the system SHALL trigger a Cloud Function to resize and optimize the image
4. THE File_Storage SHALL serve files via Cloud CDN with cache headers: 1 year for immutable versioned files, 1 hour for current
5. WHEN an avatar is updated THEN the system SHALL delete old versions after 30 days via lifecycle policy
6. THE File_Storage SHALL enforce file type validation: JPEG, PNG, WebP only
7. THE File_Storage SHALL enforce size limits: 5MB for avatars, 10MB for banners
8. WHEN serving images THEN the CDN SHALL support WebP format with fallback to original format
9. THE File_Storage SHALL generate unique filenames using UUID to prevent conflicts
10. THE File_Storage SHALL support CORS for direct browser uploads

---

### Requirement 11: Caching Strategy

**User Story:** As a system operator, I want frequently accessed data cached, so that the system remains responsive under load.

#### Acceptance Criteria

1. THE Caching_System SHALL use Redis cluster for all caching needs
2. THE Caching_System SHALL cache session tokens with TTL matching token expiration
3. THE Caching_System SHALL cache leaderboards in sorted sets with 5-minute TTL
4. THE Caching_System SHALL cache cosmetics catalog with 24-hour TTL
5. THE Caching_System SHALL cache player inventory with 5-minute TTL, invalidated on purchase/equip
6. THE Caching_System SHALL cache rate limit counters with 60-second TTL
7. WHEN cache is invalidated THEN the system SHALL use cache-aside pattern (read from DB, write to cache)
8. THE Caching_System SHALL use consistent key naming: {service}:{entity}:{id} (e.g., cosmetics:inventory:user123)
9. THE Caching_System SHALL support cache warming on service startup for critical data
10. THE Caching_System SHALL monitor cache hit rates with target >90% for hot paths

---

### Requirement 12: Security Requirements

**User Story:** As a player, I want my account and data protected with industry-standard security measures, so that I can trust the platform with my information.

#### Acceptance Criteria

1. THE System SHALL encrypt all data in transit using TLS 1.3
2. THE System SHALL encrypt sensitive data at rest (passwords, tokens, PII)
3. THE Authentication_Service SHALL use bcrypt with cost factor 12+ for password hashing
4. THE Authentication_Service SHALL use RS256 (asymmetric) for JWT signing, not HS256 (symmetric)
5. THE System SHALL implement CSRF protection for all state-changing operations
6. THE System SHALL sanitize all user inputs to prevent XSS and SQL injection
7. THE System SHALL log all authentication events (login, logout, failed attempts) for audit
8. THE System SHALL implement account lockout after 10 failed login attempts (30-minute lockout)
9. THE System SHALL support secure password requirements: minimum 8 characters, mixed case, number, special character
10. THE System SHALL implement secure session management with httpOnly, secure, sameSite cookies



---

### Requirement 13: Database Migration Strategy

**User Story:** As a developer, I want a safe migration path from the current schema, so that existing users retain their data and the system remains available during migration.

#### Acceptance Criteria

1. THE Migration SHALL add new columns with DEFAULT values (no NOT NULL without default on existing tables)
2. THE Migration SHALL NOT modify existing column types or constraints that would break current functionality
3. THE Migration SHALL be reversible with DOWN migration scripts for rollback capability
4. THE Migration SHALL complete within 60 seconds on tables with 100k+ rows
5. THE Migration SHALL preserve all existing user data including games_played, games_won, total_score
6. THE Migration SHALL create new tables for: cosmetics_catalog, inventory, loadouts, seasons, player_battlepass, battlepass_tiers, xp_logs, player_ratings, match_results
7. THE Migration SHALL add appropriate indexes for all foreign keys and frequently queried columns
8. THE Migration SHALL use transactions to ensure atomicity of schema changes
9. THE Migration SHALL be idempotent (safe to run multiple times)
10. THE Migration SHALL include data backfill scripts for computing initial ELO from existing win/loss records

---

### Requirement 14: Monitoring and Observability

**User Story:** As a system operator, I want comprehensive monitoring and alerting, so that I can detect and respond to issues before they impact players.

#### Acceptance Criteria

1. THE System SHALL expose Prometheus metrics for all services: request_count, request_latency, error_rate
2. THE System SHALL log structured JSON logs with timestamp, service, level, message, and trace_id
3. THE System SHALL implement distributed tracing with OpenTelemetry for cross-service request tracking
4. THE System SHALL alert on: error_rate > 1%, latency_p95 > 500ms, service_unavailable
5. THE System SHALL track business metrics: daily_active_users, matches_played, battle_pass_purchases
6. THE System SHALL implement health check endpoints (/health) for all services returning status and dependencies
7. THE System SHALL monitor database connection pool utilization with alert at 80% capacity
8. THE System SHALL monitor Redis memory usage with alert at 80% capacity
9. THE System SHALL retain logs for 30 days and metrics for 90 days
10. THE System SHALL support log aggregation via Google Cloud Logging (Stackdriver)

---

### Requirement 15: Scalability Requirements

**User Story:** As a system architect, I want the system to scale horizontally, so that it can handle growth from 100 to 100,000+ concurrent users.

#### Acceptance Criteria

1. THE System SHALL deploy services as independent Cloud Run containers with autoscaling
2. THE System SHALL scale Authentication_Service from 1-10 instances based on request rate
3. THE System SHALL scale Profile_Service from 1-20 instances based on request rate
4. THE System SHALL scale Cosmetics_Service from 1-10 instances based on request rate
5. THE System SHALL scale BattlePass_Service from 1-10 instances based on request rate
6. THE System SHALL scale Leaderboard_Service from 1-5 instances (Redis-backed, lower compute)
7. THE System SHALL scale API_Gateway from 2-50 instances as the entry point
8. THE Game_Service SHALL remain unchanged (existing 60Hz tick system, scales 5-100 instances)
9. THE System SHALL support 10,000 daily active users with infrastructure cost under $1,000/month
10. THE System SHALL handle traffic spikes of 10x normal load during peak hours without degradation

---

## Data Models

### Extended user_profiles Table

```sql
-- Existing columns preserved
-- New columns added for profile customization
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
  bio VARCHAR(200),
  banner_url TEXT,
  banner_color VARCHAR(7) DEFAULT '#1a1a2e',
  level INTEGER DEFAULT 1,
  total_xp BIGINT DEFAULT 0,
  title VARCHAR(50) DEFAULT 'Rookie',
  country VARCHAR(2),
  social_links JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  accept_friend_requests BOOLEAN DEFAULT true,
  allow_messages BOOLEAN DEFAULT true,
  theme VARCHAR(10) DEFAULT 'dark',
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(32);
```

### Cosmetics Tables

```sql
-- Cosmetic catalog (read-mostly)
CREATE TABLE cosmetics_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('skin', 'emote', 'banner', 'nameplate', 'effect', 'trail')),
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  description TEXT,
  image_url TEXT NOT NULL,
  preview_video_url TEXT,
  price_coins INTEGER NOT NULL DEFAULT 0,
  price_premium INTEGER,
  release_date TIMESTAMPTZ DEFAULT NOW(),
  event VARCHAR(50),
  is_limited BOOLEAN DEFAULT false,
  owned_by_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player inventory
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  cosmetic_id UUID NOT NULL REFERENCES cosmetics_catalog(id),
  acquired_date TIMESTAMPTZ DEFAULT NOW(),
  is_equipped BOOLEAN DEFAULT false,
  UNIQUE(user_id, cosmetic_id)
);

-- Equipped loadout
CREATE TABLE loadouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  skin_equipped UUID REFERENCES cosmetics_catalog(id),
  emote_equipped UUID REFERENCES cosmetics_catalog(id),
  banner_equipped UUID REFERENCES cosmetics_catalog(id),
  nameplate_equipped UUID REFERENCES cosmetics_catalog(id),
  effect_equipped UUID REFERENCES cosmetics_catalog(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Battle Pass Tables

```sql
-- Season definition
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_number INTEGER UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  theme VARCHAR(100),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT false,
  xp_per_tier INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Battle pass tiers
CREATE TABLE battlepass_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  tier_number INTEGER NOT NULL,
  free_reward JSONB,
  premium_reward JSONB,
  UNIQUE(season_id, tier_number)
);

-- Player battle pass progress
CREATE TABLE player_battlepass (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  current_tier INTEGER DEFAULT 0,
  current_xp INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  claimed_rewards INTEGER[] DEFAULT '{}',
  purchased_tiers INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, season_id)
);

-- XP log for analytics
CREATE TABLE xp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL,
  amount INTEGER NOT NULL,
  match_id UUID,
  challenge_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Leaderboard Tables

```sql
-- Player ELO ratings
CREATE TABLE player_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  current_elo INTEGER DEFAULT 1200,
  peak_elo INTEGER DEFAULT 1200,
  current_tier VARCHAR(20) DEFAULT 'Gold',
  tier_rank INTEGER,
  win_rate FLOAT DEFAULT 0.0,
  last_match_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Match results for ELO calculation
CREATE TABLE match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL,
  player1_id UUID NOT NULL REFERENCES user_profiles(id),
  player2_id UUID NOT NULL REFERENCES user_profiles(id),
  winner_id UUID REFERENCES user_profiles(id),
  duration_seconds INTEGER,
  player1_pre_elo INTEGER,
  player2_pre_elo INTEGER,
  player1_post_elo INTEGER,
  player2_post_elo INTEGER,
  elo_delta_p1 INTEGER,
  elo_delta_p2 INTEGER,
  played_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Endpoints

### Authentication Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Create new account |
| POST | `/api/v1/auth/login` | Validate credentials, return JWT |
| POST | `/api/v1/auth/refresh` | Extend token expiration |
| POST | `/api/v1/auth/logout` | Invalidate session |
| GET | `/api/v1/auth/validate` | Check token validity |
| POST | `/api/v1/auth/password-reset` | Initiate password reset |
| POST | `/api/v1/auth/2fa/enable` | Enable 2FA |
| POST | `/api/v1/auth/2fa/verify` | Verify 2FA code |

### Profile Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/profiles/{user_id}` | Fetch profile (public data) |
| GET | `/api/v1/profiles/me` | Fetch own profile (private data) |
| PUT | `/api/v1/profiles/me` | Update profile |
| POST | `/api/v1/profiles/me/avatar/upload-url` | Get signed upload URL |
| POST | `/api/v1/profiles/me/avatar/confirm` | Confirm avatar upload |
| POST | `/api/v1/profiles/me/banner/upload-url` | Get signed banner upload URL |
| POST | `/api/v1/profiles/me/banner/confirm` | Confirm banner upload |

### Cosmetics Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/cosmetics/shop` | All available cosmetics |
| GET | `/api/v1/cosmetics/{type}` | Filter by type |
| GET | `/api/v1/cosmetics/{cosmetic_id}` | Detail view |
| GET | `/api/v1/me/inventory` | Owned cosmetics |
| POST | `/api/v1/cosmetics/{cosmetic_id}/purchase` | Purchase cosmetic |
| POST | `/api/v1/cosmetics/{cosmetic_id}/equip` | Equip cosmetic |
| GET | `/api/v1/cosmetics/equipped` | Currently equipped set |

### Battle Pass Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/battlepass/current` | Active season info |
| GET | `/api/v1/me/battlepass` | My progress |
| POST | `/api/v1/me/battlepass/claim-reward` | Claim tier reward |
| GET | `/api/v1/me/battlepass/xp-progress` | XP breakdown |
| GET | `/api/v1/battlepass/tiers/{season}` | All tier rewards |
| POST | `/api/v1/me/battlepass/purchase-premium` | Purchase premium pass |

### Leaderboard Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/leaderboards/global` | Top 100 players |
| GET | `/api/v1/leaderboards/regional/{region}` | Top 100 in region |
| GET | `/api/v1/leaderboards/me` | My rank + nearby |
| GET | `/api/v1/leaderboards/seasonal/{season}` | Historical rankings |

### Statistics Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/stats/me/lifetime` | All-time statistics |
| GET | `/api/v1/stats/me/seasonal` | Current season stats |
| GET | `/api/v1/stats/me/matches` | Recent match history |
| GET | `/api/v1/stats/me/trends` | Performance trends |
| GET | `/api/v1/stats/{user_id}` | Public statistics |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time (p95) | <200ms | API metrics |
| Database Query Time | <100ms | Query timing |
| Cache Hit Rate | >90% | Redis metrics |
| Service Availability | 99.9% | Uptime monitoring |
| Authentication Success Rate | >99% | Auth metrics |
| File Upload Success Rate | >99% | Storage metrics |
| Event Processing Latency | <1s | Pub/Sub metrics |
| Migration Downtime | 0 | Deployment metrics |

---

## Out of Scope (Future Phases)

- **Currency System**: In-game coins and premium currency (Phase 2)
- **Payment Processing**: Stripe/PayPal integration (Phase 2)
- **Gacha/Loot Boxes**: Random cosmetic rewards (Not planned - bad for esports)
- **Seasonal Challenges**: Daily/weekly challenges for XP (Phase 2)
- **Achievements/Badges**: Achievement system (Phase 2)
- **Tournaments**: Organized competitive events (Phase 3)
- **Clans/Teams**: Group features (Phase 3)
- **Spectator Mode**: Watch live matches (Phase 3)
- **Replay System**: Full match replays (Phase 3)
- **Mobile App**: Native iOS/Android (Phase 4)

---

*Document Version: 1.0*
*Created: December 2024*

