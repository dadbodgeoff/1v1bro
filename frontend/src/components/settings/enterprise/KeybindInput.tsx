/**
 * KeybindInput - Keyboard Shortcut Capture
 * 
 * Features:
 * - Click to capture mode
 * - Key name display
 * - Conflict detection
 * - Reset to default
 * 
 * Requirements: 1.3, 7.1, 7.2, 7.3
 */

import React, { useState, useEffect, useRef } from 'react';
import { getKeyDisplayName } from '../../../types/settings';

interface KeybindInputProps {
  id: string;
  action: string;
  currentKey: string;
  defaultKey: string;
  onCapture: (key: string) => void;
  conflictWith?: string;
  className?: string;
}

export const KeybindInput: React.FC<KeybindInputProps> = ({
  id,
  action,
  currentKey,
  defaultKey,
  onCapture,
  conflictWith,
  className = '',
}) => {
  const [capturing, setCapturing] = useState(false);
  const inputRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!capturing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Ignore modifier-only keys
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) {
        return;
      }

      // Escape cancels capture
      if (e.key === 'Escape') {
        setCapturing(false);
        return;
      }

      onCapture(e.code);
      setCapturing(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [capturing, onCapture]);

  const isDefault = currentKey === defaultKey;
  const hasConflict = !!conflictWith;

  return (
    <div className={`py-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 pr-4">
          <label htmlFor={id} className="text-base font-medium text-white">
            {action}
          </label>
          {hasConflict && (
            <p className="text-sm text-amber-400 mt-0.5">
              ⚠️ Conflicts with: {conflictWith}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isDefault && (
            <button
              onClick={() => onCapture(defaultKey)}
              className="text-xs text-[var(--color-text-secondary)] hover:text-white transition-colors px-2 py-1"
            >
              Reset
            </button>
          )}
          <button
            ref={inputRef}
            id={id}
            onClick={() => setCapturing(true)}
            className={`min-w-[100px] px-4 py-2 rounded-lg font-mono text-sm font-medium transition-all ${
              capturing
                ? 'bg-indigo-500/30 border-2 border-indigo-500 text-indigo-300 animate-pulse'
                : hasConflict
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400 hover:border-amber-500'
                : 'bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-white hover:border-indigo-500/50'
            }`}
          >
            {capturing ? 'Press a key...' : getKeyDisplayName(currentKey)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeybindInput;
