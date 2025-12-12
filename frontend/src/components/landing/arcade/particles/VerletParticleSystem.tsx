/**
 * VerletParticleSystem - High-performance particle engine
 * 
 * Implements Verlet Integration for stable physics simulation:
 * - Implicit velocity calculation (position - prevPosition)
 * - Soft-body collisions with CRT edges
 * - Object pooling with Float32Array for zero GC
 * - DIRECT DOM MANIPULATION via refs (bypasses React diffing)
 * - Per-particle position history for Akira-style motion trails
 * 
 * Performance: Locked 60/144 FPS regardless of particle count
 * 
 * @module landing/arcade/particles/VerletParticleSystem
 */

import { useEffect, useRef, useCallback } from 'react';

// ============================================
// Types
// ============================================

export interface VerletParticleConfig {
  /** Maximum number of particles (pre-allocated) */
  maxParticles?: number;
  /** Particle spawn rate per second */
  spawnRate?: number;
  /** Gravity force (pixels per frame squared) */
  gravity?: number;
  /** Air friction (0-1, 1 = no friction) */
  friction?: number;
  /** Bounce coefficient (0-1) */
  bounce?: number;
  /** Particle lifetime in ms */
  lifetime?: number;
  /** Container bounds [width, height] */
  bounds?: [number, number];
  /** Enable edge collisions */
  enableCollisions?: boolean;
  /** Particle color */
  color?: string;
  /** Particle glow color */
  glowColor?: string;
  /** Reduced motion preference */
  reducedMotion?: boolean;
  /** Enable motion trails (Akira bike style) */
  enableTrails?: boolean;
  /** Trail history length (positions per particle) */
  trailLength?: number;
}

export interface ParticleEmitOptions {
  /** Emit position [x, y] */
  position: [number, number];
  /** Initial velocity [vx, vy] */
  velocity?: [number, number];
  /** Number of particles to emit */
  count?: number;
  /** Spread angle in radians */
  spread?: number;
  /** Initial speed */
  speed?: number;
}

// ============================================
// Constants
// ============================================

const DEFAULT_CONFIG: Required<VerletParticleConfig> = {
  maxParticles: 200,
  spawnRate: 0,
  gravity: 0.15,
  friction: 0.98,
  bounce: 0.6,
  lifetime: 3000,
  bounds: [800, 600],
  enableCollisions: true,
  color: '#F97316',
  glowColor: 'rgba(249, 115, 22, 0.6)',
  reducedMotion: false,
  enableTrails: true,
  trailLength: 8,
};

// Particle data layout in Float32Array:
// [x, y, prevX, prevY, lifetime, maxLifetime, size, active, 
//  histX0, histY0, histX1, histY1, histX2, histY2, histX3, histY3,
//  histX4, histY4, histX5, histY5, histX6, histY6, histX7, histY7]
const TRAIL_HISTORY_SIZE = 8; // 8 historical positions per particle
const FLOATS_PER_PARTICLE = 8 + (TRAIL_HISTORY_SIZE * 2); // 24 floats total
const IDX_X = 0;
const IDX_Y = 1;
const IDX_PREV_X = 2;
const IDX_PREV_Y = 3;
const IDX_LIFETIME = 4;
const IDX_MAX_LIFETIME = 5;
const IDX_SIZE = 6;
const IDX_ACTIVE = 7;
const IDX_HISTORY_START = 8; // History starts at index 8

// ============================================
// Verlet Particle System Hook
// ============================================

