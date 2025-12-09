/**
 * MapSelector - Map selection for matchmaking.
 * Requirements: 1.1, 1.2, 1.4
 */

import { motion } from 'framer-motion'
import { AVAILABLE_MAPS, type MapInfo } from '@/game/config/maps/map-loader'

interface MapSelectorProps {
  selectedMap: string
  onSelect: (mapSlug: string) => void
  disabled?: boolean
}

// Theme-based styling
const themeStyles: Record<string, { gradient: string; accent: string }> = {
  space: {
    gradient: 'from-indigo-500/20 to-purple-500/20',
    accent: 'border-indigo-500',
  },
  volcanic: {
    gradient: 'from-orange-500/20 to-red-500/20',
    accent: 'border-orange-500',
  },
}

export function MapSelector({
  selectedMap,
  onSelect,
  disabled = false,
}: MapSelectorProps) {
  return (
    <div className="w-full">
      <h4 className="text-xs font-medium text-neutral-500 mb-2">Select Arena</h4>
      <div className="grid grid-cols-2 gap-2">
        {AVAILABLE_MAPS.map((map: MapInfo) => {
          const isSelected = selectedMap === map.slug
          const theme = themeStyles[map.theme] || themeStyles.space

          return (
            <motion.button
              key={map.slug}
              onClick={() => !disabled && onSelect(map.slug)}
              disabled={disabled}
              whileHover={!disabled ? { scale: 1.02 } : undefined}
              whileTap={!disabled ? { scale: 0.98 } : undefined}
              className={`
                relative p-3 rounded-lg border transition-all duration-200 text-left overflow-hidden
                ${isSelected
                  ? `${theme.accent} bg-gradient-to-br ${theme.gradient}`
                  : 'border-white/[0.08] bg-white/[0.04] hover:border-white/[0.15]'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1.5 right-1.5 w-4 h-4 bg-[var(--color-accent-primary)] rounded-full flex items-center justify-center"
                >
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </motion.div>
              )}

              <div className="flex items-center gap-2">
                {/* Map thumbnail placeholder */}
                <div className={`w-10 h-10 rounded bg-gradient-to-br ${theme.gradient} flex items-center justify-center`}>
                  <span className="text-lg">
                    {map.theme === 'volcanic' ? '🌋' : '🌌'}
                  </span>
                </div>
                <div>
                  <h5 className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-white'}`}>
                    {map.name}
                  </h5>
                  <p className="text-[10px] text-neutral-500 line-clamp-1">
                    {map.description}
                  </p>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

export default MapSelector
