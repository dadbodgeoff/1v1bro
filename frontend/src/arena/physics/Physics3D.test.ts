import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { 
  Physics3D, 
  PhysicsConfig, 
  DEFAULT_PHYSICS_CONFIG, 
  PlayerPhysicsState,
  MovementInput,
  createInitialPhysicsState
} from './Physics3D';
import { CollisionWorld, CollisionManifest } from './CollisionWorld';
import { EventBus } from '../core/EventBus';
import { Vector3 } from '../math/Vector3';

// Create a test collision world with floor
function createTestWorld(): CollisionWorld {
  const world = new CollisionWorld();
  world.loadManifest({
    colliders: [
      { id: 'floor', center: [0, -0.5, 0], size: [100, 1, 100] }
    ]
  });
  return world;
}

// Create a test physics instance
function createTestPhysics(config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG): {
  physics: Physics3D;
  eventBus: EventBus;
  world: CollisionWorld;
} {
  const world = createTestWorld();
  const eventBus = new EventBus();
  const physics = new Physics3D(config, world, eventBus);
  return { physics, eventBus, world };
}

// Create grounded state
function createGroundedState(x: number = 0, z: number = 0): PlayerPhysicsState {
  return {
    position: new Vector3(x, 0, z),
    velocity: Vector3.ZERO,
    isGrounded: true,
    lastGroundedTime: 0,
    landingPenaltyEndTime: 0
  };
}

// Create airborne state
function createAirborneState(y: number = 5): PlayerPhysicsState {
  return {
    position: new Vector3(0, y, 0),
    velocity: Vector3.ZERO,
    isGrounded: false,
    lastGroundedTime: -1,
    landingPenaltyEndTime: 0
  };
}

// No input
const NO_INPUT: MovementInput = {
  forward: 0,
  right: 0,
  jump: false,
  yaw: 0
};

