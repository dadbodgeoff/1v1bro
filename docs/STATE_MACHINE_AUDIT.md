# Loading/Ready State Machine Audit

## Executive Summary

The survival game has **4 overlapping state machines** that manage "readiness" and game phases. This creates complexity when debugging "why doesn't the game start?" scenarios.

---

## The 4 State Machines

### 1. LoadingOrchestrator (`core/LoadingOrchestrator.ts`)

**Purpose:** Tracks asset loading and subsystem initialization

**Stages:**
```typescript
type LoadingStage = 
  | 'idle'
  | 'initializing'
  | 'loading-critical'    // Track, obstacles, character (parallel)
  | 'loading-secondary'   // Celestials, city (parallel, non-blocking)
  | 'initializing-systems' // Physics, audio, etc.
  | 'warming-up'          // First frame render, shader compilation
  | 'ready'
  | 'countdown'
  | 'running'
  | 'error'
```

**Key Readiness Checks:**
- `criticalReady`: All critical subsystems loaded (renderer, track, obstacles, character, physics, audio)
- `secondaryReady`: All secondary subsystems loaded (celestials, city, particles)
- `warmupComplete`: First frame rendered, shaders compiled
- `isReadyForCountdown()`: `criticalReady && warmupComplete`
- `isFullyReady()`: `criticalReady && secondaryReady && warmupComplete`

**Transitions:**
```
idle → initializing → loading-critical → loading-secondary → warming-up → ready → countdown → running
                                                                              ↓
                                                                            error
```

---

### 2. GameStateManager (`engine/GameStateManager.ts`)

**Purpose:** Tracks game phase for gameplay logic

**Phases:**
```typescript
type GamePhase = 'loading' | 'ready' | 'running' | 'paused' | 'gameover'
```

**Key Methods:**
- `setPhase(phase)`: Direct phase setter
- `isRunning()`: Returns `phase === 'running'`
- `getPhase()`: Returns current phase

**Transitions:**
```
loading → ready → running ↔ paused
                    ↓
                 gameover
```

---

### 3. TransitionSystem (`effects/TransitionSystem.ts`)

**Purpose:** Visual transitions and time scaling (countdown, death, respawn)

**Phases:**
```typescript
type TransitionPhase = 
  | 'none'
  | 'fade-in'
  | 'countdown'
  | 'go-flash'
  | 'death-slowmo'
  | 'death-fade'
  | 'respawn'
  | 'fade-out'
```

**Key Methods:**
- `isGamePaused()`: Returns `true` during countdown, death-slowmo, death-fade
- `isTransitioning()`: Returns `phase !== 'none'`
- `getTimeScale()`: Returns time multiplier (0-1) for slow-mo effects

**Transitions:**
```
none → fade-in → none
none → countdown → go-flash → none (triggers onCountdownComplete)
none → death-slowmo → death-fade → none (triggers onDeathComplete)
none → respawn → none
none → fade-out → none
```

---

### 4. useSurvivalGame Hook (`hooks/useSurvivalGame.ts`)

**Purpose:** React state for UI rendering

**State Variables:**
```typescript
const [isLoading, setIsLoading] = useState(true)
const [isReadyToStart, setIsReadyToStart] = useState(false)
```

**Derivation:**
- `isLoading`: Set to `false` after `engine.initialize()` completes
- `isReadyToStart`: Set from `engine.isReadyToStart()` OR when `loadingProgress.stage === 'ready' | 'running'`

---

## How They Interact (The Flow)

### Game Initialization Flow

```
1. useSurvivalGame creates SurvivalEngine
   └─ isLoading = true, isReadyToStart = false

2. SurvivalEngine.initialize() called
   └─ LoadingOrchestrator.start() → stage = 'initializing'
   └─ LoadingOrchestrator.startCriticalLoading() → stage = 'loading-critical'
   └─ Assets load in parallel, markReady() called for each
   └─ LoadingOrchestrator.startSecondaryLoading() → stage = 'loading-secondary'
   └─ LoadingOrchestrator.startWarmup() → stage = 'warming-up'
   └─ LoadingOrchestrator.completeWarmup() → stage = 'ready'

3. After initialize() resolves:
   └─ GameStateManager.setPhase('ready')
   └─ useSurvivalGame: isLoading = false, isReadyToStart = engine.isReadyToStart()
```

