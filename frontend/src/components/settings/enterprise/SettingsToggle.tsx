/**
 * SettingsToggle - Toggle Switch with Label
 * 
 * Features:
 * - Label and description text
 * - Loading state with spinner
 * - Disabled state styling
 * - Accessible keyboard navigation
 * 
 * Requirements: 1.3, 3.1, 4.1
 */

import React from 'react';

interface SettingsToggleProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const SettingsToggle: React.FC<SettingsToggleProps> = ({
  id,
  label,
  description,
  checked,
  onChange,
  loading = false,
  disabled = false,
  className = '',
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled && !loading) {
        onChange(!checked);
      }
    }
  };

  return (
    <div className={`flex items-center justify-between py-4 ${className}`}>
      <div className="flex-1 pr-4">
        <label
          htmlFor={id}
          className={`text-base font-medium ${
            disabled ? 'text-[var(--color-text-secondary)]' : 'text-white'
          }`}
        >
          {label}
        </label>
        {description && (
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => !disabled && !loading && onChange(!checked)}
        onKeyDown={handleKeyDown}
        disabled={disabled || loading}
        className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-card)] ${
          checked ? 'bg-indigo-600' : 'bg-gray-600'
        } ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 flex items-center justify-center ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        >
          {loading && (
            <svg
              className="w-3 h-3 animate-spin text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
        </div>
      </button>
    </div>
  );
};

export default SettingsToggle;
