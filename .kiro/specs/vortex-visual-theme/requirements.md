# Requirements Document

## Introduction

This specification defines a complete volcanic/lava themed transformation for Vortex Arena, creating a unique and immersive experience distinct from Nexus Arena. The implementation integrates all available visual systems (animated tiles, extended terrain types, backdrop layers) along with custom terrain zones, themed barriers, and full utilization of trap mechanics to create a "Volcanic Vortex" arena.

**Current State Analysis:**

| Component | Current Implementation | Problem |
|-----------|----------------------|---------|
| Backdrop System | Space theme only | Both maps look identical in background |
| Animated Tiles | water, lava, fire, electric, portal exist | NOT integrated - lava/fire perfect for volcanic theme |
| Extended Terrain | ice, sand, water, lava, void, grass, stone defined | NOT in TileType enum, completely unused |
| Tile Rendering | Basic colored rectangles | No animated effects, no terrain variety |
| Hazard Zones | Generic colored zones | Not themed to match map aesthetic |
| Barriers | Generic gray/blue colors | Not themed, no volcanic rock appearance |
| Traps | Pressure + timed traps exist | Not fully utilized for volcanic theme |
| Transport | Generic teleporter/jump pad visuals | Not themed to volcanic aesthetic |

**Vortex Arena Volcanic Theme Vision:**

| Element | Description |
|---------|-------------|
| Background | Dark volcanic cavern with lava glow, smoke particles, ember effects |
| Floor Terrain | Mix of stone, obsidian, cooled lava rock with cracks |
| Lava Zones | Animated lava pools using lava tile animation (damage hazards) |
| Fire Hazards | Animated fire effects on damage zones |
| Steam Vents | Slow zones rendered as steam/smoke effects |
| Volcanic Barriers | Dark obsidian rock barriers with orange glow edges |
| Lava Traps | Pressure plates that trigger lava bursts |
| Magma Teleporters | Teleporters with swirling magma portal effect |
| Eruption Jump Pads | Jump pads with volcanic eruption visual |
| Center Vortex | Massive lava whirlpool at map center |

## Glossary

- **Volcanic_Theme**: The visual theme for Vortex Arena featuring lava, fire, obsidian, and volcanic effects
- **Animated_Tile_Renderer**: The system at `frontend/src/game/terrain/AnimatedTiles.ts` providing lava, fire, water, electric, portal animations
- **Extended_Terrain**: Additional terrain types (lava, stone, void) from `TerrainTypes.ts` to be integrated
- **Lava_Pool**: A damage hazard zone rendered with animated lava tile effects
- **Steam_Vent**: A slow hazard zone rendered with animated water/steam effects
- **Obsidian_Barrier**: A barrier rendered with dark volcanic rock texture and orange glow
- **Magma_Teleporter**: A teleporter with swirling lava portal animation
- **Eruption_Pad**: A jump pad with volcanic eruption particle effect
- **Volcanic_Backdrop**: New backdrop layers featuring cavern walls, lava glow, smoke, embers
- **Lava_Vortex**: The central feature of the map - a massive animated lava whirlpool

## Requirements

### Requirement 1: Volcanic Backdrop System

**User Story:** As a player, I want Vortex Arena to have a volcanic cavern background, so that the map feels like a dangerous underground lava environment.

#### Acceptance Criteria

1.1. WHEN the volcanic backdrop renders THEN the system SHALL display a dark cavern background with deep red/orange ambient glow from below

1.2. WHEN the volcanic backdrop renders THEN the system SHALL display animated smoke/haze particles drifting upward

1.3. WHEN the volcanic backdrop renders THEN the system SHALL display ember particles floating and fading

1.4. WHEN the volcanic backdrop renders THEN the system SHALL display subtle lava glow pulsing effect at the edges

1.5. WHEN the volcanic backdrop updates THEN the system SHALL animate smoke drift, ember float, and glow pulse at appropriate frame rates

---

### Requirement 2: Lava Terrain Integration

**User Story:** As a player, I want to see animated lava pools in Vortex Arena, so that dangerous areas are visually dramatic and clearly identifiable.

#### Acceptance Criteria

2.1. WHEN a damage hazard zone renders in volcanic theme THEN the system SHALL use the AnimatedTileRenderer with 'lava' type

