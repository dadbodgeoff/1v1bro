/**
 * Performance scoring utility for device capability detection.
 * Requirements: 7.5, 9.1, 9.2
 * 
 * Calculates a performance score (0-100) based on device capabilities
 * to help optimize polish effects for lower-end devices.
 */

// ============================================
// Types
// ============================================

export interface PerformanceMetrics {
  deviceMemory: number | null;
  hardwareConcurrency: number | null;
  connectionType: string | null;
  frameTimingAvg: number | null;
  gpuTier: 'low' | 'medium' | 'high' | 'unknown';
}

export interface PerformanceResult {
  score: number;
  metrics: PerformanceMetrics;
  isLowEnd: boolean;
  recommendations: string[];
}

// ============================================
// Constants
// ============================================

// Score thresholds
export const LOW_END_THRESHOLD = 30;
export const MEDIUM_THRESHOLD = 60;

// Storage key for dismissing the prompt
export const PERFORMANCE_PROMPT_DISMISSED_KEY = 'performance-prompt-dismissed';

// ============================================
// GPU Tier Detection
// ============================================

function detectGPUTier(): 'low' | 'medium' | 'high' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl || !(gl instanceof WebGLRenderingContext)) {
      return 'low';
    }
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) {
      return 'unknown';
    }
    
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
    
    // High-end GPU indicators
    const highEndIndicators = [
      'nvidia geforce rtx',
      'nvidia geforce gtx 10',
      'nvidia geforce gtx 16',
      'nvidia geforce gtx 20',
      'nvidia geforce gtx 30',
      'nvidia geforce gtx 40',
      'amd radeon rx 5',
      'amd radeon rx 6',
      'amd radeon rx 7',
      'apple m1',
      'apple m2',
      'apple m3',
      'apple gpu',
    ];
    
    // Low-end GPU indicators
    const lowEndIndicators = [
      'intel hd graphics',
      'intel uhd graphics',
      'intel iris',
      'mali',
      'adreno 5',
      'adreno 4',
      'powervr',
      'swiftshader',
      'llvmpipe',
      'software',
    ];
    
    for (const indicator of highEndIndicators) {
      if (renderer.includes(indicator)) {
        return 'high';
      }
    }
    
    for (const indicator of lowEndIndicators) {
      if (renderer.includes(indicator)) {
        return 'low';
      }
    }
    
    return 'medium';
  } catch {
    return 'unknown';
  }
}

// ============================================
// Frame Timing Measurement
// ============================================

export function measureFrameTiming(durationMs: number = 1000): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.requestAnimationFrame) {
      resolve(16.67); // Default to 60fps
      return;
    }
    
    const frameTimes: number[] = [];
    let lastTime = performance.now();
    const startTime = lastTime;
    
    function measure(currentTime: number) {
      const delta = currentTime - lastTime;
      frameTimes.push(delta);
      lastTime = currentTime;
      
      if (currentTime - startTime < durationMs) {
        requestAnimationFrame(measure);
      } else {
        // Calculate average frame time
        const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        resolve(avg);
      }
    }
    
    requestAnimationFrame(measure);
  });
}

// ============================================
// Performance Score Calculation
// ============================================

export async function calculatePerformanceScore(): Promise<PerformanceResult> {
  const metrics: PerformanceMetrics = {
    deviceMemory: null,
    hardwareConcurrency: null,
    connectionType: null,
    frameTimingAvg: null,
    gpuTier: 'unknown',
  };
  
  let score = 50; // Start with a neutral score
  const recommendations: string[] = [];
  
  // Device memory (navigator.deviceMemory)
  if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
    metrics.deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null;
    if (metrics.deviceMemory !== null) {
      if (metrics.deviceMemory >= 8) {
        score += 15;
      } else if (metrics.deviceMemory >= 4) {
        score += 10;
      } else if (metrics.deviceMemory >= 2) {
        score += 5;
      } else {
        score -= 10;
        recommendations.push('Limited device memory detected');
      }
    }
  }
  
  // Hardware concurrency (CPU cores)
  if (typeof navigator !== 'undefined' && 'hardwareConcurrency' in navigator) {
    metrics.hardwareConcurrency = navigator.hardwareConcurrency ?? null;
    if (metrics.hardwareConcurrency !== null) {
      if (metrics.hardwareConcurrency >= 8) {
        score += 15;
      } else if (metrics.hardwareConcurrency >= 4) {
        score += 10;
      } else if (metrics.hardwareConcurrency >= 2) {
        score += 5;
      } else {
        score -= 10;
        recommendations.push('Limited CPU cores detected');
      }
    }
  }
  
  // Connection type
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
    metrics.connectionType = connection?.effectiveType ?? null;
    if (metrics.connectionType === 'slow-2g' || metrics.connectionType === '2g') {
      score -= 5;
      recommendations.push('Slow network connection detected');
    }
  }
  
  // GPU tier
  metrics.gpuTier = detectGPUTier();
  switch (metrics.gpuTier) {
    case 'high':
      score += 20;
      break;
    case 'medium':
      score += 10;
      break;
    case 'low':
      score -= 10;
      recommendations.push('Integrated or low-end GPU detected');
      break;
    default:
      // Unknown, no adjustment
      break;
  }
  
  // Frame timing (quick measurement)
  try {
    metrics.frameTimingAvg = await measureFrameTiming(500);
    if (metrics.frameTimingAvg <= 16.67) {
      score += 10; // 60fps capable
    } else if (metrics.frameTimingAvg <= 33.33) {
      score += 5; // 30fps capable
    } else {
      score -= 10;
      recommendations.push('Low frame rate detected');
    }
  } catch {
    // Ignore frame timing errors
  }
  
  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));
  
  const isLowEnd = score < LOW_END_THRESHOLD;
  
  if (isLowEnd && recommendations.length === 0) {
    recommendations.push('Consider disabling visual effects for better performance');
  }
  
  return {
    score,
    metrics,
    isLowEnd,
    recommendations,
  };
}

// ============================================
// Prompt Management
// ============================================

export function hasPromptBeenDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(PERFORMANCE_PROMPT_DISMISSED_KEY) === 'true';
}

export function dismissPrompt(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PERFORMANCE_PROMPT_DISMISSED_KEY, 'true');
}

export function resetPromptDismissal(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PERFORMANCE_PROMPT_DISMISSED_KEY);
}
