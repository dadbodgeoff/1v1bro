# Arena Performance Optimization Notes

## Currently Implemented ✅

### Rendering
- **Geometry Batching** - Static geometry merged by material (GeometryBatcher)
- **GPU Instancing** - Projectile particles use InstancedMesh (ProjectileParticles.ts)
- **Object Pooling** - Particle system reuses objects, no runtime allocations
- **Render Order Optimization** - Meshes sorted to minimize GPU state changes
- **GPU Warm-up** - Shaders pre-compiled before gameplay
- **Pixel Ratio Capped** - Limited to 2x to prevent excessive resolution

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

## Monitoring
- **Draw Call Monitor** - Tracks draw calls in debug overlay
- **Triangle Count** - Displayed in debug overlay
- **FPS Counter** - Color-coded (green >55, yellow 30-55, red <30)

## Potential Future Optimizations

### High Impact
1. **Disable Bot Shadow Casting** - Skinned mesh shadows are expensive
2. **Lower Shadow Map Resolution** - Currently 2048, could drop to 1024
3. **Reduce Post-Processing Resolution** - Bloom at half resolution

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
