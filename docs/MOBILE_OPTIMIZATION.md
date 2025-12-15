# Survival Mode Mobile Optimization

Enterprise-grade mobile optimization system for the Survival Runner game mode.

## Recent Updates (December 2024)

- **ParticleSystem**: Now scales pool sizes and emission rates based on quality profile
- **SurvivalHUD**: Responsive scaling with safe area support and compact mode for mobile
- **InputBuffer**: Uses device-specific buffer duration from mobile config
- **PhysicsController**: Uses device-specific coyote time from mobile config
- **SurvivalLoadingScreen**: Responsive layout with safe area padding and device-specific tips
- **useSurvivalGame**: Auto-requests fullscreen, wake lock, and orientation lock on mobile
- **Test Coverage**: Added comprehensive mobile configuration tests

## Architecture Overview

The mobile optimization system consists of four main modules:

### 1. Device Detection (`config/device.ts`)

Detects and classifies device capabilities:

- **Device Type**: `mobile` | `tablet` | `desktop`
- **Performance Tier**: `low` | `medium` | `high` | `ultra`
- **Input Mode**: `touch` | `keyboard` | `gamepad` | `hybrid`

Key features:
- Hardware capability detection (GPU tier, memory, WebGL support)
- Touch capability detection (multi-touch, max touch points)
- Safe area inset detection for notched devices
- Connection type detection for adaptive loading
- Reduced motion preference detection

```typescript
import { getDeviceCapabilities, isMobileDevice, getPerformanceTier } from './config/device'

const caps = getDeviceCapabilities()
console.log(caps.deviceType)      // 'mobile' | 'tablet' | 'desktop'
console.log(caps.performanceTier) // 'low' | 'medium' | 'high' | 'ultra'
console.log(caps.touchSupported)  // boolean
```

### 2. Quality Settings (`config/quality.ts`)

Adaptive quality profiles based on device capabilities:

- **Renderer Quality**: Pixel ratio, antialiasing, shadows, tone mapping
- **Particle Quality**: Max particles, effect types enabled
- **Space Quality**: Star count, nebula, celestials, shooting stars
- **Physics Quality**: Fixed timestep, collision precision
- **Animation Quality**: Camera shake, dynamic FOV, speed lines
- **Audio Quality**: Spatial audio, concurrent sounds

```typescript
import { getQualityProfile, setQualityTier, setAutoQualityAdjust } from './config/quality'

// Get current profile
const profile = getQualityProfile()

// Manually set quality
setQualityTier('medium')

// Enable auto-adjustment based on FPS
setAutoQualityAdjust(true)
```

### 3. Mobile Configuration (`config/mobile.ts`)

Mobile-specific settings:

- **Touch Zones**: Configurable tap/swipe zones for controls
- **UI Scaling**: HUD, button, text, and icon scaling
- **Game Balance**: Speed, obstacle gaps, hitbox tolerance adjustments
- **Feature Flags**: Gyroscope, vibration, wake lock, fullscreen

```typescript
import { getMobileConfig, getResponsiveValue } from './config/mobile'

const config = getMobileConfig()
console.log(config.touch.swipeThreshold)  // Swipe detection threshold
console.log(config.ui.hudScale)           // HUD scaling factor
console.log(config.balance.speedMultiplier) // Speed adjustment for touch
```

### 4. Touch Controller (`engine/TouchController.ts`)

Advanced touch input handling:

- Multi-touch gesture recognition
- Swipe detection with velocity
- Zone-based tap handling
- Haptic feedback integration
- Visual touch indicators

```typescript
import { TouchController } from './engine/TouchController'

const touch = new TouchController()
touch.attach(container)
touch.onInput((action) => console.log('Input:', action))
touch.onGesture((gesture) => console.log('Gesture:', gesture))
```

## React Hooks

### useMobileOptimization

Main hook for mobile features:

```typescript
import { useMobileOptimization } from './hooks/useMobileOptimization'

function GameComponent() {
  const {
    isMobile,
    isTouch,
    qualityTier,
    setQuality,
    requestFullscreen,
    requestWakeLock,
  } = useMobileOptimization()

  // Use in component
}
```

### useQualityFeatures

Quality-aware feature flags:

```typescript
import { useQualityFeatures } from './hooks/useMobileOptimization'

function EffectsComponent() {
  const { particlesEnabled, cameraShake, speedLines } = useQualityFeatures()
  
  // Conditionally render effects
}
```

## Components

### TouchControlsOverlay

Visual touch control zones:

```tsx
import { TouchControlsOverlay } from './components/TouchControlsOverlay'

<TouchControlsOverlay
  visible={isMobile}
  opacity={0.3}
  showLabels={true}
  showFeedback={true}
/>
```

## Quality Presets

| Feature | Low | Medium | High | Ultra |
|---------|-----|--------|------|-------|
| Pixel Ratio | 1 | 1.5 | 2 | 3 |
| Antialiasing | ❌ | ✅ | ✅ | ✅ |
| Shadows | ❌ | ❌ | ✅ | ✅ |
| Max Particles | 200 | 500 | 1000 | 2000 |
| Star Count | 500 | 1000 | 2000 | 3000 |
| Nebula | ❌ | ✅ | ✅ | ✅ |
| Shooting Stars | ❌ | ✅ | ✅ | ✅ |
| Camera Shake | ❌ | ✅ | ✅ | ✅ |
| Speed Lines | ❌ | ❌ | ✅ | ✅ |
| Physics Hz | 30 | 60 | 60 | 60 |

## Mobile Balance Adjustments

| Setting | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Speed Multiplier | 0.9x | 0.95x | 1.0x |
| Obstacle Gap | 1.15x | 1.1x | 1.0x |
| Hitbox Tolerance | 15% | 10% | 5% |
| Input Buffer | 200ms | 175ms | 150ms |
| Coyote Time | 150ms | 125ms | 100ms |

