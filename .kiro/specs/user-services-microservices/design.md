# User Services & Microservices Architecture - Design Document

## Overview

This document outlines the technical design for transitioning the 1v1bro backend from a monolithic architecture to a service-oriented architecture with dedicated user services. The design follows enterprise patterns established in the codebase with clear separation of concerns.

The implementation introduces six new services while preserving the existing game core (60Hz tick system, WebSocket sync, lobby management). Each service owns its data and communicates via REST APIs and Pub/Sub events.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    Clients                                           │
│                    (Web Browser, Mobile App, Game Client)                           │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              API Gateway (FastAPI)                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ JWT Verify  │ │ Rate Limit  │ │   CORS      │ │  Logging    │ │  Routing    │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
          │              │              │              │              │
          ▼              ▼              ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│    Auth     │ │   Profile   │ │  Cosmetics  │ │ BattlePass  │ │ Leaderboard │
│   Service   │ │   Service   │ │   Service   │ │   Service   │ │   Service   │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
          │              │              │              │              │
          └──────────────┴──────────────┴──────────────┴──────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
          ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
          │   PostgreSQL    │ │     Redis       │ │  Cloud Storage  │
          │   (Supabase)    │ │    (Cache)      │ │   (Media)       │
          └─────────────────┘ └─────────────────┘ └─────────────────┘
                                        │
                                        ▼
                              ┌─────────────────┐
                              │   Pub/Sub       │
                              │   (Events)      │
                              └─────────────────┘
                                        │
          ┌─────────────────────────────┼─────────────────────────────┐
          ▼                             ▼                             ▼
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│  Statistics     │           │  Game Service   │           │  Notification   │
│  Service        │           │  (Existing)     │           │  Service        │
└─────────────────┘           └─────────────────┘           └─────────────────┘
```

## Project Structure

```
backend/
├── app/
│   ├── api/v1/
│   │   ├── auth.py                    # Enhanced auth endpoints
│   │   ├── profiles.py                # Profile endpoints (NEW)
│   │   ├── cosmetics.py               # Cosmetics endpoints (NEW)
│   │   ├── battlepass.py              # Battle pass endpoints (NEW)
│   │   ├── leaderboards.py            # Enhanced leaderboards
│   │   └── stats.py                   # Enhanced statistics
│   │
│   ├── schemas/
│   │   ├── auth.py                    # Enhanced auth schemas
│   │   ├── profile.py                 # Profile schemas (NEW)
│   │   ├── cosmetic.py                # Cosmetic schemas (NEW)
│   │   ├── battlepass.py              # Battle pass schemas (NEW)
│   │   ├── leaderboard.py             # Enhanced leaderboard schemas
│   │   └── stats.py                   # Enhanced stats schemas
│   │
│   ├── services/
│   │   ├── auth_service.py            # Enhanced auth service
│   │   ├── profile_service.py         # Profile service (NEW)
│   │   ├── cosmetics_service.py       # Cosmetics service (NEW)
│   │   ├── battlepass_service.py      # Battle pass service (NEW)
│   │   ├── leaderboard_service.py     # Enhanced leaderboard service
│   │   ├── stats_service.py           # Enhanced stats service
│   │   └── storage_service.py         # Cloud storage service (NEW)
│   │
│   ├── database/
│   │   ├── repositories/
│   │   │   ├── profile_repo.py        # Profile repository (NEW)
│   │   │   ├── cosmetics_repo.py      # Cosmetics repository (NEW)
│   │   │   ├── battlepass_repo.py     # Battle pass repository (NEW)
│   │   │   ├── ratings_repo.py        # ELO ratings repository (NEW)
│   │   │   └── match_results_repo.py  # Match results repository (NEW)
│   │   │
│   │   └── migrations/
│   │       ├── 006_profiles_extended.sql
│   │       ├── 007_cosmetics.sql
│   │       ├── 008_battlepass.sql
│   │       └── 009_elo_ratings.sql
│   │
│   ├── events/
│   │   ├── __init__.py
│   │   ├── publisher.py               # Pub/Sub publisher (NEW)
│   │   ├── subscriber.py              # Pub/Sub subscriber (NEW)
│   │   └── handlers.py                # Event handlers (NEW)
│   │
│   ├── cache/
│   │   ├── __init__.py
│   │   ├── redis_client.py            # Redis connection (NEW)
│   │   └── cache_manager.py           # Cache operations (NEW)
│   │
│   └── middleware/
│       ├── auth.py                    # Enhanced JWT validation
│       └── rate_limit.py              # Enhanced rate limiting
│
└── tests/
    ├── property/
    │   ├── test_auth_enhanced.py
    │   ├── test_profiles.py
    │   ├── test_cosmetics.py
    │   ├── test_battlepass.py
    │   ├── test_elo.py
    │   └── test_cache.py
    │
    └── integration/
        ├── test_profile_flow.py
        ├── test_cosmetics_flow.py
        └── test_battlepass_flow.py
