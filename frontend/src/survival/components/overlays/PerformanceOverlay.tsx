/**
 * PerformanceOverlay - FPS, frame time, and memory stats display
 * Minimal on mobile, detailed on desktop
 */

import React, { memo } from 'react'
import type { PerformanceMetrics } from '@/survival/engine/PerformanceMonitor'
import type { MemoryStats } from '@/survival/debug/MemoryMonitor'

interface PerformanceOverlayProps {
  metrics: PerformanceMetrics
  memoryStats: MemoryStats | null
  isMobile: boolean
}

export const PerformanceOverlay = memo(({ 
  metrics, 
  memoryStats,
  isMobile 
}: PerformanceOverlayProps) => {
  const fpsColor = metrics.fps >= 55 ? '#22c55e' : metrics.fps >= 30 ? '#eab308' : '#ef4444'
  const memoryColor = memoryStats 
    ? (memoryStats.budgetUsedPercent >= 90 ? '#ef4444' : memoryStats.budgetUsedPercent >= 70 ? '#eab308' : '#22c55e')
    : '#6b7280'
  
  // Mobile: minimal text on left side
  if (isMobile) {
    return (
      <div className="absolute bottom-3 left-3 z-10">
        <div className="text-[10px] font-mono opacity-60 space-y-0.5">
          <div style={{ color: fpsColor }}>{metrics.fps} fps</div>
          <div className="text-gray-500">{metrics.avgFrameTime.toFixed(1)}ms</div>
          {memoryStats && (
            <div style={{ color: memoryColor }}>
              {memoryStats.totalEstimatedMB.toFixed(0)}MB
            </div>
          )}
        </div>
      </div>
    )
  }
  
  // Desktop: detailed stats
  return (
    <div className="absolute bottom-4 left-4 z-10">
      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
        <div className="text-xs font-mono space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">FPS:</span>
            <span style={{ color: fpsColor }} className="font-bold">{metrics.fps}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Frame:</span>
            <span className="text-gray-300">{metrics.avgFrameTime.toFixed(1)}ms</span>
          </div>
          {memoryStats && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Memory:</span>
                <span style={{ color: memoryColor }}>
                  {memoryStats.totalEstimatedMB.toFixed(0)}MB / {memoryStats.budgetMB}MB
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Textures:</span>
                <span className="text-gray-300">{memoryStats.textureCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Geometries:</span>
                <span className="text-gray-300">{memoryStats.geometryCount}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
})
PerformanceOverlay.displayName = 'PerformanceOverlay'
