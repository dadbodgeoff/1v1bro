# Requirements Document

## Introduction

This specification defines a comprehensive visual differentiation system for Vortex Arena, transforming it from a gameplay-different-but-visually-similar map into a distinctly recognizable cyber-themed arena. The implementation integrates existing but unused visual systems (animated tiles, extended terrain types, backdrop layers) to create a cohesive "cyber vortex" aesthetic that immediately distinguishes Vortex Arena from Nexus Arena.

**Current State Analysis:**

| Component | Current Implementation | Problem |
|-----------|----------------------|---------|
| Backdrop System | Space theme only (SpaceVoidLayer, NebulaLayer, StarFieldLayer) | Both maps look identical in background |
| Animated Tiles | AnimatedTileRenderer exists with water, lava, fire, electric, portal | NOT integrated into rendering pipeline |
| Extended Terrain | TerrainTypes.ts has ice, sand, water, lava, void, grass, stone | NOT added to TileType enum, unused |
| Map Theme Config | No theme property in MapMetadata | Cannot specify visual style per map |
| Hazard Rendering | Basic colored rectangles | No animated effects, looks flat |
| Transport Rendering | Basic circles with gradients | No theme-specific styling |
| Floor Tiles | Solid color fill | No grid pattern or visual interest |

**Visual Theme Comparison:**

| Element | Nexus Arena (Space) | Vortex Arena (Cyber) |
|---------|---------------------|----------------------|
| Background | Deep space void, nebula clouds, stars | Dark void with hex grid, circuit patterns |
| Color Palette | Blues, purples, white stars | Purple, cyan, magenta, electric yellow |
| Hazard Effects | Static colored zones | Animated electric/portal effects |
| Floor Pattern | Solid dark blue | Subtle pulsing hex grid overlay |
| Transport Pads | Blue/green gradients | Electric arcs, circuit glow |
| Center Feature | None | Swirling portal vortex effect |

The upgrade encompasses:

1. **Theme-Aware Backdrop System** - BackdropSystem accepts theme parameter, creates appropriate layers
2. **Cyber Backdrop Layers** - New CyberVoidLayer using existing HexGridLayer and CircuitLayer
3. **Animated Tile Integration** - HazardManager uses AnimatedTileRenderer for visual effects
4. **Portal Vortex Effect** - Central area renders with animated portal swirl
5. **Theme-Specific Transport Rendering** - Teleporters and jump pads styled per theme
6. **Floor Grid Overlay** - Subtle hex pattern on floor tiles for cyber theme
7. **Map Configuration Theme Property** - MapMetadata.theme determines visual presentation

## Glossary

