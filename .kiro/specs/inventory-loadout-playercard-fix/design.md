# Design Document: Inventory Loadout Playercard Fix

## Overview

This design addresses a bug where equipped player cards are not consistently displayed in the Inventory page's "Current Loadout" section and the Lobby's head-to-head display. The root cause is that certain WebSocket events (specifically `handle_ready` and `handle_disconnect`) broadcast player data without enriching it with playercard information.

The fix involves:
1. Updating the backend lobby handler to enrich player data with playercards in all broadcast events
2. Verifying the frontend LoadoutPanel correctly displays the playercard slot
3. Ensuring playercard data persists through all lobby state changes

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Backend Lobby Handler                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    _get_player_playercards()                         │   │
│  │  - Fetches equipped playercard for each player                       │   │
│  │  - Returns Dict[player_id, playercard_data | None]                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                _enrich_players_with_playercards()                    │   │
│  │  - Adds playercard field to each player object                       │   │
│  │  - Called before ALL broadcasts                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│         ┌──────────────────────────┼──────────────────────────┐             │
│         ▼                          ▼                          ▼             │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐         │
│  │handle_connect│          │handle_ready │          │handle_disconnect│     │
│  │  ✓ enriched │          │  ✗ NOT      │          │  ✗ NOT      │         │
│  │             │          │    enriched │          │    enriched │         │
│  └─────────────┘          └─────────────┘          └─────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Frontend Components                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         LoadoutPanel                                  │   │
│  │  - Displays 7 slots: skin, emote, banner, playercard, nameplate,     │   │
│  │    effect, trail                                                      │   │
│  │  - Shows equipped playercard with rarity styling                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      HeadToHeadDisplay                                │   │
│  │  - Shows player cards for both players                                │   │
│  │  - Receives playercard data from lobby state                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Backend Changes

#### LobbyHandler Updates

The `handle_ready` and `handle_disconnect` methods need to enrich player data with playercards before broadcasting:

```python
# backend/app/websocket/handlers/lobby.py

async def handle_ready(self, lobby_code: str, user_id: str) -> None:
    """Handle ready message from player."""
    try:
        lobby = await self.lobby_service.set_player_ready(lobby_code, user_id)
        
        # NEW: Enrich players with playercard data
        player_ids = [p["id"] for p in lobby["players"]]
        player_playercards = await self._get_player_playercards(player_ids)
        enriched_players = await self._enrich_players_with_playercards(
            lobby["players"], player_playercards
        )
        
        await self.manager.broadcast_to_lobby(
            lobby_code,
            build_player_ready(
                player_id=user_id,
                players=enriched_players,  # Use enriched players
                can_start=lobby.get("can_start", False),
            )
        )
    except Exception as e:
        # ... error handling
```

```python
async def handle_disconnect(self, lobby_code: str, user_id: str) -> None:
    """Handle player disconnection."""
    try:
        lobby = await self.get_lobby(lobby_code)
        
        # NEW: Enrich remaining players with playercard data
        remaining_players = [p for p in lobby.get("players", []) if p["id"] != user_id]
        if remaining_players:
            player_ids = [p["id"] for p in remaining_players]
            player_playercards = await self._get_player_playercards(player_ids)
            enriched_players = await self._enrich_players_with_playercards(
                remaining_players, player_playercards
            )
        else:
            enriched_players = []
        
        await self.manager.broadcast_to_lobby(
            lobby_code,
            build_player_left(user_id, enriched_players)  # Use enriched players
        )
    except Exception as e:
        # ... error handling
```

### Frontend Verification

The LoadoutPanel component already has playercard in the SLOTS array. We need to verify:

1. The SLOTS array includes 'playercard' (already present)
2. The SLOT_ICONS includes playercard icon (already present: '🎴')
3. The grid layout accommodates 7 slots (already configured: `grid-cols-4 md:grid-cols-7`)

## Data Models

### Player Object with Playercard

```typescript
// frontend/src/types/api.ts
interface PlayerCard {
  id: string
  name: string
  type: string
  rarity: string
  image_url: string
}

interface Player {
  id: string
  display_name: string | null
  is_host: boolean
  is_ready: boolean
  playercard?: PlayerCard | null  // Optional equipped playercard
}
```

### Backend Playercard Data

```python
# Playercard data structure returned by _get_player_playercards
{
    "id": str,           # Cosmetic UUID
    "name": str,         # Playercard name
    "type": str,         # "playercard"
    "rarity": str,       # "common" | "uncommon" | "rare" | "epic" | "legendary"
    "image_url": str,    # Full-art image URL
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Player Enrichment Consistency
*For any* lobby event that includes player data (lobby_state, player_joined, player_ready, player_left), all player objects SHALL include a `playercard` field (either containing playercard data or null).
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: LoadoutPanel Slot Completeness
*For any* LoadoutPanel render, the component SHALL display exactly 7 slots in the order: skin, emote, banner, playercard, nameplate, effect, trail, with appropriate icons and labels for each.
**Validates: Requirements 2.1**

### Property 3: Equipped Playercard Styling
*For any* equipped playercard with a rarity value, the LoadoutPanel slot SHALL apply the correct rarity border color from the rarityBorders mapping.
**Validates: Requirements 2.2**

### Property 4: Playercard Slot Click Handler
*For any* click on the playercard slot in LoadoutPanel, the onSlotClick callback SHALL be invoked with the argument 'playercard'.
**Validates: Requirements 2.4**

### Property 5: Playercard Persistence Through Events
*For any* sequence of lobby events (connect, ready, join), if a player has an equipped playercard, that playercard data SHALL be present in the player object after each event.
**Validates: Requirements 3.1, 3.2, 3.3**

## Error Handling

| Scenario | Handling |
|----------|----------|
| Playercard fetch fails | Log error, set playercard to null, continue with broadcast |
| Player not in inventory | Return null for playercard, display default placeholder |
| Invalid playercard data | Skip enrichment for that player, log warning |
| WebSocket broadcast fails | Log error, retry once, then fail gracefully |

## Testing Strategy

### Property-Based Testing (Hypothesis for Python, fast-check for TypeScript)

The following properties will be tested with minimum 100 iterations:

1. **Player Enrichment Consistency**: Generate random player lists and verify all have playercard field after enrichment
2. **LoadoutPanel Slot Completeness**: Generate random loadout states and verify 7 slots render
3. **Equipped Playercard Styling**: Generate playercards with random rarities and verify correct border classes
4. **Playercard Slot Click Handler**: Generate click events and verify callback arguments
5. **Playercard Persistence**: Generate event sequences and verify playercard data preservation

### Unit Tests

- `_get_player_playercards` returns correct data structure
- `_enrich_players_with_playercards` adds playercard field to all players
- LoadoutPanel renders playercard slot with correct icon
- Empty playercard slot shows placeholder

### Integration Tests

- Full flow: equip playercard → join lobby → verify display
- Ready up flow: playercard persists after ready event
- Disconnect flow: remaining player's playercard persists

## Migration Notes

### Backend Changes

1. Update `handle_ready` in `backend/app/websocket/handlers/lobby.py`
   - Add playercard enrichment before broadcast

2. Update `handle_disconnect` in `backend/app/websocket/handlers/lobby.py`
   - Add playercard enrichment before broadcast

### Frontend Verification

1. Verify LoadoutPanel SLOTS array includes 'playercard' (already present)
2. Verify SLOT_ICONS includes playercard icon (already present)
3. No frontend changes required if implementation is correct

### Testing

1. Add property tests for player enrichment
2. Add integration test for ready event playercard persistence
3. Verify existing lobby tests pass with enriched data
