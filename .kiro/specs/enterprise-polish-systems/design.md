# Design Document: Enterprise Polish Systems

## Overview

This design specifies a suite of cross-cutting polish systems that enhance user experience across all major application pages (Dashboard, Settings, Profile, Battlepass, Item Shop, Coins, Achievements, Leaderboard, Friends). The architecture follows a provider-based pattern using React Context, with centralized state management via Zustand stores. Each system is designed to be independently toggleable, accessibility-compliant, and performance-conscious.

The systems integrate with the existing `FeedbackSystem` class (used in survival mode) and extend its patterns to the broader application. Framer Motion handles animations, while the existing settings infrastructure manages user preferences.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           App.tsx                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    PolishProvider                            │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │   │
│  │  │ Transition   │ │ Celebration  │ │ Ambient Effect       │ │   │
│  │  │ Manager      │ │ System       │ │ Renderer             │ │   │
│  │  └──────────────┘ └──────────────┘ └──────────────────────┘ │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │   │
│  │  │ Haptic       │ │ Cinematic    │ │ Easter Egg           │ │   │
│  │  │ Engine       │ │ Controller   │ │ Registry             │ │   │
│  │  └──────────────┘ └──────────────┘ └──────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                    ┌─────────┴─────────┐                            │
│                    │  polishStore      │                            │
│                    │  (Zustand)        │                            │
│                    └───────────────────┘                            │
└─────────────────────────────────────────────────────────────────────┘
```

### System Dependencies

```
polishStore (settings) ──► All Systems
useSettings hook ◄──────── polishStore (sync)
FeedbackSystem ◄────────── HapticEngine (extends patterns)
framer-motion ◄─────────── TransitionManager, CelebrationSystem, CinematicController
```

## Components and Interfaces

### 1. PolishProvider

Root provider that initializes all polish systems and provides context.

```typescript
interface PolishContextValue {
  // System instances
  transitionManager: TransitionManager
  celebrationSystem: CelebrationSystem
  hapticEngine: HapticEngine
  ambientRenderer: AmbientEffectRenderer
  cinematicController: CinematicController
  easterEggRegistry: EasterEggRegistry
  
  // Quick access to settings
  settings: PolishSettings
  updateSettings: (updates: Partial<PolishSettings>) => void
}

interface PolishSettings {
  hapticFeedback: boolean
  ambientEffects: boolean
  celebrationAnimations: boolean
  reducedMotion: boolean  // Synced from accessibility settings
}
```

### 2. TransitionManager

Handles animated page transitions with route-specific configurations.

```typescript
type TransitionType = 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'zoom' | 'morph' | 'none'

interface TransitionConfig {
  type: TransitionType
  duration: number  // ms
  easing: string    // CSS easing function
}

interface RouteTransitionMap {
  [fromRoute: string]: {
    [toRoute: string]: TransitionConfig
  }
}

interface TransitionManager {
  // Get transition config for route pair
  getTransition(from: string, to: string): TransitionConfig
  
  // Check if transition is in progress
  isTransitioning: boolean
  
  // Navigation direction for back/forward
  direction: 'forward' | 'back'
  
  // Loading state for slow pages
  showLoading: boolean
}
```

### 3. CelebrationSystem

Manages reward animations, fanfares, and celebration queuing.

```typescript
type CelebrationType = 'purchase' | 'tier-up' | 'achievement' | 'milestone' | 'daily-reward'

interface Celebration {
  id: string
  type: CelebrationType
  data: CelebrationData
  priority: number
  timestamp: number
}

interface CelebrationData {
  title: string
  subtitle?: string
  icon?: string
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
  rewards?: RewardItem[]
}

interface CelebrationSystem {
  // Queue a celebration
  queue(celebration: Omit<Celebration, 'id' | 'timestamp'>): void
  
  // Skip current celebration
  skip(): void
  
  // Current celebration being displayed
  current: Celebration | null
  
  // Remaining queue
  queueLength: number
  
  // Is a celebration currently showing
  isActive: boolean
}
```

### 4. HapticEngine

Extends existing FeedbackSystem patterns for UI-wide haptic feedback.

```typescript
type UIHapticPattern = 'light' | 'medium' | 'success' | 'warning' | 'error'

