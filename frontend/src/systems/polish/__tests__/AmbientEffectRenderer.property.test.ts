/**
 * AmbientEffectRenderer Property-Based Tests
 * 
 * Property-based tests for ambient effect system using fast-check.
 * Each test validates correctness properties defined in the design document.
 * 
 * @module systems/polish/__tests__/AmbientEffectRenderer.property
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import {
  AmbientEffectRenderer,
  resetAmbientEffectRenderer,
  getParticleConfigForTheme,
  calculateEffectiveParticleCount,
  isHeavyPage,
  getRenderMode,
  HEAVY_PAGES,
  PARTICLE_CONFIGS,
  type AmbientTheme,
  type ParticleType,
} from '../AmbientEffectRenderer';

// ============================================
// Test Data
// ============================================

const ALL_THEMES: AmbientTheme[] = ['winter', 'autumn', 'spring', 'summer', 'celebration', 'none'];
const ACTIVE_THEMES: AmbientTheme[] = ['winter', 'autumn', 'spring', 'summer', 'celebration'];
const ALL_PARTICLE_TYPES: ParticleType[] = ['snow', 'leaves', 'petals', 'confetti', 'sparkles'];

describe('AmbientEffectRenderer Properties', () => {
  beforeEach(() => {
    resetAmbientEffectRenderer();
  });

  /**
   * **Feature: enterprise-polish-systems, Property 13: Theme maps to particle configuration**
   * **Validates: Requirements 4.1**
   * 
   * For any active AmbientTheme (except 'none'), the renderer SHALL produce
   * a ParticleConfig with the corresponding particle type and non-zero count.
   */
  describe('Property 13: Theme maps to particle configuration', () => {
    it('every active theme produces a valid particle config', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ACTIVE_THEMES),
          (theme) => {
            const config = getParticleConfigForTheme(theme);
            
            expect(config).not.toBeNull();
            expect(config!.type).toBeDefined();
            expect(ALL_PARTICLE_TYPES).toContain(config!.type);
            expect(config!.count).toBeGreaterThan(0);
            
            return true;
          }
        ),
        { numRuns: ACTIVE_THEMES.length }
      );
    });

    it('none theme produces null config', () => {
      const config = getParticleConfigForTheme('none');
      expect(config).toBeNull();
    });

    it('winter theme produces snow particles', () => {
      const config = getParticleConfigForTheme('winter');
      expect(config?.type).toBe('snow');
    });

    it('autumn theme produces leaves particles', () => {
      const config = getParticleConfigForTheme('autumn');
      expect(config?.type).toBe('leaves');
    });

    it('spring theme produces petals particles', () => {
      const config = getParticleConfigForTheme('spring');
      expect(config?.type).toBe('petals');
    });

    it('celebration theme produces confetti particles', () => {
      const config = getParticleConfigForTheme('celebration');
      expect(config?.type).toBe('confetti');
    });

    it('all particle configs have required properties', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_PARTICLE_TYPES),
          (type) => {
            const config = PARTICLE_CONFIGS[type];
            
            expect(config.type).toBe(type);
            expect(config.speed).toBeGreaterThan(0);
            expect(config.size[0]).toBeLessThanOrEqual(config.size[1]);
            expect(config.opacity[0]).toBeLessThanOrEqual(config.opacity[1]);
            expect(config.colors.length).toBeGreaterThan(0);
            
            return true;
          }
        ),
        { numRuns: ALL_PARTICLE_TYPES.length }
      );
    });
  });

  /**
   * **Feature: enterprise-polish-systems, Property 14: Disabled ambient effects render nothing**
   * **Validates: Requirements 4.2**
   * 
   * For any render cycle, WHEN ambient_effects setting is false,
   * effectiveParticleCount SHALL be 0.
   */
  describe('Property 14: Disabled ambient effects render nothing', () => {
    it('disabled renderer has zero effective particle count', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ACTIVE_THEMES),
          fc.integer({ min: 0, max: 100 }),
          (theme, performanceScore) => {
            const renderer = new AmbientEffectRenderer({ enabled: false });
            renderer.setTheme(theme);
            renderer.setPerformanceScore(performanceScore);
            
            expect(renderer.effectiveParticleCount).toBe(0);
            expect(renderer.isActive).toBe(false);
            
            renderer.dispose();
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('setEnabled(false) disables particle rendering', () => {
      const renderer = new AmbientEffectRenderer({ enabled: true });
      renderer.setTheme('winter');
      
      expect(renderer.effectiveParticleCount).toBeGreaterThan(0);
      
      renderer.setEnabled(false);
      
      expect(renderer.effectiveParticleCount).toBe(0);
      expect(renderer.isActive).toBe(false);
      
      renderer.dispose();
    });

    it('calculateEffectiveParticleCount returns 0 when disabled', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          fc.boolean(),
          (baseCount, performanceScore, isHeavy) => {
            const count = calculateEffectiveParticleCount(baseCount, performanceScore, isHeavy, false);
            expect(count).toBe(0);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: enterprise-polish-systems, Property 15: Performance scaling reduces particles**
   * **Validates: Requirements 4.3**
   * 
   * For any performance score below threshold (e.g., < 0.5),
   * effectiveParticleCount SHALL be at most 50% of the configured count.
   */
  describe('Property 15: Performance scaling reduces particles', () => {
    it('low performance score reduces particle count', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 21, max: 49 }), // Between disable and reduce thresholds
          (performanceScore) => {
            const renderer = new AmbientEffectRenderer({ enabled: true, performanceScore });
            renderer.setTheme('winter');
            
            const baseConfig = getParticleConfigForTheme('winter');
            const effectiveCount = renderer.effectiveParticleCount;
            
            // Should be at most 50% of base
            expect(effectiveCount).toBeLessThanOrEqual(Math.floor(baseConfig!.count * 0.5));
            
            renderer.dispose();
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('very low performance score disables particles', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 19 }), // Below disable threshold
          (performanceScore) => {
            const renderer = new AmbientEffectRenderer({ enabled: true, performanceScore });
            renderer.setTheme('winter');
            
            expect(renderer.effectiveParticleCount).toBe(0);
            
            renderer.dispose();
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('high performance score uses full particle count', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 50, max: 100 }),
          (performanceScore) => {
            const renderer = new AmbientEffectRenderer({ enabled: true, performanceScore });
            renderer.setTheme('winter');
            renderer.setCurrentPath('/dashboard'); // Not a heavy page
            
            const baseConfig = getParticleConfigForTheme('winter');
            const effectiveCount = renderer.effectiveParticleCount;
            
            // Should be full count
            expect(effectiveCount).toBe(baseConfig!.count);
            
            renderer.dispose();
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('performance score is clamped to 0-100', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: 200 }),
          (score) => {
            const renderer = new AmbientEffectRenderer();
            renderer.setPerformanceScore(score);
            
            expect(renderer.performanceScore).toBeGreaterThanOrEqual(0);
            expect(renderer.performanceScore).toBeLessThanOrEqual(100);
            
            renderer.dispose();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: enterprise-polish-systems, Property 16: Heavy pages disable ambient effects**
   * **Validates: Requirements 4.5**
   * 
   * For any page in HEAVY_PAGES list, isActive SHALL be false
   * regardless of ambient_effects setting.
   */
  describe('Property 16: Heavy pages disable ambient effects', () => {
    it('heavy pages are correctly identified', () => {
      for (const page of HEAVY_PAGES) {
        expect(isHeavyPage(page)).toBe(true);
        expect(isHeavyPage(page + '/subpath')).toBe(true);
      }
    });

    it('non-heavy pages are not identified as heavy', () => {
      const nonHeavyPages = ['/dashboard', '/profile', '/settings', '/battlepass', '/achievements'];
      
      for (const page of nonHeavyPages) {
        expect(isHeavyPage(page)).toBe(false);
      }
    });

    it('isActive is false on heavy pages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...HEAVY_PAGES),
          fc.constantFrom(...ACTIVE_THEMES),
          (page, theme) => {
            const renderer = new AmbientEffectRenderer({ enabled: true, performanceScore: 100 });
            renderer.setTheme(theme);
            renderer.setCurrentPath(page);
            
            expect(renderer.isActive).toBe(false);
            
            renderer.dispose();
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('calculateEffectiveParticleCount reduces by 75% for heavy pages', () => {
      // Test the calculation function directly
      const baseCount = 50;
      const performanceScore = 100;
      
      // Non-heavy page
      const normalCount = calculateEffectiveParticleCount(baseCount, performanceScore, false, true);
      expect(normalCount).toBe(baseCount);
      
      // Heavy page - should be 25% of normal (75% reduction)
      const heavyCount = calculateEffectiveParticleCount(baseCount, performanceScore, true, true);
      expect(heavyCount).toBe(Math.floor(baseCount * 0.25));
    });
  });


  /**
   * Additional properties for robustness
   */
  describe('Additional Properties', () => {
    it('render mode reflects settings correctly', () => {
      expect(getRenderMode(false, false, 100)).toBe('disabled');
      expect(getRenderMode(true, true, 100)).toBe('static');
      expect(getRenderMode(true, false, 10)).toBe('disabled');
      expect(getRenderMode(true, false, 100)).toBe('animated');
    });

    it('setTheme updates theme correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_THEMES),
          (theme) => {
            const renderer = new AmbientEffectRenderer();
            renderer.setTheme(theme);
            
            expect(renderer.theme).toBe(theme);
            
            renderer.dispose();
            return true;
          }
        ),
        { numRuns: ALL_THEMES.length }
      );
    });

    it('setReducedMotion updates render mode', () => {
      const renderer = new AmbientEffectRenderer({ enabled: true });
      
      expect(renderer.renderMode).toBe('animated');
      
      renderer.setReducedMotion(true);
      expect(renderer.renderMode).toBe('static');
      
      renderer.setReducedMotion(false);
      expect(renderer.renderMode).toBe('animated');
      
      renderer.dispose();
    });

    it('setCurrentPath updates path correctly', () => {
      const renderer = new AmbientEffectRenderer();
      
      renderer.setCurrentPath('/dashboard');
      expect(renderer.currentPath).toBe('/dashboard');
      
      renderer.setCurrentPath('/shop');
      expect(renderer.currentPath).toBe('/shop');
      
      renderer.dispose();
    });

    it('callbacks are notified on theme change', () => {
      const renderer = new AmbientEffectRenderer();
      const themes: AmbientTheme[] = [];
      
      renderer.onThemeChange((theme) => {
        themes.push(theme);
      });
      
      renderer.setTheme('winter');
      renderer.setTheme('autumn');
      
      expect(themes).toContain('winter');
      expect(themes).toContain('autumn');
      
      renderer.dispose();
    });

    it('callbacks are notified on config change', () => {
      const renderer = new AmbientEffectRenderer();
      let callCount = 0;
      
      renderer.onConfigChange(() => {
        callCount++;
      });
      
      renderer.setTheme('winter');
      renderer.setEnabled(false);
      renderer.setPerformanceScore(50);
      
      expect(callCount).toBeGreaterThan(0);
      
      renderer.dispose();
    });

    it('dispose cleans up state', () => {
      const renderer = new AmbientEffectRenderer();
      renderer.setTheme('winter');
      
      renderer.dispose();
      
      expect(renderer.theme).toBe('none');
    });

    it('getCurrentSeasonalTheme returns valid theme', () => {
      const theme = AmbientEffectRenderer.getCurrentSeasonalTheme();
      expect(ALL_THEMES).toContain(theme);
    });

    it('setSeasonalTheme sets theme based on current date', () => {
      const renderer = new AmbientEffectRenderer();
      renderer.setSeasonalTheme();
      
      // Should be one of the seasonal themes (not 'none' or 'celebration')
      expect(['winter', 'autumn', 'spring', 'summer']).toContain(renderer.theme);
      
      renderer.dispose();
    });

    it('getParticleConfig returns null when disabled', () => {
      const renderer = new AmbientEffectRenderer({ enabled: false });
      renderer.setTheme('winter');
      
      expect(renderer.getParticleConfig()).toBeNull();
      
      renderer.dispose();
    });

    it('getParticleConfig returns null for none theme', () => {
      const renderer = new AmbientEffectRenderer({ enabled: true });
      renderer.setTheme('none');
      
      expect(renderer.getParticleConfig()).toBeNull();
      
      renderer.dispose();
    });
  });
});
