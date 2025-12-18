/**
 * Arena Character Configuration
 * 
 * Defines the structure for 3D character skins with animations.
 * Designed to integrate with the cosmetics/inventory system.
 */

// Base URL for arena assets in Supabase storage
const ARENA_ASSETS_BASE = 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/arena-assets/animations'

/**
 * Animation clip names that map to game states
 */
export type ArenaAnimationName =
  | 'idle'
  | 'walk'
  | 'run'
  | 'sprint'
  | 'jump'
  | 'jumpLand'
  | 'crouch'
  | 'crouchWalk'
  | 'slide'
  | 'roll'
  | 'shoot'
  | 'reload'
  | 'reloadKneeling'
  | 'hitReact'
  | 'death'
  | 'walkBackward'
  | 'walkLeft'
  | 'lookAround'

/**
 * Full character skin configuration with all animation URLs
 */
export interface ArenaCharacterSkin {
  id: string
  name: string
  /** Base character model (T-pose or with idle) */
  baseModel: string
  /** Animation clip URLs keyed by animation name */
  animations: Partial<Record<ArenaAnimationName, string>>
}

/**
 * Default character skin using the Meshy AI biped
 * This is the fallback when no skin is equipped
 */
export const DEFAULT_ARENA_SKIN: ArenaCharacterSkin = {
  id: 'default_biped',
  name: 'Default Soldier',
  baseModel: `${ARENA_ASSETS_BASE}/Meshy_AI_Character_output.glb`,
  animations: {
    idle: `${ARENA_ASSETS_BASE}/Idle_02.glb`,
    walk: `${ARENA_ASSETS_BASE}/Walking.glb`,
    run: `${ARENA_ASSETS_BASE}/Running.glb`,
    sprint: `${ARENA_ASSETS_BASE}/Lean_Forward_Sprint.glb`,
    jump: `${ARENA_ASSETS_BASE}/Jump_Run.glb`,
    jumpLand: `${ARENA_ASSETS_BASE}/Jump_with_Arms_Open.glb`,
    crouch: `${ARENA_ASSETS_BASE}/CrouchLookAroundBow.glb`,
    crouchWalk: `${ARENA_ASSETS_BASE}/Crouch_Walk_Left_with_Gun.glb`,
    slide: `${ARENA_ASSETS_BASE}/slide_light.glb`,
    roll: `${ARENA_ASSETS_BASE}/Roll_Dodge.glb`,
    shoot: `${ARENA_ASSETS_BASE}/Run_and_Shoot.glb`,
    reload: `${ARENA_ASSETS_BASE}/Standing_Reload.glb`,
    reloadKneeling: `${ARENA_ASSETS_BASE}/Kneeling_Reload.glb`,
    hitReact: `${ARENA_ASSETS_BASE}/Gunshot_Reaction.glb`,
    death: `${ARENA_ASSETS_BASE}/Dead.glb`,
    walkBackward: `${ARENA_ASSETS_BASE}/Walk_Backward_with_Gun.glb`,
    walkLeft: `${ARENA_ASSETS_BASE}/Walk_Left_with_Gun.glb`,
    lookAround: `${ARENA_ASSETS_BASE}/Walk_Slowly_and_Look_Around.glb`,
  },
}

/**
 * Arena character animations from cosmetic (matches ArenaCharacterAnimations in cosmetic.ts)
 */
export interface CosmeticArenaAnimations {
  idle?: string
  walk?: string
  run?: string
  sprint?: string
  jump?: string
  jumpLand?: string
  crouch?: string
  crouchWalk?: string
  slide?: string
  roll?: string
  shoot?: string
  reload?: string
  reloadKneeling?: string
  hitReact?: string
  death?: string
  walkBackward?: string
  walkLeft?: string
  lookAround?: string
}

/**
 * Get character skin from equipped cosmetic or return default
 * 
 * @param equippedSkin - The equipped arena_character cosmetic (if any)
 * @returns Character skin configuration
 */
export function getArenaCharacterSkin(equippedSkin?: {
  id: string
  name: string
  model_url?: string
  animations?: CosmeticArenaAnimations
}): ArenaCharacterSkin {
  if (!equippedSkin?.model_url) {
    return DEFAULT_ARENA_SKIN
  }

  // Convert cosmetic animations to our internal format
  const cosmeticAnims = equippedSkin.animations || {}
  const animations: Partial<Record<ArenaAnimationName, string>> = {}
  
  // Map cosmetic animation URLs (only include non-empty ones)
  for (const [key, url] of Object.entries(cosmeticAnims)) {
    if (url) {
      animations[key as ArenaAnimationName] = url
    }
  }

  // Merge equipped skin with defaults for any missing animations
  return {
    id: equippedSkin.id,
    name: equippedSkin.name,
    baseModel: equippedSkin.model_url,
    animations: {
      ...DEFAULT_ARENA_SKIN.animations,
      ...animations,
    },
  }
}

/**
 * Preload priority for animations
 * Higher priority = load first
 */
export const ANIMATION_LOAD_PRIORITY: Record<ArenaAnimationName, number> = {
  idle: 100,      // Must have immediately
  run: 90,        // Core movement
  shoot: 85,      // Combat essential
  death: 80,      // Need for kills
  jump: 75,       // Movement
  walk: 70,       // Movement
  hitReact: 65,   // Combat feedback
  reload: 60,     // Combat
  sprint: 55,     // Movement
  crouch: 50,     // Tactical
  slide: 45,      // Movement
  roll: 40,       // Evasion
  crouchWalk: 35, // Tactical
  walkBackward: 30,
  walkLeft: 25,
  reloadKneeling: 20,
  jumpLand: 15,
  lookAround: 10, // Lowest priority
}

/**
 * Get animations sorted by load priority (highest first)
 */
export function getAnimationsByPriority(
  skin: ArenaCharacterSkin
): Array<{ name: ArenaAnimationName; url: string }> {
  const entries = Object.entries(skin.animations) as Array<[ArenaAnimationName, string]>
  
  return entries
    .filter(([, url]) => url) // Filter out undefined
    .map(([name, url]) => ({ name, url }))
    .sort((a, b) => ANIMATION_LOAD_PRIORITY[b.name] - ANIMATION_LOAD_PRIORITY[a.name])
}
