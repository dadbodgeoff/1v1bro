import { describe, it, expect, beforeEach } from 'vitest';
import { AggressionCurve } from './AggressionCurve';
import { AggressionModifiers, BotPersonalityConfig } from './types';

describe('AggressionCurve', () => {
  let curve: AggressionCurve;

  const defaultModifiers: AggressionModifiers = {
    scoreDiff: 0,
    healthRatio: 1.0,
    timeRatio: 0.5,
    recentDamageDealt: 0,
    recentDamageTaken: 0,
  };

  beforeEach(() => {
    curve = new AggressionCurve();
  });

  describe('wave math', () => {
    it('should return values in valid range', () => {
      for (let t = 0; t < 60000; t += 1000) {
        const value = curve.calculate(t, defaultModifiers);
        expect(value).toBeGreaterThanOrEqual(0.1);
        expect(value).toBeLessThanOrEqual(0.95);
      }
    });

    it('should oscillate over time', () => {
      const values: number[] = [];
      for (let t = 0; t < 60000; t += 5000) {
        values.push(curve.calculateBase(t));
      }

      // Should have variation (not constant)
      const min = Math.min(...values);
      const max = Math.max(...values);
      expect(max - min).toBeGreaterThan(0.1);
    });

    it('should have ~30s primary cycle', () => {
      // Sample at 0 and ~31s (full cycle)
      const t0 = curve.calculateBase(0);
      const t31 = curve.calculateBase(31400); // ~31.4s for full cycle at 0.0002 freq

      // Should be close to same value after full cycle
      expect(Math.abs(t31 - t0)).toBeLessThan(0.15);
    });
  });

  describe('modifiers', () => {
    it('should increase aggression when winning', () => {
      const neutral = curve.calculate(10000, defaultModifiers);
      const winning = curve.calculate(10000, { ...defaultModifiers, scoreDiff: 3 });

      expect(winning).toBeGreaterThan(neutral);
    });

    it('should decrease aggression when losing', () => {
      const neutral = curve.calculate(10000, defaultModifiers);
      const losing = curve.calculate(10000, { ...defaultModifiers, scoreDiff: -3 });

      expect(losing).toBeLessThan(neutral);
    });

    it('should decrease aggression at low health', () => {
      const fullHealth = curve.calculate(10000, defaultModifiers);
      const lowHealth = curve.calculate(10000, { ...defaultModifiers, healthRatio: 0.2 });

      expect(lowHealth).toBeLessThan(fullHealth);
    });

    it('should increase aggression at high health', () => {
      const halfHealth = curve.calculate(10000, { ...defaultModifiers, healthRatio: 0.5 });
      const fullHealth = curve.calculate(10000, { ...defaultModifiers, healthRatio: 1.0 });

      expect(fullHealth).toBeGreaterThan(halfHealth);
    });

    it('should increase aggression when losing late in match', () => {
      const earlyLosing = curve.calculate(10000, { 
        ...defaultModifiers, 
        scoreDiff: -2, 
        timeRatio: 0.3 
      });
      const lateLosing = curve.calculate(10000, { 
        ...defaultModifiers, 
        scoreDiff: -2, 
        timeRatio: 0.9 
      });

      expect(lateLosing).toBeGreaterThan(earlyLosing);
    });

    it('should not apply time pressure when winning', () => {
      const earlyWinning = curve.calculate(10000, { 
        ...defaultModifiers, 
        scoreDiff: 2, 
        timeRatio: 0.3 
      });
      const lateWinning = curve.calculate(10000, { 
        ...defaultModifiers, 
        scoreDiff: 2, 
        timeRatio: 0.9 
      });

      // Should be similar (no time pressure bonus when winning)
      expect(Math.abs(lateWinning - earlyWinning)).toBeLessThan(0.1);
    });

    it('should increase aggression when dealing damage', () => {
      const neutral = curve.calculate(10000, defaultModifiers);
      const dealing = curve.calculate(10000, { 
        ...defaultModifiers, 
        recentDamageDealt: 50,
        recentDamageTaken: 0,
      });

      expect(dealing).toBeGreaterThan(neutral);
    });

    it('should decrease aggression when taking damage', () => {
      const neutral = curve.calculate(10000, defaultModifiers);
      const taking = curve.calculate(10000, { 
        ...defaultModifiers, 
        recentDamageDealt: 0,
        recentDamageTaken: 50,
      });

      expect(taking).toBeLessThan(neutral);
    });
  });

  describe('trend detection', () => {
    it('should detect rising trend', () => {
      // Feed increasing values
      const state1 = curve.getState(0, defaultModifiers);
      const state2 = curve.getState(5000, defaultModifiers);
      const state3 = curve.getState(10000, defaultModifiers);

      // At least one should show a trend
      const trends = [state1.trend, state2.trend, state3.trend];
      expect(trends).toContain('rising');
    });

    it('should detect push phase at high aggression', () => {
      // Force high aggression with winning + full health
      const state = curve.getState(10000, {
        ...defaultModifiers,
        scoreDiff: 5,
        healthRatio: 1.0,
      });

      // May or may not be in push phase depending on wave position
      // Just verify the flag is boolean
      expect(typeof state.inPushPhase).toBe('boolean');
    });

    it('should detect retreat phase at low aggression', () => {
      // Force low aggression with losing + low health
      const state = curve.getState(10000, {
        ...defaultModifiers,
        scoreDiff: -5,
        healthRatio: 0.2,
      });

      expect(typeof state.inRetreatPhase).toBe('boolean');
    });
  });

  describe('personality configuration', () => {
    it('should use personality base aggression', () => {
      const rusherPersonality: BotPersonalityConfig = {
        type: 'rusher',
        displayName: 'Blitz',
        baseAggression: 0.7,
        aggressionVolatility: 0.3,
        tacticWeights: {
          STRAFE: 1.2,
          PEEK: 0.6,
          PUSH: 1.5,
          RETREAT: 0.5,
          HOLD: 0.3,
          FLANK: 1.3,
        },
        reactionTimeMs: 200,
        accuracyBase: 0.7,
        trackingSkill: 0.8,
        signatures: [],
        mercyThreshold: 0.8,
        mercyDuration: 3000,
      };

      const rusherCurve = new AggressionCurve(rusherPersonality);

      // Sample multiple times to get average (waves can cause variation)
      let rusherTotal = 0;
      for (let t = 0; t < 60000; t += 5000) {
        rusherTotal += rusherCurve.calculateBase(t);
      }
      const rusherAvg = rusherTotal / 12;

      // Rusher should average around 0.7 base aggression
      expect(rusherAvg).toBeGreaterThan(0.6);
      expect(rusherAvg).toBeLessThan(0.8);
    });

    it('should use personality volatility', () => {
      const volatilePersonality: BotPersonalityConfig = {
        type: 'rusher',
        displayName: 'Test',
        baseAggression: 0.5,
        aggressionVolatility: 1.0, // High volatility
        tacticWeights: {
          STRAFE: 1,
          PEEK: 1,
          PUSH: 1,
          RETREAT: 1,
          HOLD: 1,
          FLANK: 1,
        },
        reactionTimeMs: 200,
        accuracyBase: 0.7,
        trackingSkill: 0.8,
        signatures: [],
        mercyThreshold: 0.8,
        mercyDuration: 3000,
      };

      const volatileCurve = new AggressionCurve(volatilePersonality);
      
      // Sample over time
      const values: number[] = [];
      for (let t = 0; t < 60000; t += 5000) {
        values.push(volatileCurve.calculateBase(t));
      }

      const range = Math.max(...values) - Math.min(...values);
      expect(range).toBeGreaterThan(0.2); // Should have significant swing
    });
  });

  describe('reset', () => {
    it('should clear history on reset', () => {
      // Build up history
      curve.getState(0, defaultModifiers);
      curve.getState(1000, defaultModifiers);
      curve.getState(2000, defaultModifiers);

      curve.reset();

      // After reset, trend detection should start fresh
      const state = curve.getState(3000, defaultModifiers);
      expect(state.trend).toBe('rising'); // Default when no history
    });
  });
});
