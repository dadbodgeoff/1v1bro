# Bot AI System Audit - Deep Analysis

## Executive Summary

The bot AI system is a sophisticated multi-layered architecture designed to create human-like opponent behavior. However, there are several critical issues causing the bot to appear "stuck" or unresponsive. This audit identifies race conditions, state machine deadlocks, and coordination failures between subsystems.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ARENA.TSX (Game Loop)                          │
│  - Calls BotMatchManager.update() every frame                               │
│  - Applies collision detection to bot movement                              │
│  - Handles bot shooting with LOS checks                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BOT MATCH MANAGER                                  │
│  - Manages match state (waiting/playing/ended)                              │
│  - Tracks player position, velocity, health                                 │
│  - Updates visibility (simplified - no raycasting)                          │
│  - Builds BotMatchContext and calls BotPlayer.update()                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BOT PLAYER                                      │
│  - Wraps CombatConductor                                                    │
│  - Converts BotMatchContext → BotInput                                      │
│  - Applies movement from BotOutput                                          │
│  - Tracks health, ammo, score                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMBAT CONDUCTOR                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        SUBSYSTEMS                                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │   │
│  │  │ Aggression   │  │ Mercy        │  │ Signature Move           │  │   │
│  │  │ Curve        │  │ System       │  │ Tracker                  │  │   │
│  │  │ (wave-based) │  │ (backs off)  │  │ (special combos)         │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │   │
│  │  │ Tactics      │  │ Engagement   │  │ Combat Flow              │  │   │
│  │  │ Library      │  │ Composer     │  │ Analyzer                 │  │   │
│  │  │ (patterns)   │  │ (phrases)    │  │ (player tracking)        │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │   │
│  │  │ Aim          │  │ Spatial      │  │ Tactical                 │  │   │
│  │  │ Controller   │  │ Awareness    │  │ Navigator                │  │   │
│  │  │ (human aim)  │  │ (cover/LOS)  │  │ (lanes/angles)           │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  STATE MACHINE: PATROL → ENGAGE → RETREAT → REPOSITION → EXECUTING_SIGNATURE│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Critical Issues Identified

### 🔴 ISSUE 1: State Machine Deadlock in EXECUTING_SIGNATURE

**Location:** `CombatConductor.ts` lines 180-190, `TacticalNavigator.ts` line 165

**Problem:**
When the bot enters `EXECUTING_SIGNATURE` state:
1. `TacticalNavigator.update()` returns `createIdleOutput()` (no movement)
2. `executePattern()` checks `navOutput.currentAction !== 'idle'` - fails
3. Falls through to pattern-based movement
4. But signature patterns like `hold-angle`, `hold-crouch` have `movementPath: 'none'`
5. Bot sits still for up to 3 seconds (timeout)

**Flow Diagram:**
```
┌─────────────────┐
│ Signature       │
│ Triggers        │
│ (10% chance)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ State =         │
│ EXECUTING_      │
│ SIGNATURE       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ TacticalNav     │────▶│ Returns IDLE    │
│ .update()       │     │ (no movement)   │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ executePattern  │
                        │ gets signature  │
                        │ pattern         │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ Pattern type =  │
                        │ HOLD            │
                        │ speed = 0       │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ BOT SITS STILL  │
                        │ FOR 3 SECONDS   │
                        └─────────────────┘
```

**Fix Required:**
- Signature patterns should include movement phases
- Or TacticalNavigator should provide movement during signatures
- Or reduce signature trigger rate further (currently 10%)

---

### 🔴 ISSUE 2: Dual Navigation Systems Conflict

**Location:** `CombatConductor.ts` (uses both NavigationGraph AND TacticalNavigator)

**Problem:**
There are TWO separate navigation systems that don't coordinate:

1. **NavigationGraph** (`NavigationGraph.ts`)
   - Waypoint-based pathfinding
   - Used by `getPatrolMovement()` in CombatConductor
   - World coordinates (e.g., `wp_w_center` at -12, 0.5, 0)