```



## Components and Interfaces

### 1. Enhanced Authentication Service

```python
class AuthService(BaseService):
    """Enhanced authentication with RS256 JWT and rate limiting."""
    
    async def register(self, email: str, password: str, display_name: str) -> Tuple[str, dict]:
        """Register new user with bcrypt hashing (cost 12)."""
        
    async def login(self, email: str, password: str, totp_code: Optional[str] = None) -> Tuple[str, dict]:
        """Login with optional 2FA verification."""
        
    async def refresh_token(self, refresh_token: str) -> str:
        """Generate new access token from refresh token."""
        
    async def logout(self, user_id: str, token: str) -> bool:
        """Invalidate session and blacklist token."""
        
    async def validate_token(self, token: str) -> TokenPayload:
        """Verify RS256 signature and check expiration."""
        
    async def enable_2fa(self, user_id: str) -> TwoFactorSetup:
        """Generate TOTP secret and QR code."""
        
    async def verify_2fa(self, user_id: str, code: str) -> bool:
        """Verify TOTP code and enable 2FA."""
        
    async def initiate_password_reset(self, email: str) -> bool:
        """Send password reset email with time-limited token."""
        
    async def complete_password_reset(self, token: str, new_password: str) -> bool:
        """Reset password using valid reset token."""
```

### 2. Profile Service

```python
class ProfileService(BaseService):
    """Service for user profile management."""
    
    def __init__(self, client: Client, storage: StorageService, cache: CacheManager):
        self.profile_repo = ProfileRepository(client)
        self.storage = storage
        self.cache = cache
    
    async def get_profile(self, user_id: str, viewer_id: Optional[str] = None) -> Profile:
        """Get profile with privacy filtering for viewers."""
        
    async def update_profile(self, user_id: str, updates: ProfileUpdate) -> Profile:
        """Update profile fields with validation."""
        
    async def get_avatar_upload_url(self, user_id: str) -> SignedUploadUrl:
        """Generate signed URL for avatar upload."""
        
    async def confirm_avatar_upload(self, user_id: str, storage_path: str) -> str:
        """Confirm upload and trigger resize processing."""
        
    async def get_banner_upload_url(self, user_id: str) -> SignedUploadUrl:
        """Generate signed URL for banner upload."""
        
    async def confirm_banner_upload(self, user_id: str, storage_path: str) -> str:
        """Confirm upload and trigger resize processing."""
        
    async def update_privacy_settings(self, user_id: str, settings: PrivacySettings) -> Profile:
        """Update profile privacy settings."""
        
    def compute_level(self, total_xp: int) -> int:
        """Compute level from XP: level = floor(sqrt(total_xp / 100))."""
```

### 3. Cosmetics Service

```python
class CosmeticsService(BaseService):
    """Service for cosmetics and inventory management."""
    
    def __init__(self, client: Client, cache: CacheManager):
        self.cosmetics_repo = CosmeticsRepository(client)
        self.cache = cache
    
    async def get_shop(self, filters: Optional[ShopFilters] = None) -> List[Cosmetic]:
        """Get available cosmetics with optional filtering."""
        
    async def get_cosmetic(self, cosmetic_id: str) -> Cosmetic:
        """Get single cosmetic details."""
        
    async def get_inventory(self, user_id: str) -> List[InventoryItem]:
        """Get user's owned cosmetics."""
        
    async def purchase_cosmetic(self, user_id: str, cosmetic_id: str) -> InventoryItem:
        """Purchase cosmetic and add to inventory."""
        
    async def equip_cosmetic(self, user_id: str, cosmetic_id: str) -> Loadout:
        """Equip cosmetic to appropriate loadout slot."""
        
    async def unequip_cosmetic(self, user_id: str, slot: CosmeticType) -> Loadout:
        """Unequip cosmetic from slot."""
        
    async def get_loadout(self, user_id: str) -> Loadout:
        """Get currently equipped cosmetics."""
        
    async def _invalidate_inventory_cache(self, user_id: str) -> None:
        """Invalidate inventory cache on changes."""
