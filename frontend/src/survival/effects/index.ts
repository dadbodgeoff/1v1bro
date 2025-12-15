/**
 * Effects module exports
 * Enterprise-grade juice and feedback systems
 */

export { ParticleSystem } from './ParticleSystem'
export type { ParticleEffectType } from './ParticleSystem'

export { FeedbackSystem } from './FeedbackSystem'
export type {
  SoundEvent,
  SoundEventData,
  SoundCallback,
  HapticPattern,
  HapticEventData,
  HapticCallback,
  VisualIndicatorType,
  VisualIndicatorData,
  VisualIndicatorCallback,
} from './FeedbackSystem'

export { ScreenShakeSystem } from './ScreenShakeSystem'
export type { ShakeConfig, ShakeOffset } from './ScreenShakeSystem'

export { ImpactFlashOverlay } from './ImpactFlashOverlay'
export type { FlashConfig } from './ImpactFlashOverlay'

export { ComboEscalationSystem } from './ComboEscalationSystem'
export type {
  ComboVisualLevel,
  ComboVisualState,
  ComboEscalationConfig,
} from './ComboEscalationSystem'