2. **TacticalNavigator** (`TacticalNavigator.ts` + `MapTactics.ts`)
   - Lane-based tactical movement
   - Uses grid coordinates (0-35 X, 0-39 Z)
   - Converts via `gridToWorld(gridX, gridZ) = (gridX - 18 + 0.5, 0, gridZ - 20 + 0.5)`

**Conflict Scenario:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    CombatConductor.conduct()                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: navOutput = tacticalNavigator.update(...)               │
│         Returns: { currentAction: 'idle', targetPosition: 0,0,0 }│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 7: executePattern() checks navOutput                        │
│         navOutput.currentAction === 'idle' → skip navigator      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Priority 2: if (PATROL && !playerVisible)                        │
│             return getPatrolMovement() ← Uses NavigationGraph    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ getPatrolMovement() picks random waypoint from NavigationGraph   │
│ But bot might be at a TacticalNavigator grid position            │
│ → Coordinates don't align → Bot oscillates or gets stuck         │
└─────────────────────────────────────────────────────────────────┘
```

**Fix Required:**
- Unify navigation systems OR
- Remove NavigationGraph and use only TacticalNavigator OR
- Ensure TacticalNavigator ALWAYS returns non-idle output

---

### 🔴 ISSUE 3: TacticalNavigator Returns Idle Too Often

**Location:** `TacticalNavigator.ts` `handleEngageOrPatrol()`

**Problem:**
The decision tree has too many paths that lead to `createIdleOutput()`:

```typescript
handleEngageOrPatrol(ctx, now) {
  // Path 1: Has active push lane → executeLane ✓
  // Path 2: Has active angle → executeAngle ✓
  
  // Decision point:
  if (mercyActive) {
    // Try sniper angle
    const angle = findNearestSmartAngle(ctx.botPosition, 'sniper');
    if (angle) { ... } // ✓
    // Try defensive lane
    const defensiveLane = selectPushingLane(ctx, true);
    if (defensiveLane) { ... } // ✓
    return createIdleOutput(); // ← IDLE if no angle or lane found
  }
  
  if (aggression < 0.4 && healthRatio > 0.5) {
    const angle = findNearestSmartAngle(ctx.botPosition, 'sniper');
    if (angle) { ... } // ✓
    // Falls through if no sniper angle found
  }
  
  if (aggression > 0.5 || playerVisible) {
    const lane = selectPushingLane(ctx, mercyActive);
    if (lane) { ... } // ✓
    // Falls through if no lane found
  }
  
  // Default: patrol angle
  const patrolAngle = findNearestSmartAngle(ctx.botPosition);
  if (patrolAngle) { ... } // ✓
  
  // NEW: Fallback lane (added in recent fix)
  const fallbackLane = selectPushingLane(ctx, mercyActive);
  if (fallbackLane) { ... } // ✓
  
  return createIdleOutput(); // ← STILL POSSIBLE if all fail
}
```

**Why All Can Fail:**
1. `findNearestSmartAngle()` - Only 7 angles defined, bot might be far from all
2. `selectPushingLane()` - Requires matching `botSide`, `aggression` range, etc.
3. Bot spawns at corner, no angles or lanes match initial conditions

---

### 🟡 ISSUE 4: Visibility Check is Too Simple

**Location:** `BotMatchManager.ts` `updateVisibility()`

```typescript
private updateVisibility(): void {
  // ...
  this.playerVisible = distance < 30 && distance > 0.5;
}
```

**Problem:**
- No wall/obstacle checking
- Bot thinks player is visible through train, walls, etc.
- Causes bot to stay in ENGAGE state when it shouldn't
- Bot tries to shoot through walls

**Impact:**
- State machine stays in ENGAGE instead of transitioning to PATROL
- Bot doesn't use patrol movement because `playerVisible = true`

---

### 🟡 ISSUE 5: Lane Selection Conditions Too Restrictive

**Location:** `MapTactics.ts` `selectPushingLane()`

**Problem:**
Lane triggers have strict requirements:

```typescript
// West Side Sweep
trigger: {
  botSide: 'west',      // Bot must be on west side
  minAggression: 0.5,   // Aggression must be >= 0.5
}

