/**
 * Arena Player Module
 * 
 * Character loading, animation, and skin management for arena mode.
 */

export { 
  type ArenaAnimationName,
  type ArenaCharacterSkin,
  DEFAULT_ARENA_SKIN,
  getArenaCharacterSkin,
  getAnimationsByPriority,
  ANIMATION_LOAD_PRIORITY,
} from './ArenaCharacterConfig'

export {
  type LoadProgress,
  type LoadedCharacter,
  ArenaCharacterLoader,
  arenaCharacterLoader,
} from './ArenaCharacterLoader'

export {
  type PlayerAnimationState,
  AnimationController,
} from './AnimationController'

export {
  useArenaCharacter,
} from './useArenaCharacter'

export {
  WeaponBuilder,
  setupWeaponCamera,
  WEAPONS,
  type WeaponDefinition,
} from './WeaponBuilder'