interface HapticEngine {
  // Trigger haptic feedback
  trigger(pattern: UIHapticPattern): void
  
  // Check if haptics are supported
  isSupported: boolean
  
  // Check if haptics are enabled
  isEnabled: boolean
}

// Action-to-pattern mapping
const HAPTIC_MAPPINGS: Record<string, UIHapticPattern> = {
  'button-primary': 'medium',
  'button-secondary': 'light',
  'toggle': 'light',
  'success': 'success',
  'error': 'warning',
  'navigation': 'light',
  'purchase': 'success',
  'unlock': 'success',
}
```

### 5. AmbientEffectRenderer

Renders seasonal particle effects with performance awareness.

```typescript
type AmbientTheme = 'winter' | 'autumn' | 'spring' | 'summer' | 'celebration' | 'none'

interface ParticleConfig {
  type: 'snow' | 'leaves' | 'petals' | 'confetti' | 'sparkles'
  count: number
  speed: number
  size: [number, number]  // min, max
  opacity: [number, number]
  colors: string[]
}

interface AmbientEffectRenderer {
  // Current theme
  theme: AmbientTheme
  
  // Set theme
  setTheme(theme: AmbientTheme): void
  
  // Performance-adjusted particle count
  effectiveParticleCount: number
  
  // Is rendering active
  isActive: boolean
  
  // Render mode based on settings
  renderMode: 'animated' | 'static' | 'disabled'
}

// Pages where ambient effects are disabled for performance
const HEAVY_PAGES = ['/game', '/survival', '/shop']  // 3D content pages
```

### 6. CinematicController

Full-screen achievement unlock cinematics with queue management.

```typescript
interface AchievementCinematic {
  id: string
  achievementId: string
  icon: string
  name: string
  description: string
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum'
  xpReward?: number
}

type CinematicState = 'idle' | 'entering' | 'displaying' | 'exiting'

interface CinematicController {
  // Queue an achievement cinematic
  queueAchievement(achievement: AchievementCinematic): void
  
  // Skip current cinematic
  skip(): void
  
  // Current state
  state: CinematicState
  
  // Current cinematic
  current: AchievementCinematic | null
  
  // Queue info
  queueLength: number
  
  // Display mode based on accessibility
  displayMode: 'fullscreen' | 'toast'
}
```

### 7. EasterEggRegistry

Hidden interaction tracking and trigger system.

```typescript
interface EasterEgg {
  id: string
  name: string
  hint: string
  trigger: EasterEggTrigger
  reward?: EasterEggReward
}

type EasterEggTrigger = 
  | { type: 'konami' }  // Up up down down left right left right B A
  | { type: 'click-sequence'; target: string; count: number }
  | { type: 'key-sequence'; keys: string[] }
  | { type: 'secret-url'; path: string }

interface EasterEggReward {
  type: 'cosmetic' | 'title' | 'badge' | 'animation'
  id: string
}

interface EasterEggRegistry {
  // Check if easter egg is discovered
  isDiscovered(id: string): boolean
  
  // Get all discovered easter eggs
  discovered: string[]
  
  // Register input for sequence detection
  registerInput(input: string): void
  
  // Current sequence progress (for multi-input triggers)
  sequenceProgress: Map<string, number>
}
```

## Data Models

### Polish Settings (extends existing settings)

```typescript
interface PolishSettingsData {
  haptic_feedback: boolean
  ambient_effects: boolean
  celebration_animations: boolean
  // reduced_motion already exists in accessibility settings
}