### Game Start Flow

```
1. User clicks "Start" → useSurvivalGame.start() → engine.start()

2. RunManager.start() checks:
   └─ loadingOrchestrator.isReadyForCountdown()
   
3. If ready:
   └─ loadingOrchestrator.startCountdown() → stage = 'countdown'
   └─ transitionSystem.startCountdown() → phase = 'countdown'
   └─ TransitionSystem ticks: 3 → 2 → 1 → 'GO'
   └─ TransitionSystem.onCountdownComplete callback fires
   └─ RunManager.onCountdownComplete():
       └─ loadingOrchestrator.startRunning() → stage = 'running'
       └─ stateManager.setPhase('running')

4. If NOT ready (fallback):
   └─ loadingOrchestrator.startRunning() → stage = 'running'
   └─ stateManager.setPhase('running')
   └─ (skips countdown)
```

### Game Loop Checks

```typescript
// In SurvivalEngine.fixedUpdate():
const isRunning = this.stateManager.isRunning()        // GameStateManager
const isGamePaused = this.transitionSystem.isGamePaused()  // TransitionSystem

if (!isRunning || isGamePaused) return  // Skip physics update
```

---

## The Problem: "Why Doesn't The Game Start?"

When debugging, you need to check ALL of these:

| Check | Location | What to Look For |
|-------|----------|------------------|
| 1. Hook state | `useSurvivalGame` | `isLoading`, `isReadyToStart` |
| 2. Loading stage | `LoadingOrchestrator` | `getStage()`, `isReadyForCountdown()` |
| 3. Game phase | `GameStateManager` | `getPhase()` |
| 4. Transition phase | `TransitionSystem` | `getPhase()`, `isGamePaused()` |

### Common Failure Scenarios

1. **"Ready but won't start"**
   - LoadingOrchestrator: `stage = 'ready'`
   - GameStateManager: `phase = 'ready'`
   - TransitionSystem: `phase = 'countdown'` (stuck in countdown)
   - **Cause:** Countdown callback never fired

2. **"Stuck on loading"**
   - LoadingOrchestrator: `stage = 'loading-critical'`
   - **Cause:** A subsystem never called `markReady()`

3. **"Game running but frozen"**
   - GameStateManager: `phase = 'running'`
   - TransitionSystem: `isGamePaused() = true` (death-slowmo)
   - **Cause:** Death animation never completed

4. **"UI shows ready but engine isn't"**
   - useSurvivalGame: `isReadyToStart = true` (from progress callback)
   - LoadingOrchestrator: `isReadyForCountdown() = false`
   - **Cause:** Progress callback fired before warmup complete

---

## Recommendations

### Option A: Unified State Machine (Recommended)

Create a single `GameStateMachine` that owns all phases:

```typescript
type UnifiedPhase = 
  | 'idle'
  | 'loading'
  | 'loading-secondary'  // Non-blocking
  | 'ready'
  | 'countdown'
  | 'running'
  | 'paused'
  | 'death-animation'
  | 'respawn-animation'
  | 'gameover'

class GameStateMachine {
  private phase: UnifiedPhase = 'idle'
  
  // Single source of truth
  canStart(): boolean { return this.phase === 'ready' }
  isPlaying(): boolean { return this.phase === 'running' }
  isPaused(): boolean { return ['countdown', 'death-animation', 'respawn-animation', 'paused'].includes(this.phase) }
}
```

**Pros:**
- Single source of truth
- Clear state transitions
- Easy to debug

**Cons:**
- Large refactor
- Need to migrate all consumers

### Option B: State Coordinator (Medium Effort)

Add a coordinator that derives unified state from existing systems:

