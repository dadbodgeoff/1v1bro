# Design Document

## Overview

This feature adds map selection to the matchmaking flow, allowing players to choose between Nexus Arena and Vortex Arena before queuing. The selected map flows through matchmaking, is stored in the lobby, and is passed to the game engine via WebSocket events.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  MapSelector    │────▶│ MatchmakingService│────▶│  LobbyService   │
│  (Frontend)     │     │  (Backend)        │     │  (Backend)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                        │
        │ map_slug               │ map_slug               │ map_slug
        ▼                        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  WebSocket      │◀────│  MatchTicket     │     │  lobbies table  │
│  Events         │     │  (in-memory)     │     │  (database)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │
        │ game_start.map_slug
        ▼
┌─────────────────┐
│  GameEngine     │
│  (Frontend)     │
└─────────────────┘
```

### Data Flow

1. Player selects map in UI (MapSelector component)
2. Map slug sent with queue_join WebSocket message
3. MatchmakingService stores map_slug in MatchTicket
4. Queue manager only matches players with same map_slug
5. Lobby created with map_slug stored in database
6. game_start event includes map_slug
7. GameEngine loads correct MapConfig based on slug

## Components and Interfaces

### Frontend Components

```typescript
// MapSelector component props
interface MapSelectorProps {
  selectedMap: string;
  onSelect: (mapSlug: string) => void;
  disabled?: boolean;
}

// Available maps (static for now)
const AVAILABLE_MAPS = [
  {
    slug: 'nexus-arena',
    name: 'Nexus Arena',
    description: 'Classic three-lane space arena',
    thumbnail: '/maps/nexus-arena-thumb.png',
    theme: 'space',
  },
  {
    slug: 'vortex-arena',
    name: 'Vortex Arena',
    description: 'Volcanic arena with rotating hazards',
    thumbnail: '/maps/vortex-arena-thumb.png',
    theme: 'volcanic',
  },
];
```

### Backend Models

```python
# Updated MatchTicket
@dataclass
class MatchTicket:
    player_id: str
    player_name: str
    queue_time: datetime
    id: str = field(default_factory=lambda: str(uuid4()))
    game_mode: str = "fortnite"  # trivia category
    map_slug: str = "nexus-arena"  # arena map
```

### Database Schema

```sql
-- Migration: Add map_slug to lobbies
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS 
    map_slug VARCHAR(50) DEFAULT 'nexus-arena';

CREATE INDEX IF NOT EXISTS idx_lobbies_map_slug ON lobbies(map_slug);
```

### WebSocket Events

```typescript
// queue_join message (client -> server)
{
  type: "queue_join",
  payload: {
    category: "fortnite",
    map_slug: "vortex-arena"
  }
}

// match_found event (server -> client)
{
  type: "match_found",
  payload: {
    lobby_code: "ABC123",
    opponent_id: "...",
    opponent_name: "Player2",
    map_slug: "vortex-arena"
  }
}

// lobby_state event (server -> client)
{
  type: "lobby_state",
  payload: {
    lobby_id: "...",
    status: "waiting",
    players: [...],
    can_start: true,
    host_id: "...",
    category: "fortnite",
    map_slug: "vortex-arena"
  }
}

// game_start event (server -> client)
{
  type: "game_start",
  payload: {
    total_questions: 15,
    players: [...],
    player1_id: "...",
    player2_id: "...",
    player_skins: {...},
    category: "fortnite",
    map_slug: "vortex-arena"
  }
}
```

### Map Loading Utility

```typescript
// frontend/src/game/config/maps/map-loader.ts
import { NEXUS_ARENA, VORTEX_ARENA, type MapConfig } from './index';

const MAP_REGISTRY: Record<string, MapConfig> = {
  'nexus-arena': NEXUS_ARENA,
  'vortex-arena': VORTEX_ARENA,
};

export function getMapConfig(slug: string): MapConfig {
  return MAP_REGISTRY[slug] ?? NEXUS_ARENA;
}

export function getAvailableMaps(): string[] {
  return Object.keys(MAP_REGISTRY);
}
```

## Data Models

### Map Metadata

```typescript
interface MapInfo {
  slug: string;           // Unique identifier (e.g., "nexus-arena")
  name: string;           // Display name
  description: string;    // Short description
  thumbnail: string;      // Preview image URL
  theme: 'space' | 'volcanic';  // Visual theme
}
```

### Lobby with Map

```python
# Lobby dict structure
{
    "id": "uuid",
    "code": "ABC123",
    "host_id": "uuid",
    "opponent_id": "uuid",
    "status": "waiting",
    "game_mode": "fortnite",  # trivia category
    "category": "fortnite",   # trivia category (duplicate for compatibility)
    "map_slug": "vortex-arena",  # arena map
    "created_at": "...",
    "updated_at": "...",
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Map selection renders all available maps
*For any* list of available maps, the MapSelector component should render a selectable option for each map including its name.
**Validates: Requirements 1.2**

### Property 2: Matchmaking request includes map
*For any* selected map slug, when a player clicks "Find Match", the queue_join message should include that map_slug value.
**Validates: Requirements 1.5**

### Property 3: Match ticket stores map
*For any* map slug provided to join_queue, the created MatchTicket should have that map_slug value stored.
**Validates: Requirements 2.1**

### Property 4: Same-map matching only
*For any* two players in the queue with different map_slug values, the matchmaking system should not match them together.
**Validates: Requirements 2.2**

### Property 5: Lobby stores and returns map
*For any* map slug used when creating a lobby, retrieving that lobby should return the same map_slug value.
**Validates: Requirements 2.3, 2.4, 5.2**

### Property 6: WebSocket events include map
*For any* lobby with a map_slug, the lobby_state, game_start, and match_found events should all include that map_slug in their payloads.
**Validates: Requirements 3.3, 6.1, 6.2, 6.3**

### Property 7: Map slug to config mapping
*For any* valid map slug ("nexus-arena" or "vortex-arena"), the getMapConfig function should return the corresponding MapConfig object.
**Validates: Requirements 4.2**

### Property 8: Invalid map defaults to Nexus
*For any* invalid or missing map slug, the getMapConfig function should return NEXUS_ARENA configuration.
**Validates: Requirements 4.5**

## Error Handling

| Error Case | Handling |
|------------|----------|
| Invalid map slug in queue_join | Default to "nexus-arena" |
| Map slug missing from lobby | Default to "nexus-arena" |
| Unknown map slug in game_start | Load NEXUS_ARENA |
| Map thumbnail fails to load | Show placeholder image |

## Testing Strategy

### Unit Tests

- MapSelector renders all maps
- MapSelector calls onSelect with correct slug
- getMapConfig returns correct config for each slug
- getMapConfig defaults to NEXUS_ARENA for invalid slugs
- build_game_start includes map_slug
- build_lobby_state includes map_slug
- build_match_found includes map_slug

### Property-Based Tests

Using Hypothesis (Python) and fast-check (TypeScript):

- **Property 4**: Generate random queue states with varying map selections, verify no cross-map matches
- **Property 5**: Generate random map slugs, verify lobby round-trip preserves value
- **Property 6**: Generate random lobby data, verify all events include map_slug
- **Property 8**: Generate random invalid strings, verify all default to nexus-arena

### Integration Tests

- Full flow: Select map → Queue → Match → Lobby → Game loads correct map
- Backwards compatibility: Old lobbies without map_slug default to nexus-arena