```

### 4. Battle Pass Service

```python
class BattlePassService(BaseService):
    """Service for battle pass progression."""
    
    def __init__(self, client: Client, cosmetics_service: CosmeticsService):
        self.battlepass_repo = BattlePassRepository(client)
        self.cosmetics_service = cosmetics_service
    
    async def get_current_season(self) -> Season:
        """Get active season info."""
        
    async def get_player_progress(self, user_id: str) -> PlayerBattlePass:
        """Get player's battle pass progress."""
        
    async def award_xp(self, user_id: str, amount: int, source: XPSource, match_id: Optional[str] = None) -> XPAwardResult:
        """Award XP and handle tier advancement."""
        
    async def claim_reward(self, user_id: str, tier: int) -> ClaimResult:
        """Claim reward for completed tier."""
        
    async def purchase_premium(self, user_id: str) -> PlayerBattlePass:
        """Upgrade to premium battle pass."""
        
    async def get_tier_rewards(self, season_id: str) -> List[BattlePassTier]:
        """Get all tier rewards for a season."""
        
    def calculate_match_xp(self, won: bool, kills: int, streak: int, duration_seconds: int) -> int:
        """Calculate XP from match: Win=100, Loss=50, +5/kill, +10/streak, +0.1/sec. Clamped [50, 300]."""
```

### 5. Enhanced Leaderboard Service

```python
class LeaderboardService(BaseService):
    """Service for ELO ratings and leaderboards."""
    
    # K-Factor by rating
    K_FACTORS = {
        (0, 2000): 32,
        (2000, 2400): 24,
        (2400, 3001): 16,
    }
    
    # Rank tiers
    TIERS = {
        (100, 800): "Bronze",
        (800, 1200): "Silver",
        (1200, 1600): "Gold",
        (1600, 2000): "Platinum",
        (2000, 2400): "Diamond",
        (2400, 2800): "Master",
        (2800, 3001): "Grandmaster",
    }
    
    def __init__(self, client: Client, cache: CacheManager):
        self.ratings_repo = RatingsRepository(client)
        self.results_repo = MatchResultsRepository(client)
        self.cache = cache
    
    async def get_global_leaderboard(self, limit: int = 100, offset: int = 0) -> LeaderboardResponse:
        """Get global leaderboard sorted by ELO."""
        
    async def get_regional_leaderboard(self, region: str, limit: int = 100) -> LeaderboardResponse:
        """Get regional leaderboard filtered by country."""
        
    async def get_user_rank(self, user_id: str) -> UserRankResponse:
        """Get user's rank with nearby players."""
        
    async def calculate_elo_change(self, player1_elo: int, player2_elo: int, player1_won: bool) -> Tuple[int, int]:
        """Calculate ELO changes using standard formula."""
        
    async def update_ratings(self, match_id: str, player1_id: str, player2_id: str, winner_id: str) -> MatchResult:
        """Update both players' ratings after match."""
        
    def get_tier(self, elo: int) -> str:
        """Get rank tier for ELO value."""
        
    def _clamp_elo(self, elo: int) -> int:
        """Clamp ELO to [100, 3000]."""
