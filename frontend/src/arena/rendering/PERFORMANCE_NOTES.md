# Arena Performance Optimization Notes

## Currently Implemented ✅

### Rendering
- **Geometry Batching** - Static geometry merged by material (GeometryBatcher)
- **GPU Instancing** - Projectile particles use InstancedMesh (ProjectileParticles.ts)
- **Object Pooling** - Particle system reuses objects, no runtime allocations
- **Render Order Optimization** - Meshes sorted to minimize GPU state changes
- **GPU Warm-up** - Shaders pre-compiled before gameplay
- **Pixel Ratio Capped** - Limited to 2x to prevent excessive resolution
- **Adaptive Quality System** - Runtime quality adjustment based on FPS (quality.ts)
- **Memory Monitoring** - Track GPU memory usage with budget warnings (MemoryMonitor.ts)
- **ResizeObserver** - Responsive container resizing for CSS-driven changes

### Animation
- **Animation LOD** - Bot animation updates reduced at distance
  - <15m: 60fps
  - 15-30m: 30fps
  - 30-50m: 15fps
  - >50m: 7.5fps

### Physics
- **Spatial Hash Grid** - O(1) collision broad-phase
- **Movement Threshold** - Collision skipped when bot not moving

### Assets
- **Meshopt Compression** - GLB files compressed with gltf-transform
- **Chunk Splitting** - Three.js in separate bundle for caching

### Game Feel
- **Hitstop System** - Brief time freeze on impacts for satisfying feedback (HitstopSystem.ts)
  - Player hit: 2 frames
  - Kill: 4 frames
  - Headshot: 5 frames

## Monitoring
- **Draw Call Monitor** - Tracks draw calls in debug overlay
- **Triangle Count** - Displayed in debug overlay
- **FPS Counter** - Color-coded (green >55, yellow 30-55, red <30)
- **Memory Stats** - Texture/geometry memory tracking with budget warnings

## Quality Tiers

| Feature | Low | Medium | High | Ultra |
|---------|-----|--------|------|-------|
| Pixel Ratio | 1 | 1.5 | 2 | 2 |
| Antialiasing | ❌ | ✅ | ✅ | ✅ |
| Shadows | ❌ | ✅ | ✅ | ✅ |
| Shadow Map | 512 | 1024 | 2048 | 2048 |
| Post-Processing | ❌ | ❌ | ✅ | ✅ |
| Max Lights | 2 | 4 | 6 | 8 |
| Max Particles | 100 | 200 | 500 | 1000 |
| Bloom | ❌ | ❌ | 0.25 | 0.30 |
| Bot Shadows | ❌ | ✅ | ✅ | ✅ |

## Lighting System (v2 - Enterprise AAA-Grade)

### Light Budget
- **Base lights**: Ambient + Hemisphere + Key + Fill + Rim = 5 lights
- **Point lights**: 12 total (down from 21), priority-culled per quality tier
- **Shadow casters**: 1 (key light only)

### Point Light Priority Culling
When `maxLights` is exceeded, lights are culled by priority:
1. **Utility** (highest) - Main visibility
2. **Wall Wash** - Texture visibility
3. **Emergency** - Atmosphere
4. **Track Glow** - Ambient effect
5. **Tunnel Glow** (lowest) - Depth cue

### Post-Processing Defaults
- **Bloom**: strength 0.3, radius 0.35, threshold 0.88
- **Color Grading**: contrast 1.06, saturation 1.0, vignette 0.18
- **Tone Mapping**: ACES Filmic, exposure 1.05

## Device-Specific Optimizations

### iOS Safari
- Pixel ratio capped at 1.5
- Antialiasing disabled
- Post-processing disabled
- Shadows disabled
- Reduced particle count

### Low Memory Devices (<4GB)
- Reduced particle count
- Lower quality tier selected

### Reduced Motion Preference
- Bloom disabled

## Potential Future Optimizations

### High Impact
1. ~~Disable Bot Shadow Casting~~ ✅ Now quality-controlled
2. ~~Lower Shadow Map Resolution~~ ✅ Now quality-controlled
3. ~~Reduce Post-Processing Resolution~~ ✅ Now quality-controlled

### Medium Impact
4. **LOD for Props** - Simpler geometry at distance
5. **Texture Atlasing** - Combine textures to reduce material switches
6. **Occlusion Culling** - Skip rendering objects behind walls

### Low Impact (Already Good)
7. **Frustum Culling** - Three.js does this automatically
8. **Instancing for Props** - Complex due to different GLB materials

## Performance Targets
- 60 FPS on mid-range hardware
- <100 draw calls
- <50k triangles
