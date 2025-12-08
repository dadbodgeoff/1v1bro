# Requirements Document

## Introduction

**Vortex Arena** is a premium esports-ready 2D arena map designed for competitive 1v1 PvP quiz battles. The map introduces a dynamic "vortex" center mechanic with rotating hazard zones, strategic teleporter networks, and multi-terrain combat lanes. Unlike the lane-focused Nexus Arena, Vortex Arena emphasizes rotational gameplay, risk-reward positioning, and environmental mastery. The design leverages the full component library including destructible barriers, damage/slow/EMP hazards, pressure and timed traps, teleporter pairs, and multi-directional jump pads to create a visually stunning and mechanically deep competitive experience.

## Glossary

- **Vortex_Arena**: The complete map configuration including all tiles, barriers, hazards, traps, teleporters, jump pads, spawn points, and power-up locations
- **Map_System**: The frontend system responsible for loading, validating, and rendering map configurations
- **Arena_Manager**: The coordinator that initializes all subsystems from a MapConfig
- **Tile_Grid**: A 16x9 grid (1280x720 pixels at 80px/tile) defining the base terrain
- **Vortex_Core**: The central contested area featuring rotating hazard zones and high-value power-up spawns
- **Flanking_Corridors**: Side paths with teleporter access for aggressive rotations
- **Defensive_Alcoves**: Protected spawn-adjacent areas with destructible cover
- **Risk_Lanes**: Paths through hazard zones offering shortcuts but at a cost
- **Symmetry_Mode**: Horizontal mirror symmetry ensuring competitive fairness

## Requirements

### Requirement 1: Map Configuration Structure

**User Story:** As a developer, I want Vortex Arena defined as a valid MapConfig, so that it integrates seamlessly with the existing arena system without code changes.

#### Acceptance Criteria

1. THE Vortex_Arena SHALL define a complete MapConfig object with metadata, tiles, barriers, hazards, traps, teleporters, jumpPads, spawnPoints, and powerUpSpawns arrays
2. WHEN the Map_System loads Vortex_Arena THEN the validateMapConfig function SHALL return {valid: true, errors: []}
3. THE Vortex_Arena metadata SHALL include name "Vortex Arena", author, version "1.0.0", and description under 200 characters
4. THE Vortex_Arena tiles array SHALL define exactly 9 rows of 16 TileDefinition objects each
5. WHEN Arena_Manager calls loadMap with Vortex_Arena THEN all subsystems SHALL initialize without errors

---

### Requirement 2: Spawn Point Balance

**User Story:** As a competitive player, I want spawn points that are equidistant from key objectives, so that neither player has a positional advantage at match start.

#### Acceptance Criteria

1. THE Vortex_Arena SHALL define exactly 2 spawn points with ids 'player1' and 'player2'
2. THE spawn points SHALL be positioned on floor tiles at horizontal mirror positions (player1 at x:160, player2 at x:1120)
3. WHEN measuring distance from each spawn to the arena center (640, 360) THEN both distances SHALL be equal within 1 pixel tolerance
4. THE spawn points SHALL have minimum 160 pixels clearance from any hazard zone boundary
5. THE spawn points SHALL have minimum 80 pixels clearance from any trap trigger radius

---

### Requirement 3: Barrier Layout Design

**User Story:** As a player, I want strategic cover options throughout the map, so that I can make meaningful positioning decisions during combat.

#### Acceptance Criteria

1. THE Vortex_Arena SHALL include a minimum of 8 barriers distributed across the map
2. THE Vortex_Arena SHALL include at least 2 destructible barriers with health between 50-200
3. THE Vortex_Arena SHALL include at least 4 half-wall barriers for partial cover mechanics
4. THE Vortex_Arena SHALL include at least 2 full-wall barriers creating lane structure
5. WHEN validating barriers THEN no two barriers SHALL have overlapping position/size rectangles
6. THE barrier layout SHALL maintain horizontal symmetry with mirrored positions for competitive fairness

---

### Requirement 4: Hazard Zone Placement

**User Story:** As a player, I want hazard zones that create risk-reward decisions, so that aggressive play is rewarded but punished if mistimed.

#### Acceptance Criteria

