# Requirements Document

## Introduction

This specification defines the Unified Progression System for the 1v1bro gaming platform. The system establishes the Battle Pass as the single source of truth for all player progression, replacing the legacy dual-system (separate level/XP and Battle Pass tier/XP) with a unified model where:

- **Battle Pass Tier = Player Level**
- **Battle Pass XP = Player XP**
- **Tier 1 = Starting Point** (all new users begin at tier 1 with the free skin auto-claimed)

The current implementation has critical gaps:
1. New users start at tier 0 with 0 XP (should be tier 1 with tier 1 reward claimed)
2. XP is not automatically awarded after match completion
3. The legacy `level` and `total_xp` fields in `user_profiles` create confusion with Battle Pass data
4. No automatic tier 1 skin grant on account creation

This upgrade ensures every player has a skin from day one, experiences immediate progression feedback after matches, and sees consistent tier/XP data across all surfaces (Profile, Battle Pass page, Dashboard, Lobby).

## Glossary

- **Unified_Progression_System**: The merged system where Battle Pass tier IS player level and Battle Pass XP IS player XP
- **Battle_Pass_Service**: The backend service at `backend/app/services/battlepass_service.py` managing progression
- **Player_Battlepass**: The database table `player_battlepass` storing per-user, per-season progression
- **Tier_1_Reward**: The free cosmetic (Frostborne Valkyrie skin) granted to all new players automatically
- **Auto_Claim**: The process of automatically claiming a tier reward without user interaction
- **XP_Award_Flow**: The process of calculating and awarding XP after match completion
- **Match_XP_Calculation**: The formula: base (win=100, loss=50) + kills*5 + streak*10 + duration*0.1, clamped to [50, 300]
- **Tier_Advancement**: The process of incrementing tier when XP exceeds xp_per_tier threshold
- **Progress_Initialization**: The process of creating player_battlepass record with tier 1 and claimed tier 1 reward
- **Season**: A time-bounded Battle Pass period with tiers and rewards
- **XP_Per_Tier**: The XP required to advance one tier (default: 1000)
- **Claimable_Rewards**: Tiers where tier_number <= current_tier AND tier_number NOT IN claimed_rewards

## Current State Analysis

| Component | Current Implementation | Problem |
|-----------|----------------------|---------|
| New User Progress | Created at tier 0, XP 0 | Users have no skin, can't play with cosmetics |
| Tier 1 Reward | Must be manually claimed | New users don't know to claim, poor UX |
| Match XP Award | Not implemented | Users play matches but see no XP gain |
| Profile Level | Legacy `level` field in user_profiles | Conflicts with Battle Pass tier |
| Profile XP | Legacy `total_xp` field in user_profiles | Conflicts with Battle Pass XP |
| Dashboard Widget | Shows Battle Pass data | Correct, but depends on proper initialization |
| Lobby Display | Shows tier from Battle Pass | Correct, but shows tier 0 for new users |

### Problems to Solve

1. **No Starting Skin**: New users have no equipped skin, breaking the game experience
2. **Tier 0 Start**: Users start at tier 0 instead of tier 1, confusing progression display
3. **No Match XP**: Completing matches doesn't award XP, breaking the core progression loop
4. **Dual Data Sources**: Legacy level/XP fields create confusion with Battle Pass data
5. **Manual Claiming Required**: Tier 1 reward requires manual claim action
6. **No Inventory Item**: Even if tier 1 is claimed, the cosmetic isn't added to inventory

---

## Requirements

### Requirement 1: Progress Initialization

**User Story:** As a new player, I want to automatically start at tier 1 with my first skin already claimed, so that I can immediately play with a cosmetic and understand the progression system.

#### Acceptance Criteria

1.1. WHEN a player's Battle Pass progress is created for the first time THEN the Unified_Progression_System SHALL initialize current_tier to 1 (not 0)

1.2. WHEN a player's Battle Pass progress is created THEN the Unified_Progression_System SHALL automatically add tier 1 to the claimed_rewards array

1.3. WHEN tier 1 is auto-claimed THEN the Unified_Progression_System SHALL add the tier 1 cosmetic to the player's inventory

1.4. WHEN tier 1 is auto-claimed THEN the Unified_Progression_System SHALL equip the tier 1 skin as the player's active skin if no skin is currently equipped

1.5. WHEN progress initialization completes THEN the Unified_Progression_System SHALL set current_xp to 0 (progress toward tier 2)

1.6. WHEN no active season exists THEN the Unified_Progression_System SHALL NOT create progress and SHALL return null

1.7. WHEN progress already exists for a user/season THEN the Unified_Progression_System SHALL return existing progress without modification

### Requirement 2: Match XP Award Flow

**User Story:** As a player, I want to receive XP after completing a match, so that I can progress through tiers and unlock rewards.

#### Acceptance Criteria

2.1. WHEN a match ends THEN the Unified_Progression_System SHALL calculate XP using the formula: base_xp + kill_bonus + streak_bonus + duration_bonus

2.2. WHEN calculating base XP THEN the Unified_Progression_System SHALL use 100 XP for wins and 50 XP for losses

