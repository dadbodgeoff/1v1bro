# Japanese Garden Theme - Asset Manifest

## Uploaded Assets

Base URL: `https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/3d/`

| Asset | File | Size | Purpose |
|-------|------|------|---------|
| Track | `wooden-pallet-optimized.glb` | 775 KB | Repeating bridge/path tile |
| Slide Obstacle | `torii-gate-optimized.glb` | 491 KB | Player slides under |
| Jump Obstacle | `bamboo-fence-optimized.glb` | 980 KB | Player jumps over |
| Dodge Obstacle | `stone-lantern-optimized.glb` | 615 KB | Player dodges left/right |
| Background | `pagoda-optimized.glb` | 1.13 MB | Distant landmark |
| Side Scenery | `sakura-tree-optimized.glb` | 2.17 MB | Cherry blossom trees |
| Side Scenery | `torii-row-optimized.glb` | 1.03 MB | Row of torii gates |
| Collectible | `coin-optimized.glb` | 1.17 MB | Pickup item |

**Total: ~8.3 MB** (down from ~57 MB original)

## Still Needed

- [ ] Character model (run/jump/slide poses) - currently using default cape runner
- [ ] Cherry blossom petal particle (optional - can use shader)

## Tuning Required

After testing in-game, these values in `zen-garden.ts` will need adjustment:

1. **Track scale** - `track.scale` (currently 8)
2. **Obstacle scales** - `obstacleVisuals.*.scale` 
3. **Obstacle Y offsets** - `obstacleVisuals.*.yOffset`
4. **Collision boxes** - `collisionBoxes.*` dimensions
5. **Scenery placement** - `background.scenery.*` values

## How to Test

1. The theme is set as default in `index.ts`
2. Run the survival mode
3. Adjust values in `zen-garden.ts` based on visual results
4. Collision boxes may need significant tuning based on model dimensions

## Fallback

If the sakura tree is too heavy or looks wrong:
- Reduce `background.scenery.instanceCount` to 3-4
- Or disable scenery: `background.scenery.enabled = false`
- Or replace with particle-based cherry blossom effect
