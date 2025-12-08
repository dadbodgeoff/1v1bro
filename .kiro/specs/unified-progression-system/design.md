# Unified Progression System - Design Document

## Overview

This design document outlines the architecture for implementing the Unified Progression System, which establishes the Battle Pass as the single source of truth for all player progression. The system ensures:

1. All new users start at tier 1 with the tier 1 skin auto-claimed and equipped
2. XP is automatically awarded after every match completion
3. Tier advancement happens automatically when XP thresholds are met
4. All UI surfaces display consistent tier/XP data from Battle Pass progress

The implementation modifies existing services rather than creating new ones, ensuring minimal disruption while fixing critical progression gaps.

## Current State Analysis

### Files to Modify

| File | Current State | Changes Needed |
|------|---------------|----------------|
| `backend/app/database/repositories/battlepass_repo.py` | Creates progress at tier 0 | Initialize at tier 1 with claimed_rewards=[1] |
| `backend/app/services/battlepass_service.py` | No auto-claim on init | Add auto-claim tier 1 and inventory integration |
| `backend/app/websocket/handlers/game.py` | No XP award on game_end | Call award_match_xp and include result |
| `backend/app/api/v1/battlepass.py` | Returns progress as-is | Ensure migration for tier 0 users |

### New Files to Create

| File | Purpose |
|------|---------|
| `backend/app/services/progression_service.py` | Orchestrates unified progression logic |
| `backend/tests/integration/test_unified_progression.py` | End-to-end progression tests |
| `backend/tests/property/test_progression.py` | Property-based tests for XP and tier logic |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           Unified Progression System                                 │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         Entry Points                                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │   │
│  │  │ Registration │  │  Game End    │  │ Claim Reward │  │ Get Progress │     │   │
│  │  │  (Auth)      │  │  (WebSocket) │  │  (API)       │  │  (API)       │     │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │   │
│  └─────────┼─────────────────┼─────────────────┼─────────────────┼─────────────┘   │
│            │                 │                 │                 │                  │
│            ▼                 ▼                 ▼                 ▼                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                      ProgressionService                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────────────┐   │   │
│  │  │ initialize_progress()  │ award_match_xp()  │ claim_reward()          │   │   │
│  │  │ - Create at tier 1     │ - Calculate XP    │ - Validate claim        │   │   │
│  │  │ - Auto-claim tier 1    │ - Update progress │ - Add to inventory      │   │   │
│  │  │ - Add to inventory     │ - Handle tier up  │ - Mark claimed          │   │   │
│  │  │ - Equip if no skin     │ - Send WS events  │ - Send WS event         │   │   │
│  │  └──────────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         Data Layer                                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │   │
│  │  │ BattlePass   │  │ Cosmetics    │  │ Inventory    │  │ XP Logs      │     │   │
│  │  │ Repository   │  │ Service      │  │ Service      │  │ Repository   │     │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
ProgressionService (New - Orchestrator)
├── BattlePassService (Existing - Modified)
│   ├── get_player_progress() - Now triggers migration for tier 0 users
│   ├── award_match_xp() - Existing, called from game_end
│   └── claim_reward() - Existing, used for manual claims
├── BattlePassRepository (Existing - Modified)
│   ├── create_player_progress() - Now initializes tier=1, claimed=[1]
│   └── get_or_create_progress() - Triggers auto-claim flow
├── CosmeticsService (Existing)
│   └── add_to_inventory() - Called for tier 1 auto-claim
├── InventoryService (Existing)
│   └── equip_cosmetic() - Called to equip tier 1 skin
└── WebSocketManager (Existing)
    └── send_to_user() - Sends xp_awarded, tier_advanced events
```

## Components and Interfaces

### ProgressionService (New)

```python
"""
ProgressionService - Unified Progression Orchestrator

Features:
- Coordinates progress initialization with auto-claim
- Handles XP award flow with WebSocket events
- Manages tier advancement logic
- Ensures data consistency across services

This service wraps BattlePassService to add:
- Auto-claim tier 1 on progress creation
- Inventory integration for cosmetic rewards
- WebSocket event broadcasting
"""