2.3. WHEN calculating kill bonus THEN the Unified_Progression_System SHALL award 5 XP per kill

2.4. WHEN calculating streak bonus THEN the Unified_Progression_System SHALL award 10 XP per streak count

2.5. WHEN calculating duration bonus THEN the Unified_Progression_System SHALL award 0.1 XP per second of match duration

2.6. WHEN total XP is calculated THEN the Unified_Progression_System SHALL clamp the value to the range [50, 300]

2.7. WHEN XP is awarded THEN the Unified_Progression_System SHALL persist the XP gain to the xp_logs table with source, amount, and match_id

2.8. WHEN XP is awarded THEN the Unified_Progression_System SHALL send an xp_awarded WebSocket event to the player with: xp_amount, new_total_xp, tier_advanced, new_tier

### Requirement 3: Tier Advancement

**User Story:** As a player, I want to automatically advance to the next tier when I earn enough XP, so that I can unlock new rewards.

#### Acceptance Criteria

3.1. WHEN current_xp + awarded_xp >= xp_per_tier THEN the Unified_Progression_System SHALL increment current_tier by 1

3.2. WHEN tier advances THEN the Unified_Progression_System SHALL set current_xp to the overflow amount (new_xp - xp_per_tier)

3.3. WHEN multiple tiers are earned in one XP award THEN the Unified_Progression_System SHALL process all tier advancements in sequence

3.4. WHEN tier advances THEN the Unified_Progression_System SHALL add the new tier to claimable_rewards (not auto-claim, except tier 1)

3.5. WHEN current_tier reaches max_tier (100) THEN the Unified_Progression_System SHALL cap tier at 100 and set current_xp to 0

3.6. WHEN tier advances THEN the Unified_Progression_System SHALL send a tier_advanced WebSocket event with: previous_tier, new_tier, new_claimable_rewards

### Requirement 4: Reward Claiming

**User Story:** As a player, I want to claim my tier rewards when I reach new tiers, so that I can add cosmetics to my inventory.

#### Acceptance Criteria

4.1. WHEN a player claims a tier reward THEN the Unified_Progression_System SHALL validate tier_number <= current_tier

4.2. WHEN a player claims a tier reward THEN the Unified_Progression_System SHALL validate tier_number NOT IN claimed_rewards

4.3. WHEN claim validation passes THEN the Unified_Progression_System SHALL add the tier to claimed_rewards array

4.4. WHEN the reward is a cosmetic THEN the Unified_Progression_System SHALL add the cosmetic to the player's inventory

4.5. WHEN the reward is coins THEN the Unified_Progression_System SHALL add the coin amount to the player's balance

4.6. WHEN the reward is an XP boost THEN the Unified_Progression_System SHALL activate the boost for the player

4.7. WHEN claim succeeds THEN the Unified_Progression_System SHALL return ClaimResult with: success, tier, reward, inventory_item_id

4.8. WHEN claim fails THEN the Unified_Progression_System SHALL return null with appropriate error logging

### Requirement 5: Game End Integration

**User Story:** As a player, I want XP to be awarded automatically when my match ends, so that I don't have to take any manual action to progress.

#### Acceptance Criteria

5.1. WHEN the game_end WebSocket event is processed THEN the Unified_Progression_System SHALL call award_match_xp with match results

5.2. WHEN award_match_xp is called THEN the Unified_Progression_System SHALL extract: won, kills, streak, duration_seconds from match data

5.3. WHEN XP award completes THEN the Unified_Progression_System SHALL include xp_result in the game_end response payload

5.4. WHEN XP award completes THEN the Unified_Progression_System SHALL update the player's Battle Pass progress in the database

5.5. WHEN XP award fails THEN the Unified_Progression_System SHALL log the error and continue game_end processing without blocking

5.6. WHEN both players complete a match THEN the Unified_Progression_System SHALL award XP to both players independently

### Requirement 6: Data Consistency

**User Story:** As a player, I want to see consistent tier and XP values across all screens, so that I understand my true progression.

#### Acceptance Criteria

6.1. WHEN displaying player level on Profile THEN the system SHALL use current_tier from Battle Pass progress (not legacy level field)

6.2. WHEN displaying player XP on Profile THEN the system SHALL use total_xp from Battle Pass progress (not legacy total_xp field)

6.3. WHEN displaying tier on Dashboard widget THEN the system SHALL use current_tier from Battle Pass progress

6.4. WHEN displaying tier in Lobby THEN the system SHALL use current_tier from Battle Pass progress

6.5. WHEN no active season exists THEN all surfaces SHALL display "No Active Season" or tier 0 gracefully

6.6. WHEN Battle Pass progress is updated THEN all connected clients SHALL receive real-time updates via WebSocket

### Requirement 7: API Endpoints

**User Story:** As a frontend developer, I want clear API endpoints for progression data, so that I can build consistent UI experiences.

#### Acceptance Criteria

7.1. WHEN GET /api/v1/battlepass/me is called THEN the system SHALL return PlayerBattlePass with: current_tier, current_xp, xp_to_next_tier, total_xp, claimed_rewards, claimable_rewards