```

### 6. Storage Service

```python
class StorageService:
    """Service for Cloud Storage operations."""
    
    AVATAR_BUCKET = "1v1bro-user-media"
    AVATAR_PREFIX = "avatars/"
    BANNER_PREFIX = "banners/"
    
    AVATAR_SIZES = [(128, 128), (256, 256), (512, 512)]
    BANNER_SIZES = [(960, 270), (1920, 540)]
    
    def __init__(self, project_id: str):
        self.client = storage.Client(project=project_id)
        self.bucket = self.client.bucket(self.AVATAR_BUCKET)
    
    def generate_signed_upload_url(self, path: str, content_type: str, expiration_minutes: int = 5) -> str:
        """Generate signed URL for direct upload."""
        
    async def process_avatar(self, source_path: str, user_id: str) -> List[str]:
        """Resize avatar to standard sizes."""
        
    async def process_banner(self, source_path: str, user_id: str) -> List[str]:
        """Resize banner to standard sizes."""
        
    def get_cdn_url(self, path: str) -> str:
        """Get CDN URL for serving file."""
        
    async def delete_old_versions(self, prefix: str, keep_latest: int = 1) -> int:
        """Delete old file versions."""
```

### 7. Cache Manager

```python
class CacheManager:
    """Redis cache operations with consistent key naming."""
    
    def __init__(self, redis_url: str):
        self.redis = aioredis.from_url(redis_url)
    
    async def get(self, key: str) -> Optional[str]:
        """Get cached value."""
        
    async def set(self, key: str, value: str, ttl_seconds: int) -> None:
        """Set cached value with TTL."""
        
    async def delete(self, key: str) -> None:
        """Delete cached value."""
        
    async def get_json(self, key: str) -> Optional[dict]:
        """Get and deserialize JSON value."""
        
    async def set_json(self, key: str, value: dict, ttl_seconds: int) -> None:
        """Serialize and set JSON value."""
        
    # Leaderboard operations (sorted sets)
    async def zadd(self, key: str, score: float, member: str) -> None:
        """Add to sorted set."""
        
    async def zrange(self, key: str, start: int, stop: int, withscores: bool = False) -> List:
        """Get range from sorted set."""
        
    async def zrank(self, key: str, member: str) -> Optional[int]:
        """Get rank in sorted set."""
    
    # Key naming helpers
    @staticmethod
    def key(service: str, entity: str, id: str) -> str:
        """Generate consistent cache key: {service}:{entity}:{id}."""
```

### 8. Event Publisher/Subscriber

```python
class EventPublisher:
    """Pub/Sub event publisher."""
    
    TOPICS = {
        "match_completed": "match-completed",
        "cosmetic_purchased": "cosmetic-purchased",
        "reward_earned": "reward-earned",
        "player_levelup": "player-levelup",
    }
    
    def __init__(self, project_id: str):
        self.publisher = pubsub_v1.PublisherClient()
        self.project_id = project_id
    
    async def publish(self, topic: str, data: dict) -> str:
        """Publish event to topic."""
        
    async def publish_match_completed(self, match_data: MatchCompletedEvent) -> str:
        """Publish match.completed event."""
        
    async def publish_cosmetic_purchased(self, purchase_data: CosmeticPurchasedEvent) -> str:
        """Publish player.cosmetic_purchased event."""


class EventSubscriber:
    """Pub/Sub event subscriber with handlers."""
    
    def __init__(self, project_id: str, handlers: Dict[str, Callable]):
        self.subscriber = pubsub_v1.SubscriberClient()
        self.project_id = project_id
        self.handlers = handlers
    
    async def start(self) -> None:
        """Start listening to subscriptions."""
        
    async def handle_message(self, message: Message) -> None:
        """Route message to appropriate handler."""
```



## Data Models

### Profile Schemas

```python
class ProfileUpdate(BaseSchema):
    """Request to update profile."""
    display_name: Optional[str] = Field(None, min_length=3, max_length=50)
    bio: Optional[str] = Field(None, max_length=200)
    country: Optional[str] = Field(None, pattern=r"^[A-Z]{2}$")
    social_links: Optional[SocialLinks] = None

class SocialLinks(BaseSchema):
    """Social media links."""
    twitch: Optional[HttpUrl] = None
    youtube: Optional[HttpUrl] = None
    twitter: Optional[HttpUrl] = None

class PrivacySettings(BaseSchema):
    """Profile privacy settings."""
    is_public: bool = True
    accept_friend_requests: bool = True
    allow_messages: bool = True

