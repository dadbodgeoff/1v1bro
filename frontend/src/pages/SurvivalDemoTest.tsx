/**
 * SurvivalDemoTest - Standalone test page for the survival demo component
 * 
 * Tests the lightweight canvas-based survival demo that's used on the landing page.
 * This is separate from the full SurvivalTest which uses Three.js.
 */

import { SurvivalDemo } from '@/components/landing/enterprise/survival-demo'

export default function SurvivalDemoTest() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-orange-500 mb-2">Survival Demo Test</h1>
        <p className="text-gray-400 mb-6">
          Lightweight canvas-based survival runner demo for the landing page.
          AI-controlled showcase that loops every 25 seconds.
        </p>
        
        {/* Demo container */}
        <div className="relative">
          <SurvivalDemo 
            autoPlay={true}
            showHUD={true}
            className="shadow-2xl"
          />
        </div>
        
        {/* Info */}
        <div className="mt-6 bg-black/50 rounded-xl p-4 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-2">Features</h2>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>• AI-controlled runner that dodges obstacles and collects gems</li>
            <li>• Pseudo-3D perspective rendering on 2D canvas</li>
            <li>• 4 obstacle types: barriers, spikes, overhead bars, gaps</li>
            <li>• Collectibles: gems and coins</li>
            <li>• Speed increases over time</li>
            <li>• Combo system for consecutive clears</li>
            <li>• 25-second seamless loop</li>
            <li>• Visibility-based autoplay (pauses when off-screen)</li>
          </ul>
        </div>
        
        {/* Technical details */}
        <div className="mt-4 bg-black/50 rounded-xl p-4 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-2">Technical</h2>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>• Pure Canvas 2D rendering (no Three.js)</li>
            <li>• ~60 FPS target</li>
            <li>• Modular architecture matching the full survival mode</li>
            <li>• Self-contained component for easy integration</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