class ProgressionService:
    def __init__(
        self,
        client: Client,
        battlepass_service: BattlePassService,
        cosmetics_service: CosmeticsService,
        inventory_service: InventoryService,
        websocket_manager: WebSocketManager,
    ):
        self.battlepass_service = battlepass_service
        self.cosmetics_service = cosmetics_service
        self.inventory_service = inventory_service
        self.websocket_manager = websocket_manager
    
    async def initialize_progress(self, user_id: str) -> Optional[PlayerBattlePass]:
        """
        Initialize or get player progress with tier 1 auto-claim.
        
        Flow:
        1. Get or create progress (now starts at tier 1)
        2. If newly created, auto-claim tier 1 reward
        3. Add tier 1 cosmetic to inventory
        4. Equip skin if no skin currently equipped
        5. Return progress
        """
        pass
    
    async def award_match_xp(
        self,
        user_id: str,
        won: bool,
        kills: int,
        streak: int,
        duration_seconds: int,
        match_id: Optional[str] = None,
    ) -> Optional[XPAwardResult]:
        """
        Award XP from match and handle tier advancement.
        
        Flow:
        1. Calculate XP (base + bonuses, clamped to [50, 300])
        2. Update progress (may advance tier)
        3. Log XP gain
        4. Send xp_awarded WebSocket event
        5. Send tier_advanced event if applicable
        6. Return XPAwardResult
        """
        pass
    
    async def migrate_tier_zero_user(self, user_id: str) -> Optional[PlayerBattlePass]:
        """
        Migrate existing tier 0 user to tier 1 with auto-claim.
        
        Flow:
        1. Check if user is at tier 0
        2. Update to tier 1
        3. Add tier 1 to claimed_rewards
        4. Add tier 1 cosmetic to inventory
        5. Equip if no skin equipped
        6. Log migration
        7. Return updated progress
        """
        pass
```

### Modified BattlePassRepository

```python
# Changes to create_player_progress()

async def create_player_progress(
    self, user_id: str, season_id: str, is_premium: bool = False
) -> dict:
    """
    Create initial progress for a player in a season.
    
    UNIFIED PROGRESSION: Now initializes at tier 1 with tier 1 claimed.
    
    Args:
        user_id: User UUID
        season_id: Season UUID
        is_premium: Whether player has premium pass
        
    Returns:
        New progress record with tier=1, claimed_rewards=[1]
    """
    result = (
        self._progress()
        .insert({
            "user_id": user_id,
            "season_id": season_id,
            "current_tier": 1,  # Changed from 0
            "current_xp": 0,
            "is_premium": is_premium,
            "claimed_rewards": [1],  # Changed from []
            "purchased_tiers": 0,
            "last_updated": datetime.utcnow().isoformat(),
        })
        .execute()
    )
    return result.data[0] if result.data else {}
```

### Modified Game End Handler

```python
# Changes to game_end WebSocket handler

async def handle_game_end(
    self,
    game_id: str,
    winner_id: str,
    loser_id: str,
    match_data: dict,
) -> dict:
    """
    Handle game end with XP award integration.
    
    UNIFIED PROGRESSION: Now awards XP to both players.
    """
    # ... existing game end logic ...
    
    # Award XP to winner
    winner_xp_result = await self.progression_service.award_match_xp(
        user_id=winner_id,
        won=True,
        kills=match_data.get("winner_kills", 0),
        streak=match_data.get("winner_streak", 0),
        duration_seconds=match_data.get("duration_seconds", 0),
        match_id=game_id,
    )
    
    # Award XP to loser
    loser_xp_result = await self.progression_service.award_match_xp(
        user_id=loser_id,
        won=False,
        kills=match_data.get("loser_kills", 0),
        streak=match_data.get("loser_streak", 0),
        duration_seconds=match_data.get("duration_seconds", 0),
        match_id=game_id,
    )
    
    # Include XP results in game_end payload
    return {
        "type": "game_end",
        "winner_id": winner_id,
        "winner_xp": winner_xp_result.dict() if winner_xp_result else None,
        "loser_xp": loser_xp_result.dict() if loser_xp_result else None,
        # ... other game end data ...
    }