// Needle Threader
trigger: {
  botSide: 'west',
  playerSide: 'east',   // Player must be on opposite side
  minAggression: 0.7,   // High aggression required
}

// Platform King
trigger: {
  botSide: 'east',
  maxAggression: 0.6,   // Low aggression required
}
```

**Scenario Where No Lane Matches:**
- Bot spawns at NW corner (west side)
- Player is also on west side
- Aggression starts at 0.5 (base for duelist)
- `West Side Sweep` requires minAggression 0.5 ✓ but...
- Bot is at spawn, not near any lane starting waypoint
- Lane waypoints start at grid (4, 8) = world (-13.5, -11.5)
- Bot spawn might be at (-14, -12) - close but not exact

---

### 🟡 ISSUE 6: Angle Hold Duration Expires → Idle

**Location:** `TacticalNavigator.ts` `executeAngle()`

```typescript
// Check if hold duration expired
const holdElapsed = now - this.state.angleStartedAt;
if (holdElapsed >= angle.holdDuration) {
  this.clearAngle();
  return this.createIdleOutput(); // ← Returns IDLE after angle expires
}
```

**Problem:**
When an angle's hold duration expires (3-5 seconds), the navigator returns idle for one frame before `handleEngageOrPatrol` picks a new action. This causes a brief "stutter" in movement.

---

## Data Flow Analysis

### Complete Update Cycle

```
Frame N:
┌──────────────────────────────────────────────────────────────────────────────┐
│ Arena.tsx gameLoop()                                                          │
│ └─► botManagerRef.current.update(deltaMs, playerPos, playerVel, playerHealth) │
└──────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ BotMatchManager.update()                                                      │
│ ├─► Update player tracking (position, velocity, health)                       │
│ ├─► Update time remaining                                                     │
│ ├─► updateVisibility() → sets this.playerVisible (SIMPLIFIED - NO RAYCASTING)│
│ ├─► Build BotMatchContext                                                     │
│ └─► this.bot.update(deltaMs, context)                                         │
└──────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ BotPlayer.update()                                                            │
│ ├─► Update visibility tracking (lastSeenPosition, lastSeenTime)               │
│ ├─► buildInput() → Convert BotMatchContext to BotInput                        │
│ ├─► this.conductor.conduct(input, deltaMs) → Get BotOutput                    │
│ ├─► applyMovement(output, deltaMs) → Update position/velocity                 │
│ └─► Handle shooting/reload                                                    │
└──────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ CombatConductor.conduct()                                                     │
│ ├─► 1. Calculate aggression (AggressionCurve + modifiers)                     │
│ ├─► 2. Check mercy system (MercySystem.update())                              │
│ ├─► 3. Update state machine (PATROL/ENGAGE/RETREAT/REPOSITION/SIGNATURE)      │
│ ├─► 4. Check cover (SpatialAwareness)                                         │
│ ├─► 5. Update TacticalNavigator → Get navOutput                               │
│ ├─► 6. Select pattern (SignatureTracker or EngagementComposer or TacticsLib)  │
│ ├─► 7. Execute pattern → Get movement direction/speed                         │
│ ├─► 8. Update aim (AimController)                                             │
│ ├─► 9. Decide shooting                                                        │
│ └─► 10. Build and return BotOutput                                            │
└──────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ Back in Arena.tsx:                                                            │
│ ├─► Get bot position after BotPlayer.update()                                 │
│ ├─► Apply collision detection (testCapsule against CollisionWorld)            │
│ ├─► Correct position if collision detected                                    │
│ ├─► Update bot visual (BotVisualController)                                   │
│ └─► Handle bot shooting (separate from AI - uses LOS raycasting)              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## State Machine Analysis