describe('Physics3D', () => {
  describe('DEFAULT_PHYSICS_CONFIG', () => {
    it('has correct default values', () => {
      expect(DEFAULT_PHYSICS_CONFIG.gravity).toBe(-20);
      expect(DEFAULT_PHYSICS_CONFIG.maxSpeed).toBe(7);
      expect(DEFAULT_PHYSICS_CONFIG.jumpVelocity).toBe(8);
      expect(DEFAULT_PHYSICS_CONFIG.airControl).toBe(0.3);
      expect(DEFAULT_PHYSICS_CONFIG.coyoteTime).toBe(0.1);
    });
  });

  describe('createInitialPhysicsState', () => {
    it('creates state at origin by default', () => {
      const state = createInitialPhysicsState();
      expect(state.position.equals(Vector3.ZERO)).toBe(true);
      expect(state.velocity.equals(Vector3.ZERO)).toBe(true);
      expect(state.isGrounded).toBe(false);
    });

    it('creates state at specified position', () => {
      const pos = new Vector3(5, 10, 15);
      const state = createInitialPhysicsState(pos);
      expect(state.position.equals(pos)).toBe(true);
    });
  });

  describe('gravity', () => {
    it('applies gravity when airborne', () => {
      const { physics } = createTestPhysics();
      const state = createAirborneState(10);
      const dt = 1 / 60;
      
      const newState = physics.step(state, NO_INPUT, dt, 0);
      
      // Velocity should decrease (gravity is negative)
      expect(newState.velocity.y).toBeLessThan(0);
      expect(newState.velocity.y).toBeCloseTo(DEFAULT_PHYSICS_CONFIG.gravity * dt, 4);
    });

    it('does not apply gravity when grounded', () => {
      const { physics } = createTestPhysics();
      const state = createGroundedState();
      const dt = 1 / 60;
      
      const newState = physics.step(state, NO_INPUT, dt, 0);
      
      // Velocity should remain zero (no gravity applied)
      expect(newState.velocity.y).toBeCloseTo(0, 4);
    });
  });

  describe('jumping', () => {
    it('applies jump velocity when grounded and jump pressed', () => {
      const { physics } = createTestPhysics();
      const state = createGroundedState();
      const input: MovementInput = { ...NO_INPUT, jump: true };
      
      const newState = physics.step(state, input, 1/60, 0);
      
      expect(newState.velocity.y).toBe(DEFAULT_PHYSICS_CONFIG.jumpVelocity);
      expect(newState.isGrounded).toBe(false);
    });

    it('allows coyote time jump', () => {
      const { physics } = createTestPhysics();
      const state: PlayerPhysicsState = {
        ...createAirborneState(5),
        lastGroundedTime: 0.05 // Was grounded 50ms ago
      };
      const input: MovementInput = { ...NO_INPUT, jump: true };
      
      // Current time is 0.08, within coyote time (0.1s)
      const newState = physics.step(state, input, 1/60, 0.08);
      
      expect(newState.velocity.y).toBe(DEFAULT_PHYSICS_CONFIG.jumpVelocity);
    });

    it('does not allow jump after coyote time expires', () => {
      const { physics } = createTestPhysics();
      const state: PlayerPhysicsState = {
        ...createAirborneState(5),
        lastGroundedTime: 0
      };
      const input: MovementInput = { ...NO_INPUT, jump: true };
      
      // Current time is 0.2, past coyote time (0.1s)
      const newState = physics.step(state, input, 1/60, 0.2);
      
      // Should not have jump velocity (gravity applied instead)
      expect(newState.velocity.y).toBeLessThan(DEFAULT_PHYSICS_CONFIG.jumpVelocity);
    });

    it('emits jump event', () => {
      const { physics, eventBus } = createTestPhysics();
      const handler = vi.fn();
      eventBus.on('jump', handler);
      
      const state = createGroundedState();
      const input: MovementInput = { ...NO_INPUT, jump: true };
      
      physics.step(state, input, 1/60, 0, 1);
      
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'jump',
        playerId: 1
      }));
    });
  });

  describe('movement', () => {
    it('accelerates when forward input is pressed', () => {
      const { physics } = createTestPhysics();
      const state = createGroundedState();
      const input: MovementInput = { ...NO_INPUT, forward: 1, yaw: 0 };
      
      const newState = physics.step(state, input, 1/60, 0);
      
      // Should have some forward velocity (negative Z)
      expect(newState.velocity.z).toBeLessThan(0);
    });

    it('respects max speed', () => {
      const { physics } = createTestPhysics();
      let state = createGroundedState();
      const input: MovementInput = { ...NO_INPUT, forward: 1, yaw: 0 };
      
      // Run many steps to reach max speed
      for (let i = 0; i < 100; i++) {
        state = physics.step(state, input, 1/60, i / 60);
      }
      
      const horizontalSpeed = state.velocity.horizontal().magnitude();
      expect(horizontalSpeed).toBeLessThanOrEqual(DEFAULT_PHYSICS_CONFIG.maxSpeed + 0.01);
    });

    it('applies friction when no input', () => {
      const { physics } = createTestPhysics();
      let state: PlayerPhysicsState = {
        ...createGroundedState(),
        velocity: new Vector3(0, 0, -5) // Moving forward
      };
      
      // Run steps with no input
      for (let i = 0; i < 30; i++) {
        state = physics.step(state, NO_INPUT, 1/60, i / 60);
      }
      
      // Should have slowed down significantly
      expect(state.velocity.horizontal().magnitude()).toBeLessThan(1);
    });

    it('reduces acceleration in air', () => {
      const { physics } = createTestPhysics();
      const groundedState = createGroundedState();
      const airborneState = createAirborneState(5);
      const input: MovementInput = { ...NO_INPUT, forward: 1, yaw: 0 };
      
      const groundedResult = physics.step(groundedState, input, 1/60, 0);
      const airborneResult = physics.step(airborneState, input, 1/60, 0);
      
      // Air acceleration should be 30% of ground
      const groundAccel = Math.abs(groundedResult.velocity.z);
      const airAccel = Math.abs(airborneResult.velocity.z);
      expect(airAccel).toBeCloseTo(groundAccel * DEFAULT_PHYSICS_CONFIG.airControl, 2);
    });
  });

  describe('terminal velocity', () => {
    it('clamps velocity to terminal velocity', () => {
      const { physics } = createTestPhysics();
      let state: PlayerPhysicsState = {
        ...createAirborneState(100),
        velocity: new Vector3(0, -100, 0) // Falling very fast
      };
      
      state = physics.step(state, NO_INPUT, 1/60, 0);
      
      expect(state.velocity.magnitude()).toBeLessThanOrEqual(DEFAULT_PHYSICS_CONFIG.terminalVelocity + 0.01);
    });
  });

  describe('landing', () => {
    it('emits land_impact event when landing from significant height', () => {
      const { physics, eventBus } = createTestPhysics();
      const handler = vi.fn();
      eventBus.on('land_impact', handler);
      
      // Simulate a fall by running multiple steps from high up
      let state: PlayerPhysicsState = {
        position: new Vector3(0, 10, 0), // Start very high
        velocity: new Vector3(0, 0, 0),
        isGrounded: false,
        lastGroundedTime: -1,
        landingPenaltyEndTime: 0
      };
      
      // Run until we land (need enough time to build up velocity)
      for (let i = 0; i < 120; i++) {
        state = physics.step(state, NO_INPUT, 1/60, i / 60, 1);
        if (state.isGrounded) break;
      }
      
      // Should have landed and emitted event
      expect(state.isGrounded).toBe(true);
      expect(handler).toHaveBeenCalled();
    });

    it('does not emit land_impact for small falls', () => {
      const { physics, eventBus } = createTestPhysics();
      const handler = vi.fn();
      eventBus.on('land_impact', handler);
      
      // Small fall - velocity won't be high enough
      let state: PlayerPhysicsState = {
        position: new Vector3(0, 0.5, 0), // Just slightly above ground
        velocity: new Vector3(0, -1, 0), // Small downward velocity
        isGrounded: false,
        lastGroundedTime: -1,
        landingPenaltyEndTime: 0
      };
      
      for (let i = 0; i < 30; i++) {
        state = physics.step(state, NO_INPUT, 1/60, i / 60, 1);
        if (state.isGrounded) break;
      }
      
      // Should not emit for small falls
      expect(handler).not.toHaveBeenCalled();
    });
  });

  /**
   * Property Tests for Physics3D
   * **Feature: arena-3d-physics-multiplayer, Property 1: Physics Determinism - identical inputs produce identical outputs**
   * **Validates: Requirements 1.3, 2.1**
   */
  describe('property tests', () => {
    it('Physics Determinism - identical inputs produce identical outputs', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(-10), max: Math.fround(10), noNaN: true }),
          fc.float({ min: Math.fround(0), max: Math.fround(10), noNaN: true }),
          fc.float({ min: Math.fround(-10), max: Math.fround(10), noNaN: true }),
          fc.float({ min: Math.fround(-1), max: Math.fround(1), noNaN: true }),
          fc.float({ min: Math.fround(-1), max: Math.fround(1), noNaN: true }),
          fc.boolean(),
          (x, y, z, forward, right, jump) => {
            const { physics: physics1 } = createTestPhysics();
            const { physics: physics2 } = createTestPhysics();
            
            const state: PlayerPhysicsState = {
              position: new Vector3(x, y, z),
              velocity: Vector3.ZERO,
              isGrounded: y < 0.5,
              lastGroundedTime: 0,
              landingPenaltyEndTime: 0
            };
            
            const input: MovementInput = { forward, right, jump, yaw: 0 };
            const dt = 1/60;
            const time = 0;
            
            const result1 = physics1.step(state, input, dt, time);
            const result2 = physics2.step(state, input, dt, time);
            
            expect(result1.position.equals(result2.position, 0.0001)).toBe(true);
            expect(result1.velocity.equals(result2.velocity, 0.0001)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: arena-3d-physics-multiplayer, Property 2: Gravity Application - airborne velocity.y decreases by gravity*dt**
     * **Validates: Requirements 2.2**
     */
    it('Gravity Application - airborne velocity.y decreases by gravity*dt', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(5), max: Math.fround(50), noNaN: true }),
          fc.float({ min: Math.fround(-10), max: Math.fround(10), noNaN: true }),
          (y, initialVelY) => {
            const { physics } = createTestPhysics();
            const state: PlayerPhysicsState = {
              position: new Vector3(0, y, 0),
              velocity: new Vector3(0, initialVelY, 0),
              isGrounded: false,
              lastGroundedTime: -1,
              landingPenaltyEndTime: 0
            };
            
            const dt = 1/60;
            const newState = physics.step(state, NO_INPUT, dt, 0);
            
            const expectedVelY = initialVelY + DEFAULT_PHYSICS_CONFIG.gravity * dt;
            expect(newState.velocity.y).toBeCloseTo(expectedVelY, 3);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: arena-3d-physics-multiplayer, Property 3: Jump Mechanics - grounded + jump = jumpVelocity**
     * **Validates: Requirements 2.3**
     */
    it('Jump Mechanics - grounded + jump = jumpVelocity', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(-10), max: Math.fround(10), noNaN: true }),
          fc.float({ min: Math.fround(-10), max: Math.fround(10), noNaN: true }),
          (x, z) => {
            const { physics } = createTestPhysics();
            const state = createGroundedState(x, z);
            const input: MovementInput = { ...NO_INPUT, jump: true };
            
            const newState = physics.step(state, input, 1/60, 0);
            
            expect(newState.velocity.y).toBe(DEFAULT_PHYSICS_CONFIG.jumpVelocity);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: arena-3d-physics-multiplayer, Property 4: Movement Acceleration - velocity approaches maxSpeed**
     * **Validates: Requirements 15.1**
     */
    it('Movement Acceleration - velocity magnitude never exceeds maxSpeed (horizontal)', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(-1), max: Math.fround(1), noNaN: true }),
          fc.float({ min: Math.fround(-1), max: Math.fround(1), noNaN: true }),
          fc.float({ min: Math.fround(0), max: Math.fround(6.28), noNaN: true }),
          (forward, right, yaw) => {
            const { physics } = createTestPhysics();
            let state = createGroundedState();
            const input: MovementInput = { forward, right, jump: false, yaw };
            
            // Run many steps
            for (let i = 0; i < 200; i++) {
              state = physics.step(state, input, 1/60, i / 60);
            }
            
            const horizontalSpeed = state.velocity.horizontal().magnitude();
            expect(horizontalSpeed).toBeLessThanOrEqual(DEFAULT_PHYSICS_CONFIG.maxSpeed + 0.1);
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * **Feature: arena-3d-physics-multiplayer, Property 5: Air Control Reduction - airborne accel is 30% of ground**
     * **Validates: Requirements 15.3**
     */
    it('Air Control Reduction - airborne acceleration is reduced', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.5), max: Math.fround(1), noNaN: true }),
          fc.float({ min: Math.fround(0), max: Math.fround(6.28), noNaN: true }),
          (forward, yaw) => {
            const { physics: groundPhysics } = createTestPhysics();
            const { physics: airPhysics } = createTestPhysics();
            
            const groundState = createGroundedState();
            const airState = createAirborneState(10);
            const input: MovementInput = { forward, right: 0, jump: false, yaw };
            
            const groundResult = groundPhysics.step(groundState, input, 1/60, 0);
            const airResult = airPhysics.step(airState, input, 1/60, 0);
            
            const groundAccel = groundResult.velocity.horizontal().magnitude();
            const airAccel = airResult.velocity.horizontal().magnitude();
            
            // Air acceleration should be approximately airControl * ground acceleration
            if (groundAccel > 0.001) {
              const ratio = airAccel / groundAccel;
              expect(ratio).toBeCloseTo(DEFAULT_PHYSICS_CONFIG.airControl, 1);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
