# Requirements Document

## Introduction

The Dynamic Shop CMS system enables content creators and administrators to manage cosmetic items (skins, emotes, banners, etc.) without requiring code changes or application redeployment. Currently, cosmetic assets are hardcoded as Vite imports, meaning every new skin requires a code change, rebuild, and deploy. This system will allow assets to be uploaded to cloud storage (Supabase Storage), managed via admin API endpoints, and dynamically loaded by the frontend at runtime.

## Glossary

- **Cosmetic**: A purchasable in-game item such as a skin, emote, banner, nameplate, effect, or trail
- **Asset**: A visual resource (image, sprite sheet, video) associated with a cosmetic
- **Supabase Storage**: Cloud object storage service for hosting cosmetic assets
- **Sprite Sheet**: A single image containing multiple animation frames for a character skin
- **Shop Rotation**: The scheduled refresh of featured/available items in the shop
- **Admin API**: Protected API endpoints for managing cosmetics catalog
- **Asset URL**: A publicly accessible URL pointing to an asset in cloud storage
- **Availability Window**: The time period during which a cosmetic is available for purchase (start_date to end_date)

## Requirements

### Requirement 1

**User Story:** As a content administrator, I want to upload cosmetic assets to cloud storage, so that I can add new items without code changes.

#### Acceptance Criteria

1. WHEN an administrator uploads an asset file THEN the system SHALL store the file in Supabase Storage and return a public URL
2. WHEN an administrator uploads a sprite sheet THEN the system SHALL validate the image dimensions and format before storing
3. WHEN an asset upload fails THEN the system SHALL return an error message describing the failure reason
4. WHEN an administrator uploads an asset THEN the system SHALL generate a unique filename to prevent collisions

### Requirement 2

**User Story:** As a content administrator, I want to create and manage cosmetic catalog entries via API, so that I can configure pricing, rarity, and availability without database access.

#### Acceptance Criteria

1. WHEN an administrator creates a cosmetic THEN the system SHALL store the cosmetic with name, type, rarity, description, asset URLs, and pricing
2. WHEN an administrator updates a cosmetic THEN the system SHALL modify only the specified fields and preserve other data
3. WHEN an administrator deletes a cosmetic THEN the system SHALL remove the catalog entry and associated storage assets
4. WHEN an administrator sets availability dates THEN the system SHALL enforce start_date and end_date for shop visibility
5. WHEN an administrator creates a cosmetic THEN the system SHALL validate all required fields before storing

### Requirement 3

**User Story:** As a content administrator, I want to configure shop rotations and featured items, so that I can create time-limited offers and daily refreshes.

#### Acceptance Criteria

1. WHEN an administrator marks a cosmetic as featured THEN the system SHALL display the cosmetic in the featured section until unmarked
2. WHEN a cosmetic's available_until date passes THEN the system SHALL exclude the cosmetic from shop listings
3. WHEN an administrator schedules a shop rotation THEN the system SHALL automatically update featured items at the specified time
4. WHEN the shop rotation executes THEN the system SHALL select items based on configured rotation rules

### Requirement 4

**User Story:** As a player, I want the shop to load cosmetic images dynamically from cloud storage, so that I see new items without app updates.

#### Acceptance Criteria

1. WHEN the shop page loads THEN the system SHALL fetch cosmetic data including asset URLs from the API
2. WHEN displaying a cosmetic THEN the system SHALL load the image from the asset URL rather than bundled imports
3. WHEN an asset fails to load THEN the system SHALL display a placeholder image and log the error
4. WHEN loading sprite sheets THEN the system SHALL parse the associated JSON metadata for animation frames

### Requirement 5

**User Story:** As a player, I want my equipped skin to load dynamically in the game arena, so that I can use newly purchased skins immediately.

#### Acceptance Criteria

1. WHEN a player enters the arena THEN the system SHALL load the equipped skin sprite sheet from the asset URL
2. WHEN the sprite sheet loads THEN the system SHALL parse frame data and register animations with the game engine
3. WHEN a skin asset fails to load THEN the system SHALL fall back to a default skin and notify the player
4. WHEN multiple players have different skins THEN the system SHALL load each unique skin sprite sheet once and cache for reuse

### Requirement 6

**User Story:** As a developer, I want asset URLs and metadata to be serialized and deserialized consistently, so that data integrity is maintained across the system.

#### Acceptance Criteria

1. WHEN serializing cosmetic data to JSON THEN the system SHALL produce valid JSON that can be deserialized to an equivalent object
2. WHEN deserializing cosmetic JSON THEN the system SHALL validate required fields and reject malformed data
3. WHEN storing asset metadata THEN the system SHALL include content_type, file_size, and upload_timestamp

