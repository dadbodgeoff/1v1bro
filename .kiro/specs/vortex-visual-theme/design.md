# Design Document: Vortex Arena Volcanic Theme

## Overview

This design transforms Vortex Arena into a fully immersive volcanic/lava themed arena. The implementation creates new backdrop layers (VolcanicCavernLayer, EmberParticleLayer, LavaGlowLayer), integrates the existing AnimatedTileRenderer for lava/fire effects, and adds theme-aware rendering to all arena components (hazards, barriers, traps, teleporters, jump pads). The result is a dramatic volcanic environment with animated lava pools, obsidian barriers, steam vents, and a central lava vortex.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Map Configuration                           │
│  VORTEX_ARENA.metadata.theme = 'volcanic'                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     GameEngine                                  │
│  - Reads theme from mapConfig.metadata.theme                   │
│  - Creates BackdropSystem with 'volcanic' theme                │
│  - Calls AnimatedTileRenderer.update() each frame              │
│  - Passes theme to RenderPipeline                              │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ BackdropSystem  │ │ ArenaManager    │ │ RenderPipeline  │
│ (volcanic)      │ │                 │ │                 │
│ - CavernLayer   │ │ - HazardManager │ │ - Theme-aware   │
│ - EmberLayer    │ │ - BarrierMgr    │ │   rendering     │
│ - LavaGlowLayer │ │ - TrapManager   │ │                 │
│ - SmokeLayer    │ │ - TransportMgr  │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  AnimatedTileRenderer                           │
│  - Provides lava, fire, portal animations                      │
│  - Used by HazardManager for damage/slow zones                 │
│  - Used by TransportManager for teleporter effects             │
│  - Used by VortexRenderer for central lava whirlpool           │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. MapTheme Type Update

Update in `map-schema.ts`:

```typescript
export type MapTheme = 'space' | 'volcanic' | 'void'
```

### 2. VOLCANIC_COLORS Constants

New constants in `frontend/src/game/backdrop/types.ts`:

```typescript
export interface VolcanicColors {
  lavaCore: string      // Bright orange lava center
  lavaGlow: string      // Orange glow
  lavaDark: string      // Darker lava edges
  fire: string          // Yellow-orange fire
  ember: string         // Ember particles
  obsidian: string      // Dark obsidian rock
  stone: string         // Volcanic stone floor
  smoke: string         // Smoke/steam dark
  steam: string         // Light steam
  crack: string         // Glowing cracks
}

export const VOLCANIC_COLORS: VolcanicColors = {
  lavaCore: '#ff4400',
  lavaGlow: '#ff6600',
  lavaDark: '#cc3300',
  fire: '#ffaa00',
  ember: '#ff8844',
  obsidian: '#1a1a1a',
  stone: '#2d2d2d',
  smoke: '#4a4a4a',
  steam: '#888888',
  crack: '#ff2200',
}
```

### 3. Volcanic Backdrop Layers

New files in `frontend/src/game/backdrop/layers/`:

**VolcanicCavernLayer.ts** - Dark cavern background with lava glow:
```typescript
export class VolcanicCavernLayer implements BackdropLayer {
  render(ctx: CanvasRenderingContext2D): void {
    // Dark cavern gradient from top
    // Orange/red glow gradient from bottom
    // Rocky texture overlay
  }
}
```

**EmberParticleLayer.ts** - Floating ember particles:
```typescript
interface Ember {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  life: number
}

export class EmberParticleLayer implements BackdropLayer {
  private embers: Ember[] = []
  private maxEmbers = 50
  
  update(deltaTime: number): void {
    // Move embers upward with slight drift
    // Fade alpha over lifetime
    // Respawn dead embers at bottom
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    // Draw each ember as glowing orange circle
  }
}
```

**SmokeHazeLayer.ts** - Drifting smoke/haze:
```typescript
export class SmokeHazeLayer implements BackdropLayer {
  private smokeColumns: SmokeColumn[] = []
  
  render(ctx: CanvasRenderingContext2D): void {
    // Draw semi-transparent smoke wisps
    // Animate upward drift
  }
}
```

**LavaGlowLayer.ts** - Pulsing lava glow at edges:
```typescript
export class LavaGlowLayer implements BackdropLayer {
  private pulseTime = 0
  
  update(deltaTime: number): void {
    this.pulseTime += deltaTime
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    // Draw radial gradient from bottom
    // Pulse intensity based on time
  }
}
```

### 4. BackdropSystem Volcanic Theme

Update `BackdropSystem.ts`:

```typescript
private createVolcanicLayers(): void {
  this.layerEntries.push({ layer: new VolcanicCavernLayer(this.config), parallax: 0 })
  this.layerEntries.push({ layer: new LavaGlowLayer(this.config), parallax: 0 })
  this.layerEntries.push({ layer: new SmokeHazeLayer(this.config), parallax: 0.2 })
  this.layerEntries.push({ layer: new EmberParticleLayer(this.config), parallax: 0.4 })
}
```

### 5. Theme-Aware HazardManager

Update `HazardManager.ts` to use AnimatedTileRenderer:

