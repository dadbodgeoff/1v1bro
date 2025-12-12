/**
 * SettingsSlider - Range Slider with Value Display
 * 
 * Features:
 * - Min/max range with step
 * - Current value display (percentage or absolute)
 * - Mute button for audio sliders
 * - Reset to default button
 * - Real-time preview
 * 
 * Requirements: 1.3, 5.1
 */

import React from 'react';

interface SettingsSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  defaultValue?: number;
  onChange: (value: number) => void;
  onMute?: () => void;
  muted?: boolean;
  showReset?: boolean;
  className?: string;
}

export const SettingsSlider: React.FC<SettingsSliderProps> = ({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit = '%',
  defaultValue,
  onChange,
  onMute,
  muted = false,
  showReset = false,
  className = '',
}) => {
  const percentage = ((value - min) / (max - min)) * 100;
  const isDefault = defaultValue !== undefined && value === defaultValue;

  return (
    <div className={`py-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <label htmlFor={id} className="text-base font-medium text-white">
          {label}
        </label>
        <div className="flex items-center gap-3">
          {showReset && defaultValue !== undefined && !isDefault && (
            <button
              onClick={() => onChange(defaultValue)}
              className="text-xs text-[var(--color-text-secondary)] hover:text-white transition-colors px-2 py-1 min-h-[32px] touch-manipulation"
            >
              Reset
            </button>
          )}
          <span className={`text-sm font-medium tabular-nums ${muted ? 'text-red-400' : 'text-indigo-400'}`}>
            {muted ? 'Muted' : `${value}${unit}`}
          </span>
          {onMute && (
            <button
              onClick={onMute}
              className={`p-2 rounded-lg transition-colors min-w-[40px] min-h-[40px] touch-manipulation ${
                muted
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10 hover:text-white'
              }`}
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
      <div className="relative">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-3 bg-gray-700 rounded-full appearance-none cursor-pointer touch-manipulation
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-6
            [&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:shadow-lg
            [&::-moz-range-thumb]:cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${muted ? '#ef4444' : '#6366f1'} 0%, ${muted ? '#ef4444' : '#6366f1'} ${percentage}%, #374151 ${percentage}%, #374151 100%)`,
          }}
        />
      </div>
    </div>
  );
};

export default SettingsSlider;
