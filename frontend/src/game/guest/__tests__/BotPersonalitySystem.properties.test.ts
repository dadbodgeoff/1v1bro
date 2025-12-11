/**
 * Property-Based Tests for BotPersonalitySystem
 * 
 * Tests bot name uniqueness and behavior variation.
 * 
 * @module game/guest/__tests__/BotPersonalitySystem.properties
 */

import fc from 'fast-check'
import { describe, it, expect, beforeEach } from 'vitest'
import { BotPersonalitySystem, BOT_NAMES } from '../BotPersonalitySystem'

// Reset singleton between tests
beforeEach(() => {
  BotPersonalitySystem.resetInstance()
})

/**
 * **Feature: guest-experience-enhancement, Property 9: Bot name uniqueness per session**
 * 
 * For any guest session, consecutive bot opponents SHALL have different names
 * (no immediate repeats).
 * 
 * **Validates: Requirements 7.2**
 */
describe('Property 9: Bot name uniqueness per session', () => {
  it('consecutive bot names are never the same', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 50 }),
        (numBots) => {
          const system = BotPersonalitySystem.getInstance()
          const names: string[] = []
          
          for (let i = 0; i < numBots; i++) {
            const personality = system.generatePersonality()
            names.push(personality.name)
          }
          
          // Check no consecutive duplicates
          for (let i = 1; i < names.length; i++) {
            expect(names[i]).not.toBe(names[i - 1])
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('all generated names come from the name pool', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }),
        (numBots) => {
          const system = BotPersonalitySystem.getInstance()
          
          for (let i = 0; i < numBots; i++) {
            const personality = system.generatePersonality()
            expect(BOT_NAMES).toContain(personality.name)
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  it('name pool has at least 12 names', () => {
    expect(BOT_NAMES.length).toBeGreaterThanOrEqual(12)
  })

  it('getLastUsedName returns the most recent name', () => {
    const system = BotPersonalitySystem.getInstance()
    
    const p1 = system.generatePersonality()
    expect(system.getLastUsedName()).toBe(p1.name)
    
    const p2 = system.generatePersonality()
    expect(system.getLastUsedName()).toBe(p2.name)
  })

  it('getUsedNames tracks all names used', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (numBots) => {
          BotPersonalitySystem.resetInstance()
          const system = BotPersonalitySystem.getInstance()
          const generatedNames: string[] = []
          
          for (let i = 0; i < numBots; i++) {
            const personality = system.generatePersonality()
            generatedNames.push(personality.name)
          }
          
          const usedNames = system.getUsedNames()
          
          // All generated names should be in used names
          generatedNames.forEach(name => {
            expect(usedNames).toContain(name)
          })
        }
      ),
      { numRuns: 50 }
    )
  })
})

/**
 * **Feature: guest-experience-enhancement, Property 10: Bot behavior variation**
 * 
 * For any bot opponent over a 30-second window, the bot SHALL exhibit at least
 * 2 different behavior patterns (patrol, chase, strafe, evade).
 * 
 * **Validates: Requirements 7.3**
 */