### State Transitions

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
              ┌──────────┐                                    │
     ┌───────▶│  PATROL  │◀────────────────────────┐         │
     │        └────┬─────┘                         │         │
     │             │                               │         │
     │             │ playerVisible                 │         │
     │             ▼                               │         │
     │        ┌──────────┐                         │         │
     │        │  ENGAGE  │◀────────────────┐      │         │
     │        └────┬─────┘                 │      │         │
     │             │                       │      │         │
     │             │ healthRatio < 0.3     │      │         │
     │             │ && aggression < 0.5   │      │         │
     │             ▼                       │      │         │
     │        ┌──────────┐                 │      │         │
     │        │ RETREAT  │                 │      │         │
     │        └────┬─────┘                 │      │         │
     │             │                       │      │         │
     │             │ healthRatio > 0.5     │      │         │
     │             │ || aggression > 0.7   │      │         │
     │             ▼                       │      │         │
     │        ┌────────────┐               │      │         │
     │        │ REPOSITION │───────────────┘      │         │
     │        └────────────┘  playerVisible       │         │
     │             │          && healthRatio > 0.4│         │
     │             │                              │         │
     │             │ !playerVisible               │         │
     │             │ && timeSinceLastSeen > 3000  │         │
     │             │                              │         │
     └─────────────┴──────────────────────────────┘         │
                                                            │
                                                            │
              ┌───────────────────┐                         │
              │ EXECUTING_        │                         │
              │ SIGNATURE         │─────────────────────────┘
              └───────────────────┘  !isExecuting || elapsed > 3000
                      ▲
                      │
                      │ signature triggers
                      │ (10% chance when conditions met)
                      │
              ┌───────┴───────┐
              │    ENGAGE     │
              └───────────────┘