class Profile(BaseSchema):
    """Complete profile response."""
    user_id: str
    display_name: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]
    banner_url: Optional[str]
    banner_color: str = "#1a1a2e"
    level: int = 1
    total_xp: int = 0
    title: str = "Rookie"
    country: Optional[str]
    social_links: SocialLinks
    is_public: bool
    created_at: datetime
    updated_at: datetime

class SignedUploadUrl(BaseSchema):
    """Signed URL for file upload."""
    upload_url: str
    expires_at: datetime
    max_size_bytes: int
    allowed_types: List[str]
```

### Cosmetic Schemas

```python
class CosmeticType(str, Enum):
    SKIN = "skin"
    EMOTE = "emote"
    BANNER = "banner"
    NAMEPLATE = "nameplate"
    EFFECT = "effect"
    TRAIL = "trail"

class Rarity(str, Enum):
    COMMON = "common"
    UNCOMMON = "uncommon"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"

class Cosmetic(BaseSchema):
    """Cosmetic item definition."""
    id: str
    name: str
    type: CosmeticType
    rarity: Rarity
    description: Optional[str]
    image_url: str
    preview_video_url: Optional[str]
    price_coins: int
    price_premium: Optional[int]
    release_date: datetime
    event: Optional[str]
    is_limited: bool = False
    owned_by_count: int = 0

class InventoryItem(BaseSchema):
    """Item in player inventory."""
    id: str
    cosmetic: Cosmetic
    acquired_date: datetime
    is_equipped: bool = False

class Loadout(BaseSchema):
    """Currently equipped cosmetics."""
    user_id: str
    skin_equipped: Optional[Cosmetic]
    emote_equipped: Optional[Cosmetic]
    banner_equipped: Optional[Cosmetic]
    nameplate_equipped: Optional[Cosmetic]
    effect_equipped: Optional[Cosmetic]
```

### Battle Pass Schemas

```python
class Season(BaseSchema):
    """Season definition."""
    id: str
    season_number: int
    name: str
    theme: Optional[str]
    start_date: datetime
    end_date: datetime
    is_active: bool
    xp_per_tier: int = 1000

class BattlePassTier(BaseSchema):
    """Single tier rewards."""
    tier_number: int
    free_reward: Optional[Reward]
    premium_reward: Optional[Reward]

class Reward(BaseSchema):
    """Reward definition."""
    type: str  # "cosmetic", "coins", "xp"
    value: Union[str, int]  # cosmetic_id or amount
    cosmetic: Optional[Cosmetic]  # Populated if type is cosmetic

class PlayerBattlePass(BaseSchema):
    """Player's battle pass progress."""
    user_id: str
    season: Season
    current_tier: int = 0
    current_xp: int = 0
    xp_to_next_tier: int
    is_premium: bool = False
    claimed_rewards: List[int] = []
    claimable_rewards: List[int] = []

class XPSource(str, Enum):
    MATCH_WIN = "match_win"
    MATCH_LOSS = "match_loss"
    SEASON_CHALLENGE = "season_challenge"
    DAILY_BONUS = "daily_bonus"

class XPAwardResult(BaseSchema):
    """Result of XP award."""
    xp_awarded: int
    new_total_xp: int
    new_tier: int
    tier_advanced: bool
    new_claimable_rewards: List[int]
```

### Leaderboard Schemas

```python
class RankTier(str, Enum):
    BRONZE = "Bronze"
    SILVER = "Silver"
    GOLD = "Gold"
    PLATINUM = "Platinum"
    DIAMOND = "Diamond"
    MASTER = "Master"
    GRANDMASTER = "Grandmaster"

class PlayerRating(BaseSchema):
    """Player's ELO rating."""
    user_id: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    current_elo: int = 1200
    peak_elo: int = 1200
    current_tier: RankTier = RankTier.GOLD
    tier_rank: Optional[int]
    win_rate: float = 0.0
    last_match_date: Optional[datetime]

class LeaderboardEntry(BaseSchema):
    """Single leaderboard entry."""
    rank: int
    user_id: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    elo: int
    tier: RankTier
    win_rate: float

