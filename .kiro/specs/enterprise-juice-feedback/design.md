# Design Document: Enterprise Juice & Feedback System

## Overview

This design specifies the implementation of AAA-quality juice and feedback systems for Survival Mode. The architecture extends existing systems (CameraController, ParticleSystem, FeedbackSystem, SurvivalRenderer) with new capabilities for screen shake, dodge particles, camera tilt, and visual escalation.

## Architecture

```mermaid
graph TB
    subgraph Input Events
        COL[Collision]
        NM[Near Miss]
        PD[Perfect Dodge]
        LC[Lane Change]
        LAND[Landing]
        SPD[Speed Change]
    end
    
    subgraph Juice Systems
        SS[ScreenShake]
        DP[DodgeParticles]
        CT[CameraTilt]
        IF[ImpactFlash]
        CE[ComboEscalation]
        SL[SpeedLines]
    end
    
    subgraph Output
        CAM[Camera Transform]
        PART[Particle Emission]
        POST[Post-Processing]
        AUDIO[Audio/Haptic]
    end
    
    COL --> SS
    COL --> IF
    NM --> DP
    PD --> DP
    LC --> CT
    LAND --> SS
    LAND --> DP
    SPD --> SL
    
    SS --> CAM
    CT --> CAM
    DP --> PART
    IF --> POST
    CE --> PART
    CE --> POST
    SL --> POST


## Components and Interfaces

### 1. ScreenShakeSystem (New)

Trauma-based screen shake with Perlin noise for organic movement.

```typescript
interface ShakeConfig {
  maxOffset: number       // Maximum positional displacement (0.5 units)
  maxRotation: number     // Maximum rotational shake (0.05 radians)
  traumaDecay: number     // Decay rate per second (0.8)
  frequency: number       // Noise frequency (15)
}

interface ShakeState {
  trauma: number          // Current trauma 0-1
  seed: number            // Noise seed for variation
  time: number            // Accumulated time for noise sampling
}

class ScreenShakeSystem {
  // Add trauma (capped at 1.0)
  addTrauma(amount: number): void
  
  // Update shake state
  update(delta: number): void
  
  // Get current shake offset
  getOffset(): { x: number, y: number, rotation: number }
  
  // Reset all shake
  reset(): void
}
```

### 2. DodgeParticleEmitter (Extension to ParticleSystem)

New particle types and emission patterns for dodge feedback.

```typescript
// New particle effect types
type DodgeParticleType = 
  | 'dodge-sparks'        // Near-miss sparks
  | 'perfect-burst'       // Perfect dodge burst
  | 'perfect-flash'       // Brief glow on perfect
  | 'combo-trail'         // Trail at high combo
  | 'combo-glow'          // Screen edge glow

interface DodgeEmitOptions {
  position: THREE.Vector3
  direction: THREE.Vector3  // Direction away from obstacle
  intensity: number         // 0-1 based on proximity
  isPerfect: boolean
}

// Extension methods for ParticleSystem
class ParticleSystem {
  // Emit dodge particles
  emitDodgeParticles(options: DodgeEmitOptions): void
  
  // Emit perfect dodge flash
  emitPerfectFlash(position: THREE.Vector3): void
  
  // Update combo trail (continuous)
  updateComboTrail(playerPos: THREE.Vector3, combo: number): void
}
```

### 3. CameraTiltController (Extension to CameraController)

Smooth camera roll during lane changes.

```typescript
interface TiltConfig {
  maxTilt: number         // Maximum tilt in radians (0.052 = 3 degrees)
  tiltSpeed: number       // How fast to apply tilt
  returnSpeed: number     // How fast to return to neutral
  airborneMultiplier: number  // Reduced tilt when jumping (0.5)
}

interface TiltState {
  currentTilt: number     // Current roll angle
  targetTilt: number      // Target roll angle
  velocity: number        // For smooth transitions
}

// Extension to CameraController
class CameraController {
  // Set tilt target based on lane change direction
  setTiltTarget(direction: -1 | 0 | 1): void
  
  // Update tilt (call in fixedUpdate)
  updateTilt(delta: number, isAirborne: boolean): void
  
  // Get current tilt for camera application
  getTilt(): number
}
```

### 4. ImpactFlashOverlay (New)

Screen flash effect for impacts.

```typescript
interface FlashConfig {
  duration: number        // Flash duration in ms (150)
  maxOpacity: number      // Peak opacity (0.3)
  color: number           // Flash color (0xffffff or 0xff0000)
}

class ImpactFlashOverlay {
  private mesh: THREE.Mesh
  private material: THREE.MeshBasicMaterial
  private flashTimer: number
  
  // Trigger flash
  trigger(isLethal: boolean = false): void
  
  // Update flash fade
  update(delta: number): void
  
  // Dispose
  dispose(): void
}
```

### 5. ComboEscalationSystem (New)

Visual escalation based on combo level.

```typescript
interface ComboVisualState {
  level: 'none' | 'low' | 'medium' | 'high'  // 0, 5+, 10+, 15+
  glowIntensity: number
  trailActive: boolean
  edgeGlowActive: boolean
}

class ComboEscalationSystem {
  private currentCombo: number
  private visualState: ComboVisualState
  private fadeTimer: number
  
  // Update combo value
  setCombo(combo: number): void
  
