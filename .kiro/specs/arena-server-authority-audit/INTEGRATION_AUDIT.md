# Arena Server Authority - Full-Stack Integration Audit

## Audit Date: December 8, 2025

---

## 🔴 CRITICAL ISSUES (blocks deployment)

### 1. Missing Frontend WebSocket Types for Barriers
- **Issue**: `frontend/src/types/websocket.ts` does NOT define:
  - `BarrierDamagedPayload`
  - `BarrierDestroyedPayload`
  - `ArenaStatePayload` is incomplete (missing barriers, powerups, buffs)
- **Backend**: `WSEventType.BARRIER_DAMAGED`, `BARRIER_DESTROYED` exist
- **Impact**: Frontend cannot type-safely handle barrier events

### 2. Missing Frontend WebSocket Types for Buffs
- **Issue**: `frontend/src/types/websocket.ts` does NOT define:
  - `BuffAppliedPayload`
  - `BuffExpiredPayload`
- **Backend**: `WSEventType.BUFF_APPLIED`, `BUFF_EXPIRED` exist
- **Impact**: Frontend cannot type-safely handle buff events

### 3. Missing Frontend Event Handlers for Barriers/PowerUps/Buffs
- **Issue**: `useArenaEvents.ts` does NOT subscribe to:
  - `arena_barrier_damaged`
  - `arena_barrier_destroyed`
  - `arena_state` (full state sync)
  - `buff_applied`
  - `buff_expired`
- **Impact**: Client never receives barrier/buff state updates

### 4. ArenaStatePayload Schema Mismatch
- **Frontend** `ArenaStatePayload` has:
  ```typescript
  hazards: Array<{...}>
  traps: Array<{...}>
  ```
- **Backend** `build_arena_state()` sends:
  ```python
  hazards, traps, doors, platforms, barriers, powerups, buffs
  ```
- **Impact**: Frontend ignores doors, platforms, barriers, powerups, buffs

---

## 🟡 WARNINGS (fix before production)

### 1. No Client-Side Arena State Handler Wired
- Task 6.3 incomplete: Frontend needs to listen for `ARENA_STATE` events
- `useArenaEvents.ts` should call `BarrierManager.applyServerState()` and `PowerUpManager.applyServerState()`

### 2. PowerUp Collection Not Server-Validated in Frontend
- `usePowerUpEvents.ts` handles `powerup_spawn` and `powerup_collected`
- But `PowerUpManager.ts` still has client-side collection logic
- Should defer to server for collection validation

### 3. Missing Door/Platform State Sync in Frontend
- Backend sends door/platform state in `arena_state`
- Frontend `DoorSystem.ts` has `applyServerDoorState()` but it's not wired
- Frontend `MovingPlatformSystem.ts` has `applyServerPlatformState()` but it's not wired

### 4. Buff State Not Applied to Client BuffManager
- `BuffManager.ts` has `setFromServer()` method
- But `useCombatEvents.ts` doesn't call it with buff state from `state_update`

---

## ✅ VERIFIED CONTRACTS

### Backend Arena Systems → WebSocket Events
```
[ServerArenaSystems.get_arena_state()]
  → hazards: HazardManager.get_state()
  → traps: TrapManager.get_state()
  → doors: DoorManager.get_state()
  → platforms: PlatformManager.get_state()
  → barriers: BarrierManager.get_state()
  → powerups: PowerUpManager.get_state()
```

### Backend Event Types → Message Builders
```
[WSEventType.ARENA_STATE] → build_arena_state()
[WSEventType.ARENA_EVENT] → build_arena_event()
[WSEventType.BARRIER_DAMAGED] → build_barrier_damaged()
[WSEventType.BARRIER_DESTROYED] → build_barrier_destroyed()
[WSEventType.BUFF_APPLIED] → build_buff_applied()
[WSEventType.BUFF_EXPIRED] → build_buff_expired()
```

### Backend Tick System → Arena State Broadcast
```
[tick_system._broadcast_state()]
  → payload["arena"] = game.arena_systems.get_arena_state()
  → payload["buffs"] = game.buff_manager.get_buff_state_for_broadcast()
  → Broadcasts arena_events via get_and_clear_events()
```

