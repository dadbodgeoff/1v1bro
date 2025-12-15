/**
 * SynthSoundManager - Procedural audio synthesis for Survival Mode
 * Generates all game sounds using Web Audio API - no audio files needed
 */

import type { SoundEvent, SoundEventData } from '../effects/FeedbackSystem'

export interface SoundSettings {
  masterVolume: number  // 0-1
  sfxVolume: number     // 0-1
  musicVolume: number   // 0-1
  muted: boolean
}

const DEFAULT_SETTINGS: SoundSettings = {
  masterVolume: 0.7,
  sfxVolume: 0.8,
  musicVolume: 0.5,
  muted: false,
}

export class SynthSoundManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private settings: SoundSettings = { ...DEFAULT_SETTINGS }
  
  // Continuous sounds
  private windSource: AudioBufferSourceNode | null = null
  private windGain: GainNode | null = null
  private windFilter: BiquadFilterNode | null = null
  private currentWindIntensity: number = 0

  // Prevent sound spam
  private lastPlayTime: Map<SoundEvent, number> = new Map()
  private readonly COOLDOWNS: Partial<Record<SoundEvent, number>> = {
    'near-miss': 100,
    'lane-change': 50,
  }

  constructor() {
    // Setup global interaction handler to resume audio context
    // This handles browser autoplay policy
    this.setupInteractionHandler()
  }
  
  /**
   * Setup handler to resume audio on user interaction
   * Browsers require user gesture to start audio
   */
  private setupInteractionHandler(): void {
    const resumeAudio = async () => {
      if (this.ctx?.state === 'suspended') {
        try {
          await this.ctx.resume()
          console.log('[SynthSoundManager] Audio context resumed via user interaction')
        } catch (e) {
          // Ignore errors
        }
      }
    }
    
    // Listen for any user interaction
    const events = ['click', 'touchstart', 'keydown']
    const handler = () => {
      resumeAudio()
      // Remove listeners after first interaction
      events.forEach(e => document.removeEventListener(e, handler))
    }
    
    events.forEach(e => document.addEventListener(e, handler, { once: true }))
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  async initialize(): Promise<void> {
    if (this.ctx) return

    try {
      this.ctx = new AudioContext()
      
      // Create master gain
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = this.settings.masterVolume * this.settings.sfxVolume
      this.masterGain.connect(this.ctx.destination)

      // Setup continuous wind sound
      this.setupWindSound()

      console.log('[SynthSoundManager] Initialized')
    } catch (error) {
      console.error('[SynthSoundManager] Failed to initialize:', error)
    }
  }

  /**
   * Resume audio context if suspended (browser autoplay policy)
   */
  async resume(): Promise<void> {
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume()
    }
  }

  /**
   * Play a sound event
   */
  play(data: SoundEventData): void {
    // Auto-initialize if not yet initialized (lazy init on first sound)
    if (!this.ctx) {
      // Queue the sound to play after initialization
      this.initialize().then(() => {
        this.resume().then(() => {
          this.playInternal(data)
        })
      })
      return
    }
    
    this.playInternal(data)
  }
  
  /**
   * Internal play method (assumes ctx is initialized)
   */
  private playInternal(data: SoundEventData): void {
    if (!this.ctx || !this.masterGain || this.settings.muted) return

    // Check cooldown
    const cooldown = this.COOLDOWNS[data.event]
    if (cooldown) {
      const lastTime = this.lastPlayTime.get(data.event) || 0
      if (performance.now() - lastTime < cooldown) return
      this.lastPlayTime.set(data.event, performance.now())
    }

    const intensity = data.intensity ?? 1
    const pitch = data.pitch ?? 1

    switch (data.event) {
      case 'jump':
        this.playJump(intensity, pitch)
        break
      case 'land':
        this.playLand(intensity, pitch)
        break
      case 'land-heavy':
        this.playLandHeavy(intensity)
        break
      case 'slide-start':
        this.playSlideStart(intensity)
        break
      case 'slide-end':
        this.playSlideEnd(intensity)
        break
      case 'near-miss':
        this.playNearMiss(intensity, pitch)
        break
      case 'collision':
        this.playCollision(intensity)
        break
      case 'lane-change':
        this.playLaneChange(intensity, pitch)
        break
      case 'speed-wind':
        this.updateWind(intensity)
        break
      case 'boost':
        this.playBoost(intensity)
        break
      case 'game-over':
        this.playGameOver()
        break
      case 'milestone':
        this.playMilestone(intensity)
        break
      case 'countdown':
        this.playCountdown(intensity)
        break
      case 'perfect-dodge':
        this.playPerfectDodge(intensity, pitch)
        break
      case 'combo-milestone':
        this.playComboMilestone(intensity)
        break
      case 'collect':
        this.playCollect(intensity, pitch)
        break
      case 'quiz-popup':
        this.playQuizPopup(intensity)
        break
      case 'quiz-correct':
        this.playQuizCorrect(intensity)
        break
      case 'quiz-wrong':
        this.playQuizWrong(intensity)
        break
      case 'quiz-tick':
        this.playQuizTick(intensity)
        break
      case 'quiz-tick-urgent':
        this.playQuizTickUrgent(intensity)
        break
      // Arcade landing sounds
      case 'arcade-power-on':
        this.playArcadePowerOn(intensity)
        break
      case 'arcade-boot-blip':
        this.playArcadeBootBlip(intensity)
        break
      case 'arcade-boot-line':
        this.playArcadeBootLine(intensity)
        break
      case 'arcade-ready':
        this.playArcadeReady(intensity)
        break
      case 'arcade-hover':
        this.playArcadeHover(intensity)
        break
      case 'arcade-click':
        this.playArcadeClick(intensity)
        break
    }
  }


  // ============================================
  // SOUND GENERATORS
  // ============================================

  /**
   * Jump - upward whoosh with pitch rise
   */
  private playJump(intensity: number, pitch: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    // Noise burst with highpass sweep
    const noise = this.createNoiseSource(0.15)
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.setValueAtTime(800 * pitch, now)
    filter.frequency.exponentialRampToValueAtTime(3000 * pitch, now + 0.1)
    filter.Q.value = 1

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.3 * intensity, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain!)

    noise.start(now)
    noise.stop(now + 0.15)
  }

  /**
   * Land - soft thud
   */
  private playLand(intensity: number, pitch: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    // Low frequency thump
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(150 * pitch, now)
    osc.frequency.exponentialRampToValueAtTime(50 * pitch, now + 0.1)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.4 * intensity, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)

    osc.connect(gain)
    gain.connect(this.masterGain!)

    osc.start(now)
    osc.stop(now + 0.1)
  }

  /**
   * Heavy land - bigger impact with distortion
   */
  private playLandHeavy(intensity: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    // Low thump
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(100, now)
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.2)

    // Add some noise for texture
    const noise = this.createNoiseSource(0.15)
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'lowpass'
    noiseFilter.frequency.value = 500

    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.2 * intensity, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

    const oscGain = ctx.createGain()
    oscGain.gain.setValueAtTime(0.5 * intensity, now)
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)

    // Soft clip for punch
    const waveshaper = ctx.createWaveShaper()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    waveshaper.curve = this.createDistortionCurve(2) as any

    osc.connect(oscGain)
    oscGain.connect(waveshaper)
    
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(waveshaper)
    
    waveshaper.connect(this.masterGain!)

    osc.start(now)
    osc.stop(now + 0.2)
    noise.start(now)
    noise.stop(now + 0.15)
  }

  /**
   * Slide start - swoosh down
   */
  private playSlideStart(intensity: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    const noise = this.createNoiseSource(0.2)
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(2000, now)
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.15)
    filter.Q.value = 2

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.25 * intensity, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain!)

    noise.start(now)
    noise.stop(now + 0.2)
  }

  /**
   * Slide end - quick release
   */
  private playSlideEnd(intensity: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    const noise = this.createNoiseSource(0.1)
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 1000

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.15 * intensity, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain!)

    noise.start(now)
    noise.stop(now + 0.1)
  }

  /**
   * Near miss - quick zing/whoosh
   */
  private playNearMiss(intensity: number, pitch: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    // High pitch sine chirp
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200 * pitch, now)
    osc.frequency.exponentialRampToValueAtTime(2400 * pitch, now + 0.08)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.2 * intensity, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)

    osc.connect(gain)
    gain.connect(this.masterGain!)

    osc.start(now)
    osc.stop(now + 0.1)
  }

  /**
   * Collision - heavy impact with distortion
   */
  private playCollision(intensity: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    // Low impact
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(80, now)
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.3)

    // Noise burst
    const noise = this.createNoiseSource(0.2)
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'lowpass'
    noiseFilter.frequency.setValueAtTime(2000, now)
    noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.2)

    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.4 * intensity, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)

    const oscGain = ctx.createGain()
    oscGain.gain.setValueAtTime(0.5 * intensity, now)
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

    // Heavy distortion
    const waveshaper = ctx.createWaveShaper()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    waveshaper.curve = this.createDistortionCurve(10) as any

    osc.connect(oscGain)
    oscGain.connect(waveshaper)
    
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(waveshaper)
    
    waveshaper.connect(this.masterGain!)

    osc.start(now)
    osc.stop(now + 0.3)
    noise.start(now)
    noise.stop(now + 0.2)
  }

  /**
   * Lane change - quick tick
   */
  private playLaneChange(intensity: number, pitch: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = 800 * pitch

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.15 * intensity, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05)

    osc.connect(gain)
    gain.connect(this.masterGain!)

    osc.start(now)
    osc.stop(now + 0.05)
  }


  /**
   * Boost - rising power-up sound
   */
  private playBoost(intensity: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    // Rising arpeggio
    const frequencies = [400, 500, 600, 800]
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq

      const gain = ctx.createGain()
      const startTime = now + i * 0.05
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.2 * intensity, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15)

      osc.connect(gain)
      gain.connect(this.masterGain!)

      osc.start(startTime)
      osc.stop(startTime + 0.15)
    })
  }

  /**
   * Game over - descending sad tone
   */
  private playGameOver(): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    // Descending minor chord
    const frequencies = [440, 349, 293] // A, F, D (minor feel)
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 1.5)

      const gain = ctx.createGain()
      const startTime = now + i * 0.1
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5)

      osc.connect(gain)
      gain.connect(this.masterGain!)

      osc.start(startTime)
      osc.stop(now + 1.5)
    })
  }

  /**
   * Milestone - celebratory chime
   */
  private playMilestone(intensity: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    // Major chord arpeggio
    const frequencies = [523, 659, 784, 1047] // C5, E5, G5, C6
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq

      const gain = ctx.createGain()
      const startTime = now + i * 0.08
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.2 * intensity, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4)

      osc.connect(gain)
      gain.connect(this.masterGain!)

      osc.start(startTime)
      osc.stop(startTime + 0.4)
    })
  }

  /**
   * Countdown beep
   */
  private playCountdown(intensity: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = intensity > 0.9 ? 880 : 440 // Higher pitch for "GO"

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)

    osc.connect(gain)
    gain.connect(this.masterGain!)

    osc.start(now)
    osc.stop(now + 0.2)
  }

  /**
   * Perfect dodge - satisfying success sound
   */
  private playPerfectDodge(intensity: number, pitch: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    // Quick rising arpeggio with shimmer
    const frequencies = [600, 900, 1200]
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq * pitch

      const gain = ctx.createGain()
      const startTime = now + i * 0.03
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.25 * intensity, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2)

      osc.connect(gain)
      gain.connect(this.masterGain!)

      osc.start(startTime)
      osc.stop(startTime + 0.2)
    })
  }

  /**
   * Combo milestone - escalating celebration
   */
  private playComboMilestone(intensity: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    // Rising power chord
    const frequencies = [330, 440, 550, 660, 880]
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq

      const gain = ctx.createGain()
      const startTime = now + i * 0.04
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.2 * intensity, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3)

      osc.connect(gain)
      gain.connect(this.masterGain!)

      osc.start(startTime)
      osc.stop(startTime + 0.3)
    })
  }

  /**
   * Collect gem - sparkly coin pickup sound
   */
  private playCollect(intensity: number, pitch: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    // Bright sparkly arpeggio
    const frequencies = [880, 1100, 1320, 1760]
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq * pitch

      const gain = ctx.createGain()
      const startTime = now + i * 0.03
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.25 * intensity, startTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15)

      osc.connect(gain)
      gain.connect(this.masterGain!)

      osc.start(startTime)
      osc.stop(startTime + 0.15)
    })
  }

  /**
   * Quiz popup - attention-grabbing notification
   */
  private playQuizPopup(intensity: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    // Two-tone notification chime
    const frequencies = [660, 880]
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq

      const gain = ctx.createGain()
      const startTime = now + i * 0.1
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.2 * intensity, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2)

      osc.connect(gain)
      gain.connect(this.masterGain!)

      osc.start(startTime)
      osc.stop(startTime + 0.2)
    })
  }

  /**
   * Quiz correct - triumphant success sound
   */
  private playQuizCorrect(intensity: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    // Major chord arpeggio (C-E-G-C)
    const frequencies = [523, 659, 784, 1047]
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq

      const gain = ctx.createGain()
      const startTime = now + i * 0.06
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.25 * intensity, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3)

      osc.connect(gain)
      gain.connect(this.masterGain!)

      osc.start(startTime)
      osc.stop(startTime + 0.3)
    })
  }

  /**
   * Quiz wrong - descending failure sound
   */
  private playQuizWrong(intensity: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    // Descending minor second (dissonant)
    const frequencies = [400, 380]
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.value = freq

      // Add filter for less harsh sound
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 1500

      const gain = ctx.createGain()
      const startTime = now + i * 0.15
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.15 * intensity, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.masterGain!)

      osc.start(startTime)
      osc.stop(startTime + 0.25)
    })
  }

  /**
   * Quiz tick - countdown timer tick (normal)
   */
  private playQuizTick(intensity: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    // Soft click/tick sound
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 1200

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.1 * intensity, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05)

    osc.connect(gain)
    gain.connect(this.masterGain!)

    osc.start(now)
    osc.stop(now + 0.05)
  }

  /**
   * Quiz tick urgent - countdown timer tick (last 5 seconds)
   */
  private playQuizTickUrgent(intensity: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    // Higher pitch, more urgent tick
    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.value = 880

    // Add second oscillator for urgency
    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.value = 1760

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.15 * intensity, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)

    const gain2 = ctx.createGain()
    gain2.gain.setValueAtTime(0.1 * intensity, now)
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.06)

    osc.connect(gain)
    osc2.connect(gain2)
    gain.connect(this.masterGain!)
    gain2.connect(this.masterGain!)

    osc.start(now)
    osc.stop(now + 0.08)
    osc2.start(now)
    osc2.stop(now + 0.06)
  }

  // ============================================
  // ARCADE LANDING SOUNDS
  // ============================================

  /**
   * Arcade power on - CRT warming up buzz with ascending tone
   */
  private playArcadePowerOn(intensity: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    // Low hum that rises (CRT warming up)
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(60, now)
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.4)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 300

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.08 * intensity, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain!)

    osc.start(now)
    osc.stop(now + 0.5)

    // Startup chime (ascending notes)
    const notes = [262, 330, 392, 523] // C4, E4, G4, C5
    notes.forEach((freq, i) => {
      const noteOsc = ctx.createOscillator()
      noteOsc.type = 'square'
      noteOsc.frequency.value = freq

      const noteGain = ctx.createGain()
      const startTime = now + 0.1 + i * 0.12
      noteGain.gain.setValueAtTime(0, startTime)
      noteGain.gain.linearRampToValueAtTime(0.12 * intensity, startTime + 0.02)
      noteGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15)

      noteOsc.connect(noteGain)
      noteGain.connect(this.masterGain!)

      noteOsc.start(startTime)
      noteOsc.stop(startTime + 0.15)
    })
  }

  /**
   * Arcade boot blip - terminal typing sound
   */
  private playArcadeBootBlip(intensity: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.value = 1200 + Math.random() * 200

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.04 * intensity, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025)

    osc.connect(gain)
    gain.connect(this.masterGain!)

    osc.start(now)
    osc.stop(now + 0.025)
  }

  /**
   * Arcade boot line complete - line finished sound
   */
  private playArcadeBootLine(intensity: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(660, now)
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.06)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.08 * intensity, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)

    osc.connect(gain)
    gain.connect(this.masterGain!)

    osc.start(now)
    osc.stop(now + 0.08)
  }

  /**
   * Arcade ready - triumphant boot complete fanfare
   */
  private playArcadeReady(intensity: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    // Triumphant fanfare
    const notes = [523, 659, 784, 1047, 1047] // C5, E5, G5, C6, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.value = freq

      const gain = ctx.createGain()
      const startTime = now + i * 0.08
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.15 * intensity, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25)

      osc.connect(gain)
      gain.connect(this.masterGain!)

      osc.start(startTime)
      osc.stop(startTime + 0.25)
    })
  }

  /**
   * Arcade hover - UI hover blip
   */
  private playArcadeHover(intensity: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 880

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.06 * intensity, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

    osc.connect(gain)
    gain.connect(this.masterGain!)

    osc.start(now)
    osc.stop(now + 0.05)
  }

  /**
   * Arcade click - UI click/select sound
   */
  private playArcadeClick(intensity: number): void {
    const ctx = this.ctx!
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.06)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.1 * intensity, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)

    osc.connect(gain)
    gain.connect(this.masterGain!)

    osc.start(now)
    osc.stop(now + 0.08)
  }

  // ============================================
  // CONTINUOUS SOUNDS
  // ============================================

  /**
   * Setup wind sound (continuous, intensity-controlled)
   */
  private setupWindSound(): void {
    if (!this.ctx) return

    // Create noise source that loops
    const bufferSize = this.ctx.sampleRate * 2 // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    this.windSource = this.ctx.createBufferSource()
    this.windSource.buffer = buffer
    this.windSource.loop = true

    this.windFilter = this.ctx.createBiquadFilter()
    this.windFilter.type = 'bandpass'
    this.windFilter.frequency.value = 1000
    this.windFilter.Q.value = 0.5

    this.windGain = this.ctx.createGain()
    this.windGain.gain.value = 0 // Start silent

    this.windSource.connect(this.windFilter)
    this.windFilter.connect(this.windGain)
    this.windGain.connect(this.masterGain!)

    this.windSource.start()
  }

  /**
   * Update wind intensity (0-1)
   * Throttled to prevent audio scheduling overload
   */
  private lastWindUpdate: number = 0
  private readonly WIND_UPDATE_INTERVAL = 100 // Only update every 100ms
  
  private updateWind(intensity: number): void {
    if (!this.windGain || !this.windFilter || !this.ctx) return

    const targetIntensity = Math.max(0, Math.min(1, intensity))
    
    // Only update if intensity changed significantly AND enough time has passed
    const now = performance.now()
    const timeSinceLastUpdate = now - this.lastWindUpdate
    const intensityDelta = Math.abs(targetIntensity - this.currentWindIntensity)
    
    // Throttle updates: only update every 100ms OR if intensity changed by more than 0.1
    if (timeSinceLastUpdate < this.WIND_UPDATE_INTERVAL && intensityDelta < 0.1) {
      return
    }
    
    // Skip tiny changes
    if (intensityDelta < 0.02) {
      return
    }
    
    this.lastWindUpdate = now
    this.currentWindIntensity = targetIntensity
    
    // Cancel any pending ramps by setting value immediately first
    const ctxTime = this.ctx.currentTime
    this.windGain.gain.cancelScheduledValues(ctxTime)
    this.windFilter.frequency.cancelScheduledValues(ctxTime)
    
    // Set current value then ramp to target
    this.windGain.gain.setValueAtTime(this.windGain.gain.value, ctxTime)
    this.windGain.gain.linearRampToValueAtTime(targetIntensity * 0.15, ctxTime + 0.15)
    
    // Higher speed = higher pitch wind
    const freq = 800 + targetIntensity * 1500
    this.windFilter.frequency.setValueAtTime(this.windFilter.frequency.value, ctxTime)
    this.windFilter.frequency.linearRampToValueAtTime(freq, ctxTime + 0.15)
  }

  // ============================================
  // UTILITIES
  // ============================================

  /**
   * Create white noise source
   */
  private createNoiseSource(duration: number): AudioBufferSourceNode {
    const ctx = this.ctx!
    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer
    return source
  }

  /**
   * Create distortion curve for waveshaper
   */
  private createDistortionCurve(amount: number): Float32Array | null {
    const samples = 44100
    const curve = new Float32Array(samples)
    const deg = Math.PI / 180

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x))
    }

    return curve as Float32Array
  }

  // ============================================
  // SETTINGS
  // ============================================

  /**
   * Update settings
   */
  setSettings(settings: Partial<SoundSettings>): void {
    this.settings = { ...this.settings, ...settings }
    
    if (this.masterGain) {
      const volume = this.settings.muted ? 0 : this.settings.masterVolume * this.settings.sfxVolume
      this.masterGain.gain.value = volume
    }
  }

  /**
   * Get current settings
   */
  getSettings(): SoundSettings {
    return { ...this.settings }
  }

  /**
   * Mute/unmute
   */
  setMuted(muted: boolean): void {
    this.setSettings({ muted })
  }

  /**
   * Check if muted
   */
  isMuted(): boolean {
    return this.settings.muted
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    if (this.windSource) {
      this.windSource.stop()
      this.windSource.disconnect()
    }
    
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }

    this.masterGain = null
    this.windGain = null
    this.windFilter = null
    this.windSource = null
    
    console.log('[SynthSoundManager] Disposed')
  }
}

// Singleton instance
let soundManagerInstance: SynthSoundManager | null = null

export function getSoundManager(): SynthSoundManager {
  if (!soundManagerInstance) {
    soundManagerInstance = new SynthSoundManager()
  }
  return soundManagerInstance
}