```

## Data Models

### XPAwardResult Schema

```python
class XPAwardResult(BaseModel):
    """Result of XP award operation."""
    xp_awarded: int
    new_total_xp: int
    previous_tier: int
    new_tier: int
    tier_advanced: bool
    tiers_gained: int
    new_claimable_rewards: List[int]

class MatchXPCalculation(BaseModel):
    """Breakdown of XP calculation."""
    base_xp: int           # 100 for win, 50 for loss
    kill_bonus: int        # kills * 5
    streak_bonus: int      # streak * 10
    duration_bonus: int    # int(duration * 0.1)
    total_xp: int          # Clamped to [50, 300]
    was_clamped: bool      # Whether clamping was applied
```

### WebSocket Event Payloads

```python
class XPAwardedEvent(BaseModel):
    """WebSocket event for XP award."""
    type: Literal["xp_awarded"] = "xp_awarded"
    xp_amount: int
    new_total_xp: int
    previous_tier: int
    new_tier: int
    tier_advanced: bool
    calculation: MatchXPCalculation

class TierAdvancedEvent(BaseModel):
    """WebSocket event for tier advancement."""
    type: Literal["tier_advanced"] = "tier_advanced"
    previous_tier: int
    new_tier: int
    tiers_gained: int
    new_claimable_rewards: List[int]

class RewardClaimedEvent(BaseModel):
    """WebSocket event for reward claim."""
    type: Literal["reward_claimed"] = "reward_claimed"
    tier: int
    reward_type: str
    reward_value: Any
    inventory_item_id: Optional[str]
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: XP Calculation Bounds
*For any* match result with won (bool), kills (int >= 0), streak (int >= 0), and duration_seconds (int >= 0), the calculated XP SHALL be in the range [50, 300].
**Validates: Requirements 2.6**

### Property 2: XP Calculation Formula
*For any* match result, the XP SHALL equal min(300, max(50, base_xp + kills*5 + streak*10 + int(duration*0.1))) where base_xp is 100 for win and 50 for loss.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

### Property 3: Progress Initialization
*For any* newly created player progress, current_tier SHALL be 1 and claimed_rewards SHALL contain exactly [1].
**Validates: Requirements 1.1, 1.2**

### Property 4: Tier Advancement Correctness
*For any* XP award where current_xp + awarded_xp >= xp_per_tier, the new_tier SHALL equal previous_tier + floor((current_xp + awarded_xp) / xp_per_tier) and new_xp SHALL equal (current_xp + awarded_xp) % xp_per_tier.
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 5: Tier Cap Enforcement
*For any* tier advancement, the resulting tier SHALL NOT exceed 100 (max_tier).
**Validates: Requirements 3.5**

### Property 6: Claim Validation
*For any* claim request with tier T, the claim SHALL succeed if and only if T <= current_tier AND T NOT IN claimed_rewards.
**Validates: Requirements 4.1, 4.2**

### Property 7: XP Award Result Serialization Round-Trip
*For any* XPAwardResult object, serializing to JSON then deserializing SHALL produce an equivalent object.
**Validates: Requirements 2.7**

### Property 8: Claimable Rewards Calculation
*For any* player progress, claimable_rewards SHALL equal the set {t : 1 <= t <= current_tier AND t NOT IN claimed_rewards}.
**Validates: Requirements 4.1, 4.2**

## Error Handling

| Scenario | Handling |
|----------|----------|
| No active season | Return null, log warning |
| Progress creation fails | Return null, log error, don't corrupt state |
| XP award fails | Log error, continue game_end processing |
| Tier 1 cosmetic not found | Log error, skip inventory add, continue |
| Inventory add fails | Log error, continue (progress still valid) |
| WebSocket send fails | Log error, continue (data still persisted) |
| Claim validation fails | Return null, log reason |
| Migration fails | Log error, preserve existing data |

## Testing Strategy

### Property-Based Testing (hypothesis)

The following properties will be tested using the hypothesis library with minimum 100 iterations per test:

