/**
 * AmbientParticles - Canvas-based particle rendering for seasonal effects.
 * Requirements: 4.1, 4.4
 * 
 * Renders snow, leaves, petals, confetti, and sparkles with performance awareness.
 * Supports static mode for reduced_motion accessibility.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  AmbientEffectRenderer,
  getAmbientEffectRenderer,
  type AmbientTheme,
  type ParticleConfig,
  type RenderMode,
} from '@/systems/polish/AmbientEffectRenderer';
import { usePolishStore } from '@/stores/polishStore';

// ============================================
// Types
// ============================================

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  drift: number;
}

interface AmbientParticlesProps {
  renderer?: AmbientEffectRenderer;
  theme?: AmbientTheme;
}

// ============================================
// Static Decorations Component
// ============================================

function StaticDecorations({ theme }: { theme: AmbientTheme }) {
  if (theme === 'none') return null;
  
  const decorations: Record<AmbientTheme, { emoji: string; positions: string[] }> = {
    winter: {
      emoji: '❄️',
      positions: ['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'],
    },
    autumn: {
      emoji: '🍂',
      positions: ['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'],
    },
    spring: {
      emoji: '🌸',
      positions: ['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'],
    },
    summer: {
      emoji: '✨',
      positions: ['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'],
    },
    celebration: {
      emoji: '🎉',
      positions: ['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'],
    },
    none: { emoji: '', positions: [] },
  };
  
  const { emoji, positions } = decorations[theme];
  
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {positions.map((pos, i) => (
        <div key={i} className={`absolute ${pos} text-2xl opacity-30`}>
          {emoji}
        </div>
      ))}
    </div>
  );
}


// ============================================
// Particle Canvas Component
// ============================================

function ParticleCanvas({ config }: { config: ParticleConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  
  // Initialize particles
  const initParticles = useCallback(() => {
    const particles: Particle[] = [];
    
    for (let i = 0; i < config.count; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: config.size[0] + Math.random() * (config.size[1] - config.size[0]),
        speed: config.speed * (0.5 + Math.random() * 0.5),
        opacity: config.opacity[0] + Math.random() * (config.opacity[1] - config.opacity[0]),
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: config.rotation ? (Math.random() - 0.5) * 2 : 0,
        drift: (config.drift ?? 0) * (Math.random() - 0.5),
      });
    }
    
    particlesRef.current = particles;
  }, [config]);
  
  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    for (const particle of particlesRef.current) {
      // Update position
      particle.y += particle.speed;
      particle.x += particle.drift;
      particle.rotation += particle.rotationSpeed;
      
      // Wrap around
      if (particle.y > canvas.height + particle.size) {
        particle.y = -particle.size;
        particle.x = Math.random() * canvas.width;
      }
      if (particle.x < -particle.size) {
        particle.x = canvas.width + particle.size;
      }
      if (particle.x > canvas.width + particle.size) {
        particle.x = -particle.size;
      }
      
      // Draw particle
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate((particle.rotation * Math.PI) / 180);
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;
      
      // Draw shape based on particle type
      if (config.type === 'snow' || config.type === 'sparkles') {
        ctx.beginPath();
        ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Leaf/petal/confetti shape
        ctx.beginPath();
        ctx.ellipse(0, 0, particle.size / 2, particle.size / 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [config.type]);
  
  // Setup canvas and start animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resize();
    window.addEventListener('resize', resize);
    
    // Initialize particles
    initParticles();
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [initParticles, animate]);
  
  // Pause when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationRef.current);
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [animate]);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  );
}


// ============================================
// Main Component
// ============================================

export function AmbientParticles({ renderer, theme: propTheme }: AmbientParticlesProps) {
  const ambientRenderer = renderer ?? getAmbientEffectRenderer();
  const location = useLocation();
  const { settings, performanceScore } = usePolishStore();
  
  const [theme, setTheme] = useState<AmbientTheme>(propTheme ?? ambientRenderer.theme);
  const [config, setConfig] = useState<ParticleConfig | null>(null);
  const [renderMode, setRenderMode] = useState<RenderMode>('disabled');
  
  // Sync with renderer
  useEffect(() => {
    // Update renderer settings from store
    ambientRenderer.setEnabled(settings.ambientEffects);
    ambientRenderer.setReducedMotion(!settings.celebrationAnimations);
    ambientRenderer.setPerformanceScore(performanceScore);
    ambientRenderer.setCurrentPath(location.pathname);
    
    // Set seasonal theme if not provided
    if (!propTheme) {
      ambientRenderer.setSeasonalTheme();
    } else {
      ambientRenderer.setTheme(propTheme);
    }
    
    // Subscribe to changes
    const unsubTheme = ambientRenderer.onThemeChange(setTheme);
    const unsubConfig = ambientRenderer.onConfigChange(setConfig);
    
    // Initial state
    setTheme(ambientRenderer.theme);
    setConfig(ambientRenderer.getParticleConfig());
    setRenderMode(ambientRenderer.renderMode);
    
    return () => {
      unsubTheme();
      unsubConfig();
    };
  }, [ambientRenderer, propTheme, settings, performanceScore, location.pathname]);
  
  // Update render mode when settings change
  useEffect(() => {
    setRenderMode(ambientRenderer.renderMode);
  }, [ambientRenderer, settings.ambientEffects, settings.celebrationAnimations, performanceScore]);
  
  // Don't render if disabled or no theme
  if (renderMode === 'disabled' || theme === 'none' || !ambientRenderer.isActive) {
    return null;
  }
  
  // Static mode for reduced motion
  if (renderMode === 'static') {
    return <StaticDecorations theme={theme} />;
  }
  
  // Animated mode
  if (config && config.count > 0) {
    return <ParticleCanvas config={config} />;
  }
  
  return null;
}

export default AmbientParticles;