class LeaderboardResponse(BaseSchema):
    """Leaderboard API response."""
    entries: List[LeaderboardEntry]
    total_players: int
    page: int
    page_size: int

class UserRankResponse(BaseSchema):
    """User's rank with context."""
    rank: int
    total_players: int
    rating: PlayerRating
    nearby_players: List[LeaderboardEntry]  # ±5 positions

class MatchResult(BaseSchema):
    """Match result for ELO calculation."""
    match_id: str
    player1_id: str
    player2_id: str
    winner_id: str
    player1_pre_elo: int
    player2_pre_elo: int
    player1_post_elo: int
    player2_post_elo: int
    elo_delta_p1: int
    elo_delta_p2: int
    played_at: datetime
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Password Hashing Security
*For any* password provided during registration, the stored hash SHALL be a valid bcrypt hash with cost factor 12 or higher, verifiable by the bcrypt library.
**Validates: Requirements 1.1, 12.3**

### Property 2: JWT Token Structure
*For any* JWT token generated by the Authentication_Service, decoding the token SHALL reveal a payload containing user_id, email, exp (expiration), and iat (issued at) claims, with algorithm header set to RS256.
**Validates: Requirements 1.2, 1.5**

### Property 3: Rate Limiting Enforcement
*For any* IP address making login requests, after 5 requests within 60 seconds, subsequent requests SHALL receive HTTP 429 response until the rate limit window resets.
**Validates: Requirements 1.3, 1.4**

### Property 4: Token Validation Correctness
*For any* valid JWT token, validation SHALL succeed. For any token with invalid signature, expired timestamp, or malformed structure, validation SHALL fail.
**Validates: Requirements 1.6**

### Property 5: Profile Field Validation
*For any* profile update request, bio length exceeding 200 characters SHALL be rejected, and display_name outside 3-50 characters SHALL be rejected.
**Validates: Requirements 2.2**

### Property 6: Cosmetic Type Validation
*For any* cosmetic item, the type field SHALL be one of: skin, emote, banner, nameplate, effect, trail. Any other value SHALL be rejected.
**Validates: Requirements 3.1**

### Property 7: Inventory Consistency
*For any* cosmetic purchase, the cosmetic SHALL appear in the user's inventory with acquired_date set to current timestamp, and the inventory count SHALL increase by exactly 1.
**Validates: Requirements 3.4, 3.5**

### Property 8: XP Calculation Bounds
*For any* match result, the calculated XP SHALL be within [50, 300] regardless of kills, streak, or duration values.
**Validates: Requirements 4.4**

### Property 9: Tier Advancement Correctness
*For any* XP award that causes total XP to exceed tier threshold (tier * xp_per_tier), the player's current_tier SHALL advance by exactly 1.
**Validates: Requirements 4.5**

### Property 10: ELO Zero-Sum
*For any* match result, the sum of ELO changes (elo_delta_p1 + elo_delta_p2) SHALL equal 0 (winner gains exactly what loser loses).
**Validates: Requirements 5.3**

### Property 11: ELO Bounds
*For any* ELO calculation, the resulting ELO SHALL be clamped to [100, 3000]. No player SHALL have ELO outside this range.
**Validates: Requirements 5.4**

### Property 12: Rank Tier Assignment
*For any* ELO value, the assigned rank tier SHALL match the defined ranges: Bronze (100-799), Silver (800-1199), Gold (1200-1599), Platinum (1600-1999), Diamond (2000-2399), Master (2400-2799), Grandmaster (2800-3000).
**Validates: Requirements 5.5**

### Property 13: Cache Invalidation
*For any* inventory modification (purchase or equip), the cached inventory SHALL be invalidated, and subsequent reads SHALL return fresh data from database.
**Validates: Requirements 3.8, 11.7**

### Property 14: Event Idempotency
*For any* event processed by a handler, processing the same event twice SHALL produce the same final state (idempotent handling).
**Validates: Requirements 8.9**

### Property 15: Migration Idempotency
*For any* migration script, running it multiple times SHALL not cause errors or duplicate data.
**Validates: Requirements 13.9**



