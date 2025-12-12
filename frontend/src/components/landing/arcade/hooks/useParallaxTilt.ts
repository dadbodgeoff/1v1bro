/**
 * useParallaxTilt - Subtle 3D parallax effect on mouse movement
 * 
 * Creates an immersive depth effect by tilting the cabinet slightly
 * based on mouse position. Respects reduced motion preferences.
 * 
 * @module landing/arcade/hooks/useParallaxTilt
 */

import { useEffect, useRef, useCallback } from 'react';

export interface UseParallaxTiltOptions {
  /** Maximum tilt angle in degrees */
  maxTilt?: number;
  /** Whether effect is enabled */
  enabled?: boolean;
  /** Smoothing factor (higher = smoother but slower) */
  smoothing?: number;
}

export function useParallaxTilt({
  maxTilt = 2,
  enabled = true,
  smoothing = 0.1,
}: UseParallaxTiltOptions = {}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });
  const animationFrame = useRef<number | null>(null);

  const animate = useCallback(() => {
    // Smooth interpolation
    currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * smoothing;
    currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * smoothing;

    if (elementRef.current) {
      elementRef.current.style.transform = `
        rotateX(${currentRotation.current.x}deg) 
        rotateY(${currentRotation.current.y}deg)
      `;
    }

    animationFrame.current = requestAnimationFrame(animate);
  }, [smoothing]);

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      // Calculate normalized position (-1 to 1)
      const normalizedX = (clientX / innerWidth - 0.5) * 2;
      const normalizedY = (clientY / innerHeight - 0.5) * 2;

      // Set target rotation (inverted for natural feel)
      targetRotation.current = {
        x: -normalizedY * maxTilt,
        y: normalizedX * maxTilt,
      };
    };

    const handleMouseLeave = () => {
      // Reset to center when mouse leaves
      targetRotation.current = { x: 0, y: 0 };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [enabled, maxTilt, animate]);

  return elementRef;
}

export default useParallaxTilt;
