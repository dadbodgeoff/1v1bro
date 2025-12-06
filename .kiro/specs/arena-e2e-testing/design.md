# Arena AAA System End-to-End Testing - Design Document

## Overview

This document outlines the technical design for comprehensive end-to-end testing of the AAA Arena Upgrade system. The E2E test suite validates that all arena subsystems (barriers, hazards, traps, transport, zones, collision, rendering) work correctly when integrated together.

The testing approach uses:
- **Vitest** as the test runner (already configured in the project)
- **fast-check** for property-based testing (already used in existing tests)
- **Mock canvas context** for render testing
- **Player simulation helpers** for testing arena interactions

All tests follow the established patterns from existing arena tests (`arena.test.ts`, `barriers.test.ts`).

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           E2E Test Suite                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        Test Utilities                                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │   Player    │  │   Arena     │  │   Event     │  │   Canvas    │    │   │
│  │  │  Simulator  │  │   Factory   │  │  Recorder   │  │    Mock     │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│  ┌───────────────────────────────────┼───────────────────────────────────────┐ │
│  │                           Test Categories                                  │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │ Integration │  │  Scenario   │  │  Property   │  │   State     │     │ │
│  │  │   Tests     │  │   Tests     │  │   Tests     │  │   Tests     │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                          │
│  ┌───────────────────────────────────┼───────────────────────────────────────┐ │
│  │                        Systems Under Test                                  │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │   Arena     │  │   Barrier   │  │   Hazard    │  │    Trap     │     │ │
│  │  │  Manager    │  │   Manager   │  │   Manager   │  │   Manager   │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │  Transport  │  │    Zone     │  │   Spatial   │  │   Layer     │     │ │
│  │  │   Manager   │  │   Manager   │  │    Hash     │  │   Manager   │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
frontend/src/game/
├── __tests__/
│   └── e2e/
│       ├── arena-e2e.test.ts           # Main E2E test file
│       ├── helpers/
│       │   ├── PlayerSimulator.ts      # Player movement simulation
│       │   ├── ArenaFactory.ts         # Test arena creation
│       │   ├── EventRecorder.ts        # Event capture for assertions
│       │   └── CanvasMock.ts           # Canvas context mock
│       └── scenarios/
│           └── gameplay-scenarios.test.ts  # Complete gameplay scenarios
```

## Components and Interfaces

### Test Utilities

#### PlayerSimulator

```typescript
/**
 * Simulates player movement and interactions for E2E testing
 */
export interface PlayerSimulator {
  id: string
  position: Vector2
  velocity: Vector2
  
  // Movement
  moveTo(position: Vector2): void
  moveBy(delta: Vector2): void
  
  // State
  getPosition(): Vector2
  setPosition(position: Vector2): void
  
  // For arena update calls
  toPlayerMap(): Map<string, Vector2>
}

export function createPlayerSimulator(id: string, startPosition: Vector2): PlayerSimulator
```

#### ArenaFactory

```typescript
/**
 * Creates configured ArenaManager instances for testing
 */
export interface ArenaFactory {
  // Create with default NEXUS_ARENA config
  createDefault(): ArenaManager
  
  // Create with custom config
  createWithConfig(config: MapConfig): ArenaManager
  
  // Create minimal arena for focused tests
  createMinimal(options: MinimalArenaOptions): ArenaManager
}

export interface MinimalArenaOptions {
  barriers?: BarrierConfig[]
  hazards?: HazardConfig[]
  traps?: TrapConfig[]
  teleporters?: TeleporterConfig[]
  jumpPads?: JumpPadConfig[]
}
```

#### EventRecorder

```typescript
/**
 * Records arena events for assertion in tests
 */
export interface EventRecorder {
  // Recorded events
  barrierDestroyed: Array<{ barrierId: string; position: Vector2 }>
  trapTriggered: Array<{ trapId: string; affectedPlayers: string[] }>
  playerTeleported: Array<{ playerId: string; from: Vector2; to: Vector2 }>
  playerLaunched: Array<{ playerId: string; direction: Vector2 }>
  hazardDamage: Array<{ playerId: string; damage: number; sourceId: string }>
  