### Property Tests (40 passing)
- Property 1-4: Barrier damage, destruction, state, collision ✅
- Property 5-6: PowerUp collection radius, single collection ✅
- Property 7-9: Buff application, expiration, damage multiplier ✅
- Property 10-11: Door/Platform state completeness ✅
- Property 12: Arena state completeness ✅
- Property 13: Pressure plate door trigger ✅

---

## 📋 MISSING ELEMENTS

### Frontend Types (frontend/src/types/websocket.ts)
```typescript
// ADD THESE:
export interface BarrierDamagedPayload {
  barrier_id: string
  damage: number
  health: number
  max_health: number
  source_player_id?: string
}

export interface BarrierDestroyedPayload {
  barrier_id: string
  source_player_id?: string
}

export interface BuffAppliedPayload {
  player_id: string
  buff_type: string
  value: number
  duration: number
  source: string
}

export interface BuffExpiredPayload {
  player_id: string
  buff_type: string
}

// UPDATE ArenaStatePayload:
export interface ArenaStatePayload {
  hazards: Array<{...}>
  traps: Array<{...}>
  doors: Array<{
    id: string
    state: string
    progress: number
    is_blocking: boolean
  }>
  platforms: Array<{
    id: string
    x: number
    y: number
    velocity_x: number
    velocity_y: number
  }>
  barriers: Array<{
    id: string
    x: number
    y: number
    width: number
    height: number
    type: string
    health: number
    max_health: number
    is_active: boolean
    direction?: string
  }>
  powerups: Array<{
    id: string
    x: number
    y: number
    type: string
    radius: number
    is_active: boolean
  }>
  buffs: Record<string, Array<{
    type: string
    value: number
    remaining: number
    source: string
  }>>
}
```

### Frontend Event Handlers (useArenaEvents.ts)
```typescript
// ADD subscriptions for:
wsService.on('arena_state', (payload) => {
  // Apply to BarrierManager, PowerUpManager, DoorSystem, etc.
})
wsService.on('arena_barrier_damaged', (payload) => {...})
wsService.on('arena_barrier_destroyed', (payload) => {...})
wsService.on('buff_applied', (payload) => {...})
wsService.on('buff_expired', (payload) => {...})
```

---

## 🚀 SAFE TO DEPLOY (Backend Only)

The following backend systems are fully implemented and tested:

1. **BarrierManager** (`backend/app/game/arena/barriers.py`)
   - Server-authoritative collision detection
   - Damage validation and destruction events
   - State broadcast

2. **PowerUpManager** (`backend/app/game/arena/powerups.py`)
   - Server-authoritative spawn/collection
   - Collection radius validation
   - Single-collection enforcement

3. **WebSocket Events** (`backend/app/websocket/events.py`)
   - ARENA_STATE, ARENA_EVENT
   - BARRIER_DAMAGED, BARRIER_DESTROYED
   - BUFF_APPLIED, BUFF_EXPIRED

4. **Arena Handler** (`backend/app/websocket/handlers/arena.py`)
   - broadcast_arena_state()
   - broadcast_arena_events()

5. **Tick System Integration** (`backend/app/game/tick_system.py`)
   - Arena state included in state_update
   - Buff state included in state_update
   - Arena events broadcast

---

## RECOMMENDED FIX ORDER

1. **Add missing TypeScript interfaces** to `frontend/src/types/websocket.ts`
2. **Update ArenaStatePayload** to include all fields
3. **Add event handlers** in `useArenaEvents.ts` for barriers, buffs
4. **Wire arena state sync** to call `applyServerState()` on managers
5. **Wire buff state sync** to call `setFromServer()` on BuffManager
6. **Test end-to-end** with Docker stack

---

## COMMANDS TO VERIFY

```bash
# Run backend property tests
python -m pytest backend/tests/property/test_arena_authority.py -v

# Check TypeScript compilation
cd frontend && npx tsc --noEmit

# Full stack test
docker compose down
docker system prune -af --volumes
docker compose up --build
```
