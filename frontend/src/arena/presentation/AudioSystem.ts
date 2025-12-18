/**
 * AudioSystem - 3D Spatial Audio for Arena
 * 
 * Provides positional audio using Web Audio API with panner nodes
 * for gunshots, footsteps, and other game sounds.
 * 
 * @module presentation/AudioSystem
 */

import type { IEventBus } from '../core/EventBus';
import type { WeaponFiredEvent, HitConfirmedEvent, PlayerDamagedEvent, LandImpactEvent } from '../core/GameEvents';
import { Vector3 } from '../math/Vector3';

// ============================================================================
// Configuration
// ============================================================================

export interface AudioConfig {
  readonly masterVolume: number;
  readonly sfxVolume: number;
  readonly maxSoundDistance: number;
  readonly footstepInterval: number;
}

export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  masterVolume: 1.0,
  sfxVolume: 0.8,
  maxSoundDistance: 50,
  footstepInterval: 0.4
};

// ============================================================================
// Sound Registry
// ============================================================================

export type SoundId = 
  | 'gunshot'
  | 'hit'
  | 'footstep'
  | 'jump'
  | 'land'
  | 'death'
  | 'spawn'
  | 'countdown'
  | 'match_start'
  | 'match_end';

// ============================================================================
// Interface
// ============================================================================

export interface IAudioSystem {
  initialize(): Promise<void>;
  dispose(): void;
  setListenerPosition(position: Vector3, forward: Vector3, up: Vector3): void;
  playSound(soundId: SoundId, position: Vector3, volume?: number): void;
  playUISound(soundId: SoundId, volume?: number): void;
  updateFootsteps(isMoving: boolean, isGrounded: boolean, speed: number, deltaTime: number): void;
  setMasterVolume(volume: number): void;
  setSFXVolume(volume: number): void;
  isMuted(): boolean;
  setMuted(muted: boolean): void;
}

// ============================================================================
// Implementation
// ============================================================================

export class AudioSystem implements IAudioSystem {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private soundBuffers: Map<SoundId, AudioBuffer> = new Map();
  private footstepTimer: number = 0;
  private unsubscribers: (() => void)[] = [];
  private muted: boolean = false;
  private localPlayerId: number = 0;
  private currentMasterVolume: number;
  private currentSFXVolume: number;
  private readonly config: AudioConfig;
  private readonly eventBus: IEventBus;

  constructor(config: AudioConfig, eventBus: IEventBus) {
    this.config = config;
    this.eventBus = eventBus;
    this.currentMasterVolume = config.masterVolume;
    this.currentSFXVolume = config.sfxVolume;
  }

  async initialize(): Promise<void> {
    try {
      this.audioContext = new AudioContext();
      
      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.currentMasterVolume;
      this.masterGain.connect(this.audioContext.destination);
      
      await this.loadSounds();
      this.subscribeToEvents();
    } catch (error) {
      console.warn('AudioSystem: Failed to initialize audio context', error);
    }
  }

  dispose(): void {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.masterGain = null;
    this.soundBuffers.clear();
  }

  setLocalPlayerId(playerId: number): void {
    this.localPlayerId = playerId;
  }

  setListenerPosition(position: Vector3, forward: Vector3, up: Vector3): void {
    if (!this.audioContext) return;
    
    const listener = this.audioContext.listener;
    
    // Set position
    if (listener.positionX) {
      listener.positionX.value = position.x;
      listener.positionY.value = position.y;
      listener.positionZ.value = position.z;
    } else {
      // Fallback for older browsers
      listener.setPosition(position.x, position.y, position.z);
    }
    
    // Set orientation (forward and up vectors)
    if (listener.forwardX) {
      listener.forwardX.value = forward.x;
      listener.forwardY.value = forward.y;
      listener.forwardZ.value = forward.z;
      listener.upX.value = up.x;
      listener.upY.value = up.y;
      listener.upZ.value = up.z;
    } else {
      // Fallback for older browsers
      listener.setOrientation(
        forward.x, forward.y, forward.z,
        up.x, up.y, up.z
      );
    }
  }