```

### Deadlock Scenario

```
1. Bot in ENGAGE state
2. Signature triggers (10% chance)
3. State → EXECUTING_SIGNATURE
4. TacticalNavigator returns IDLE (doesn't handle signatures)
5. executePattern gets signature pattern (e.g., 'hold-angle')
6. Pattern type = HOLD, movementPath = 'none'
7. Movement direction = (0, 0, 0), speed = 0
8. Bot doesn't move for 3 seconds (timeout)
9. State → ENGAGE or PATROL
10. Repeat...
```

---

## Recommended Fixes

### Priority 1: Ensure TacticalNavigator Never Returns Idle

```typescript
// TacticalNavigator.ts - handleEngageOrPatrol()

// BEFORE (can return idle):
return this.createIdleOutput();

// AFTER (always provide movement):
private handleEngageOrPatrol(ctx: LaneSelectionContext, now: number): NavigatorOutput {
  // ... existing logic ...
  
  // FINAL FALLBACK: Move toward map center if nothing else works
  const mapCenter = new Vector3(0, 0, 0);
  const toCenter = new Vector3()
    .subVectors(mapCenter, ctx.botPosition);
  
  if (toCenter.length() > 2) {
    return {
      targetPosition: mapCenter,
      speedMultiplier: 0.5,
      shouldPrefire: false,
      shouldCrouch: false,
      aimOverride: null,
      currentAction: 'navigating',
      debug: { laneName: 'fallback_center', waypointIndex: 0, angleName: null },
    };
  }
  
  // At center, pick random direction
  const randomAngle = Math.random() * Math.PI * 2;
  const randomTarget = new Vector3(
    Math.cos(randomAngle) * 10,
    0,
    Math.sin(randomAngle) * 10
  );
  
  return {
    targetPosition: randomTarget,
    speedMultiplier: 0.4,
    shouldPrefire: false,
    shouldCrouch: false,
    aimOverride: null,
    currentAction: 'navigating',
    debug: { laneName: 'fallback_random', waypointIndex: 0, angleName: null },
  };
}
```

### Priority 2: Remove NavigationGraph, Use Only TacticalNavigator

```typescript
// CombatConductor.ts - executePattern()

// REMOVE this block:
// Priority 2: If in PATROL state and player not visible, use waypoint navigation
if (this.currentState === 'PATROL' && !input.playerVisible) {
  return this.getPatrolMovement(input.botPosition, now);
}

// INSTEAD: Let TacticalNavigator handle all navigation
// TacticalNavigator should always return valid movement
```

### Priority 3: Add Movement to Signature Patterns

```typescript
// SignatureMoveTracker.ts - SIGNATURE_MOVES

// BEFORE:
{
  id: 'angle-hold',
  patterns: ['hold-angle', 'peek-slow', 'hold-crouch'], // All stationary
}

// AFTER:
{
  id: 'angle-hold',
  patterns: ['strafe-left', 'hold-angle', 'strafe-right', 'peek-slow'], // Include movement
}
```

### Priority 4: Add Proper Visibility Raycasting

```typescript
// BotMatchManager.ts - updateVisibility()

private updateVisibility(): void {
  // ... existing distance check ...
  
  // Add raycast check (requires CollisionWorld reference)
  if (this.collisionWorld) {
    const botPos = this.bot.getPosition();
    const botEye = new Vector3(botPos.x, botPos.y + 1.6, botPos.z);
    const playerEye = new Vector3(
      this.playerPosition.x,
      this.playerPosition.y + 1.6,
      this.playerPosition.z
    );
    
    const toPlayer = playerEye.subtract(botEye).normalize();
    const rayResult = this.collisionWorld.raycast(botEye, toPlayer, distance);
    
    // Player visible only if no wall blocks LOS
    this.playerVisible = distance < 30 && (!rayResult || rayResult.distance > distance);
  }
}
```

### Priority 5: Relax Lane Trigger Conditions

```typescript
// MapTactics.ts - PUSHING_LANES

// Add a "universal" lane that always matches:
{
  id: 'patrol_sweep',
  name: 'Patrol Sweep',
  type: 'push',
  trigger: {
    // No side requirements
    // No aggression requirements
  },
  waypoints: [
    { gridX: 18, gridZ: 10, pauseMs: 0, action: 'move' },
    { gridX: 18, gridZ: 30, pauseMs: 0, action: 'move' },
    { gridX: 18, gridZ: 20, pauseMs: 500, action: 'scan' },
  ],
  combatStyle: 'cautious',
}
```

---

## Testing Checklist

After implementing fixes, verify:

- [ ] Bot moves immediately after spawn (no 3+ second delay)
- [ ] Bot follows lanes/angles when player not visible
- [ ] Bot transitions smoothly between states
- [ ] Bot doesn't get stuck in EXECUTING_SIGNATURE
- [ ] Bot doesn't oscillate between positions
- [ ] Bot respects collision (doesn't walk through walls)
- [ ] Bot shoots only when player is actually visible (LOS check)
- [ ] Debug HUD shows changing states (not stuck on one)

---

## Files to Modify

| File | Changes |
|------|---------|
| `TacticalNavigator.ts` | Add fallback movement, never return idle |
| `CombatConductor.ts` | Remove NavigationGraph usage, trust TacticalNavigator |
| `SignatureMoveTracker.ts` | Add movement patterns to signatures |
| `MapTactics.ts` | Add universal fallback lane |
| `BotMatchManager.ts` | Add CollisionWorld for visibility raycasting |

---

## Conclusion

The bot AI system is architecturally sound but has coordination issues between subsystems. The primary problem is that multiple systems can return "do nothing" simultaneously, causing the bot to freeze. The fix is to ensure at least one system always provides valid movement, with TacticalNavigator being the authoritative source.

The secondary issue is the dual navigation system (NavigationGraph vs TacticalNavigator) which should be unified to prevent conflicts.

With these fixes, the bot should exhibit smooth, human-like movement patterns that make it feel like a real opponent.
