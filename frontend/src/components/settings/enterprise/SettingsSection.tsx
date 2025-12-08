/**
 * SettingsSection - Collapsible Section Container
 * 
 * Features:
 * - Icon and title header
 * - Collapsible content area
 * - Loading and error states
 * - Consistent padding and styling
 * 
 * Requirements: 1.3
 */

import React, { useState } from 'react';

interface SettingsSectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  description?: string;
  defaultExpanded?: boolean;
  loading?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  id,
  icon,
  title,
  description,
  defaultExpanded = true,
  loading = false,
  error,
  children,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <section
      id={id}
      className={`bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border-subtle)] overflow-hidden ${className}`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors"
        aria-expanded={expanded}
        aria-controls={`${id}-content`}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-xl">
            {icon}
          </div>
          <div className="text-left">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            {description && (
              <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-[var(--color-text-secondary)] transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
      <div
        id={`${id}-content`}
        className={`transition-all duration-200 ease-in-out ${
          expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="px-6 pb-6 pt-2">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center justify-between py-3">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-white/10 rounded" />
                    <div className="h-3 w-48 bg-white/5 rounded" />
                  </div>
                  <div className="h-6 w-12 bg-white/10 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border-subtle)]">
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SettingsSection;
