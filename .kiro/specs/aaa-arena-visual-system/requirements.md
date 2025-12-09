# Requirements Document

## Introduction

This specification defines a comprehensive AAA-quality visual upgrade for the 2D arena PvP map system. The goal is to transform the current functional but visually basic arena into a production-quality experience comparable to professional 2D games like Dead Cells, Hollow Knight, and Hades.

**Current State Analysis:**

| Component | Current Implementation | Problem |
|-----------|----------------------|---------|
| Tile Rendering | Solid color rectangles with orange outlines | No texture, depth, or visual interest |
| Parallax Background | 4 layers (volcanic theme) with basic gradients | No environmental detail, feels flat |
| Platform Edges | Sharp rectangular edges | No erosion, crumbling, or organic feel |
| Lighting | Static lava glow gradients | No dynamic lights, no rim lighting on platforms |
| Environmental Props | None | Arena feels empty and generic |
| Lava Animation | Basic pulsing glow | No bubbling, flowing, or splash effects |
| Visual Hierarchy | Minimal contrast between layers | Hard to distinguish gameplay from background |
| Performance | No quality scaling | Same effects on all devices |

The upgrade encompasses six core pillars:

1. **Tile Art System** - Procedural textures with cracks, weathering, and baked lighting
2. **Parallax Depth System** - Enhanced 4-layer system with environmental detail
3. **Environmental Props** - Decorative elements (chains, crystals, steam vents)
4. **Dynamic Lighting** - Light sources from lava with rim lighting and player underglow
5. **Animation & Life** - Animated lava, steam particles, environmental events
6. **Visual Hierarchy** - Clear contrast between gameplay and decorative elements

## Glossary

- **TileArtSystem**: The system at `frontend/src/game/visual/TileArtSystem.ts` for procedural tile textures
- **ParallaxDepthSystem**: Enhanced backdrop system with 4 distinct depth layers
- **EnvironmentalPropSystem**: System for placing and rendering decorative props
- **DynamicLightingSystem**: Real-time lighting with rim effects and shadows
- **AnimationLifeSystem**: Coordinator for all environmental animations
- **VisualHierarchySystem**: Post-processing for gameplay clarity
- **ThemeManifest**: JSON configuration defining all visual assets for a theme
- **QualityManager**: Performance-based quality scaling system
- **9-Slice**: Sprite rendering technique that preserves corners while stretching middles
- **Rim_Lighting**: Light effect on edges of objects facing light sources
- **Procedural_Texture**: Texture generated algorithmically rather than from image files

## Requirements

### Requirement 1: Tile Art System

**User Story:** As a player, I want arena platforms to look like actual textured surfaces with depth and detail, so that the game feels polished and immersive.

#### Acceptance Criteria

1.1. WHEN the TileArtSystem renders a platform tile THEN the system SHALL generate a procedural rock texture with:
- Base color from theme palette
- Procedural crack patterns (density configurable 0-1)
- Color variation noise (±10% hue/saturation)
- Weathering effects at edges

1.2. WHEN a tile is adjacent to empty space THEN the system SHALL render edge decorations:
- Crumbling rock fragments on exposed edges
- Optional moss/growth on bottom edges
- Erosion detail on top edges

1.3. WHEN rendering wall barriers THEN the system SHALL use 9-slice rendering:
- Corner regions (16x16px) remain unstretched
- Edge regions stretch in one direction only
- Center region fills remaining space

1.4. WHEN rendering any solid tile THEN the system SHALL apply baked lighting:
- Top edge 15% lighter than base color
- Bottom edge 20% darker than base color
- Gradient applied vertically

1.5. WHEN the TileArtSystem initializes with a seed THEN generating textures twice with the same seed SHALL produce identical pixel output

### Requirement 2: Parallax Depth System

**User Story:** As a player, I want the arena to feel like it exists in a larger world with visible depth, so that the environment feels expansive rather than flat.

#### Acceptance Criteria

2.1. WHEN the ParallaxDepthSystem initializes THEN the system SHALL create exactly 4 depth layers:
- Layer 0 (far): scrollRatio 0.1, distant mountains/sky
- Layer 1 (mid): scrollRatio 0.3, rock formations/lava pools
- Layer 2 (gameplay): scrollRatio 1.0, platforms and hazards
- Layer 3 (foreground): scrollRatio 1.2, steam vents/stalactites

2.2. WHEN camera position changes by delta (dx, dy) THEN each layer SHALL move by (dx * scrollRatio, dy * scrollRatio)

2.3. WHEN rendering the far background (Layer 0) THEN the system SHALL display:
- Volcanic mountain silhouettes
- Sky gradient (dark red to black)
- Distant lava glow on horizon

2.4. WHEN rendering the mid background (Layer 1) THEN the system SHALL display:
- Rock formation silhouettes
- Lava pool reflections
- Stalactite shadows from ceiling

2.5. WHEN rendering the foreground (Layer 3) THEN the system SHALL display:
- Hanging stalactites (partial screen coverage)
- Steam/smoke wisps
- Floating ember particles