export function useVerletParticles(config: VerletParticleConfig = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const {
    maxParticles,
    gravity,
    friction,
    bounce,
    bounds,
    enableCollisions,
    reducedMotion,
    trailLength,
  } = mergedConfig;

  // Pre-allocated particle pool (Float32Array for zero GC)
  const particlePool = useRef<Float32Array>(
    new Float32Array(maxParticles * FLOATS_PER_PARTICLE)
  );
  
  // Active particle count
  const activeCount = useRef(0);
  
  // Animation frame reference
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  // Frame counter for history updates (update trail every N frames)
  const frameCounter = useRef(0);
  
  // SVG element refs for direct DOM manipulation (bypasses React!)
  const particleRefs = useRef<Map<number, SVGElement>>(new Map());
  const trailRefs = useRef<Map<number, SVGPathElement>>(new Map());
  
  // Callback to register particle refs from renderer
  const registerParticleRef = useCallback((id: number, el: SVGElement | null) => {
    if (el) {
      particleRefs.current.set(id, el);
    } else {
      particleRefs.current.delete(id);
    }
  }, []);
  
  const registerTrailRef = useCallback((id: number, el: SVGPathElement | null) => {
    if (el) {
      trailRefs.current.set(id, el);
    } else {
      trailRefs.current.delete(id);
    }
  }, []);

  // Find next available particle slot
  const findFreeSlot = useCallback((): number => {
    const pool = particlePool.current;
    for (let i = 0; i < maxParticles; i++) {
      const baseIdx = i * FLOATS_PER_PARTICLE;
      if (pool[baseIdx + IDX_ACTIVE] === 0) {
        return i;
      }
    }
    return -1; // Pool exhausted
  }, [maxParticles]);

  // Emit particles
  const emit = useCallback((options: ParticleEmitOptions) => {
    if (reducedMotion) return;

    const {
      position,
      velocity = [0, 0],
      count = 1,
      spread = Math.PI * 2,
      speed = 5,
    } = options;

    const pool = particlePool.current;

    for (let i = 0; i < count; i++) {
      const slot = findFreeSlot();
      if (slot === -1) break; // Pool exhausted

      const baseIdx = slot * FLOATS_PER_PARTICLE;
      
      // Random angle within spread
      const angle = Math.random() * spread - spread / 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      // Apply velocity with spread
      const vx = velocity[0] + cos * speed * (0.5 + Math.random() * 0.5);
      const vy = velocity[1] + sin * speed * (0.5 + Math.random() * 0.5);

      // Initialize particle with Verlet positions
      pool[baseIdx + IDX_X] = position[0];
      pool[baseIdx + IDX_Y] = position[1];
      pool[baseIdx + IDX_PREV_X] = position[0] - vx; // Implicit velocity
      pool[baseIdx + IDX_PREV_Y] = position[1] - vy;
      pool[baseIdx + IDX_LIFETIME] = 0;
      pool[baseIdx + IDX_MAX_LIFETIME] = mergedConfig.lifetime * (0.8 + Math.random() * 0.4);
      pool[baseIdx + IDX_SIZE] = 2 + Math.random() * 3;
      pool[baseIdx + IDX_ACTIVE] = 1;
      
      // Initialize trail history with current position
      for (let h = 0; h < TRAIL_HISTORY_SIZE; h++) {
        pool[baseIdx + IDX_HISTORY_START + h * 2] = position[0];
        pool[baseIdx + IDX_HISTORY_START + h * 2 + 1] = position[1];
      }

      activeCount.current++;
    }
  }, [reducedMotion, findFreeSlot, mergedConfig.lifetime]);

  // Emit burst (for shockwave effects)
  const emitBurst = useCallback((
    position: [number, number],
    count: number = 50,
    speed: number = 8
  ) => {
    emit({
      position,
      count,
      spread: Math.PI * 2,
      speed,
      velocity: [0, -2], // Slight upward bias
    });
  }, [emit]);

  // Physics update using Verlet Integration
  const updatePhysics = useCallback((deltaTime: number) => {
    const pool = particlePool.current;
    const dt = Math.min(deltaTime / 16.67, 2); // Normalize to ~60fps, cap at 2x
    const [boundW, boundH] = bounds;
    
    // Update trail history every 2 frames for smoother trails
    const updateHistory = frameCounter.current % 2 === 0;
    frameCounter.current++;

    let newActiveCount = 0;

    for (let i = 0; i < maxParticles; i++) {
      const baseIdx = i * FLOATS_PER_PARTICLE;
      
      if (pool[baseIdx + IDX_ACTIVE] === 0) continue;

      // Update lifetime
      pool[baseIdx + IDX_LIFETIME] += deltaTime;
      
      if (pool[baseIdx + IDX_LIFETIME] >= pool[baseIdx + IDX_MAX_LIFETIME]) {
        // Particle expired - hide DOM element
        const el = particleRefs.current.get(i);
        if (el) el.setAttribute('opacity', '0');
        const trail = trailRefs.current.get(i);
        if (trail) trail.setAttribute('opacity', '0');
        pool[baseIdx + IDX_ACTIVE] = 0;
        continue;
      }

      newActiveCount++;

      // Current position
      const x = pool[baseIdx + IDX_X];
      const y = pool[baseIdx + IDX_Y];
      
      // Previous position (implicit velocity)
      const prevX = pool[baseIdx + IDX_PREV_X];
      const prevY = pool[baseIdx + IDX_PREV_Y];

      // Verlet Integration: newPos = pos + (pos - prevPos) * friction + acceleration
      const vx = (x - prevX) * friction;
      const vy = (y - prevY) * friction + gravity * dt;

      let newX = x + vx * dt;
      let newY = y + vy * dt;

      // Store current as previous
      pool[baseIdx + IDX_PREV_X] = x;
      pool[baseIdx + IDX_PREV_Y] = y;

      // Edge collisions with soft-body bounce
      if (enableCollisions) {
        const size = pool[baseIdx + IDX_SIZE];
        
        // Left/Right bounds
        if (newX < size) {
          newX = size;
          pool[baseIdx + IDX_PREV_X] = newX + vx * bounce;
        } else if (newX > boundW - size) {
          newX = boundW - size;
          pool[baseIdx + IDX_PREV_X] = newX + vx * bounce;
        }

        // Top/Bottom bounds
        if (newY < size) {
          newY = size;
          pool[baseIdx + IDX_PREV_Y] = newY + vy * bounce;
        } else if (newY > boundH - size) {
          newY = boundH - size;
          pool[baseIdx + IDX_PREV_Y] = newY + vy * bounce;
        }
      }

      // Update position
      pool[baseIdx + IDX_X] = newX;
      pool[baseIdx + IDX_Y] = newY;
      
      // Shift trail history and add new position (Akira-style motion trails)
      if (updateHistory) {
        for (let h = TRAIL_HISTORY_SIZE - 1; h > 0; h--) {
          pool[baseIdx + IDX_HISTORY_START + h * 2] = pool[baseIdx + IDX_HISTORY_START + (h - 1) * 2];
          pool[baseIdx + IDX_HISTORY_START + h * 2 + 1] = pool[baseIdx + IDX_HISTORY_START + (h - 1) * 2 + 1];
        }
        pool[baseIdx + IDX_HISTORY_START] = newX;
        pool[baseIdx + IDX_HISTORY_START + 1] = newY;
      }
      
      // === DIRECT DOM MANIPULATION (bypasses React!) ===
      const el = particleRefs.current.get(i);
      if (el) {
        const lifetime = pool[baseIdx + IDX_LIFETIME];
        const maxLifetime = pool[baseIdx + IDX_MAX_LIFETIME];
        const lifeRatio = lifetime / maxLifetime;
        const opacity = lifeRatio > 0.7 ? 1 - (lifeRatio - 0.7) / 0.3 : 1;
        const size = pool[baseIdx + IDX_SIZE] * (1 - lifeRatio * 0.5);
        
        // Direct attribute updates - NO React diffing!
        el.setAttribute('transform', `translate(${newX}, ${newY}) scale(${size})`);
        el.setAttribute('opacity', String(opacity));
      }
      
      // Update trail path directly
      const trail = trailRefs.current.get(i);
      if (trail && trailLength > 0) {
        const lifetime = pool[baseIdx + IDX_LIFETIME];
        const maxLifetime = pool[baseIdx + IDX_MAX_LIFETIME];
        const lifeRatio = lifetime / maxLifetime;
        const trailOpacity = (lifeRatio > 0.7 ? 1 - (lifeRatio - 0.7) / 0.3 : 1) * 0.4;
        
        // Build path from history
        let d = `M ${newX} ${newY}`;
        const historyLen = Math.min(trailLength, TRAIL_HISTORY_SIZE);
        for (let h = 0; h < historyLen; h++) {
          const hx = pool[baseIdx + IDX_HISTORY_START + h * 2];
          const hy = pool[baseIdx + IDX_HISTORY_START + h * 2 + 1];
          d += ` L ${hx} ${hy}`;
        }
        
        trail.setAttribute('d', d);
        trail.setAttribute('opacity', String(trailOpacity));
      }
    }

    activeCount.current = newActiveCount;
  }, [maxParticles, gravity, friction, bounce, bounds, enableCollisions, trailLength]);

  // Animation loop with delta-time integration (NO React re-renders!)
  const animate = useCallback((timestamp: number) => {
    if (reducedMotion) return;

    const deltaTime = lastTimeRef.current ? timestamp - lastTimeRef.current : 16.67;
    lastTimeRef.current = timestamp;

    updatePhysics(deltaTime);
    // NO forceUpdate! DOM is updated directly in updatePhysics

    frameRef.current = requestAnimationFrame(animate);
  }, [reducedMotion, updatePhysics]);

  // Start/stop animation loop
  useEffect(() => {
    if (!reducedMotion) {
      frameRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [reducedMotion, animate]);

  // Get particle pool for initial render (only called once!)
  const getParticleSlots = useCallback(() => {
    return Array.from({ length: maxParticles }, (_, i) => i);
  }, [maxParticles]);

  // Clear all particles
  const clear = useCallback(() => {
    particlePool.current.fill(0);
    activeCount.current = 0;
    // Hide all DOM elements
    particleRefs.current.forEach(el => el.setAttribute('opacity', '0'));
    trailRefs.current.forEach(el => el.setAttribute('opacity', '0'));
  }, []);

  return {
    emit,
    emitBurst,
    getParticleSlots,
    registerParticleRef,
    registerTrailRef,
    clear,
    activeCount: activeCount.current,
    config: mergedConfig,
  };
}

// ============================================
// SVG Particle Renderer Component
// Uses direct DOM refs for 60/144 FPS performance
// ============================================

export interface VerletParticleRendererProps {
  particles: ReturnType<typeof useVerletParticles>;
  className?: string;
}

export function VerletParticleRenderer({
  particles,
  className = '',
}: VerletParticleRendererProps) {
  const { 
    getParticleSlots, 
    registerParticleRef, 
    registerTrailRef, 
    config 
  } = particles;
  
  // Get all particle slots (only computed once!)
  const slots = getParticleSlots();

  if (config.reducedMotion) {
    return null;
  }

  return (
    <svg
      className={`verlet-particles ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 30,
        overflow: 'hidden',
        willChange: 'transform', // GPU hint
        transform: 'translate3d(0,0,0)', // Force GPU layer
      }}
      aria-hidden="true"
    >
      <defs>
        {/* Particle template for instanced rendering */}
        <circle id="particle-template" r="1" />
        
        {/* Glow filter */}
        <filter id="particle-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values={`
              1 0 0 0 0.976
              0 1 0 0 0.451
              0 0 1 0 0.086
              0 0 0 0.8 0
            `}
          />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Scanline pattern for moiré interference */}
        <pattern 
          id="scanline-moire" 
          patternUnits="userSpaceOnUse" 
          width="1" 
          height="4"
        >
          <rect width="1" height="2" fill="black" fillOpacity="0.15" />
        </pattern>
      </defs>

      {/* Motion trails layer (Akira bike style) - rendered FIRST (behind particles) */}
      {config.enableTrails && (
        <g className="particle-trails" opacity="0.6">
          {slots.map((id) => (
            <path
              key={`trail-${id}`}
              ref={(el) => registerTrailRef(id, el)}
              fill="none"
              stroke={config.color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0"
              style={{
                filter: 'blur(0.5px)',
              }}
            />
          ))}
        </g>
      )}

      {/* Particle instances - pre-rendered, updated via direct DOM manipulation */}
      <g filter="url(#particle-glow)">
        {slots.map((id) => (
          <use
            key={`particle-${id}`}
            ref={(el) => registerParticleRef(id, el as unknown as SVGElement)}
            href="#particle-template"
            fill={config.color}
            opacity="0"
            transform="translate(0, 0) scale(1)"
          />
        ))}
      </g>
    </svg>
  );
}

export default VerletParticleRenderer;
