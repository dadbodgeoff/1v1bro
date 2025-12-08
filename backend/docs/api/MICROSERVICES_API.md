# User Services & Microservices API Documentation

This document provides comprehensive API documentation for the 1v1bro microservices architecture.

## Base URL

```
Production: https://api.1v1bro.com/api/v1
Development: http://localhost:8000/api/v1
```

## Authentication

All endpoints require JWT authentication unless otherwise noted.

```
Authorization: Bearer <jwt_token>
```

### Token Structure (RS256)

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "exp": 1735689600,
  "iat": 1735603200
}
```

---

## Profile Service

### GET /profiles/me

Get the current user's profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "display_name": "PlayerOne",
    "bio": "Trivia champion",
    "avatar_url": "https://cdn.1v1bro.com/avatars/uuid/256.webp",
    "banner_url": "https://cdn.1v1bro.com/banners/uuid/1920x540.webp",
    "banner_color": "#1a1a2e",
    "level": 15,
    "total_xp": 22500,
    "title": "Quiz Master",
    "country": "US",
    "social_links": {
      "twitch": "https://twitch.tv/playerone",
      "youtube": null,
      "twitter": null
    },
    "is_public": true,
    "accept_friend_requests": true,
    "allow_messages": true
  }
}
```

### PUT /profiles/me

Update profile fields.

**Request:**
```json
{
  "display_name": "NewName",
  "bio": "Updated bio",
  "country": "CA",
  "banner_color": "#2a2a3e",
  "social_links": {
    "twitch": "https://twitch.tv/newname"
  }
}
```

### GET /profiles/{user_id}

Get another user's profile (privacy filtered).

### PUT /profiles/me/privacy

Update privacy settings.

**Request:**
```json
{
  "is_public": true,
  "accept_friend_requests": true,
  "allow_messages": false
}
```

### POST /profiles/me/avatar/upload-url

Get signed URL for avatar upload.

**Query Parameters:**
- `content_type`: image/jpeg, image/png, or image/webp

**Response:**
```json
{
  "success": true,
  "data": {
    "upload_url": "https://storage.googleapis.com/...",
    "storage_path": "avatars/uuid/original.jpg",
    "expires_at": "2024-01-01T00:05:00Z"
  }
}
```

### POST /profiles/me/avatar/confirm

Confirm avatar upload and trigger processing.

**Request:**
```json
{
  "storage_path": "avatars/uuid/original.jpg"
}
```

---

## Cosmetics Service

### GET /cosmetics/shop

Get all available cosmetics.

**Query Parameters:**
- `type`: skin, emote, banner, nameplate, effect, trail
- `rarity`: common, uncommon, rare, epic, legendary
- `event`: Event name filter
- `is_limited`: true/false
- `min_price`: Minimum coin price
- `max_price`: Maximum coin price
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cosmetic-uuid",
        "name": "Neon Glow",
        "type": "skin",
        "rarity": "epic",
        "description": "A vibrant neon skin",
        "image_url": "https://cdn.1v1bro.com/cosmetics/neon-glow.webp",
        "price_coins": 1500,
        "is_limited": false,
        "owned_by_count": 1234
      }
    ],
    "total": 150,
    "page": 1,
    "page_size": 20
  }
}
```

### GET /cosmetics/shop/{type}

Get cosmetics filtered by type.

### GET /cosmetics/{cosmetic_id}

Get single cosmetic details.

### GET /cosmetics/me/inventory

Get user's owned cosmetics.

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "inventory-uuid",
        "cosmetic": {
          "id": "cosmetic-uuid",
          "name": "Neon Glow",
          "type": "skin",
          "rarity": "epic"
        },
        "acquired_date": "2024-01-01T00:00:00Z",
        "is_equipped": true
      }
    ],
    "total": 25
  }
}
```

### POST /cosmetics/{cosmetic_id}/purchase

Purchase a cosmetic.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "inventory-uuid",
    "cosmetic_id": "cosmetic-uuid",
    "acquired_date": "2024-01-01T00:00:00Z",
    "is_equipped": false
  }
}
```

### POST /cosmetics/{cosmetic_id}/equip

Equip a cosmetic to loadout.

### GET /cosmetics/me/equipped

Get current loadout.

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "user-uuid",
    "skin_equipped": "cosmetic-uuid-1",
    "emote_equipped": "cosmetic-uuid-2",
    "banner_equipped": null,
    "nameplate_equipped": null,
    "effect_equipped": "cosmetic-uuid-3"
  }
}
```

