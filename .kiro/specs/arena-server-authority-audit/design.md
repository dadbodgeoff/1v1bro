# Design Document: Arena Server Authority Audit

## Overview

This design document outlines the implementation of server-side authority for arena game systems that are currently client-only. The goal is to ensure all gameplay-affecting mechanics are server-authoritative to prevent cheating and ensure fair play.

**Current State:**
- ✅ Hazards, Traps, Transport, Combat, Doors, Platforms - Already server-authoritative
- ❌ Barriers - Client-only collision and destruction
- ❌ Power-ups - Client-side spawn/collection
- ⚠️ Buffs - Server exists but needs WebSocket integration
- ⚠️ Doors/Platforms - Server exists but needs WebSocket wiring

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Backend (Python)                         │
├─────────────────────────────────────────────────────────────────┤
│  ServerArenaSystems (coordinator)                                │
│  ├── HazardManager      ✅ (existing)                           │
│  ├── TrapManager        ✅ (existing)                           │
│  ├── TransportManager   ✅ (existing)                           │
│  ├── DoorManager        ✅ (existing)                           │
│  ├── PlatformManager    ✅ (existing)                           │
│  ├── BarrierManager     🆕 (new)                                │
│  └── PowerUpManager     🆕 (new)                                │
│                                                                  │
│  BuffManager            ✅ (existing, needs wiring)             │
│  ServerCombatSystem     ✅ (existing)                           │
├─────────────────────────────────────────────────────────────────┤
│                    WebSocket Handlers                            │
│  ├── ArenaHandler       (add arena_state broadcast)             │
│  └── WSEventType        (add ARENA_STATE event)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Frontend (TypeScript)                      │
├─────────────────────────────────────────────────────────────────┤
│  Client Systems (rendering + server sync)                        │
│  ├── BarrierManager     (add applyServerState)                  │
│  ├── PowerUpManager     (add applyServerState)                  │
│  ├── BuffManager        ✅ (has setFromServer)                  │
│  ├── DoorSystem         ✅ (has applyServerDoorState)           │
│  └── MovingPlatformSystem ✅ (has applyServerPlatformState)     │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Server-Side Barrier Manager (New)

```python
# backend/app/game/arena/barriers.py

@dataclass
class ServerBarrier:
    id: str
    position: Tuple[float, float]
    size: Tuple[float, float]
    barrier_type: str  # 'solid', 'destructible', 'half_wall', 'one_way'
    health: int
    max_health: int
    is_active: bool = True
    direction: Optional[str] = None  # For one-way barriers

class BarrierManager:
    def add(id, x, y, width, height, barrier_type, health, direction) -> ServerBarrier
    def remove(id) -> None
    def apply_damage(id, damage, source_player_id) -> DamageResult
    def check_collision(x, y, radius) -> Optional[str]
    def check_projectile_collision(x, y) -> Optional[str]
    def get_state() -> List[dict]
    def get_and_clear_events() -> List[ArenaEvent]
```

### 2. Server-Side Power-Up Manager (New)

```python
# backend/app/game/arena/powerups.py

@dataclass
class ServerPowerUp:
    id: str
    position: Tuple[float, float]
    powerup_type: str  # 'sos', 'time_steal', 'shield', 'double_points'
    radius: float
    is_active: bool = True
    spawn_time: float = 0

class PowerUpManager:
    def spawn(id, x, y, powerup_type, radius) -> ServerPowerUp
    def check_collection(player_id, position) -> Optional[PowerUpCollectionResult]
    def remove(id) -> None
    def get_state() -> List[dict]
    def get_and_clear_events() -> List[ArenaEvent]
```

### 3. WebSocket Event Types (Update)

```python
# backend/app/websocket/events.py

class WSEventType(str, Enum):
    # ... existing events ...
    
    # Arena state sync (Server -> Client)
    ARENA_STATE = "arena_state"
    ARENA_EVENT = "arena_event"
    
    # Barrier events
    BARRIER_DAMAGED = "barrier_damaged"
    BARRIER_DESTROYED = "barrier_destroyed"
    
    # Power-up events (already exist, ensure used)
    POWERUP_SPAWN = "powerup_spawn"
    POWERUP_COLLECTED = "powerup_collected"
```

### 4. Arena Handler Updates

```python
# backend/app/websocket/handlers/arena.py

class ArenaHandler:
    async def broadcast_arena_state(lobby_code: str) -> None:
        """Broadcast full arena state to all clients."""
        
    async def broadcast_arena_events(lobby_code: str, events: List[ArenaEvent]) -> None:
        """Broadcast arena events to all clients."""
```

