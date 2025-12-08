# 2D Arena Shooter + Trivia Game: Enterprise Asset Cheatsheet
## Complete Asset Library for Mass Production & Reusable Map Components

**Last Updated:** December 2025 | **Target Platform:** Web/Canvas-based 2D (Recommended for scalability)

---

## TABLE OF CONTENTS

1. [Core Architecture](#core-architecture)
2. [Tileset System](#tileset-system)
3. [Base Terrain Tiles](#base-terrain-tiles)
4. [Barriers & Collision Objects](#barriers--collision-objects)
5. [Interactive Map Objects](#interactive-map-objects)
6. [Environmental Effects & Overlays](#environmental-effects--overlays)
7. [Layer Rendering System](#layer-rendering-system)
8. [Map Layout Patterns & Lanes](#map-layout-patterns--lanes)
9. [Reusable Object Library](#reusable-object-library)
10. [Data Format Specification](#data-format-specification)
11. [Performance Optimization](#performance-optimization)
12. [Procedural Generation Rules](#procedural-generation-rules)

---

## CORE ARCHITECTURE

### Design Principles

- **Modular & Reusable**: Every asset exists independently and can be composed into new maps
- **Data-Driven**: Map layout defined in JSON/structured format, not hard-coded
- **Scale-Agnostic**: Works with 16×16, 32×32, 48×48 tile sizes (recommend 32×32)
- **Layer-Based Rendering**: Separate passes for terrain, objects, effects, UI
- **Collision-Aware**: Every object has collision metadata
- **Performance-First**: Sprite batching, draw-call optimization, spatial indexing

### Recommended Tile Size: 32×32 pixels
- **Padding**: 1-2 pixels per tile to prevent texture bleeding
- **Atlas Format**: 2048×2048 or 4096×4096 PNG with metadata
- **Color Depth**: RGBA (alpha channel for transparency)

---

## TILESET SYSTEM

### Overview
All tile assets organized into themed atlases. Each atlas targets specific environmental styles.

### Standard Tileset Categories

| Category | Purpose | Example Tiles | Atlas Size |
|----------|---------|---------------|-----------|
| **Base Terrain** | Ground/floor surfaces | Grass, stone, concrete, sand | 512×512 min |
| **Barriers/Walls** | Collision objects | Stone walls, fences, hedges | 512×512 min |
| **Decorative** | Visual flavor | Trees, rocks, benches | 512×512 min |
| **Interactive** | Gameplay mechanics | Trivia pads, healing zones, spawners | 512×512 min |
| **Effects** | Visual polish | Particle overlays, damage zones | 512×512 min |
| **Structure** | Arena elements | Platforms, ramps, towers | 512×512 min |

### Atlas Organization Template (PNG Naming)
```
tileset_[theme]_[category]_[size].png
├── tileset_forest_base_32x32.png
├── tileset_forest_barriers_32x32.png
├── tileset_forest_interactive_32x32.png
├── tileset_urban_base_32x32.png
├── tileset_urban_barriers_32x32.png
└── [continue pattern]
```

---

## BASE TERRAIN TILES

### Core Terrain Types (Mandatory Set)

Each terrain type should have **4-8 variants** for visual variety using autotiling or manual placement.

#### 1. **Grass/Turf**
- **Base tile** (solid grass)
- **Variants**: Light grass, dark grass, moss patches
- **Properties**:
  - `walkable: true`
  - `friction: 0.85` (normal movement)
  - `sound_tag: "grass"`
  - `height: 0` (ground level)

#### 2. **Stone/Concrete**
- **Base tile** (smooth stone)
- **Variants**: Cracked stone, light concrete, dark concrete
- **Properties**:
  - `walkable: true`
  - `friction: 0.95` (less slippery)
  - `sound_tag: "stone"`
  - `height: 0`

#### 3. **Water/Hazard**
- **Base tile** (animated water)
- **Variants**: Deep water, shallow water, toxic sludge
- **Properties**:
  - `walkable: false`
  - `damage: 5` (per frame)
  - `sound_tag: "water"`
  - `height: -1` (below ground)

#### 4. **Sand**
- **Base tile** (sandy ground)
- **Variants**: Light sand, dark sand, sandstone
- **Properties**:
  - `walkable: true`
  - `friction: 0.70` (higher friction/slower movement)
  - `sound_tag: "sand"`
  - `height: 0`

#### 5. **Ice/Slippery**
- **Base tile** (glossy ice)
- **Variants**: Thick ice, cracking ice, frozen surface
- **Properties**:
  - `walkable: true`
  - `friction: 0.40` (very slippery)
  - `sound_tag: "ice"`
  - `height: 0`

#### 6. **Lava/Damage Zone**
- **Base tile** (glowing lava)
- **Variants**: Cooling lava, bright lava
- **Properties**:
  - `walkable: false`
  - `damage: 10` (per frame, high damage)
  - `sound_tag: "lava"`
  - `height: -1`

#### 7. **Void/Out-of-Bounds**
- **Base tile** (dark void/abyss)
- **Variants**: Purple void, black void
- **Properties**:
  - `walkable: false`
  - `damage: 20` (instant death-like)
  - `sound_tag: "void"`
  - `height: -2`

### Tile Variant Formula

For **N base terrain types**, create:
- **1 base variant** (standard appearance)
- **3-4 visual variants** (same properties, different colors/patterns)
- **2-3 damaged/worn variants** (worn look, same properties)

**Total per terrain type: 6-8 tile variations**

---

## BARRIERS & COLLISION OBJECTS

### Wall Types (Static, Non-Passable)

#### 1. **Short Wall** (player height)
- **Dimensions**: 32×32 px
- **Properties**:
  - `collision: true`
  - `height: 32` (blocks shots at player height)
  - `passable: false`
  - `destructible: false`
  - `visual_layer: "object"`
  - `variants: 4` (corner, straight, T-junction, cross)

#### 2. **Tall Wall** (above player height)
- **Dimensions**: 32×64 px (double height)
- **Properties**:
  - `collision: true`
  - `height: 64` (full cover)
  - `passable: false`
  - `destructible: false`
  - `visual_layer: "background"` (renders behind player)

#### 3. **Half Wall** (cover, but player can fire over)
- **Dimensions**: 32×16 px
- **Properties**:
  - `collision: true`
  - `height: 16` (partial cover)
  - `passable: true` (can jump over)
  - `destructible: false`
  - `visual_layer: "object"`

#### 4. **Fence** (low barrier, same as half wall)
- **Dimensions**: 32×12 px
- **Properties**:
  - `collision: true`
  - `height: 12`
  - `passable: true`
  - `destructible: true`
  - `health: 25` (can be destroyed by repeated fire)

#### 5. **Breakable Crate/Object**
- **Dimensions**: 32×32 px
- **Properties**:
  - `collision: true`
  - `height: 32`
  - `passable: false`
  - `destructible: true`
  - `health: 15`
  - `drops: ["ammo", "heal"]` (loot table)

### Wall Variants (Per Type)

For **each wall type**, provide:
- **Straight segments** (horizontal, vertical)
- **Corner pieces** (4 directions)
- **T-junctions** (3 directions)
- **Cross piece** (4-way intersection)
- **Edge pieces** (for map borders)

**Total per wall type: 12-16 visual variants**

---

## INTERACTIVE MAP OBJECTS

### 1. **Trivia Pad** (Core Gameplay)

**Purpose**: Players stand here to answer trivia, gaining buffs/points

- **Dimensions**: 32×32 px
- **Visual**: Glowing platform with question mark
- **Properties**:
  - `collision: false` (player walks through)
  - `interaction_radius: 48` px
  - `on_enter: trigger_trivia_dialog`
  - `timeout: 8000` ms
  - `points_reward: 50`
  - `buff_type: ["speed", "damage", "defense"]`
  - `buff_duration: 5000` ms

**Variants**:
- Active (glowing)
- Inactive (dimmed)
- Cooldown (fading)
- Consumed (used recently)

### 2. **Spawn Point**

- **Dimensions**: 32×32 px
- **Visual**: Colored circle (team-specific)
- **Properties**:
  - `collision: false`
  - `team: ["red", "blue", "neutral"]`
  - `spawn_delay: 2000` ms
  - `max_players: 1`
  - `visual_layer: "background"`

**Variants**:
- Red team
- Blue team
- Neutral/Free-for-all

### 3. **Health Pack**

- **Dimensions**: 16×16 px
- **Visual**: Glowing cross/plus symbol
- **Properties**:
  - `collision: false`
  - `interaction_radius: 24` px
  - `heal_amount: 50`
  - `one_time: true`
  - `respawn_time: 10000` ms

**Variants**:
- Small heal (+25)
- Medium heal (+50)
- Large heal (+100)

### 4. **Ammo/Weapon Pickup**

- **Dimensions**: 16×16 px
- **Visual**: Ammo icon/weapon symbol
- **Properties**:
  - `collision: false`
  - `interaction_radius: 24` px
  - `weapon_type: ["pistol", "rifle", "shotgun"]`
  - `ammo_amount: 30`
  - `one_time: true`
  - `respawn_time: 5000` ms

### 5. **Speed Boost Pad**

- **Dimensions**: 32×32 px
- **Visual**: Arrow pointing in direction
- **Properties**:
  - `collision: false`
  - `direction: [0, -1]` (up)
  - `boost_force: 10` (units/sec)
  - `duration: 2000` ms
  - `reusable: true`

**Variants**:
- Up arrow
- Down arrow
- Left arrow
- Right arrow
- Directional (4 variants)

### 6. **Jump Pad**

- **Dimensions**: 32×32 px
- **Visual**: Bouncy platform
- **Properties**:
  - `collision: true` (triggers on contact)
  - `jump_force: 15` (units/sec vertical)
  - `duration: 500` ms
  - `reusable: true`
  - `sound_tag: "bounce"`

### 7. **Hazard Zone** (Damage Field)

- **Dimensions**: 32×32 px (or larger)
- **Visual**: Spikes, fire, electricity overlay
- **Properties**:
  - `collision: false`
  - `damage: 5` (per frame)
  - `damage_type: ["spike", "fire", "electric"]`
  - `effect_type: "knockback"` (optional)
  - `knockback_force: 5`

**Variants**:
- Spikes (physical)
- Fire (burn damage)
- Electric (stun)
- Poison (damage over time)

### 8. **Door/Gate** (Dynamic)

- **Dimensions**: 32×32 px
- **Visual**: Closed/open door
- **Properties**:
  - `collision: true` (when closed)
  - `state: ["open", "closed"]`
  - `trigger_condition: "trivia_solved"` or timer
  - `open_animation: 500` ms
  - `open_sound: "door_open"`

### 9. **Pressure Plate** (Trigger)

- **Dimensions**: 32×32 px
- **Visual**: Subtle floor pattern
- **Properties**:
  - `collision: false`
  - `trigger_on: "player_contact"`
  - `triggered_object: "door_id_1"` (references specific door/gate)
  - `timeout: 3000` ms
  - `reusable: true`

### 10. **Platform** (Dynamic, Movable)

- **Dimensions**: 32–64 px (variable width)
- **Visual**: Metallic platform
- **Properties**:
  - `collision: true`
  - `movement_type: ["linear", "sine_wave", "circular"]`
  - `path: [[0, 0], [100, 0], [100, 100]]` (waypoints)
  - `speed: 2` (units/sec)
  - `loop: true`

---

## ENVIRONMENTAL EFFECTS & OVERLAYS

### 1. **Particle Effect Triggers**

#### Dust/Smoke
- **Trigger**: On player footstep, explosion
- **Duration**: 200–500 ms
- **Layer**: Above player
- **Properties**: `fade: true`, `color: "gray"`

#### Fire Spread
- **Trigger**: Fire hazard zone
- **Duration**: Continuous (looping)
- **Layer**: Below player
- **Properties**: `animated: true`, `animation_frames: 4`, `frame_duration: 100` ms

#### Water Splash
- **Trigger**: Player enters water
- **Duration**: 300 ms
- **Layer**: Below player
- **Properties**: `color: "blue"`, `particle_count: 8`

#### Electricity Arc
- **Trigger**: Electric hazard/shock
- **Duration**: 200 ms
- **Layer**: Above all
- **Properties**: `color: "yellow"`, `brightness: 1.5`

### 2. **Lighting Effects**

#### Shadow Casting
- **Type**: Dynamic shadow from objects
- **Properties**:
  - `shadow_color: "rgba(0,0,0,0.3)"`
  - `shadow_offset: [2, 2]` px
  - `shadow_blur: 4` px

#### Light Glow
- **Type**: Radial glow from interactive objects
- **Properties**:
  - `glow_color: "cyan"`
  - `glow_radius: 64` px
  - `glow_intensity: 0.5`
  - `animate: true` (pulse effect)

#### Fog/Mist Overlay
- **Type**: Gradient overlay
- **Properties**:
  - `color: "rgba(150, 150, 150, 0.2)"`
  - `direction: "top_to_bottom"`
  - `intensity: 0.3`

### 3. **Screen Effects**

#### Damage Vignette
- **Type**: Red edge darkening
- **Trigger**: Player takes damage
- **Duration**: 200 ms
- **Properties**: `color: "red"`, `intensity: 0.4`

#### Stun Flash
- **Type**: White flash overlay
- **Trigger**: Player stunned
- **Duration**: 100 ms
- **Properties**: `color: "white"`, `intensity: 0.8`

#### Trivia Correct Flash
- **Type**: Green/yellow flash
- **Trigger**: Correct answer
- **Duration**: 300 ms
- **Properties**: `color: "lime"`, `intensity: 0.6`

---

## LAYER RENDERING SYSTEM

### Standard Layer Stack (Bottom to Top)

```
Layer 0: Background / Sky / Far Scenery
  └─ Distance objects (mountains, clouds)
  └─ Parallax layer (optional, 50% speed)

Layer 1: Base Terrain
  └─ Grass, stone, sand, water tiles
  └─ Ground-level decorations

Layer 2: Barriers & Obstacles
  └─ Walls, fences, crates
  └─ Collision objects below player height

Layer 3: Ground-Level Objects
  └─ Trivia pads, health packs, ammo
  └─ Pressure plates, boost pads

Layer 4: Player & Dynamic Objects
  └─ Players (render in Z-order by Y position)
  └─ Projectiles
  └─ Moving platforms

Layer 5: Above-Ground Obstacles
  └─ Tall walls, overhangs
  └─ Objects above player height

Layer 6: Effects & Particle Systems
  └─ Explosions, dust, sparks
  └─ Damage numbers, floating text
  └─ Animations (spawn effects, trivia success)

Layer 7: UI Overlays
  └─ Health bars, name plates
  └─ Minimap
  └─ Trivia dialog box
  └─ Score/points display
```

### Layer Configuration (JSON)

```json
{
  "layers": [
    {
      "id": "background",
      "z_index": 0,
      "parallax": 0.5,
      "visible": true,
      "camera_follow": false
    },
    {
      "id": "terrain",
      "z_index": 1,
      "parallax": 1.0,
      "visible": true,
      "camera_follow": true,
      "batch_render": true
    },
    {
      "id": "barriers",
      "z_index": 2,
      "parallax": 1.0,
      "visible": true,
      "camera_follow": true,
      "collision": true,
      "batch_render": true
    },
    {
      "id": "objects",
      "z_index": 3,
      "parallax": 1.0,
      "visible": true,
      "camera_follow": true,
      "collision": false
    },
    {
      "id": "players",
      "z_index": 4,
      "parallax": 1.0,
      "visible": true,
      "camera_follow": true,
      "sort_by": "y_position"
    },
    {
      "id": "above_obstacles",
      "z_index": 5,
      "parallax": 1.0,
      "visible": true,
      "camera_follow": true,
      "collision": true
    },
    {
      "id": "effects",
      "z_index": 6,
      "parallax": 1.0,
      "visible": true,
      "camera_follow": true,
      "sort_by": "creation_time"
    },
    {
      "id": "ui",
      "z_index": 7,
      "parallax": 0,
      "visible": true,
      "camera_follow": false
    }
  ]
}
```

---

## MAP LAYOUT PATTERNS & LANES

### Arena Layout Types

#### 1. **Symmetrical 1v1 Arena**
```
    SPAWN1
      ↓
   [ARENA]  ← Trivia Pads scattered
      ↑
    SPAWN2
```

- Size: 512×512 px minimum
- Lanes: 1 center lane with flanking routes
- Trivia pads: 4–6 positioned at compass points
- Barriers: Symmetrical placement for fairness

#### 2. **Asymmetrical Team Arena (Red vs Blue)**
```
RED SPAWN ─┬─ Upper Route
           │
      [ARENA] ← Mixed terrain & hazards
           │
        ─┬─ Lower Route
BLUE SPAWN
```

- Size: 800×600 px
- Lanes: 2–3 distinct routes to center
- Trivia pads: 8–10 (neutral zones)
- Barriers: Asymmetric but balanced

#### 3. **Circular Arena (Free-for-All)**
```
        SPAWN3
          ↑
SPAWN4 ← ARENA → SPAWN2
          ↓
        SPAWN1
```

- Size: 600×600 px
- Lanes: Radial spokes from center
- Trivia pads: 6–8 evenly distributed
- Barriers: Circular/octagonal walls

#### 4. **Tower Defense / King of the Hill**
```
SPAWN1 ──────
           ╔════╗
           ║ HQ ║  ← Central zone to control
           ╚════╝
        ──────SPAWN2
```

- Size: 800×800 px
- Lanes: Multiple approach routes
- Trivia pads: Around central objective
- Barriers: Fortress-like central structure

#### 5. **Maze/Corridor Arena**
```
SPAWN1 → [Corridor] → [Room] → [Corridor] → SPAWN2
              ↓
         [Side Room]
```

- Size: 1024×512 px
- Lanes: Linear with branching side routes
- Trivia pads: In intersections & dead ends
- Barriers: Dense, creates tactical chokepoints

### Lane Composition Formula

For each lane:
1. **Open Lane** (40% width): Player movement space
2. **Barrier Line** (20% width): Walls, obstacles
3. **Object Spaces** (20% width): Trivia pads, items
4. **Hazard Zone** (20% width): Damage tiles, traps

---

## REUSABLE OBJECT LIBRARY

### Standardized Component System

All objects export/import using this structure for maximum reusability:

```json
{
  "component_id": "barrier_wall_stone_01",
  "type": "barrier",
  "category": "wall",
  "dimensions": { "width": 32, "height": 32 },
  "visual": {
    "tile_id": "tileset_stone_barriers_01",
    "atlas": "tileset_stone_barriers_32x32.png",
    "offset": { "x": 0, "y": 0 },
    "color_tint": "#ffffff"
  },
  "physics": {
    "collision": true,
    "collision_shape": "rectangle",
    "collision_offset": { "x": 0, "y": 0 },
    "friction": 0.9,
    "restitution": 0
  },
  "properties": {
    "passable": false,
    "destructible": false,
    "health": null
  },
  "tags": ["wall", "barrier", "stone", "arena"],
  "variants": [
    { "id": "straight_h", "offset": { "x": 0, "y": 0 } },
    { "id": "straight_v", "offset": { "x": 32, "y": 0 } },
    { "id": "corner_tl", "offset": { "x": 64, "y": 0 } },
    { "id": "corner_tr", "offset": { "x": 96, "y": 0 } }
  ]
}
```

### Master Object Library (Template)

```json
{
  "library": [
    { "id": "terrain_grass_base", "type": "terrain", "category": "ground" },
    { "id": "terrain_stone_base", "type": "terrain", "category": "ground" },
    { "id": "barrier_wall_short", "type": "barrier", "category": "wall" },
    { "id": "barrier_wall_tall", "type": "barrier", "category": "wall" },
    { "id": "barrier_fence", "type": "barrier", "category": "fence" },
    { "id": "interactive_trivia_pad", "type": "interactive", "category": "gameplay" },
    { "id": "interactive_spawn_point", "type": "interactive", "category": "spawn" },
    { "id": "interactive_health_pack_small", "type": "interactive", "category": "item" },
    { "id": "interactive_ammo_pickup", "type": "interactive", "category": "item" },
    { "id": "interactive_speed_boost_up", "type": "interactive", "category": "boost" },
    { "id": "interactive_jump_pad", "type": "interactive", "category": "boost" },
    { "id": "hazard_spikes", "type": "hazard", "category": "damage" },
    { "id": "hazard_fire", "type": "hazard", "category": "damage" },
    { "id": "hazard_electric", "type": "hazard", "category": "damage" },
    { "id": "structure_platform", "type": "structure", "category": "dynamic" },
    { "id": "structure_door", "type": "structure", "category": "door" },
    { "id": "decoration_tree", "type": "decoration", "category": "scenery" },
    { "id": "decoration_rock", "type": "decoration", "category": "scenery" }
  ]
}
```

### Copy-Paste Library Entry (Use for Any Map)

```json
{
  "x": 128,
  "y": 256,
  "component_id": "barrier_wall_short",
  "variant": "corner_tl",
  "rotation": 0,
  "scale": 1.0,
  "flip": { "x": false, "y": false },
  "overrides": {
    "color_tint": "#ffffff"
  }
}
```

---

## DATA FORMAT SPECIFICATION

### Complete Map File Structure (JSON)

```json
{
  "map_meta": {
    "id": "arena_forest_01",
    "name": "Forest Arena - Classic 1v1",
    "version": "1.0",
    "created_date": "2025-12-08",
    "tileset_pack": "forest",
    "map_type": "arena_1v1",
    "dimensions": {
      "width": 512,
      "height": 512
    },
    "tile_size": 32,
    "description": "Symmetric forest arena with natural barriers"
  },

  "layers_config": [
    {
      "id": "background",
      "z_index": 0,
      "visible": true,
      "parallax": 0.5
    },
    {
      "id": "terrain",
      "z_index": 1,
      "visible": true,
      "parallax": 1.0
    },
    {
      "id": "barriers",
      "z_index": 2,
      "visible": true,
      "parallax": 1.0
    },
    {
      "id": "objects",
      "z_index": 3,
      "visible": true,
      "parallax": 1.0
    },
    {
      "id": "effects",
      "z_index": 6,
      "visible": true,
      "parallax": 1.0
    }
  ],

  "terrain_layer": [
    {
      "x": 0,
      "y": 0,
      "component_id": "terrain_grass_base",
      "variant": "standard"
    },
    {
      "x": 32,
      "y": 0,
      "component_id": "terrain_grass_base",
      "variant": "light"
    }
  ],

  "objects": [
    {
      "id": "spawn_red",
      "x": 100,
      "y": 100,
      "component_id": "interactive_spawn_point",
      "variant": "red_team",
      "properties": {
        "team": "red",
        "max_players": 4
      }
    },
    {
      "id": "spawn_blue",
      "x": 412,
      "y": 412,
      "component_id": "interactive_spawn_point",
      "variant": "blue_team",
      "properties": {
        "team": "blue",
        "max_players": 4
      }
    },
    {
      "id": "trivia_01",
      "x": 256,
      "y": 128,
      "component_id": "interactive_trivia_pad",
      "variant": "active",
      "properties": {
        "points": 50,
        "buff_type": "damage",
        "timeout": 8000
      }
    },
    {
      "id": "trivia_02",
      "x": 128,
      "y": 256,
      "component_id": "interactive_trivia_pad",
      "variant": "active",
      "properties": {
        "points": 50,
        "buff_type": "speed",
        "timeout": 8000
      }
    },
    {
      "id": "barrier_01",
      "x": 200,
      "y": 250,
      "component_id": "barrier_wall_short",
      "variant": "straight_h",
      "rotation": 0,
      "scale": 1.0
    },
    {
      "id": "health_pack_01",
      "x": 300,
      "y": 300,
      "component_id": "interactive_health_pack_small",
      "variant": "standard",
      "properties": {
        "heal_amount": 50,
        "respawn_time": 10000
      }
    },
    {
      "id": "hazard_01",
      "x": 400,
      "y": 200,
      "component_id": "hazard_spikes",
      "variant": "standard",
      "scale": 2.0,
      "properties": {
        "damage": 5,
        "knockback": 3
      }
    }
  ],

  "triggers": [
    {
      "id": "pressure_plate_01",
      "x": 256,
      "y": 256,
      "component_id": "interactive_pressure_plate",
      "targets": ["door_01"],
      "timeout": 3000
    },
    {
      "id": "door_01",
      "x": 256,
      "y": 400,
      "component_id": "structure_door",
      "initial_state": "closed",
      "open_animation": 500
    }
  ],

  "effects": [
    {
      "x": 256,
      "y": 256,
      "effect_type": "light_glow",
      "color": "#00ffff",
      "radius": 64,
      "intensity": 0.5,
      "animate": true
    }
  ]
}
```

---

## PERFORMANCE OPTIMIZATION

### Tile Batching Strategy

**Goal**: Minimize draw calls by grouping similar tiles

```javascript
// Pseudo-code for batching
function batchRenderTerrain(terrainLayer) {
  const batches = {};
  
  for (const tile of terrainLayer) {
    const atlasKey = tile.component_id;
    if (!batches[atlasKey]) {
      batches[atlasKey] = [];
    }
    batches[atlasKey].push(tile);
  }
  
  for (const [atlasKey, tiles] of Object.entries(batches)) {
    const atlas = loadAtlas(atlasKey);
    drawBatch(atlas, tiles); // Single draw call per atlas
  }
}
```

### Spatial Indexing (Culling Invisible Objects)

```javascript
// Quadtree-based spatial index
class SpatialIndex {
  constructor(width, height, tileSize) {
    this.cellSize = tileSize * 8; // 8×8 tiles per cell
    this.cols = Math.ceil(width / this.cellSize);
    this.rows = Math.ceil(height / this.cellSize);
    this.grid = Array(this.cols * this.rows).fill(null).map(() => []);
  }
  
  insert(obj) {
    const cellX = Math.floor(obj.x / this.cellSize);
    const cellY = Math.floor(obj.y / this.cellSize);
    const index = cellY * this.cols + cellX;
    this.grid[index].push(obj);
  }
  
  query(viewportRect) {
    const visible = [];
    const startCellX = Math.max(0, Math.floor(viewportRect.x / this.cellSize));
    const startCellY = Math.max(0, Math.floor(viewportRect.y / this.cellSize));
    const endCellX = Math.min(this.cols, Math.ceil((viewportRect.x + viewportRect.width) / this.cellSize));
    const endCellY = Math.min(this.rows, Math.ceil((viewportRect.y + viewportRect.height) / this.cellSize));
    
    for (let y = startCellY; y < endCellY; y++) {
      for (let x = startCellX; x < endCellX; x++) {
        const index = y * this.cols + x;
        visible.push(...this.grid[index]);
      }
    }
    
    return visible;
  }
}
```

### Asset Loading Optimization

- **Lazy load** tilesets as players approach new areas
- **Preload** frequently used atlases (terrain, barriers)
- **Memory cap**: Keep max 3 atlases in memory at once
- **Sprite pooling**: Reuse particle effect sprites rather than creating new ones

---

## PROCEDURAL GENERATION RULES

### Terrain Generation (Wave Function Collapse Variant)

Rules define which tiles can appear adjacent to each other:

```json
{
  "rules": {
    "grass": {
      "north": ["grass", "stone", "grass_dirt"],
      "south": ["grass", "stone", "grass_dirt"],
      "east": ["grass", "stone", "grass_dirt"],
      "west": ["grass", "stone", "grass_dirt"]
    },
    "water": {
      "north": ["water", "sand"],
      "south": ["water", "sand"],
      "east": ["water", "sand"],
      "west": ["water", "sand"]
    },
    "sand": {
      "north": ["sand", "grass", "water"],
      "south": ["sand", "grass", "water"],
      "east": ["sand", "grass", "water"],
      "west": ["sand", "grass", "water"]
    },
    "stone": {
      "north": ["stone", "grass"],
      "south": ["stone", "grass"],
      "east": ["stone", "grass"],
      "west": ["stone", "grass"]
    }
  }
}
```

### Barrier Placement Rules

```json
{
  "barrier_distribution": {
    "total_barriers": 12,
    "wall_types": {
      "short_wall": { "count": 8, "clustering": 0.6 },
      "tall_wall": { "count": 2, "clustering": 0.4 },
      "fence": { "count": 2, "clustering": 0.5 }
    },
    "avoid_regions": [
      { "x": 0, "y": 0, "radius": 80, "reason": "spawn_protection" }
    ],
    "symmetry": true
  }
}
```

### Object Placement Rules

```json
{
  "object_distribution": {
    "trivia_pads": {
      "count": 6,
      "min_spacing": 100,
      "spawn_protection_distance": 80
    },
    "health_packs": {
      "count": 4,
      "placement": "corners_and_center",
      "respawn_time": 10000
    },
    "ammo_pickups": {
      "count": 3,
      "placement": "random",
      "respawn_time": 5000
    },
    "hazards": {
      "count": 2,
      "placement": "center_control_points"
    }
  }
}
```

---

## QUICK REFERENCE TABLES

### Asset Count Quick Sheet

| Asset Category | Tiles/Variants | Per Arena | Total |
|---|---|---|---|
| Base Terrain (7 types × 6 variants) | 42 | 40–80 tiles | 42 |
| Barriers (5 types × 12 variants) | 60 | 12–20 placed | 60 |
| Interactive Objects (10 types × 3 variants) | 30 | 8–12 placed | 30 |
| Effects/Overlays | 15–20 | 5–10 | 15–20 |
| Decoration/Scenery | 20–30 | 2–5 | 20–30 |
| **TOTAL** | **167–192** | **67–127** | **167–192** |

### Tile Size & Resolution Recommendations

| Use Case | Tile Size | Atlas Size | Max Tiles |
|---|---|---|---|
| Mobile (Performance critical) | 16×16 | 1024×1024 | 64 |
| Web/Desktop (Balanced) | 32×32 | 2048×2048 | 256 |
| Console/High-end | 48×48 | 4096×4096 | 300+ |

### Property Sheet Template (for each object type)

```markdown
| Property | Type | Default | Description |
|---|---|---|---|
| collision | bool | true | Blocks movement |
| passable | bool | false | Can move through |
| destructible | bool | false | Can be damaged |
| health | int | null | Hit points (null = indestructible) |
| friction | float | 0.85 | Movement slowdown (0–1) |
| damage | int | 0 | Damage per frame to player |
| interaction_radius | int | 32 | Distance player must be to interact |
| sound_tag | string | "default" | Sound effect to play |
```

---

## IMPLEMENTATION CHECKLIST

- [ ] **Create 7 base terrain tilesets** (grass, stone, water, sand, ice, lava, void)
- [ ] **Create 5 barrier types** (short wall, tall wall, half wall, fence, crate)
- [ ] **Create 10 interactive objects** (trivia pad, spawn, health, ammo, boosts, hazards, doors, platforms)
- [ ] **Set up layer rendering system** with 7 distinct render passes
- [ ] **Define 5+ arena layout patterns** (1v1, team, free-for-all, KOTH, maze)
- [ ] **Build master object library JSON** with all components
- [ ] **Design map file format** supporting terrain, objects, triggers, effects
- [ ] **Implement spatial indexing** for culling & performance
- [ ] **Create tile batching system** to minimize draw calls
- [ ] **Test procedural generation rules** (adjacency constraints)
- [ ] **Build map import/export pipeline** for reuse across arenas
- [ ] **Create asset naming convention** for version control
- [ ] **Document custom property metadata** for all objects

---

## NEXT STEPS

1. **Create a map template file** with this structure
2. **Build a visual map editor** UI that uses this data format
3. **Implement asset loader** that parses component IDs and assembles objects
4. **Set up sprite batching** in your rendering engine
5. **Test import/export** workflow with 3–5 test maps
6. **Measure performance** at scale (1000+ placed objects)
7. **Generate 10–20 production arenas** using this system
8. **Gather user feedback** on map design & balance

---

**Version 1.0 | Enterprise Ready | Scalable to 100+ Maps**