### POST /cosmetics/me/unequip

Unequip from a slot.

**Request:**
```json
{
  "slot": "skin"
}
```

---

## Battle Pass Service

### GET /battlepass/current

Get current active season.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "season-uuid",
    "season_number": 1,
    "name": "Season 1: Origins",
    "theme": "Cyber Neon",
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-03-31T23:59:59Z",
    "is_active": true,
    "xp_per_tier": 1000
  }
}
```

### GET /battlepass/season/{season_id}

Get season with all tier rewards.

### GET /battlepass/tiers/{season_id}

Get tier rewards for a season.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "tier_number": 1,
      "free_reward": {
        "type": "coins",
        "value": 100
      },
      "premium_reward": {
        "type": "cosmetic",
        "cosmetic_id": "cosmetic-uuid"
      }
    }
  ]
}
```

### GET /battlepass/me

Get user's battle pass progress.

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "user-uuid",
    "season_id": "season-uuid",
    "current_tier": 15,
    "current_xp": 750,
    "is_premium": true,
    "claimed_rewards": [1, 2, 3, 4, 5],
    "claimable_tiers": [6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
  }
}
```

### POST /battlepass/me/claim-reward

Claim a tier reward.

**Request:**
```json
{
  "tier": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tier": 10,
    "free_reward_claimed": true,
    "premium_reward_claimed": true,
    "rewards": [
      {"type": "coins", "value": 200},
      {"type": "cosmetic", "cosmetic_id": "uuid"}
    ]
  }
}
```

### POST /battlepass/me/purchase-premium

Upgrade to premium battle pass.

---

## Leaderboard Service (ELO)

### GET /leaderboards/elo/global

Get global ELO leaderboard.

**Query Parameters:**
- `limit`: Max entries (1-100, default: 100)
- `offset`: Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "rank": 1,
        "user_id": "user-uuid",
        "display_name": "TopPlayer",
        "avatar_url": "https://...",
        "current_elo": 2850,
        "peak_elo": 2900,
        "tier": "Grandmaster",
        "win_rate": 0.78
      }
    ],
    "total": 10000
  }
}
```

### GET /leaderboards/elo/regional/{region}

Get regional ELO leaderboard.

**Path Parameters:**
- `region`: 2-letter country code (US, GB, DE, etc.)

### GET /leaderboards/elo/me

Get current user's ELO rank with nearby players.

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "user-uuid",
    "rank": 1234,
    "current_elo": 1650,
    "peak_elo": 1720,
    "tier": "Platinum",
    "win_rate": 0.55,
    "nearby_players": [
      {"rank": 1229, "display_name": "Player1", "elo": 1655},
      {"rank": 1230, "display_name": "Player2", "elo": 1653},
      {"rank": 1234, "display_name": "You", "elo": 1650},
      {"rank": 1235, "display_name": "Player3", "elo": 1648}
    ]
  }
}
```

---

## ELO Rank Tiers

| Tier | ELO Range | Icon |
|------|-----------|------|
| Bronze | 100-799 | 🥉 |
| Silver | 800-1199 | 🥈 |
| Gold | 1200-1599 | 🥇 |
| Platinum | 1600-1999 | 💎 |
| Diamond | 2000-2399 | 💠 |
| Master | 2400-2799 | 👑 |
| Grandmaster | 2800-3000 | 🏆 |

---

## XP Calculation Formula

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

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing JWT token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `VALIDATION_ERROR` | 422 | Invalid request data |

---

## Rate Limits

| Endpoint Category | Limit |
|-------------------|-------|
| Auth endpoints | 10/min |
| Game endpoints | 1000/min |
| Leaderboard endpoints | 100/min |
| Upload endpoints | 10/min |

Rate limit headers:
- `X-RateLimit-Limit`: Max requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Cache TTLs

| Data | TTL |
|------|-----|
| Session tokens | Token expiration |
| Leaderboards | 5 minutes |
| Cosmetics catalog | 24 hours |
| Player inventory | 5 minutes |
| Rate limit counters | 60 seconds |