### 5. Client-Side Sync Functions

```typescript
// frontend/src/game/barriers/BarrierManager.ts
applyServerState(serverState: ServerBarrierState[]): void

// frontend/src/game/systems/PowerUpManager.ts  
applyServerState(serverState: ServerPowerUpState[]): void
```

## Data Models

### Server Barrier State

```typescript
interface ServerBarrierState {
  id: string
  x: number
  y: number
  width: number
  height: number
  type: 'solid' | 'destructible' | 'half_wall' | 'one_way'
  health: number
  max_health: number
  is_active: boolean
  direction?: string
}
```

### Server Power-Up State

```typescript
interface ServerPowerUpState {
  id: string
  x: number
  y: number
  type: 'sos' | 'time_steal' | 'shield' | 'double_points'
  is_active: boolean
}
```

### Arena State Broadcast

```typescript
interface ArenaStateBroadcast {
  hazards: ServerHazardState[]
  traps: ServerTrapState[]
  doors: ServerDoorState[]
  platforms: ServerPlatformState[]
  barriers: ServerBarrierState[]
  powerups: ServerPowerUpState[]
  buffs: Record<string, ServerBuffState[]>
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Barrier damage validation
*For any* damage event applied to a barrier, the server SHALL validate the damage amount is positive and update health correctly (new_health = max(0, old_health - damage)).
**Validates: Requirements 1.1**

### Property 2: Barrier destruction event generation
*For any* barrier whose health reaches zero after damage, the server SHALL generate exactly one destruction event containing the barrier ID.
**Validates: Requirements 1.2**

### Property 3: Barrier state consistency
*For any* barrier in the system, get_state() SHALL return the current position, health, and active status matching the internal state.
**Validates: Requirements 1.3**

### Property 4: Barrier collision detection
*For any* position and radius, check_collision SHALL return a barrier ID if and only if the circle intersects an active barrier's bounds.
**Validates: Requirements 1.4**

### Property 5: Power-up collection radius
*For any* player position within a power-up's collection radius, check_collection SHALL return the power-up for collection.
**Validates: Requirements 2.2**

### Property 6: Power-up single collection
*For any* power-up that is collected, subsequent collection checks SHALL return None until the power-up respawns.
**Validates: Requirements 2.3**

### Property 7: Buff application tracking
*For any* buff applied to a player, the buff manager SHALL store the type, value, and expiration time, and get_active_buffs SHALL include it.
**Validates: Requirements 3.1**

### Property 8: Buff expiration removal
*For any* buff whose expiration time has passed, update() SHALL remove it from active buffs and return it in the expired list.
**Validates: Requirements 3.2**

### Property 9: Damage multiplier calculation
*For any* player with a damage_boost buff, get_damage_multiplier SHALL return 1.0 + buff_value.
**Validates: Requirements 3.3**

### Property 10: Door state broadcast completeness
*For any* door in the system, get_state() SHALL return id, state, progress, and is_blocking fields.
**Validates: Requirements 4.1**

### Property 11: Platform state broadcast completeness
*For any* platform in the system, get_state() SHALL return id, x, y, and velocity fields.
**Validates: Requirements 4.2**

### Property 12: Arena state completeness
*For any* call to get_arena_state(), the result SHALL include state from all arena managers (hazards, traps, doors, platforms, barriers, powerups).
**Validates: Requirements 5.4**

### Property 13: Pressure plate door trigger
*For any* door linked to a pressure plate trigger, when trigger_door is called with the trigger ID, the linked door SHALL change state.
**Validates: Requirements 4.4**

## Error Handling

### Server-Side
- Invalid barrier ID: Log warning, return None/no-op
- Invalid damage amount (negative): Clamp to 0, log warning
- Invalid power-up type: Reject spawn, log error
- Missing player for buff: Initialize player state, then apply

### Client-Side
- Missing barrier in sync: Create new barrier from server state
- Missing power-up in sync: Create new power-up from server state
- Stale state: Always prefer server state over local predictions

## Testing Strategy

### Dual Testing Approach

**Unit Tests:**
- Barrier damage calculation edge cases
- Power-up collection radius boundary conditions
- Buff expiration timing edge cases
- Arena state serialization format

**Property-Based Tests:**
- Use `hypothesis` library for Python backend tests
- Each correctness property implemented as a separate property test
- Minimum 100 iterations per property test
- Tag format: `**Feature: arena-server-authority-audit, Property {N}: {description}**`

### Test File Locations
- Backend: `backend/tests/property/test_arena_authority.py`
- Frontend: `frontend/src/game/__tests__/arena-sync.test.ts`

