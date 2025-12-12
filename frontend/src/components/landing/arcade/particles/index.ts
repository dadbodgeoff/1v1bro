/**
 * Particle System Exports
 * 
 * High-performance Verlet Integration particle engine:
 * - Direct DOM manipulation (bypasses React diffing)
 * - Object pooling with Float32Array (zero GC)
 * - Per-particle position history for Akira-style motion trails
 * - Locked 60/144 FPS regardless of particle count
 * 
 * @module landing/arcade/particles
 */

export {
  useVerletParticles,
  VerletParticleRenderer,
  type VerletParticleConfig,
  type ParticleEmitOptions,
  type VerletParticleRendererProps,
} from './VerletParticleSystem';
