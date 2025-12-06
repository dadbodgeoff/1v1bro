/**
 * Animation configuration constants for landing page
 */

export const ANIMATION_CONFIG = {
  // Hero section
  hero: {
    logoRevealDuration: 1500,      // ms
    taglineFadeDelay: 500,         // ms after logo
    ctaPulseFrequency: 2000,       // ms per cycle
    particleBurstCount: 10,
    parallaxFactor: 0.3,
  },
  
  // Scroll animations
  scroll: {
    triggerThreshold: 0.2,         // 20% visible to trigger
    staggerDelay: 100,             // ms between staggered items
    revealDuration: 600,           // ms
    resetOnExit: true,
  },
  
  // Feature cards
  features: {
    slideDistance: 100,            // px
    iconDrawDuration: 800,         // ms
    titleFadeDelay: 300,           // ms
    descriptionFadeDelay: 500,     // ms
    animationCycleTime: 3000,      // ms
  },
  
  // Stats counters
  stats: {
    countDuration: 2000,           // ms
    easing: 'easeOutExpo',
    updateInterval: 30000,         // 30 second refresh
  },
  
  // Tech section
  tech: {
    packetFlowSpeed: 100,          // px/s
    nodePulseDuration: 400,        // ms
    cycleTime: 4000,               // ms
  },
  
  // Reduced motion alternatives
  reducedMotion: {
    instantReveal: true,
    staticBackgrounds: true,
    noParticles: true,
    singleAnimationCycle: true,
  },
} as const

export type AnimationConfigType = typeof ANIMATION_CONFIG
