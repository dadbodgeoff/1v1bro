/**
 * Audio module exports
 */

export { SynthSoundManager, getSoundManager } from './SynthSoundManager'
export type { SoundSettings } from './SynthSoundManager'
export { useSurvivalAudio } from './useSurvivalAudio'
export type { UseSurvivalAudioReturn } from './useSurvivalAudio'

// Sound event registry - single source of truth for all sound triggers
export {
  SOUND_REGISTRY,
  getSoundsBySystem,
  getSoundsBySourceFile,
  getSoundTrigger,
  debugPrintSoundRegistry,
} from './SoundEventRegistry'
export type { SoundTrigger } from './SoundEventRegistry'
