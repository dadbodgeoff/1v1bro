/**
 * ArenaCard - Dashboard card for arena mode selection
 *
 * Displays arena mode options and navigates to the arena page.
 *
 * @module components/dashboard/ArenaCard
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapRegistry } from '@/arena/maps/MapRegistry';
import '@/arena/maps/definitions'; // Register maps
import { useArenaStore } from '@/stores/arenaStore';
import type { BotPersonalityType, DifficultyLevel } from '@/arena/bot/types';
import { getPersonalityDisplayInfo, getDifficultyDisplayInfo } from '@/arena/bot/BotPersonality';

const PERSONALITIES: BotPersonalityType[] = ['rusher', 'sentinel', 'duelist'];
const DIFFICULTIES: DifficultyLevel[] = ['easy', 'medium', 'hard', 'adaptive'];

export function ArenaCard() {
  const navigate = useNavigate();
  const { setMode, setMapId, setBotConfig } = useArenaStore();

  const [showConfig, setShowConfig] = useState(false);
  const [selectedMap, setSelectedMap] = useState<string>('');
  const [selectedPersonality, setSelectedPersonality] = useState<BotPersonalityType>('duelist');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('medium');

  // Get available maps
  const maps = MapRegistry.getInstance().getAll();

  const handlePractice = () => {
    setMode('practice');
    if (selectedMap) setMapId(selectedMap);
    setBotConfig(selectedPersonality, selectedDifficulty);
    navigate('/arena');
  };

  const handlePvP = () => {
    setMode('pvp');
    if (selectedMap) setMapId(selectedMap);
    navigate('/arena');
  };

  return (
    <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-xl p-6 hover:border-red-500/50 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Arena</h3>
          <p className="text-sm text-gray-400">3D FPS Combat</p>
        </div>
      </div>

      <p className="text-gray-300 text-sm mb-4">
        First-person shooter arena with physics, AI bots, and competitive gameplay.
      </p>

      {!showConfig ? (
        <div className="space-y-2">
          <button
            onClick={() => setShowConfig(true)}
            className="w-full px-4 py-2 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-lg transition-colors"
          >
            Practice (vs Bot)
          </button>
          <button
            onClick={handlePvP}
            disabled
            className="w-full px-4 py-2 bg-gray-700 text-gray-400 font-semibold rounded-lg cursor-not-allowed"
          >
            Find Match (Coming Soon)
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Map Selection */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Map</label>
            <select
              value={selectedMap}
              onChange={(e) => setSelectedMap(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-red-500 focus:outline-none"
            >
              <option value="">Random</option>
              {maps.map((map) => (
                <option key={map.id} value={map.id}>
                  {map.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bot Personality */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Bot Personality</label>
            <select
              value={selectedPersonality}
              onChange={(e) => setSelectedPersonality(e.target.value as BotPersonalityType)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-red-500 focus:outline-none"
            >
              {PERSONALITIES.map((p) => (
                <option key={p} value={p}>
                  {getPersonalityDisplayInfo(p).name}
                </option>
              ))}
            </select>
          </div>

          {/* Bot Difficulty */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as DifficultyLevel)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-red-500 focus:outline-none"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {getDifficultyDisplayInfo(d).name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setShowConfig(false)}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={handlePractice}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-lg transition-colors"
            >
              Start
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