1. THE Vortex_Arena SHALL include at least 2 damage hazard zones with intensity between 5-25 damage per second
2. THE Vortex_Arena SHALL include at least 2 slow field hazard zones with intensity between 0.25-0.75 speed multiplier
3. THE Vortex_Arena SHALL include at least 1 EMP hazard zone that disables power-ups
4. THE hazard zones SHALL NOT overlap with spawn point positions
5. THE hazard zones SHALL cover no more than 25% of total walkable floor area
6. THE hazard placement SHALL create "risk lanes" - shortcuts through hazards that save travel time but cost health/speed

---

### Requirement 5: Trap System Integration

**User Story:** As a player, I want traps that add tactical depth, so that map awareness and timing become competitive skills.

#### Acceptance Criteria

1. THE Vortex_Arena SHALL include at least 2 pressure traps with cooldown between 5-30 seconds
2. THE Vortex_Arena SHALL include at least 1 timed trap with interval between 5-30 seconds
3. THE trap effect values SHALL deal 35 damage (not instant kill but significant)
4. THE trap trigger radius SHALL be 40 pixels for consistent player interaction
5. THE traps SHALL be positioned at high-traffic chokepoints to reward map awareness
6. THE trap placement SHALL maintain horizontal symmetry

---

### Requirement 6: Teleporter Network

**User Story:** As a player, I want teleporters that enable aggressive rotations, so that I can outmaneuver opponents through superior map knowledge.

#### Acceptance Criteria

1. THE Vortex_Arena SHALL include at least 2 teleporter pairs (4 total teleporter pads)
2. WHEN validating teleporters THEN each pairId SHALL have exactly 2 matching teleporter entries
3. THE teleporter radius SHALL be 30 pixels for precise activation
4. THE teleporter pairs SHALL connect opposite sides of the map enabling flanking routes
5. THE teleporters SHALL NOT be positioned within hazard zones
6. THE teleporter placement SHALL maintain horizontal symmetry

---

### Requirement 7: Jump Pad Dynamics

**User Story:** As a player, I want jump pads that create exciting movement options, so that skilled players can execute advanced positioning plays.

#### Acceptance Criteria

1. THE Vortex_Arena SHALL include at least 4 jump pads with varied directions
2. THE jump pad force SHALL be 400 units/second for consistent launch distance
3. THE jump pad radius SHALL be 40 pixels for reliable activation
4. THE jump pads SHALL use at least 3 different directions from: N, S, E, W, NE, NW, SE, SW
5. THE jump pad placement SHALL create "rotation routes" connecting key map areas
6. THE jump pad placement SHALL maintain horizontal symmetry

---

### Requirement 8: Power-Up Spawn Distribution

**User Story:** As a player, I want power-up spawns distributed fairly, so that both players have equal opportunity to contest objectives.

#### Acceptance Criteria

1. THE Vortex_Arena SHALL define at least 8 power-up spawn positions
2. THE power-up spawns SHALL be distributed across all major map areas (center, lanes, flanks)
3. THE power-up spawns SHALL maintain horizontal symmetry for competitive fairness
4. THE power-up spawns SHALL NOT be positioned inside hazard zone boundaries
5. THE power-up spawns SHALL have minimum 40 pixels spacing from trap trigger radii
6. WHEN measuring distance from each spawn to nearest power-up THEN both players SHALL have equal access to at least 4 spawns

---

### Requirement 9: Visual Theme - Vortex Core

**User Story:** As a player, I want a visually distinctive map theme, so that Vortex Arena feels unique and memorable compared to Nexus Arena.

#### Acceptance Criteria

1. THE Vortex_Arena center area SHALL feature a distinctive "vortex" pattern using hazard tile combinations
2. THE tile layout SHALL create visual flow guiding players toward contested areas
3. THE hazard zones SHALL be positioned to create a rotating/spiral visual pattern around the center
4. THE barrier placement SHALL frame the vortex core creating clear sightlines
5. THE overall aesthetic SHALL differentiate from Nexus Arena's lane-focused design

---

### Requirement 10: Map Selection Integration

**User Story:** As a developer, I want Vortex Arena exported alongside Nexus Arena, so that the game can support multiple map options.

#### Acceptance Criteria

1. THE Vortex_Arena configuration SHALL be exported from a new file 'vortex-arena.ts'
2. THE maps index.ts SHALL export both NEXUS_ARENA and VORTEX_ARENA configurations
3. WHEN importing from 'config/maps' THEN both map configurations SHALL be available
4. THE Vortex_Arena SHALL pass all validation rules defined in map-schema.ts
5. THE Vortex_Arena SHALL be loadable by ArenaManager.loadMap() without errors