```typescript
class StateCoordinator {
  constructor(
    private loadingOrchestrator: LoadingOrchestrator,
    private stateManager: GameStateManager,
    private transitionSystem: TransitionSystem
  ) {}
  
  getUnifiedState(): UnifiedState {
    // Derive from all three systems
    if (this.loadingOrchestrator.getStage() !== 'ready' && 
        this.loadingOrchestrator.getStage() !== 'running') {
      return 'loading'
    }
    if (this.transitionSystem.isGamePaused()) {
      return this.transitionSystem.getPhase() as UnifiedState
    }
    return this.stateManager.getPhase()
  }
  
  canStart(): boolean {
    return this.loadingOrchestrator.isReadyForCountdown() &&
           this.stateManager.getPhase() === 'ready' &&
           !this.transitionSystem.isTransitioning()
  }
}
```

**Pros:**
- Non-breaking change
- Single query point
- Easy to add

**Cons:**
- Still have 4 systems
- Coordinator can get out of sync

### Option C: Debug Helper (Quick Win)

Add a debug method to SurvivalEngine:

```typescript
getStateDebug(): StateDebug {
  return {
    loading: {
      stage: this.loadingOrchestrator.getStage(),
      criticalReady: this.loadingOrchestrator.isReadyForCountdown(),
      fullyReady: this.loadingOrchestrator.isFullyReady(),
    },
    game: {
      phase: this.stateManager.getPhase(),
      isRunning: this.stateManager.isRunning(),
    },
    transition: {
      phase: this.transitionSystem.getPhase(),
      isPaused: this.transitionSystem.isGamePaused(),
      isTransitioning: this.transitionSystem.isTransitioning(),
    },
    canStart: this.loadingOrchestrator.isReadyForCountdown() &&
              this.stateManager.getPhase() === 'ready' &&
              !this.transitionSystem.isTransitioning(),
  }
}
```

**Pros:**
- Zero refactor
- Immediate debugging help
- Can add to dev tools

**Cons:**
- Doesn't fix the underlying complexity

---

## Immediate Action Items

1. **Add `getStateDebug()` method** to SurvivalEngine (Option C) - 30 min
2. **Document state transitions** in code comments - 1 hour
3. **Add console warnings** when state machines disagree - 30 min
4. **Consider Option B** for next sprint - 4-8 hours

---

## State Transition Diagram

```
                                    ┌─────────────────────────────────────────────────────────┐
                                    │                    LoadingOrchestrator                   │
                                    │  idle → init → critical → secondary → warmup → ready    │
                                    │                                              ↓          │
                                    │                                          countdown      │
                                    │                                              ↓          │
                                    │                                           running       │
                                    └─────────────────────────────────────────────────────────┘
                                                              ↓
                                    ┌─────────────────────────────────────────────────────────┐
                                    │                    GameStateManager                      │
                                    │           loading → ready → running ↔ paused            │
                                    │                              ↓                          │
                                    │                           gameover                       │
                                    └─────────────────────────────────────────────────────────┘
                                                              ↓
                                    ┌─────────────────────────────────────────────────────────┐
                                    │                    TransitionSystem                      │
                                    │  none ↔ fade-in                                         │
                                    │  none ↔ countdown → go-flash                            │
                                    │  none ↔ death-slowmo → death-fade                       │
                                    │  none ↔ respawn                                         │
                                    │  none ↔ fade-out                                        │
                                    └─────────────────────────────────────────────────────────┘
                                                              ↓
                                    ┌─────────────────────────────────────────────────────────┐
                                    │                    useSurvivalGame                       │
                                    │              isLoading: true → false                     │
                                    │           isReadyToStart: false → true                   │
                                    └─────────────────────────────────────────────────────────┘
```

---

## Files Involved

| File | State Machine | Role |
|------|---------------|------|
| `core/LoadingOrchestrator.ts` | LoadingOrchestrator | Asset loading, subsystem readiness |
| `engine/GameStateManager.ts` | GameStateManager | Game phase (ready/running/paused/gameover) |
| `effects/TransitionSystem.ts` | TransitionSystem | Visual transitions, time scaling |
| `hooks/useSurvivalGame.ts` | React state | UI state (isLoading, isReadyToStart) |
| `engine/SurvivalEngine.ts` | Coordinator | Orchestrates all systems |
| `engine/RunManager.ts` | Consumer | Uses all systems for start/restart |
