/**
 * Tests for SoundEventRegistry
 */

import { describe, it, expect } from 'vitest'
import {
  SOUND_REGISTRY,
  getSoundsBySystem,
  getSoundsBySourceFile,
  getSoundTrigger,
} from './SoundEventRegistry'

describe('SoundEventRegistry', () => {
  describe('SOUND_REGISTRY', () => {
    it('should have all required sound categories', () => {
      const keys = Object.keys(SOUND_REGISTRY)

      // Player sounds
      expect(keys.some((k) => k.startsWith('player.'))).toBe(true)

      // Collision sounds
      expect(keys.some((k) => k.startsWith('collision.'))).toBe(true)

      // Game state sounds
      expect(keys.some((k) => k.startsWith('game.'))).toBe(true)

      // Quiz sounds
      expect(keys.some((k) => k.startsWith('quiz.'))).toBe(true)

      // UI sounds
      expect(keys.some((k) => k.startsWith('ui.'))).toBe(true)
    })

    it('should have valid sound events for all triggers', () => {
      const validSoundEvents = [
        'jump',
        'land',
        'land-heavy',
        'slide-start',
        'slide-end',
        'near-miss',
        'perfect-dodge',
        'collision',
        'lane-change',
        'speed-wind',
        'boost',
        'game-over',
        'countdown',
        'milestone',
        'combo-milestone',
        'collect',
        'quiz-popup',
        'quiz-correct',
        'quiz-wrong',
        'quiz-tick',
        'quiz-tick-urgent',
        'arcade-power-on',
        'arcade-boot-blip',
        'arcade-boot-line',
        'arcade-ready',
        'arcade-hover',
        'arcade-click',
      ]

      Object.values(SOUND_REGISTRY).forEach((trigger) => {
        expect(validSoundEvents).toContain(trigger.sound)
      })
    })

    it('should have intensity between 0 and 1 for all triggers', () => {
      Object.values(SOUND_REGISTRY).forEach((trigger) => {
        expect(trigger.intensity).toBeGreaterThanOrEqual(0)
        expect(trigger.intensity).toBeLessThanOrEqual(1)
      })
    })

    it('should have description and sourceFile for all triggers', () => {
      Object.values(SOUND_REGISTRY).forEach((trigger) => {
        expect(trigger.description).toBeTruthy()
        expect(trigger.sourceFile).toBeTruthy()
        expect(trigger.triggeredBy).toBeTruthy()
      })
    })
  })

  describe('getSoundsBySystem', () => {
    it('should find sounds triggered by FeedbackSystem', () => {
      const sounds = getSoundsBySystem('FeedbackSystem')
      expect(sounds.length).toBeGreaterThan(0)
      expect(sounds.some((s) => s.sound === 'jump')).toBe(true)
    })

    it('should find sounds triggered by useUISound', () => {
      const sounds = getSoundsBySystem('useUISound')
      expect(sounds.length).toBeGreaterThan(0)
      expect(sounds.some((s) => s.sound === 'arcade-hover')).toBe(true)
    })

    it('should return empty array for unknown system', () => {
      const sounds = getSoundsBySystem('NonExistentSystem')
      expect(sounds).toEqual([])
    })
  })

  describe('getSoundsBySourceFile', () => {
    it('should find sounds from FixedUpdateLoop', () => {
      const sounds = getSoundsBySourceFile('FixedUpdateLoop')
      expect(sounds.length).toBeGreaterThan(0)
      expect(sounds.some((s) => s.sound === 'jump')).toBe(true)
    })

    it('should find sounds from CollisionHandler', () => {
      const sounds = getSoundsBySourceFile('CollisionHandler')
      expect(sounds.length).toBeGreaterThan(0)
      expect(sounds.some((s) => s.sound === 'collision')).toBe(true)
    })

    it('should find sounds from TriviaBillboardManager', () => {
      const sounds = getSoundsBySourceFile('TriviaBillboardManager')
      expect(sounds.length).toBeGreaterThan(0)
      expect(sounds.some((s) => s.sound === 'quiz-popup')).toBe(true)
    })
  })

  describe('getSoundTrigger', () => {
    it('should return trigger for valid key', () => {
      const trigger = getSoundTrigger('player.jump')
      expect(trigger).toBeDefined()
      expect(trigger?.sound).toBe('jump')
    })

    it('should return undefined for invalid key', () => {
      const trigger = getSoundTrigger('invalid.key')
      expect(trigger).toBeUndefined()
    })
  })
})