```typescript
import { animatedTileRenderer, type AnimatedTileType } from '../terrain/AnimatedTiles'

export class HazardManager {
  private theme: MapTheme = 'space'
  
  setTheme(theme: MapTheme): void {
    this.theme = theme
  }
  
  private renderDamageZone(ctx, bounds, time): void {
    if (this.theme === 'volcanic') {
      // Use lava animation
      animatedTileRenderer.render(ctx, 'lava', bounds.x, bounds.y, bounds.width)
    } else {
      // Existing space theme rendering
    }
  }
  
  private renderSlowField(ctx, bounds, time): void {
    if (this.theme === 'volcanic') {
      // Render steam vent effect
      this.renderSteamVent(ctx, bounds, time)
    } else {
      // Existing space theme rendering
    }
  }
}
```

### 6. Theme-Aware BarrierManager

Update `BarrierManager.ts`:

```typescript
private renderVolcanicBarrier(ctx, barrier): void {
  const { position, size, type, health, maxHealth } = barrier
  
  // Dark obsidian base
  ctx.fillStyle = VOLCANIC_COLORS.obsidian
  ctx.fillRect(position.x, position.y, size.x, size.y)
  
  // Orange glow edges
  const glowGradient = ctx.createLinearGradient(...)
  glowGradient.addColorStop(0, 'transparent')
  glowGradient.addColorStop(1, VOLCANIC_COLORS.lavaGlow)
  
  // Cracks for destructible barriers (more visible as health decreases)
  if (type === 'destructible') {
    const crackIntensity = 1 - (health / maxHealth)
    this.renderCracks(ctx, position, size, crackIntensity)
  }
}
```

### 7. Theme-Aware TransportManager

Update `TransportManager.ts`:

```typescript
private renderVolcanicTeleporter(ctx, teleporter): void {
  const { position, radius } = teleporter
  
  // Swirling magma portal using portal animation with lava colors
  ctx.save()
  
  // Base magma pool
  const gradient = ctx.createRadialGradient(...)
  gradient.addColorStop(0, VOLCANIC_COLORS.lavaCore)
  gradient.addColorStop(1, VOLCANIC_COLORS.lavaDark)
  
  // Swirl effect
  animatedTileRenderer.render(ctx, 'portal', position.x - radius, position.y - radius, radius * 2)
  
  // Heat distortion ring
  ctx.strokeStyle = VOLCANIC_COLORS.lavaGlow
  ctx.globalAlpha = 0.5 + Math.sin(time * 3) * 0.2
  ctx.arc(position.x, position.y, radius + 5, 0, Math.PI * 2)
  ctx.stroke()
  
  ctx.restore()
}

private renderVolcanicJumpPad(ctx, jumpPad): void {
  // Volcanic vent with bubbling lava
  // Eruption particles when activated
}
```

### 8. Central Lava Vortex Renderer

New component for the map center:

```typescript
export class LavaVortexRenderer {
  private time = 0
  private debris: Particle[] = []
  
  update(deltaTime: number): void {
    this.time += deltaTime
    // Update debris particles spiraling inward
  }
  
  render(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number): void {
    // Multiple concentric swirl rings
    for (let i = 0; i < 5; i++) {
      const ringRadius = radius * (0.2 + i * 0.15)
      const rotation = this.time * (1 + i * 0.3) // Outer rings faster
      
      ctx.strokeStyle = VOLCANIC_COLORS.lavaCore
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(centerX, centerY, ringRadius, rotation, rotation + Math.PI * 1.5)
      ctx.stroke()
    }
    
    // Intense center glow
    const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    glowGradient.addColorStop(0, VOLCANIC_COLORS.lavaCore)
    glowGradient.addColorStop(0.5, VOLCANIC_COLORS.lavaGlow + '80')
    glowGradient.addColorStop(1, 'transparent')
    ctx.fillStyle = glowGradient
    ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2)
    
    // Debris particles
    this.renderDebris(ctx)
    
    // Occasional splash effects
    this.renderSplashes(ctx, centerX, centerY, radius)
  }
}
```

### 9. VORTEX_ARENA Config Update

Update `vortex-arena.ts`:

```typescript
export const VORTEX_ARENA: MapConfig = {
  metadata: {
    name: 'Vortex Arena',
    author: 'Arena Systems Team',
    version: '2.0.0',  // Version bump for volcanic theme
    description: 'Volcanic arena with lava pools, obsidian barriers, and a central lava vortex.',
    theme: 'volcanic',  // NEW: volcanic theme
  },
  // ... rest of config unchanged
}
```

## Data Models

### Particle Types

```typescript
interface Ember {
  x: number
  y: number
  vx: number
  vy: number
  size: number      // 2-6 pixels
  alpha: number     // 0-1
  life: number      // Remaining lifetime in seconds
  maxLife: number   // Total lifetime
}

interface SmokeWisp {
  x: number
  y: number
  width: number
  height: number
  alpha: number
  drift: number     // Horizontal drift speed
}

interface VortexDebris {
  angle: number     // Current angle around vortex
  radius: number    // Distance from center
  size: number
  speed: number     // Angular velocity
}
```

### Theme Configuration