2.6. WHEN all 4 layers render THEN frame time SHALL remain under 16.67ms (60fps target)

### Requirement 3: Environmental Props

**User Story:** As a player, I want the arena to tell a visual story through environmental details, so that the space feels lived-in and purposeful.

#### Acceptance Criteria

3.1. WHEN a map loads THEN the EnvironmentalPropSystem SHALL place props at anchor points defined in the map config:
```typescript
interface PropAnchor {
  id: string
  definitionId: string  // References prop definition
  position: { x: number, y: number }
  layer: 'background' | 'gameplay' | 'foreground'
  rotation?: number
  scale?: number
}
```

3.2. WHEN rendering props THEN the system SHALL support three categories:
- **Structural**: chains, broken machinery, pillars, metal grates
- **Organic**: bones, crystals, volcanic rock formations
- **Atmospheric**: steam vents, dripping lava, glowing runes

3.3. WHEN a prop has animation defined THEN the system SHALL cycle through frames:
- Frame rate from prop definition (default 12fps)
- Loop or play-once based on config
- Phase offset to prevent sync across props

3.4. WHEN rendering props THEN the system SHALL respect layer ordering:
- Background props render before platforms
- Gameplay props render with platforms
- Foreground props render after players

3.5. WHEN loading prop definitions THEN the system SHALL parse from `themes/{themeId}/props.json`:
```json
{
  "props": [
    {
      "id": "chain_hanging",
      "category": "structural",
      "sprite": "chain_hanging.png",
      "size": { "width": 32, "height": 128 },
      "anchor": { "x": 0.5, "y": 0 },
      "animation": { "frames": 4, "frameRate": 8, "loop": true }
    }
  ]
}
```

### Requirement 4: Dynamic Lighting System

**User Story:** As a player, I want light sources to cast realistic glows that respond to the environment, so that the arena feels dynamic and atmospheric.

#### Acceptance Criteria