// Default values
const DEFAULT_POLISH_SETTINGS: PolishSettingsData = {
  haptic_feedback: true,
  ambient_effects: true,
  celebration_animations: true,
}
```

### Celebration Queue Item

```typescript
interface QueuedCelebration {
  id: string
  type: CelebrationType
  data: CelebrationData
  priority: number  // Higher = shown first
  timestamp: number
  status: 'pending' | 'active' | 'completed' | 'skipped'
}
```

### Easter Egg Discovery Record

```typescript
interface EasterEggDiscovery {
  eggId: string
  discoveredAt: string  // ISO timestamp
  triggerMethod: string
}
```

### Route Transition Configuration

```typescript
// Default transitions between route categories
const ROUTE_TRANSITIONS: RouteTransitionMap = {
  '/dashboard': {
    '/profile': { type: 'slide-left', duration: 300, easing: 'ease-out' },
    '/settings': { type: 'slide-left', duration: 300, easing: 'ease-out' },
    '/shop': { type: 'zoom', duration: 400, easing: 'ease-in-out' },
    '/battlepass': { type: 'slide-up', duration: 350, easing: 'ease-out' },
    '*': { type: 'fade', duration: 250, easing: 'ease' },
  },
  '*': {
    '*': { type: 'fade', duration: 200, easing: 'ease' },
  },
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Transition type lookup consistency
*For any* route pair (from, to), the TransitionManager SHALL return a valid TransitionConfig with type, duration > 0, and non-empty easing string.
**Validates: Requirements 1.1**

### Property 2: Loading indicator timing threshold
*For any* page transition where data fetching exceeds 200ms, the loading indicator SHALL be visible; for fetches under 200ms, it SHALL NOT be visible.
**Validates: Requirements 1.2**

### Property 3: Back navigation reverses transition direction
*For any* forward navigation from route A to route B, pressing back SHALL trigger a transition with reversed direction (e.g., slide-left becomes slide-right).
**Validates: Requirements 1.3**

### Property 4: Reduced motion disables all animations
*For any* polish system operation, WHEN reduced_motion is enabled, animation duration SHALL be 0 or display mode SHALL be 'static'/'toast'.
**Validates: Requirements 1.5, 2.6, 4.4, 5.6**

### Property 5: Navigation blocked during transition
*For any* navigation attempt while isTransitioning is true, the navigation SHALL be queued or rejected, not executed immediately.
**Validates: Requirements 1.6**

### Property 6: Trigger type maps to celebration type
*For any* reward trigger event (purchase, tier-up, achievement), the CelebrationSystem SHALL queue a celebration with the corresponding type.
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 7: Celebration queue ordering
*For any* set of simultaneously triggered celebrations, they SHALL be displayed in priority order, then timestamp order, with exactly 500ms gap between completions.
**Validates: Requirements 2.4**

### Property 8: Skip advances celebration queue
*For any* active celebration, calling skip() SHALL immediately transition to 'completed' status and begin the next queued celebration if present.
**Validates: Requirements 2.5**

### Property 9: Audio volume respects settings
*For any* celebration with audio, the playback volume SHALL equal master_volume * sfx_volume (normalized 0-1).
**Validates: Requirements 2.7**

### Property 10: Action type maps to haptic pattern
*For any* UI action (button tap, toggle, success, error, navigation), the HapticEngine SHALL trigger the pattern defined in HAPTIC_MAPPINGS.
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.7**

### Property 11: Disabled haptics trigger nothing
*For any* haptic trigger call, WHEN haptic_feedback setting is false, no vibration API call SHALL be made.
**Validates: Requirements 3.5**

### Property 12: Unsupported haptics fail gracefully
*For any* haptic trigger call on a device without vibration support, no exception SHALL be thrown and the call SHALL return silently.
**Validates: Requirements 3.6**

### Property 13: Theme maps to particle configuration
*For any* active AmbientTheme (except 'none'), the renderer SHALL produce a ParticleConfig with the corresponding particle type and non-zero count.
**Validates: Requirements 4.1**

### Property 14: Disabled ambient effects render nothing
*For any* render cycle, WHEN ambient_effects setting is false, effectiveParticleCount SHALL be 0.
**Validates: Requirements 4.2**

### Property 15: Performance scaling reduces particles
*For any* performance score below threshold (e.g., < 0.5), effectiveParticleCount SHALL be at most 50% of the configured count.
**Validates: Requirements 4.3**

### Property 16: Heavy pages disable ambient effects
*For any* page in HEAVY_PAGES list, isActive SHALL be false regardless of ambient_effects setting.
**Validates: Requirements 4.5**

### Property 17: Cinematic contains achievement data
*For any* queued achievement cinematic, the displayed content SHALL include the achievement's icon, name, and description.
**Validates: Requirements 5.1**

### Property 18: Cinematic entrance duration in range
*For any* cinematic entrance animation, duration SHALL be between 800ms and 1200ms inclusive.
**Validates: Requirements 5.2**

### Property 19: Input during cinematic triggers skip
*For any* user input (tap, keypress) while cinematic state is 'displaying', state SHALL transition to 'exiting'.
**Validates: Requirements 5.3**

### Property 20: Multiple achievements queue correctly
*For any* set of N simultaneously unlocked achievements, the cinematic queue SHALL contain exactly N items in unlock order.
**Validates: Requirements 5.4**

### Property 21: Queue indicator matches queue length
*For any* non-empty cinematic queue, the displayed queue indicator count SHALL equal queueLength.
**Validates: Requirements 5.5**

### Property 22: Easter egg sequence activates correctly
*For any* registered easter egg with a trigger sequence, completing that exact sequence SHALL activate the easter egg.
**Validates: Requirements 6.1**

### Property 23: Easter egg discovery is recorded
*For any* easter egg activation, the user's discovered list SHALL contain that egg's ID after activation.
**Validates: Requirements 6.2**

### Property 24: Discovered eggs skip discovery animation
*For any* easter egg trigger where isDiscovered(id) is true, the animation type SHALL be 'repeat' not 'discovery'.
**Validates: Requirements 6.3**

### Property 25: Sequence resets after timeout
*For any* partial easter egg sequence, after 3000ms of no input, sequenceProgress for that egg SHALL reset to 0.
**Validates: Requirements 6.5**

### Property 26: Settings changes apply immediately
*For any* polish setting change, the corresponding system's behavior SHALL reflect the new value without page refresh.
**Validates: Requirements 7.2**

### Property 27: Cross-page animation consistency
*For any* celebration type triggered on different pages, the animation configuration (duration, easing, effects) SHALL be identical.
**Validates: Requirements 8.2**

## Error Handling

### Graceful Degradation

1. **Haptic API unavailable**: HapticEngine detects support on init, silently skips calls if unsupported
2. **Animation frame drops**: AmbientEffectRenderer monitors FPS, reduces particle count dynamically
3. **Audio context blocked**: CelebrationSystem catches audio errors, continues without sound
4. **Storage quota exceeded**: EasterEggRegistry falls back to session storage for discoveries

### Error States

```typescript
interface PolishSystemError {
  system: 'transition' | 'celebration' | 'haptic' | 'ambient' | 'cinematic' | 'easter-egg'
  code: string
  message: string
  recoverable: boolean
}
```

### Recovery Strategies

- **Transition stuck**: Auto-complete after 2x configured duration
- **Celebration queue overflow**: Cap at 10 items, drop lowest priority
- **Ambient performance degradation**: Progressive particle reduction, then disable
- **Cinematic audio failure**: Continue visual-only

## Testing Strategy

### Property-Based Testing

The implementation SHALL use `fast-check` (already in devDependencies) for property-based testing. Each correctness property SHALL have a corresponding property test.

Test file structure:
```
frontend/src/systems/polish/__tests__/
├── TransitionManager.property.test.ts
├── CelebrationSystem.property.test.ts
├── HapticEngine.property.test.ts
├── AmbientEffectRenderer.property.test.ts
├── CinematicController.property.test.ts
└── EasterEggRegistry.property.test.ts
```

Each property test SHALL:
1. Be annotated with the property number and requirements reference
2. Use fast-check arbitraries to generate test inputs
3. Run minimum 100 iterations
4. Test the property assertion across all generated inputs

### Unit Testing

Unit tests SHALL cover:
- Component rendering with various prop combinations
- Hook behavior and state management
- Edge cases identified in requirements (empty queues, disabled states)
- Integration with existing settings system

### Integration Testing

Integration tests SHALL verify:
- PolishProvider correctly initializes all systems
- Settings changes propagate to all systems
- Systems work correctly when composed together
- No performance regression on target pages