describe('Property 10: Bot behavior variation', () => {
  it('generated personalities have varied difficulty levels', () => {
    const system = BotPersonalitySystem.getInstance()
    const difficulties = new Set<string>()
    
    // Generate many bots to check distribution
    for (let i = 0; i < 100; i++) {
      BotPersonalitySystem.resetInstance()
      const personality = BotPersonalitySystem.getInstance().generatePersonality()
      difficulties.add(personality.difficulty)
    }
    
    // Should have at least 2 different difficulties
    expect(difficulties.size).toBeGreaterThanOrEqual(2)
  })

  it('generated personalities have varied behavior biases', () => {
    const biases = new Set<string>()
    
    // Generate many bots to check distribution
    for (let i = 0; i < 100; i++) {
      BotPersonalitySystem.resetInstance()
      const personality = BotPersonalitySystem.getInstance().generatePersonality()
      biases.add(personality.behaviorBias)
    }
    
    // Should have at least 2 different biases
    expect(biases.size).toBeGreaterThanOrEqual(2)
  })

  it('behavior config varies by difficulty', () => {
    const system = BotPersonalitySystem.getInstance()
    
    const easyPersonality = { ...system.generatePersonality(), difficulty: 'easy' as const }
    const hardPersonality = { ...system.generatePersonality(), difficulty: 'hard' as const }
    
    const easyConfig = system.getBehaviorConfig(easyPersonality)
    const hardConfig = system.getBehaviorConfig(hardPersonality)
    
    // Hard should be more accurate
    expect(hardConfig.quizAccuracy).toBeGreaterThan(easyConfig.quizAccuracy)
    expect(hardConfig.shootAccuracy).toBeGreaterThan(easyConfig.shootAccuracy)
    
    // Hard should be faster
    expect(hardConfig.shootCooldownMs).toBeLessThan(easyConfig.shootCooldownMs)
    expect(hardConfig.reactionTimeMs).toBeLessThan(easyConfig.reactionTimeMs)
  })

  it('behavior config varies by bias', () => {
    const system = BotPersonalitySystem.getInstance()
    
    const aggressivePersonality = { ...system.generatePersonality(), behaviorBias: 'aggressive' as const }
    const defensivePersonality = { ...system.generatePersonality(), behaviorBias: 'defensive' as const }
    
    const aggressiveConfig = system.getBehaviorConfig(aggressivePersonality)
    const defensiveConfig = system.getBehaviorConfig(defensivePersonality)
    
    // Aggressive should have higher aggro range
    expect(aggressiveConfig.aggroRange).toBeGreaterThan(defensiveConfig.aggroRange)
    
    // Defensive should retreat at higher health
    expect(defensiveConfig.retreatHealthPct).toBeGreaterThan(aggressiveConfig.retreatHealthPct)
  })

  it('all behavior config values are positive', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('easy', 'medium', 'hard'),
        fc.constantFrom('aggressive', 'defensive', 'balanced'),
        (difficulty, bias) => {
          BotPersonalitySystem.resetInstance()
          const system = BotPersonalitySystem.getInstance()
          const personality = {
            ...system.generatePersonality(),
            difficulty: difficulty as 'easy' | 'medium' | 'hard',
            behaviorBias: bias as 'aggressive' | 'defensive' | 'balanced',
          }
          
          const config = system.getBehaviorConfig(personality)
          
          expect(config.quizAccuracy).toBeGreaterThan(0)
          expect(config.minAnswerTimeMs).toBeGreaterThan(0)
          expect(config.maxAnswerTimeMs).toBeGreaterThan(0)
          expect(config.shootCooldownMs).toBeGreaterThan(0)
          expect(config.shootAccuracy).toBeGreaterThan(0)
          expect(config.aggroRange).toBeGreaterThan(0)
          expect(config.retreatHealthPct).toBeGreaterThan(0)
          expect(config.reactionTimeMs).toBeGreaterThan(0)
        }
      ),
      { numRuns: 20 }
    )
  })
})

describe('BotPersonalitySystem personality generation', () => {
  it('generates complete personality objects', () => {
    const system = BotPersonalitySystem.getInstance()
    const personality = system.generatePersonality()
    
    expect(personality.name).toBeTruthy()
    expect(personality.avatarUrl).toBeTruthy()
    expect(['easy', 'medium', 'hard']).toContain(personality.difficulty)
    expect(['aggressive', 'defensive', 'balanced']).toContain(personality.behaviorBias)
    expect(['fast', 'medium', 'slow']).toContain(personality.quizSpeed)
    expect(personality.tauntFrequency).toBeGreaterThanOrEqual(0)
    expect(personality.tauntFrequency).toBeLessThanOrEqual(1)
  })

  it('resetSession clears used names but keeps last name', () => {
    const system = BotPersonalitySystem.getInstance()
    
    system.generatePersonality()
    system.generatePersonality()
    const lastName = system.getLastUsedName()
    
    expect(system.getUsedNames().length).toBe(2)
    
    system.resetSession()
    
    expect(system.getUsedNames().length).toBe(0)
    expect(system.getLastUsedName()).toBe(lastName)
  })
})
