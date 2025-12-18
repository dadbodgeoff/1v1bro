/**
 * Arena Presentation Layer
 * 
 * HUD rendering, audio system, and debug visualization.
 * 
 * @module presentation
 */

export {
  HUDRenderer,
  DEFAULT_HUD_CONFIG,
  calculateDamageDirection,
  type IHUDRenderer,
  type HUDConfig,
  type HUDState,
  type DamageIndicator,
  type KillFeedEntry
} from './HUDRenderer';

export {
  AudioSystem,
  DEFAULT_AUDIO_CONFIG,
  type IAudioSystem,
  type AudioConfig,
  type SoundId
} from './AudioSystem';
