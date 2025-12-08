# Requirements Document

## Introduction

This feature adds 8 new emote cosmetics to the game and integrates them into the Battle Pass Season 1 reward track. The emotes will replace static rewards (coins, XP boosts) at randomly selected tiers while preserving all existing skin and player card rewards. The final battle pass will contain 20 cosmetic assets (6 skins + 6 player cards + 8 emotes) with 15 tiers remaining as static rewards (coins, double XP, etc.).

The emote assets are stored as JPEGs with checkered backgrounds that require transparency processing when displayed in the UI, following the same pattern used for sprite sheets in the existing codebase.

## Glossary

- **Emote**: A cosmetic item type that players can equip and use in-game for expression
- **Battle Pass**: A seasonal progression system with 35 tiers of rewards
- **Cosmetics Catalog**: The database table storing all cosmetic item definitions
- **Tier Reward**: A reward assigned to a specific battle pass tier (free or premium track)
- **Static Reward**: Non-cosmetic rewards like coins or XP boosts
- **Cosmetic Reward**: A reward that grants a cosmetic item (skin, player card, emote)
- **Checkered Background**: A gray/white checkered pattern used in image editing software to indicate transparency, which must be removed at display time

## Requirements

### Requirement 1

**User Story:** As a game administrator, I want to add 8 new emote cosmetics to the catalog, so that players can unlock and equip them.

#### Acceptance Criteria

1. WHEN the seed script runs THEN the System SHALL create 8 emote entries in the cosmetics_catalog table with correct metadata (name, type, rarity, image_url)
2. WHEN an emote is created THEN the System SHALL set the type field to "emote" and assign appropriate rarity values
3. WHEN an emote is created THEN the System SHALL construct the image_url using the Supabase storage path format: `{SUPABASE_URL}/storage/v1/object/public/cosmetics/emotes/{filename}`

### Requirement 2

**User Story:** As a game designer, I want to distribute the 8 emotes across random battle pass tiers, so that players have varied rewards throughout their progression.

#### Acceptance Criteria

1. WHEN assigning emotes to tiers THEN the System SHALL select 8 tiers from the available non-cosmetic tiers (excluding tiers 1, 2, 8, 9, 15, 16, 22, 23, 29, 30, 34, 35)
2. WHEN assigning emotes to tiers THEN the System SHALL preserve all existing skin rewards at tiers 1, 8, 15, 22, 29, 35
3. WHEN assigning emotes to tiers THEN the System SHALL preserve all existing player card rewards at tiers 2, 9, 16, 23, 30, 34
4. WHEN the seed script completes THEN the System SHALL have exactly 20 cosmetic rewards across the 35 tiers (6 skins + 6 player cards + 8 emotes)
5. WHEN the seed script completes THEN the System SHALL have exactly 15 tiers with static rewards (coins, XP boosts, or empty)

### Requirement 3

**User Story:** As a player, I want to see emotes displayed correctly in the battle pass UI, so that I know what rewards I can earn.

#### Acceptance Criteria

1. WHEN an emote reward is displayed THEN the System SHALL show the emote image from the storage URL
2. WHEN an emote reward is displayed THEN the System SHALL indicate the cosmetic type as "emote"
3. WHEN a player unlocks an emote tier THEN the System SHALL add the emote to the player's inventory

### Requirement 4

**User Story:** As a player, I want emote images to display with proper transparency, so that the checkered background from the source files is not visible.

#### Acceptance Criteria

1. WHEN an emote image is loaded from a JPEG source THEN the System SHALL process the image to remove checkered background patterns
2. WHEN processing the emote image THEN the System SHALL convert gray checkered pixels (RGB values 50-210 where R≈G≈B) to transparent
3. WHEN processing the emote image THEN the System SHALL also remove white/light background pixels (RGB > 245)
4. WHEN the emote is displayed in UI components THEN the System SHALL use the processed transparent version

### Requirement 5

**User Story:** As a game administrator, I want the emote distribution to be reproducible, so that all players see the same battle pass structure.

#### Acceptance Criteria

1. WHEN the seed script runs THEN the System SHALL use a fixed seed for random tier selection to ensure consistent results
2. WHEN the seed script runs multiple times THEN the System SHALL produce identical tier assignments for emotes
3. WHEN the seed script runs THEN the System SHALL log the final tier distribution for verification
