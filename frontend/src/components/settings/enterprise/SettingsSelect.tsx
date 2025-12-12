/**
 * SettingsSelect - Dropdown Select with Options
 * 
 * Features:
 * - Options with labels and descriptions
 * - Selected value display
 * - Keyboard navigation
 * - Loading state
 * 
 * Requirements: 1.3, 6.1
 */

import React, { useState, useRef, useEffect } from 'react';

interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SettingsSelectProps {
  id: string;
  label: string;
  description?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const SettingsSelect: React.FC<SettingsSelectProps> = ({
  id,
  label,
  description,
  value,
  options,
  onChange,
  loading = false,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || loading) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          onChange(options[focusedIndex].value);
          setIsOpen(false);
        } else {
          setIsOpen(!isOpen);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex((prev) => Math.min(prev + 1, options.length - 1));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className={`py-4 ${className}`} ref={containerRef}>
      <div className="flex items-center justify-between">
        <div className="flex-1 pr-4">
          <label htmlFor={id} className="text-base font-medium text-white">
            {label}
          </label>
          {description && (
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
              {description}
            </p>
          )}
        </div>
        <div className="relative">
          <button
            id={id}
            type="button"
            onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            disabled={disabled || loading}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className={`flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-lg text-sm font-medium transition-colors min-w-[140px] min-h-[44px] justify-between touch-manipulation ${
              disabled || loading
                ? 'opacity-50 cursor-not-allowed text-[var(--color-text-secondary)]'
                : 'text-white hover:border-indigo-500/50'
            }`}
          >
            <span>{selectedOption?.label || 'Select...'}</span>
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg
                className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>

          {isOpen && (
            <ul
              ref={listRef}
              role="listbox"
              aria-labelledby={id}
              className="absolute right-0 mt-2 w-56 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl z-50 py-1 max-h-60 overflow-auto"
            >
              {options.map((option, index) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={`px-4 py-3 cursor-pointer transition-colors min-h-[44px] ${
                    option.value === value
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : focusedIndex === index
                      ? 'bg-white/5 text-white'
                      : 'text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      {option.description}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsSelect;