  // Update visuals
  update(delta: number, playerPos: THREE.Vector3): void
  
  // Get current visual state
  getVisualState(): ComboVisualState
  
  // Reset on combo break
  reset(): void
}
```

### 6. SpeedFeedbackSystem (Extension to SurvivalRenderer)

Enhanced speed visualization.

```typescript
interface SpeedVisualState {
  speedLinesOpacity: number
  motionBlurIntensity: number
  vignetteIntensity: number
  chromaticAberration: number
}

// Extension to SurvivalRenderer
class SurvivalRenderer {
  // Update all speed-based visuals
  updateSpeedFeedback(speed: number, delta: number): void
  
  // Apply vignette effect
  setVignetteIntensity(intensity: number): void
  
  // Apply chromatic aberration (optional, performance-dependent)
  setChromaticAberration(intensity: number): void
}
```

## Data Flow

### Collision Impact Flow
```
CollisionSystem.checkCollision()
  → SurvivalEngine.onCollision()
    → ScreenShakeSystem.addTrauma(0.6)
    → ImpactFlashOverlay.trigger()
    → CameraController.triggerImpactZoom()
    → GameLoop.triggerHitstop()
    → ParticleSystem.emitCollisionSparks()
    → FeedbackSystem.onCollision()
```

### Dodge Flow
```
CollisionSystem.checkNearMiss()
  → SurvivalEngine.onNearMiss()
    → ParticleSystem.emitDodgeParticles()
    → ComboSystem.onNearMiss()
    → FeedbackSystem.onNearMiss()
    
CollisionSystem.checkPerfectDodge()
  → SurvivalEngine.onPerfectDodge()
    → ParticleSystem.emitDodgeParticles(isPerfect: true)
    → ParticleSystem.emitPerfectFlash()
    → GameLoop.triggerHitstop(3, 0.05)
    → ComboSystem.onPerfectDodge()
    → FeedbackSystem.onPerfectDodge()
```

### Lane Change Flow
```
InputController.onLaneChange()
  → PlayerController.setTargetLane()
    → CameraController.setTiltTarget(direction)
    → FeedbackSystem.onLaneChange()
```

## Correctness Properties

### Property 1: Trauma decay is exponential
*For any* trauma value T > 0, after time t seconds, trauma SHALL equal T * e^(-0.8t).
**Validates: Requirements 1.3**

### Property 2: Shake intensity uses quadratic falloff
*For any* trauma value T, the shake intensity SHALL equal T².
**Validates: Requirements 1.4**

### Property 3: Trauma is capped at 1.0
*For any* sequence of addTrauma() calls, the resulting trauma SHALL never exceed 1.0.
**Validates: Requirements 1.6**

### Property 4: Near-miss emits correct particle count
*For any* near-miss event, the particle count SHALL be between 15 and 20.
**Validates: Requirements 2.1**

### Property 5: Perfect dodge emits enhanced particles
*For any* perfect dodge event, the particle count SHALL be between 30 and 40.
**Validates: Requirements 2.2**

### Property 6: Speed lines opacity scales with speed
*For any* speed S > 25, opacity SHALL equal min(0.6, (S - 25) / 25 * 0.6).
**Validates: Requirements 3.1, 3.2**

### Property 7: Camera tilt is bounded
*For any* lane change, the camera tilt SHALL not exceed 3 degrees (0.052 radians).
**Validates: Requirements 4.2**

### Property 8: Airborne tilt is reduced
*For any* lane change while airborne, the applied tilt SHALL be 50% of normal.
**Validates: Requirements 4.6**

### Property 9: Impact flash duration is consistent
*For any* collision, the flash SHALL fade from 30% to 0% over exactly 150ms.
**Validates: Requirements 5.2**

### Property 10: Combo visual levels are correct
*For any* combo value C, visual level SHALL be: none (C<5), low (5≤C<10), medium (10≤C<15), high (C≥15).
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 11: Landing shake scales with velocity
*For any* landing with velocity V > 15, trauma SHALL equal min(0.15, (V - 15) / 30 * 0.15).
**Validates: Requirements 7.2**

### Property 12: Speed feedback thresholds are correct
*For any* speed S, motion blur SHALL activate at S > 30, FOV increase at S > 20.
**Validates: Requirements 8.1, 8.2**

## Performance Considerations

1. **Perlin Noise**: Use simplex noise for screen shake (faster than classic Perlin)
2. **Particle Pooling**: Reuse particle objects, don't allocate during gameplay
3. **Post-Processing**: Vignette and flash use simple full-screen quads, minimal GPU cost
4. **Chromatic Aberration**: Optional, disabled on low-end devices
5. **Combo Trail**: Limit to 50 particles max, use additive blending

## Testing Strategy

### Property-Based Testing

Use **fast-check** for frontend property tests. Each test MUST:
- Run minimum 100 iterations
- Be tagged with format: `**Feature: enterprise-juice-feedback, Property {number}: {property_text}**`

### Unit Tests

- ScreenShakeSystem trauma decay
- CameraTilt bounds and easing
- ParticleSystem emission counts
- ComboEscalation level transitions

### Visual Tests

- Manual verification of shake feel
- Particle color and direction
- Speed line animation smoothness
- Flash timing and opacity