1. **XP Calculation Bounds**: Generate match results, verify XP in [50, 300]
2. **XP Calculation Formula**: Generate match results, verify formula correctness
3. **Progress Initialization**: Generate user IDs, verify tier=1 and claimed=[1]
4. **Tier Advancement**: Generate XP awards, verify tier and XP calculations
5. **Tier Cap**: Generate large XP awards, verify tier <= 100
6. **Claim Validation**: Generate claim requests, verify validation logic
7. **XP Serialization**: Generate XPAwardResult, verify round-trip
8. **Claimable Rewards**: Generate progress states, verify claimable calculation

### Unit Tests

- XP calculation with various inputs
- Tier advancement edge cases (exact threshold, multiple tiers)
- Progress initialization
- Claim validation logic
- Migration logic for tier 0 users

### Integration Tests

- Full registration → tier 1 → inventory flow
- Match completion → XP award → tier advancement flow
- Claim reward → inventory update flow
- WebSocket event delivery
- Legacy user migration

### End-to-End Tests

Using the test account (dadbodgeoff@gmail.com):
1. Verify user starts at tier 1 with skin
2. Complete a match, verify XP awarded
3. Verify tier advances when XP threshold met
4. Claim tier 2 reward, verify in inventory
5. Verify all UI surfaces show consistent data

## Migration Strategy

### For Existing Tier 0 Users

```python
async def migrate_tier_zero_users():
    """
    One-time migration for existing tier 0 users.
    
    Can be run as a script or triggered on user access.
    """
    # Get all tier 0 users for current season
    tier_zero_users = await battlepass_repo.get_tier_zero_users(season_id)
    
    for user in tier_zero_users:
        try:
            # Update to tier 1
            await battlepass_repo.update_progress(
                user_id=user["user_id"],
                season_id=season_id,
                current_tier=1,
                current_xp=user["current_xp"],  # Preserve XP
            )
            
            # Add tier 1 to claimed if not present
            claimed = user.get("claimed_rewards", []) or []
            if 1 not in claimed:
                claimed.append(1)
                await battlepass_repo.update_claimed_rewards(
                    user_id=user["user_id"],
                    season_id=season_id,
                    claimed_rewards=claimed,
                )
            
            # Add tier 1 cosmetic to inventory
            tier_1_reward = await get_tier_1_cosmetic(season_id)
            if tier_1_reward:
                await cosmetics_service.add_to_inventory(
                    user_id=user["user_id"],
                    cosmetic_id=tier_1_reward["cosmetic_id"],
                )
            
            logger.info(f"Migrated user {user['user_id']} to tier 1")
            
        except Exception as e:
            logger.error(f"Failed to migrate user {user['user_id']}: {e}")
            # Continue with next user, don't fail entire migration
```

### On-Access Migration

For users who access the system before batch migration runs:

```python
async def get_player_progress(self, user_id: str) -> Optional[PlayerBattlePass]:
    """Get progress with on-access migration for tier 0 users."""
    progress = await self._get_raw_progress(user_id)
    
    if progress and progress.current_tier == 0:
        # Trigger migration
        progress = await self.migrate_tier_zero_user(user_id)
    
    return progress
```

## File Structure

```
backend/app/
├── services/
│   ├── battlepass_service.py      # Modified: XP award, claim logic
│   └── progression_service.py     # New: Orchestration layer
│
├── database/repositories/
│   └── battlepass_repo.py         # Modified: Initialize at tier 1
│
├── websocket/handlers/
│   └── game.py                    # Modified: Call award_match_xp on game_end
│
├── api/v1/
│   └── battlepass.py              # Modified: Ensure migration on access
│
└── schemas/
    └── battlepass.py              # Existing: XPAwardResult, etc.

backend/tests/
├── integration/
│   └── test_unified_progression.py  # New: E2E progression tests
│
└── property/
    └── test_progression.py          # New: Property-based tests
```

## Implementation Order

1. **Phase 1**: Modify `create_player_progress` to initialize at tier 1
2. **Phase 2**: Add auto-claim tier 1 logic with inventory integration
3. **Phase 3**: Integrate XP award into game_end handler
4. **Phase 4**: Add WebSocket events for XP and tier changes
5. **Phase 5**: Add migration logic for existing tier 0 users
6. **Phase 6**: Write property-based tests
7. **Phase 7**: Write integration tests
8. **Phase 8**: Run end-to-end verification

---

*Document Version: 1.0*
*Created: December 2024*