## Viewport Management

The `ViewportManager` handles:

- Safe area insets for notched devices
- Orientation change handling
- Fullscreen API integration
- Wake lock for preventing screen sleep
- CSS custom property injection

```typescript
import { getViewportManager, requestFullscreen, requestWakeLock } from './core/ViewportManager'

// Request fullscreen for immersive gameplay
await requestFullscreen()

// Prevent screen sleep during gameplay
await requestWakeLock()
```

## CSS Variables

The system injects CSS variables for responsive styling:

```css
:root {
  --safe-area-top: 0px;
  --safe-area-right: 0px;
  --safe-area-bottom: 34px;  /* iPhone notch */
  --safe-area-left: 0px;
  --viewport-width: 390px;
  --viewport-height: 844px;
  --visual-viewport-height: 844px;
  --viewport-scale: 1;
}

/* Device type classes */
.device-mobile { }
.device-tablet { }
.device-desktop { }

/* Orientation classes */
.orientation-portrait { }
.orientation-landscape { }

/* Touch device class */
.touch-device { }
```

## Best Practices

1. **Always use configuration getters** instead of hardcoded values
2. **Subscribe to quality changes** for runtime adjustments
3. **Test on real devices** - emulators don't capture all behaviors
4. **Respect reduced motion preferences** for accessibility
5. **Use wake lock** during active gameplay to prevent interruptions
6. **Handle orientation changes** gracefully with proper UI adjustments

## File Structure

```
frontend/src/survival/
├── config/
│   ├── device.ts       # Device detection
│   ├── quality.ts      # Quality profiles
│   ├── mobile.ts       # Mobile configuration
│   ├── constants.ts    # Updated to use config system
│   └── index.ts        # Exports
├── engine/
│   ├── TouchController.ts  # Touch input handling
│   └── InputController.ts  # Updated with touch support
├── core/
│   └── ViewportManager.ts  # Viewport/fullscreen management
├── hooks/
│   └── useMobileOptimization.ts  # React hooks
├── components/
│   └── TouchControlsOverlay.tsx  # Touch UI component
└── renderer/
    └── SurvivalRenderer.ts  # Updated with quality system
```


## System Integration Details

### ParticleSystem Quality Integration

The `ParticleSystem` now dynamically scales based on the quality profile:

```typescript
// Pool sizes scale with quality tier
const QUALITY_MULTIPLIERS = {
  low: 0.3,    // 30% of base pool sizes
  medium: 0.6, // 60% of base pool sizes
  high: 1.0,   // 100% of base pool sizes
  ultra: 1.5,  // 150% of base pool sizes
}

// Emission counts also scale with quality
const scaledCount = Math.max(1, Math.floor(count * qualityMultiplier))
```

Features:
- Subscribes to quality changes for runtime adjustment
- Rebuilds pools when quality tier changes significantly
- Respects `particles.enabled` flag to completely disable on low-end devices

### HUD Responsive Scaling

The `SurvivalHUD` component uses mobile config for responsive behavior:

```typescript
const { isMobile, isTablet, mobileConfig, viewportState } = useMobileOptimization()

// Scale factor from mobile config
const scale = mobileConfig.ui.hudScale
const isCompact = mobileConfig.ui.compactMode

// Safe area padding
const safeTop = Math.max(safeArea.top, ui.hudMargin)
```

Features:
- Scales HUD elements based on device type
- Applies safe area padding for notched devices
- Compact mode hides non-essential UI on small screens
- Shows touch control hints on mobile devices

### Input Buffer Device-Specific Timing

The `InputBuffer` uses mobile config for buffer duration:

```typescript
// Get buffer duration from mobile config
const config = getMobileConfig()
this.bufferDuration = config.balance.inputBufferMs

// Subscribe to config changes
this.unsubscribeConfig = onMobileConfigChange((newConfig) => {
  this.bufferDuration = newConfig.balance.inputBufferMs
})
```

Default values by device:
- Mobile: 200ms (more forgiving)
- Tablet: 175ms
- Desktop: 150ms

### Physics Coyote Time

The `PhysicsController` uses mobile config for coyote time:

```typescript
// Get coyote time from mobile config
const mobileConfig = getMobileConfig()
this.coyoteTime = mobileConfig.balance.coyoteTimeMs / 1000

// Subscribe to config changes
this.unsubscribeConfig = onMobileConfigChange((newConfig) => {
  this.coyoteTime = newConfig.balance.coyoteTimeMs / 1000
})
```

Default values by device:
- Mobile: 150ms (more forgiving)
- Tablet: 125ms
- Desktop: 100ms

### Game Hook Mobile Features

The `useSurvivalGame` hook automatically handles mobile setup:

```typescript
// On game start (first user interaction)
const setupMobile = async () => {
  if (mobileConfig.enableFullscreen) {
    await requestFullscreen()
  }
  if (mobileConfig.enableWakeLock) {
    await requestWakeLock()
  }
  if (isMobile) {
    await lockOrientation('landscape')
  }
}

// On unmount
useEffect(() => {
  return () => {
    releaseWakeLock()
    unlockOrientation()
  }
}, [])
```

## Testing

Run mobile optimization tests:

```bash
npm test -- --run src/survival/config/mobile.test.ts
npm test -- --run src/survival/config/device.test.ts
npm test -- --run src/survival/config/quality.test.ts
```

All tests include proper mocks for browser APIs:
- `window.matchMedia` for media queries
- `navigator.vibrate` for haptic feedback
- `navigator.wakeLock` for screen wake lock
- `screen.orientation` for orientation lock
- `window.visualViewport` for viewport handling
