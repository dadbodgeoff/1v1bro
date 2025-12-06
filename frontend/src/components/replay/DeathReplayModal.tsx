/**
 * Death Replay Modal
 * Shows a replay of the last 5 seconds before death
 */

import { useRef, useEffect, useState, useCallback } from 'react'
import { ReplayPlayer, ReplayRenderer } from '../../game/telemetry'
import type { DeathReplay } from '../../game/telemetry'
import { ReplayControls } from './ReplayControls'
import { LatencyGraph } from './LatencyGraph'

interface DeathReplayModalProps {
  replay: DeathReplay
  onClose: () => void
  onReport?: (reason: string) => void
}

export function DeathReplayModal({ replay, onClose, onReport }: DeathReplayModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playerRef = useRef<ReplayPlayer | null>(null)
  const rendererRef = useRef<ReplayRenderer | null>(null)
  const animationRef = useRef<number | null>(null)

  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showHitboxes, setShowHitboxes] = useState(false)
  const [showLatency, setShowLatency] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [currentNetworkStats, setCurrentNetworkStats] = useState(replay.frames[0]?.networkStats)
  const [reportSubmitted, setReportSubmitted] = useState(false)

  // Initialize player and renderer
  useEffect(() => {
    if (!canvasRef.current) return

    const player = new ReplayPlayer()
    const renderer = new ReplayRenderer()

    renderer.setContext(canvasRef.current.getContext('2d')!)
    playerRef.current = player
    rendererRef.current = renderer

    player.setCallbacks({
      onFrameChange: (frame, index, _total) => {
        setCurrentFrame(index)
        setCurrentNetworkStats(frame.networkStats)
        renderer.renderFrame(frame, replay.victimId, replay.killerId)
      },
      onPlaybackEnd: () => {
        setIsPlaying(false)
      },
      onStateChange: (state) => {
        setIsPlaying(state === 'playing')
      },
    })

    player.load(replay)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [replay])

  // Animation loop
  useEffect(() => {
    const loop = () => {
      playerRef.current?.update()
      animationRef.current = requestAnimationFrame(loop)
    }
    animationRef.current = requestAnimationFrame(loop)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Update renderer options
  useEffect(() => {
    rendererRef.current?.setOptions({ showHitboxes, showLatencyOverlay: showLatency })
    // Re-render current frame with new options
    const frame = playerRef.current?.getCurrentFrame()
    if (frame) {
      rendererRef.current?.renderFrame(frame, replay.victimId, replay.killerId)
    }
  }, [showHitboxes, showLatency, replay])

  const handlePlayPause = useCallback(() => {
    playerRef.current?.togglePlayPause()
  }, [])

  const handleSeek = useCallback((index: number) => {
    playerRef.current?.seekToFrame(index)
  }, [])

  const handleSpeedChange = useCallback((speed: number) => {
    playerRef.current?.setSpeed(speed)
  }, [])

  const handleStepForward = useCallback(() => {
    playerRef.current?.stepForward()
  }, [])

  const handleStepBackward = useCallback(() => {
    playerRef.current?.stepBackward()
  }, [])

  const handleReport = () => {
    if (onReport && reportReason.trim()) {
      onReport(reportReason.trim())
      setShowReportForm(false)
      setReportReason('')
      setReportSubmitted(true)
      // Auto-hide toast after 3 seconds
      setTimeout(() => setReportSubmitted(false), 3000)
    }
  }

  const timeFromDeath = playerRef.current?.getTimeFromDeath() ?? 0

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Death Replay</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Canvas */}
        <div className="p-4">
          <canvas
            ref={canvasRef}
            width={800}
            height={450}
            className="w-full bg-black rounded border border-gray-700"
          />
        </div>

        {/* Timeline */}
        <div className="px-4 pb-2">
          <input
            type="range"
            min={0}
            max={replay.frames.length - 1}
            value={currentFrame}
            onChange={(e) => handleSeek(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>-5.0s</span>
            <span className="font-mono">{timeFromDeath.toFixed(2)}s</span>
            <span>Death</span>
          </div>
        </div>

        {/* Controls */}
        <div className="px-4 pb-4">
          <ReplayControls
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onStepForward={handleStepForward}
            onStepBackward={handleStepBackward}
            onSpeedChange={handleSpeedChange}
            currentSpeed={playerRef.current?.getSpeed() ?? 1}
          />
        </div>

        {/* Options */}
        <div className="px-4 pb-4 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showHitboxes}
              onChange={(e) => setShowHitboxes(e.target.checked)}
              className="rounded bg-gray-700 border-gray-600"
            />
            Show Hitboxes
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showLatency}
              onChange={(e) => setShowLatency(e.target.checked)}
              className="rounded bg-gray-700 border-gray-600"
            />
            Show Latency
          </label>

          {onReport && (
            <button
              onClick={() => setShowReportForm(true)}
              className="ml-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              🚩 Report This Death
            </button>
          )}
        </div>

        {/* Latency Graph */}
        {showLatency && currentNetworkStats && (
          <div className="px-4 pb-4">
            <LatencyGraph
              frames={replay.frames}
              currentFrameIndex={currentFrame}
            />
          </div>
        )}

        {/* Report Confirmation Toast */}
        {reportSubmitted && (
          <div className="mx-4 mb-4 p-3 bg-green-600/90 rounded flex items-center gap-2">
            <span className="text-lg">✓</span>
            <span className="text-white text-sm">Report submitted. Thanks for helping improve the game!</span>
          </div>
        )}

        {/* Report Form */}
        {showReportForm && (
          <div className="mx-4 mb-4 p-4 bg-gray-800 rounded">
            <p className="text-sm text-gray-300 mb-2">
              What felt wrong about this death?
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="e.g., 'I was behind cover but still got hit'"
              className="w-full p-2 bg-gray-700 rounded text-white text-sm resize-none"
              rows={2}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleReport}
                disabled={!reportReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Report
              </button>
              <button
                onClick={() => setShowReportForm(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
