/**
 * Combat module exports
 */

export { CombatSystem } from './CombatSystem'
export { WeaponManager } from './WeaponManager'
export { ProjectileManager } from './ProjectileManager'
export { HealthManager } from './HealthManager'
export { RespawnManager } from './RespawnManager'
export { BuffManager } from './BuffManager'
export { AimAssist } from './AimAssist'
export { LagCompensation } from './LagCompensation'
export type { BuffType, ActiveBuff, BuffState } from './BuffManager'
export type { AimAssistConfig, AimAssistTarget } from './AimAssist'
export type { InterpolatedProjectile, ProjectileCollisionConfig } from './ProjectileManager'
export type { PositionSnapshot, EntitySnapshot } from './LagCompensation'