  playSound(soundId: SoundId, position: Vector3, volume: number = 1.0): void {
    if (!this.audioContext || !this.masterGain || this.muted) return;
    
    const buffer = this.soundBuffers.get(soundId);
    if (!buffer) {
      // Generate procedural sound if buffer not loaded
      this.playProceduralSound(soundId, position, volume);
      return;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    // Create panner for 3D positioning
    const panner = this.audioContext.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = this.config.maxSoundDistance;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 360;
    panner.coneOuterGain = 0;
    
    // Set position
    if (panner.positionX) {
      panner.positionX.value = position.x;
      panner.positionY.value = position.y;
      panner.positionZ.value = position.z;
    } else {
      panner.setPosition(position.x, position.y, position.z);
    }

    // Create gain for volume control
    const gain = this.audioContext.createGain();
    gain.gain.value = volume * this.currentSFXVolume;

    // Connect: source -> panner -> gain -> master
    source.connect(panner);
    panner.connect(gain);
    gain.connect(this.masterGain);
    
    source.start();
  }

  playUISound(soundId: SoundId, volume: number = 1.0): void {
    if (!this.audioContext || !this.masterGain || this.muted) return;
    
    const buffer = this.soundBuffers.get(soundId);
    if (!buffer) {
      // Generate procedural sound if buffer not loaded
      this.playProceduralUISound(soundId, volume);
      return;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const gain = this.audioContext.createGain();
    gain.gain.value = volume * this.currentSFXVolume;

    source.connect(gain);
    gain.connect(this.masterGain);
    
    source.start();
  }

  updateFootsteps(isMoving: boolean, isGrounded: boolean, speed: number, deltaTime: number): void {
    if (!isMoving || !isGrounded || speed < 0.1) {
      this.footstepTimer = 0;
      return;
    }

    this.footstepTimer += deltaTime;
    
    // Adjust interval based on speed (faster movement = faster footsteps)
    const baseSpeed = 7; // max speed from physics config
    const interval = this.config.footstepInterval * (baseSpeed / Math.max(speed, 1));
    
    if (this.footstepTimer >= interval) {
      this.footstepTimer = 0;
      this.playUISound('footstep', 0.3);
    }
  }

  setMasterVolume(volume: number): void {
    this.currentMasterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.currentMasterVolume;
    }
  }

  setSFXVolume(volume: number): void {
    this.currentSFXVolume = Math.max(0, Math.min(1, volume));
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  getFootstepTimer(): number {
    return this.footstepTimer;
  }


  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private async loadSounds(): Promise<void> {
    // In production, this would load actual audio files
    // For now, we'll use procedural audio generation
    const soundIds: SoundId[] = [
      'gunshot', 'hit', 'footstep', 'jump', 'land', 'death', 
      'spawn', 'countdown', 'match_start', 'match_end'
    ];
    
    for (const soundId of soundIds) {
      const buffer = this.generateProceduralBuffer(soundId);
      if (buffer) {
        this.soundBuffers.set(soundId, buffer);
      }
    }
  }

  private generateProceduralBuffer(soundId: SoundId): AudioBuffer | null {
    if (!this.audioContext) return null;
    
    const sampleRate = this.audioContext.sampleRate;
    let duration: number;
    let generator: (t: number, duration: number) => number;
    
    switch (soundId) {
      case 'gunshot':
        duration = 0.15;
        generator = (t) => {
          const noise = Math.random() * 2 - 1;
          const envelope = Math.exp(-t * 30);
          return noise * envelope * 0.5;
        };
        break;
        
      case 'hit':
        duration = 0.1;
        generator = (t) => {
          const freq = 800 - t * 4000;
          const envelope = Math.exp(-t * 20);
          return Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
        };
        break;
        
      case 'footstep':
        duration = 0.08;
        generator = (t) => {
          const noise = Math.random() * 2 - 1;
          const envelope = Math.exp(-t * 50);
          return noise * envelope * 0.2;
        };
        break;
        
      case 'jump':
        duration = 0.15;
        generator = (t) => {
          const freq = 200 + t * 800;
          const envelope = Math.exp(-t * 15);
          return Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
        };
        break;
        
      case 'land':
        duration = 0.1;
        generator = (t) => {
          const noise = Math.random() * 2 - 1;
          const envelope = Math.exp(-t * 40);
          return noise * envelope * 0.25;
        };
        break;
        
      case 'death':
        duration = 0.5;
        generator = (t) => {
          const freq = 400 - t * 600;
          const envelope = Math.exp(-t * 5);
          return Math.sin(2 * Math.PI * Math.max(freq, 50) * t) * envelope * 0.4;
        };
        break;
        
      case 'spawn':
        duration = 0.3;
        generator = (t, dur) => {
          const freq = 300 + t * 500;
          const envelope = Math.sin(Math.PI * t / dur);
          return Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
        };
        break;
        
      case 'countdown':
        duration = 0.15;
        generator = (t) => {
          const freq = 880;
          const envelope = Math.exp(-t * 10);
          return Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
        };
        break;
        
      case 'match_start':
        duration = 0.4;
        generator = (t) => {
          const freq = 440 + (t < 0.2 ? 0 : 220);
          const envelope = Math.exp(-t * 5);
          return Math.sin(2 * Math.PI * freq * t) * envelope * 0.4;
        };
        break;
        
      case 'match_end':
        duration = 0.6;
        generator = (t) => {
          const freq = 660 - t * 200;
          const envelope = Math.exp(-t * 3);
          return Math.sin(2 * Math.PI * freq * t) * envelope * 0.4;
        };
        break;
        
      default:
        return null;
    }
    
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      data[i] = generator(t, duration);
    }
    
    return buffer;
  }

  private playProceduralSound(soundId: SoundId, position: Vector3, volume: number): void {
    if (!this.audioContext || !this.masterGain) return;
    
    const buffer = this.generateProceduralBuffer(soundId);
    if (!buffer) return;
    
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const panner = this.audioContext.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = this.config.maxSoundDistance;
    panner.rolloffFactor = 1;
    
    if (panner.positionX) {
      panner.positionX.value = position.x;
      panner.positionY.value = position.y;
      panner.positionZ.value = position.z;
    } else {
      panner.setPosition(position.x, position.y, position.z);
    }

    const gain = this.audioContext.createGain();
    gain.gain.value = volume * this.currentSFXVolume;

    source.connect(panner);
    panner.connect(gain);
    gain.connect(this.masterGain);
    
    source.start();
  }

  private playProceduralUISound(soundId: SoundId, volume: number): void {
    if (!this.audioContext || !this.masterGain) return;
    
    const buffer = this.generateProceduralBuffer(soundId);
    if (!buffer) return;
    
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const gain = this.audioContext.createGain();
    gain.gain.value = volume * this.currentSFXVolume;

    source.connect(gain);
    gain.connect(this.masterGain);
    
    source.start();
  }

  private subscribeToEvents(): void {
    this.unsubscribers.push(
      this.eventBus.on<WeaponFiredEvent>('weapon_fired', (e) => {
        this.playSound('gunshot', new Vector3(e.originX, e.originY, e.originZ));
      }),
      this.eventBus.on<HitConfirmedEvent>('hit_confirmed', (e) => {
        if (e.shooterId === this.localPlayerId) {
          this.playUISound('hit');
        }
      }),
      this.eventBus.on<PlayerDamagedEvent>('player_damaged', (e) => {
        if (e.victimId === this.localPlayerId) {
          this.playUISound('hit', 0.5);
        }
      }),
      this.eventBus.on<LandImpactEvent>('land_impact', () => {
        this.playUISound('land', 0.3);
      })
    );
  }
}
