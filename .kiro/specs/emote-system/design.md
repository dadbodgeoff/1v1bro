# Design Document: Emote System

## Overview

This design adds 8 emote cosmetics to the Battle Pass Season 1 reward track. The emotes are stored as JPEG files in Supabase Storage and require runtime background removal processing. The implementation updates the existing `seed_battlepass_season1.py` script to include emotes in the cosmetics catalog and distribute them across battle pass tiers.

## Architecture

The emote system integrates with existing infrastructure:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase Storage                            │
│  cosmetics/emotes/                                              │
│  ├── abyssal terror.jpg                                         │
│  ├── crown flex.jpg                                             │
│  ├── cyber glitch.jpg                                           │
│  ├── ethereal bloom.jpg                                         │
│  ├── fire dragon.jpg                                            │
│  ├── frost sparkle.jpg                                          │
│  ├── lava burst.jpg                                             │
│  └── void laugh.jpg                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Seed Script)                        │
│  scripts/seed_battlepass_season1.py                             │
│  - Creates emote entries in cosmetics_catalog                   │
│  - Assigns emotes to random tiers (fixed seed)                  │
│  - Preserves existing skin/playercard distribution              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database (Supabase)                          │
│  cosmetics_catalog table                                        │
│  - type: "emote"                                                │
│  - image_url: storage URL                                       │
│  battlepass_tiers table                                         │
│  - free_reward / premium_reward: {type: "cosmetic", value: id}  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Display)                           │
│  DynamicAssetLoader.ts                                          │
│  - Loads emote images from storage URLs                         │
│  - Detects JPG format, triggers background removal              │
│  ImageProcessor.ts                                              │
│  - removeBackground() with 'auto' mode                          │
│  - Removes checkered/white backgrounds                          │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Emote Data Definition

New constant in `seed_battlepass_season1.py`:

```python
BATTLEPASS_EMOTES = [
    {
        "name": "Abyssal Terror",
        "type": "emote",
        "rarity": "rare",
        "description": "Unleash the terror of the deep.",
        "image_url": storage_url("cosmetics", "emotes/abyssal terror.jpg"),
        "price_coins": 0,
        "is_featured": False,
        "sort_order": 300,
    },
    # ... 7 more emotes
]
```

### 2. Tier Distribution Logic

The seed script will:
1. Define reserved tiers for skins: `{1, 8, 15, 22, 29, 35}`
2. Define reserved tiers for player cards: `{2, 9, 16, 23, 30, 34}`
3. Calculate available tiers: `set(range(1, 36)) - skin_tiers - playercard_tiers`
4. Use `random.seed(42)` for reproducibility
5. Select 8 random tiers from available tiers for emotes
6. Assign remaining tiers to static rewards (coins, XP boosts)

### 3. Frontend Image Processing

The existing `DynamicAssetLoader.ts` already handles JPEG background removal:

```typescript
// In createFrameFromImage()
if (shouldRemoveBackground(sourceUrl)) {
  return removeBackground(img, 'auto')
}

// shouldRemoveBackground() returns true for .jpg/.jpeg
```

The `ImageProcessor.ts` `removeBackground()` function with 'auto' mode removes:
- Checkered gray backgrounds (RGB 30-210 where R≈G≈B)
- White/light backgrounds (RGB > 240)
- Yellow backgrounds
- Dark backgrounds

## Data Models

### Cosmetic Entry (Emote)

```typescript
interface EmoteCosmetic {
  id: string           // UUID
  name: string         // "Abyssal Terror"
  type: "emote"        // CosmeticType.EMOTE
  rarity: Rarity       // "rare" | "epic" | "legendary"
  description: string  // Flavor text
  image_url: string    // Supabase storage URL
  price_coins: number  // 0 for battle pass rewards
  is_featured: boolean // false
  sort_order: number   // 300-307 for emotes
}
```

### Battle Pass Tier Reward