  // Utility methods
  clear(): void
  getCallbacks(): ArenaCallbacks
  hasEvent(type: string, predicate: (event: any) => boolean): boolean
}
```

#### CanvasMock

```typescript
/**
 * Mock canvas context for render testing
 */
export interface CanvasMock {
  ctx: CanvasRenderingContext2D
  operations: RenderOperation[]
  
  // Assertions
  hasDrawnInLayer(layer: RenderLayer): boolean
  getOperationsInOrder(): RenderOperation[]
  clear(): void
}

export interface RenderOperation {
  type: 'fillRect' | 'strokeRect' | 'arc' | 'beginPath' | 'fill' | 'stroke' | etc
  args: any[]
  timestamp: number
}
```

## Data Models

### Test Configuration Types

```typescript
// Minimal map config for focused testing
export interface TestMapConfig extends MapConfig {
  // All fields from MapConfig, with sensible defaults
}

// Player state for simulation
export interface SimulatedPlayer {
  id: string
  position: Vector2
  velocity: Vector2
  health: number
  effects: EffectState
}

// Test scenario definition
export interface TestScenario {
  name: string
  setup: () => ArenaManager
  players: SimulatedPlayer[]
  steps: ScenarioStep[]
  assertions: ScenarioAssertion[]
}

export interface ScenarioStep {
  type: 'move' | 'wait' | 'damage_barrier' | 'update'
  params: Record<string, any>
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following correctness properties will be tested:

### Property 1: Arena Initialization Completeness
*For any* valid map configuration, loading it into ArenaManager SHALL result in all subsystems being initialized with the correct data from the configuration.
**Validates: Requirements 1.1, 1.3, 1.4**

### Property 2: Map Validation Error Handling
*For any* invalid map configuration (wrong dimensions, unpaired teleporters, invalid metadata), loading SHALL throw a descriptive error without partially initializing subsystems.
**Validates: Requirements 1.5**

### Property 3: Barrier Collision Resolution
*For any* player position that overlaps with an active barrier, resolveCollision() SHALL return a position that is outside all barrier bounds. After a destructible barrier is destroyed, the same position SHALL no longer collide.
**Validates: Requirements 2.1, 2.2, 2.5**

### Property 4: One-Way Barrier Directionality
*For any* one-way barrier with direction D, approaching from the opposite direction SHALL be blocked, while approaching from direction D SHALL allow passage.
**Validates: Requirements 2.3, 2.4**

### Property 5: Hazard Effect Application
*For any* player position inside a hazard zone, the player's EffectState SHALL include the corresponding effect type with the correct intensity value.
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 6: Hazard Effect Removal
*For any* player that moves from inside a hazard zone to outside, the effect from that specific zone SHALL be removed from the player's EffectState.
**Validates: Requirements 3.4**

### Property 7: Multi-Hazard Effect Aggregation
*For any* player in multiple hazard zones, same-type effects SHALL use only the strongest value (no stacking), while different-type effects SHALL all be applied simultaneously.
**Validates: Requirements 3.5, 8.1, 8.2, 8.3**

### Property 8: Trap State Machine
*For any* trap, triggering SHALL transition it to 'triggered' then 'cooldown' state. After cooldown duration elapses, the trap SHALL return to 'armed' state.
**Validates: Requirements 4.1, 4.5, 4.6**

### Property 9: Teleporter Round-Trip
*For any* teleporter pair (A, B), teleporting from A SHALL arrive at B's position, and teleporting from B SHALL arrive at A's position (bidirectional).
**Validates: Requirements 5.1, 5.5**

### Property 10: Teleporter Cooldown
*For any* player that teleports, attempting to use the same teleporter before cooldown expires SHALL return null. After cooldown expires, teleportation SHALL succeed.
**Validates: Requirements 5.2, 5.3**

### Property 11: Jump Pad Launch Vector
*For any* jump pad with direction D and force F, launching a player SHALL return a velocity vector in direction D with magnitude F.
**Validates: Requirements 6.1**

### Property 12: Jump Pad Cooldown
*For any* player that is launched, attempting to use the same jump pad before cooldown expires SHALL return null.
**Validates: Requirements 6.2, 6.3**

### Property 13: Event Callback Propagation
*For any* arena event (barrier destroyed, trap triggered, player teleported, hazard damage), the corresponding callback registered with ArenaManager SHALL be invoked with correct parameters.
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

### Property 14: Spatial Hash Query Completeness
*For any* query position and radius, all barriers whose bounds intersect the query area SHALL be returned. Destroyed barriers SHALL not be returned.
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

### Property 15: Render Layer Ordering
*For any* render call, layers SHALL be rendered in strictly ascending order (0 through 6), and elements registered to a layer SHALL only render when that layer is visible.
**Validates: Requirements 10.5**

### Property 16: State Consistency Invariant
*For any* sequence of arena operations (updates, damage, teleports, etc.), all subsystem states SHALL remain internally consistent with no dangling references to destroyed objects.
**Validates: Requirements 12.1, 12.2, 12.3, 12.4**

## Error Handling

### Test Failure Reporting
- Clear assertion messages indicating which property failed
- Include relevant state snapshots (player positions, effect states)
- Log event sequences leading to failure

### Edge Case Handling
- Arena boundary positions (0, 0) and (1279, 719)
- Rapid state changes (multiple events per frame)
- Empty configurations (no barriers, no hazards)
- Maximum configurations (all slots filled)

## Testing Strategy

### Dual Testing Approach

The E2E test suite uses both unit tests and property-based tests:

**Unit Tests (Examples)**
- Specific gameplay scenarios with known outcomes
- Edge cases at arena boundaries
- Render layer visibility toggles
- Arena reset functionality

**Property-Based Tests**
- All 16 correctness properties above
- Generated map configurations
- Random player positions and movements
- Concurrent multi-player interactions

### Testing Framework

- **Test Runner**: Vitest (configured in vite.config.ts)
- **Property Testing**: fast-check (already used in project)
- **Assertions**: Vitest expect() with custom matchers
- **Mocking**: Vitest vi.fn() for callbacks and canvas

### Test Organization

```typescript
// arena-e2e.test.ts structure
describe('Arena E2E Tests', () => {
  describe('Property 1: Arena Initialization Completeness', () => {
    it('initializes all subsystems from valid config', () => { ... })
  })
  
  describe('Property 2: Map Validation Error Handling', () => {
    it('throws on invalid config', () => { ... })
  })
  
  // ... properties 3-16
  
  describe('Gameplay Scenarios', () => {
    it('player navigates through hazards and teleports', () => { ... })
    it('player destroys barrier and passes through', () => { ... })
    it('multiple players interact simultaneously', () => { ... })
  })
})
```

### Property Test Configuration

Each property-based test should run a minimum of 100 iterations:

```typescript
fc.assert(
  fc.property(/* arbitraries */, (/* generated values */) => {
    // Test logic
  }),
  { numRuns: 100 }
)
```

### Test Annotations

Each property-based test MUST be tagged with:
```typescript
/**
 * **Feature: arena-e2e-testing, Property {number}: {property_text}**
 * **Validates: Requirements X.Y**
 */
```

## Integration Points

### With Existing Test Infrastructure

| Component | Integration |
|-----------|-------------|
| Vitest | Use existing configuration from vite.config.ts |
| fast-check | Import from existing dependency |
| Test setup | Extend src/test/setup.ts if needed |
| Type definitions | Import from arena/types.ts |

### With Arena Systems

| System | Test Approach |
|--------|---------------|
| ArenaManager | Direct instantiation and method calls |
| BarrierManager | Access via ArenaManager or direct for focused tests |
| HazardManager | Access via ArenaManager.update() and getPlayerEffects() |
| TrapManager | Trigger via player positions and time simulation |
| TransportManager | Test via checkTeleport() and checkJumpPad() |
| ZoneManager | Verify via getPlayerEffects() aggregation |
| SpatialHash | Query via ArenaManager collision methods |
| LayerManager | Test via render() with mock canvas |

## Performance Considerations

- Tests should complete in < 30 seconds total
- Property tests limited to 100 iterations each
- Avoid expensive setup in hot paths
- Use minimal arena configs where possible
- Pool test objects where beneficial