7.2. WHEN POST /api/v1/battlepass/me/claim-reward is called THEN the system SHALL process the claim and return ClaimResult

7.3. WHEN a match ends THEN the system SHALL include xp_result in the game_end WebSocket payload

7.4. WHEN progress is initialized THEN the system SHALL return the initialized progress with tier 1 and claimed tier 1

7.5. WHEN an error occurs THEN the system SHALL return appropriate HTTP status codes and error messages

### Requirement 8: Legacy Data Migration

**User Story:** As a system operator, I want existing users to be migrated to the unified system, so that all players have consistent progression.

#### Acceptance Criteria

8.1. WHEN an existing user with tier 0 accesses Battle Pass THEN the system SHALL upgrade them to tier 1 with auto-claimed tier 1 reward

8.2. WHEN migrating a user THEN the system SHALL preserve any existing claimed_rewards beyond tier 1

8.3. WHEN migrating a user THEN the system SHALL preserve current_xp if tier was already > 0

8.4. WHEN migration completes THEN the system SHALL log the migration for audit purposes

8.5. WHEN migration fails THEN the system SHALL NOT corrupt existing data and SHALL log the error

---

## Data Model

### player_battlepass Table (Existing - Modified Behavior)

```sql
-- No schema changes needed, but initialization behavior changes
-- current_tier: Now initialized to 1 (was 0)
-- claimed_rewards: Now initialized to [1] (was [])
```

### XP Award Result Schema

```python
class XPAwardResult(BaseModel):
    xp_awarded: int           # Amount of XP awarded
    new_total_xp: int         # Total XP after award
    previous_tier: int        # Tier before award
    new_tier: int             # Tier after award
    tier_advanced: bool       # Whether tier increased
    tiers_gained: int         # Number of tiers gained (can be >1)
    new_claimable_rewards: List[int]  # New tiers that can be claimed
```

### WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `xp_awarded` | Server → Client | `{ xp_amount, new_total_xp, previous_tier, new_tier, tier_advanced }` |
| `tier_advanced` | Server → Client | `{ previous_tier, new_tier, new_claimable_rewards }` |
| `reward_claimed` | Server → Client | `{ tier, reward_type, reward_value, inventory_item_id }` |

---

## Integration Points

### With Existing Systems

| System | Integration |
|--------|-------------|
| AuthService | Registration triggers progress initialization |
| GameService | game_end triggers XP award |
| CosmeticsService | Tier 1 auto-claim adds cosmetic to inventory |
| InventoryService | Tier 1 skin is auto-equipped if no skin equipped |
| WebSocketManager | XP and tier events broadcast to player |
| ProfileHeader | Displays tier from Battle Pass progress |
| StatsDashboard | Displays tier and XP from Battle Pass progress |
| DashboardWidget | Displays tier from Battle Pass progress |
| LobbyDisplay | Displays tier from Battle Pass progress |

### Event Flow

```
New User Registration → AuthService.register()
                     → BattlePassService.get_player_progress()
                     → BattlePassRepo.get_or_create_progress()
                     → Initialize tier=1, claimed_rewards=[1]
                     → CosmeticsService.add_to_inventory(tier_1_cosmetic)
                     → InventoryService.equip_if_no_skin()
                     → Return progress with tier 1

Match Completion → GameService.end_game()
               → BattlePassService.award_match_xp()
               → Calculate XP (base + bonuses, clamped)
               → Update progress (tier advancement if needed)
               → Log XP gain
               → Send xp_awarded WebSocket event
               → Send tier_advanced event (if applicable)
               → Return XPAwardResult in game_end payload
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| New User Tier | 100% start at tier 1 | Database query |
| Tier 1 Skin Ownership | 100% of users own tier 1 skin | Inventory query |
| Match XP Award Rate | 100% of completed matches | XP logs vs match count |
| XP Calculation Accuracy | 100% within [50, 300] range | Property test |
| Tier Advancement Accuracy | 100% correct tier after XP | Property test |
| Data Consistency | 0 drift between surfaces | UI audit |

---

## Testing Strategy

### Property-Based Tests

1. **XP Calculation Bounds**: For any match result, XP SHALL be in [50, 300]
2. **Tier Advancement**: For any XP award, tier SHALL advance correctly based on xp_per_tier
3. **Progress Initialization**: For any new user, tier SHALL be 1 and claimed_rewards SHALL contain 1
4. **Claim Validation**: For any claim request, validation SHALL correctly allow/deny based on tier and claimed_rewards
5. **XP Serialization Round-Trip**: For any XPAwardResult, serializing then deserializing SHALL produce equivalent object

### Integration Tests

1. Full registration → tier 1 → inventory flow
2. Match completion → XP award → tier advancement flow
3. Claim reward → inventory update flow
4. WebSocket event delivery for XP and tier changes
5. Legacy user migration flow

### End-to-End Tests

1. New user registers, sees tier 1, has skin equipped
2. User plays match, sees XP awarded, tier advances
3. User claims tier 2 reward, cosmetic appears in inventory
4. Profile, Dashboard, Lobby all show consistent tier

---

*Document Version: 1.0*
*Created: December 2024*