## Error Handling

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| AUTH_INVALID_CREDENTIALS | 401 | Invalid email or password |
| AUTH_TOKEN_EXPIRED | 401 | JWT token has expired |
| AUTH_TOKEN_INVALID | 401 | JWT signature invalid or malformed |
| AUTH_RATE_LIMITED | 429 | Too many login attempts |
| AUTH_2FA_REQUIRED | 403 | 2FA code required but not provided |
| AUTH_2FA_INVALID | 403 | Invalid 2FA code |
| PROFILE_NOT_FOUND | 404 | Profile does not exist |
| PROFILE_PRIVATE | 403 | Profile is private and viewer is not owner |
| PROFILE_VALIDATION_ERROR | 400 | Invalid profile field values |
| COSMETIC_NOT_FOUND | 404 | Cosmetic does not exist |
| COSMETIC_ALREADY_OWNED | 409 | User already owns this cosmetic |
| COSMETIC_INSUFFICIENT_FUNDS | 402 | Not enough coins/premium currency |
| COSMETIC_NOT_OWNED | 403 | Cannot equip cosmetic not in inventory |
| BATTLEPASS_SEASON_INACTIVE | 400 | No active season |
| BATTLEPASS_TIER_NOT_REACHED | 400 | Cannot claim reward for unreached tier |
| BATTLEPASS_ALREADY_CLAIMED | 409 | Reward already claimed |
| BATTLEPASS_PREMIUM_REQUIRED | 403 | Premium reward requires premium pass |
| LEADERBOARD_USER_NOT_RANKED | 404 | User has no rating (no matches played) |
| UPLOAD_FILE_TOO_LARGE | 413 | File exceeds size limit |
| UPLOAD_INVALID_TYPE | 415 | File type not allowed |

## Testing Strategy

### Property-Based Testing (Hypothesis)

The following properties will be tested using the Hypothesis library with minimum 100 iterations per test:

1. **Password Hashing**: Generate random passwords, verify bcrypt format and cost factor
2. **JWT Structure**: Generate tokens, verify all required claims present
3. **Rate Limiting**: Simulate request sequences, verify 429 after threshold
4. **Profile Validation**: Generate strings of various lengths, verify validation
5. **Cosmetic Types**: Generate type values, verify enum validation
6. **XP Bounds**: Generate match results with extreme values, verify XP in [50, 300]
7. **ELO Zero-Sum**: Generate match results, verify delta sum equals 0
8. **ELO Bounds**: Generate extreme ELO scenarios, verify clamping
9. **Tier Assignment**: Generate ELO values, verify correct tier
10. **Cache Invalidation**: Simulate purchase/equip, verify cache cleared

### Unit Tests

- Service method logic
- Repository query correctness
- Schema validation
- Cache key generation
- Event serialization

### Integration Tests

- Full profile update flow with file upload
- Cosmetic purchase → inventory → equip flow
- Battle pass XP award → tier advance → claim reward flow
- Match completion → ELO update → leaderboard update flow
- Event publish → subscribe → handler flow

## Database Migrations

### 006_profiles_extended.sql

```sql
-- Extended profile fields
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS bio VARCHAR(200),
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS banner_color VARCHAR(7) DEFAULT '#1a1a2e',
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_xp BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS title VARCHAR(50) DEFAULT 'Rookie',
ADD COLUMN IF NOT EXISTS country VARCHAR(2),
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS accept_friend_requests BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_messages BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS theme VARCHAR(10) DEFAULT 'dark',
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(32);

CREATE INDEX IF NOT EXISTS idx_user_profiles_country ON user_profiles(country);
CREATE INDEX IF NOT EXISTS idx_user_profiles_level ON user_profiles(level DESC);
```

### 007_cosmetics.sql

```sql
-- Cosmetics catalog
CREATE TABLE IF NOT EXISTS cosmetics_catalog (
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
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    cosmetic_id UUID NOT NULL REFERENCES cosmetics_catalog(id),
    acquired_date TIMESTAMPTZ DEFAULT NOW(),
    is_equipped BOOLEAN DEFAULT false,
    UNIQUE(user_id, cosmetic_id)
);

-- Equipped loadout
CREATE TABLE IF NOT EXISTS loadouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    skin_equipped UUID REFERENCES cosmetics_catalog(id),
    emote_equipped UUID REFERENCES cosmetics_catalog(id),
    banner_equipped UUID REFERENCES cosmetics_catalog(id),
    nameplate_equipped UUID REFERENCES cosmetics_catalog(id),
    effect_equipped UUID REFERENCES cosmetics_catalog(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_cosmetics_type ON cosmetics_catalog(type);
CREATE INDEX IF NOT EXISTS idx_cosmetics_rarity ON cosmetics_catalog(rarity);
CREATE INDEX IF NOT EXISTS idx_cosmetics_event ON cosmetics_catalog(event) WHERE event IS NOT NULL;
```