4.1. WHEN a lava hazard zone exists THEN the DynamicLightingSystem SHALL create a light source:
- Position: center of hazard bounds
- Color: theme lavaGlow color (#ff6600)
- Radius: 1.5x hazard width
- Intensity: hazard.intensity * 0.8

4.2. WHEN rendering platforms within a light's radius THEN the system SHALL apply rim lighting:
- Rim on edges facing light source
- Rim color: light color at 40% opacity
- Rim width: 3-5 pixels

4.3. WHEN rendering the arena THEN the system SHALL composite ambient lighting:
- Ambient color from theme config
- Ambient intensity (0-1) applied as overlay
- Darker in corners (vignette effect)

4.4. WHEN a player is within 100px of a lava source THEN the system SHALL apply underglow:
- Orange glow beneath player sprite
- Intensity based on distance (closer = brighter)
- Radius: player radius * 1.5

4.5. WHEN light sources animate (pulse) THEN shadow intensities SHALL update in sync:
- Pulse frequency from light config
- Shadow darkness inversely proportional to light intensity

### Requirement 5: Animation and Life System

**User Story:** As a player, I want the environment to feel alive with constant subtle movement, so that the arena doesn't feel static or lifeless.

#### Acceptance Criteria

5.1. WHEN rendering lava hazard tiles THEN the AnimationLifeSystem SHALL display animated lava:
- Minimum 8 animation frames
- Bubbling effect with random bubble positions
- Surface flow animation (horizontal movement)
- Frame rate: 10-12fps

5.2. WHEN steam vent props are present THEN the system SHALL emit particles:
- Particle lifetime: 2-4 seconds (randomized)
- Rise velocity: 20-40 px/s
- Fade out over final 25% of lifetime
- Max 20 particles per vent

5.3. WHEN rendering the vortex center THEN the LavaVortexRenderer SHALL display:
- Swirling debris particles (existing, enhanced)
- Lava splash effects at edges
- Pulsing intensity (0.7-1.0 range)
- Minimum 20 debris particles

5.4. WHEN rendering background THEN the system SHALL trigger environmental events:
- Rock debris falling: 0.1 probability per second
- Lava burst: 0.05 probability per second
- Events last 0.5-2 seconds

5.5. WHEN multiple animated elements exist THEN the system SHALL stagger phases:
- Each element gets random phase offset (0 to 2π)
- Prevents synchronized pulsing
- Phase assigned on element creation

5.6. WHEN updating animations THEN the system SHALL use delta-time:
- Animation progress = deltaTime * frameRate
- Frame-rate independent animation speed
- Consistent across 30fps and 144fps displays

### Requirement 6: Visual Hierarchy System

**User Story:** As a player, I want to instantly distinguish between walkable surfaces, hazards, and background elements, so that I can make split-second gameplay decisions.

#### Acceptance Criteria

6.1. WHEN rendering walkable platforms THEN the VisualHierarchySystem SHALL apply:
- 20% higher brightness than background
- Sharper edges (no blur)
- Subtle outline (1px, theme accent color)

6.2. WHEN rendering hazard zones THEN the system SHALL display danger indicators:
- Pulsing glow (frequency: 2Hz)
- Contrast ratio >= 4.5:1 against adjacent surfaces
- Warning pattern (diagonal stripes) at edges

6.3. WHEN rendering background elements THEN the system SHALL apply:
- Desaturation: 30-50% reduction in saturation
- Blur: 2-4px gaussian blur
- Reduced brightness: 20-30% darker

6.4. WHEN rendering interactive elements (teleporters, jump pads) THEN the system SHALL apply:
- Distinct glow halo (radius: element radius * 1.5)
- Color different from hazards (cyan for teleporter, green for jump pad)
- Animation to draw attention

6.5. WHEN player enters a hazard zone THEN the system SHALL intensify feedback:
- Hazard glow intensity increases 50%
- Pulse frequency doubles
- Screen edge tint (red, 10% opacity)

6.6. WHEN rendering complete frame THEN the system SHALL apply vignette:
- Darken corners by 20-30%
- Radius: 70% of screen diagonal
- Smooth falloff (no hard edge)

### Requirement 7: Performance and Quality Scaling

**User Story:** As a player, I want all visual enhancements to run smoothly on my device, so that visual quality doesn't compromise gameplay responsiveness.

#### Acceptance Criteria

7.1. WHEN the QualityManager initializes THEN the system SHALL detect device tier:
- Low: < 4GB RAM or mobile
- Medium: 4-8GB RAM, integrated GPU
- High: 8-16GB RAM, dedicated GPU
- Ultra: 16GB+ RAM, high-end GPU

7.2. WHEN quality preset is selected THEN the system SHALL apply settings:
| Setting | Low | Medium | High | Ultra |
|---------|-----|--------|------|-------|
| Parallax Layers | 2 | 3 | 4 | 4 |
| Particle Multiplier | 0.25 | 0.5 | 0.75 | 1.0 |
| Animated Tiles | Off | On | On | On |
| Dynamic Lighting | Off | Basic | Full | Full |
| Blur Effects | Off | Off | On | On |

7.3. WHEN rendering animated tiles THEN the system SHALL batch by texture:
- Group tiles sharing same texture
- Single draw call per texture group
- Target: < 50 draw calls per frame

7.4. WHEN particle count exceeds limit THEN the system SHALL use object pooling:
- Pre-allocate particle pool (size based on quality)
- Reuse particles instead of creating new
- No garbage collection during gameplay

7.5. WHEN frame time exceeds 18ms THEN the system SHALL auto-reduce quality:
- Log warning with current settings
- Reduce particle multiplier by 25%
- If still slow, disable blur effects

7.6. WHEN serializing visual config THEN the system SHALL support round-trip:
- Serialize to JSON
- Parse back to config object
- Resulting config equals original

### Requirement 8: Theme Asset Pipeline

**User Story:** As a developer, I want a structured asset pipeline for visual elements, so that new maps and themes can be created efficiently.

#### Acceptance Criteria

8.1. WHEN loading theme assets THEN the ThemeAssetLoader SHALL use directory structure:
```
frontend/src/game/themes/
├── volcanic/
│   ├── manifest.json
│   ├── tiles/
│   │   ├── platform.png
│   │   ├── wall.png
│   │   └── hazard_lava.png
│   ├── props/
│   │   ├── chain_hanging.png
│   │   ├── crystal_cluster.png
│   │   └── steam_vent.png
│   ├── backgrounds/
│   │   ├── far_mountains.png
│   │   ├── mid_rocks.png
│   │   └── foreground_stalactites.png
│   └── particles/
│       ├── ember.png
│       ├── smoke.png
│       └── lava_splash.png
```

8.2. WHEN a theme is selected THEN the system SHALL load manifest.json:
```json
{
  "id": "volcanic",
  "name": "Volcanic Cavern",
  "version": "1.0.0",
  "palette": {
    "primary": "#ff4400",
    "secondary": "#ff6600",
    "background": "#1a0a0a",
    "platform": "#2d2d2d",
    "hazard": "#ff2200"
  },
  "tileConfig": {
    "crackDensity": 0.3,
    "weatheringIntensity": 0.5,
    "edgeErosion": true
  },
  "lighting": {
    "ambientColor": "#1a0505",
    "ambientIntensity": 0.3,
    "rimLightingEnabled": true
  }
}
```

8.3. WHEN rendering tiles THEN the system SHALL support fallback:
- Try to load pre-rendered sprite from tiles/
- If missing, generate procedurally
- Log warning for missing assets

8.4. WHEN asset loading fails THEN the system SHALL render placeholder:
- Magenta/black checkerboard pattern
- 8x8 pixel squares
- Visible error indicator

8.5. WHEN validating loaded assets THEN the system SHALL check dimensions:
- Tile assets: 80x80, 160x160, or 320x320 pixels
- Prop assets: any size, power of 2 preferred
- Reject and log error for invalid dimensions

8.6. WHEN parsing theme manifest THEN the system SHALL validate structure:
- Required fields: id, name, palette
- Optional fields: tileConfig, lighting, props
- Return specific error for missing/invalid fields