```typescript
interface ThemeConfig {
  backdrop: 'space' | 'volcanic' | 'void'
  hazardAnimations: {
    damage: AnimatedTileType
    slow: AnimatedTileType | 'steam'
    emp: AnimatedTileType
  }
  barrierStyle: 'default' | 'obsidian'
  transportStyle: 'default' | 'magma'
}

const VOLCANIC_THEME_CONFIG: ThemeConfig = {
  backdrop: 'volcanic',
  hazardAnimations: {
    damage: 'lava',
    slow: 'steam',
    emp: 'electric',
  },
  barrierStyle: 'obsidian',
  transportStyle: 'magma',
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Theme determines animation type selection

*For any* hazard zone rendered with a theme, the AnimatedTileRenderer type selected SHALL match the theme configuration:
- volcanic + damage → 'lava'
- volcanic + slow → steam effect (custom)
- space + damage → 'fire'
- space + slow → 'water'

**Validates: Requirements 2.1, 3.1, 4.1**

### Property 2: Color constant validity

*For any* color in VOLCANIC_COLORS, the value SHALL be a valid CSS hex color string matching pattern #[0-9a-fA-F]{6}.

**Validates: Requirements 11.1**

### Property 3: Map config theme value

*For any* VORTEX_ARENA configuration, the metadata.theme property SHALL equal 'volcanic'.

**Validates: Requirements 12.2**

### Property 4: Backdrop creation by theme

*For any* BackdropSystem constructed with theme 'volcanic', the system SHALL create volcanic-specific layers (VolcanicCavernLayer, LavaGlowLayer, SmokeHazeLayer, EmberParticleLayer).

**Validates: Requirements 12.3**

### Property 5: Animation time advancement

*For any* call to AnimatedTileRenderer.update(deltaTime), the internal time SHALL increase by deltaTime * 1000 (converting to milliseconds).

**Validates: Requirements 13.1**

### Property 6: Particle count limits

*For any* particle-based layer (EmberParticleLayer, SmokeHazeLayer), the particle count SHALL NOT exceed the configured maximum (50 for embers, 30 for smoke).

**Validates: Requirements 14.1**

## Error Handling

| Error | Handling |
|-------|----------|
| Invalid theme string | Default to 'space' theme |
| AnimatedTileRenderer not initialized | Skip animated effects, use static fallback |
| Particle array overflow | Remove oldest particles first |
| Gradient creation failure | Use solid color fallback |
| Canvas context unavailable | Skip render, log warning |

## Testing Strategy

### Property-Based Testing

The implementation will use **fast-check** (TypeScript) for frontend property tests.

Each property-based test will:
- Run a minimum of 100 iterations
- Be tagged with the property it validates

### Unit Tests

| Component | Test Coverage |
|-----------|---------------|
| VOLCANIC_COLORS | All colors are valid hex strings |
| BackdropSystem | Creates correct layers for each theme |
| AnimatedTileRenderer | Frame calculation, color cycling |
| VORTEX_ARENA config | Theme is 'volcanic' |

### Visual Testing

Manual verification:
1. Load Nexus Arena - verify space theme unchanged
2. Load Vortex Arena - verify volcanic theme:
   - Dark cavern background with lava glow
   - Floating ember particles
   - Animated lava pools on damage zones
   - Steam effects on slow zones
   - Obsidian barriers with glow
   - Magma teleporters
   - Central lava vortex

## Implementation Notes

### File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `map-schema.ts` | Modify | Add 'volcanic' to MapTheme |
| `vortex-arena.ts` | Modify | Add `theme: 'volcanic'` |
| `types.ts` (backdrop) | Modify | Add VOLCANIC_COLORS |
| `VolcanicCavernLayer.ts` | Create | Dark cavern background |
| `EmberParticleLayer.ts` | Create | Floating ember particles |
| `SmokeHazeLayer.ts` | Create | Drifting smoke/haze |
| `LavaGlowLayer.ts` | Create | Pulsing lava glow |
| `LavaVortexRenderer.ts` | Create | Central vortex effect |
| `BackdropSystem.ts` | Modify | Add volcanic layer creation |
| `GameEngine.ts` | Modify | Pass theme, update AnimatedTileRenderer |
| `HazardManager.ts` | Modify | Theme-aware hazard rendering |
| `BarrierManager.ts` | Modify | Theme-aware barrier rendering |
| `TransportManager.ts` | Modify | Theme-aware transport rendering |
| `TrapManager.ts` | Modify | Theme-aware trap effects |
| `layers/index.ts` | Modify | Export new volcanic layers |

### Existing Animation Reuse

The AnimatedTileRenderer already has perfect animations for volcanic theme:
- `lava`: Orange color cycling, bubble effects, hot cracks
- `fire`: Flame tongue effects, flickering
- `portal`: Swirl rings (recolor for magma)

### Performance Budget

| Element | Max Count | Notes |
|---------|-----------|-------|
| Ember particles | 50 | Respawn at bottom |
| Smoke wisps | 30 | Slow drift |
| Vortex debris | 20 | Spiral inward |
| Lava splash effects | 5 | Occasional |
| Total particles | 200 | Hard limit |