- **Backdrop_System**: The layered background rendering system at `frontend/src/game/backdrop/BackdropSystem.ts`
- **Backdrop_Layer**: An individual rendering layer (SpaceVoidLayer, NebulaLayer, HexGridLayer, CircuitLayer, etc.)
- **Map_Theme**: A string enum ('space' | 'cyber' | 'void') determining visual presentation
- **Animated_Tile_Renderer**: The singleton at `frontend/src/game/terrain/AnimatedTiles.ts` providing frame-based tile animations
- **Animated_Tile_Type**: One of 'water', 'lava', 'fire', 'electric', 'portal' animation styles
- **Hazard_Manager**: The system at `frontend/src/game/hazards/HazardManager.ts` managing hazard zones
- **Transport_Manager**: The system at `frontend/src/game/transport/TransportManager.ts` managing teleporters and jump pads
- **Hex_Grid_Layer**: Existing backdrop layer rendering animated hexagonal grid pattern
- **Circuit_Layer**: Existing backdrop layer rendering animated circuit network with nodes and connections
- **Vortex_Center**: The central area of Vortex Arena (tiles 7-8, rows 3-5) featuring the portal effect
- **Cyber_Color_Palette**: The color scheme for cyber theme: primary cyan (#00ffff), secondary magenta (#ff00ff), accent purple (#8844ff), glow yellow (#ffff44)

## Requirements

### Requirement 1: Theme-Aware Backdrop System

**User Story:** As a developer, I want the BackdropSystem to accept a theme parameter, so that different maps can have different visual backgrounds without code duplication.

#### Acceptance Criteria

1.1. WHEN BackdropSystem is constructed THEN the constructor SHALL accept an optional `theme` parameter of type MapTheme with default value 'space'

1.2. WHEN theme is 'space' THEN BackdropSystem SHALL create layers in order:
- SpaceVoidLayer (parallax: 0)
- NebulaLayer (parallax: 0.1)
- StarFieldLayer (parallax: 0.3)
- CosmicDustLayer (parallax: 0.5)
- ShootingStarLayer (parallax: 0.7)

1.3. WHEN theme is 'cyber' THEN BackdropSystem SHALL create layers in order:
- CyberVoidLayer (parallax: 0) - deep dark purple/black gradient
- HexGridLayer (parallax: 0.1) - animated hex pattern
- CircuitLayer (parallax: 0.3) - animated circuit network
- DataStreamLayer (parallax: 0.5) - falling data particles

1.4. WHEN theme is 'void' THEN BackdropSystem SHALL create layers in order:
- SpaceVoidLayer (parallax: 0) - pure black
- ParticleLayer (parallax: 0.2) - sparse floating particles

1.5. WHEN BackdropSystem.render() is called THEN the system SHALL render all layers in order with their configured parallax offsets

---

### Requirement 2: Cyber Void Layer Implementation

**User Story:** As a player, I want the cyber theme to have a distinctive dark background with subtle color, so that it feels different from the space theme.

#### Acceptance Criteria

2.1. WHEN CyberVoidLayer is created THEN the system SHALL create a new file at `frontend/src/game/backdrop/layers/CyberVoidLayer.ts`

2.2. WHEN CyberVoidLayer.render() is called THEN the system SHALL fill the canvas with a radial gradient:
- Center color: #0a0a1a (very dark blue-purple)
- Edge color: #050510 (near black)
- Gradient center: canvas center
- Gradient radius: 150% of canvas diagonal

2.3. WHEN CyberVoidLayer.render() is called THEN the system SHALL overlay a subtle vignette effect:
- Edge darkness: 20% opacity black
- Vignette radius: 80% of canvas size

2.4. WHEN CyberVoidLayer.update() is called THEN the system SHALL animate a subtle color pulse:
- Pulse frequency: 0.1 Hz (10 second cycle)
- Pulse intensity: ±5% brightness variation

---

### Requirement 3: Map Configuration Theme Property

**User Story:** As a developer, I want to specify a visual theme in the map configuration, so that each map can define its own visual style.

#### Acceptance Criteria

3.1. WHEN MapMetadata interface is defined THEN the interface SHALL include an optional `theme` property of type MapTheme

3.2. WHEN MapTheme type is defined THEN the type SHALL be a union of string literals: 'space' | 'cyber' | 'void'

3.3. WHEN a MapConfig has no theme specified THEN the system SHALL default to 'space' theme

3.4. WHEN VORTEX_ARENA config is defined THEN the metadata SHALL include `theme: 'cyber'`

3.5. WHEN NEXUS_ARENA config is defined THEN the metadata SHALL NOT include a theme property (defaults to 'space')

---

### Requirement 4: GameEngine Theme Integration

**User Story:** As a developer, I want the GameEngine to create the appropriate BackdropSystem based on map theme, so that the visual presentation matches the map configuration.

#### Acceptance Criteria

4.1. WHEN GameEngine is constructed with a MapConfig THEN the system SHALL read the theme from `mapConfig.metadata.theme`

4.2. WHEN GameEngine creates BackdropSystem THEN the system SHALL pass the theme parameter to the BackdropSystem constructor

4.3. WHEN the theme is undefined THEN the system SHALL pass 'space' as the default theme

4.4. WHEN a new map is loaded via loadMap() THEN the system SHALL NOT recreate the BackdropSystem (backdrop is set at construction)

---

### Requirement 5: Animated Hazard Rendering

**User Story:** As a player, I want hazard zones in Vortex Arena to have animated visual effects, so that dangerous areas are visually interesting and clearly visible.

#### Acceptance Criteria

5.1. WHEN HazardManager.render() is called for a 'damage' hazard THEN the system SHALL:
- Render base hazard rectangle with hazard color
- Call AnimatedTileRenderer.render() with type 'electric' for cyber theme
- Call AnimatedTileRenderer.render() with type 'fire' for space theme

5.2. WHEN HazardManager.render() is called for a 'slow' hazard THEN the system SHALL:
- Render base hazard rectangle with hazard color
- Call AnimatedTileRenderer.render() with type 'portal' for cyber theme
- Call AnimatedTileRenderer.render() with type 'water' for space theme

5.3. WHEN HazardManager.render() is called for an 'emp' hazard THEN the system SHALL:
- Render base hazard rectangle with hazard color
- Call AnimatedTileRenderer.render() with type 'electric' for both themes
- Apply yellow glow overlay (#ffff44) at 30% opacity

5.4. WHEN AnimatedTileRenderer.update() is called THEN the system SHALL advance animation time by deltaTime * 1000 (converting to milliseconds)

5.5. WHEN HazardManager is initialized THEN the system SHALL store a reference to the current map theme for render decisions

---

### Requirement 6: Vortex Center Portal Effect

**User Story:** As a player, I want the center of Vortex Arena to have a distinctive swirling portal effect, so that the map's namesake feature is visually prominent.

#### Acceptance Criteria

6.1. WHEN Vortex Arena renders THEN the system SHALL identify the vortex center region as tiles at columns 7-8, rows 3-5 (pixel coordinates 560-720, 240-480)

6.2. WHEN the vortex center is rendered THEN the system SHALL draw a portal effect consisting of:
- Multiple concentric swirl rings (3-5 rings)
- Rings rotating at different speeds (outer faster than inner)
- Color cycling through portal animation colors (#8844ff, #aa66ff, #cc88ff, etc.)

6.3. WHEN the portal effect renders THEN the system SHALL apply a radial glow:
- Glow color: #aa66ff (portal glow color)
- Glow intensity: 50% opacity at center, fading to 0% at edges
- Glow radius: 120 pixels from center

6.4. WHEN the portal effect updates THEN the system SHALL:
- Rotate rings based on elapsed time
- Cycle colors based on animation frame
- Pulse glow intensity (±20% variation)

---

### Requirement 7: Theme-Specific Transport Rendering

**User Story:** As a player, I want teleporters and jump pads to have visual effects matching the map theme, so that transport elements feel cohesive with the arena style.

#### Acceptance Criteria

7.1. WHEN TransportManager.render() renders a teleporter in cyber theme THEN the system SHALL:
- Draw base circle with cyan color (#00ffff)
- Add electric arc effects around the perimeter (using electric animation)
- Apply pulsing glow effect at 40% opacity

7.2. WHEN TransportManager.render() renders a teleporter in space theme THEN the system SHALL:
- Draw base circle with blue gradient
- Add subtle particle effect
- Apply steady glow effect at 30% opacity

7.3. WHEN TransportManager.render() renders a jump pad in cyber theme THEN the system SHALL:
- Draw base circle with magenta color (#ff00ff)
- Add directional arrow indicator
- Apply circuit pattern overlay
- Pulse brightness based on cooldown state

7.4. WHEN TransportManager.render() renders a jump pad in space theme THEN the system SHALL:
- Draw base circle with green gradient
- Add directional arrow indicator
- Apply energy swirl effect

7.5. WHEN a player uses a teleporter THEN the system SHALL trigger a flash effect at both endpoints:
- Flash duration: 200ms
- Flash color: theme-appropriate (cyan for cyber, blue for space)
- Flash intensity: 80% opacity fading to 0%

---

### Requirement 8: Floor Grid Overlay for Cyber Theme

**User Story:** As a player, I want floor tiles in Vortex Arena to have a subtle grid pattern, so that the cyber aesthetic is consistent throughout the map.

#### Acceptance Criteria

8.1. WHEN floor tiles render in cyber theme THEN the system SHALL overlay a hex grid pattern on floor tiles

8.2. WHEN the hex grid overlay renders THEN the system SHALL:
- Use stroke color matching cyber palette (#00ffff at 5% opacity)
- Draw hexagons at 40px size (half tile size)
- Offset alternating rows for proper hex tessellation

8.3. WHEN the hex grid overlay animates THEN the system SHALL:
- Pulse opacity between 3% and 7% (subtle effect)
- Pulse frequency: 0.5 Hz (2 second cycle)
- Phase offset based on hex position for wave effect

8.4. WHEN floor tiles render in space theme THEN the system SHALL NOT render any grid overlay

---

### Requirement 9: Color Palette Constants

**User Story:** As a developer, I want theme color palettes defined as constants, so that colors are consistent and easy to modify.

#### Acceptance Criteria

9.1. WHEN cyber theme colors are needed THEN the system SHALL use constants from a CYBER_COLORS object:
```typescript
CYBER_COLORS = {
  primary: '#00ffff',      // Cyan
  secondary: '#ff00ff',    // Magenta
  accent: '#8844ff',       // Purple
  glow: '#ffff44',         // Electric yellow
  background: '#0a0a1a',   // Dark blue-purple
  gridLine: '#00ffff',     // Cyan for grid
}
```

9.2. WHEN space theme colors are needed THEN the system SHALL use existing BACKDROP_COLORS constants

9.3. WHEN rendering theme-specific elements THEN the system SHALL select colors based on current theme, not hardcoded values

---

### Requirement 10: Animation System Integration

**User Story:** As a developer, I want the AnimatedTileRenderer integrated into the game update loop, so that tile animations are smooth and synchronized.

#### Acceptance Criteria

10.1. WHEN GameEngine.update() is called THEN the system SHALL call AnimatedTileRenderer.update(deltaTime)

10.2. WHEN ArenaManager.update() is called THEN the system SHALL call AnimatedTileRenderer.update(deltaTime) if not already called by GameEngine

10.3. WHEN AnimatedTileRenderer.getFrame() is called THEN the system SHALL return the current frame index based on:
- Total elapsed time
- Animation config frameDuration
- Animation config frames count

10.4. WHEN AnimatedTileRenderer.getColor() is called THEN the system SHALL return the color for the current frame from the animation config colors array

---

### Requirement 11: Render Pipeline Theme Awareness

**User Story:** As a developer, I want the RenderPipeline to be aware of the current theme, so that theme-specific rendering decisions can be made throughout the pipeline.

#### Acceptance Criteria

11.1. WHEN RenderPipeline is constructed THEN the system SHALL accept and store the current map theme

11.2. WHEN RenderPipeline.render() is called THEN the system SHALL pass theme information to renderers that need it

11.3. WHEN theme-specific rendering is needed THEN renderers SHALL check the theme and branch accordingly

11.4. WHEN a renderer does not support theme-specific rendering THEN the renderer SHALL use default (space theme) visuals

---

### Requirement 12: Performance Considerations

**User Story:** As a player, I want the visual effects to run smoothly without impacting gameplay performance, so that the game remains responsive.

#### Acceptance Criteria

12.1. WHEN animated effects render THEN the system SHALL limit particle counts to maximum 50 per effect type

12.2. WHEN hex grid overlay renders THEN the system SHALL only render hexes within the visible viewport plus 1 tile margin

12.3. WHEN portal effect renders THEN the system SHALL use no more than 5 concentric rings

12.4. WHEN circuit layer renders THEN the system SHALL limit node count to maximum 100 nodes

12.5. WHEN effects are disabled in settings (reduced motion) THEN the system SHALL skip animated effects and render static versions