### 008_battlepass.sql

```sql
-- Seasons
CREATE TABLE IF NOT EXISTS seasons (
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
CREATE TABLE IF NOT EXISTS battlepass_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    tier_number INTEGER NOT NULL,
    free_reward JSONB,
    premium_reward JSONB,
    UNIQUE(season_id, tier_number)
);

-- Player battle pass progress
CREATE TABLE IF NOT EXISTS player_battlepass (
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

-- XP logs
CREATE TABLE IF NOT EXISTS xp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    match_id UUID,
    challenge_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seasons_active ON seasons(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_player_battlepass_user ON player_battlepass(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_logs_user ON xp_logs(user_id, created_at DESC);
```

### 009_elo_ratings.sql

```sql
-- Player ELO ratings
CREATE TABLE IF NOT EXISTS player_ratings (
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

-- Match results for ELO history
CREATE TABLE IF NOT EXISTS match_results (
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

-- Initialize ratings for existing users
INSERT INTO player_ratings (user_id, current_elo, peak_elo, current_tier)
SELECT id, 1200, 1200, 'Gold'
FROM user_profiles
WHERE id NOT IN (SELECT user_id FROM player_ratings)
ON CONFLICT (user_id) DO NOTHING;

-- Backfill ELO from existing win/loss records
-- (Run as separate script after migration)

CREATE INDEX IF NOT EXISTS idx_player_ratings_elo ON player_ratings(current_elo DESC);
CREATE INDEX IF NOT EXISTS idx_player_ratings_tier ON player_ratings(current_tier);
CREATE INDEX IF NOT EXISTS idx_match_results_players ON match_results(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_match_results_date ON match_results(played_at DESC);
```

## Event Schemas

### match.completed

```json
{
  "event_type": "match.completed",
  "timestamp": "2024-12-05T10:30:00Z",
  "data": {
    "match_id": "uuid",
    "player1_id": "uuid",
    "player2_id": "uuid",
    "winner_id": "uuid",
    "player1_score": 8500,
    "player2_score": 7200,
    "duration_seconds": 180,
    "player1_kills": 5,
    "player2_kills": 3,
    "player1_streak": 2,
    "player2_streak": 0
  }
}
```

### player.cosmetic_purchased

```json
{
  "event_type": "player.cosmetic_purchased",
  "timestamp": "2024-12-05T10:30:00Z",
  "data": {
    "user_id": "uuid",
    "cosmetic_id": "uuid",
    "cosmetic_type": "skin",
    "price_paid": 500,
    "currency": "coins"
  }
}
```

### battlepass.reward_earned

```json
{
  "event_type": "battlepass.reward_earned",
  "timestamp": "2024-12-05T10:30:00Z",
  "data": {
    "user_id": "uuid",
    "season_id": "uuid",
    "tier_reached": 15,
    "reward_type": "cosmetic",
    "reward_value": "uuid"
  }
}
```

## File Size Targets

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
| profile_repo.py | <200 |
| cosmetics_repo.py | <200 |
| battlepass_repo.py | <250 |
| ratings_repo.py | <200 |
| schemas/profile.py | <150 |
| schemas/cosmetic.py | <150 |
| schemas/battlepass.py | <200 |
| api/v1/profiles.py | <150 |
| api/v1/cosmetics.py | <150 |
| api/v1/battlepass.py | <150 |
| 006_profiles_extended.sql | <50 |
| 007_cosmetics.sql | <80 |
| 008_battlepass.sql | <80 |
| 009_elo_ratings.sql | <80 |

---

*Document Version: 1.0*
*Created: December 2024*