```typescript
interface TierReward {
  type: "cosmetic" | "coins" | "xp_boost"
  value: string | number  // cosmetic_id or coin amount
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Emote Data Validity

*For any* emote created by the seed script, the emote SHALL have:
- type field equal to "emote"
- rarity field in valid set {"common", "uncommon", "rare", "epic", "legendary"}
- image_url matching pattern `{SUPABASE_URL}/storage/v1/object/public/cosmetics/emotes/{filename}.jpg`
- non-empty name and description

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Emote Tier Non-Overlap

*For any* tier assigned to an emote, that tier SHALL NOT be in the reserved set {1, 2, 8, 9, 15, 16, 22, 23, 29, 30, 34, 35} (skin and playercard tiers).

**Validates: Requirements 2.1**

### Property 3: Tier Distribution Invariant

*For any* completed seed operation, the battle pass SHALL have exactly:
- 6 skin rewards (at tiers 1, 8, 15, 22, 29, 35)
- 6 playercard rewards (at tiers 2, 9, 16, 23, 30, 34)
- 8 emote rewards (at 8 distinct non-reserved tiers)
- 15 static rewards (coins, XP boosts, or empty)
- Total: 35 tiers

**Validates: Requirements 2.2, 2.3, 2.4, 2.5**

### Property 4: Reproducible Tier Selection

*For any* two executions of the tier selection algorithm with the same seed value, the resulting emote tier assignments SHALL be identical.

**Validates: Requirements 5.1**

### Property 5: Background Removal Pixel Processing

*For any* pixel in a processed emote image:
- If the original pixel was gray (R≈G≈B within tolerance 20) with values 30-210, the alpha SHALL be 0 (transparent)
- If the original pixel was white/light (R,G,B > 240), the alpha SHALL be 0 (transparent)
- Otherwise, the alpha SHALL be preserved from the original

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 6: Emote Type Display

*For any* emote cosmetic retrieved from the database, the type field SHALL equal "emote" when displayed in UI components.

**Validates: Requirements 3.2**

## Error Handling

### Seed Script Errors

| Error | Handling |
|-------|----------|
| Emote already exists | Update existing entry (upsert) |
| Database connection failure | Exit with error code, log message |
| Invalid image URL | Log warning, continue with other emotes |
| Tier assignment conflict | Fail fast, report conflicting tier |

### Frontend Image Loading Errors

| Error | Handling |
|-------|----------|
| Image load failure | Retry with exponential backoff (3 attempts) |
| CORS error | Log error, show placeholder |
| Processing failure | Return original image without transparency |

## Testing Strategy

### Property-Based Testing

The implementation will use **Hypothesis** (Python) for backend property tests and **fast-check** (TypeScript) for frontend property tests.

Each property-based test will:
- Run a minimum of 100 iterations
- Be tagged with the property it validates using format: `**Feature: emote-system, Property {number}: {property_text}**`

### Unit Tests

Unit tests will cover:
- Emote data structure validation
- URL construction helper function
- Tier selection algorithm with edge cases

### Test Files

| Component | Test File | Framework |
|-----------|-----------|-----------|
| Seed script emote creation | `backend/tests/property/test_emote_system.py` | Hypothesis |
| Tier distribution | `backend/tests/property/test_emote_system.py` | Hypothesis |
| Image processing | `frontend/src/game/assets/ImageProcessor.test.ts` | fast-check |

### Existing Test Coverage

The following existing tests already cover related functionality:
- `ImageProcessor.ts` background removal (via `SpriteSheetProcessor.test.ts`)
- `DynamicAssetLoader.ts` image loading and caching
- Battle pass tier structure validation

## Implementation Notes

### Emote File Names (from Supabase bucket)

1. `abyssal terror.jpg`
2. `crown flex.jpg`
3. `cyber glitch.jpg`
4. `ethereal bloom.jpg`
5. `fire dragon.jpg`
6. `frost sparkle.jpg`
7. `lava burst.jpg`
8. `void laugh.jpg`

### Rarity Distribution

| Emote | Rarity | Rationale |
|-------|--------|-----------|
| Frost Sparkle | rare | Basic elemental effect |
| Crown Flex | rare | Simple celebration |
| Cyber Glitch | rare | Tech-themed |
| Ethereal Bloom | epic | Mystical/magical theme |
| Fire Dragon | epic | Powerful elemental |
| Lava Burst | epic | Volcanic power |
| Abyssal Terror | epic | Deep sea theme (matches Abyssal Leviathan skin) |
| Void Laugh | legendary | Matches Void Sovereign skin, premium feel |

### Fixed Seed Value

The seed script will use `random.seed(42)` for reproducible tier selection. This ensures all players see the same battle pass structure.