2.2. WHEN lava tiles animate THEN the system SHALL cycle through lava colors (#ff4400, #ff6600, #ff8800, #ff6600) at 150ms per frame

2.3. WHEN lava tiles render THEN the system SHALL display animated bubble effects rising from the surface

2.4. WHEN lava tiles render THEN the system SHALL display hot crack patterns with brighter orange glow

2.5. WHEN lava tiles render THEN the system SHALL apply a radial glow effect with color #ff4400 at 50% intensity

---

### Requirement 3: Fire Hazard Effects

**User Story:** As a player, I want fire effects on certain hazard zones, so that the volcanic theme has variety beyond just lava.

#### Acceptance Criteria

3.1. WHEN rendering fire hazard tiles THEN the system SHALL use the AnimatedTileRenderer with 'fire' type

3.2. WHEN fire tiles animate THEN the system SHALL cycle through fire colors at 100ms per frame with 6 frames

3.3. WHEN fire tiles render THEN the system SHALL display animated flame tongue effects flickering upward

3.4. WHEN fire tiles render THEN the system SHALL apply orange glow effect (#ff6600) at 40% intensity

---

### Requirement 4: Steam Vent Slow Zones

**User Story:** As a player, I want slow zones to appear as steam vents, so that they fit the volcanic theme while being clearly different from lava.

#### Acceptance Criteria

4.1. WHEN a slow hazard zone renders in volcanic theme THEN the system SHALL display steam/smoke particle effects

4.2. WHEN steam vent renders THEN the system SHALL use white/gray color palette with upward particle drift

4.3. WHEN steam vent renders THEN the system SHALL apply subtle blur/haze effect to indicate reduced visibility

4.4. WHEN steam vent animates THEN the system SHALL pulse steam intensity to create "venting" effect

---

### Requirement 5: Obsidian Volcanic Barriers

**User Story:** As a player, I want barriers to look like volcanic obsidian rock, so that cover elements match the volcanic environment.

#### Acceptance Criteria

5.1. WHEN a full barrier renders in volcanic theme THEN the system SHALL display dark obsidian texture (#1a1a1a to #2d2d2d gradient)

5.2. WHEN a barrier renders THEN the system SHALL display orange/red glow along edges simulating heat

5.3. WHEN a half barrier renders THEN the system SHALL display cracked rock texture with visible lava glow through cracks

5.4. WHEN a destructible barrier renders THEN the system SHALL display increasingly visible cracks and glow as health decreases

5.5. WHEN a destructible barrier is destroyed THEN the system SHALL trigger a lava burst particle effect

---

### Requirement 6: Volcanic Trap Mechanics

**User Story:** As a player, I want traps to have volcanic effects, so that trap triggers feel dramatic and match the theme.

#### Acceptance Criteria

6.1. WHEN a pressure trap triggers in volcanic theme THEN the system SHALL display a lava geyser burst effect

6.2. WHEN a timed trap activates THEN the system SHALL display ground crack effect before eruption

6.3. WHEN trap damage is applied THEN the system SHALL display fire/lava splash particles at the impact point

6.4. WHEN a trap is on cooldown THEN the system SHALL display smoldering embers effect indicating recharge

---

### Requirement 7: Magma Portal Teleporters

**User Story:** As a player, I want teleporters to look like swirling magma portals, so that transport elements match the volcanic aesthetic.

#### Acceptance Criteria

7.1. WHEN a teleporter renders in volcanic theme THEN the system SHALL display swirling lava/magma animation using portal effect with orange/red colors

7.2. WHEN teleporter renders THEN the system SHALL display heat distortion effect around the portal edge

7.3. WHEN a player uses a teleporter THEN the system SHALL display a lava splash effect at departure and arrival points

7.4. WHEN teleporter is on cooldown THEN the system SHALL display dimmed magma with slower swirl animation

---

### Requirement 8: Eruption Jump Pads

**User Story:** As a player, I want jump pads to look like volcanic vents that erupt, so that the launch feels powerful and thematic.

#### Acceptance Criteria

8.1. WHEN a jump pad renders in volcanic theme THEN the system SHALL display a volcanic vent with glowing magma core

8.2. WHEN a player activates a jump pad THEN the system SHALL display an eruption effect with lava particles shooting upward

8.3. WHEN jump pad is idle THEN the system SHALL display bubbling lava and steam wisps

8.4. WHEN jump pad direction indicator renders THEN the system SHALL use fire/lava colored arrow

---

### Requirement 9: Central Lava Vortex Feature

**User Story:** As a player, I want the center of Vortex Arena to have a massive lava whirlpool, so that the map's namesake feature is visually spectacular.

#### Acceptance Criteria

9.1. WHEN the vortex center renders THEN the system SHALL display a large swirling lava whirlpool animation

9.2. WHEN the lava vortex renders THEN the system SHALL display multiple concentric swirl rings rotating at different speeds

9.3. WHEN the lava vortex renders THEN the system SHALL display debris/rock particles being pulled toward center

9.4. WHEN the lava vortex renders THEN the system SHALL apply intense orange/red glow radiating outward

9.5. WHEN the lava vortex renders THEN the system SHALL display occasional lava splash effects at the edges

---

### Requirement 10: Stone Floor Terrain

**User Story:** As a player, I want floor tiles to look like volcanic stone, so that the entire arena feels like a volcanic environment.

#### Acceptance Criteria

10.1. WHEN floor tiles render in volcanic theme THEN the system SHALL display dark stone texture (#2a2a2a to #3a3a3a)

10.2. WHEN floor tiles render THEN the system SHALL display subtle crack patterns with faint orange glow

10.3. WHEN floor tiles render THEN the system SHALL vary texture slightly per tile for natural appearance

10.4. WHEN floor tiles near lava zones render THEN the system SHALL display increased glow/heat effect

---

### Requirement 11: Volcanic Color Palette

**User Story:** As a developer, I want volcanic theme colors defined as constants, so that colors are consistent throughout the arena.

#### Acceptance Criteria

11.1. WHEN volcanic theme colors are needed THEN the system SHALL use VOLCANIC_COLORS constants with lavaCore (#ff4400), lavaGlow (#ff6600), lavaDark (#cc3300), fire (#ffaa00), ember (#ff8844), obsidian (#1a1a1a), stone (#2d2d2d), smoke (#4a4a4a), steam (#888888), crack (#ff2200)

11.2. WHEN rendering volcanic elements THEN the system SHALL select colors from VOLCANIC_COLORS, not hardcoded values

---

### Requirement 12: Map Configuration for Volcanic Theme

**User Story:** As a developer, I want the map configuration to specify volcanic theme, so that the rendering system knows to use volcanic visuals.

#### Acceptance Criteria

12.1. WHEN MapTheme type is defined THEN the type SHALL include 'volcanic' as a valid option

12.2. WHEN VORTEX_ARENA config is defined THEN the metadata SHALL include `theme: 'volcanic'`

12.3. WHEN GameEngine loads a map with volcanic theme THEN the system SHALL create VolcanicBackdropSystem

12.4. WHEN renderers receive volcanic theme THEN the system SHALL use volcanic-specific rendering for all elements

---

### Requirement 13: Animated Tile System Integration

**User Story:** As a developer, I want the AnimatedTileRenderer integrated into the game loop, so that all volcanic animations are smooth and synchronized.

#### Acceptance Criteria

13.1. WHEN GameEngine.update() is called THEN the system SHALL call AnimatedTileRenderer.update(deltaTime)

13.2. WHEN HazardManager renders THEN the system SHALL use AnimatedTileRenderer for lava and fire effects

13.3. WHEN TransportManager renders THEN the system SHALL use AnimatedTileRenderer for portal effects

13.4. WHEN the vortex center renders THEN the system SHALL use AnimatedTileRenderer for lava swirl

---

### Requirement 14: Performance Optimization

**User Story:** As a player, I want volcanic effects to run smoothly, so that visual fidelity doesn't impact gameplay.

#### Acceptance Criteria

14.1. WHEN particle effects render THEN the system SHALL limit total particles to 200 across all effect types

14.2. WHEN animated tiles render THEN the system SHALL only render tiles within viewport plus 1 tile margin

14.3. WHEN glow effects render THEN the system SHALL use cached gradients where possible

14.4. WHEN reduced motion setting is enabled THEN the system SHALL display static volcanic visuals without animation
